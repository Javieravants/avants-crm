const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/roles');

const router = express.Router();
router.use(authMiddleware);
router.use(requireRole('admin'));

// =============================================
// TIPOS DE TRÁMITES
// =============================================

// GET /api/settings/ticket-types
router.get('/ticket-types', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ticket_types ORDER BY orden');
    res.json(result.rows);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/settings/ticket-types
router.post('/ticket-types', async (req, res) => {
  const { nombre, orden } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre es obligatorio' });
  try {
    const result = await pool.query(
      'INSERT INTO ticket_types (nombre, orden) VALUES ($1, $2) RETURNING *',
      [nombre, orden || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PATCH /api/settings/ticket-types/:id
router.patch('/ticket-types/:id', async (req, res) => {
  const { nombre, activo, orden } = req.body;
  try {
    const fields = [];
    const values = [];
    let idx = 1;
    if (nombre !== undefined) { fields.push(`nombre = $${idx++}`); values.push(nombre); }
    if (activo !== undefined) { fields.push(`activo = $${idx++}`); values.push(activo); }
    if (orden !== undefined) { fields.push(`orden = $${idx++}`); values.push(orden); }
    if (fields.length === 0) return res.status(400).json({ error: 'Nada que actualizar' });
    values.push(req.params.id);
    const result = await pool.query(
      `UPDATE ticket_types SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, values
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/settings/ticket-types/:id
router.delete('/ticket-types/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM ticket_types WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// =============================================
// COLUMNAS / BANDEJAS
// =============================================

// GET /api/settings/ticket-columns
router.get('/ticket-columns', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ticket_columns ORDER BY orden');
    res.json(result.rows);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/settings/ticket-columns
router.post('/ticket-columns', async (req, res) => {
  const { nombre, descripcion, visible_roles, visible_user_ids, orden } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Nombre es obligatorio' });
  try {
    const result = await pool.query(
      `INSERT INTO ticket_columns (nombre, descripcion, visible_roles, visible_user_ids, orden)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [nombre, descripcion || '', visible_roles || [], visible_user_ids || [], orden || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PATCH /api/settings/ticket-columns/:id
router.patch('/ticket-columns/:id', async (req, res) => {
  const { nombre, descripcion, visible_roles, visible_user_ids, activo, orden } = req.body;
  try {
    const fields = [];
    const values = [];
    let idx = 1;
    if (nombre !== undefined) { fields.push(`nombre = $${idx++}`); values.push(nombre); }
    if (descripcion !== undefined) { fields.push(`descripcion = $${idx++}`); values.push(descripcion); }
    if (visible_roles !== undefined) { fields.push(`visible_roles = $${idx++}`); values.push(visible_roles); }
    if (visible_user_ids !== undefined) { fields.push(`visible_user_ids = $${idx++}`); values.push(visible_user_ids); }
    if (activo !== undefined) { fields.push(`activo = $${idx++}`); values.push(activo); }
    if (orden !== undefined) { fields.push(`orden = $${idx++}`); values.push(orden); }
    if (fields.length === 0) return res.status(400).json({ error: 'Nada que actualizar' });
    values.push(req.params.id);
    const result = await pool.query(
      `UPDATE ticket_columns SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, values
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/settings/ticket-columns/:id
router.delete('/ticket-columns/:id', async (req, res) => {
  try {
    // Verificar que no hay tickets en esta columna
    const check = await pool.query('SELECT COUNT(*) AS count FROM tickets WHERE column_id = $1', [req.params.id]);
    if (parseInt(check.rows[0].count) > 0) {
      return res.status(409).json({ error: 'No se puede eliminar: hay tickets en esta columna' });
    }
    await pool.query('DELETE FROM ticket_columns WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
