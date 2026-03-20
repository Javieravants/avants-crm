const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/roles');
const { notifyUser } = require('../utils/notifications');
const { sendPipedriveNote } = require('../utils/pipedrive');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/tickets/kanban — tickets agrupados por estado con counts
router.get('/kanban', async (req, res) => {
  const { agente_id, tipo_id, compania } = req.query;

  try {
    let where = ['1=1'];
    const values = [];
    let idx = 1;

    if (agente_id) { where.push(`t.agente_id = $${idx++}`); values.push(agente_id); }
    if (tipo_id) { where.push(`t.tipo_id = $${idx++}`); values.push(tipo_id); }
    if (compania) { where.push(`t.compania = $${idx++}`); values.push(compania); }

    // Filtro por empresa según rol
    if (req.user.rol === 'agent') {
      // Agentes: solo sus tickets + filtro por empresa
      where.push(`(t.created_by = $${idx} OR t.assigned_to = $${idx})`);
      values.push(req.user.id);
      idx++;
      const userEmpresa = await pool.query('SELECT empresa FROM users WHERE id = $1', [req.user.id]);
      const emp = userEmpresa.rows[0]?.empresa;
      if (emp) { where.push(`t.compania = $${idx++}`); values.push(emp); }
    } else if (req.user.rol === 'supervisor') {
      // Supervisores: solo trámites de su empresa
      const userEmpresa = await pool.query('SELECT empresa FROM users WHERE id = $1', [req.user.id]);
      const emp = userEmpresa.rows[0]?.empresa;
      if (emp) { where.push(`t.compania = $${idx++}`); values.push(emp); }
    }
    // Admin: ve todo, filtra opcionalmente por query param compania

    const result = await pool.query(`
      SELECT t.id, t.tipo_id, t.estado, t.descripcion, t.prioridad, t.urgencia,
        t.compania, t.num_solicitud, t.num_poliza, t.created_at,
        t.contacto_id, t.agente_id, t.assigned_to,
        tt.nombre AS tipo_nombre,
        agent.nombre AS agente_nombre,
        p.nombre AS contacto_nombre, p.telefono AS contacto_telefono,
        EXTRACT(DAY FROM NOW() - t.created_at)::INTEGER AS days_open
      FROM tickets t
      LEFT JOIN ticket_types tt ON t.tipo_id = tt.id
      LEFT JOIN users agent ON t.agente_id = agent.id
      LEFT JOIN personas p ON t.contacto_id = p.id
      WHERE ${where.join(' AND ')}
      ORDER BY t.created_at DESC
    `, values);

    const estados = [
      { estado: 'nuevo', nombre: 'Abierto', color: '#94a3b8' },
      { estado: 'en_gestion', nombre: 'En gestión', color: '#009DDD' },
      { estado: 'esperando', nombre: 'Esperando compañía', color: '#f59e0b' },
      { estado: 'resuelto', nombre: 'Resuelto', color: '#22c55e' },
      { estado: 'cerrado', nombre: 'Cerrado', color: '#6b7280' },
    ];

    const columns = estados.map(col => ({
      ...col,
      tickets: result.rows.filter(t => t.estado === col.estado),
      count: result.rows.filter(t => t.estado === col.estado).length,
    }));

    res.json({ columns });
  } catch (err) {
    console.error('Error obteniendo kanban:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/tickets/columns — columnas visibles para el usuario actual
router.get('/columns', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM ticket_columns WHERE activo = true ORDER BY orden`
    );
    // Filtrar por visibilidad
    const columns = result.rows.filter((col) => {
      const roleMatch = col.visible_roles.includes(req.user.rol);
      const userMatch = col.visible_user_ids.includes(req.user.id);
      return roleMatch || userMatch;
    });
    res.json(columns);
  } catch (err) {
    console.error('Error obteniendo columnas:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/tickets/types — tipos de trámites activos
router.get('/types', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM ticket_types WHERE activo = true ORDER BY orden'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error obteniendo tipos:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/tickets — listar tickets (filtrado por rol y columna)
router.get('/', async (req, res) => {
  const { column_id, estado, tipo_id } = req.query;

  try {
    let where = ['1=1'];
    const values = [];
    let idx = 1;

    // Filtro por columna
    if (column_id) {
      where.push(`t.column_id = $${idx++}`);
      values.push(column_id);
    }

    // Filtro por estado
    if (estado) {
      where.push(`t.estado = $${idx++}`);
      values.push(estado);
    }

    // Filtro por tipo
    if (tipo_id) {
      where.push(`t.tipo_id = $${idx++}`);
      values.push(tipo_id);
    }

    // Filtro por empresa según rol
    if (req.user.rol === 'agent') {
      where.push(`(t.created_by = $${idx} OR t.assigned_to = $${idx})`);
      values.push(req.user.id);
      idx++;
      const userEmpresa = await pool.query('SELECT empresa FROM users WHERE id = $1', [req.user.id]);
      const emp = userEmpresa.rows[0]?.empresa;
      if (emp) { where.push(`t.compania = $${idx++}`); values.push(emp); }
    } else if (req.user.rol === 'supervisor') {
      const userEmpresa = await pool.query('SELECT empresa FROM users WHERE id = $1', [req.user.id]);
      const emp = userEmpresa.rows[0]?.empresa;
      if (emp) { where.push(`t.compania = $${idx++}`); values.push(emp); }
    }

    const result = await pool.query(`
      SELECT t.*,
        tt.nombre AS tipo_nombre,
        tc.nombre AS column_nombre,
        creator.nombre AS created_by_nombre,
        assignee.nombre AS assigned_to_nombre,
        agent.nombre AS agente_nombre
      FROM tickets t
      LEFT JOIN ticket_types tt ON t.tipo_id = tt.id
      LEFT JOIN ticket_columns tc ON t.column_id = tc.id
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      LEFT JOIN users agent ON t.agente_id = agent.id
      WHERE ${where.join(' AND ')}
      ORDER BY t.created_at DESC
    `, values);

    res.json(result.rows);
  } catch (err) {
    console.error('Error listando tickets:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/tickets/:id — detalle de ticket con comentarios
router.get('/:id', async (req, res) => {
  try {
    const ticket = await pool.query(`
      SELECT t.*,
        tt.nombre AS tipo_nombre,
        tc.nombre AS column_nombre,
        creator.nombre AS created_by_nombre,
        assignee.nombre AS assigned_to_nombre,
        agent.nombre AS agente_nombre
      FROM tickets t
      LEFT JOIN ticket_types tt ON t.tipo_id = tt.id
      LEFT JOIN ticket_columns tc ON t.column_id = tc.id
      LEFT JOIN users creator ON t.created_by = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      LEFT JOIN users agent ON t.agente_id = agent.id
      WHERE t.id = $1
    `, [req.params.id]);

    if (ticket.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    // Verificar permisos por rol y empresa
    const t = ticket.rows[0];
    if (req.user.rol === 'agent' && t.created_by !== req.user.id && t.assigned_to !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para ver este ticket' });
    }
    if (req.user.rol === 'supervisor' || req.user.rol === 'agent') {
      const userEmpresa = await pool.query('SELECT empresa FROM users WHERE id = $1', [req.user.id]);
      const emp = userEmpresa.rows[0]?.empresa;
      if (emp && t.compania && t.compania !== emp) {
        return res.status(403).json({ error: 'No tienes permiso para ver este ticket' });
      }
    }

    // Comentarios
    const comments = await pool.query(`
      SELECT c.*, u.nombre AS user_nombre, u.rol AS user_rol
      FROM ticket_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.ticket_id = $1
      ORDER BY c.created_at ASC
    `, [req.params.id]);

    res.json({ ...t, comments: comments.rows });
  } catch (err) {
    console.error('Error obteniendo ticket:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/tickets — crear ticket
router.post('/', async (req, res) => {
  const { tipo_id, column_id, descripcion, pipedrive_deal_id, prioridad, assigned_to } = req.body;

  if (!tipo_id || !column_id || !descripcion) {
    return res.status(400).json({ error: 'Tipo, columna y descripción son obligatorios' });
  }

  try {
    // Auto-asignar empresa según el usuario que crea el trámite
    const userRow = await pool.query('SELECT empresa FROM users WHERE id = $1', [req.user.id]);
    const empresa = userRow.rows[0]?.empresa || null;

    const result = await pool.query(`
      INSERT INTO tickets (tipo_id, column_id, descripcion, pipedrive_deal_id, prioridad,
        created_by, agente_id, assigned_to, estado, compania)
      VALUES ($1, $2, $3, $4, $5, $6, $6, $7, 'nuevo', $8)
      RETURNING *
    `, [tipo_id, column_id, descripcion, pipedrive_deal_id || null, prioridad || 'normal',
        req.user.id, assigned_to || null, empresa]);

    // Log de actividad
    await pool.query(
      'INSERT INTO activity_logs (user_id, accion, detalle) VALUES ($1, $2, $3)',
      [req.user.id, 'ticket_created', `Ticket #${result.rows[0].id} creado`]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creando ticket:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PATCH /api/tickets/:id — actualizar ticket
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { estado, assigned_to, column_id, prioridad, descripcion, pipedrive_deal_id, compania, num_solicitud, num_poliza, urgencia, contacto_id } = req.body;

  try {
    // Verificar que existe
    const existing = await pool.query('SELECT * FROM tickets WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }
    const oldTicket = existing.rows[0];

    const fields = [];
    const values = [];
    let idx = 1;

    if (estado !== undefined) {
      fields.push(`estado = $${idx++}`); values.push(estado);
      if (estado === 'resuelto') {
        fields.push(`resolved_at = CURRENT_TIMESTAMP`);
      }
    }
    if (assigned_to !== undefined) { fields.push(`assigned_to = $${idx++}`); values.push(assigned_to); }
    if (column_id !== undefined) { fields.push(`column_id = $${idx++}`); values.push(column_id); }
    if (prioridad !== undefined) { fields.push(`prioridad = $${idx++}`); values.push(prioridad); }
    if (descripcion !== undefined) { fields.push(`descripcion = $${idx++}`); values.push(descripcion); }
    if (pipedrive_deal_id !== undefined) { fields.push(`pipedrive_deal_id = $${idx++}`); values.push(pipedrive_deal_id); }
    if (compania !== undefined) { fields.push(`compania = $${idx++}`); values.push(compania); }
    if (num_solicitud !== undefined) { fields.push(`num_solicitud = $${idx++}`); values.push(num_solicitud); }
    if (num_poliza !== undefined) { fields.push(`num_poliza = $${idx++}`); values.push(num_poliza); }
    if (urgencia !== undefined) { fields.push(`urgencia = $${idx++}`); values.push(urgencia); }
    if (contacto_id !== undefined) { fields.push(`contacto_id = $${idx++}`); values.push(contacto_id); }

    fields.push('updated_at = CURRENT_TIMESTAMP');

    if (fields.length === 1) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE tickets SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    const updated = result.rows[0];

    // Notificaciones al cambiar estado
    if (estado && estado !== oldTicket.estado) {
      // Notificar al creador del ticket
      if (oldTicket.created_by && oldTicket.created_by !== req.user.id) {
        await notifyUser(oldTicket.created_by, updated.id,
          `Tu ticket #${id} cambió a "${estado}" por ${req.user.nombre}`);
      }
      // Notificar al asignado
      if (updated.assigned_to && updated.assigned_to !== req.user.id && updated.assigned_to !== oldTicket.created_by) {
        await notifyUser(updated.assigned_to, updated.id,
          `Ticket #${id} asignado a ti cambió a "${estado}"`);
      }
    }

    // Notificar al ser asignado
    if (assigned_to && assigned_to !== oldTicket.assigned_to) {
      await notifyUser(assigned_to, updated.id,
        `Te han asignado el ticket #${id}`);
    }

    // Pipedrive: nota al resolver
    if (estado === 'resuelto' && updated.pipedrive_deal_id && !updated.pipedrive_note_sent) {
      await sendPipedriveNote(updated);
      await pool.query('UPDATE tickets SET pipedrive_note_sent = true WHERE id = $1', [id]);
    }

    // Log
    await pool.query(
      'INSERT INTO activity_logs (user_id, accion, detalle) VALUES ($1, $2, $3)',
      [req.user.id, 'ticket_updated', `Ticket #${id} actualizado`]
    );

    res.json(updated);
  } catch (err) {
    console.error('Error actualizando ticket:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/tickets/:id/comments — añadir comentario
router.post('/:id/comments', async (req, res) => {
  const { id } = req.params;
  const { mensaje } = req.body;

  if (!mensaje) {
    return res.status(400).json({ error: 'El mensaje es obligatorio' });
  }

  try {
    // Verificar que existe el ticket
    const ticket = await pool.query('SELECT * FROM tickets WHERE id = $1', [id]);
    if (ticket.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    const result = await pool.query(`
      INSERT INTO ticket_comments (ticket_id, user_id, mensaje)
      VALUES ($1, $2, $3) RETURNING *
    `, [id, req.user.id, mensaje]);

    const comment = result.rows[0];
    comment.user_nombre = req.user.nombre;
    comment.user_rol = req.user.rol;

    // Notificar al creador y al asignado (si no son el autor del comentario)
    const t = ticket.rows[0];
    const notifyTargets = new Set();
    if (t.created_by && t.created_by !== req.user.id) notifyTargets.add(t.created_by);
    if (t.assigned_to && t.assigned_to !== req.user.id) notifyTargets.add(t.assigned_to);

    for (const userId of notifyTargets) {
      await notifyUser(userId, t.id,
        `${req.user.nombre} comentó en ticket #${id}`);
    }

    res.status(201).json(comment);
  } catch (err) {
    console.error('Error creando comentario:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PATCH /api/tickets/:id/move — cambiar estado (drag & drop kanban)
router.patch('/:id/move', async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  const validEstados = ['nuevo', 'en_gestion', 'esperando', 'resuelto', 'cerrado'];
  if (!estado || !validEstados.includes(estado)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  try {
    const existing = await pool.query('SELECT * FROM tickets WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }
    const oldTicket = existing.rows[0];

    const fields = ['estado = $1', 'updated_at = CURRENT_TIMESTAMP'];
    const values = [estado];
    if (estado === 'resuelto') {
      fields.push('resolved_at = CURRENT_TIMESTAMP');
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE tickets SET ${fields.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );
    const updated = result.rows[0];

    // Notificaciones
    if (estado !== oldTicket.estado) {
      if (oldTicket.created_by && oldTicket.created_by !== req.user.id) {
        await notifyUser(oldTicket.created_by, updated.id,
          `Tu ticket #${id} cambió a "${estado}" por ${req.user.nombre}`);
      }
      if (updated.assigned_to && updated.assigned_to !== req.user.id && updated.assigned_to !== oldTicket.created_by) {
        await notifyUser(updated.assigned_to, updated.id,
          `Ticket #${id} asignado a ti cambió a "${estado}"`);
      }
    }

    // Pipedrive: nota al resolver
    if (estado === 'resuelto' && updated.pipedrive_deal_id && !updated.pipedrive_note_sent) {
      await sendPipedriveNote(updated);
      await pool.query('UPDATE tickets SET pipedrive_note_sent = true WHERE id = $1', [id]);
    }

    // Comunicación de sistema automática
    await pool.query(`
      INSERT INTO tramite_comunicaciones (ticket_id, tipo, direccion, mensaje, agente_id)
      VALUES ($1, 'sistema', 'salida', $2, $3)
    `, [id, `Estado cambiado de "${oldTicket.estado}" a "${estado}"`, req.user.id]);

    // Log
    await pool.query(
      'INSERT INTO activity_logs (user_id, accion, detalle) VALUES ($1, $2, $3)',
      [req.user.id, 'ticket_moved', `Ticket #${id} movido a ${estado}`]
    );

    res.json(updated);
  } catch (err) {
    console.error('Error moviendo ticket:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/tickets/:id/comunicaciones — historial de comunicaciones
router.get('/:id/comunicaciones', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, u.nombre AS agente_nombre, u.rol AS agente_rol
      FROM tramite_comunicaciones c
      LEFT JOIN users u ON c.agente_id = u.id
      WHERE c.ticket_id = $1
      ORDER BY c.created_at ASC
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error obteniendo comunicaciones:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/tickets/:id/comunicaciones — añadir comunicación
router.post('/:id/comunicaciones', async (req, res) => {
  const { id } = req.params;
  const { tipo, direccion, destinatario, asunto, mensaje } = req.body;

  if (!tipo || !mensaje) {
    return res.status(400).json({ error: 'Tipo y mensaje son obligatorios' });
  }

  // Solo admin/supervisor pueden enviar emails y whatsapp
  if ((tipo === 'email' || tipo === 'whatsapp') && req.user.rol === 'agent') {
    return res.status(403).json({ error: 'No tienes permiso para enviar este tipo de comunicación' });
  }

  try {
    const ticket = await pool.query('SELECT * FROM tickets WHERE id = $1', [id]);
    if (ticket.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    const result = await pool.query(`
      INSERT INTO tramite_comunicaciones (ticket_id, tipo, direccion, destinatario, asunto, mensaje, agente_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `, [id, tipo, direccion || 'salida', destinatario || null, asunto || null, mensaje, req.user.id]);

    const comm = result.rows[0];
    comm.agente_nombre = req.user.nombre;
    comm.agente_rol = req.user.rol;

    res.status(201).json(comm);
  } catch (err) {
    console.error('Error creando comunicación:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
