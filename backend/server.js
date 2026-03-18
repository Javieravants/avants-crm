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
    const fs = require('fs');
    const migPath = path.join(__dirname, 'config/migration-fichate-ionos.sql');
    if (fs.existsSync(migPath)) {
      const sql = fs.readFileSync(migPath, 'utf8');
      await pool.query(sql);
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
    }
  } catch (e) {
    console.warn('Fichate init warning:', e.message);
  }
}

app.listen(PORT, async () => {
  console.log(`Avants CRM corriendo en http://localhost:${PORT}`);
  await initFichateTables();
});
