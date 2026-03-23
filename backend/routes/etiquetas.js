const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/etiquetas — listar todas
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM etiquetas ORDER BY nombre');
    res.json(rows);
  } catch (err) {
    console.error('Error listando etiquetas:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/etiquetas — crear etiqueta
router.post('/', async (req, res) => {
  const { nombre, color } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre obligatorio' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO etiquetas (nombre, color, origen) VALUES ($1, $2, 'manual')
       ON CONFLICT (tenant_id, nombre) DO UPDATE SET color = COALESCE($2, etiquetas.color)
       RETURNING *`,
      [nombre.trim(), color || '#009DDD']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creando etiqueta:', err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/etiquetas/:id
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM deal_etiquetas WHERE etiqueta_id = $1', [req.params.id]);
    await pool.query('DELETE FROM persona_etiquetas WHERE etiqueta_id = $1', [req.params.id]);
    await pool.query('DELETE FROM etiquetas WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/etiquetas/persona/:id — etiquetas de una persona
router.get('/persona/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT e.* FROM etiquetas e
       JOIN persona_etiquetas pe ON pe.etiqueta_id = e.id
       WHERE pe.persona_id = $1
       ORDER BY e.nombre`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/etiquetas/persona/:id — asignar etiqueta a persona
router.post('/persona/:id', async (req, res) => {
  const { etiqueta_id } = req.body;
  if (!etiqueta_id) return res.status(400).json({ error: 'etiqueta_id obligatorio' });

  try {
    await pool.query(
      'INSERT INTO persona_etiquetas (persona_id, etiqueta_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.params.id, etiqueta_id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/etiquetas/persona/:id/:etiquetaId — quitar etiqueta de persona
router.delete('/persona/:id/:etiquetaId', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM persona_etiquetas WHERE persona_id = $1 AND etiqueta_id = $2',
      [req.params.id, req.params.etiquetaId]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/etiquetas/deal/:id — etiquetas de un deal
router.get('/deal/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT e.* FROM etiquetas e
       JOIN deal_etiquetas de ON de.etiqueta_id = e.id
       WHERE de.deal_id = $1
       ORDER BY e.nombre`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/etiquetas/deal/:id — asignar etiqueta a deal
router.post('/deal/:id', async (req, res) => {
  const { etiqueta_id } = req.body;
  if (!etiqueta_id) return res.status(400).json({ error: 'etiqueta_id obligatorio' });

  try {
    await pool.query(
      'INSERT INTO deal_etiquetas (deal_id, etiqueta_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.params.id, etiqueta_id]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/etiquetas/deal/:id/:etiquetaId
router.delete('/deal/:id/:etiquetaId', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM deal_etiquetas WHERE deal_id = $1 AND etiqueta_id = $2',
      [req.params.id, req.params.etiquetaId]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
