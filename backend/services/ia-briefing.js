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

  // Obtener datos del contacto
  const [personaR, polizasR, historialR, propuestasR, notaR] = await Promise.all([
    pool.query('SELECT nombre, telefono, email, dni, provincia FROM personas WHERE id = $1', [personaId]),
    pool.query(`SELECT compania, producto, prima_mensual, estado FROM polizas
                WHERE persona_id = $1 AND estado NOT IN ('baja','rechazado') LIMIT 5`, [personaId]),
    pool.query(`SELECT tipo, subtipo, titulo, descripcion, created_at
                FROM contact_history WHERE persona_id = $1
                ORDER BY created_at DESC LIMIT 6`, [personaId]),
    pool.query(`SELECT producto, tipo_poliza, prima_mensual, created_at
                FROM propuestas WHERE persona_id = $1
                ORDER BY created_at DESC LIMIT 3`, [personaId]),
    pool.query(`SELECT texto FROM persona_notas WHERE persona_id = $1
                ORDER BY created_at DESC LIMIT 2`, [personaId]),
  ]);

  if (!personaR.rows.length) return null;

  const datos = {
    persona: personaR.rows[0],
    seguros: polizasR.rows,
    historial: historialR.rows,
    propuestas: propuestasR.rows,
    notas: notaR.rows.map(n => n.texto?.substring(0, 200)),
  };

  // Si no hay API key, devolver resumen basico sin IA
  if (!client) {
    return _briefingBasico(datos);
  }

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 400,
      messages: [{
        role: 'user',
        content: `Eres un asistente de ventas de seguros de salud en España.
Analiza este contacto y genera recomendaciones para la proxima llamada.

Datos del contacto:
${JSON.stringify(datos, null, 2)}

Responde SOLO con JSON valido (sin markdown, sin backticks):
{
  "tactica": "una frase corta de que enfoque tomar en la llamada",
  "tono": "cercano|profesional|urgente",
  "oportunidad": "que producto o situacion aprovechar, o null si no hay",
  "evitar": ["cosa a no mencionar"],
  "resumen": "2-3 frases del contexto del cliente"
}`
      }],
    });

    const text = response.content[0]?.text || '';
    // Parsear JSON de la respuesta (puede venir con whitespace)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return _briefingBasico(datos);
  } catch (e) {
    console.error('[IA] Briefing error:', e.message);
    return _briefingBasico(datos);
  }
}

// Briefing basico sin IA (cuando no hay API key o falla)
function _briefingBasico(datos) {
  const hist = datos.historial[0];
  const seguros = datos.seguros.map(s => `${s.producto} (${s.prima_mensual || '?'}/mes)`).join(', ');

  return {
    tactica: datos.seguros.length ? 'Cliente con seguros activos — venta cruzada' : 'Lead sin seguros — primera venta',
    tono: 'cercano',
    oportunidad: datos.propuestas.length ? `Propuesta pendiente: ${datos.propuestas[0].producto}` : null,
    evitar: [],
    resumen: [
      hist ? `Ultima interaccion: ${hist.tipo} ${hist.subtipo || ''} (${_fmtRelative(hist.created_at)})` : 'Sin interacciones previas',
      seguros ? `Seguros: ${seguros}` : 'Sin seguros contratados',
    ].join('. '),
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
