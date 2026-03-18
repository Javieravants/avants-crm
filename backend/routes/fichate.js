const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

router.use(auth);

const uploadDir = path.join(__dirname, '../uploads/fichate');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir, limits: { fileSize: 10 * 1024 * 1024 } });

// Helper: obtener ft_user a partir del email del usuario JWT del CRM
// El rol SIEMPRE viene del CRM (req.user.rol) — es la fuente de verdad
async function getFtUser(req) {
  const r = await pool.query('SELECT * FROM ft_users WHERE LOWER(email) = LOWER($1) AND is_active = 1', [req.user.email]);
  const ftUser = r.rows[0] || null;
  if (ftUser) {
    // Mapear rol del CRM al ft_user: admin→admin, supervisor→supervisor, agent→agent
    const crmRol = req.user.rol || 'agent';
    ftUser.role = crmRol;
  }
  return ftUser;
}
function isAdm(ftUser) { return ftUser && (ftUser.role === 'admin' || ftUser.role === 'supervisor'); }

// ══════════════════════════════════════════════
// EMPLOYEES
// ══════════════════════════════════════════════
router.get('/employees', async (req, res) => {
  try {
    const me = await getFtUser(req);
    if (!me) return res.status(404).json({ error: 'Usuario no encontrado en Fichate' });
    if (isAdm(me)) {
      const r = await pool.query(`SELECT id, company_id, name, email, dni, phone, position, department, role, schedule,
        daily_hours, vacation_days, used_vacation_days, start_date, is_active, pin, password_plain, last_login, created_at
        FROM ft_users WHERE company_id = $1 ORDER BY name`, [me.company_id]);
      res.json({ employees: r.rows });
    } else {
      const r = await pool.query(`SELECT id, company_id, name, email, dni, phone, position, department, role, schedule,
        daily_hours, vacation_days, used_vacation_days, start_date, is_active, password_plain, last_login
        FROM ft_users WHERE id = $1`, [me.id]);
      res.json({ employees: r.rows });
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/employees', async (req, res) => {
  try {
    const me = await getFtUser(req);
    if (!me || !isAdm(me)) return res.status(403).json({ error: 'Sin permisos' });
    const b = req.body;
    const bcrypt = require('bcryptjs');
    const pw = b.password || '1234';
    const hash = await bcrypt.hash(pw, 10);
    const r = await pool.query(`INSERT INTO ft_users (company_id, email, password, password_plain, pin, role, name, dni, phone, position, department, schedule, daily_hours, vacation_days, start_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
      [me.company_id, b.email, hash, pw, b.pin || null, b.role || 'agent', b.name,
       b.dni || null, b.phone || null, b.position || null, b.department || null,
       b.schedule || null, b.daily_hours || 7.50, b.vacation_days || 22, b.start_date || null]);
    res.status(201).json({ id: r.rows[0].id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/employee_update', async (req, res) => {
  try {
    const me = await getFtUser(req);
    if (!me) return res.status(404).json({ error: 'Usuario no encontrado' });
    const id = req.query.id || req.body.id;
    const b = req.body;

    if (!isAdm(me)) {
      if (parseInt(id) !== me.id) return res.status(403).json({ error: 'Sin permisos' });
      if (b.password) {
        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash(b.password, 10);
        await pool.query('UPDATE ft_users SET password = $1, password_plain = $2 WHERE id = $3 AND company_id = $4',
          [hash, b.password, id, me.company_id]);
        return res.json({ ok: true });
      }
      return res.status(403).json({ error: 'Sin permisos' });
    }

    const allowed = ['name','email','dni','phone','position','department','role','pin','schedule',
                      'daily_hours','vacation_days','used_vacation_days','start_date','is_active'];
    const fields = []; const vals = []; let idx = 1;
    for (const f of allowed) {
      if (b[f] !== undefined) { fields.push(`${f} = $${idx}`); vals.push(b[f]); idx++; }
    }
    if (b.password) {
      const bcrypt = require('bcryptjs');
      fields.push(`password = $${idx}`); vals.push(await bcrypt.hash(b.password, 10)); idx++;
      fields.push(`password_plain = $${idx}`); vals.push(b.password); idx++;
    }
    if (!fields.length) return res.status(400).json({ error: 'Nada que actualizar' });
    vals.push(id); vals.push(me.company_id);
    await pool.query(`UPDATE ft_users SET ${fields.join(', ')} WHERE id = $${idx} AND company_id = $${idx+1}`, vals);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/employee_delete', async (req, res) => {
  try {
    const me = await getFtUser(req);
    if (!me || me.role !== 'admin') return res.status(403).json({ error: 'Solo admin' });
    const id = req.query.id;
    if (parseInt(id) === me.id) return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
    await pool.query('DELETE FROM ft_sessions WHERE user_id = $1', [id]);
    await pool.query('DELETE FROM ft_users WHERE id = $1 AND company_id = $2', [id, me.company_id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/reset_password', async (req, res) => {
  try {
    const me = await getFtUser(req);
    if (!me || me.role !== 'admin') return res.status(403).json({ error: 'Solo admin' });
    const { user_id, password } = req.body;
    if (!user_id || !password) return res.status(400).json({ error: 'Faltan datos' });
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE ft_users SET password = $1, password_plain = $2 WHERE id = $3 AND company_id = $4',
      [hash, password, user_id, me.company_id]);
    await pool.query('DELETE FROM ft_sessions WHERE user_id = $1', [user_id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════
// CLOCK
// ══════════════════════════════════════════════
router.get('/clock', async (req, res) => {
  try {
    const me = await getFtUser(req);
    if (!me) return res.status(404).json({ error: 'Usuario no encontrado' });
    const today = new Date().toISOString().split('T')[0];
    const recs = await pool.query('SELECT * FROM ft_time_records WHERE user_id = $1 AND date = $2 ORDER BY clock_in DESC', [me.id, today]);
    const open = await pool.query('SELECT * FROM ft_time_records WHERE user_id = $1 AND date = $2 AND clock_out IS NULL LIMIT 1', [me.id, today]);
    res.json({ records: recs.rows, is_clocked_in: open.rows.length > 0 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/clock', async (req, res) => {
  try {
    const me = await getFtUser(req);
    if (!me) return res.status(404).json({ error: 'Usuario no encontrado' });
    const today = new Date().toISOString().split('T')[0];
    const action = req.body.action || 'toggle';
    const ip = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || '';
    const ua = req.headers['user-agent'] || '';

    const open = await pool.query('SELECT * FROM ft_time_records WHERE user_id = $1 AND date = $2 AND clock_out IS NULL ORDER BY clock_in DESC LIMIT 1', [me.id, today]);

    if (action === 'out' || (action === 'toggle' && open.rows.length > 0)) {
      if (!open.rows.length) return res.status(400).json({ error: 'No hay fichaje de entrada abierto' });
      await pool.query('UPDATE ft_time_records SET clock_out = NOW(), updated_at = NOW() WHERE id = $1', [open.rows[0].id]);
      res.json({ action: 'clock_out', time: new Date().toISOString() });
    } else {
      if (open.rows.length) return res.status(400).json({ error: 'Ya tienes un fichaje de entrada abierto. Registra la salida primero.' });
      const r = await pool.query('INSERT INTO ft_time_records (user_id, company_id, date, clock_in, ip_address, user_agent) VALUES ($1,$2,$3,NOW(),$4,$5) RETURNING id',
        [me.id, me.company_id, today, ip, ua]);
      res.json({ action: 'clock_in', id: r.rows[0].id, time: new Date().toISOString() });
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════
// RECORDS
// ══════════════════════════════════════════════
router.get('/records', async (req, res) => {
  try {
    const me = await getFtUser(req);
    if (!me) return res.status(404).json({ error: 'Usuario no encontrado' });
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    const empId = req.query.employee_id;
    let sql = 'SELECT r.*, u.name as employee_name FROM ft_time_records r JOIN ft_users u ON r.user_id = u.id WHERE r.company_id = $1 AND r.date >= $2 AND r.date <= $3';
    const params = [me.company_id, month + '-01', month + '-31'];
    if (!isAdm(me)) { sql += ' AND r.user_id = $4'; params.push(me.id); }
    else if (empId && empId !== 'all') { sql += ' AND r.user_id = $4'; params.push(empId); }
    sql += ' ORDER BY r.clock_in DESC';
    const r = await pool.query(sql, params);
    res.json({ records: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/record_update', async (req, res) => {
  try {
    const me = await getFtUser(req);
    if (!isAdm(me)) return res.status(403).json({ error: 'Sin permisos' });
    const id = req.query.id;
    const { clock_in, clock_out, notes } = req.body;
    await pool.query('UPDATE ft_time_records SET clock_in = $1, clock_out = $2, notes = $3, updated_at = NOW() WHERE id = $4 AND company_id = $5',
      [clock_in, clock_out || null, notes || null, id, me.company_id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/record_delete', async (req, res) => {
  try {
    const me = await getFtUser(req);
    if (!isAdm(me)) return res.status(403).json({ error: 'Sin permisos' });
    await pool.query('DELETE FROM ft_time_records WHERE id = $1 AND company_id = $2', [req.query.id, me.company_id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════
// REQUESTS (Absences)
// ══════════════════════════════════════════════
router.get('/requests', async (req, res) => {
  try {
    const me = await getFtUser(req);
    if (!me) return res.status(404).json({ error: 'Usuario no encontrado' });
    let sql = `SELECT r.*, u.name as employee_name, rv.name as reviewer_name
               FROM ft_absence_requests r JOIN ft_users u ON r.user_id = u.id
               LEFT JOIN ft_users rv ON r.reviewed_by = rv.id WHERE r.company_id = $1`;
    const params = [me.company_id];
    if (!isAdm(me)) { sql += ' AND r.user_id = $2'; params.push(me.id); }
    const status = req.query.status;
    if (status && status !== 'all') { sql += ` AND r.status = $${params.length + 1}`; params.push(status); }
    sql += ' ORDER BY r.created_at DESC';
    const r = await pool.query(sql, params);
    res.json({ requests: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/requests', async (req, res) => {
  try {
    const me = await getFtUser(req);
    if (!me) return res.status(404).json({ error: 'Usuario no encontrado' });
    const b = req.body;
    const empId = (!isAdm(me)) ? me.id : (b.user_id || me.id);
    const r = await pool.query(`INSERT INTO ft_absence_requests (user_id, company_id, type, start_date, end_date, partial, hours_requested, time_from, time_to, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [empId, me.company_id, b.type, b.start_date, b.end_date || null,
       b.partial || 0, b.hours_requested || null, b.time_from || null, b.time_to || null, b.notes || null]);
    res.status(201).json({ id: r.rows[0].id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/request_review', async (req, res) => {
  try {
    const me = await getFtUser(req);
    if (!isAdm(me)) return res.status(403).json({ error: 'Sin permisos' });
    const id = req.query.id;
    const { status, reject_reason } = req.body;
    await pool.query('UPDATE ft_absence_requests SET status = $1, reviewed_by = $2, reviewed_at = NOW(), reject_reason = $3, updated_at = NOW() WHERE id = $4 AND company_id = $5',
      [status, me.id, reject_reason || null, id, me.company_id]);

    // Si se aprueba vacaciones, calcular días laborables y actualizar
    if (status === 'approved') {
      const rq = await pool.query('SELECT * FROM ft_absence_requests WHERE id = $1', [id]);
      if (rq.rows[0]?.type === 'vacation') {
        const r = rq.rows[0];
        const start = new Date(r.start_date);
        const end = new Date(r.end_date || r.start_date);
        const holsR = await pool.query('SELECT date FROM ft_holidays');
        const holSet = new Set(holsR.rows.map(h => h.date instanceof Date ? h.date.toISOString().split('T')[0] : String(h.date).split('T')[0]));
        let days = 0;
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dow = d.getDay();
          const ds = d.toISOString().split('T')[0];
          if (dow !== 0 && dow !== 6 && !holSet.has(ds)) days++;
        }
        if (days > 0) await pool.query('UPDATE ft_users SET used_vacation_days = used_vacation_days + $1 WHERE id = $2', [days, r.user_id]);
      }
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/request_attach', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió archivo' });
    const id = req.query.id;
    const ext = path.extname(req.file.originalname);
    const newPath = req.file.path + ext;
    fs.renameSync(req.file.path, newPath);
    const relPath = 'uploads/fichate/' + path.basename(newPath);
    await pool.query('UPDATE ft_absence_requests SET attachment_path = $1, attachment_name = $2 WHERE id = $3',
      [relPath, req.file.originalname, id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════
// DOCUMENTS
// ══════════════════════════════════════════════
router.get('/documents', async (req, res) => {
  try {
    const me = await getFtUser(req);
    if (!me) return res.status(404).json({ error: 'Usuario no encontrado' });
    let sql = `SELECT d.*, u.name as employee_name, up.name as uploader_name
               FROM ft_documents d JOIN ft_users u ON d.user_id = u.id
               LEFT JOIN ft_users up ON d.uploaded_by = up.id WHERE d.company_id = $1`;
    const params = [me.company_id];
    if (!isAdm(me)) { sql += ' AND d.user_id = $2'; params.push(me.id); }
    const cat = req.query.category;
    if (cat && cat !== 'all') { sql += ` AND d.category = $${params.length + 1}`; params.push(cat); }
    const empId = req.query.employee_id;
    if (empId && empId !== 'all' && isAdm(me)) { sql += ` AND d.user_id = $${params.length + 1}`; params.push(empId); }
    sql += ' ORDER BY d.date DESC';
    const r = await pool.query(sql, params);
    res.json({ documents: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/documents', upload.single('file'), async (req, res) => {
  try {
    const me = await getFtUser(req);
    if (!isAdm(me)) return res.status(403).json({ error: 'Sin permisos' });
    if (!req.file) return res.status(400).json({ error: 'No se recibió archivo' });
    const ext = path.extname(req.file.originalname);
    const newPath = req.file.path + ext;
    fs.renameSync(req.file.path, newPath);
    const relPath = 'uploads/fichate/' + path.basename(newPath);
    const b = req.body;
    const r = await pool.query(`INSERT INTO ft_documents (user_id, company_id, category, name, description, file_path, file_name, file_size, date, uploaded_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [b.user_id, me.company_id, b.category, b.name, b.description || null, relPath,
       req.file.originalname, req.file.size, b.date || new Date().toISOString().split('T')[0], me.id]);
    res.status(201).json({ id: r.rows[0].id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/document_download', async (req, res) => {
  try {
    const me = await getFtUser(req);
    if (!me) return res.status(404).json({ error: 'Usuario no encontrado' });
    const id = req.query.id;
    let sql = 'SELECT * FROM ft_documents WHERE id = $1 AND company_id = $2';
    const params = [id, me.company_id];
    if (!isAdm(me)) { sql += ' AND user_id = $3'; params.push(me.id); }
    const r = await pool.query(sql, params);
    if (!r.rows[0]) return res.status(404).json({ error: 'Documento no encontrado' });
    const doc = r.rows[0];
    // Los archivos originales de IONOS no están en local — devolver info
    const fullPath = path.join(__dirname, '..', doc.file_path);
    if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'Archivo no disponible (migrado de IONOS)' });
    const ext2 = path.extname(fullPath).toLowerCase();
    if (req.query.preview === '1' && ext2 === '.pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
    } else {
      res.setHeader('Content-Disposition', `attachment; filename="${doc.file_name}"`);
    }
    res.sendFile(path.resolve(fullPath));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/document_delete', async (req, res) => {
  try {
    const me = await getFtUser(req);
    if (!me || me.role !== 'admin') return res.status(403).json({ error: 'Solo admin' });
    const id = req.query.id;
    const doc = await pool.query('SELECT file_path FROM ft_documents WHERE id = $1 AND company_id = $2', [id, me.company_id]);
    if (doc.rows[0]?.file_path) {
      const fp = path.join(__dirname, '..', doc.rows[0].file_path);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }
    await pool.query('DELETE FROM ft_documents WHERE id = $1 AND company_id = $2', [id, me.company_id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════
// HOLIDAYS
// ══════════════════════════════════════════════
router.get('/holidays', async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const r = await pool.query('SELECT * FROM ft_holidays WHERE year = $1 ORDER BY date', [year]);
    res.json({ holidays: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/holidays', async (req, res) => {
  try {
    const me = await getFtUser(req);
    if (!me || me.role !== 'admin') return res.status(403).json({ error: 'Solo admin' });
    const { date, name, type } = req.body;
    const year = new Date(date).getFullYear();
    const r = await pool.query('INSERT INTO ft_holidays (company_id, date, name, type, year) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [me.company_id, date, name, type || 'custom', year]);
    res.status(201).json({ id: r.rows[0].id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/holiday_delete', async (req, res) => {
  try {
    const me = await getFtUser(req);
    if (!me || me.role !== 'admin') return res.status(403).json({ error: 'Solo admin' });
    await pool.query('DELETE FROM ft_holidays WHERE id = $1', [req.query.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════
router.get('/dashboard', async (req, res) => {
  try {
    const me = await getFtUser(req);
    if (!isAdm(me)) return res.status(403).json({ error: 'Sin permisos' });
    const cid = me.company_id;
    const today = new Date().toISOString().split('T')[0];

    const [a, b, c, d, e, f] = await Promise.all([
      pool.query('SELECT COUNT(*) as c FROM ft_users WHERE company_id = $1 AND is_active = 1', [cid]),
      pool.query('SELECT COUNT(DISTINCT user_id) as c FROM ft_time_records WHERE company_id = $1 AND date = $2 AND clock_out IS NULL', [cid, today]),
      pool.query("SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (COALESCE(clock_out, NOW()) - clock_in))/3600), 0) as h FROM ft_time_records WHERE company_id = $1 AND date = $2", [cid, today]),
      pool.query("SELECT COUNT(*) as c FROM ft_absence_requests WHERE company_id = $1 AND status = 'pending'", [cid]),
      pool.query('SELECT r.*, u.name as employee_name FROM ft_time_records r JOIN ft_users u ON r.user_id = u.id WHERE r.company_id = $1 AND r.date = $2 ORDER BY r.clock_in DESC LIMIT 20', [cid, today]),
      pool.query("SELECT r.*, u.name as employee_name FROM ft_absence_requests r JOIN ft_users u ON r.user_id = u.id WHERE r.company_id = $1 AND r.status = 'pending' ORDER BY r.created_at DESC LIMIT 10", [cid])
    ]);

    // Weekly attendance
    const week = [];
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(); dt.setDate(dt.getDate() - i);
      const ds = dt.toISOString().split('T')[0];
      const w = await pool.query('SELECT COUNT(DISTINCT user_id) as c FROM ft_time_records WHERE company_id = $1 AND date = $2', [cid, ds]);
      week.push({ date: ds, count: parseInt(w.rows[0].c) });
    }

    res.json({
      active_employees: parseInt(a.rows[0].c),
      clocked_in: parseInt(b.rows[0].c),
      today_hours: parseFloat(c.rows[0].h).toFixed(1),
      pending_requests: parseInt(d.rows[0].c),
      today_records: e.rows,
      pending_reqs: f.rows,
      weekly_attendance: week
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════
// CREDENTIALS
// ══════════════════════════════════════════════
router.get('/app_credentials', async (req, res) => {
  try {
    const me = await getFtUser(req);
    if (!me) return res.status(404).json({ error: 'Usuario no encontrado' });
    let r;
    if (me.role === 'admin') {
      r = await pool.query('SELECT c.*, u.name as created_by_name FROM ft_app_credentials c LEFT JOIN ft_users u ON c.created_by = u.id WHERE c.company_id = $1 ORDER BY c.user_id IS NULL DESC, c.app_name', [me.company_id]);
    } else {
      r = await pool.query('SELECT * FROM ft_app_credentials WHERE company_id = $1 AND (user_id = $2 OR user_id IS NULL) ORDER BY app_name', [me.company_id, me.id]);
    }
    res.json({ credentials: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/app_credentials', async (req, res) => {
  try {
    const me = await getFtUser(req);
    if (!me) return res.status(404).json({ error: 'Usuario no encontrado' });
    const b = req.body;
    const userId = me.role !== 'admin' ? me.id : (b.user_id ?? null);
    const r = await pool.query('INSERT INTO ft_app_credentials (company_id, user_id, app_name, app_url, username, password_plain, notes, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id',
      [me.company_id, userId, b.app_name, b.app_url || null, b.username || null, b.password_plain || null, b.notes || null, me.id]);
    res.status(201).json({ id: r.rows[0].id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/app_credential_update', async (req, res) => {
  try {
    const me = await getFtUser(req);
    if (!me) return res.status(404).json({ error: 'Usuario no encontrado' });
    const id = req.query.id;
    const b = req.body;
    const where = me.role === 'admin' ? 'company_id = $6' : 'user_id = $6';
    const whereVal = me.role === 'admin' ? me.company_id : me.id;
    await pool.query(`UPDATE ft_app_credentials SET app_name=$1, app_url=$2, username=$3, password_plain=$4, notes=$5 WHERE id=$7 AND ${where}`,
      [b.app_name, b.app_url||null, b.username||null, b.password_plain||null, b.notes||null, whereVal, id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/app_credential_delete', async (req, res) => {
  try {
    const me = await getFtUser(req);
    if (!me) return res.status(404).json({ error: 'Usuario no encontrado' });
    const id = req.query.id;
    if (me.role === 'admin') {
      await pool.query('DELETE FROM ft_app_credentials WHERE id = $1 AND company_id = $2', [id, me.company_id]);
    } else {
      await pool.query('DELETE FROM ft_app_credentials WHERE id = $1 AND user_id = $2', [id, me.id]);
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════
// SHIFTS
// ══════════════════════════════════════════════
router.get('/shifts', async (req, res) => {
  try {
    const me = await getFtUser(req);
    if (!me) return res.status(404).json({ error: 'Usuario no encontrado' });
    const r = await pool.query('SELECT * FROM ft_shifts WHERE company_id = $1 ORDER BY name', [me.company_id]);
    res.json({ shifts: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/shifts', async (req, res) => {
  try {
    const me = await getFtUser(req);
    if (!isAdm(me)) return res.status(403).json({ error: 'Sin permisos' });
    const b = req.body;
    if (!b.name || !b.start_time || !b.end_time) return res.status(400).json({ error: 'Nombre y horario obligatorios' });
    const r = await pool.query('INSERT INTO ft_shifts (company_id, name, start_time, end_time, daily_hours, break_time, color) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
      [me.company_id, b.name, b.start_time, b.end_time, b.daily_hours || 7.5, b.break_time || null, b.color || '#ff4a6e']);
    res.status(201).json({ id: r.rows[0].id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/shift_update', async (req, res) => {
  try {
    const me = await getFtUser(req);
    if (!isAdm(me)) return res.status(403).json({ error: 'Sin permisos' });
    const id = req.query.id;
    const b = req.body;
    const allowed = ['name','start_time','end_time','daily_hours','break_time','color'];
    const fields = []; const vals = []; let idx = 1;
    for (const f of allowed) { if (b[f] !== undefined) { fields.push(`${f} = $${idx}`); vals.push(b[f]); idx++; } }
    if (!fields.length) return res.status(400).json({ error: 'Nada que actualizar' });
    // Si cambia nombre, actualizar empleados
    if (b.name && b.old_name) {
      await pool.query('UPDATE ft_users SET schedule = $1 WHERE company_id = $2 AND schedule = $3', [b.name, me.company_id, b.old_name]);
    }
    vals.push(id); vals.push(me.company_id);
    await pool.query(`UPDATE ft_shifts SET ${fields.join(', ')} WHERE id = $${idx} AND company_id = $${idx+1}`, vals);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/shift_delete', async (req, res) => {
  try {
    const me = await getFtUser(req);
    if (!isAdm(me)) return res.status(403).json({ error: 'Sin permisos' });
    const id = req.query.id;
    const s = await pool.query('SELECT name FROM ft_shifts WHERE id = $1 AND company_id = $2', [id, me.company_id]);
    if (s.rows[0]) {
      await pool.query('UPDATE ft_users SET schedule = NULL WHERE company_id = $1 AND schedule = $2', [me.company_id, s.rows[0].name]);
    }
    await pool.query('DELETE FROM ft_shifts WHERE id = $1 AND company_id = $2', [id, me.company_id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════
// REPORTS CSV
// ══════════════════════════════════════════════
router.get('/report_csv', async (req, res) => {
  try {
    const me = await getFtUser(req);
    if (!isAdm(me)) return res.status(403).json({ error: 'Sin permisos' });
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    const type = req.query.type || 'hours';
    const cid = me.company_id;
    const sep = ';';
    let headers = [];
    let rows = [];

    if (type === 'hours') {
      headers = ['Empleado','DNI','Fecha','Hora Entrada','Hora Salida','Horas Trabajadas','Observaciones'];
      const data = await pool.query(`SELECT r.*, u.name, u.dni FROM ft_time_records r JOIN ft_users u ON r.user_id = u.id
        WHERE r.company_id = $1 AND r.date >= $2 AND r.date <= $3 ORDER BY u.name, r.date, r.clock_in`, [cid, month+'-01', month+'-31']);
      rows = data.rows.map(r => {
        const h = r.clock_out ? ((new Date(r.clock_out) - new Date(r.clock_in)) / 3600000).toFixed(2) : '';
        return [r.name, r.dni||'', r.date, r.clock_in ? new Date(r.clock_in).toLocaleTimeString('es-ES') : '',
                r.clock_out ? new Date(r.clock_out).toLocaleTimeString('es-ES') : 'EN CURSO', h, r.notes||''];
      });
    } else if (type === 'absences') {
      headers = ['Empleado','DNI','Tipo','Fecha Inicio','Fecha Fin','Horas','Estado','Revisado Por'];
      const typeNames = {vacation:'Vacaciones',medical_full:'Baja Médica',medical_hours:'Visita Médica',personal:'Asunto Personal',maternity:'Maternidad',training:'Formación',other:'Otro'};
      const data = await pool.query(`SELECT r.*, u.name, u.dni, rv.name as reviewer FROM ft_absence_requests r
        JOIN ft_users u ON r.user_id = u.id LEFT JOIN ft_users rv ON r.reviewed_by = rv.id
        WHERE r.company_id = $1 AND (r.start_date >= $2 AND r.start_date <= $3 OR r.end_date >= $2 AND r.end_date <= $3)
        ORDER BY u.name, r.start_date`, [cid, month+'-01', month+'-31']);
      rows = data.rows.map(r => [r.name, r.dni||'', typeNames[r.type]||r.type, r.start_date, r.end_date||'', r.hours_requested||'', r.status, r.reviewer||'']);
    } else {
      headers = ['Empleado','DNI','Días Trabajados','Horas Totales','Vacaciones Usadas','Vacaciones Disponibles'];
      const data = await pool.query(`SELECT u.id, u.name, u.dni, u.vacation_days, u.used_vacation_days, u.daily_hours,
        (SELECT COUNT(DISTINCT date) FROM ft_time_records WHERE user_id = u.id AND date >= $2 AND date <= $3) as dias,
        (SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (COALESCE(clock_out, clock_in) - clock_in))/3600), 0) FROM ft_time_records WHERE user_id = u.id AND date >= $2 AND date <= $3) as horas
        FROM ft_users u WHERE u.company_id = $1 AND u.is_active = 1 ORDER BY u.name`, [cid, month+'-01', month+'-31']);
      rows = data.rows.map(r => [r.name, r.dni||'', r.dias, parseFloat(r.horas).toFixed(1), r.used_vacation_days||0, (r.vacation_days||22)-(r.used_vacation_days||0)]);
    }

    const bom = '\uFEFF';
    const csv = bom + headers.join(sep) + '\n' + rows.map(r => r.join(sep)).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="AVANTS_${type.toUpperCase()}_${month}.csv"`);
    res.send(csv);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════
// PAYROLL UPLOAD (placeholder — requiere pdf-parse)
// ══════════════════════════════════════════════
router.post('/payroll_upload', upload.array('files', 20), async (req, res) => {
  try {
    const me = await getFtUser(req);
    if (!isAdm(me)) return res.status(403).json({ error: 'Sin permisos' });
    if (!req.files || !req.files.length) return res.status(400).json({ error: 'No se recibieron archivos' });

    const monthParam = req.body.month || new Date().toISOString().slice(0, 7);
    const meses = {1:'Enero',2:'Febrero',3:'Marzo',4:'Abril',5:'Mayo',6:'Junio',7:'Julio',8:'Agosto',9:'Septiembre',10:'Octubre',11:'Noviembre',12:'Diciembre'};
    const parts = monthParam.split('-');
    const monthName = (meses[parseInt(parts[1])] || '') + ' ' + parts[0];

    // Obtener empleados con DNI
    const empsR = await pool.query('SELECT id, name, dni FROM ft_users WHERE company_id = $1 AND dni IS NOT NULL AND dni != $2', [me.company_id, '']);
    const allEmps = empsR.rows;

    const results = [];
    let pdfParse;
    try { pdfParse = require('pdf-parse'); } catch(e) {
      return res.status(500).json({ error: 'pdf-parse no instalado. Ejecuta: npm install pdf-parse' });
    }

    for (const file of req.files) {
      const ext = path.extname(file.originalname).toLowerCase();
      if (ext !== '.pdf') { results.push({ file: file.originalname, status: 'error', reason: 'No es PDF' }); continue; }

      try {
        const dataBuffer = fs.readFileSync(file.path);
        const pdfData = await pdfParse(dataBuffer);
        const text = pdfData.text || '';

        // Buscar DNI de cada empleado en el texto
        for (const emp of allEmps) {
          if (text.toUpperCase().includes(emp.dni.toUpperCase())) {
            const docName = `Nómina ${monthName} - ${emp.name}`;
            // Verificar duplicado
            const dup = await pool.query('SELECT id FROM ft_documents WHERE user_id = $1 AND company_id = $2 AND category = $3 AND name = $4',
              [emp.id, me.company_id, 'payroll', docName]);
            if (dup.rows.length > 0) {
              results.push({ file: file.originalname, status: 'skipped', dni: emp.dni, employee: emp.name, reason: 'Ya existe nómina de este mes' });
              continue;
            }

            // Guardar archivo
            const savedFile = Date.now() + '_' + emp.name.replace(/[^a-zA-Z0-9]/g, '_') + '_' + emp.dni + '.pdf';
            const destPath = path.join(uploadDir, savedFile);
            fs.copyFileSync(file.path, destPath);

            await pool.query('INSERT INTO ft_documents (user_id, company_id, category, name, file_path, file_name, file_size, date, uploaded_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
              [emp.id, me.company_id, 'payroll', docName, 'uploads/fichate/' + savedFile, docName + '.pdf', file.size, new Date().toISOString().split('T')[0], me.id]);

            results.push({ file: file.originalname, status: 'matched', dni: emp.dni, employee: emp.name });
          }
        }
      } catch (e) {
        results.push({ file: file.originalname, status: 'error', reason: 'Error procesando: ' + e.message });
      }

      // Limpiar archivo temporal
      try { fs.unlinkSync(file.path); } catch(e) {}
    }

    res.json({ results });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
