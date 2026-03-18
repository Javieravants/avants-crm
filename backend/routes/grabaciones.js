const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

router.use(auth);

// POST /api/grabaciones/polizas — Crear póliza desde grabación
router.post('/polizas', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      persona_id, deal_id, compania, producto, tipo_producto,
      n_solicitud, n_poliza, n_grabacion, fecha_grabacion, fecha_efecto,
      forma_pago, descuento, descuento_contra, prima_mensual, prima_anual,
      beneficio_base, n_asegurados, campana, campana_puntos, dental, carencias,
      datos_titular, asegurados_data, cuestionario_salud, datos_mascota,
      script_grabacion, nota_estructurada, comentarios,
      pipedrive_deal_id
    } = req.body;

    if (!producto) {
      return res.status(400).json({ error: 'Producto es obligatorio' });
    }
    if (!persona_id) {
      return res.status(400).json({ error: 'persona_id es obligatorio' });
    }

    // 1. Crear póliza
    const result = await client.query(`
      INSERT INTO polizas (
        persona_id, deal_id, agente_id, compania, producto, tipo_producto,
        n_solicitud, n_poliza, n_grabacion, fecha_grabacion, fecha_efecto,
        forma_pago, descuento, descuento_contra, prima_mensual, prima_anual,
        beneficio_base, n_asegurados, campana, campana_puntos, dental, carencias,
        datos_titular, asegurados_data, cuestionario_salud, datos_mascota,
        script_grabacion, nota_estructurada, comentarios,
        pipedrive_deal_id, estado
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,'grabado')
      RETURNING *
    `, [
      persona_id, deal_id || null, req.user.id,
      compania || 'ADESLAS', producto, tipo_producto || 'SALUD',
      n_solicitud || null, n_poliza || null, n_grabacion || null,
      fecha_grabacion || new Date(), fecha_efecto || null,
      forma_pago || 'MENSUAL', descuento || 0, descuento_contra || 0,
      prima_mensual || null, prima_anual || null,
      beneficio_base || null, n_asegurados || 1,
      campana || null, campana_puntos || 0, dental || null, carencias || null,
      JSON.stringify(datos_titular || {}),
      JSON.stringify(asegurados_data || []),
      JSON.stringify(cuestionario_salud || {}),
      JSON.stringify(datos_mascota || {}),
      script_grabacion || null, nota_estructurada || null, comentarios || null,
      pipedrive_deal_id || null
    ]);

    const poliza = result.rows[0];

    // 2. Actualizar deal: marcar como grabado
    if (deal_id) {
      await client.query(`
        UPDATE deals SET estado_grabacion = 'grabado', updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [deal_id]);
    }

    // 3. Crear nota automática en persona
    await client.query(`
      INSERT INTO persona_notas (persona_id, user_id, texto)
      VALUES ($1, $2, $3)
    `, [
      persona_id, req.user.id,
      `Póliza ${producto} grabada — ${compania} — Prima: ${prima_mensual || '?'}€/mes — Agente: ${req.user.nombre}`
    ]);

    // 4. Notificar a Laura y Javier (buscar por nombre)
    const supervisores = await client.query(`
      SELECT id FROM users WHERE nombre ILIKE '%laura%' OR nombre ILIKE '%javier%' OR rol = 'admin'
    `);
    for (const sup of supervisores.rows) {
      await client.query(`
        INSERT INTO notifications (user_id, mensaje, leida)
        VALUES ($1, $2, false)
      `, [
        sup.id,
        `Nueva grabación: ${producto} — ${datos_titular?.nombre || ''} ${datos_titular?.apellidos || ''} — por ${req.user.nombre}`
      ]);
    }

    await client.query('COMMIT');

    // 5. Sync a Pipedrive (async, no bloquea respuesta)
    if (pipedrive_deal_id && process.env.PIPEDRIVE_API_KEY) {
      syncPolizaPipedrive(poliza, req.body).catch(err => {
        console.error('Error sync Pipedrive (async):', err.message);
      });
    }

    res.status(201).json(poliza);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creando póliza:', err);
    res.status(500).json({ error: 'Error al crear póliza' });
  } finally {
    client.release();
  }
});

// GET /api/grabaciones/polizas/persona/:personaId — Pólizas de una persona
router.get('/polizas/persona/:personaId', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.nombre as agente_nombre
      FROM polizas p
      LEFT JOIN users u ON u.id = p.agente_id
      WHERE p.persona_id = $1
      ORDER BY p.created_at DESC
    `, [req.params.personaId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error listando pólizas:', err);
    res.status(500).json({ error: 'Error al listar pólizas' });
  }
});

