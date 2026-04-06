const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');

const router = express.Router();
router.use(authMiddleware);
router.use(tenantMiddleware);

const TIPOS_VALIDOS = ['llamada', 'nota', 'etapa', 'email', 'tramite', 'propuesta', 'poliza', 'facebook'];

// GET /api/history/recordings/list — llamadas CloudTalk con grabación
router.get('/recordings/list', async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  try {
    const { rows } = await pool.query(`
      SELECT ch.id, ch.persona_id, ch.titulo, ch.descripcion, ch.subtipo,
             ch.metadata, ch.agente_id, ch.created_at,
             p.nombre as persona_nombre, p.telefono as persona_telefono,
             u.nombre as agente_nombre
      FROM contact_history ch
      JOIN personas p ON p.id = ch.persona_id
      LEFT JOIN users u ON u.id = ch.agente_id
      WHERE ch.tipo = 'llamada'
        AND ch.origen = 'cloudtalk'
        AND ch.metadata->>'grabacion_url' IS NOT NULL
        AND ch.metadata->>'grabacion_url' != ''
        AND ch.tenant_id = $1
      ORDER BY ch.created_at DESC
      LIMIT $2 OFFSET $3
    `, [req.tenantId, limit, offset]);

    const countR = await pool.query(`
      SELECT COUNT(*) as total FROM contact_history
      WHERE tipo = 'llamada' AND origen = 'cloudtalk'
        AND metadata->>'grabacion_url' IS NOT NULL
        AND metadata->>'grabacion_url' != ''
        AND tenant_id = $1
    `, [req.tenantId]);

    res.json({ success: true, data: rows, total: parseInt(countR.rows[0].total) });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET /api/history/:persona_id
router.get('/:persona_id', async (req, res) => {
  const { tipo, limit = 50, offset = 0 } = req.query;
  const personaId = req.params.persona_id;

  try {
    let where = 'ch.persona_id = $1 AND ch.tenant_id = ' + req.tenantId;
    const params = [personaId];
    let idx = 2;

    if (tipo && TIPOS_VALIDOS.includes(tipo)) {
      where += ` AND ch.tipo = $${idx}`;
      params.push(tipo);
      idx++;
    }

    params.push(parseInt(limit), parseInt(offset));

    const [dataR, countR] = await Promise.all([
      pool.query(`
        SELECT ch.*, u.nombre as agente_nombre
        FROM contact_history ch
        LEFT JOIN users u ON ch.agente_id = u.id
        WHERE ${where}
        ORDER BY ch.created_at DESC
        LIMIT $${idx} OFFSET $${idx + 1}
      `, params),
      pool.query(`SELECT COUNT(*) as total FROM contact_history ch WHERE ${where}`, params.slice(0, idx - 1))
    ]);

    res.json({ success: true, data: dataR.rows, total: parseInt(countR.rows[0].total) });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET /api/history/deal/:deal_id — historial de un deal específico
router.get('/deal/:deal_id', async (req, res) => {
  const dealId = req.params.deal_id;
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;

  try {
    const [dataR, countR] = await Promise.all([
      pool.query(`
        SELECT ch.*, u.nombre as agente_nombre
        FROM contact_history ch
        LEFT JOIN users u ON ch.agente_id = u.id
        WHERE ch.deal_id = $1 AND ch.tenant_id = $2
        ORDER BY ch.created_at DESC
        LIMIT $3 OFFSET $4
      `, [dealId, req.tenantId, limit, offset]),
      pool.query('SELECT COUNT(*) as total FROM contact_history WHERE deal_id = $1 AND tenant_id = $2', [dealId, req.tenantId])
    ]);

    res.json({ success: true, data: dataR.rows, total: parseInt(countR.rows[0].total) });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// POST /api/history
router.post('/', async (req, res) => {
  const { persona_id, deal_id, tipo, subtipo, titulo, descripcion, metadata, agente_id, origen } = req.body;

  if (!persona_id || !tipo) {
    return res.status(400).json({ success: false, error: 'persona_id y tipo son obligatorios' });
  }
  if (!TIPOS_VALIDOS.includes(tipo)) {
    return res.status(400).json({ success: false, error: 'Tipo inválido: ' + tipo });
  }

  try {
    const r = await pool.query(
      `INSERT INTO contact_history (persona_id, deal_id, tipo, subtipo, titulo, descripcion, metadata, agente_id, origen)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [persona_id, deal_id || null, tipo, subtipo || null, titulo || null,
       descripcion || null, JSON.stringify(metadata || {}), agente_id || req.user.id, origen || 'manual']
    );
    res.status(201).json({ success: true, data: r.rows[0] });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Función helper para registrar eventos desde otros módulos
async function registrarEvento(personaId, tipo, datos = {}) {
  if (!personaId || !tipo) return;
  try {
    await pool.query(
      `INSERT INTO contact_history (persona_id, deal_id, tipo, subtipo, titulo, descripcion, metadata, agente_id, origen)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [personaId, datos.deal_id || null, tipo, datos.subtipo || null, datos.titulo || null,
       datos.descripcion || null, JSON.stringify(datos.metadata || {}), datos.agente_id || null, datos.origen || 'sistema']
    );
  } catch (e) {
    console.error('Error registrando evento historial:', e.message);
  }
}

module.exports = router;
module.exports.registrarEvento = registrarEvento;
