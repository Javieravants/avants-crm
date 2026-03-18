const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

router.use(auth);

// Configurar multer para uploads
const uploadDir = path.join(__dirname, '../uploads/fichate');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.pdf', '.jpg', '.jpeg', '.png'].includes(ext)) cb(null, true);
    else cb(new Error('Solo PDF, JPG o PNG'));
  }
});

const isAdmin = (user) => ['admin', 'supervisor'].includes(user.rol);

// ══════════════════════════════════════════════
// FICHAJE (Clock in/out)
// ══════════════════════════════════════════════

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
    res.status(500).json({ error: err.message });
  }
});

router.post('/clock', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { action } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '';

    const open = await pool.query(
      'SELECT * FROM time_records WHERE user_id = $1 AND fecha = $2 AND clock_out IS NULL ORDER BY clock_in DESC LIMIT 1',
      [req.user.id, today]
    );

    if (action === 'out' || (action === 'toggle' && open.rows.length > 0)) {
      if (open.rows.length === 0) return res.status(400).json({ error: 'No hay fichaje de entrada abierto' });
      await pool.query('UPDATE time_records SET clock_out = NOW() WHERE id = $1', [open.rows[0].id]);
      res.json({ action: 'clock_out', time: new Date().toISOString() });
    } else {
      if (open.rows.length > 0) return res.status(400).json({ error: 'Ya tienes un fichaje abierto' });
      const result = await pool.query(
        'INSERT INTO time_records (user_id, fecha, clock_in, ip) VALUES ($1, $2, NOW(), $3) RETURNING *',
        [req.user.id, today, ip]
      );
      res.json({ action: 'clock_in', record: result.rows[0] });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════
// REGISTROS (Time Records)
// ══════════════════════════════════════════════

router.get('/records', async (req, res) => {
  try {
    const { month, user_id } = req.query;
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const startDate = targetMonth + '-01';
    const endDate = targetMonth + '-31';
    let query, params;

    if (isAdmin(req.user) && (!user_id || user_id === 'all')) {
      query = `SELECT r.*, u.nombre as employee_name FROM time_records r
               JOIN users u ON r.user_id = u.id
               WHERE r.fecha >= $1 AND r.fecha <= $2 ORDER BY r.fecha DESC, r.clock_in DESC`;
      params = [startDate, endDate];
    } else {
      const uid = isAdmin(req.user) && user_id ? parseInt(user_id) : req.user.id;
      query = `SELECT r.*, u.nombre as employee_name FROM time_records r
               JOIN users u ON r.user_id = u.id
               WHERE r.fecha >= $1 AND r.fecha <= $2 AND r.user_id = $3
               ORDER BY r.fecha DESC, r.clock_in DESC`;
      params = [startDate, endDate, uid];
    }

    const result = await pool.query(query, params);
    res.json({ records: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/records/:id', async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: 'Sin permisos' });
  try {
    const { clock_in, clock_out, notas } = req.body;
    const result = await pool.query(
      'UPDATE time_records SET clock_in = $1, clock_out = $2, notas = $3 WHERE id = $4 RETURNING *',
      [clock_in, clock_out || null, notas || null, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/records/:id', async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: 'Sin permisos' });
  try {
    await pool.query('DELETE FROM time_records WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════
// AUSENCIAS (Absence Requests)
// ══════════════════════════════════════════════

router.get('/absences', async (req, res) => {
  try {
    const { status } = req.query;
    let query = `SELECT a.*, u.nombre as employee_name, ap.nombre as reviewer_name
                 FROM absence_requests a
                 JOIN users u ON a.user_id = u.id
                 LEFT JOIN users ap ON a.aprobado_por = ap.id`;
    const params = [];
    const where = [];

    if (!isAdmin(req.user)) {
      where.push(`a.user_id = $${params.length + 1}`);
      params.push(req.user.id);
    }
    if (status && status !== 'all') {
      where.push(`a.estado = $${params.length + 1}`);
      params.push(status);
    }
    if (where.length) query += ' WHERE ' + where.join(' AND ');
    query += ' ORDER BY a.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ requests: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/absences', async (req, res) => {
  try {
    const { tipo, fecha_inicio, fecha_fin, motivo, horas, partial, time_from, time_to, user_id } = req.body;
    if (!tipo || !fecha_inicio || !fecha_fin) {
      return res.status(400).json({ error: 'tipo, fecha_inicio y fecha_fin son obligatorios' });
    }

    // Admin puede crear para otros
    const targetUser = isAdmin(req.user) && user_id ? user_id : req.user.id;

    const result = await pool.query(`
      INSERT INTO absence_requests (user_id, tipo, fecha_inicio, fecha_fin, motivo, horas, partial, time_from, time_to)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
    `, [targetUser, tipo, fecha_inicio, fecha_fin, motivo || null, horas || null,
        partial || false, time_from || null, time_to || null]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/absences/:id', async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: 'Sin permisos' });
  try {
    const { estado, motivo_rechazo } = req.body;
    if (!['aprobada', 'rechazada'].includes(estado)) {
      return res.status(400).json({ error: 'Estado debe ser aprobada o rechazada' });
    }

    const result = await pool.query(`
      UPDATE absence_requests SET estado = $1, aprobado_por = $2, aprobado_at = NOW(), motivo_rechazo = $3
      WHERE id = $4 RETURNING *
    `, [estado, req.user.id, motivo_rechazo || null, req.params.id]);

    // Si se aprueba vacaciones, actualizar días usados
    if (estado === 'aprobada' && result.rows[0]) {
      const abs = result.rows[0];
      if (abs.tipo === 'vacaciones') {
        // Calcular días laborables entre fecha_inicio y fecha_fin
        const holidays = await pool.query('SELECT fecha FROM holidays');
        const holidayDates = new Set(holidays.rows.map(h => h.fecha.toISOString().split('T')[0]));
        let days = 0;
        const start = new Date(abs.fecha_inicio);
        const end = new Date(abs.fecha_fin);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dow = d.getDay();
          const dateStr = d.toISOString().split('T')[0];
          if (dow !== 0 && dow !== 6 && !holidayDates.has(dateStr)) days++;
        }
        if (days > 0) {
          await pool.query('UPDATE users SET used_vacation_days = used_vacation_days + $1 WHERE id = $2', [days, abs.user_id]);
        }
      }
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload de adjunto a una ausencia
router.post('/absences/:id/attachment', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se ha enviado archivo' });
    const ext = path.extname(req.file.originalname);
    const newPath = req.file.path + ext;
    fs.renameSync(req.file.path, newPath);
    const relPath = 'uploads/fichate/' + path.basename(newPath);

    await pool.query(
      'UPDATE absence_requests SET attachment_path = $1, attachment_name = $2 WHERE id = $3',
      [relPath, req.file.originalname, req.params.id]
    );
    res.json({ ok: true, path: relPath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════

router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [activeR, clockedR, hoursR, pendingR, todayRecsR, pendingReqsR, weeklyR] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM users WHERE activo = true"),
      pool.query("SELECT COUNT(DISTINCT user_id) FROM time_records WHERE fecha = $1 AND clock_out IS NULL", [today]),
      pool.query("SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (COALESCE(clock_out, NOW()) - clock_in))/3600), 0) as total FROM time_records WHERE fecha = $1", [today]),
      pool.query("SELECT COUNT(*) FROM absence_requests WHERE estado = 'pendiente'"),
      pool.query(`SELECT r.*, u.nombre as employee_name FROM time_records r
                  JOIN users u ON r.user_id = u.id WHERE r.fecha = $1
                  ORDER BY r.clock_in DESC LIMIT 20`, [today]),
      pool.query(`SELECT a.*, u.nombre as employee_name FROM absence_requests a
                  JOIN users u ON a.user_id = u.id WHERE a.estado = 'pendiente'
                  ORDER BY a.created_at DESC LIMIT 10`),
      // Asistencia semanal (últimos 7 días)
      pool.query(`SELECT fecha, COUNT(DISTINCT user_id) as count
                  FROM time_records WHERE fecha >= CURRENT_DATE - INTERVAL '6 days'
                  GROUP BY fecha ORDER BY fecha`)
    ]);

    // Vacaciones usadas totales
    const vacR = await pool.query("SELECT COALESCE(SUM(used_vacation_days),0) as used, COALESCE(SUM(vacation_days),0) as total FROM users WHERE activo = true");

    res.json({
      active_employees: parseInt(activeR.rows[0].count),
      clocked_in: parseInt(clockedR.rows[0].count),
      today_hours: parseFloat(hoursR.rows[0].total).toFixed(1),
      pending_requests: parseInt(pendingR.rows[0].count),
      today_records: todayRecsR.rows,
      pending_reqs: pendingReqsR.rows,
      weekly_attendance: weeklyR.rows,
      vacation_used: parseInt(vacR.rows[0].used),
      vacation_total: parseInt(vacR.rows[0].total)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════
// EMPLEADOS
// ══════════════════════════════════════════════

router.get('/employees', async (req, res) => {
  try {
    if (isAdmin(req.user)) {
      const result = await pool.query(`
        SELECT id, nombre, email, dni, telefono, rol, activo, position, department,
               daily_hours, vacation_days, used_vacation_days, start_date, last_login,
               shift_id, created_at
        FROM users ORDER BY nombre
      `);
      res.json({ employees: result.rows });
    } else {
      const result = await pool.query(
        'SELECT id, nombre, email, dni, telefono, rol, position, vacation_days, used_vacation_days FROM users WHERE id = $1',
        [req.user.id]
      );
      res.json({ employees: result.rows });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/employees/:id', async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: 'Sin permisos' });
  try {
    const allowed = ['nombre', 'email', 'dni', 'telefono', 'rol', 'activo', 'position',
                      'department', 'daily_hours', 'vacation_days', 'used_vacation_days',
                      'start_date', 'shift_id', 'pin'];
    const fields = [];
    const values = [];
    let idx = 1;

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = $${idx}`);
        values.push(req.body[key]);
        idx++;
      }
    }
    if (fields.length === 0) return res.status(400).json({ error: 'Nada que actualizar' });

    values.push(req.params.id);
    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, nombre, email, rol, activo`,
      values
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════
// FESTIVOS
// ══════════════════════════════════════════════

router.get('/holidays', async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const result = await pool.query('SELECT * FROM holidays WHERE year = $1 ORDER BY fecha', [year]);
    res.json({ holidays: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/holidays', async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: 'Solo admin' });
  try {
    const { fecha, nombre, tipo } = req.body;
    const year = new Date(fecha).getFullYear();
    const result = await pool.query(
      'INSERT INTO holidays (fecha, nombre, tipo, year) VALUES ($1, $2, $3, $4) ON CONFLICT (fecha) DO NOTHING RETURNING *',
      [fecha, nombre, tipo || 'nacional', year]
    );
    res.status(201).json(result.rows[0] || { error: 'Ya existe' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/holidays/:id', async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: 'Solo admin' });
  try {
    await pool.query('DELETE FROM holidays WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════
// TURNOS
// ══════════════════════════════════════════════

router.get('/shifts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM shifts WHERE activo = true ORDER BY nombre');
    res.json({ shifts: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/shifts', async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: 'Sin permisos' });
  try {
    const { nombre, hora_entrada, hora_salida, descanso_min, color } = req.body;
    const result = await pool.query(
      'INSERT INTO shifts (nombre, hora_entrada, hora_salida, descanso_min, color) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [nombre, hora_entrada || '09:00', hora_salida || '17:00', descanso_min || 30, color || '#ff4a6e']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/shifts/:id', async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: 'Sin permisos' });
  try {
    const { nombre, hora_entrada, hora_salida, descanso_min, color } = req.body;
    const result = await pool.query(
      'UPDATE shifts SET nombre=$1, hora_entrada=$2, hora_salida=$3, descanso_min=$4, color=$5 WHERE id=$6 RETURNING *',
      [nombre, hora_entrada, hora_salida, descanso_min, color, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/shifts/:id', async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: 'Sin permisos' });
  try {
    await pool.query('UPDATE users SET shift_id = NULL WHERE shift_id = $1', [req.params.id]);
    await pool.query('DELETE FROM shifts WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════
// CREDENCIALES DE APPS
// ══════════════════════════════════════════════

router.get('/credentials', async (req, res) => {
  try {
    let result;
    if (isAdmin(req.user)) {
      result = await pool.query('SELECT c.*, u.nombre as owner_name FROM app_credentials c LEFT JOIN users u ON c.user_id = u.id ORDER BY c.app_name');
    } else {
      result = await pool.query(
        'SELECT * FROM app_credentials WHERE user_id = $1 OR user_id IS NULL ORDER BY app_name',
        [req.user.id]
      );
    }
    res.json({ credentials: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/credentials', async (req, res) => {
  try {
    const { app_name, app_url, username, password_plain, notas, user_id } = req.body;
    // user_id null = compartida
    const targetUser = isAdmin(req.user) ? (user_id || null) : req.user.id;
    const result = await pool.query(
      'INSERT INTO app_credentials (user_id, app_name, app_url, username, password_plain, notas, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [targetUser, app_name, app_url || null, username || null, password_plain || null, notas || null, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/credentials/:id', async (req, res) => {
  try {
    const { app_name, app_url, username, password_plain, notas } = req.body;
    const result = await pool.query(
      'UPDATE app_credentials SET app_name=$1, app_url=$2, username=$3, password_plain=$4, notas=$5 WHERE id=$6 RETURNING *',
      [app_name, app_url, username, password_plain, notas, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/credentials/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM app_credentials WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════
// INFORMES CSV
// ══════════════════════════════════════════════

router.get('/reports/csv', async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: 'Sin permisos' });
  try {
    const { month, type } = req.query;
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const startDate = targetMonth + '-01';
    const endDate = targetMonth + '-31';

    let rows = [];
    let headers = [];
    const sep = ';';

    if (type === 'hours') {
      headers = ['Empleado', 'DNI', 'Fecha', 'Entrada', 'Salida', 'Horas', 'Notas'];
      const data = await pool.query(`
        SELECT r.*, u.nombre, u.dni FROM time_records r
        JOIN users u ON r.user_id = u.id
        WHERE r.fecha >= $1 AND r.fecha <= $2
        ORDER BY u.nombre, r.fecha, r.clock_in
      `, [startDate, endDate]);
      rows = data.rows.map(r => {
        const hours = r.clock_out ? ((new Date(r.clock_out) - new Date(r.clock_in)) / 3600000).toFixed(2) : '';
        return [r.nombre, r.dni || '', r.fecha, r.clock_in ? new Date(r.clock_in).toLocaleTimeString('es-ES') : '',
                r.clock_out ? new Date(r.clock_out).toLocaleTimeString('es-ES') : '', hours, r.notas || ''];
      });
    } else if (type === 'absences') {
      headers = ['Empleado', 'DNI', 'Tipo', 'Desde', 'Hasta', 'Horas', 'Estado', 'Revisado por'];
      const tipoLabels = { vacaciones:'Vacaciones', medica:'Baja Médica', personal:'Personal', maternidad:'Maternidad', formacion:'Formación', otro:'Otro' };
      const data = await pool.query(`
        SELECT a.*, u.nombre, u.dni, ap.nombre as reviewer FROM absence_requests a
        JOIN users u ON a.user_id = u.id LEFT JOIN users ap ON a.aprobado_por = ap.id
        WHERE (a.fecha_inicio >= $1 AND a.fecha_inicio <= $2) OR (a.fecha_fin >= $1 AND a.fecha_fin <= $2)
        ORDER BY u.nombre, a.fecha_inicio
      `, [startDate, endDate, startDate, endDate]);
      rows = data.rows.map(r => [r.nombre, r.dni || '', tipoLabels[r.tipo] || r.tipo,
        r.fecha_inicio, r.fecha_fin, r.horas || '', r.estado, r.reviewer || '']);
    } else {
      // summary
      headers = ['Empleado', 'DNI', 'Días Trabajados', 'Horas Totales', 'Vacaciones Usadas', 'Vacaciones Disponibles'];
      const data = await pool.query(`
        SELECT u.id, u.nombre, u.dni, u.vacation_days, u.used_vacation_days, u.daily_hours,
          (SELECT COUNT(DISTINCT fecha) FROM time_records WHERE user_id = u.id AND fecha >= $1 AND fecha <= $2) as dias,
          (SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (COALESCE(clock_out, clock_in) - clock_in))/3600), 0)
           FROM time_records WHERE user_id = u.id AND fecha >= $1 AND fecha <= $2) as horas
        FROM users u WHERE u.activo = true ORDER BY u.nombre
      `, [startDate, endDate]);
      rows = data.rows.map(r => [r.nombre, r.dni || '', r.dias, parseFloat(r.horas).toFixed(1),
        r.used_vacation_days || 0, (r.vacation_days || 22) - (r.used_vacation_days || 0)]);
    }

    // Generar CSV
    const bom = '\uFEFF';
    const csv = bom + headers.join(sep) + '\n' + rows.map(r => r.join(sep)).join('\n');
    const filename = `AVANTS_${(type || 'summary').toUpperCase()}_${targetMonth}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════
// DOCUMENTOS
// ══════════════════════════════════════════════

router.get('/documents', async (req, res) => {
  try {
    const { category, user_id } = req.query;
    let query = `SELECT d.*, u.nombre as employee_name, up.nombre as uploader_name
                 FROM fichate_documents d
                 JOIN users u ON d.user_id = u.id
                 LEFT JOIN users up ON d.uploaded_by = up.id`;
    const where = [];
    const params = [];

    if (!isAdmin(req.user)) {
      where.push(`d.user_id = $${params.length + 1}`);
      params.push(req.user.id);
    } else if (user_id) {
      where.push(`d.user_id = $${params.length + 1}`);
      params.push(parseInt(user_id));
    }
    if (category && category !== 'all') {
      where.push(`d.categoria = $${params.length + 1}`);
      params.push(category);
    }
    if (where.length) query += ' WHERE ' + where.join(' AND ');
    query += ' ORDER BY d.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ documents: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/documents', upload.single('file'), async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: 'Sin permisos' });
  try {
    if (!req.file) return res.status(400).json({ error: 'No se ha enviado archivo' });
    const ext = path.extname(req.file.originalname);
    const newPath = req.file.path + ext;
    fs.renameSync(req.file.path, newPath);
    const relPath = 'uploads/fichate/' + path.basename(newPath);

    const { user_id, categoria, nombre, fecha } = req.body;
    const result = await pool.query(`
      INSERT INTO fichate_documents (user_id, categoria, nombre, filepath, filename, filesize, fecha, uploaded_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
    `, [user_id, categoria || 'otro', nombre || req.file.originalname, relPath,
        req.file.originalname, req.file.size, fecha || new Date(), req.user.id]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/documents/:id', async (req, res) => {
  if (!isAdmin(req.user)) return res.status(403).json({ error: 'Solo admin' });
  try {
    const doc = await pool.query('SELECT filepath FROM fichate_documents WHERE id = $1', [req.params.id]);
    if (doc.rows[0]?.filepath) {
      const fullPath = path.join(__dirname, '..', doc.rows[0].filepath);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    }
    await pool.query('DELETE FROM fichate_documents WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download/preview de documentos
router.get('/documents/:id/download', async (req, res) => {
  try {
    const doc = await pool.query('SELECT * FROM fichate_documents WHERE id = $1', [req.params.id]);
    if (!doc.rows[0]) return res.status(404).json({ error: 'Documento no encontrado' });

    // Verificar acceso
    if (!isAdmin(req.user) && doc.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Sin permisos' });
    }

    const fullPath = path.join(__dirname, '..', doc.rows[0].filepath);
    if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'Archivo no encontrado' });

    const ext = path.extname(fullPath).toLowerCase();
    if (req.query.preview === '1' && ext === '.pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
    } else {
      res.setHeader('Content-Disposition', `attachment; filename="${doc.rows[0].filename}"`);
    }
    res.sendFile(fullPath);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
