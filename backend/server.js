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

app.listen(PORT, () => {
  console.log(`Avants CRM corriendo en http://localhost:${PORT}`);
});
