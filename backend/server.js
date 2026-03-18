if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const express = require('express');
const cors = require('cors');
const path = require('path');

// Diagnóstico de arranque
const envKeys = Object.keys(process.env).filter(k =>
  ['DATABASE_URL','DB_HOST','JWT_SECRET','NODE_ENV','PORT','PIPEDRIVE_API_KEY'].includes(k)
);
console.log('ENV available:', envKeys);
console.log('Total env vars:', Object.keys(process.env).length);

const pool = require('./config/db');

const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const notificationRoutes = require('./routes/notifications');
const settingsRoutes = require('./routes/settings');
const assistantRoutes = require('./routes/assistant');
const importRoutes = require('./routes/import');
const webhookRoutes = require('./routes/webhooks');
const personasRoutes = require('./routes/personas');
const calculadoraRoutes = require('./routes/calculadora');
const grabacionesRoutes = require('./routes/grabaciones');
const fichateRoutes = require('./routes/fichate');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware global
app.use(cors());
app.use(express.json());

// Servir frontend estático
app.use(express.static(path.join(__dirname, '../frontend')));

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/import', importRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/personas', personasRoutes);
app.use('/api/calculadora', calculadoraRoutes);
app.use('/api/grabaciones', grabacionesRoutes);
app.use('/api/fichate', fichateRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    const ft = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'ft_%'");
    res.json({ status: 'ok', db: 'connected', ft_tables: ft.rows.map(r => r.table_name), version: 'v2' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

// SPA fallback — devolver index.html para rutas no-API
// Excluir /calculadora/ que tiene su propia página
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/calculadora') && !req.path.startsWith('/grabaciones') && !req.path.startsWith('/fichate')) {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  } else {
    next();
  }
});

