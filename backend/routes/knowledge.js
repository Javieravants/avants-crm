// Centro de Conocimiento — base de conocimiento + chat IA
const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');
const requireRole = require('../middleware/roles');

const router = express.Router();
router.use(authMiddleware);
router.use(tenantMiddleware);

const TIPOS_VALIDOS = ['compania', 'negocio', 'campana', 'argumentario', 'objecion', 'restriccion', 'mercado'];

// ══════════════════════════════════════════════
// CRUD KNOWLEDGE BASE
// ══════════════════════════════════════════════

// GET /api/knowledge — listar todo, filtro por tipo y compania_id
router.get('/', async (req, res) => {
  try {
    var sql = `SELECT kb.*, c.nombre as compania_nombre
               FROM knowledge_base kb
               LEFT JOIN companias c ON c.id = kb.compania_id
               WHERE kb.tenant_id = $1`;
    var params = [req.tenantId];
    var idx = 2;

    if (req.query.tipo) {
      sql += ` AND kb.tipo = $${idx}`;
      params.push(req.query.tipo);
      idx++;
    }
    if (req.query.compania_id) {
      sql += ` AND kb.compania_id = $${idx}`;
      params.push(req.query.compania_id);
      idx++;
    }
    sql += ' ORDER BY kb.updated_at DESC';

    var { rows } = await pool.query(sql, params);
    res.json({ items: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/knowledge — crear entrada
router.post('/', requireRole('admin', 'supervisor'), async (req, res) => {
  try {
    var { tipo, titulo, contenido, compania_id, vigente_hasta, visibilidad } = req.body;
    if (!tipo || !titulo || !contenido) {
      return res.status(400).json({ error: 'tipo, titulo y contenido obligatorios' });
    }
    if (!TIPOS_VALIDOS.includes(tipo)) {
      return res.status(400).json({ error: 'Tipo invalido. Validos: ' + TIPOS_VALIDOS.join(', ') });
    }
    var vis = ['admin', 'agentes', 'todos'].includes(visibilidad) ? visibilidad : 'agentes';

    var r = await pool.query(
      `INSERT INTO knowledge_base (tenant_id, tipo, titulo, contenido, compania_id, vigente_hasta, visibilidad)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.tenantId, tipo, titulo, contenido, compania_id || null, vigente_hasta || null, vis]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/knowledge/:id — editar entrada
router.put('/:id', requireRole('admin', 'supervisor'), async (req, res) => {
  try {
    var fields = []; var vals = []; var idx = 1;
    for (var key of ['tipo', 'titulo', 'contenido', 'compania_id', 'vigente_hasta', 'visibilidad']) {
      if (req.body[key] !== undefined) {
        fields.push(key + ' = $' + idx);
        vals.push(req.body[key]);
        idx++;
      }
    }
    if (!fields.length) return res.status(400).json({ error: 'Nada que actualizar' });
    fields.push('updated_at = NOW()');
    vals.push(req.params.id, req.tenantId);
    var r = await pool.query(
      'UPDATE knowledge_base SET ' + fields.join(', ') + ' WHERE id = $' + idx + ' AND tenant_id = $' + (idx + 1) + ' RETURNING *',
      vals);
    if (!r.rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/knowledge/:id
router.delete('/:id', requireRole('admin', 'supervisor'), async (req, res) => {
  try {
    await pool.query('DELETE FROM knowledge_base WHERE id = $1 AND tenant_id = $2',
      [req.params.id, req.tenantId]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════
// CONTEXTO PARA BRIEFING (uso interno)
// ══════════════════════════════════════════════

// GET /api/knowledge/context?compania_id=X
router.get('/context', async (req, res) => {
  try {
    var companiaId = req.query.compania_id;

    // Conocimiento general de negocio (sin compania)
    // General: negocio + mercado (sin compania_id). Excluir visibilidad admin.
    var generalR = await pool.query(
      `SELECT tipo, titulo, contenido, visibilidad FROM knowledge_base
       WHERE tenant_id = $1 AND compania_id IS NULL
         AND tipo IN ('negocio', 'mercado')
         AND visibilidad IN ('agentes', 'todos')
         AND (vigente_hasta IS NULL OR vigente_hasta >= CURRENT_DATE)
       ORDER BY updated_at DESC LIMIT 20`,
      [req.tenantId]);

    // Compania: solo conocimiento de ESA compania (aislamiento)
    var companiaR = { rows: [] };
    if (companiaId) {
      companiaR = await pool.query(
        `SELECT tipo, titulo, contenido, visibilidad FROM knowledge_base
         WHERE tenant_id = $1 AND compania_id = $2
           AND visibilidad IN ('agentes', 'todos')
           AND (vigente_hasta IS NULL OR vigente_hasta >= CURRENT_DATE)
         ORDER BY updated_at DESC LIMIT 20`,
        [req.tenantId, companiaId]);
    }

    res.json({
      general: generalR.rows,
      compania: companiaR.rows,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════
// CHAT IA — extrae conocimiento automaticamente
// ══════════════════════════════════════════════

// GET /api/knowledge/chat — historial de conversaciones
router.get('/chat', async (req, res) => {
  try {
    var { rows } = await pool.query(
      `SELECT kc.*, u.nombre as user_nombre
       FROM knowledge_chat kc
       LEFT JOIN users u ON u.id = kc.user_id
       WHERE kc.tenant_id = $1
       ORDER BY kc.created_at DESC LIMIT 50`,
      [req.tenantId]);
    res.json({ chats: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/knowledge/chat — enviar mensaje, IA extrae y guarda conocimiento
router.post('/chat', requireRole('admin', 'supervisor'), async (req, res) => {
  try {
    var { mensaje } = req.body;
    if (!mensaje) return res.status(400).json({ error: 'mensaje obligatorio' });

    var Anthropic;
    try { Anthropic = require('@anthropic-ai/sdk'); } catch (e) { Anthropic = null; }
    if (!Anthropic || !process.env.ANTHROPIC_API_KEY) {
      return res.status(400).json({ error: 'ANTHROPIC_API_KEY no configurada' });
    }

    // Obtener companias para contexto
    var companiasR = await pool.query(
      'SELECT id, nombre FROM companias WHERE tenant_id = $1 AND activa = true', [req.tenantId]);
    var companiasList = companiasR.rows.map(function(c) { return c.id + ':' + c.nombre; }).join(', ');

    // Detectar comando de cambio de visibilidad
    var cambioMatch = mensaje.match(/cambia(?:lo|r)\s+a\s+(solo\s*admin|solo\s*equipo|publico|p[uú]blico)/i);
    if (cambioMatch && req.body.last_knowledge_id) {
      var nuevoVis = cambioMatch[1].toLowerCase().replace(/\s+/g, '');
      var visMap = { soloadmin: 'admin', soloequipo: 'agentes', publico: 'todos', público: 'todos' };
      var newVis = visMap[nuevoVis] || 'agentes';
      var visLabels = { admin: 'Solo admin', agentes: 'Solo equipo', todos: 'Publico' };
      await pool.query(
        'UPDATE knowledge_base SET visibilidad = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3',
        [newVis, req.body.last_knowledge_id, req.tenantId]);
      return res.json({
        respuesta: 'Actualizado a ' + visLabels[newVis],
        guardados: [],
        last_knowledge_id: req.body.last_knowledge_id,
      });
    }

    var client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    var systemPrompt = 'Eres un asistente que gestiona el conocimiento de una correduria de seguros.\n\nCompanias: ' + companiasList + '\n\nTipos: compania, negocio, campana, argumentario, objecion, restriccion, mercado\n\nREGLAS DE VISIBILIDAD (OBLIGATORIAS — inferir del contenido):\n\nAsigna "admin" cuando contenga: datos financieros (margenes, comisiones en %, facturacion, costes), info estrategica confidencial, objetivos numericos, rendimiento de agentes, contratos, precios de coste, o el usuario diga "solo para mi"/"confidencial".\n\nAsigna "agentes" cuando contenga: instrucciones operativas, campanas/incentivos internos, restricciones de venta, argumentarios, objeciones, info de mercado para estrategia. Es el valor por defecto cuando no esta claro.\n\nAsigna "todos" cuando el usuario diga explicitamente "puedes decirselo al cliente"/"es publico", o sea info de ventajas/ofertas que el cliente puede conocer.\n\nPRIORIDAD: si el usuario especifica nivel explicitamente, SIEMPRE usar ese nivel.\n\nResponde SOLO con JSON valido (sin markdown):\n{\n  "respuesta": "Confirmacion con formato:\\nGuardado: [titulo]\\nTipo: [tipo]\\nVisibilidad: [nivel] — [explicacion breve de por que]\\n\\nQuieres cambiarlo? Puedes decirme: cambialo a solo admin / cambialo a solo equipo / cambialo a publico",\n  "conocimiento": [{"tipo":"...","titulo":"...","contenido":"...","compania_id":null,"visibilidad":"admin|agentes|todos"}]\n}\n\nSi no hay conocimiento extraible, devuelve conocimiento como array vacio.';

    var response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: 'user', content: mensaje }],
    });

    var text = response.content[0] && response.content[0].text ? response.content[0].text.trim() : '';
    var jsonMatch = text.match(/\{[\s\S]*\}/);
    var parsed = { respuesta: 'No pude procesar el mensaje.', conocimiento: [] };
    if (jsonMatch) {
      try { parsed = JSON.parse(jsonMatch[0]); } catch (e) { /* keep default */ }
    }

    // Guardar conocimiento extraido en knowledge_base
    var guardados = [];
    var lastId = null;
    if (parsed.conocimiento && parsed.conocimiento.length > 0) {
      for (var i = 0; i < parsed.conocimiento.length; i++) {
        var k = parsed.conocimiento[i];
        if (k.titulo && k.contenido && TIPOS_VALIDOS.includes(k.tipo)) {
          var kVis = ['admin', 'agentes', 'todos'].includes(k.visibilidad) ? k.visibilidad : 'agentes';
          var insertR = await pool.query(
            `INSERT INTO knowledge_base (tenant_id, tipo, titulo, contenido, compania_id, visibilidad)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, titulo, visibilidad, tipo`,
            [req.tenantId, k.tipo, k.titulo, k.contenido, k.compania_id || null, kVis]);
          guardados.push(insertR.rows[0]);
          lastId = insertR.rows[0].id;
        }
      }
    }

    // Guardar conversacion
    var extraidoText = guardados.length > 0
      ? guardados.map(function(g) { return g.titulo; }).join(', ')
      : null;

    await pool.query(
      `INSERT INTO knowledge_chat (tenant_id, user_id, mensaje_usuario, respuesta_ia, conocimiento_extraido)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.tenantId, req.user.id, mensaje, parsed.respuesta, extraidoText]);

    res.json({
      respuesta: parsed.respuesta,
      guardados: guardados,
      last_knowledge_id: lastId,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
