const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');

const router = express.Router();
router.use(authMiddleware);
router.use(tenantMiddleware);

const TIPOS_VALIDOS = ['llamada', 'nota', 'etapa', 'email', 'tramite', 'propuesta', 'poliza', 'facebook'];

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
