// === CallDrawer — Panel lateral de llamada ===
// Se abre desde dialer, ficha contacto o pipeline.
// window.CallDrawer.open(personaId, 'dialer'|'manual')

const CallDrawer = {
  isOpen: false,
  mode: 'manual',  // 'dialer' | 'manual'
  personaId: null,
  data: null,       // response de /call-drawer/:id
  callActive: false,
  callStart: null,
  timerInterval: null,

  esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; },

  _fmtAge(dob) {
    if (!dob) return '';
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / 31557600000) + ' a';
  },

  _fmtRelative(date) {
    if (!date) return '';
    const h = (Date.now() - new Date(date).getTime()) / 3600000;
    if (h < 1) return 'hace ' + Math.round(h * 60) + 'min';
    if (h < 24) return 'hace ' + Math.round(h) + 'h';
    const d = Math.round(h / 24);
    if (d === 1) return 'ayer';
    if (d < 30) return 'hace ' + d + ' dias';
    return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  },

  _normPhone(phone) {
    if (!phone) return '';
    const d = phone.replace(/\D/g, '');
    if (d.startsWith('34') && d.length === 11) return '+' + d;
    if (d.length === 9) return '+34' + d;
    if (phone.startsWith('+')) return phone.replace(/\s/g, '');
    return '+' + d;
  },

  _ini(name) { return (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase(); },
  _hue(id) { return ((id || 0) * 47) % 360; },

  // ══════════════════════════════════════════
  // OPEN / CLOSE
  // ══════════════════════════════════════════

  async open(personaId, mode) {
    this.personaId = personaId;
    this.mode = mode || 'manual';
    this.callActive = false;
    this.data = null;

    this._ensureDOM();
    this._showLoading();

    try {
      this.data = await API.get(`/personas/call-drawer/${personaId}`);
      this._render();
    } catch (e) {
      document.getElementById('cd-body').innerHTML =
        `<div style="padding:40px;text-align:center;color:#ef4444;">${e.message}</div>`;
    }

    this.isOpen = true;
  },

  close() {
    const overlay = document.getElementById('cd-overlay');
    const drawer = document.getElementById('cd-drawer');
    if (overlay) overlay.classList.add('cd-hidden');
    if (drawer) drawer.classList.add('cd-closed');
    this.isOpen = false;
    this._stopTimer();
  },

  _ensureDOM() {
    if (document.getElementById('cd-overlay')) {
      document.getElementById('cd-overlay').classList.remove('cd-hidden');
      document.getElementById('cd-drawer').classList.remove('cd-closed');
      return;
    }

    // Inyectar CSS
    const style = document.createElement('style');
    style.textContent = this._getCSS();
    document.head.appendChild(style);

    // Inyectar HTML
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div id="cd-overlay" class="cd-overlay" onclick="if(!CallDrawer.callActive)CallDrawer.close()"></div>
      <div id="cd-drawer" class="cd-drawer">
        <div id="cd-header"></div>
        <div id="cd-body" class="cd-body"></div>
      </div>
    `;
    document.body.appendChild(wrap);
  },

  _showLoading() {
    const body = document.getElementById('cd-body');
    if (body) body.innerHTML = '<div style="padding:40px;text-align:center;color:#94a3b8;">Cargando...</div>';
    document.getElementById('cd-header').innerHTML = '';
  },

  // ══════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════

  _render() {
    const d = this.data;
    if (!d) return;
    const p = d.persona;
    const phone = this._normPhone(p.telefono);

    // HEADER
    document.getElementById('cd-header').innerHTML = `
      <div class="cd-head-top">
        <div class="cd-avatar" style="background:hsl(${this._hue(p.id)},55%,55%)">${this._ini(p.nombre)}</div>
        <div class="cd-head-info">
          <div class="cd-head-name">${this.esc(p.nombre)}</div>
          <div class="cd-head-phone" onclick="navigator.clipboard.writeText('${phone}');this.title='Copiado'" title="Clic para copiar">${phone}</div>
        </div>
        <button class="cd-close-btn" onclick="CallDrawer.close()" title="Cerrar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
      ${this._renderSeguros(d.seguros_activos)}
      ${this._renderAsegurados(d.asegurados)}
      <div class="cd-head-actions">
        <button class="cd-action-btn cd-action-call" onclick="CallDrawer._llamar()">
          ${Icons.llamada(16, '#fff')} Llamar
        </button>
        <button class="cd-action-btn" onclick="CallDrawer._sendWA()">
          ${Icons.whatsapp(16, '#25D366')} WhatsApp
        </button>
        <button class="cd-action-btn" onclick="window.open('mailto:${this.esc(p.email||'')}')">
          ${Icons.email(16, '#009DDD')} Email
        </button>
      </div>
    `;

    // BODY
    document.getElementById('cd-body').innerHTML = `
      ${this._renderBriefing(d)}
      ${this._renderHistorial(d.historial_reciente)}
      ${this._renderAcciones()}
      <div id="cd-post-call" class="cd-hidden"></div>
    `;
  },

  // ── Seguros activos como badges ──
  _renderSeguros(seguros) {
    if (!seguros?.length) return '';
    return `<div class="cd-seguros">${seguros.map(s =>
      `<span class="cd-seguro-badge">${this.esc(s.producto)} ${s.prima_mensual ? s.prima_mensual + '/mes' : ''}</span>`
    ).join('')}</div>`;
  },

  // ── Asegurados como mini-avatares ──
  _renderAsegurados(aseg) {
    if (!aseg?.length) return '';
    return `<div class="cd-asegurados">${aseg.slice(0, 6).map(a =>
      `<div class="cd-aseg" title="${this.esc(a.nombre)} · ${a.parentesco || ''}">
        <div class="cd-aseg-av">${this._ini(a.nombre)}</div>
        <span class="cd-aseg-name">${(a.nombre||'').split(' ')[0]} ${this._fmtAge(a.fecha_nacimiento)}</span>
      </div>`
    ).join('')}</div>`;
  },

  // ── Briefing (datos reales o IA en Fase 2) ──
  _renderBriefing(d) {
    if (d.ia_briefing) {
      const ia = d.ia_briefing;
      return `<div class="cd-section cd-briefing-ia">
        <div class="cd-section-title">${Icons.settings(16, '#009DDD')} Briefing IA</div>
        ${ia.tactica ? `<div class="cd-brief-item"><strong>Tactica:</strong> ${this.esc(ia.tactica)}</div>` : ''}
        ${ia.oportunidad ? `<div class="cd-brief-item"><strong>Oportunidad:</strong> ${this.esc(ia.oportunidad)}</div>` : ''}
        ${ia.tono ? `<div class="cd-brief-item"><strong>Tono:</strong> ${this.esc(ia.tono)}</div>` : ''}
        ${ia.evitar?.length ? `<div class="cd-brief-item"><strong>Evitar:</strong> ${ia.evitar.map(e => this.esc(e)).join(', ')}</div>` : ''}
      </div>`;
    }

    // Datos reales del sistema
    const hist = d.historial_reciente?.[0];
    const prop = d.propuestas_recientes?.[0];
    const nota = d.ultima_nota;
    const seguros = d.seguros_activos || [];

    let items = '';
    if (hist) {
      items += `<div class="cd-brief-item">${Icons.historial(14, '#009DDD')} <strong>Ultima interaccion:</strong> ${hist.tipo}${hist.subtipo ? ' · ' + hist.subtipo : ''} — ${this._fmtRelative(hist.created_at)}</div>`;
    }
    if (prop) {
      items += `<div class="cd-brief-item">${Icons.propuesta ? Icons.propuesta(14, '#7c3aed') : ''} <strong>Propuesta:</strong> ${this.esc(prop.producto || prop.tipo_poliza || '')} ${prop.prima_mensual ? prop.prima_mensual + '/mes' : ''} — ${this._fmtRelative(prop.created_at)}</div>`;
    }
    if (seguros.length) {
      items += `<div class="cd-brief-item">${Icons.polizas(14, '#10b981')} <strong>Seguros:</strong> ${seguros.map(s => this.esc(s.producto)).join(', ')}</div>`;
    }
    if (nota) {
      items += `<div class="cd-brief-item">${Icons.editar(14, '#f59e0b')} <strong>Nota:</strong> ${this.esc((nota.contenido || '').substring(0, 100))} — ${this._fmtRelative(nota.fecha)}</div>`;
    }

    if (!items) items = '<div class="cd-brief-item" style="color:#94a3b8;">Sin interacciones previas</div>';

    return `<div class="cd-section cd-briefing">
      <div class="cd-section-title">${Icons.contactos(16, '#009DDD')} Briefing antes de llamar</div>
      ${items}
    </div>`;
  },

  // ── Historial rapido ──
  _renderHistorial(historial) {
    if (!historial?.length) return '';

    const tipoCfg = {
      llamada:   { ico: () => Icons.llamada(14, '#009DDD'),   color: '#009DDD' },
      nota:      { ico: () => Icons.editar(14, '#d97706'),    color: '#d97706' },
      etapa:     { ico: () => Icons.historial(14, '#8b5cf6'), color: '#8b5cf6' },
      email:     { ico: () => Icons.email(14, '#10b981'),     color: '#10b981' },
      whatsapp:  { ico: () => Icons.whatsapp(14, '#25D366'),  color: '#25D366' },
      tramite:   { ico: () => Icons.tickets(14, '#f97316'),   color: '#f97316' },
      propuesta: { ico: () => Icons.propuesta ? Icons.propuesta(14, '#7c3aed') : '', color: '#7c3aed' },
    };

    return `<div class="cd-section">
      <div class="cd-section-title">${Icons.historial(16, '#475569')} Historial reciente</div>
      ${historial.map(h => {
        const cfg = tipoCfg[h.tipo] || tipoCfg.nota;
        return `<div class="cd-hist-item">
          <span class="cd-hist-ico">${cfg.ico()}</span>
          <span class="cd-hist-tipo" style="color:${cfg.color}">${h.tipo}${h.subtipo ? ' · ' + h.subtipo : ''}</span>
          <span class="cd-hist-desc">${this.esc((h.descripcion || h.titulo || '').substring(0, 50))}</span>
          <span class="cd-hist-time">${this._fmtRelative(h.created_at)}</span>
        </div>`;
      }).join('')}
      <button class="cd-link-btn" onclick="App.navigate('personas');setTimeout(()=>PersonasModule.showFicha(${this.personaId}),300);CallDrawer.close();">
        Ver historial completo
      </button>
    </div>`;
  },

  // ── Acciones rapidas ──
  _renderAcciones() {
    return `<div class="cd-section">
      <div class="cd-section-title">${Icons.add(16, '#475569')} Acciones rapidas</div>
      <div class="cd-actions-grid">
        <button class="cd-quick-btn" onclick="CallDrawer._miniAction('nota')">
          ${Icons.editar(18, '#475569')}<span>Nota</span>
        </button>
        <button class="cd-quick-btn" onclick="CallDrawer._miniAction('agendar')">
          ${Icons.agenda(18, '#475569')}<span>Agendar</span>
        </button>
        <button class="cd-quick-btn" onclick="App.navigate('calculadora');CallDrawer.close();">
          ${Icons.calculadora(18, '#475569')}<span>Calculadora</span>
        </button>
        <button class="cd-quick-btn" onclick="App.navigate('personas');setTimeout(()=>{PersonasModule.showFicha(${this.personaId});setTimeout(()=>PersonasModule.renderTab('propuestas'),400)},300);CallDrawer.close();">
          ${Icons.propuesta ? Icons.propuesta(18, '#475569') : Icons.editar(18, '#475569')}<span>Propuesta</span>
        </button>
        <button class="cd-quick-btn" onclick="App.navigate('grabaciones');CallDrawer.close();">
          ${Icons.grabaciones(18, '#475569')}<span>Grabaciones</span>
        </button>
        <button class="cd-quick-btn" onclick="CallDrawer._miniAction('tramite')">
          ${Icons.tickets(18, '#475569')}<span>Tramite</span>
        </button>
      </div>
    </div>`;
  },

  // ══════════════════════════════════════════
  // LLAMAR desde drawer
  // ══════════════════════════════════════════

  _llamar() {
    const p = this.data?.persona;
    if (!p) return;
    this.callActive = true;
    GVPhone.call(this._normPhone(p.telefono), p.id, p.nombre);
  },

  _sendWA() {
    const p = this.data?.persona;
    if (!p) return;
    App.navigate('personas');
    setTimeout(() => PersonasModule.showFicha(p.id), 300);
    this.close();
  },

  // ══════════════════════════════════════════
  // POST-CALL (resultado)
  // ══════════════════════════════════════════

  showPostCall() {
    this.callActive = false;
    const el = document.getElementById('cd-post-call');
    if (!el) return;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    el.classList.remove('cd-hidden');
    el.innerHTML = `
      <div class="cd-section cd-post-section">
        <div class="cd-section-title">Resultado de la llamada</div>
        <div class="cd-result-grid">
          <button class="cd-res-btn cd-res-green" onclick="CallDrawer._result('interesado')">
            ${Icons.polizas(18, '#065f46')} Interesado
          </button>
          <button class="cd-res-btn cd-res-blue" onclick="CallDrawer._showReagendar()">
            ${Icons.agenda(18, '#1d4ed8')} Volver a llamar
          </button>
          <button class="cd-res-btn cd-res-gray" onclick="CallDrawer._result('descartado')">
            ${Icons.editar(18, '#6b7280')} No interesado
          </button>
          <button class="cd-res-btn cd-res-red" onclick="CallDrawer._result('no_contesta')">
            ${Icons.llamada(18, '#991b1b')} No contesto
          </button>
        </div>
        <div id="cd-reagendar" class="cd-hidden">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0;">
            <div>
              <label class="cd-label">Fecha</label>
              <input type="date" id="cd-reag-fecha" class="cd-input" value="${tomorrowStr}">
            </div>
            <div>
              <label class="cd-label">Hora</label>
              <input type="time" id="cd-reag-hora" class="cd-input" value="10:00">
            </div>
          </div>
          <button class="cd-confirm-btn" onclick="CallDrawer._resultReagendar()">Confirmar</button>
        </div>
        <div style="margin-top:10px;">
          <label class="cd-label">Nota rapida</label>
          <input type="text" id="cd-nota" class="cd-input" placeholder="Nota opcional...">
        </div>
      </div>
    `;
    el.scrollIntoView({ behavior: 'smooth' });
  },

  _showReagendar() {
    document.getElementById('cd-reagendar')?.classList.remove('cd-hidden');
  },

  async _result(resultado) {
    const nota = document.getElementById('cd-nota')?.value?.trim() || '';
    // Registrar en contact_history
    try {
      await API.post('/history', {
        persona_id: this.personaId,
        tipo: 'llamada',
        subtipo: resultado === 'no_contesta' ? 'no_contestada' : 'contestada',
        titulo: `Resultado: ${resultado}`,
        descripcion: nota || resultado,
        origen: 'manual',
      });
    } catch {}

    // Si estamos en modo dialer, notificar al DialerModule
    if (this.mode === 'dialer' && typeof DialerModule !== 'undefined' && DialerModule.current) {
      await DialerModule._submitResult(resultado, nota);
    }

    this.close();
  },

  async _resultReagendar() {
    const fecha = document.getElementById('cd-reag-fecha')?.value;
    const hora = document.getElementById('cd-reag-hora')?.value || '10:00';
    if (!fecha) return;
    const nota = document.getElementById('cd-nota')?.value?.trim() || '';

    if (this.mode === 'dialer' && typeof DialerModule !== 'undefined' && DialerModule.current) {
      await DialerModule._submitResult('reagendado', nota, `${fecha}T${hora}:00`);
    } else {
      // Modo manual: crear tarea
      try {
        await API.post('/tareas', {
          persona_id: this.personaId,
          tipo: 'llamada',
          titulo: 'Devolver llamada',
          descripcion: nota || 'Reagendada desde CallDrawer',
          fecha_venc: `${fecha}T${hora}:00`,
        });
      } catch {}
      await this._result('reagendado');
    }
    this.close();
  },

  // ══════════════════════════════════════════
  // MINI-ACTIONS (nota, agendar, tramite)
  // ══════════════════════════════════════════

  _miniAction(tipo) {
    const body = document.getElementById('cd-body');
    if (!body) return;

    // Insertar mini-modal al final del body
    let existing = document.getElementById('cd-mini-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'cd-mini-modal';
    modal.className = 'cd-mini-modal';

    if (tipo === 'nota') {
      modal.innerHTML = `
        <div class="cd-section-title">Nueva nota</div>
        <textarea id="cd-mini-text" class="cd-input" rows="3" placeholder="Escribe una nota..."></textarea>
        <div style="display:flex;gap:8px;margin-top:8px;">
          <button class="cd-confirm-btn" onclick="CallDrawer._saveNota()">Guardar</button>
          <button class="cd-cancel-btn" onclick="document.getElementById('cd-mini-modal').remove()">Cancelar</button>
        </div>
      `;
    } else if (tipo === 'agendar') {
      const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
      modal.innerHTML = `
        <div class="cd-section-title">Agendar llamada</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <div><label class="cd-label">Fecha</label><input type="date" id="cd-ag-fecha" class="cd-input" value="${tomorrow.toISOString().split('T')[0]}"></div>
          <div><label class="cd-label">Hora</label><input type="time" id="cd-ag-hora" class="cd-input" value="10:00"></div>
        </div>
        <input type="text" id="cd-ag-desc" class="cd-input" placeholder="Descripcion..." style="margin-top:8px;">
        <div style="display:flex;gap:8px;margin-top:8px;">
          <button class="cd-confirm-btn" onclick="CallDrawer._saveAgendar()">Guardar</button>
          <button class="cd-cancel-btn" onclick="document.getElementById('cd-mini-modal').remove()">Cancelar</button>
        </div>
      `;
    } else if (tipo === 'tramite') {
      modal.innerHTML = `
        <div class="cd-section-title">Nuevo tramite</div>
        <input type="text" id="cd-tr-desc" class="cd-input" placeholder="Descripcion del tramite...">
        <div style="display:flex;gap:8px;margin-top:8px;">
          <button class="cd-confirm-btn" onclick="CallDrawer._saveTramite()">Crear</button>
          <button class="cd-cancel-btn" onclick="document.getElementById('cd-mini-modal').remove()">Cancelar</button>
        </div>
      `;
    }

    body.appendChild(modal);
    modal.scrollIntoView({ behavior: 'smooth' });
  },

  async _saveNota() {
    const texto = document.getElementById('cd-mini-text')?.value?.trim();
    if (!texto) return;
    try {
      await API.post('/history', {
        persona_id: this.personaId, tipo: 'nota',
        titulo: 'Nota rapida', descripcion: texto, origen: 'manual',
      });
      document.getElementById('cd-mini-modal')?.remove();
    } catch (e) { alert(e.message); }
  },

  async _saveAgendar() {
    const fecha = document.getElementById('cd-ag-fecha')?.value;
    const hora = document.getElementById('cd-ag-hora')?.value || '10:00';
    const desc = document.getElementById('cd-ag-desc')?.value?.trim() || 'Llamada agendada';
    if (!fecha) return;
    try {
      await API.post('/tareas', {
        persona_id: this.personaId, tipo: 'llamada',
        titulo: desc, fecha_venc: `${fecha}T${hora}:00`,
      });
      document.getElementById('cd-mini-modal')?.remove();
    } catch (e) { alert(e.message); }
  },

  async _saveTramite() {
    const desc = document.getElementById('cd-tr-desc')?.value?.trim();
    if (!desc) return;
    try {
      await API.post('/tickets', {
        contacto_id: this.personaId, descripcion: desc,
      });
      document.getElementById('cd-mini-modal')?.remove();
    } catch (e) { alert(e.message); }
  },

  // ══════════════════════════════════════════
  // TIMER
  // ══════════════════════════════════════════

  _stopTimer() {
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
  },

  // ══════════════════════════════════════════
  // CSS
  // ══════════════════════════════════════════

  _getCSS() {
    return `
      .cd-overlay{position:fixed;inset:0;background:rgba(15,23,42,.3);z-index:850;transition:opacity .2s;}
      .cd-overlay.cd-hidden{opacity:0;pointer-events:none;}
      .cd-drawer{position:fixed;top:0;right:0;width:480px;height:100vh;background:#fff;z-index:860;box-shadow:-8px 0 32px rgba(0,0,0,.12);display:flex;flex-direction:column;transition:transform .25s ease;overflow:hidden;}
      .cd-drawer.cd-closed{transform:translateX(100%);}
      .cd-hidden{display:none!important;}

      /* Header */
      #cd-header{flex-shrink:0;border-bottom:1px solid #e8edf2;padding:16px 20px 12px;}
      .cd-head-top{display:flex;align-items:flex-start;gap:12px;}
      .cd-avatar{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:#fff;flex-shrink:0;}
      .cd-head-info{flex:1;min-width:0;}
      .cd-head-name{font-size:16px;font-weight:700;color:#0f172a;}
      .cd-head-phone{font-size:13px;font-weight:600;color:#009DDD;cursor:pointer;display:inline-block;padding:2px 8px;background:#e6f6fd;border-radius:6px;margin-top:3px;}
      .cd-head-phone:hover{background:#ccedf9;}
      .cd-close-btn{background:none;border:none;color:#94a3b8;cursor:pointer;padding:4px;border-radius:6px;flex-shrink:0;}
      .cd-close-btn:hover{color:#0f172a;background:#f4f6f9;}

      /* Seguros badges */
      .cd-seguros{display:flex;flex-wrap:wrap;gap:4px;margin-top:10px;}
      .cd-seguro-badge{padding:3px 8px;border-radius:6px;font-size:11px;font-weight:600;background:#f0fdf4;color:#065f46;border:1px solid #bbf7d0;}

      /* Asegurados */
      .cd-asegurados{display:flex;gap:8px;margin-top:10px;overflow-x:auto;padding-bottom:2px;}
      .cd-aseg{display:flex;align-items:center;gap:4px;flex-shrink:0;}
      .cd-aseg-av{width:22px;height:22px;border-radius:50%;background:#e8edf2;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;color:#475569;}
      .cd-aseg-name{font-size:10px;color:#94a3b8;white-space:nowrap;}

      /* Action buttons */
      .cd-head-actions{display:flex;gap:6px;margin-top:12px;}
      .cd-action-btn{display:flex;align-items:center;gap:5px;padding:7px 12px;border-radius:8px;border:1px solid #e8edf2;background:#fff;font-size:12px;font-weight:600;color:#475569;cursor:pointer;font-family:inherit;transition:all .15s;}
      .cd-action-btn:hover{background:#f4f6f9;border-color:#d1d9e0;}
      .cd-action-call{background:#10b981;color:#fff;border-color:#10b981;}
      .cd-action-call:hover{background:#059669;}

      /* Body */
      .cd-body{flex:1;overflow-y:auto;padding:0 20px 20px;}

      /* Sections */
      .cd-section{padding:14px 0;border-bottom:1px solid #f0f2f5;}
      .cd-section:last-child{border-bottom:none;}
      .cd-section-title{font-size:12px;font-weight:700;color:#475569;margin-bottom:8px;display:flex;align-items:center;gap:6px;}

      /* Briefing */
      .cd-briefing{background:#e6f6fd;margin:14px -20px 0;padding:14px 20px!important;border-bottom:none!important;}
      .cd-briefing-ia{background:#eff6ff;margin:14px -20px 0;padding:14px 20px!important;border-bottom:none!important;}
      .cd-brief-item{font-size:12px;color:#475569;padding:3px 0;display:flex;align-items:center;gap:6px;line-height:1.4;}
      .cd-brief-item strong{color:#0f172a;font-weight:600;}

      /* Historial */
      .cd-hist-item{display:flex;align-items:center;gap:6px;padding:4px 0;font-size:12px;}
      .cd-hist-ico{flex-shrink:0;}
      .cd-hist-tipo{font-weight:600;min-width:70px;flex-shrink:0;}
      .cd-hist-desc{color:#475569;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .cd-hist-time{color:#94a3b8;flex-shrink:0;font-size:11px;}
      .cd-link-btn{background:none;border:none;color:#009DDD;font-size:12px;font-weight:600;cursor:pointer;padding:6px 0;font-family:inherit;}
      .cd-link-btn:hover{text-decoration:underline;}

      /* Quick actions grid */
      .cd-actions-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;}
      .cd-quick-btn{display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 8px;border-radius:10px;border:1px solid #e8edf2;background:#fff;cursor:pointer;font-family:inherit;font-size:11px;font-weight:600;color:#475569;transition:all .15s;}
      .cd-quick-btn:hover{background:#f4f6f9;border-color:#d1d9e0;transform:translateY(-1px);}

      /* Post-call */
      .cd-post-section{background:#f8fafc;margin:0 -20px;padding:14px 20px!important;border-top:2px solid #009DDD;}
      .cd-result-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;}
      .cd-res-btn{display:flex;align-items:center;justify-content:center;gap:6px;padding:12px;border-radius:10px;border:2px solid transparent;background:#f4f6f9;cursor:pointer;font-family:inherit;font-size:12px;font-weight:600;color:#475569;transition:all .15s;}
      .cd-res-btn:hover{transform:translateY(-1px);box-shadow:0 2px 8px rgba(0,0,0,.06);}
      .cd-res-green:hover{border-color:#10b981;background:#f0fdf4;color:#065f46;}
      .cd-res-blue:hover{border-color:#3b82f6;background:#eff6ff;color:#1d4ed8;}
      .cd-res-gray:hover{border-color:#94a3b8;background:#f9fafb;color:#374151;}
      .cd-res-red:hover{border-color:#ef4444;background:#fef2f2;color:#991b1b;}

      /* Inputs */
      .cd-label{font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.3px;display:block;margin-bottom:3px;}
      .cd-input{width:100%;padding:8px 10px;border:1px solid #e8edf2;border-radius:8px;font-size:13px;font-family:inherit;color:#0f172a;box-sizing:border-box;}
      .cd-input:focus{outline:none;border-color:#009DDD;box-shadow:0 0 0 3px rgba(0,157,221,.1);}
      .cd-confirm-btn{padding:8px 16px;border-radius:8px;border:none;background:#009DDD;color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;}
      .cd-confirm-btn:hover{background:#0088c2;}
      .cd-cancel-btn{padding:8px 16px;border-radius:8px;border:1px solid #e8edf2;background:#fff;color:#475569;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;}

      /* Mini modal */
      .cd-mini-modal{background:#f8fafc;margin:0 -20px;padding:14px 20px;border-top:1px solid #e8edf2;animation:cd-slide-up .2s ease;}
      @keyframes cd-slide-up{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}

      /* Responsive */
      @media(max-width:768px){
        .cd-drawer{width:100%;}
      }
    `;
  },
};

// Exponer globalmente
window.CallDrawer = CallDrawer;
