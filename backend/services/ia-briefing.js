// IA Briefing & Call Analysis — Gestavly
// Pre-llamada: genera briefing con datos del CRM
// Post-llamada: analiza grabacion/datos con IA
const pool = require('../config/db');

let Anthropic;
try { Anthropic = require('@anthropic-ai/sdk'); } catch { Anthropic = null; }

function getClient() {
  if (!Anthropic || !process.env.ANTHROPIC_API_KEY) return null;
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// Modelo rapido y barato para analisis
const MODEL = 'claude-haiku-4-5-20251001';

// ══════════════════════════════════════════════
// BRIEFING PRE-LLAMADA
// ══════════════════════════════════════════════

async function generarBriefing(personaId) {
  const client = getClient();

  // Obtener TODOS los datos relevantes del contacto
  const [personaR, polizasR, dealsWonR, dealsOpenR, llamadasR, notasR, propuestasR] = await Promise.all([
    pool.query(`SELECT nombre, telefono, email, dni, provincia, fecha_nacimiento
                FROM personas WHERE id = $1`, [personaId]),
    // Fuente 1: tabla polizas (grabadas)
    pool.query(`SELECT compania, producto, prima_mensual, estado, n_poliza
                FROM polizas WHERE persona_id = $1
                AND estado NOT IN ('baja','rechazado') ORDER BY created_at DESC LIMIT 10`, [personaId]),
    // Fuente 2: deals ganados (won) — seguros via pipeline
    pool.query(`SELECT d.producto, d.compania, d.prima,
                       pl.name as pipeline
                FROM deals d
                LEFT JOIN pipelines pl ON pl.id = d.pipeline_id
                WHERE d.persona_id = $1
                  AND (d.pipedrive_status = 'won' OR d.estado = 'poliza_activa')
                ORDER BY d.created_at DESC LIMIT 10`, [personaId]),
    // Deals en curso (no ganados, no perdidos)
    pool.query(`SELECT d.producto, d.compania, d.pipedrive_status,
                       pl.name as pipeline, ps.name as etapa
                FROM deals d
                LEFT JOIN pipelines pl ON pl.id = d.pipeline_id
                LEFT JOIN pipeline_stages ps ON ps.id = d.stage_id
                WHERE d.persona_id = $1
                  AND d.pipedrive_status = 'open'
                ORDER BY d.created_at DESC LIMIT 5`, [personaId]),
    pool.query(`SELECT subtipo, titulo, metadata->>'duracion_seg' as duracion, created_at
                FROM contact_history
                WHERE persona_id = $1 AND tipo = 'llamada'
                ORDER BY created_at DESC LIMIT 10`, [personaId]),
    pool.query(`SELECT n.texto, u.nombre as agente, n.created_at
                FROM persona_notas n LEFT JOIN users u ON u.id = n.user_id
                WHERE n.persona_id = $1
                ORDER BY n.created_at DESC LIMIT 5`, [personaId]),
    pool.query(`SELECT producto, tipo_poliza, prima_mensual, created_at
                FROM propuestas WHERE persona_id = $1
                ORDER BY created_at DESC LIMIT 3`, [personaId]),
  ]);

  if (!personaR.rows.length) return null;
  const persona = personaR.rows[0];
  const polizas = polizasR.rows;
  const dealsWon = dealsWonR.rows;
  const dealsOpen = dealsOpenR.rows;
  const llamadas = llamadasR.rows;
  const notas = notasR.rows;
  const propuestas = propuestasR.rows;

  // Combinar seguros de ambas fuentes (polizas + deals won) sin duplicar
  const seguros = [];
  const productosVistos = new Set();
  polizas.forEach(p => {
    const key = `${p.compania}-${p.producto}`.toLowerCase();
    if (!productosVistos.has(key)) {
      productosVistos.add(key);
      seguros.push({ compania: p.compania, producto: p.producto, prima: parseFloat(p.prima_mensual) || 0, fuente: 'poliza' });
    }
  });
  dealsWon.forEach(d => {
    const key = `${d.compania || d.pipeline}-${d.producto}`.toLowerCase();
    if (!productosVistos.has(key)) {
      productosVistos.add(key);
      seguros.push({ compania: d.compania || d.pipeline, producto: d.producto, prima: parseFloat(d.prima) || 0, fuente: 'deal_won' });
    }
  });

  // Calcular edad
  const edad = persona.fecha_nacimiento
    ? Math.floor((Date.now() - new Date(persona.fecha_nacimiento).getTime()) / 31557600000)
    : null;

  // Total prima mensual de todas las fuentes
  const totalPrima = seguros.reduce((sum, s) => sum + s.prima, 0);

  // Productos faltantes (gaps) — comparar con catalogo
  let productosFaltantes = [];
  try {
    const tieneSet = new Set(seguros.map(s => (s.producto || '').toLowerCase()));
    const catalogoR = await pool.query(`
      SELECT p.nombre, p.resumen_coberturas, p.precio_base, p.comision_valor, p.puntos_base,
             c.nombre as compania_nombre, cp.nombre as categoria_nombre
      FROM productos p
      JOIN companias c ON c.id = p.compania_id AND c.activa = true
      LEFT JOIN categorias_producto cp ON cp.id = p.categoria_id
      WHERE p.activo = true
      ORDER BY p.comision_valor DESC NULLS LAST, p.puntos_base DESC
    `);
    productosFaltantes = catalogoR.rows.filter(p => !tieneSet.has(p.nombre.toLowerCase()));
  } catch {}

  // Obtener conocimiento del centro de conocimiento
  let knowledgeGeneral = [], knowledgeCompania = [];
  try {
    // Determinar compania del contacto (del primer seguro o deal)
    const companiaId = seguros[0]?.compania || dealsOpen[0]?.compania || null;
    const kbGeneralR = await pool.query(
      `SELECT tipo, titulo, contenido FROM knowledge_base
       WHERE compania_id IS NULL AND (vigente_hasta IS NULL OR vigente_hasta >= CURRENT_DATE)
       ORDER BY updated_at DESC LIMIT 10`);
    knowledgeGeneral = kbGeneralR.rows;

    if (companiaId) {
      // Buscar por nombre de compania en knowledge_base
      const kbCompR = await pool.query(
        `SELECT kb.tipo, kb.titulo, kb.contenido FROM knowledge_base kb
         JOIN companias c ON c.id = kb.compania_id
         WHERE c.nombre ILIKE $1 AND (kb.vigente_hasta IS NULL OR kb.vigente_hasta >= CURRENT_DATE)
         ORDER BY kb.updated_at DESC LIMIT 10`,
        ['%' + String(companiaId).substring(0, 50) + '%']);
      knowledgeCompania = kbCompR.rows;
    }
  } catch {}

  // Construir contexto estructurado
  const contexto = {
    persona, edad, seguros, dealsOpen, llamadas, notas, propuestas, totalPrima, productosFaltantes,
  };

  if (!client) return _briefingBasico(contexto);

  // Construir prompt estructurado
  let prompt = `Eres un experto en ventas de seguros de salud en España. Analiza este cliente y dame recomendaciones concretas para la proxima llamada.

CLIENTE: ${persona.nombre}${edad ? ', ' + edad + ' años' : ''}${persona.provincia ? ', ' + persona.provincia : ''}

`;

  // Anadir conocimiento del centro de conocimiento
  if (knowledgeGeneral.length || knowledgeCompania.length) {
    prompt += 'CONOCIMIENTO INTERNO DEL EQUIPO:\n';
    [...knowledgeGeneral, ...knowledgeCompania].forEach(k => {
      const tag = k.visibilidad === 'externo'
        ? 'EXTERNO - puedes mencionarlo al cliente'
        : 'INTERNO - CONFIDENCIAL';
      prompt += `- [${tag}] ${k.titulo}: ${k.contenido.substring(0, 150)}\n`;
    });
    prompt += '\nINSTRUCCION CRITICA: El conocimiento INTERNO es estrictamente confidencial. Usalo solo para orientar al agente en su estrategia. NUNCA lo menciones en mensajes, emails, propuestas ni en nada dirigido al cliente. El conocimiento EXTERNO si puede usarse en comunicaciones con el cliente.\n\n';
  }

  if (seguros.length) {
    prompt += `SEGUROS CONTRATADOS (${seguros.length} seguros, ${totalPrima.toFixed(2)} EUR/mes total):\n`;
    seguros.forEach(s => { prompt += `- ${s.compania} ${s.producto}: ${s.prima ? s.prima.toFixed(2) : '?'} EUR/mes\n`; });
  } else {
    prompt += 'SEGUROS CONTRATADOS: Ninguno — primera venta\n';
  }

  if (dealsOpen.length) {
    prompt += '\nDEALS EN CURSO:\n';
    dealsOpen.forEach(d => { prompt += `- ${d.pipeline || ''} → ${d.etapa || ''}: ${d.producto || d.compania || ''}\n`; });
  }

  if (llamadas.length) {
    prompt += '\nHISTORIAL LLAMADAS (ultimas ' + llamadas.length + '):\n';
    llamadas.forEach(l => {
      const fecha = new Date(l.created_at).toLocaleDateString('es-ES');
      prompt += `- ${fecha}: ${l.subtipo || l.titulo || '?'} ${l.duracion ? '(' + l.duracion + 's)' : ''}\n`;
    });
  }

  if (notas.length) {
    prompt += '\nNOTAS DEL EQUIPO:\n';
    notas.forEach(n => {
      const fecha = new Date(n.created_at).toLocaleDateString('es-ES');
      prompt += `- ${fecha} ${n.agente || ''}: ${(n.texto || '').substring(0, 150)}\n`;
    });
  }

  if (propuestas.length) {
    prompt += '\nPROPUESTAS ENVIADAS:\n';
    propuestas.forEach(p => {
      const fecha = new Date(p.created_at).toLocaleDateString('es-ES');
      prompt += `- ${fecha}: ${p.producto || p.tipo_poliza || ''} ${p.prima_mensual ? p.prima_mensual + ' EUR/mes' : ''}\n`;
    });
  }

  if (productosFaltantes.length) {
    // Agrupar por categoria
    const porCat = {};
    productosFaltantes.forEach(p => {
      const cat = p.categoria_nombre || 'Otros';
      if (!porCat[cat]) porCat[cat] = [];
      porCat[cat].push(p);
    });
    prompt += '\nPRODUCTOS QUE LE FALTAN (oportunidades de venta):\n';
    for (const [cat, prods] of Object.entries(porCat)) {
      prompt += `- ${cat}: ${prods.map(p => p.nombre + (p.resumen_coberturas ? ' (' + p.resumen_coberturas.substring(0, 60) + ')' : '')).join(', ')}\n`;
    }
  }

  prompt += `
IMPORTANTE:
- Recomendar PRIMERO los productos faltantes con mayor comision o puntos
- Si tiene propuesta pendiente → recordarle y cerrar antes de ofrecer nuevos
- No sugerir productos que ya tiene
- productos_recomendados debe contener nombres EXACTOS del catalogo

Responde SOLO con JSON valido (sin markdown, sin backticks):
{
  "tactica": "que enfoque tomar en esta llamada",
  "oportunidad": "que producto o situacion aprovechar",
  "tono": "cercano|profesional|urgente",
  "evitar": ["cosa1 a no mencionar", "cosa2"],
  "resumen": "2-3 frases del contexto del cliente",
  "productos_recomendados": ["nombre exacto producto1", "nombre exacto producto2"]
}`;

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      // Enriquecer productos_recomendados con datos del catalogo
      result.productos_detalle = (result.productos_recomendados || []).map(nombre => {
        const found = productosFaltantes.find(p => p.nombre.toLowerCase() === nombre.toLowerCase());
        return found ? { nombre: found.nombre, coberturas: found.resumen_coberturas, precio: found.precio_base, compania: found.compania_nombre, categoria: found.categoria_nombre } : { nombre };
      });
      return result;
    }
    return _briefingBasico(contexto);
  } catch (e) {
    console.error('[IA] Briefing error:', e.message);
    return _briefingBasico(contexto);
  }
}

