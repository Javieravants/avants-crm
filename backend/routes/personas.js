const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');

const router = express.Router();
router.use(authMiddleware);
router.use(tenantMiddleware);

// Normalizar teléfono español a +34XXXXXXXXX (no toca extranjeros)
function formatTelefono(tel) {
  if (!tel) return null;
  const digits = tel.replace(/\D/g, '');
  if (digits.length === 9 && /^[6789]/.test(digits)) return '+34' + digits;
  if (digits.length === 11 && digits.startsWith('34') && /^[6789]/.test(digits.slice(2))) return '+' + digits;
  return tel; // extranjero o desconocido → sin cambios
}

// GET /api/personas — listar con búsqueda y filtros
router.get('/', async (req, res) => {
  const { q, compania, producto, estado_poliza, agente_id, page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let where = [`p.tenant_id = $1`];
    const values = [req.tenantId];
    let idx = 2;

    // Búsqueda general (nombre, DNI, teléfono normalizado, email, nº póliza)
    if (q) {
      const qDigits = q.replace(/\D/g, '');
      const isPhone = qDigits.length >= 6;
      if (isPhone) {
        // Búsqueda por teléfono normalizada (últimos 9 dígitos)
        where.push(`(
          p.nombre ILIKE $${idx} OR
          p.dni ILIKE $${idx} OR
          p.email ILIKE $${idx} OR
          RIGHT(regexp_replace(COALESCE(p.telefono,''), '[^0-9]', '', 'g'), 9) = $${idx + 1} OR
          EXISTS (SELECT 1 FROM deals d2 WHERE d2.persona_id = p.id AND d2.poliza ILIKE $${idx})
        )`);
        values.push(`%${q}%`);
        idx++;
        values.push(qDigits.slice(-9));
        idx++;
      } else {
        where.push(`(
          p.nombre ILIKE $${idx} OR
          p.dni ILIKE $${idx} OR
          p.telefono ILIKE $${idx} OR
          p.email ILIKE $${idx} OR
          EXISTS (SELECT 1 FROM deals d2 WHERE d2.persona_id = p.id AND d2.poliza ILIKE $${idx})
        )`);
        values.push(`%${q}%`);
        idx++;
      }
    }

    // Filtros por datos de deals/pólizas
    if (compania) {
      where.push(`EXISTS (SELECT 1 FROM deals d3 WHERE d3.persona_id = p.id AND d3.datos_extra->>'etiqueta' ILIKE $${idx})`);
      values.push(`%${compania}%`);
      idx++;
    }
    if (producto) {
      where.push(`EXISTS (SELECT 1 FROM deals d4 WHERE d4.persona_id = p.id AND d4.producto ILIKE $${idx})`);
      values.push(`%${producto}%`);
      idx++;
    }
    if (estado_poliza) {
      where.push(`EXISTS (SELECT 1 FROM deals d5 WHERE d5.persona_id = p.id AND d5.estado = $${idx})`);
      values.push(estado_poliza);
      idx++;
    }
    if (agente_id) {
      where.push(`EXISTS (SELECT 1 FROM deals d6 WHERE d6.persona_id = p.id AND d6.agente_id = $${idx})`);
      values.push(parseInt(agente_id));
      idx++;
    }
    if (req.query.etiqueta_id) {
      where.push(`EXISTS (SELECT 1 FROM persona_etiquetas pe WHERE pe.persona_id = p.id AND pe.etiqueta_id = $${idx})`);
      values.push(parseInt(req.query.etiqueta_id));
      idx++;
    }

    // Contar total
    const countResult = await pool.query(
      `SELECT COUNT(*) AS total FROM personas p WHERE ${where.join(' AND ')}`,
      values
    );
    const total = parseInt(countResult.rows[0].total);

    // Traer personas con conteo de deals
    values.push(parseInt(limit));
    values.push(offset);
    const result = await pool.query(`
      SELECT p.*,
        (SELECT COUNT(*) FROM deals d WHERE d.persona_id = p.id) AS total_deals,
        (SELECT COUNT(*) FROM deals d WHERE d.persona_id = p.id AND d.estado = 'poliza_activa') AS polizas_activas,
        (SELECT COUNT(*) FROM deals d WHERE d.persona_id = p.id AND d.estado = 'en_tramite') AS deals_abiertos
      FROM personas p
      WHERE ${where.join(' AND ')}
      ORDER BY p.updated_at DESC NULLS LAST, p.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `, values);

    res.json({
      personas: result.rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('Error listando personas:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/personas/:id — ficha completa
router.get('/:id', async (req, res) => {
  try {
    // Persona
    const personaResult = await pool.query('SELECT * FROM personas WHERE id = $1', [req.params.id]);
    if (personaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Persona no encontrada' });
    }
    const persona = personaResult.rows[0];

    // Deals / Pólizas
    const dealsResult = await pool.query(`
      SELECT d.*, u.nombre AS agente_nombre, pl.name AS pipeline_nombre,
             ps.name AS etapa_nombre
      FROM deals d
      LEFT JOIN users u ON d.agente_id = u.id
      LEFT JOIN pipelines pl ON d.pipeline_id = pl.id
      LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id
      WHERE d.persona_id = $1
      ORDER BY d.created_at DESC
    `, [req.params.id]);

    // Tickets/Trámites vinculados (por pipedrive_deal_id O contacto_id)
    const dealIds = dealsResult.rows
      .filter(d => d.pipedrive_id)
      .map(d => String(d.pipedrive_id));
    const localDealIds = dealsResult.rows.map(d => String(d.id));
    const allDealIds = [...new Set([...dealIds, ...localDealIds])];
    let tickets = [];
    const ticketsResult = await pool.query(`
      SELECT t.*, tt.nombre AS tipo_nombre
      FROM tickets t
      LEFT JOIN ticket_types tt ON t.tipo_id = tt.id
      WHERE t.contacto_id = $1
         OR (t.pipedrive_deal_id = ANY($2))
      ORDER BY t.created_at DESC
    `, [req.params.id, allDealIds.length > 0 ? allDealIds : ['__none__']]);
    tickets = ticketsResult.rows;

    // Familiares
    const familiaresResult = await pool.query(
      'SELECT * FROM familiares WHERE persona_id = $1 ORDER BY created_at',
      [req.params.id]
    );

    // Notas
    const notasResult = await pool.query(`
      SELECT n.*, u.nombre AS user_nombre
      FROM persona_notas n
      LEFT JOIN users u ON n.user_id = u.id
      WHERE n.persona_id = $1
      ORDER BY n.created_at DESC
    `, [req.params.id]);

    // Etiquetas
    let etiquetas = [];
    try {
      const etqResult = await pool.query(
        `SELECT e.* FROM etiquetas e
         JOIN persona_etiquetas pe ON pe.etiqueta_id = e.id
         WHERE pe.persona_id = $1 ORDER BY e.nombre`,
        [req.params.id]
      );
      etiquetas = etqResult.rows;
    } catch {}

    res.json({
      ...persona,
      deals: dealsResult.rows,
      tickets,
      familiares: familiaresResult.rows,
      notas: notasResult.rows,
      etiquetas,
    });
  } catch (err) {
    console.error('Error obteniendo persona:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/personas — crear persona
router.post('/', async (req, res) => {
  const { nombre, dni, telefono, email, fecha_nacimiento, direccion, nacionalidad } = req.body;
  if (!nombre) {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }

  try {
    // Verificar DNI duplicado
    if (dni) {
      const existing = await pool.query('SELECT id FROM personas WHERE dni = $1', [dni.toUpperCase()]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Ya existe una persona con ese DNI', persona_id: existing.rows[0].id });
      }
    }

    const result = await pool.query(
      `INSERT INTO personas (nombre, dni, telefono, email, fecha_nacimiento, direccion, nacionalidad)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [nombre, dni ? dni.toUpperCase() : null, formatTelefono(telefono), email, fecha_nacimiento || null, direccion, nacionalidad]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creando persona:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PATCH /api/personas/:id — actualizar persona
router.patch('/:id', async (req, res) => {
  const { nombre, dni, telefono, email, fecha_nacimiento, direccion, nacionalidad, sexo, provincia, localidad, codigo_postal } = req.body;

  try {
    const fields = [];
    const values = [];
    let idx = 1;

    if (nombre !== undefined) { fields.push(`nombre = $${idx++}`); values.push(nombre); }
    if (dni !== undefined) { fields.push(`dni = $${idx++}`); values.push(dni ? dni.toUpperCase() : null); }
    if (telefono !== undefined) { fields.push(`telefono = $${idx++}`); values.push(formatTelefono(telefono)); }
    if (email !== undefined) { fields.push(`email = $${idx++}`); values.push(email); }
    if (fecha_nacimiento !== undefined) { fields.push(`fecha_nacimiento = $${idx++}`); values.push(fecha_nacimiento || null); }
    if (direccion !== undefined) { fields.push(`direccion = $${idx++}`); values.push(direccion); }
    if (nacionalidad !== undefined) { fields.push(`nacionalidad = $${idx++}`); values.push(nacionalidad); }
    if (sexo !== undefined) { fields.push(`sexo = $${idx++}`); values.push(sexo); }
    if (provincia !== undefined) { fields.push(`provincia = $${idx++}`); values.push(provincia); }
    if (localidad !== undefined) { fields.push(`localidad = $${idx++}`); values.push(localidad); }
    if (codigo_postal !== undefined) { fields.push(`codigo_postal = $${idx++}`); values.push(codigo_postal); }

    if (fields.length === 0) return res.status(400).json({ error: 'Nada que actualizar' });

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.id);

    const result = await pool.query(
      `UPDATE personas SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Persona no encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'DNI ya registrado' });
    console.error('Error actualizando persona:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/personas/:id/familiares — añadir familiar
router.post('/:id/familiares', async (req, res) => {
  const { nombre, dni, fecha_nacimiento, parentesco, telefono, email } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre del familiar es obligatorio' });

  try {
    const result = await pool.query(
      `INSERT INTO familiares (persona_id, nombre, dni, fecha_nacimiento, parentesco, telefono, email)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.params.id, nombre, dni, fecha_nacimiento || null, parentesco, telefono, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error añadiendo familiar:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/personas/:id/familiares/:fid
router.delete('/:id/familiares/:fid', async (req, res) => {
  try {
    await pool.query('DELETE FROM familiares WHERE id = $1 AND persona_id = $2', [req.params.fid, req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/personas/:id/notas — añadir nota
router.post('/:id/notas', async (req, res) => {
  const { texto } = req.body;
  if (!texto) return res.status(400).json({ error: 'El texto es obligatorio' });

  try {
    const result = await pool.query(
      `INSERT INTO persona_notas (persona_id, user_id, texto) VALUES ($1, $2, $3) RETURNING *`,
      [req.params.id, req.user.id, texto]
    );
    const nota = result.rows[0];
    nota.user_nombre = req.user.nombre;
    res.status(201).json(nota);
  } catch (err) {
    console.error('Error añadiendo nota:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
