// Panel de supervision — estado agentes + mensajes
var express = require('express');
var pool = require('../config/db');
var authMiddleware = require('../middleware/auth');
var tenantMiddleware = require('../middleware/tenant');
var requireRole = require('../middleware/roles');

var router = express.Router();
router.use(authMiddleware);
router.use(tenantMiddleware);

// GET /api/supervision/agentes — estado actual de todos los agentes
router.get('/agentes', requireRole('admin', 'supervisor'), async function(req, res) {
  try {
    var { rows } = await pool.query(`
      SELECT s.*, u.nombre as agente_nombre, u.email as agente_email, u.rol,
        EXTRACT(EPOCH FROM (NOW() - s.estado_desde))::int as segundos_en_estado,
        EXTRACT(EPOCH FROM (NOW() - s.ultima_actividad))::int as segundos_inactivo
      FROM agent_sessions s
      JOIN users u ON u.id = s.user_id AND u.activo = true
      WHERE s.tenant_id = $1
      ORDER BY
        CASE s.estado WHEN 'en_llamada' THEN 1 WHEN 'activo' THEN 2 WHEN 'post_llamada' THEN 3
        WHEN 'pausa_programada' THEN 4 WHEN 'pausa_urgente' THEN 5 WHEN 'formacion' THEN 6
        WHEN 'inactivo' THEN 7 ELSE 8 END,
        u.nombre
    `, [req.tenantId]);
    res.json({ agentes: rows });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET /api/supervision/stats-hoy — resumen del dia por agente
router.get('/stats-hoy', requireRole('admin', 'supervisor'), async function(req, res) {
  try {
    var { rows } = await pool.query(`
      SELECT cr.agent_id, u.nombre as agente_nombre,
        COUNT(*) as total_llamadas,
        COUNT(*) FILTER (WHERE cr.resultado = 'interesado') as interesados,
        COUNT(*) FILTER (WHERE cr.resultado = 'cerrado') as cerrados,
        COUNT(*) FILTER (WHERE cr.resultado = 'no_contesto') as no_contestados
      FROM call_results cr
      JOIN users u ON u.id = cr.agent_id
      WHERE cr.tenant_id = $1 AND cr.created_at >= CURRENT_DATE
      GROUP BY cr.agent_id, u.nombre
      ORDER BY total_llamadas DESC
    `, [req.tenantId]);
    res.json({ stats: rows });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST /api/supervision/mensaje — enviar mensaje a agente(s)
router.post('/mensaje', requireRole('admin', 'supervisor'), async function(req, res) {
  try {
    var { to_user_id, mensaje, tipo } = req.body;
    if (!mensaje) return res.status(400).json({ error: 'mensaje obligatorio' });

    var r = await pool.query(
      `INSERT INTO supervisor_messages (tenant_id, from_user_id, to_user_id, mensaje, tipo)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.tenantId, req.user.id, to_user_id || null, mensaje, tipo || 'aviso']);

    // Emitir via Socket.io
    var io = req.app.get('io');
    if (io) {
      var payload = { id: r.rows[0].id, mensaje: mensaje, tipo: tipo || 'aviso', from: req.user.nombre };
      if (to_user_id) {
        io.to('agent:' + to_user_id).emit('agent:mensaje', payload);
      } else {
        io.to('tenant:' + req.tenantId).emit('agent:mensaje', payload);
      }
    }

    res.json(r.rows[0]);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST /api/supervision/formacion — activar modo formacion
router.post('/formacion', requireRole('admin', 'supervisor'), async function(req, res) {
  try {
    var { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id obligatorio' });

    await pool.query(
      `UPDATE agent_sessions SET estado = 'formacion', estado_desde = NOW(), updated_at = NOW()
       WHERE user_id = $1 AND tenant_id = $2`,
      [user_id, req.tenantId]);

    var io = req.app.get('io');
    if (io) {
      io.to('agent:' + user_id).emit('agent:mensaje', {
        mensaje: 'El supervisor ha activado modo formacion. Tus llamadas estan pausadas.',
        tipo: 'formacion',
      });
      io.to('tenant:' + req.tenantId).emit('supervision:update');
    }

    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET /api/supervision/mensajes — historial
router.get('/mensajes', requireRole('admin', 'supervisor'), async function(req, res) {
  try {
    var { rows } = await pool.query(`
      SELECT sm.*, uf.nombre as from_nombre, ut.nombre as to_nombre
      FROM supervisor_messages sm
      LEFT JOIN users uf ON uf.id = sm.from_user_id
      LEFT JOIN users ut ON ut.id = sm.to_user_id
      WHERE sm.tenant_id = $1
      ORDER BY sm.created_at DESC LIMIT 50
    `, [req.tenantId]);
    res.json({ mensajes: rows });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
