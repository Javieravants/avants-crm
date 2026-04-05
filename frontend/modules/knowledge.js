// === Centro de Conocimiento — chat IA + base de conocimiento ===

var KnowledgeModule = {
  tab: 'chat',
  items: [],
  chats: [],
  companias: [],
  chatHistory: [],

  esc: function(s) { var d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; },

  async render() {
    var c = document.getElementById('main-content');
    c.style.padding = '';
    c.style.overflow = '';

    try {
      var compR = await API.get('/companias');
      this.companias = compR.companias || [];
    } catch(e) { this.companias = []; }

    c.innerHTML =
      '<style>' + this._css() + '</style>' +
      '<div class="kb-wrap">' +
        '<div class="kb-toolbar">' +
          '<h1 class="kb-title">' + (typeof Icons !== 'undefined' ? Icons.settings(22, '#009DDD') : '') + ' Centro de Conocimiento</h1>' +
          '<div class="kb-tabs">' +
            '<button class="kb-tab ' + (this.tab === 'chat' ? 'active' : '') + '" onclick="KnowledgeModule._setTab(\'chat\')">Chat con la IA</button>' +
            '<button class="kb-tab ' + (this.tab === 'base' ? 'active' : '') + '" onclick="KnowledgeModule._setTab(\'base\')">Base de conocimiento</button>' +
          '</div>' +
        '</div>' +
        '<div class="kb-content" id="kb-content"></div>' +
      '</div>';

    this._renderTab();
  },

  _setTab: function(t) {
    this.tab = t;
    document.querySelectorAll('.kb-tab').forEach(function(b) { b.classList.toggle('active', b.textContent.toLowerCase().includes(t === 'chat' ? 'chat' : 'base')); });
    this._renderTab();
  },

  async _renderTab() {
    var el = document.getElementById('kb-content');
    if (!el) return;
    if (this.tab === 'chat') {
      await this._renderChat(el);
    } else {
      await this._renderBase(el);
    }
  },

  // ══════════════════════════════════════════
  // TAB: CHAT CON LA IA
  // ══════════════════════════════════════════

  async _renderChat(el) {
    // Cargar historial
    try {
      var r = await API.get('/knowledge/chat');
      this.chats = r.chats || [];
    } catch(e) { this.chats = []; }

    el.innerHTML =
      '<div class="kb-chat-wrap">' +
        '<div class="kb-chat-history" id="kb-chat-history">' +
          (this.chats.length === 0 ? '<div class="kb-empty">Escribe para ensenar a la IA sobre tu negocio, companias, campanas, argumentarios...</div>' : '') +
          this.chats.slice().reverse().map(function(c) {
            return '<div class="kb-msg kb-msg-user">' + KnowledgeModule.esc(c.mensaje_usuario) + '</div>' +
                   '<div class="kb-msg kb-msg-ia">' + KnowledgeModule.esc(c.respuesta_ia) +
                     (c.conocimiento_extraido ? '<div class="kb-extracted">Guardado: ' + KnowledgeModule.esc(c.conocimiento_extraido) + '</div>' : '') +
                   '</div>';
          }).join('') +
        '</div>' +
        '<div class="kb-chat-input-wrap">' +
          '<textarea id="kb-chat-input" class="kb-chat-input" rows="2" placeholder="Ej: DKV tiene campana especial este mes con 20% extra de comision..."></textarea>' +
          '<button class="kb-chat-send" onclick="KnowledgeModule._sendChat()">Enviar</button>' +
        '</div>' +
      '</div>';

    var hist = document.getElementById('kb-chat-history');
    if (hist) hist.scrollTop = hist.scrollHeight;
  },

  async _sendChat() {
    var input = document.getElementById('kb-chat-input');
    var hist = document.getElementById('kb-chat-history');
    if (!input || !hist) return;
    var msg = input.value.trim();
    if (!msg) return;

    // Mostrar mensaje del usuario
    hist.innerHTML += '<div class="kb-msg kb-msg-user">' + this.esc(msg) + '</div>';
    hist.innerHTML += '<div class="kb-msg kb-msg-ia" id="kb-thinking" style="opacity:.5;">Pensando...</div>';
    hist.scrollTop = hist.scrollHeight;
    input.value = '';

    try {
      var r = await API.post('/knowledge/chat', { mensaje: msg });
      var thinking = document.getElementById('kb-thinking');
      if (thinking) thinking.remove();

      var iaMsg = '<div class="kb-msg kb-msg-ia">' + this.esc(r.respuesta);
      if (r.guardados && r.guardados.length > 0) {
        var visLabels = { admin: 'Solo admin', agentes: 'Solo equipo', todos: 'Publico' };
        iaMsg += '<div class="kb-extracted">Guardado: ' + r.guardados.map(function(g) {
          var vl = visLabels[g.visibilidad] || 'Solo equipo';
          return KnowledgeModule.esc(g.titulo) + ' <span class="kb-vis-' + (g.visibilidad || 'agentes') + '" style="font-size:9px;">' + vl + '</span>';
        }).join(', ') + '</div>';
      }
      iaMsg += '</div>';
      hist.innerHTML += iaMsg;
      hist.scrollTop = hist.scrollHeight;
    } catch(e) {
      var thinking = document.getElementById('kb-thinking');
      if (thinking) { thinking.textContent = 'Error: ' + e.message; thinking.style.color = '#ef4444'; }
    }
  },

  // ══════════════════════════════════════════
  // TAB: BASE DE CONOCIMIENTO
  // ══════════════════════════════════════════

  async _renderBase(el) {
    try {
      var r = await API.get('/knowledge');
      this.items = r.items || [];
    } catch(e) { this.items = []; }

    var self = this;
    var tipoFilter = '<select id="kb-filter-tipo" class="kb-filter" onchange="KnowledgeModule._filterBase()">' +
      '<option value="">Todos los tipos</option>' +
      '<option value="negocio">Negocio</option><option value="compania">Compania</option>' +
      '<option value="campana">Campana</option><option value="argumentario">Argumentario</option>' +
      '<option value="objecion">Objecion</option><option value="restriccion">Restriccion</option><option value="mercado">Mercado</option></select>';

    var compFilter = '<select id="kb-filter-comp" class="kb-filter" onchange="KnowledgeModule._filterBase()">' +
      '<option value="">Todas las companias</option>' +
      this.companias.map(function(c) { return '<option value="' + c.id + '">' + self.esc(c.nombre) + '</option>'; }).join('') +
      '</select>';

    el.innerHTML =
      '<div class="kb-base-toolbar">' +
        tipoFilter + compFilter +
        '<div style="flex:1"></div>' +
        '<button class="kb-btn-primary" onclick="KnowledgeModule._showNewEntry()">+ Nueva entrada</button>' +
      '</div>' +
      '<div class="kb-base-list" id="kb-base-list">' +
        this._renderItems(this.items) +
      '</div>';
  },

  _renderItems: function(items) {
    if (!items.length) return '<div class="kb-empty">Sin entradas. Usa el chat o anade manualmente.</div>';

    var now = new Date();
    return items.map(function(item) {
      var expired = item.vigente_hasta && new Date(item.vigente_hasta) < now;
      var tipoCfg = {
        negocio: { bg: '#eff6ff', color: '#1d4ed8' },
        compania: { bg: '#f0fdf4', color: '#065f46' },
        campana: { bg: '#fefce8', color: '#854d0e' },
        argumentario: { bg: '#faf5ff', color: '#7c3aed' },
        objecion: { bg: '#fef2f2', color: '#991b1b' },
        restriccion: { bg: '#fff7ed', color: '#c2410c' },
        mercado: { bg: '#f5f3ff', color: '#6d28d9' },
      };
      var tc = tipoCfg[item.tipo] || tipoCfg.negocio;

      return '<div class="kb-item' + (expired ? ' kb-expired' : '') + '">' +
        '<div class="kb-item-head">' +
          '<span class="kb-item-tipo" style="background:' + tc.bg + ';color:' + tc.color + ';">' + item.tipo + '</span>' +
          '<span class="kb-item-title">' + KnowledgeModule.esc(item.titulo) + '</span>' +
          (item.visibilidad === 'admin'
            ? '<span class="kb-vis-admin" title="Solo visible para el administrador. No llega a agentes ni clientes.">Solo admin</span>'
            : item.visibilidad === 'todos'
            ? '<span class="kb-vis-todos" title="Puede usarse en comunicaciones con el cliente.">Publico</span>'
            : '<span class="kb-vis-agentes" title="Visible para el equipo. Los agentes lo ven en briefings pero no llega al cliente.">Solo equipo</span>') +
          (item.compania_nombre ? '<span class="kb-item-comp">' + KnowledgeModule.esc(item.compania_nombre) + '</span>' : '') +
          (expired ? '<span class="kb-item-exp">Caducado</span>' : '') +
          '<button class="kb-item-del" onclick="KnowledgeModule._deleteItem(' + item.id + ')" title="Eliminar">&times;</button>' +
        '</div>' +
        '<div class="kb-item-content">' + KnowledgeModule.esc(item.contenido).substring(0, 200) + (item.contenido.length > 200 ? '...' : '') + '</div>' +
      '</div>';
    }).join('');
  },

  _filterBase: function() {
    var tipo = document.getElementById('kb-filter-tipo');
    var comp = document.getElementById('kb-filter-comp');
    var tipoVal = tipo ? tipo.value : '';
    var compVal = comp ? comp.value : '';

    var filtered = this.items.filter(function(item) {
      if (tipoVal && item.tipo !== tipoVal) return false;
      if (compVal && String(item.compania_id) !== compVal) return false;
      return true;
    });

    var list = document.getElementById('kb-base-list');
    if (list) list.innerHTML = this._renderItems(filtered);
  },

  async _deleteItem(id) {
    if (!confirm('Eliminar esta entrada?')) return;
    await API.delete('/knowledge/' + id);
    this._renderTab();
  },

  _showNewEntry: function() {
    var self = this;
    var compOpts = this.companias.map(function(c) {
      return '<option value="' + c.id + '">' + self.esc(c.nombre) + '</option>';
    }).join('');

    var overlay = document.createElement('div');
    overlay.id = 'kb-modal';
    overlay.className = 'kb-overlay';
    overlay.innerHTML =
      '<div class="kb-modal">' +
        '<div class="kb-modal-head">Nueva entrada<button onclick="document.getElementById(\'kb-modal\').remove()" style="background:none;border:none;font-size:20px;color:#94a3b8;cursor:pointer;">&times;</button></div>' +
        '<div class="kb-modal-body">' +
          '<div class="kb-field"><label class="kb-label">Tipo</label>' +
            '<select id="kb-new-tipo" class="kb-input"><option value="negocio">Negocio</option><option value="compania">Compania</option><option value="campana">Campana</option><option value="argumentario">Argumentario</option><option value="objecion">Objecion</option><option value="restriccion">Restriccion</option><option value="mercado">Mercado</option></select></div>' +
          '<div class="kb-field"><label class="kb-label">Compania (opcional)</label>' +
            '<select id="kb-new-comp" class="kb-input"><option value="">General</option>' + compOpts + '</select></div>' +
          '<div class="kb-field"><label class="kb-label">Titulo</label>' +
            '<input id="kb-new-titulo" class="kb-input" placeholder="Titulo corto..."></div>' +
          '<div class="kb-field"><label class="kb-label">Contenido</label>' +
            '<textarea id="kb-new-contenido" class="kb-input" rows="4" placeholder="El conocimiento..."></textarea></div>' +
          '<div class="kb-field"><label class="kb-label">Visibilidad</label>' +
            '<select id="kb-new-vis" class="kb-input"><option value="admin">Solo admin — confidencial</option><option value="agentes" selected>Solo equipo — agentes lo ven en briefings</option><option value="todos">Publico — puede llegar al cliente</option></select></div>' +
          '<div class="kb-field"><label class="kb-label">Vigente hasta (opcional)</label>' +
            '<input id="kb-new-vigente" class="kb-input" type="date"></div>' +
          '<button class="kb-btn-primary" onclick="KnowledgeModule._saveNewEntry()">Guardar</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
  },

  async _saveNewEntry() {
    var data = {
      tipo: document.getElementById('kb-new-tipo').value,
      titulo: document.getElementById('kb-new-titulo').value,
      contenido: document.getElementById('kb-new-contenido').value,
      compania_id: document.getElementById('kb-new-comp').value || null,
      visibilidad: document.getElementById('kb-new-vis').value || 'interno',
      vigente_hasta: document.getElementById('kb-new-vigente').value || null,
    };
    if (!data.titulo || !data.contenido) { alert('Titulo y contenido obligatorios'); return; }
    await API.post('/knowledge', data);
    document.getElementById('kb-modal').remove();
    this._renderTab();
  },

  // ══════════════════════════════════════════
  // CSS
  // ══════════════════════════════════════════

  _css: function() {
    return '' +
      '.kb-wrap{padding:24px;height:calc(100vh - 110px);display:flex;flex-direction:column;overflow:hidden;}' +
      '.kb-toolbar{display:flex;align-items:center;gap:16px;margin-bottom:16px;flex-shrink:0;flex-wrap:wrap;}' +
      '.kb-title{font-size:18px;font-weight:700;color:#0f172a;display:flex;align-items:center;gap:8px;margin:0;}' +
      '.kb-tabs{display:flex;gap:4px;}' +
      '.kb-tab{padding:7px 16px;border-radius:8px;border:1px solid #e8edf2;background:#fff;color:#475569;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;}' +
      '.kb-tab.active{background:#009DDD;color:#fff;border-color:#009DDD;}' +
      '.kb-content{flex:1;overflow:hidden;display:flex;flex-direction:column;}' +

      // Chat
      '.kb-chat-wrap{flex:1;display:flex;flex-direction:column;overflow:hidden;}' +
      '.kb-chat-history{flex:1;overflow-y:auto;padding:8px 0;}' +
      '.kb-msg{padding:10px 14px;border-radius:10px;margin-bottom:8px;font-size:13px;line-height:1.5;max-width:80%;}' +
      '.kb-msg-user{background:#e6f6fd;color:#0f172a;margin-left:auto;}' +
      '.kb-msg-ia{background:#f5f3ff;color:#475569;border:1px solid #e9e5f5;}' +
      '.kb-extracted{margin-top:6px;padding-top:6px;border-top:1px solid #d8d0f0;font-size:11px;color:#7c3aed;font-weight:600;}' +
      '.kb-chat-input-wrap{display:flex;gap:8px;padding-top:12px;border-top:1px solid #e8edf2;flex-shrink:0;}' +
      '.kb-chat-input{flex:1;padding:10px;border:1px solid #e8edf2;border-radius:8px;font-size:13px;font-family:inherit;color:#0f172a;resize:vertical;min-height:44px;}' +
      '.kb-chat-input:focus{outline:none;border-color:#009DDD;box-shadow:0 0 0 3px rgba(0,157,221,.1);}' +
      '.kb-chat-send{padding:10px 20px;border-radius:8px;border:none;background:#009DDD;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;align-self:flex-end;}' +
      '.kb-chat-send:hover{background:#0088c2;}' +

      // Base
      '.kb-base-toolbar{display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-shrink:0;flex-wrap:wrap;}' +
      '.kb-filter{padding:6px 10px;border:1px solid #e8edf2;border-radius:8px;font-size:12px;font-family:inherit;color:#475569;}' +
      '.kb-btn-primary{padding:7px 16px;border-radius:8px;border:none;background:#009DDD;color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;}' +
      '.kb-base-list{flex:1;overflow-y:auto;}' +
      '.kb-item{border:1px solid #e8edf2;border-radius:10px;padding:12px 14px;margin-bottom:8px;}' +
      '.kb-item.kb-expired{opacity:.5;}' +
      '.kb-item-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}' +
      '.kb-item-tipo{padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;text-transform:uppercase;}' +
      '.kb-item-title{font-size:13px;font-weight:700;color:#0f172a;flex:1;}' +
      '.kb-item-comp{font-size:11px;color:#94a3b8;}' +
      '.kb-item-exp{font-size:10px;color:#ef4444;font-weight:600;}' +
      '.kb-item-del{background:none;border:none;color:#ef4444;cursor:pointer;font-size:16px;opacity:.4;}' +
      '.kb-item-del:hover{opacity:1;}' +
      '.kb-vis-admin{padding:2px 6px;border-radius:4px;font-size:9px;font-weight:700;background:#fef2f2;color:#dc2626;border:1px solid #fca5a5;}' +
      '.kb-vis-agentes{padding:2px 6px;border-radius:4px;font-size:9px;font-weight:700;background:#fefce8;color:#a16207;border:1px solid #fde68a;}' +
      '.kb-vis-todos{padding:2px 6px;border-radius:4px;font-size:9px;font-weight:700;background:#f0fdf4;color:#15803d;border:1px solid #86efac;}' +
      '.kb-item-content{font-size:12px;color:#475569;margin-top:6px;line-height:1.5;}' +
      '.kb-empty{padding:40px;text-align:center;color:#94a3b8;font-size:13px;}' +

      // Modal
      '.kb-overlay{position:fixed;inset:0;background:rgba(15,23,42,.5);z-index:800;display:flex;align-items:center;justify-content:center;padding:20px;}' +
      '.kb-modal{background:#fff;border-radius:12px;width:480px;max-width:100%;box-shadow:0 20px 60px rgba(0,0,0,.2);}' +
      '.kb-modal-head{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #e8edf2;font-size:15px;font-weight:700;}' +
      '.kb-modal-body{padding:20px;}' +
      '.kb-field{margin-bottom:10px;}' +
      '.kb-label{font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.3px;display:block;margin-bottom:3px;}' +
      '.kb-input{width:100%;padding:7px 10px;border:1px solid #e8edf2;border-radius:8px;font-size:13px;font-family:inherit;color:#0f172a;box-sizing:border-box;}' +
      '.kb-input:focus{outline:none;border-color:#009DDD;}' +

      // Responsive
      '@media(max-width:768px){.kb-msg{max-width:95%;}}';
  },
};
