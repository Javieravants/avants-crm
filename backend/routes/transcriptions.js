// Transcripciones de llamadas — consulta y listado
var express = require('express');
var pool = require('../config/db');
var authMiddleware = require('../middleware/auth');
var tenantMiddleware = require('../middleware/tenant');

var router = express.Router();
router.use(authMiddleware);
router.use(tenantMiddleware);

// GET /api/transcriptions?contact_id=X — transcripciones de un contacto
router.get('/', async function(req, res) {
  try {
    var sql = `SELECT ct.*, p.nombre as contact_nombre
               FROM call_transcriptions ct
               LEFT JOIN personas p ON p.id = ct.contact_id
               WHERE ct.tenant_id = $1`;
    var params = [req.tenantId];
    var idx = 2;

    if (req.query.contact_id) {
      sql += ' AND ct.contact_id = $' + idx;
      params.push(req.query.contact_id);
      idx++;
    }
    if (req.query.estado) {
      sql += ' AND ct.estado = $' + idx;
      params.push(req.query.estado);
      idx++;
    }
    sql += ' ORDER BY ct.created_at DESC LIMIT 50';

    var result = await pool.query(sql, params);
    res.json({ transcriptions: result.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/transcriptions/:id — transcripcion completa con resumen
router.get('/:id', async function(req, res) {
  try {
    var result = await pool.query(
      `SELECT ct.*, p.nombre as contact_nombre, p.telefono as contact_telefono
       FROM call_transcriptions ct
       LEFT JOIN personas p ON p.id = ct.contact_id
       WHERE ct.id = $1 AND ct.tenant_id = $2`,
      [req.params.id, req.tenantId]);
    if (!result.rows.length) return res.status(404).json({ error: 'No encontrada' });
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
