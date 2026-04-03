const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const WA_TOKEN    = process.env.WHATSAPP_TOKEN;
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WA_API_URL  = `https://graph.facebook.com/v19.0/${WA_PHONE_ID}/messages`;

function normalizarTelefono(tel) {
  // Entrada:  +34604989783 | 34604989783 | 604989783
  // Salida:   34604989783  (sin + para Meta API)
  const digits = (tel || '').replace(/\D/g, '');
  return digits.startsWith('34') ? digits : `34${digits}`;
}

async function registrarEnHistorial(personaId, agenteId, descripcion, metadata = {}) {
  await pool.query(
    `INSERT INTO contact_history
     (persona_id, agente_id, tipo, descripcion, origen, metadata)
     VALUES ($1, $2, 'whatsapp', $3, 'sistema', $4)`,
    [personaId, agenteId, descripcion, JSON.stringify(metadata)]
  );
}

async function enviarMeta(payload) {
  const res = await fetch(WA_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WA_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Token de WhatsApp caducado. Regenerar en Meta Developers.');
    }
    throw new Error(data.error?.message || 'Error Meta API');
  }
  return data;
}

// POST /api/whatsapp/send/texto
router.post('/send/texto', async (req, res) => {
  const { persona_id, mensaje } = req.body;
  const agente_id = req.user.id;
  try {
    const persona = await pool.query(
      'SELECT id, nombre, telefono FROM personas WHERE id = $1', [persona_id]
    );
    if (!persona.rows.length) return res.status(404).json({ error: 'Contacto no encontrado' });

    const telefono = normalizarTelefono(persona.rows[0].telefono);

    const metaRes = await enviarMeta({
      messaging_product: 'whatsapp',
      to: telefono,
      type: 'text',
      text: { body: mensaje },
    });
    const whatsapp_msg_id = metaRes.messages?.[0]?.id;

    await pool.query(
      `INSERT INTO whatsapp_messages
       (persona_id, agente_id, direccion, tipo, contenido, whatsapp_msg_id)
       VALUES ($1, $2, 'saliente', 'texto', $3, $4)`,
      [persona_id, agente_id, mensaje, whatsapp_msg_id]
    );
    await registrarEnHistorial(
      persona_id, agente_id,
      `WhatsApp enviado: "${mensaje.substring(0, 80)}${mensaje.length > 80 ? '...' : ''}"`,
      { whatsapp_msg_id, tipo: 'texto' }
    );
    res.json({ ok: true, whatsapp_msg_id });
  } catch (err) {
    console.error('WA send/texto error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/whatsapp/send/propuesta
router.post('/send/propuesta', async (req, res) => {
  const { persona_id, propuesta_id } = req.body;
  const agente_id = req.user.id;
  try {
    const [personaQ, propuestaQ] = await Promise.all([
      pool.query('SELECT id, nombre, telefono FROM personas WHERE id = $1', [persona_id]),
      pool.query(
        `SELECT id, pdf_url, tipo_poliza, prima_mensual
         FROM propuestas WHERE id = $1 AND persona_id = $2`,
        [propuesta_id, persona_id]
      ),
    ]);
    if (!personaQ.rows.length) return res.status(404).json({ error: 'Contacto no encontrado' });
    if (!propuestaQ.rows.length) return res.status(404).json({ error: 'Propuesta no encontrada' });

    const persona   = personaQ.rows[0];
    const propuesta = propuestaQ.rows[0];

    const telefono = normalizarTelefono(persona.telefono);
    const pdfLink = `https://app.gestavly.com/api/calculadora/propuestas/${propuesta.id}/pdf`;
    const mensaje = `Hola ${persona.nombre}, te envío tu propuesta de ${propuesta.tipo_poliza || 'seguro'} (${propuesta.prima_mensual}€/mes).\n\nDescarga tu propuesta aquí:\n${pdfLink}\n\nSi tienes cualquier duda, estoy a tu disposición.`;

    const metaRes = await enviarMeta({
      messaging_product: 'whatsapp',
      to: telefono,
      type: 'text',
      text: { body: mensaje },
    });
    const whatsapp_msg_id = metaRes.messages?.[0]?.id;

    await pool.query(
      `INSERT INTO whatsapp_messages
       (persona_id, agente_id, direccion, tipo, contenido, whatsapp_msg_id)
       VALUES ($1, $2, 'saliente', 'texto', $3, $4)`,
      [persona_id, agente_id, mensaje, whatsapp_msg_id]
    );
    await registrarEnHistorial(
      persona_id, agente_id,
      `Propuesta enviada por WhatsApp: ${propuesta.tipo_poliza} — ${propuesta.prima_mensual}€/mes`,
      { propuesta_id, whatsapp_msg_id, pdf_link: pdfLink }
    );
    res.json({ ok: true, whatsapp_msg_id });
  } catch (err) {
    console.error('WA send/propuesta error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/whatsapp/history/:persona_id
router.get('/history/:persona_id', async (req, res) => {
  const { persona_id } = req.params;
  const { limit = 50, offset = 0 } = req.query;
  try {
    const result = await pool.query(
      `SELECT wm.*, u.nombre as agente_nombre
       FROM whatsapp_messages wm
       LEFT JOIN users u ON u.id = wm.agente_id
       WHERE wm.persona_id = $1
       ORDER BY wm.created_at DESC
       LIMIT $2 OFFSET $3`,
      [persona_id, limit, offset]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
