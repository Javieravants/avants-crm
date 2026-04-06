// Resultados post-llamada — sugerencias IA + guardado + acciones
var express = require('express');
var pool = require('../config/db');
var authMiddleware = require('../middleware/auth');
var tenantMiddleware = require('../middleware/tenant');

var router = express.Router();
router.use(authMiddleware);
router.use(tenantMiddleware);

// POST /api/call-results/suggest — IA sugiere resultado y accion
router.post('/suggest', async function(req, res) {
  try {
    var { contact_id, duracion_segundos } = req.body;
    if (!contact_id) return res.status(400).json({ error: 'contact_id obligatorio' });
    var dur = parseInt(duracion_segundos) || 0;

    // Datos del contacto
    var personaR = await pool.query(
      'SELECT nombre, provincia, telefono FROM personas WHERE id = $1', [contact_id]);
    var persona = personaR.rows[0] || {};

    // Historial reciente
    var histR = await pool.query(
      `SELECT tipo, subtipo, titulo, created_at FROM contact_history
       WHERE persona_id = $1 ORDER BY created_at DESC LIMIT 5`, [contact_id]);

    // Propuestas disponibles
    var propsR = await pool.query(
      `SELECT id, producto, tipo_poliza, prima_mensual, pdf_url, created_at
       FROM propuestas WHERE persona_id = $1 ORDER BY created_at DESC LIMIT 5`, [contact_id]);

    // Companias para derivacion
    var compR = await pool.query(
      'SELECT id, nombre FROM companias WHERE tenant_id = $1 AND activa = true', [req.tenantId]);

    // Conocimiento relevante
    var kbR = await pool.query(
      `SELECT tipo, titulo, contenido FROM knowledge_base
       WHERE tenant_id = $1 AND visibilidad IN ('agentes','todos')
         AND (vigente_hasta IS NULL OR vigente_hasta >= CURRENT_DATE)
       ORDER BY updated_at DESC LIMIT 10`, [req.tenantId]);

    // Llamar a la IA
    var Anthropic;
    try { Anthropic = require('@anthropic-ai/sdk'); } catch(e) { Anthropic = null; }

    var suggestion = {
      resultado_sugerido: dur < 15 ? 'no_contesto' : dur < 60 ? 'pendiente' : 'interesado',
      accion_sugerida: propsR.rows.length ? 'whatsapp' : 'ninguna',
      razonamiento: dur < 15 ? 'Llamada muy corta, probablemente no contesto' : 'Analisis basado en duracion',
      compania_derivacion_id: null,
      mensaje_whatsapp: null,
    };

    if (Anthropic && process.env.ANTHROPIC_API_KEY) {
      try {
        var client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        var prompt = 'Analiza esta llamada y sugiere resultado y accion.\n\n' +
          'CONTACTO: ' + persona.nombre + (persona.provincia ? ', ' + persona.provincia : '') + '\n' +
          'DURACION: ' + dur + ' segundos\n' +
          'HISTORIAL: ' + histR.rows.map(function(h) { return h.tipo + ' ' + (h.subtipo || '') + ' (' + new Date(h.created_at).toLocaleDateString('es-ES') + ')'; }).join(', ') + '\n' +
          'PROPUESTAS EXISTENTES: ' + (propsR.rows.length ? propsR.rows.map(function(p) { return (p.producto || p.tipo_poliza) + ' ' + (p.prima_mensual || '') + ' EUR/mes'; }).join(', ') : 'Ninguna') + '\n' +
          'CONOCIMIENTO: ' + kbR.rows.map(function(k) { return '[' + k.tipo + '] ' + k.titulo; }).join(', ') + '\n\n' +
          'REGLAS: <15s=no_contesto, 15-60s=pendiente o no_interesado, >60s=analizar. Si hay propuestas→sugerir WhatsApp.\n\n' +
          'Si accion=whatsapp, genera mensaje para el contacto con formato amigable:\nHola [nombre]...\n\n' +
          'DEVUELVE SOLO JSON:\n{"resultado_sugerido":"interesado|pendiente|no_interesado|cerrado|no_contesto|volver_llamar","accion_sugerida":"whatsapp|email|agendar|derivar|ninguna","razonamiento":"explicacion breve","compania_derivacion_id":null,"mensaje_whatsapp":"mensaje o null"}';

        var response = await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 500,
          messages: [{ role: 'user', content: prompt }],
        });
        var text = response.content[0] && response.content[0].text ? response.content[0].text.trim() : '';
        var match = text.match(/\{[\s\S]*\}/);
        if (match) {
          var parsed = JSON.parse(match[0]);
          suggestion = {
            resultado_sugerido: parsed.resultado_sugerido || suggestion.resultado_sugerido,
            accion_sugerida: parsed.accion_sugerida || suggestion.accion_sugerida,
            razonamiento: parsed.razonamiento || suggestion.razonamiento,
            compania_derivacion_id: parsed.compania_derivacion_id || null,
            mensaje_whatsapp: parsed.mensaje_whatsapp || null,
          };
        }
      } catch(e) {
        console.error('[CallResults] IA suggest error:', e.message);
      }
    }

    res.json({
      suggestion: suggestion,
      propuestas: propsR.rows,
      companias: compR.rows,
      contacto: persona,
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// POST /api/call-results — guardar resultado final
router.post('/', async function(req, res) {
  try {
    var { contact_id, duracion_segundos, resultado, accion_siguiente,
          compania_derivacion_id, propuestas_enviadas, notas, mensaje_whatsapp,
          ia_sugerencia_resultado, ia_sugerencia_accion, ia_razonamiento } = req.body;

    if (!contact_id || !resultado) {
      return res.status(400).json({ error: 'contact_id y resultado obligatorios' });
    }

    // Guardar en call_results
    var insertR = await pool.query(
      `INSERT INTO call_results
        (tenant_id, contact_id, agent_id, duracion_segundos, resultado, accion_siguiente,
         compania_derivacion_id, propuestas_enviadas, notas, mensaje_whatsapp,
         ia_sugerencia_resultado, ia_sugerencia_accion, ia_razonamiento)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
      [req.tenantId, contact_id, req.user.id, duracion_segundos || 0,
       resultado, accion_siguiente || 'ninguna',
       compania_derivacion_id || null, propuestas_enviadas || [],
       notas || null, mensaje_whatsapp || null,
       ia_sugerencia_resultado || null, ia_sugerencia_accion || null, ia_razonamiento || null]);

    // INSERT en contact_history (nunca UPDATE/DELETE)
    var { registrarEvento } = require('./history');
    registrarEvento(contact_id, 'llamada', {
      subtipo: resultado === 'no_contesto' ? 'no_contestada' : 'contestada',
      titulo: 'Resultado: ' + resultado + (accion_siguiente ? ' → ' + accion_siguiente : ''),
      descripcion: notas || 'Resultado post-llamada: ' + resultado,
      agente_id: req.user.id,
      origen: 'sistema',
      metadata: { call_result_id: insertR.rows[0].id, resultado: resultado, accion: accion_siguiente },
    });

    // Ejecutar accion
    if (accion_siguiente === 'whatsapp' && mensaje_whatsapp && contact_id) {
      try {
        var personaR = await pool.query('SELECT telefono FROM personas WHERE id = $1', [contact_id]);
        var tel = personaR.rows[0] && personaR.rows[0].telefono;
        if (tel) {
          var waToken = process.env.WHATSAPP_TOKEN;
          var waPhoneId = process.env.WHATSAPP_PHONE_ID;
          if (waToken && waPhoneId) {
            var digits = (tel || '').replace(/\D/g, '');
            var waNum = digits.startsWith('34') ? digits : '34' + digits;
            await fetch('https://graph.facebook.com/v19.0/' + waPhoneId + '/messages', {
              method: 'POST',
              headers: { Authorization: 'Bearer ' + waToken, 'Content-Type': 'application/json' },
              body: JSON.stringify({ messaging_product: 'whatsapp', to: waNum, type: 'text', text: { body: mensaje_whatsapp } }),
            });
            await pool.query(
              `INSERT INTO whatsapp_messages (persona_id, agente_id, direccion, tipo, contenido)
               VALUES ($1, $2, 'saliente', 'texto', $3)`,
              [contact_id, req.user.id, mensaje_whatsapp]);
          }
        }
      } catch(e) { console.error('[CallResults] WA send error:', e.message); }
    }

    if (accion_siguiente === 'agendar' && contact_id) {
      try {
        // Agendar en franja contraria: manana→tarde, tarde→manana siguiente
        var ahora = new Date();
        var hora = ahora.getHours();
        var fecha = new Date(ahora);
        if (hora < 14) { fecha.setHours(16, 0, 0, 0); } // manana→tarde
        else { fecha.setDate(fecha.getDate() + 1); fecha.setHours(10, 0, 0, 0); } // tarde→manana

        await pool.query(
          `INSERT INTO tareas (persona_id, agente_id, tipo, titulo, fecha_venc, estado, tenant_id)
           VALUES ($1, $2, 'llamada', 'Callback agendado', $3, 'pendiente', $4)`,
          [contact_id, req.user.id, fecha.toISOString(), req.tenantId]);
      } catch(e) { console.error('[CallResults] Agendar error:', e.message); }
    }

    res.json({ ok: true, id: insertR.rows[0].id });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// GET /api/call-results?contact_id=X
router.get('/', async function(req, res) {
  try {
    var sql = `SELECT cr.*, u.nombre as agent_nombre
               FROM call_results cr
               LEFT JOIN users u ON u.id = cr.agent_id
               WHERE cr.tenant_id = $1`;
    var params = [req.tenantId];
    var idx = 2;
    if (req.query.contact_id) {
      sql += ' AND cr.contact_id = $' + idx;
      params.push(req.query.contact_id); idx++;
    }
    sql += ' ORDER BY cr.created_at DESC LIMIT 50';
    var result = await pool.query(sql, params);
    res.json({ results: result.rows });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