// GET /api/grabaciones/polizas/:id — Detalle póliza
router.get('/polizas/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.nombre as agente_nombre,
             pe.nombre as persona_nombre, pe.dni as persona_dni
      FROM polizas p
      LEFT JOIN users u ON u.id = p.agente_id
      LEFT JOIN personas pe ON pe.id = p.persona_id
      WHERE p.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Póliza no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error obteniendo póliza:', err);
    res.status(500).json({ error: 'Error al obtener póliza' });
  }
});

// PATCH /api/grabaciones/polizas/:id — Actualizar póliza
router.patch('/polizas/:id', async (req, res) => {
  try {
    const fields = [];
    const values = [];
    let idx = 1;

    const allowed = [
      'n_solicitud', 'n_poliza', 'n_grabacion', 'fecha_efecto',
      'prima_mensual', 'prima_anual', 'estado', 'comentarios',
      'enviada_ccpp', 'carencias'
    ];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = $${idx}`);
        values.push(req.body[key]);
        idx++;
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(req.params.id);

    const result = await pool.query(`
      UPDATE polizas SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Póliza no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error actualizando póliza:', err);
    res.status(500).json({ error: 'Error al actualizar póliza' });
  }
});

// PATCH /api/grabaciones/polizas/:id/estado — Cambiar estado
router.patch('/polizas/:id/estado', async (req, res) => {
  try {
    const { estado } = req.body;
    const valid = ['grabado', 'solicitud_enviada', 'aceptado', 'poliza_emitida', 'rechazado', 'baja', 'impago'];
    if (!valid.includes(estado)) {
      return res.status(400).json({ error: `Estado inválido. Válidos: ${valid.join(', ')}` });
    }

    const result = await pool.query(`
      UPDATE polizas SET estado = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 RETURNING *
    `, [estado, req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Póliza no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error cambiando estado:', err);
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
});

// GET /api/grabaciones/pendientes — Pólizas pendientes (burbuja header)
router.get('/pendientes', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as count FROM polizas WHERE estado = 'grabado'
    `);
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    res.json({ count: 0 });
  }
});

// GET /api/grabaciones/polizas — Listar todas con filtros
router.get('/polizas', async (req, res) => {
  try {
    const { estado, agente_id, compania, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = ['1=1'];
    const values = [];
    let idx = 1;

    if (estado) { where.push(`p.estado = $${idx}`); values.push(estado); idx++; }
    if (agente_id) { where.push(`p.agente_id = $${idx}`); values.push(parseInt(agente_id)); idx++; }
    if (compania) { where.push(`p.compania ILIKE $${idx}`); values.push(`%${compania}%`); idx++; }

    // Agentes solo ven sus pólizas
    if (req.user.rol === 'agent') {
      where.push(`p.agente_id = $${idx}`);
      values.push(req.user.id);
      idx++;
    }

    values.push(parseInt(limit), offset);

    const result = await pool.query(`
      SELECT p.*, u.nombre as agente_nombre,
             pe.nombre as persona_nombre, pe.dni as persona_dni
      FROM polizas p
      LEFT JOIN users u ON u.id = p.agente_id
      LEFT JOIN personas pe ON pe.id = p.persona_id
      WHERE ${where.join(' AND ')}
      ORDER BY p.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `, values);

    const countResult = await pool.query(`
      SELECT COUNT(*) FROM polizas p WHERE ${where.join(' AND ')}
    `, values.slice(0, -2));

    res.json({
      polizas: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (err) {
    console.error('Error listando pólizas:', err);
    res.status(500).json({ error: 'Error al listar pólizas' });
  }
});

// === SYNC PIPEDRIVE (helper) ===
async function syncPolizaPipedrive(poliza, bodyData) {
  const apiKey = process.env.PIPEDRIVE_API_KEY;
  if (!apiKey || !poliza.pipedrive_deal_id) return;

  try {
    // Marcar deal como won en Pipedrive
    await fetch(`https://api.pipedrive.com/v1/deals/${poliza.pipedrive_deal_id}?api_token=${apiKey}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'won',
        won_time: new Date().toISOString()
      })
    });

    // Crear nota estructurada
    if (poliza.nota_estructurada) {
      await fetch(`https://api.pipedrive.com/v1/notes?api_token=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deal_id: poliza.pipedrive_deal_id,
          content: poliza.nota_estructurada,
          pinned_to_deal_flag: 1
        })
      });
    }

    // Marcar como sincronizado en BD
    await pool.query('UPDATE polizas SET pipedrive_synced = true WHERE id = $1', [poliza.id]);
  } catch (err) {
    console.error('Error sync Pipedrive poliza:', err.message);
  }
}

module.exports = router;
