// === Módulo Asistente IA (solo admin) ===

const AssistantModule = {
  messages: [],

  render() {
    if (!Auth.hasRole('admin', 'superadmin')) {
      document.getElementById('main-content').innerHTML = `
        <h1 class="page-title">Acceso denegado</h1>
        <div class="card text-center" style="padding:64px;"><p class="text-light">No tienes permiso.</p></div>
      `;
      return;
    }

    const container = document.getElementById('main-content');
    container.innerHTML = `
      <h1 class="page-title">Asistente IA</h1>
      <div class="card" style="display:flex;flex-direction:column;height:calc(100vh - 140px);padding:0;overflow:hidden;">
        <div class="assistant-header" style="padding:16px 24px;border-bottom:1px solid var(--border);">
          <p class="text-light" style="font-size:14px;">Pregunta sobre el CRM, pide cambios o mejoras. Conectado a Claude.</p>
        </div>
        <div id="assistant-messages" style="flex:1;overflow-y:auto;padding:24px;display:flex;flex-direction:column;gap:16px;">
          <div class="assistant-msg assistant-msg-ai">
            <strong>Asistente</strong>
            <p>Hola Javier. Soy el asistente integrado en Gestavly. Puedo ayudarte a entender cómo funciona el CRM, sugerir mejoras, o darte código para implementar cambios. ¿En qué puedo ayudarte?</p>
          </div>
        </div>
        <div style="padding:16px 24px;border-top:1px solid var(--border);display:flex;gap:12px;">
          <textarea class="form-control" id="assistant-input" rows="2" placeholder="Escribe tu mensaje..." style="flex:1;resize:none;"></textarea>
          <button class="btn btn-primary" id="btn-send-assistant" style="align-self:flex-end;">Enviar</button>
        </div>
      </div>
    `;

    const input = document.getElementById('assistant-input');
    const btn = document.getElementById('btn-send-assistant');

    btn.addEventListener('click', () => this.send());
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.send();
      }
    });
  },

  async send() {
    const input = document.getElementById('assistant-input');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    this.messages.push({ role: 'user', content: text });
    this.appendMessage('user', text);

    // Indicador de carga
    const loadingId = 'loading-' + Date.now();
    this.appendLoading(loadingId);

    try {
      const data = await API.post('/assistant/chat', { messages: this.messages });
      this.removeLoading(loadingId);
      this.messages.push({ role: 'assistant', content: data.response });
      this.appendMessage('assistant', data.response);
    } catch (err) {
      this.removeLoading(loadingId);
      this.appendMessage('assistant', `Error: ${err.message}`);
    }
  },

  appendMessage(role, content) {
    const container = document.getElementById('assistant-messages');
    const div = document.createElement('div');
    div.className = `assistant-msg assistant-msg-${role === 'user' ? 'user' : 'ai'}`;
    div.innerHTML = `
      <strong>${role === 'user' ? 'Tú' : 'Asistente'}</strong>
      <div class="assistant-content">${this.formatMessage(content)}</div>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  },

  appendLoading(id) {
    const container = document.getElementById('assistant-messages');
    const div = document.createElement('div');
    div.className = 'assistant-msg assistant-msg-ai';
    div.id = id;
    div.innerHTML = '<strong>Asistente</strong><p class="text-light">Pensando...</p>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  },

  removeLoading(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  },

  formatMessage(text) {
    // Formateo básico de markdown: bloques de código, negritas, saltos de línea
    let html = this.escapeHtml(text);

    // Bloques de código ```
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g,
      '<pre style="background:#1a1a2e;color:#e0e0e0;padding:16px;border-radius:8px;overflow-x:auto;font-size:13px;margin:8px 0;"><code>$2</code></pre>');

    // Código inline `...`
    html = html.replace(/`([^`]+)`/g,
      '<code style="background:#f0f0f5;padding:2px 6px;border-radius:4px;font-size:13px;">$1</code>');

    // Negritas **...**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Saltos de línea
    html = html.replace(/\n/g, '<br>');

    return html;
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },
};