// Auto-migración de tablas Fichate al arrancar
async function initFichateTables() {
  try {
    // Crear tablas ft_* directamente con CREATE TABLE IF NOT EXISTS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ft_companies (
        id SERIAL PRIMARY KEY, name VARCHAR(255), cif VARCHAR(50), address TEXT,
        phone VARCHAR(50), email VARCHAR(255), vacation_days_default INTEGER DEFAULT 22,
        daily_hours DECIMAL(4,2) DEFAULT 7.50, schedule_default VARCHAR(100),
        active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ft_users (
        id SERIAL PRIMARY KEY, company_id INTEGER REFERENCES ft_companies(id),
        email VARCHAR(255), password VARCHAR(255), password_plain VARCHAR(255), pin VARCHAR(10),
        name VARCHAR(255) NOT NULL, dni VARCHAR(20), role VARCHAR(20) DEFAULT 'agent',
        team VARCHAR(100), phone VARCHAR(50), position VARCHAR(100), department VARCHAR(100),
        schedule VARCHAR(100), daily_hours DECIMAL(4,2) DEFAULT 7.50,
        vacation_days INTEGER DEFAULT 22, used_vacation_days INTEGER DEFAULT 0,
        start_date DATE, avatar_url VARCHAR(500), cloudtalk_extension VARCHAR(20),
        cloudtalk_agent_id VARCHAR(50), status VARCHAR(20) DEFAULT 'offline',
        is_active SMALLINT DEFAULT 1, last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
    await pool.query('CREATE INDEX IF NOT EXISTS idx_ft_users_email ON ft_users(email)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_ft_users_company ON ft_users(company_id)');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ft_sessions (
        id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES ft_users(id) ON DELETE CASCADE,
        token VARCHAR(64) NOT NULL, ip_address VARCHAR(45), user_agent TEXT,
        expires_at TIMESTAMP NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ft_time_records (
        id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES ft_users(id) ON DELETE CASCADE,
        company_id INTEGER REFERENCES ft_companies(id), date DATE NOT NULL,
        clock_in TIMESTAMP, clock_out TIMESTAMP, type VARCHAR(20) DEFAULT 'normal',
        notes TEXT, ip_address VARCHAR(45), user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
    await pool.query('CREATE INDEX IF NOT EXISTS idx_ft_time_user ON ft_time_records(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_ft_time_date ON ft_time_records(date)');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ft_absence_requests (
        id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES ft_users(id) ON DELETE CASCADE,
        company_id INTEGER REFERENCES ft_companies(id), type VARCHAR(30) NOT NULL,
        start_date DATE NOT NULL, end_date DATE, partial SMALLINT DEFAULT 0,
        hours_requested DECIMAL(4,2), time_from TIME, time_to TIME,
        status VARCHAR(20) DEFAULT 'pending', notes TEXT, attachment_path VARCHAR(500),
        attachment_name VARCHAR(255), reject_reason TEXT, reviewed_by INTEGER, reviewed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
    await pool.query('CREATE INDEX IF NOT EXISTS idx_ft_absence_user ON ft_absence_requests(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_ft_absence_status ON ft_absence_requests(status)');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ft_documents (
        id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES ft_users(id) ON DELETE CASCADE,
        company_id INTEGER REFERENCES ft_companies(id), category VARCHAR(50),
        name VARCHAR(255), description TEXT, file_path VARCHAR(500), file_name VARCHAR(255),
        file_size INTEGER, date DATE, uploaded_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
    await pool.query('CREATE INDEX IF NOT EXISTS idx_ft_docs_user ON ft_documents(user_id)');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ft_holidays (
        id SERIAL PRIMARY KEY, company_id INTEGER, date DATE NOT NULL,
        name VARCHAR(200) NOT NULL, type VARCHAR(30) DEFAULT 'national', year INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ft_shifts (
        id SERIAL PRIMARY KEY, company_id INTEGER, name VARCHAR(100) NOT NULL,
        start_time TIME, end_time TIME, daily_hours DECIMAL(4,2) DEFAULT 7.50,
        break_time VARCHAR(50), color VARCHAR(20) DEFAULT '#ff4a6e',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ft_app_credentials (
        id SERIAL PRIMARY KEY, company_id INTEGER, user_id INTEGER,
        app_name VARCHAR(200) NOT NULL, app_url VARCHAR(500), username VARCHAR(200),
        password_plain VARCHAR(200), notes TEXT, created_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ft_alerts (
        id SERIAL PRIMARY KEY, company_id INTEGER, user_id INTEGER,
        type VARCHAR(30), alert_date DATE, scheduled_time TIME, actual_time TIME,
        minutes_diff INTEGER, is_read BOOLEAN DEFAULT false, is_justified BOOLEAN DEFAULT false,
        justify_reason TEXT, email_sent BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);

    // Sincronizar usuarios CRM → ft_users
    const ftCo = await pool.query('SELECT id FROM ft_companies LIMIT 1');
    let coId = ftCo.rows[0]?.id;
    if (!coId) {
      const ins = await pool.query("INSERT INTO ft_companies (name, email) VALUES ('Avants SL', 'javier@segurosdesaludonline.es') RETURNING id");
      coId = ins.rows[0].id;
    }
    const crmUsers = await pool.query('SELECT nombre, email, rol FROM users');
    for (const u of crmUsers.rows) {
      const ex = await pool.query('SELECT id FROM ft_users WHERE LOWER(email) = LOWER($1)', [u.email]);
      if (ex.rows.length === 0) {
        await pool.query('INSERT INTO ft_users (company_id, name, email, role, is_active) VALUES ($1,$2,$3,$4,1)',
          [coId, u.nombre, u.email, u.rol]);
      }
    }
    console.log('Fichate: tablas y usuarios verificados');
  } catch (e) {
    console.warn('Fichate init warning:', e.message);
  }
}

app.listen(PORT, async () => {
  console.log(`Avants CRM corriendo en http://localhost:${PORT}`);
  await initFichateTables();
});