// Briefing basico sin IA
function _briefingBasico(ctx) {
  const { seguros, propuestas, llamadas, totalPrima, productosFaltantes } = ctx;
  const lastCall = llamadas[0];
  const topGaps = (productosFaltantes || []).slice(0, 3);

  return {
    tactica: seguros.length
      ? `Cliente con ${seguros.length} seguros (${totalPrima.toFixed(0)} EUR/mes) — buscar venta cruzada`
      : 'Lead sin seguros — primera venta',
    tono: 'cercano',
    oportunidad: propuestas.length
      ? `Propuesta pendiente: ${propuestas[0].producto || propuestas[0].tipo_poliza}`
      : topGaps.length ? `Productos faltantes: ${topGaps.map(p => p.nombre).join(', ')}` : null,
    evitar: [],
    resumen: [
      lastCall ? `Ultima llamada: ${lastCall.subtipo || '?'} (${_fmtRelative(lastCall.created_at)})` : 'Sin llamadas previas',
      seguros.length ? `Seguros: ${seguros.map(s => s.producto).join(', ')}` : 'Sin seguros',
    ].join('. '),
    productos_recomendados: topGaps.map(p => p.nombre),
    productos_detalle: topGaps.map(p => ({
      nombre: p.nombre, coberturas: p.resumen_coberturas,
      precio: p.precio_base, compania: p.compania_nombre, categoria: p.categoria_nombre,
    })),
  };
}

