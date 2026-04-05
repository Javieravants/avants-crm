// Transcripcion de audio con Deepgram — nova-2, español
const pool = require('../config/db');

async function transcribirAudio(audioUrl, callTranscriptionId) {
  if (!process.env.DEEPGRAM_API_KEY) {
    throw new Error('DEEPGRAM_API_KEY no configurada');
  }

  console.log('[Deepgram] Iniciando transcripcion para registro #' + callTranscriptionId);

  try {
    // Actualizar estado a procesando
    await pool.query(
      'UPDATE call_transcriptions SET estado = $1, updated_at = NOW() WHERE id = $2',
      ['procesando', callTranscriptionId]);

    // Llamar a Deepgram API directamente (sin SDK para evitar problemas de ESM)
    var response = await fetch('https://api.deepgram.com/v1/listen?' + new URLSearchParams({
      model: 'nova-2',
      language: 'es',
      punctuate: 'true',
      diarize: 'true',
      smart_format: 'true',
    }).toString(), {
      method: 'POST',
      headers: {
        'Authorization': 'Token ' + process.env.DEEPGRAM_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: audioUrl }),
    });

    if (!response.ok) {
      var errText = await response.text();
      throw new Error('Deepgram API error (' + response.status + '): ' + errText.substring(0, 200));
    }

    var data = await response.json();
    var transcript = '';
    var duracion = 0;

    // Extraer transcripcion del resultado
    if (data.results && data.results.channels && data.results.channels[0]) {
      var channel = data.results.channels[0];
      if (channel.alternatives && channel.alternatives[0]) {
        transcript = channel.alternatives[0].transcript || '';
      }
    }

    // Duracion del audio
    if (data.metadata && data.metadata.duration) {
      duracion = Math.round(data.metadata.duration);
    }

    if (!transcript || transcript.length < 10) {
      throw new Error('Transcripcion vacia o demasiado corta');
    }

    // Guardar transcripcion
    await pool.query(
      `UPDATE call_transcriptions
       SET transcripcion = $1, duracion_segundos = $2, estado = 'completado',
           deepgram_job_id = $3, updated_at = NOW()
       WHERE id = $4`,
      [transcript, duracion, data.metadata?.request_id || null, callTranscriptionId]);

    console.log('[Deepgram] Transcripcion completada: ' + transcript.length + ' chars, ' + duracion + 's');

    // Generar resumen con IA (si hay API key)
    await _generarResumenIA(callTranscriptionId, transcript);

    return { transcript, duracion };
  } catch (e) {
    console.error('[Deepgram] Error:', e.message);
    await pool.query(
      `UPDATE call_transcriptions
       SET estado = 'error', error_mensaje = $1, updated_at = NOW()
       WHERE id = $2`,
      [e.message.substring(0, 500), callTranscriptionId]).catch(function() {});
    throw e;
  }
}

async function _generarResumenIA(callTranscriptionId, transcript) {
  var Anthropic;
  try { Anthropic = require('@anthropic-ai/sdk'); } catch(e) { return; }
  if (!Anthropic || !process.env.ANTHROPIC_API_KEY) return;

  try {
    var client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    var response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: 'Eres un supervisor de ventas de seguros. Resume esta llamada en 3-5 lineas. Incluye: que se hablo, resultado (interesado/no interesado/pendiente), y siguiente paso recomendado.\n\nTRANSCRIPCION:\n' + transcript.substring(0, 4000) +
          '\n\nResponde SOLO con JSON:\n{"resumen": "3-5 lineas", "resultado": "interesado|no_interesado|pendiente|ya_cliente|no_contactado"}'
      }],
    });

    var text = response.content[0] && response.content[0].text ? response.content[0].text.trim() : '';
    var jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      var parsed = JSON.parse(jsonMatch[0]);
      await pool.query(
        `UPDATE call_transcriptions
         SET resumen_ia = $1, resultado_llamada = $2, updated_at = NOW()
         WHERE id = $3`,
        [parsed.resumen || text, parsed.resultado || null, callTranscriptionId]);
      console.log('[Deepgram] Resumen IA generado para #' + callTranscriptionId);
    }
  } catch (e) {
    console.error('[Deepgram] Resumen IA error:', e.message);
  }
}

module.exports = { transcribirAudio };
