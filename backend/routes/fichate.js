const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

router.use(auth);

// === FICHAJE ===

// GET /api/fichate/status — Estado actual del usuario hoy
router.get('/status', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const records = await pool.query(
      'SELECT * FROM time_records WHERE user_id = $1 AND fecha = $2 ORDER BY clock_in DESC',
      [req.user.id, today]
    );
    const open = records.rows.find(r => !r.clock_out);
    res.json({ records: records.rows, is_clocked_in: !!open, open_record: open || null });
  } catch (err) {
    console.error('Error status fichate:', err);
    res.status(500).json({ error: 'Error al obtener estado' });
  }
});

// POST /api/fichate/clock — Fichar entrada/salida
router.post('/clock', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { action } = req.body; // 'in', 'out', or 'toggle'
    const ip = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '';

    const open = await pool.query(
      'SELECT * FROM time_records WHERE user_id = $1 AND fecha = $2 AND clock_out IS NULL ORDER BY clock_in DESC LIMIT 1',
      [req.user.id, today]
    );

    if (action === 'out' || (action === 'toggle' && open.rows.length > 0)) {
      if (open.rows.length === 0) {
        return res.status(400).json({ error: 'No hay fichaje de entrada abierto' });
      }
      await pool.query('UPDATE time_records SET clock_out = NOW() WHERE id = $1', [open.rows[0].id]);
      res.json({ action: 'clock_out', time: new Date().toISOString() });
    } else {
      if (open.rows.length > 0) {
        return res.status(400).json({ error: 'Ya tienes un fichaje abierto. Registra la salida primero.' });
      }
      const result = await pool.query(
        'INSERT INTO time_records (user_id, fecha, clock_in, ip) VALUES ($1, $2, NOW(), $3) RETURNING *',
        [req.user.id, today, ip]
      );
      res.json({ action: 'clock_in', record: result.rows[0] });
    }
  } catch (err) {
    console.error('Error clock:', err);
    res.status(500).json({ error: 'Error al fichar' });
  }
});

// GET /api/fichate/records — Registros con filtro de mes
router.get('/records', async (req, res) => {
  try {
    const { month, user_id } = req.query;
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const isAdmin = ['admin', 'supervisor'].includes(req.user.rol);
    let targetUser = req.user.id;

    if (isAdmin && user_id) targetUser = parseInt(user_id);
    else if (!isAdmin) targetUser = req.user.id;

    const startDate = targetMonth + '-01';
    const endDate = targetMonth + '-31';

    let query = `
      SELECT r.*, u.nombre as employee_name
      FROM time_records r JOIN users u ON r.user_id = u.id
      WHERE r.fecha >= $1 AND r.fecha <= $2
    `;
    const params = [startDate, endDate];

    if (!isAdmin || user_id) {
      query += ' AND r.user_id = $3';
      params.push(targetUser);
    }
    query += ' ORDER BY r.clock_in DESC';

    const result = await pool.query(query, params);
    res.json({ records: result.rows });
  } catch (err) {
    console.error('Error records:', err);
    res.status(500).json({ error: 'Error al obtener registros' });
  }
});

// === AUSENCIAS ===

// GET /api/fichate/absences — Listar ausencias
router.get('/absences', async (req, res) => {
  try {
    const isAdmin = ['admin', 'supervisor'].includes(req.user.rol);
    let query = `
      SELECT a.*, u.nombre as employee_name, ap.nombre as reviewer_name
      FROM absence_requests a
      JOIN users u ON a.user_id = u.id
      LEFT JOIN users ap ON a.aprobado_por = ap.id
    `;
    const params = [];

    if (!isAdmin) {
      query += ' WHERE a.user_id = $1';
      params.push(req.user.id);
    }
    query += ' ORDER BY a.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ requests: result.rows });
  } catch (err) {
    console.error('Error absences:', err);
    res.status(500).json({ error: 'Error al obtener ausencias' });
  }
});

