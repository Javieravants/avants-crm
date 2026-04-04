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

    const agents = await this._getAgents();
    const agent = agents.find(a => a.email === agentEmail);
    if (!agent) {
      return { success: false, manual: true, phone: phoneNumber, reason: 'agent_not_found', agentEmail };
    }

    const r = await fetch('https://api.cloudtalk.io/v1/calls', {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent_id: agent.id, external_number: phoneNumber }),
    });
    const data = await r.json();

    if (!r.ok) {
      console.error('[CTI:cloudtalk] Call error:', data);
      return { success: false, manual: true, phone: phoneNumber, reason: 'api_error', detail: data };
    }

    return {
      success: true,
      manual: false,
      callId: data.id || data.call_id || null,
      phone: phoneNumber,
      agent: { id: agent.id, name: `${agent.firstname} ${agent.lastname}`, extension: agent.extension },
    };
  },

  async hangup(callId) {
    const auth = this._auth();
    if (!auth || !callId) return { success: false };
    try {
      const r = await fetch(`https://api.cloudtalk.io/v1/calls/${callId}`, {
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
