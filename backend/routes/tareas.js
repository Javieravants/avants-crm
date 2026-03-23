const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/tareas — listar tareas
router.get('/', async (req, res) => {
  const { agente_id, persona_id, fecha, estado = 'pendiente' } = req.query;
  let where = '1=1';
  const params = [];
  let idx = 1;

  if (estado) { where += ` AND t.estado = $${idx}`; params.push(estado); idx++; }
  if (agente_id) { where += ` AND t.agente_id = $${idx}`; params.push(agente_id); idx++; }
  if (persona_id) { where += ` AND t.persona_id = $${idx}`; params.push(persona_id); idx++; }
  if (fecha === 'hoy') { where += ` AND t.fecha_venc::date = CURRENT_DATE`; }

  try {
    const r = await pool.query(`
      SELECT t.*, p.nombre as persona_nombre, u.nombre as agente_nombre
      FROM tareas t
      LEFT JOIN personas p ON t.persona_id = p.id
      LEFT JOIN users u ON t.agente_id = u.id
      WHERE ${where}
      ORDER BY t.fecha_venc ASC NULLS LAST
      LIMIT 50
    `, params);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/tareas/:id — marcar como hecha/cancelada
router.patch('/:id', async (req, res) => {
  const { estado } = req.body;
  if (!estado || !['hecha', 'cancelada', 'pendiente'].includes(estado)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }
  try {
    const r = await pool.query(
      'UPDATE tareas SET estado = $1 WHERE id = $2 RETURNING *',
      [estado, req.params.id]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Tarea no encontrada' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