// POST /api/fichate/absences — Solicitar ausencia
router.post('/absences', async (req, res) => {
  try {
    const { tipo, fecha_inicio, fecha_fin, motivo, horas } = req.body;
    if (!tipo || !fecha_inicio || !fecha_fin) {
      return res.status(400).json({ error: 'tipo, fecha_inicio y fecha_fin son obligatorios' });
    }

    const result = await pool.query(`
      INSERT INTO absence_requests (user_id, tipo, fecha_inicio, fecha_fin, motivo, horas)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, [req.user.id, tipo, fecha_inicio, fecha_fin, motivo || null, horas || null]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error crear ausencia:', err);
    res.status(500).json({ error: 'Error al crear solicitud' });
  }
});

// PATCH /api/fichate/absences/:id — Aprobar/rechazar
router.patch('/absences/:id', async (req, res) => {
  try {
    if (!['admin', 'supervisor'].includes(req.user.rol)) {
      return res.status(403).json({ error: 'Sin permisos' });
    }
    const { estado, motivo_rechazo } = req.body;
    if (!['aprobada', 'rechazada'].includes(estado)) {
      return res.status(400).json({ error: 'Estado debe ser aprobada o rechazada' });
    }

    const result = await pool.query(`
      UPDATE absence_requests SET estado = $1, aprobado_por = $2, aprobado_at = NOW(), motivo_rechazo = $3
      WHERE id = $4 RETURNING *
    `, [estado, req.user.id, motivo_rechazo || null, req.params.id]);

    // Si se aprueba vacaciones, actualizar días usados
    if (estado === 'aprobada' && result.rows[0]?.tipo === 'vacaciones') {
      const abs = result.rows[0];
      const dias = abs.dias_laborables || 1;
      await pool.query('UPDATE users SET used_vacation_days = used_vacation_days + $1 WHERE id = $2', [dias, abs.user_id]);
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error revisar ausencia:', err);
    res.status(500).json({ error: 'Error al revisar solicitud' });
  }
});

// === DASHBOARD ===

// GET /api/fichate/dashboard — KPIs
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const month = today.slice(0, 7);

    // Empleados activos
    const activeUsers = await pool.query("SELECT COUNT(*) FROM users WHERE activo = true");

    // Fichados hoy
    const clockedIn = await pool.query(
      "SELECT COUNT(DISTINCT user_id) FROM time_records WHERE fecha = $1 AND clock_out IS NULL", [today]
    );

    // Horas hoy (de registros cerrados)
    const hoursToday = await pool.query(`
      SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (clock_out - clock_in))/3600), 0) as total
      FROM time_records WHERE fecha = $1 AND clock_out IS NOT NULL
    `, [today]);

    // Solicitudes pendientes
    const pendingReqs = await pool.query(
      "SELECT COUNT(*) FROM absence_requests WHERE estado = 'pendiente'"
    );

    // Registros de hoy
    const todayRecords = await pool.query(`
      SELECT r.*, u.nombre as employee_name
      FROM time_records r JOIN users u ON r.user_id = u.id
      WHERE r.fecha = $1 ORDER BY r.clock_in DESC
    `, [today]);

    res.json({
      active_employees: parseInt(activeUsers.rows[0].count),
      clocked_in: parseInt(clockedIn.rows[0].count),
      hours_today: parseFloat(hoursToday.rows[0].total).toFixed(1),
      pending_requests: parseInt(pendingReqs.rows[0].count),
      today_records: todayRecords.rows
    });
  } catch (err) {
    console.error('Error dashboard fichate:', err);
    res.status(500).json({ error: 'Error al obtener dashboard' });
  }
});

// === FESTIVOS ===

router.get('/holidays', async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const result = await pool.query('SELECT * FROM holidays WHERE year = $1 ORDER BY fecha', [year]);
    res.json({ holidays: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener festivos' });
  }
});

router.post('/holidays', async (req, res) => {
  try {
    if (!['admin'].includes(req.user.rol)) return res.status(403).json({ error: 'Solo admin' });
    const { fecha, nombre, tipo } = req.body;
    const year = new Date(fecha).getFullYear();
    const result = await pool.query(
      'INSERT INTO holidays (fecha, nombre, tipo, year) VALUES ($1, $2, $3, $4) RETURNING *',
      [fecha, nombre, tipo || 'nacional', year]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error crear festivo:', err);
    res.status(500).json({ error: 'Error al crear festivo' });
  }
});

router.delete('/holidays/:id', async (req, res) => {
  try {
    if (!['admin'].includes(req.user.rol)) return res.status(403).json({ error: 'Solo admin' });
    await pool.query('DELETE FROM holidays WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar festivo' });
  }
});

// === TURNOS ===

router.get('/shifts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM shifts WHERE activo = true ORDER BY nombre');
    res.json({ shifts: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener turnos' });
  }
});

router.post('/shifts', async (req, res) => {
  try {
    if (!['admin', 'supervisor'].includes(req.user.rol)) return res.status(403).json({ error: 'Sin permisos' });
    const { nombre, hora_entrada, hora_salida, descanso_min, color } = req.body;
    const result = await pool.query(
      'INSERT INTO shifts (nombre, hora_entrada, hora_salida, descanso_min, color) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [nombre, hora_entrada || '09:00', hora_salida || '17:00', descanso_min || 30, color || '#3b82f6']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear turno' });
  }
});

module.exports = router;
