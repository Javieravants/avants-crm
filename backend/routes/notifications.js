const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/notifications — notificaciones del usuario
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT n.*, t.descripcion AS ticket_descripcion
      FROM notifications n
      LEFT JOIN tickets t ON n.ticket_id = t.id
      WHERE n.user_id = $1
      ORDER BY n.created_at DESC
      LIMIT 50
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error obteniendo notificaciones:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) AS count FROM notifications WHERE user_id = $1 AND leida = false',
      [req.user.id]
    );
    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    console.error('Error contando notificaciones:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET leida = true WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Error marcando notificación:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET leida = true WHERE user_id = $1 AND leida = false',
      [req.user.id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Error marcando notificaciones:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
