const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(auth);

// POST /api/calculadora/propuestas — Guardar propuesta
router.post('/propuestas', async (req, res) => {
  try {
    const {
      persona_id, deal_id, compania, producto, modalidad,
      zona, provincia, num_asegurados, prima_mensual, prima_anual,
      descuento, descuento_contra, campana_puntos, fecha_efecto,
      forma_pago, asegurados_data, desglose, nota_contenido,
      pipedrive_deal_id
    } = req.body;

    if (!producto) {
      return res.status(400).json({ error: 'Producto es obligatorio' });
    }

    const result = await pool.query(`
      INSERT INTO propuestas (
        persona_id, deal_id, agente_id, compania, producto, modalidad,
        zona, provincia, num_asegurados, prima_mensual, prima_anual,
        descuento, descuento_contra, campana_puntos, fecha_efecto,
        forma_pago, asegurados_data, desglose, nota_contenido,
        pipedrive_deal_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
      RETURNING *
    `, [
      persona_id || null, deal_id || null, req.user.id,
      compania || 'ADESLAS', producto, modalidad || null,
      zona || null, provincia || null, num_asegurados || 1,
      prima_mensual || null, prima_anual || null,
      descuento || 0, descuento_contra || 0, campana_puntos || 0,
      fecha_efecto || null, forma_pago || 'mensual',
      JSON.stringify(asegurados_data || []),
      JSON.stringify(desglose || {}),
      nota_contenido || null, pipedrive_deal_id || null
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error guardando propuesta:', err);
    res.status(500).json({ error: 'Error al guardar propuesta' });
  }
});

// GET /api/calculadora/propuestas/:id — Detalle propuesta
router.get('/propuestas/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.nombre as agente_nombre
      FROM propuestas p
      LEFT JOIN users u ON u.id = p.agente_id
      WHERE p.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Propuesta no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error obteniendo propuesta:', err);
    res.status(500).json({ error: 'Error al obtener propuesta' });
  }
});

// GET /api/calculadora/propuestas/persona/:personaId — Propuestas de una persona
router.get('/propuestas/persona/:personaId', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.nombre as agente_nombre
      FROM propuestas p
      LEFT JOIN users u ON u.id = p.agente_id
      WHERE p.persona_id = $1
      ORDER BY p.created_at DESC
    `, [req.params.personaId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error listando propuestas:', err);
    res.status(500).json({ error: 'Error al listar propuestas' });
  }
});

// GET /api/calculadora/propuestas/deal/:dealId — Propuestas de un deal
router.get('/propuestas/deal/:dealId', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.nombre as agente_nombre
      FROM propuestas p
      LEFT JOIN users u ON u.id = p.agente_id
      WHERE p.deal_id = $1
      ORDER BY p.created_at DESC
    `, [req.params.dealId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error listando propuestas por deal:', err);
    res.status(500).json({ error: 'Error al listar propuestas' });
  }
});

// POST /api/calculadora/propuestas/:id/pipedrive-sync — Sync a Pipedrive
router.post('/propuestas/:id/pipedrive-sync', async (req, res) => {
  try {
    const apiKey = process.env.PIPEDRIVE_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'PIPEDRIVE_API_KEY no configurada' });
    }

    const propuesta = await pool.query('SELECT * FROM propuestas WHERE id = $1', [req.params.id]);
    if (propuesta.rows.length === 0) {
      return res.status(404).json({ error: 'Propuesta no encontrada' });
    }

    const p = propuesta.rows[0];
    if (!p.pipedrive_deal_id) {
      return res.status(400).json({ error: 'No hay deal de Pipedrive vinculado' });
    }

    // Actualizar campos del deal en Pipedrive
    const dealUpdate = req.body.dealUpdate || {};
    if (Object.keys(dealUpdate).length > 0) {
      await fetch(`https://api.pipedrive.com/v1/deals/${p.pipedrive_deal_id}?api_token=${apiKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dealUpdate)
      });
    }

    // Crear nota en el deal
    if (p.nota_contenido) {
      await fetch(`https://api.pipedrive.com/v1/notes?api_token=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deal_id: p.pipedrive_deal_id,
          content: p.nota_contenido,
          pinned_to_deal_flag: 1
        })
      });
    }

    // Marcar como sincronizado
    await pool.query('UPDATE propuestas SET pipedrive_synced = true WHERE id = $1', [p.id]);

    res.json({ ok: true });
  } catch (err) {
    console.error('Error sincronizando propuesta con Pipedrive:', err);
    res.status(500).json({ error: 'Error al sincronizar con Pipedrive' });
  }
});

module.exports = router;