// ══════════════════════════════════════════════
// ANALISIS POST-LLAMADA
// ══════════════════════════════════════════════

async function analizarLlamada(callHistoryId) {
  const client = getClient();
  if (!client) {
    console.log('[IA] Analisis omitido — ANTHROPIC_API_KEY no configurada');
    return null;
  }

  // Obtener datos de la llamada
  const chR = await pool.query(`
    SELECT ch.*, p.nombre as persona_nombre, u.nombre as agente_nombre
    FROM contact_history ch
    LEFT JOIN personas p ON p.id = ch.persona_id
    LEFT JOIN users u ON u.id = ch.agente_id
    WHERE ch.id = $1`, [callHistoryId]);

  if (!chR.rows.length) return null;
  const llamada = chR.rows[0];
  const meta = llamada.metadata || {};

  // Intentar transcripcion si hay grabacion y AssemblyAI configurado
  let transcripcion = null;
  if (meta.grabacion_url && process.env.ASSEMBLYAI_API_KEY) {
    try {
      transcripcion = await _transcribir(meta.grabacion_url);
    } catch (e) {
      console.error('[IA] Transcripcion error:', e.message);
    }
  }

  // Construir contexto para analisis
  const contexto = {
    persona: llamada.persona_nombre,
    agente: llamada.agente_nombre,
    duracion_seg: meta.duracion_seg || 0,
    direction: meta.direction || 'outbound',
    resultado: llamada.subtipo,
    titulo: llamada.titulo,
    transcripcion: transcripcion ? transcripcion.substring(0, 3000) : null,
  };

  try {
    const prompt = transcripcion
      ? `Eres un supervisor de ventas de seguros. Analiza esta llamada con transcripcion.

Datos: ${JSON.stringify({ persona: contexto.persona, agente: contexto.agente, duracion: contexto.duracion_seg + 's', direction: contexto.direction })}

Transcripcion:
${transcripcion.substring(0, 3000)}

Responde SOLO con JSON valido:
{
  "puntuacion": 7,
  "resumen": "2-3 frases de lo que paso",
  "puntos_fuertes": ["cosa1"],
  "puntos_mejora": ["cosa1"],
  "siguiente_paso": "que hacer con este cliente",
  "intencion_cliente": "interesado|no_interesado|dudoso|no_contactado"
}`
      : `Eres un supervisor de ventas de seguros. Analiza esta llamada basandote en los datos disponibles (sin transcripcion).

Datos: ${JSON.stringify(contexto)}

Responde SOLO con JSON valido:
{
  "puntuacion": null,
  "resumen": "1-2 frases basadas en los datos",
  "puntos_fuertes": [],
  "puntos_mejora": [],
  "siguiente_paso": "que hacer con este cliente",
  "intencion_cliente": "interesado|no_interesado|dudoso|no_contactado"
}`;

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0]?.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const analisis = JSON.parse(jsonMatch[0]);

    // Guardar analisis como nota automatica en contact_history
    await pool.query(`
      INSERT INTO contact_history
        (persona_id, tipo, subtipo, titulo, descripcion, metadata, origen, tenant_id)
      VALUES ($1, 'nota', 'ia_analisis', 'Analisis IA de llamada',
              $2, $3, 'sistema',
              (SELECT tenant_id FROM contact_history WHERE id = $4))`,
      [
        llamada.persona_id,
        analisis.resumen || 'Analisis completado',
        JSON.stringify({
          ...analisis,
          call_history_id: callHistoryId,
          transcripcion_disponible: !!transcripcion,
        }),
        callHistoryId,
      ]);

    console.log(`[IA] Analisis completado para llamada #${callHistoryId}: ${analisis.intencion_cliente}`);
    return analisis;
  } catch (e) {
    console.error('[IA] Analisis error:', e.message);
    return null;
  }
}

