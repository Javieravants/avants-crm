const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/search?q=texto — buscar en personas, deals, tickets
router.get('/', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q || q.length < 2) return res.json({ personas: [], deals: [], tickets: [] });

  const like = '%' + q + '%';
  try {
    const [personas, deals, tickets] = await Promise.all([
      pool.query(
        `SELECT id, pipedrive_person_id, nombre, telefono, email, dni
         FROM personas WHERE nombre ILIKE $1 OR telefono ILIKE $1 OR email ILIKE $1 OR dni ILIKE $1
         ORDER BY nombre LIMIT 8`, [like]),
      pool.query(
        `SELECT d.id, d.pipedrive_id, d.producto, d.pipedrive_status, p.nombre as persona_nombre
         FROM deals d LEFT JOIN personas p ON d.persona_id = p.id
         WHERE p.nombre ILIKE $1 OR d.producto ILIKE $1 OR CAST(d.pipedrive_id AS TEXT) ILIKE $1
         ORDER BY d.created_at DESC LIMIT 8`, [like]),
      pool.query(
        `SELECT t.id, t.descripcion, t.estado, tt.nombre as tipo_nombre
         FROM tickets t LEFT JOIN ticket_types tt ON t.tipo_id = tt.id
         WHERE t.descripcion ILIKE $1 OR CAST(t.id AS TEXT) = $2
         ORDER BY t.created_at DESC LIMIT 5`, [like, q]),
    ]);

    res.json({
      personas: personas.rows,
      deals: deals.rows,
      tickets: tickets.rows,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
