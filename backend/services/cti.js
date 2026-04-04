// CTI Abstraction Layer — Gestavly
// REGLA: nunca llamar directamente a CloudTalk/Twilio desde rutas.
// Todo pasa por CTI.call() / CTI.hangup(). El proveedor se configura
// con CTI_PROVIDER env var (cloudtalk | twilio | manual).

// ══════════════════════════════════════════════
// ADAPTADOR: CloudTalk
// ══════════════════════════════════════════════

const cloudtalkAdapter = {
  _auth() {
    const key = process.env.CLOUDTALK_API_KEY;
    const secret = process.env.CLOUDTALK_API_SECRET;
    if (!key || !secret) return null;
    return 'Basic ' + Buffer.from(key + ':' + secret).toString('base64');
  },

  // Cache de agentes (5 min TTL) para no consultar en cada llamada
  _agentCache: null,
  _agentCacheTime: 0,

  async _getAgents() {
    const now = Date.now();
    if (this._agentCache && now - this._agentCacheTime < 300000) {
      return this._agentCache;
    }
    const auth = this._auth();
    if (!auth) return [];
    const r = await fetch('https://api.cloudtalk.io/api/agents.json', {
      headers: { Authorization: auth }
    });
    const data = await r.json();
    this._agentCache = data.data || data.responseData || [];
    this._agentCacheTime = now;
    return this._agentCache;
  },

  async call(agentEmail, phoneNumber) {
    const auth = this._auth();
    if (!auth) {
      return { success: false, manual: true, phone: phoneNumber, reason: 'cloudtalk_not_configured' };
    }

    // Intentar primero con agentEmail directo (API v1 documentada)
    console.log(`[CTI:cloudtalk] Calling ${phoneNumber} via agent ${agentEmail}`);

    const r = await fetch('https://api.cloudtalk.io/api/v1/calls', {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: phoneNumber, agentEmail }),
    });

    let data;
    const text = await r.text();
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!r.ok) {
      console.error(`[CTI:cloudtalk] Call error (${r.status}):`, data);

      // Fallback: intentar formato alternativo con agent_id
      const agents = await this._getAgents();
      const agent = agents.find(a => a.email === agentEmail);
      if (agent) {
        console.log(`[CTI:cloudtalk] Retrying with agent_id=${agent.id}`);
        const r2 = await fetch('https://api.cloudtalk.io/api/v1/calls', {
          method: 'POST',
          headers: { Authorization: auth, 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: phoneNumber, agent_id: agent.id }),
        });
        const text2 = await r2.text();
        let data2;
        try { data2 = JSON.parse(text2); } catch { data2 = { raw: text2 }; }

        if (r2.ok) {
          return {
            success: true, manual: false,
            callId: data2.id || data2.call_id || null,
            phone: phoneNumber,
            agent: { id: agent.id, name: `${agent.firstname} ${agent.lastname}`, extension: agent.extension },
          };
        }
        console.error(`[CTI:cloudtalk] Retry also failed (${r2.status}):`, data2);
        return { success: false, manual: true, phone: phoneNumber, reason: 'api_error', detail: data2 };
      }

      return { success: false, manual: true, phone: phoneNumber, reason: 'api_error', detail: data };
    }

    // Buscar info del agente para la respuesta
    const agents = await this._getAgents();
    const agent = agents.find(a => a.email === agentEmail);

    return {
      success: true,
      manual: false,
      callId: data.id || data.call_id || null,
      phone: phoneNumber,
      agent: agent
        ? { id: agent.id, name: `${agent.firstname} ${agent.lastname}`, extension: agent.extension }
        : { name: agentEmail },
    };
  },

  async hangup(callId) {
    const auth = this._auth();
    if (!auth || !callId) return { success: false };
    try {
      const r = await fetch(`https://api.cloudtalk.io/api/v1/calls/${callId}`, {
        method: 'DELETE',
        headers: { Authorization: auth },
      });
      return { success: r.ok };
    } catch (e) {
      console.error('[CTI:cloudtalk] Hangup error:', e.message);
      return { success: false };
    }
  },
};

// ══════════════════════════════════════════════
// ADAPTADOR: Twilio (stub — implementar cuando se necesite)
// ══════════════════════════════════════════════

const twilioAdapter = {
  async call(agentEmail, phoneNumber) {
    // TODO: implementar con Twilio Programmable Voice
    return { success: false, manual: true, phone: phoneNumber, reason: 'twilio_not_implemented' };
  },
  async hangup() {
    return { success: false, reason: 'twilio_not_implemented' };
  },
};

// ══════════════════════════════════════════════
// ADAPTADOR: Manual (sin CTI — agente marca a mano)
// ══════════════════════════════════════════════

const manualAdapter = {
  async call(agentEmail, phoneNumber) {
    return { success: true, manual: true, phone: phoneNumber, reason: 'manual_dial' };
  },
  async hangup() {
    return { success: true };
  },
};

// ══════════════════════════════════════════════
// INTERFAZ PUBLICA
// ══════════════════════════════════════════════

const adapters = {
  cloudtalk: cloudtalkAdapter,
  twilio: twilioAdapter,
  manual: manualAdapter,
};

const CTI = {
  getProvider() {
    return process.env.CTI_PROVIDER || 'cloudtalk';
  },

  async call(agentEmail, phoneNumber) {
    const provider = this.getProvider();
    const adapter = adapters[provider];
    if (!adapter) {
      return { success: false, manual: true, phone: phoneNumber, reason: `unknown_provider: ${provider}` };
    }
    try {
      return await adapter.call(agentEmail, phoneNumber);
    } catch (e) {
      console.error(`[CTI:${provider}] Error:`, e.message);
      return { success: false, manual: true, phone: phoneNumber, reason: 'exception', detail: e.message };
    }
  },

  async hangup(callId) {
    const provider = this.getProvider();
    const adapter = adapters[provider];
    if (!adapter) return { success: false };
    try {
      return await adapter.hangup(callId);
    } catch (e) {
      console.error(`[CTI:${provider}] Hangup error:`, e.message);
      return { success: false };
    }
  },
};

module.exports = CTI;
