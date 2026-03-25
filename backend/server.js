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
const pipelineRoutes = require('./routes/pipeline');
const dashboardRoutes = require('./routes/dashboard');
const cloudtalkRoutes = require('./routes/cloudtalk');
const searchRoutes = require('./routes/search');
const documentosRoutes = require('./routes/documentos');
const historyRoutes = require('./routes/history');
const tareasRoutes = require('./routes/tareas');
const adminRoutes = require('./routes/admin');
const etiquetasRoutes = require('./routes/etiquetas');
const informesRoutes = require('./routes/informes');
const polizasRoutes = require('./routes/polizas');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware global
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Cache bust: inyectar versión en index.html
const BUILD_VERSION = Date.now();
const fs = require('fs');
app.get('/', (req, res) => {
  let html = fs.readFileSync(path.join(__dirname, '../frontend/index.html'), 'utf8');
  html = html.replace(/\?v=[\w]+/g, `?v=${BUILD_VERSION}`);
  res.send(html);
});

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
app.use('/api/pipeline', pipelineRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/cloudtalk', cloudtalkRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/documentos', documentosRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/tareas', tareasRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/etiquetas', etiquetasRoutes);
app.use('/api/informes', informesRoutes);
app.use('/api/polizas', polizasRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Webhook CloudTalk — sin auth (CloudTalk Workflow Automation)
app.post('/webhook/cloudtalk', async (req, res) => {
  res.json({ success: true }); // Responder rápido

  try {
    const {
      call_id, duration_seconds, status,
      recording_url, agent_extension, agent_name,
      contact_phone, contact_name
    } = req.body;

    if (!contact_phone) return;

    // Buscar persona por teléfono normalizado (últimos 9 dígitos)
    const phone = (contact_phone || '').replace(/\s/g, '');
    const phoneDigits = phone.replace(/\D/g, '').slice(-9);
    const persona = await pool.query(
      `SELECT id FROM personas
       WHERE RIGHT(regexp_replace(COALESCE(telefono,''), '[^0-9]', '', 'g'), 9) = $1
       LIMIT 1`,
      [phoneDigits]
    );

    // Buscar agente por nombre
    let agenteId = null;
    if (agent_name) {
      const agR = await pool.query(
        'SELECT id FROM users WHERE nombre ILIKE $1 AND activo = true LIMIT 1',
        ['%' + (agent_name || '').split(' ')[0] + '%']
      );
      agenteId = agR.rows[0]?.id || null;
    }

    const personaId = persona.rows[0]?.id;
    if (!personaId) {
      console.log(`[CloudTalk] Persona no encontrada para teléfono: ${phone}`);
      return;
    }

    // Registrar en contact_history
    const { registrarEvento } = require('./routes/history');
    const subtipo = status === 'answered' ? 'contestada' :
      status === 'voicemail' ? 'buzon' : 'no_contestada';

    registrarEvento(personaId, 'llamada', {
      subtipo,
      titulo: 'Llamada ' + (status === 'answered' ? 'contestada' : 'no contestada'),
      descripcion: (agent_name || '') + ' → ' + (contact_name || phone),
      metadata: {
        cloudtalk_call_id: call_id,
        duracion_seg: duration_seconds,
        resultado: status,
        grabacion_url: recording_url,
        extension: agent_extension
      },
      agente_id: agenteId,
      origen: 'cloudtalk'
    });

    console.log(`[CloudTalk] Llamada registrada: ${phone} → persona #${personaId} (${subtipo})`);
  } catch (err) {
    console.error('[CloudTalk] Webhook error:', err.message);
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
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

    // Importar datos IONOS si las tablas están vacías
    const recCount = await pool.query('SELECT COUNT(*) as c FROM ft_time_records');
    if (parseInt(recCount.rows[0].c) === 0) {
      const fs = require('fs');
      const dataDir = path.join(__dirname, 'data/fichate-export');
      if (fs.existsSync(path.join(dataDir, 'users.tsv'))) {
        console.log('Fichate: importando datos históricos de IONOS...');
        // Limpiar usuarios auto-sincronizados (no tienen registros asociados)
        await pool.query('DELETE FROM ft_users');
        await pool.query('DELETE FROM ft_companies');

        // Función para parsear TSV
        function parseTSV(filename) {
          const content = fs.readFileSync(path.join(dataDir, filename), 'utf8');
          const lines = content.trim().split('\n');
          if (lines.length < 2) return [];
          const headers = lines[0].replace(/\r/g, '').split('\t');
          return lines.slice(1).map(line => {
            const vals = line.replace(/\r/g, '').split('\t');
            const obj = {};
            headers.forEach((h, i) => { obj[h] = (vals[i] === 'NULL' || vals[i] === '') ? null : vals[i]; });
            return obj;
          });
        }

        // Función para importar tabla
        async function importTable(tsvFile, pgTable, columnMap) {
          const rows = parseTSV(tsvFile);
          const pgCols = Object.values(columnMap);
          const tsvCols = Object.keys(columnMap);
          let imported = 0;
          for (const row of rows) {
            const values = tsvCols.map(c => row[c]);
            const placeholders = values.map((_, i) => `$${i + 1}`).join(',');
            try {
              await pool.query(`INSERT INTO ${pgTable} (${pgCols.join(',')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`, values);
              imported++;
            } catch (e) { console.warn(`  Error ${pgTable}:`, e.message); }
          }
          console.log(`  ${pgTable}: ${imported}/${rows.length}`);
        }

        // Importar en orden (con IDs originales de IONOS)
        await importTable('companies.tsv', 'ft_companies', {
          id:'id', name:'name', cif:'cif', address:'address', phone:'phone', email:'email',
          vacation_days_default:'vacation_days_default', daily_hours:'daily_hours',
          schedule_default:'schedule_default', active:'active', created_at:'created_at', updated_at:'updated_at'
        });
        await pool.query("SELECT setval('ft_companies_id_seq', (SELECT COALESCE(MAX(id),0) FROM ft_companies))");

        await importTable('users.tsv', 'ft_users', {
          id:'id', company_id:'company_id', email:'email', password:'password', password_plain:'password_plain',
          pin:'pin', name:'name', dni:'dni', role:'role', team:'team', phone:'phone', position:'position',
          department:'department', schedule:'schedule', daily_hours:'daily_hours', vacation_days:'vacation_days',
          used_vacation_days:'used_vacation_days', start_date:'start_date', avatar_url:'avatar_url',
          cloudtalk_extension:'cloudtalk_extension', cloudtalk_agent_id:'cloudtalk_agent_id',
          status:'status', is_active:'is_active', last_login:'last_login', created_at:'created_at', updated_at:'updated_at'
        });
        await pool.query("SELECT setval('ft_users_id_seq', (SELECT COALESCE(MAX(id),0) FROM ft_users))");

        await importTable('time_records.tsv', 'ft_time_records', {
          id:'id', user_id:'user_id', company_id:'company_id', date:'date', clock_in:'clock_in',
          clock_out:'clock_out', type:'type', notes:'notes', ip_address:'ip_address',
          user_agent:'user_agent', created_at:'created_at', updated_at:'updated_at'
        });
        await pool.query("SELECT setval('ft_time_records_id_seq', (SELECT COALESCE(MAX(id),0) FROM ft_time_records))");

        await importTable('absence_requests.tsv', 'ft_absence_requests', {
          id:'id', user_id:'user_id', company_id:'company_id', type:'type', start_date:'start_date',
          end_date:'end_date', partial:'partial', hours_requested:'hours_requested', time_from:'time_from',
          time_to:'time_to', status:'status', notes:'notes', attachment_path:'attachment_path',
          attachment_name:'attachment_name', reject_reason:'reject_reason', reviewed_by:'reviewed_by',
          reviewed_at:'reviewed_at', created_at:'created_at', updated_at:'updated_at'
        });
        await pool.query("SELECT setval('ft_absence_requests_id_seq', (SELECT COALESCE(MAX(id),0) FROM ft_absence_requests))");

        await importTable('documents.tsv', 'ft_documents', {
          id:'id', user_id:'user_id', company_id:'company_id', category:'category', name:'name',
          description:'description', file_path:'file_path', file_name:'file_name', file_size:'file_size',
          date:'date', uploaded_by:'uploaded_by', created_at:'created_at'
        });
        await pool.query("SELECT setval('ft_documents_id_seq', (SELECT COALESCE(MAX(id),0) FROM ft_documents))");

        await importTable('holidays.tsv', 'ft_holidays', {
          id:'id', company_id:'company_id', date:'date', name:'name', type:'type', year:'year', created_at:'created_at'
        });
        await pool.query("SELECT setval('ft_holidays_id_seq', (SELECT COALESCE(MAX(id),0) FROM ft_holidays))");

        await importTable('shifts.tsv', 'ft_shifts', {
          id:'id', company_id:'company_id', name:'name', start_time:'start_time', end_time:'end_time',
          daily_hours:'daily_hours', break_time:'break_time', color:'color', created_at:'created_at'
        });
        await pool.query("SELECT setval('ft_shifts_id_seq', (SELECT COALESCE(MAX(id),0) FROM ft_shifts))");

        await importTable('app_credentials.tsv', 'ft_app_credentials', {
          id:'id', company_id:'company_id', user_id:'user_id', app_name:'app_name', app_url:'app_url',
          username:'username', password_plain:'password_plain', notes:'notes', created_by:'created_by',
          created_at:'created_at', updated_at:'updated_at'
        });
        await pool.query("SELECT setval('ft_app_credentials_id_seq', (SELECT COALESCE(MAX(id),0) FROM ft_app_credentials))");

        console.log('Fichate: importación IONOS completada');
      }
    }

    // Sincronizar usuarios CRM que no existan aún en ft_users
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

// Auto-migración Pipeline al arrancar
async function initPipelineTables() {
  try {
    const fs = require('fs');
    const migPath = path.join(__dirname, 'config/migration-pipeline.sql');
    if (fs.existsSync(migPath)) {
      const sql = fs.readFileSync(migPath, 'utf8');
      await pool.query(sql);
      console.log('Pipeline: tablas verificadas');
    }
  } catch (e) {
    console.warn('Pipeline init warning:', e.message);
  }
}

// Auto-migración de tablas adicionales
async function initExtraMigrations() {
  const fs = require('fs');
  const extras = ['migration-grabaciones.sql', 'migration-calculadora.sql', 'migration-tramites-v2.sql', 'migration-users-empresa.sql', 'migration-indices.sql', 'migration-documentos.sql', 'migration-contact-history.sql', 'migration-tareas.sql', 'migration-multi-tenant.sql', 'migration-etiquetas.sql', 'migration-polizas.sql', 'migration-grabar-poliza.sql', 'migration-usuarios-historicos.sql', 'migration-pdf-poliza.sql', 'migration-fix-agentes-polizas.sql', 'migration-propuestas-v2.sql', 'migration-fix-created-at-polizas.sql', 'migration-fix-mes-alta.sql'];
  for (const file of extras) {
    try {
      const migPath = path.join(__dirname, 'config', file);
      if (fs.existsSync(migPath)) {
        const sql = fs.readFileSync(migPath, 'utf8');
        await pool.query(sql);
      }
    } catch (e) {
      console.warn(`Migration ${file} warning:`, e.message);
    }
  }
  console.log('Migraciones extras verificadas');
}

app.listen(PORT, async () => {
  console.log(`Avants CRM corriendo en http://localhost:${PORT}`);
  await initFichateTables();
  await initPipelineTables();
  await initExtraMigrations();
});
