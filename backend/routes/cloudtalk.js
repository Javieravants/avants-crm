const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const CT_BASE_V1 = 'https://api.cloudtalk.io/api';
const CT_BASE_V2 = 'https://api.cloudtalk.io/v1';

function ctAuth() {
  const key = process.env.CLOUDTALK_API_KEY;
  const secret = process.env.CLOUDTALK_API_SECRET;
  if (!key || !secret) return null;
  return 'Basic ' + Buffer.from(key + ':' + secret).toString('base64');
}

// GET /api/cloudtalk/status — verificar conexión con CloudTalk
router.get('/status', async (req, res) => {
  const auth = ctAuth();
  if (!auth) return res.status(500).json({ error: 'CLOUDTALK_API_KEY o CLOUDTALK_API_SECRET no configuradas' });

  try {
    const r = await fetch(CT_BASE_V1 + '/agents.json', { headers: { Authorization: auth } });
    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: 'CloudTalk API error', detail: data });
    res.json({ ok: true, agents: (data.responseData || data.data || []).length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/cloudtalk/call — iniciar llamada click-to-call
router.post('/call', async (req, res) => {
  const { phone, persona_id, persona_nombre, agent_email } = req.body;
  if (!phone) return res.status(400).json({ error: 'phone obligatorio' });

  const auth = ctAuth();
  if (!auth) return res.status(500).json({ error: 'CloudTalk no configurado' });

  try {
    // Buscar el voice_agent_id del agente en CloudTalk por email
    const email = agent_email || req.user.email;
    const agentsR = await fetch(CT_BASE_V1 + '/agents.json', { headers: { Authorization: auth } });
    const agentsData = await agentsR.json();
    const agents = agentsData.data || agentsData.responseData || [];
    const ctAgent = agents.find(a => a.email === email);

    if (!ctAgent) {
      // Registrar igualmente y hacer fallback
      if (persona_id) {
        await pool.query(
          'INSERT INTO persona_notas (persona_id, user_id, texto) VALUES ($1, $2, $3)',
          [persona_id, req.user.id, `Llamada a ${phone} (agente no encontrado en CloudTalk)`]
        );
      }
      return res.status(502).json({ error: 'Agente no encontrado en CloudTalk', email });
    }

    // Iniciar llamada via CloudTalk API v1
    const r = await fetch(CT_BASE_V2 + '/voice-agent/calls', {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        voice_agent_id: String(ctAgent.id),
        call_number: phone,
      }),
    });
    const data = await r.json();

    if (!r.ok) {
      return res.status(502).json({ error: 'CloudTalk error', detail: data });
    }

    // Registrar la llamada en el historial del contacto
    if (persona_id) {
      const texto = `Llamada iniciada a ${phone}${persona_nombre ? ' (' + persona_nombre + ')' : ''} via CloudTalk`;
      await pool.query(
        'INSERT INTO persona_notas (persona_id, user_id, texto) VALUES ($1, $2, $3)',
        [persona_id, req.user.id, texto]
      );
    }

    res.json({ ok: true, call: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/cloudtalk/calls — historial de llamadas de un número
router.get('/calls', async (req, res) => {
  const { phone } = req.query;
  if (!phone) return res.status(400).json({ error: 'phone obligatorio' });

  const auth = ctAuth();
  if (!auth) return res.status(500).json({ error: 'CloudTalk no configurado' });

  try {
    const r = await fetch(CT_BASE_V1 + '/calls.json?phone_number=' + encodeURIComponent(phone) + '&limit=10&order=desc', {
      headers: { Authorization: auth },
    });
    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: 'CloudTalk error', detail: data });
    res.json({ calls: data.responseData || data.data || [] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
