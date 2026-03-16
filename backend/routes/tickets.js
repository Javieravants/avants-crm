const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/roles');
const { notifyUser } = require('../utils/notifications');
const { sendPipedriveNote } = require('../utils/pipedrive');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

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

    // Agentes solo ven sus propios tickets
    if (req.user.rol === 'agent') {
      where.push(`(t.created_by = $${idx} OR t.assigned_to = $${idx})`);
      values.push(req.user.id);
      idx++;
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

    // Agente solo ve sus propios tickets
    const t = ticket.rows[0];
    if (req.user.rol === 'agent' && t.created_by !== req.user.id && t.assigned_to !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para ver este ticket' });
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
    const result = await pool.query(`
      INSERT INTO tickets (tipo_id, column_id, descripcion, pipedrive_deal_id, prioridad,
        created_by, agente_id, assigned_to, estado)
      VALUES ($1, $2, $3, $4, $5, $6, $6, $7, 'nuevo')
      RETURNING *
    `, [tipo_id, column_id, descripcion, pipedrive_deal_id || null, prioridad || 'normal',
        req.user.id, assigned_to || null]);

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
  const { estado, assigned_to, column_id, prioridad, descripcion, pipedrive_deal_id } = req.body;

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

module.exports = router;