// ══════════════════════════════════════════════
// TRANSCRIPCION (AssemblyAI)
// ══════════════════════════════════════════════

async function _transcribir(audioUrl) {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) return null;

  // Crear transcripcion
  const r = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: { Authorization: apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audio_url: audioUrl,
      language_code: 'es',
    }),
  });
  const data = await r.json();
  if (!data.id) throw new Error('AssemblyAI: no transcript ID');

  // Polling hasta completar (max 5 min)
  const transcriptId = data.id;
  for (let i = 0; i < 60; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000));

    const statusR = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
      headers: { Authorization: apiKey },
    });
    const status = await statusR.json();

    if (status.status === 'completed') {
      return status.text;
    }
    if (status.status === 'error') {
      throw new Error('AssemblyAI: ' + (status.error || 'transcription failed'));
    }
  }

  throw new Error('AssemblyAI: timeout');
}

// Helper
function _fmtRelative(date) {
  if (!date) return '';
  const h = (Date.now() - new Date(date).getTime()) / 3600000;
  if (h < 1) return 'hace ' + Math.round(h * 60) + 'min';
  if (h < 24) return 'hace ' + Math.round(h) + 'h';
  const d = Math.round(h / 24);
  if (d === 1) return 'ayer';
  return 'hace ' + d + ' dias';
}

module.exports = { generarBriefing, analizarLlamada };
