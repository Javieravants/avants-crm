// === Panel de Supervision en Tiempo Real ===

var SupervisionModule = {
  agentes: [],
  stats: [],
  _refreshInterval: null,

  esc: function(s) { var d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; },

  async render() {
    var c = document.getElementById('main-content');
    c.style.padding = '';
    c.innerHTML = '<style>' + this._css() + '</style><div class="sv-wrap" id="sv-wrap"><p style="color:#94a3b8;">Cargando...</p></div>';
    await this._load();
    this._renderPanel();

    // Escuchar actualizaciones en tiempo real
    if (App.socket) {
      App.socket.off('supervision:update');
      App.socket.on('supervision:update', function() { SupervisionModule._load().then(function() { SupervisionModule._renderPanel(); }); });
    }

    // Refresh cada 30s como backup
    if (this._refreshInterval) clearInterval(this._refreshInterval);
    this._refreshInterval = setInterval(function() { SupervisionModule._load().then(function() { SupervisionModule._renderPanel(); }); }, 30000);
  },

  async _load() {
    try {
      var [agR, stR] = await Promise.all([
        API.get('/supervision/agentes'),
        API.get('/supervision/stats-hoy'),
      ]);
      this.agentes = agR.agentes || [];
      this.stats = stR.stats || [];
    } catch(e) { this.agentes = []; this.stats = []; }
  },

  _renderPanel: function() {
    var wrap = document.getElementById('sv-wrap');
    if (!wrap) return;
    var self = this;
    var statsMap = {};
    this.stats.forEach(function(s) { statsMap[s.agent_id] = s; });

    var estadoCfg = {
      activo:           { color: '#10b981', bg: '#f0fdf4', label: 'Activo', icon: '&#128994;' },
      en_llamada:       { color: '#3b82f6', bg: '#eff6ff', label: 'En llamada', icon: '&#128222;' },
      post_llamada:     { color: '#8b5cf6', bg: '#faf5ff', label: 'Post-llamada', icon: '&#128221;' },
      pausa_programada: { color: '#f59e0b', bg: '#fffbeb', label: 'Pausa', icon: '&#9749;' },
      pausa_urgente:    { color: '#ef4444', bg: '#fef2f2', label: 'Pausa urgente', icon: '&#128680;' },
      formacion:        { color: '#06b6d4', bg: '#ecfeff', label: 'Formacion', icon: '&#128218;' },
      inactivo:         { color: '#94a3b8', bg: '#f8fafc', label: 'Inactivo', icon: '&#128564;' },
      fuera_horario:    { color: '#64748b', bg: '#f1f5f9', label: 'Fuera horario', icon: '&#127769;' },
    };

    // Totales
    var totalActivos = this.agentes.filter(function(a) { return ['activo','en_llamada','post_llamada'].includes(a.estado); }).length;
    var totalPausa = this.agentes.filter(function(a) { return a.estado.includes('pausa'); }).length;
    var totalInactivos = this.agentes.filter(function(a) { return a.estado === 'inactivo'; }).length;

    wrap.innerHTML =
      '<div class="sv-toolbar">' +
        '<h1 class="sv-title">' + (typeof Icons !== 'undefined' ? Icons.contactos(22, '#009DDD') : '') + ' Supervision</h1>' +
        '<div class="sv-totals">' +
          '<span class="sv-total sv-total-ok">' + totalActivos + ' activos</span>' +
          '<span class="sv-total sv-total-pause">' + totalPausa + ' en pausa</span>' +
          (totalInactivos > 0 ? '<span class="sv-total sv-total-alert">' + totalInactivos + ' inactivos</span>' : '') +
        '</div>' +
        '<button class="sv-btn-msg" onclick="SupervisionModule._sendMessage()">Enviar mensaje</button>' +
      '</div>' +
      '<div class="sv-grid">' +
        this.agentes.map(function(a) {
          var ec = estadoCfg[a.estado] || estadoCfg.inactivo;
          var st = statsMap[a.user_id] || {};
          var tiempoEstado = a.segundos_en_estado || 0;
          var tiempoStr = tiempoEstado > 3600 ? Math.floor(tiempoEstado/3600) + 'h ' + Math.floor((tiempoEstado%3600)/60) + 'm'
            : tiempoEstado > 60 ? Math.floor(tiempoEstado/60) + 'm'
            : tiempoEstado + 's';
          var ini = (a.agente_nombre || '?').split(' ').map(function(w) { return w[0]; }).slice(0,2).join('').toUpperCase();
          var hue = ((a.user_id || 0) * 47) % 360;

          return '<div class="sv-card" style="border-left:3px solid ' + ec.color + ';">' +
            '<div class="sv-card-head">' +
              '<div class="sv-avatar" style="background:hsl(' + hue + ',55%,55%)">' + ini + '</div>' +
              '<div class="sv-info">' +
                '<div class="sv-name">' + self.esc(a.agente_nombre) + '</div>' +
                '<div class="sv-estado" style="color:' + ec.color + ';">' + ec.icon + ' ' + ec.label + ' · ' + tiempoStr + '</div>' +
              '</div>' +
            '</div>' +
            '<div class="sv-stats">' +
              '<div class="sv-stat"><div class="sv-stat-num">' + (st.total_llamadas || 0) + '</div><div class="sv-stat-lbl">Llamadas</div></div>' +
              '<div class="sv-stat"><div class="sv-stat-num" style="color:#10b981;">' + (st.interesados || 0) + '</div><div class="sv-stat-lbl">Interesados</div></div>' +
              '<div class="sv-stat"><div class="sv-stat-num" style="color:#009DDD;">' + (st.cerrados || 0) + '</div><div class="sv-stat-lbl">Ventas</div></div>' +
            '</div>' +
            '<div class="sv-card-actions">' +
              '<button class="sv-card-btn" onclick="SupervisionModule._sendMessage(' + a.user_id + ')">Mensaje</button>' +
              '<button class="sv-card-btn" onclick="SupervisionModule._activarFormacion(' + a.user_id + ')">Formacion</button>' +
            '</div>' +
          '</div>';
        }).join('') +
        (this.agentes.length === 0 ? '<div style="padding:40px;text-align:center;color:#94a3b8;grid-column:1/-1;">Sin agentes conectados</div>' : '') +
      '</div>';
  },

  _sendMessage: function(userId) {
    var self = this;
    var agentOpts = this.agentes.map(function(a) {
      return '<option value="' + a.user_id + '"' + (userId === a.user_id ? ' selected' : '') + '>' + self.esc(a.agente_nombre) + '</option>';
    }).join('');

    var overlay = document.createElement('div');
    overlay.id = 'sv-msg-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.5);z-index:900;display:flex;align-items:center;justify-content:center;padding:20px;';
    overlay.innerHTML =
      '<div style="background:#fff;border-radius:12px;width:400px;max-width:100%;box-shadow:0 20px 60px rgba(0,0,0,.2);">' +
        '<div style="padding:16px 20px;border-bottom:1px solid #e8edf2;font-size:15px;font-weight:700;">Enviar mensaje</div>' +
        '<div style="padding:20px;">' +
          '<div style="margin-bottom:10px;"><label style="font-size:11px;font-weight:700;color:#94a3b8;display:block;margin-bottom:3px;">Destinatario</label>' +
            '<select id="sv-msg-to" style="width:100%;padding:7px 10px;border:1px solid #e8edf2;border-radius:8px;font-size:12px;font-family:inherit;"><option value="">Todos los agentes</option>' + agentOpts + '</select></div>' +
          '<div style="margin-bottom:10px;"><label style="font-size:11px;font-weight:700;color:#94a3b8;display:block;margin-bottom:3px;">Tipo</label>' +
            '<select id="sv-msg-tipo" style="width:100%;padding:7px 10px;border:1px solid #e8edf2;border-radius:8px;font-size:12px;font-family:inherit;"><option value="aviso">Aviso</option><option value="alerta">Alerta</option><option value="formacion">Formacion</option></select></div>' +
          '<div style="margin-bottom:10px;"><label style="font-size:11px;font-weight:700;color:#94a3b8;display:block;margin-bottom:3px;">Mensaje</label>' +
            '<textarea id="sv-msg-text" style="width:100%;min-height:80px;padding:10px;border:1px solid #e8edf2;border-radius:8px;font-size:12px;font-family:inherit;resize:vertical;box-sizing:border-box;" placeholder="Escribe tu mensaje..."></textarea></div>' +
          '<div style="display:flex;gap:8px;justify-content:flex-end;">' +
            '<button onclick="document.getElementById(\'sv-msg-overlay\').remove()" style="padding:7px 16px;border-radius:8px;border:1px solid #e8edf2;background:#fff;color:#475569;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">Cancelar</button>' +
            '<button onclick="SupervisionModule._doSendMessage()" style="padding:7px 16px;border-radius:8px;border:none;background:#009DDD;color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;">Enviar</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
  },

  async _doSendMessage() {
    var to = document.getElementById('sv-msg-to')?.value || null;
    var tipo = document.getElementById('sv-msg-tipo')?.value || 'aviso';
    var msg = document.getElementById('sv-msg-text')?.value?.trim();
    if (!msg) return;
    await API.post('/supervision/mensaje', { to_user_id: to || null, mensaje: msg, tipo: tipo });
    document.getElementById('sv-msg-overlay')?.remove();
  },

  async _activarFormacion(userId) {
    if (!confirm('Activar modo formacion para este agente?')) return;
    await API.post('/supervision/formacion', { user_id: userId });
  },

  _css: function() {
    return '' +
      '.sv-wrap{padding:24px;height:calc(100vh - 110px);display:flex;flex-direction:column;overflow:hidden;}' +
      '.sv-toolbar{display:flex;align-items:center;gap:16px;margin-bottom:16px;flex-shrink:0;flex-wrap:wrap;}' +
      '.sv-title{font-size:18px;font-weight:700;color:#0f172a;display:flex;align-items:center;gap:8px;margin:0;}' +
      '.sv-totals{display:flex;gap:8px;flex:1;}' +
      '.sv-total{padding:4px 10px;border-radius:8px;font-size:11px;font-weight:600;}' +
      '.sv-total-ok{background:#f0fdf4;color:#065f46;}' +
      '.sv-total-pause{background:#fffbeb;color:#92400e;}' +
      '.sv-total-alert{background:#fef2f2;color:#991b1b;animation:kb-pulse 1.5s infinite;}' +
      '.sv-btn-msg{padding:7px 16px;border-radius:8px;border:none;background:#009DDD;color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;}' +
      '.sv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;flex:1;overflow-y:auto;align-content:start;}' +
      '.sv-card{background:#fff;border:1px solid #e8edf2;border-radius:12px;padding:14px;transition:all .15s;}' +
      '.sv-card:hover{box-shadow:0 4px 12px rgba(0,0,0,.06);}' +
      '.sv-card-head{display:flex;align-items:center;gap:10px;margin-bottom:10px;}' +
      '.sv-avatar{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0;}' +
      '.sv-info{flex:1;min-width:0;}' +
      '.sv-name{font-size:13px;font-weight:700;color:#0f172a;}' +
      '.sv-estado{font-size:11px;font-weight:600;margin-top:2px;}' +
      '.sv-stats{display:flex;gap:12px;margin-bottom:10px;}' +
      '.sv-stat{text-align:center;flex:1;}' +
      '.sv-stat-num{font-size:18px;font-weight:800;color:#0f172a;}' +
      '.sv-stat-lbl{font-size:9px;color:#94a3b8;text-transform:uppercase;font-weight:600;}' +
      '.sv-card-actions{display:flex;gap:6px;}' +
      '.sv-card-btn{padding:5px 10px;border-radius:6px;border:1px solid #e8edf2;background:#fff;color:#475569;font-size:10px;font-weight:600;cursor:pointer;font-family:inherit;}' +
      '.sv-card-btn:hover{background:#f4f6f9;}' +
      '@media(max-width:768px){.sv-grid{grid-template-columns:1fr;}}';
  },
};
