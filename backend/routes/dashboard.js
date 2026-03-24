const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/dashboard — KPIs y datos del agente logueado
router.get('/', async (req, res) => {
  const userId = req.user.id;
  const rol = req.user.rol;
  const isAdmin = rol === 'admin' || rol === 'superadmin' || rol === 'supervisor';

  try {
    // KPIs: ventas hoy (deals won hoy)
    const ventasHoy = await pool.query(
      `SELECT COUNT(*) as total FROM deals
       WHERE pipedrive_status = 'won' AND updated_at::date = CURRENT_DATE
       ${!isAdmin ? 'AND agente_id = $1' : ''}`,
      !isAdmin ? [userId] : []
    );

    // KPIs: ventas este mes
    const ventasMes = await pool.query(
      `SELECT COUNT(*) as total FROM deals
       WHERE pipedrive_status = 'won' AND updated_at >= date_trunc('month', CURRENT_DATE)
       ${!isAdmin ? 'AND agente_id = $1' : ''}`,
      !isAdmin ? [userId] : []
    );

    // KPIs: deals open del agente
    const dealsOpen = await pool.query(
      `SELECT COUNT(*) as total FROM deals
       WHERE pipedrive_status = 'open'
       ${!isAdmin ? 'AND agente_id = $1' : ''}`,
      !isAdmin ? [userId] : []
    );

    // KPIs: tickets activos
    const ticketsActivos = await pool.query(
      `SELECT COUNT(*) as total FROM tickets
       WHERE estado NOT IN ('cerrado', 'resuelto')
       ${!isAdmin ? 'AND (created_by = $1 OR assigned_to = $1)' : ''}`,
      !isAdmin ? [userId] : []
    );

    // KPIs: tickets resueltos este mes
    const ticketsResueltos = await pool.query(
      `SELECT COUNT(*) as total FROM tickets
       WHERE estado = 'resuelto' AND resolved_at >= date_trunc('month', CURRENT_DATE)
       ${!isAdmin ? 'AND (created_by = $1 OR assigned_to = $1)' : ''}`,
      !isAdmin ? [userId] : []
    );

    // Ranking: ventas por agente este mes (deals won)
    const ranking = await pool.query(
      `SELECT u.id, u.nombre, COUNT(d.id) as ventas
       FROM users u
       LEFT JOIN deals d ON d.agente_id = u.id AND d.pipedrive_status = 'won'
         AND d.updated_at >= date_trunc('month', CURRENT_DATE)
       WHERE u.activo = true AND u.rol = 'agent'
       GROUP BY u.id, u.nombre
       ORDER BY ventas DESC
       LIMIT 10`
    );

    // Agenda hoy: tareas pendientes con fecha de hoy o futuras
    const agenda = await pool.query(
      `SELECT t.id, t.tipo, t.titulo, t.descripcion, t.fecha_venc, t.hora_venc, t.estado,
              p.id as persona_id, p.nombre as persona_nombre, p.telefono
       FROM tareas t
       LEFT JOIN personas p ON p.id = t.persona_id
       WHERE t.estado = 'pendiente'
         AND t.fecha_venc::date >= CURRENT_DATE
         ${!isAdmin ? 'AND t.agente_id = $1' : ''}
       ORDER BY t.fecha_venc::date ASC, t.hora_venc ASC NULLS LAST
       LIMIT 20`,
      !isAdmin ? [userId] : []
    );

    // Ventas por día esta semana
    const ventasSemana = await pool.query(
      `SELECT DATE(updated_at) as dia, COUNT(*) as ventas
       FROM deals
       WHERE pipedrive_status = 'won'
         AND updated_at >= date_trunc('week', CURRENT_DATE)
       ${!isAdmin ? 'AND agente_id = $1' : ''}
       GROUP BY DATE(updated_at)
       ORDER BY dia`,
      !isAdmin ? [userId] : []
    );

    res.json({
      user: { id: req.user.id, nombre: req.user.nombre, rol: req.user.rol },
      kpis: {
        ventas_hoy: parseInt(ventasHoy.rows[0].total),
        ventas_mes: parseInt(ventasMes.rows[0].total),
        deals_open: parseInt(dealsOpen.rows[0].total),
        tickets_activos: parseInt(ticketsActivos.rows[0].total),
        tickets_resueltos: parseInt(ticketsResueltos.rows[0].total),
        llamadas_hoy: 0, // Placeholder — se llenará con CloudTalk
        racha: 0, // Placeholder — se calculará con historial de ventas
        calidad_ia: 0, // Placeholder — se llenará con análisis IA
      },
      ranking: ranking.rows,
      agenda: agenda.rows,
      ventas_semana: ventasSemana.rows,
    });
  } catch (err) {
    console.error('Error dashboard:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
