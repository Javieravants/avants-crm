// === Power Dialer — Pantalla agente ===
// Modo focus: sin sidebar, una sola cosa a la vez

const DialerModule = {
  state: 'idle',  // idle | active | calling | paused | done
  sesion: null,
  current: null,  // campana_contacto actual
  stats: { pendientes: 0, urgentes: 0, reagendadas_hoy: 0, completados: 0 },
  sesionStats: { realizadas: 0, contestadas: 0 },
  sesionStart: null,
  timerInterval: null,
  pollInterval: null,
  callStartTime: null,
  callTimerInterval: null,

  esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; },

  _normPhone(phone) {
    if (!phone) return '';
    const d = phone.replace(/\D/g, '');
    if (d.startsWith('34') && d.length === 11) return '+' + d;
    if (d.length === 9) return '+34' + d;
    if (phone.startsWith('+')) return phone.replace(/\s/g, '');
    return '+' + d;
  },

  _fmtTime(secs) {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
      : `${m}:${String(s).padStart(2,'0')}`;
  },

  _prioLabel(p) {
    const map = {
      1: { color: '#ef4444', bg: '#fef2f2', label: 'Urgente — devolver llamada' },
      2: { color: '#f59e0b', bg: '#fffbeb', label: 'Seguimiento cierre' },
      3: { color: '#3b82f6', bg: '#eff6ff', label: 'Lead nuevo' },
      4: { color: '#10b981', bg: '#f0fdf4', label: 'Recuperacion' },
    };
    return map[p] || map[3];
  },

  // ══════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════

  async render() {
    const c = document.getElementById('main-content');
    c.style.padding = '0';
    c.style.overflow = 'auto';

    // Inyectar CSS
    if (!document.getElementById('dl-css')) {
      const st = document.createElement('style'); st.id = 'dl-css';
      st.textContent = this.getCSS();
      document.head.appendChild(st);
    }

    // Cargar cola
    const user = Auth.getUser();
    if (!user) return;

    try {
      const data = await API.get(`/dialer/cola/${user.id}`);
      this.stats = data.stats || {};
      const cola = data.cola || [];
      this.current = cola[0] || null;

      if (this.state === 'idle') {
        this._renderIdle(c, cola);
      } else {
        this._renderActive(c);
      }
    } catch (err) {
      c.innerHTML = `<div class="dl-center"><p style="color:#ef4444">${err.message}</p></div>`;
    }
  },

  // ══════════════════════════════════════════
  // ESTADO IDLE — antes de iniciar
  // ══════════════════════════════════════════

  _renderIdle(c, cola) {
    const s = this.stats;
    const total = parseInt(s.pendientes) || 0;
    const urgentes = parseInt(s.urgentes) || 0;
    const reagendadas = parseInt(s.reagendadas_hoy) || 0;

    // Contar por prioridad
    const byPrio = { 1: 0, 2: 0, 3: 0, 4: 0 };
    cola.forEach(cc => { byPrio[cc.prioridad] = (byPrio[cc.prioridad] || 0) + 1; });

    c.innerHTML = `
      <div class="dl-idle-wrap">
        <div class="dl-idle-card">
          <div class="dl-idle-icon">${Icons.llamada(48, '#009DDD')}</div>
          <h2 class="dl-idle-title">Tu jornada de llamadas</h2>
          <p class="dl-idle-subtitle">${total} llamadas en cola</p>

          <div class="dl-prio-grid">
            ${this._prioRow(1, byPrio[1], 'Devolver llamada (cliente llamo al 900)')}
            ${this._prioRow(2, byPrio[2], 'Seguimientos para cerrar poliza')}
            ${this._prioRow(3, byPrio[3], 'Leads nuevos del dia')}
            ${this._prioRow(4, byPrio[4], 'Recuperacion')}
          </div>

          ${total > 0 ? `
            <button class="dl-btn-start" onclick="DialerModule.iniciarJornada()">
              ${Icons.llamada(20, '#fff')} Iniciar jornada de llamadas
            </button>
          ` : `
            <div style="text-align:center;padding:20px;color:#94a3b8;">
              <p style="font-size:14px;font-weight:600;">Sin llamadas pendientes</p>
              <p style="font-size:12px;">Tu admin asignara contactos a tus campanas</p>
            </div>
          `}
        </div>
      </div>
    `;
  },

  _prioRow(prio, count, label) {
    const p = this._prioLabel(prio);
    return `
      <div class="dl-prio-row">
        <span class="dl-prio-dot" style="background:${p.color};"></span>
        <span class="dl-prio-label">${label}</span>
        <span class="dl-prio-count" style="color:${p.color};font-weight:700;">${count || 0}</span>
      </div>
    `;
  },

  // ══════════════════════════════════════════
  // INICIAR JORNADA
  // ══════════════════════════════════════════

  async iniciarJornada() {
    try {
      const data = await API.post('/dialer/sesion/iniciar', {});
      this.sesion = data.sesion;
      this.current = data.siguiente;
      this.state = 'active';
      this.sesionStart = Date.now();
      this.sesionStats = { realizadas: 0, contestadas: 0 };
      this._startSesionTimer();
      this._renderActive(document.getElementById('main-content'));
    } catch (err) {
      alert('Error al iniciar: ' + err.message);
    }
  },

  // ══════════════════════════════════════════
  // ESTADO ACTIVO — contacto actual
  // ══════════════════════════════════════════

  _renderActive(c) {
    if (!this.current) {
      this._renderDone(c);
      return;
    }

    const cc = this.current;
    const prio = this._prioLabel(cc.prioridad);
    const phone = this._normPhone(cc.telefono);
    const historial = (cc.historial || []).slice(0, 3);
    const isCalling = this.state === 'calling';

    c.innerHTML = `
      <div class="dl-active-wrap">
        <div class="dl-top-bar">
          <div class="dl-session-info">
            ${Icons.llamada(16, '#009DDD')}
            <span id="dl-session-timer">0:00</span>
            <span class="dl-sep"></span>
            <span>Llamada <strong id="dl-call-num">${this.sesionStats.realizadas + 1}</strong></span>
            <span class="dl-sep"></span>
            <span>${Icons.llamada(14, '#10b981')} <strong id="dl-call-ok">${this.sesionStats.contestadas}</strong> contestadas</span>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="dl-btn-sm" onclick="DialerModule.pausar()">${this.state === 'paused' ? 'Reanudar' : 'Pausa'}</button>
            <button class="dl-btn-sm dl-btn-danger" onclick="DialerModule.finalizarJornada()">Finalizar</button>
          </div>
        </div>

        <div class="dl-contact-card">
          <div class="dl-contact-head">
            <div class="dl-contact-avatar" style="background:hsl(${((cc.persona_id||0)*47)%360},55%,55%)">
              ${(cc.persona_nombre||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}
            </div>
            <div class="dl-contact-info">
              <div class="dl-contact-name">${this.esc(cc.persona_nombre)}</div>
              <div class="dl-contact-phone">${phone}</div>
              ${cc.producto ? `<div class="dl-contact-product">${this.esc(cc.compania ? cc.compania + ' · ' : '')}${this.esc(cc.producto)}</div>` : ''}
              ${cc.pipeline_nombre ? `<div class="dl-contact-stage">${this.esc(cc.pipeline_nombre)}${cc.stage_nombre ? ' → ' + this.esc(cc.stage_nombre) : ''}</div>` : ''}
            </div>
            <div class="dl-prio-badge" style="background:${prio.bg};color:${prio.color};border:1px solid ${prio.color}30;">
              ${prio.label}
            </div>
          </div>

          ${cc.prioridad === 1 ? `
            <div class="dl-alert-bar">
              ${Icons.llamada(16, '#dc2626')}
              <span>Este cliente intento llamar al 900 — devolver llamada lo antes posible</span>
            </div>
          ` : ''}

          ${historial.length ? `
            <div class="dl-history">
              <div class="dl-history-title">Ultimas interacciones</div>
              ${historial.map(h => {
                const d = new Date(h.created_at);
                const timeStr = d.toLocaleString('es-ES', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
                return `<div class="dl-history-item">
                  <span class="dl-history-tipo">${h.tipo}${h.subtipo ? ' · ' + h.subtipo : ''}</span>
                  <span class="dl-history-desc">${this.esc((h.descripcion || h.titulo || '').substring(0, 60))}</span>
                  <span class="dl-history-time">${timeStr}</span>
                </div>`;
              }).join('')}
            </div>
          ` : ''}

          <div class="dl-contact-meta">
            ${cc.persona_email ? `<span>${Icons.email(14, '#94a3b8')} ${this.esc(cc.persona_email)}</span>` : ''}
            ${cc.dni ? `<span>DNI: ${this.esc(cc.dni)}</span>` : ''}
            ${cc.provincia ? `<span>${this.esc(cc.provincia)}</span>` : ''}
            ${cc.intentos > 0 ? `<span>Intentos: ${cc.intentos}</span>` : ''}
          </div>
        </div>

        <div class="dl-actions">
          ${isCalling ? `
            <div class="dl-calling-indicator">
              <div class="dl-calling-pulse"></div>
              <span id="dl-call-timer">Llamando... 0:00</span>
            </div>
            <button class="dl-btn-result" onclick="DialerModule.showResultPopup()">
              Registrar resultado
            </button>
          ` : `
            <button class="dl-btn-call" onclick="DialerModule.llamar()">
              ${Icons.llamada(24, '#fff')} Llamar
            </button>
            <button class="dl-btn-skip" onclick="DialerModule.saltar()">
              Saltar contacto
            </button>
          `}
        </div>

        <button class="dl-btn-ficha" onclick="App.navigate('personas');setTimeout(()=>PersonasModule.showFicha(${cc.persona_id}),300)">
          Ver ficha completa
        </button>
      </div>

      <div id="dl-result-overlay" class="dl-overlay dl-hidden"></div>
    `;

    this._updateSesionTimer();
    if (isCalling) this._startCallTimer();
  },

  // ══════════════════════════════════════════
  // LLAMAR
  // ══════════════════════════════════════════

  async llamar() {
    if (!this.current) return;
    try {
      this.state = 'calling';
      this.callStartTime = Date.now();
      this.sesionStats.realizadas++;
      // Dialer endpoint marca contacto + llama via CTI backend
      await API.post(`/dialer/llamar/${this.current.id}`, {});
      // Abrir marcador flotante Gestavly (CTI-agnostico)
      const phone = this._normPhone(this.current.telefono);
      if (typeof GVPhone !== 'undefined') {
        GVPhone.call(phone, this.current.persona_id, this.current.persona_nombre);
      }
      this._renderActive(document.getElementById('main-content'));
      // Polling para detectar fin de llamada
      this._startCallPolling();
    } catch (err) {
      alert('Error: ' + err.message);
      this.state = 'active';
    }
  },

  // Polling para detectar fin de llamada (webhook CloudTalk → contact_history)
  _startCallPolling() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    const personaId = this.current?.persona_id;
    if (!personaId) return;

    // Guardar timestamp de inicio para detectar nuevas entradas
    const callStart = new Date().toISOString();

    this.pollInterval = setInterval(async () => {
      try {
        const r = await API.get(`/history/${personaId}?tipo=llamada&limit=1`);
        const last = (r.data || [])[0];
        if (last && new Date(last.created_at) > new Date(callStart)) {
          // CloudTalk registro la llamada → mostrar popup resultado
          clearInterval(this.pollInterval);
          this.pollInterval = null;
          this.showResultPopup();
        }
      } catch {}
    }, 3000);
  },

  _stopCallPolling() {
    if (this.pollInterval) { clearInterval(this.pollInterval); this.pollInterval = null; }
  },

  // ══════════════════════════════════════════
  // POPUP RESULTADO
  // ══════════════════════════════════════════

  showResultPopup() {
    this._stopCallPolling();
    this._stopCallTimer();
    const overlay = document.getElementById('dl-result-overlay');
    if (!overlay) return;

    const duracion = this.callStartTime ? Math.floor((Date.now() - this.callStartTime) / 1000) : 0;

    overlay.className = 'dl-overlay';
    overlay.innerHTML = `
      <div class="dl-result-card">
        <div class="dl-result-title">Como fue la llamada?</div>
        ${duracion > 0 ? `<div class="dl-result-dur">Duracion: ${this._fmtTime(duracion)}</div>` : ''}

        <div class="dl-result-grid">
          <button class="dl-result-btn dl-rb-green" onclick="DialerModule._submitResult('interesado')">
            ${Icons.polizas(20, '#065f46')}
            <span>Interesado</span>
          </button>
          <button class="dl-result-btn dl-rb-blue" onclick="DialerModule._showReagendar()">
            ${Icons.agendar(20, '#1d4ed8')}
            <span>Volver a llamar</span>
          </button>
          <button class="dl-result-btn dl-rb-gray" onclick="DialerModule._submitResult('descartado')">
            ${Icons.colgar ? Icons.colgar(20, '#6b7280') : '&times;'}
            <span>No interesado</span>
          </button>
          <button class="dl-result-btn dl-rb-red" onclick="DialerModule._submitResult('no_contesta')">
            ${Icons.llamada(20, '#991b1b')}
            <span>No contesto</span>
          </button>
        </div>

        <div id="dl-reagendar-wrap" class="dl-hidden">
          <div class="dl-reagendar-fields">
            <div>
              <label class="dl-field-label">Fecha</label>
              <input type="date" id="dl-reagendar-fecha" class="dl-field-input">
            </div>
            <div>
              <label class="dl-field-label">Hora</label>
              <input type="time" id="dl-reagendar-hora" class="dl-field-input" value="10:00">
            </div>
          </div>
          <button class="dl-btn-confirm" onclick="DialerModule._submitReagendar()">
            Confirmar y siguiente
          </button>
        </div>

        <div style="margin-top:12px;">
          <label class="dl-field-label">Nota rapida (opcional)</label>
          <input type="text" id="dl-nota" class="dl-field-input" placeholder="Ej: Le interesa el dental, llamar manana a las 10...">
        </div>
      </div>
    `;

    // Prefill fecha de manana
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const fechaEl = document.getElementById('dl-reagendar-fecha');
    if (fechaEl) fechaEl.value = tomorrow.toISOString().split('T')[0];
  },

  _showReagendar() {
    const wrap = document.getElementById('dl-reagendar-wrap');
    if (wrap) wrap.classList.remove('dl-hidden');
  },

  async _submitReagendar() {
    const fecha = document.getElementById('dl-reagendar-fecha')?.value;
    const hora = document.getElementById('dl-reagendar-hora')?.value || '10:00';
    if (!fecha) { alert('Selecciona una fecha'); return; }

    const proximo = `${fecha}T${hora}:00`;
    const nota = document.getElementById('dl-nota')?.value?.trim() || '';
    await this._submitResult('reagendado', nota, proximo);
  },

  async _submitResult(resultado, notaOverride, proximoIntento) {
    if (!this.current) return;
    const nota = notaOverride ?? (document.getElementById('dl-nota')?.value?.trim() || '');

    try {
      const body = {
        campana_contacto_id: this.current.id,
        resultado,
        nota: nota || null,
      };
      if (proximoIntento) body.proximo_intento = proximoIntento;

      const data = await API.post('/dialer/llamada/resultado', body);

      if (['interesado', 'completado'].includes(resultado)) {
        this.sesionStats.contestadas++;
      }

      // Cargar siguiente
      this.current = data.siguiente;
      this.state = this.current ? 'active' : 'done';
      this.callStartTime = null;
      this._renderActive(document.getElementById('main-content'));
    } catch (err) {
      alert('Error: ' + err.message);
    }
  },

  // ══════════════════════════════════════════
  // SALTAR CONTACTO
  // ══════════════════════════════════════════

  async saltar() {
    if (!this.current) return;
    // Mover al final sin gastar intento: reagendar +30min
    const proximo = new Date(Date.now() + 30 * 60000).toISOString();
    await this._submitResult('reagendado', 'Saltado por agente', proximo);
  },

  // ══════════════════════════════════════════
  // PAUSA / FINALIZAR
  // ══════════════════════════════════════════

  pausar() {
    if (this.state === 'paused') {
      this.state = 'active';
      this._renderActive(document.getElementById('main-content'));
    } else {
      this.state = 'paused';
      const c = document.getElementById('main-content');
      const elapsed = this.sesionStart ? Math.floor((Date.now() - this.sesionStart) / 1000) : 0;
      c.innerHTML = `
        <div class="dl-center">
          <div class="dl-pause-card">
            ${Icons.fichate(48, '#f59e0b')}
            <h2 style="margin:12px 0 4px;font-size:18px;color:#0f172a;">Jornada en pausa</h2>
            <p style="color:#94a3b8;font-size:13px;">Tiempo de sesion: ${this._fmtTime(elapsed)}</p>
            <div style="display:flex;gap:12px;margin-top:20px;">
              <button class="dl-btn-start" onclick="DialerModule.pausar()">
                ${Icons.llamada(18, '#fff')} Reanudar jornada
              </button>
              <button class="dl-btn-sm dl-btn-danger" onclick="DialerModule.finalizarJornada()">Finalizar</button>
            </div>
          </div>
        </div>
      `;
    }
  },

  async finalizarJornada() {
    this._stopSesionTimer();
    this._stopCallPolling();
    this._stopCallTimer();
    try {
      await API.post('/dialer/sesion/finalizar', {});
    } catch {}
    this.state = 'idle';
    this.sesion = null;
    this.current = null;
    this.render();
  },

  // ══════════════════════════════════════════
  // ESTADO DONE — sin cola
  // ══════════════════════════════════════════

  _renderDone(c) {
    this._stopSesionTimer();
    this._stopCallPolling();
    const elapsed = this.sesionStart ? Math.floor((Date.now() - this.sesionStart) / 1000) : 0;

    c.innerHTML = `
      <div class="dl-center">
        <div class="dl-done-card">
          <div style="font-size:48px;margin-bottom:8px;">&#127881;</div>
          <h2 style="font-size:20px;color:#0f172a;margin:0 0 8px;">Has terminado tu cola</h2>
          <div class="dl-done-stats">
            <div class="dl-done-stat">
              <div class="dl-done-num">${this.sesionStats.realizadas}</div>
              <div class="dl-done-label">Llamadas</div>
            </div>
            <div class="dl-done-stat">
              <div class="dl-done-num" style="color:#10b981;">${this.sesionStats.contestadas}</div>
              <div class="dl-done-label">Contestadas</div>
            </div>
            <div class="dl-done-stat">
              <div class="dl-done-num">${this._fmtTime(elapsed)}</div>
              <div class="dl-done-label">Duracion</div>
            </div>
          </div>
          <button class="dl-btn-sm" style="margin-top:20px;" onclick="DialerModule.finalizarJornada()">
            Cerrar sesion
          </button>
        </div>
      </div>
    `;
    this.state = 'done';
  },

  // ══════════════════════════════════════════
  // TIMERS
  // ══════════════════════════════════════════

  _startSesionTimer() {
    this._stopSesionTimer();
    this.timerInterval = setInterval(() => this._updateSesionTimer(), 1000);
  },
  _stopSesionTimer() {
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
  },
  _updateSesionTimer() {
    if (!this.sesionStart) return;
    const el = document.getElementById('dl-session-timer');
    if (el) el.textContent = this._fmtTime(Math.floor((Date.now() - this.sesionStart) / 1000));
    const numEl = document.getElementById('dl-call-num');
    if (numEl) numEl.textContent = this.sesionStats.realizadas + 1;
    const okEl = document.getElementById('dl-call-ok');
    if (okEl) okEl.textContent = this.sesionStats.contestadas;
  },

  _startCallTimer() {
    this._stopCallTimer();
    this.callTimerInterval = setInterval(() => {
      if (!this.callStartTime) return;
      const el = document.getElementById('dl-call-timer');
      if (el) el.textContent = 'Llamando... ' + this._fmtTime(Math.floor((Date.now() - this.callStartTime) / 1000));
    }, 1000);
  },
  _stopCallTimer() {
    if (this.callTimerInterval) { clearInterval(this.callTimerInterval); this.callTimerInterval = null; }
  },

  // ══════════════════════════════════════════
  // CSS
  // ══════════════════════════════════════════

  getCSS() {
    return `
      /* Layout */
      .dl-center{display:flex;align-items:center;justify-content:center;min-height:calc(100vh - 60px);padding:20px;background:#f4f6f9;}
      .dl-hidden{display:none!important;}

      /* Idle */
      .dl-idle-wrap{display:flex;align-items:center;justify-content:center;min-height:calc(100vh - 60px);background:#f4f6f9;padding:20px;}
      .dl-idle-card{background:#fff;border-radius:16px;padding:40px;max-width:480px;width:100%;box-shadow:0 4px 24px rgba(0,0,0,.06);text-align:center;}
      .dl-idle-icon{margin-bottom:16px;}
      .dl-idle-title{font-size:22px;font-weight:800;color:#0f172a;margin:0 0 4px;}
      .dl-idle-subtitle{font-size:14px;color:#94a3b8;margin:0 0 24px;}
      .dl-prio-grid{text-align:left;margin-bottom:24px;}
      .dl-prio-row{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;}
      .dl-prio-row:hover{background:#f4f6f9;}
      .dl-prio-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;}
      .dl-prio-label{font-size:13px;color:#475569;flex:1;}
      .dl-prio-count{font-size:15px;min-width:24px;text-align:right;}
      .dl-btn-start{display:inline-flex;align-items:center;gap:8px;padding:14px 32px;border-radius:12px;border:none;background:#009DDD;color:#fff;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s;box-shadow:0 4px 16px rgba(0,157,221,.3);}
      .dl-btn-start:hover{background:#0088c2;transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,157,221,.4);}

      /* Top bar */
      .dl-active-wrap{display:flex;flex-direction:column;align-items:center;min-height:calc(100vh - 60px);background:#f4f6f9;padding:0 20px 40px;}
      .dl-top-bar{display:flex;align-items:center;justify-content:space-between;width:100%;max-width:640px;padding:16px 0;gap:12px;flex-wrap:wrap;}
      .dl-session-info{display:flex;align-items:center;gap:8px;font-size:13px;color:#475569;}
      .dl-sep{width:1px;height:16px;background:#e8edf2;}
      .dl-btn-sm{padding:6px 14px;border-radius:8px;border:1px solid #e8edf2;background:#fff;color:#475569;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;}
      .dl-btn-sm:hover{border-color:#d1d9e0;background:#f4f6f9;}
      .dl-btn-danger{color:#ef4444;border-color:#fca5a5;}
      .dl-btn-danger:hover{background:#fef2f2;}

      /* Contact card */
      .dl-contact-card{background:#fff;border-radius:16px;width:100%;max-width:640px;box-shadow:0 4px 24px rgba(0,0,0,.06);overflow:hidden;}
      .dl-contact-head{display:flex;align-items:flex-start;gap:14px;padding:20px 24px;flex-wrap:wrap;}
      .dl-contact-avatar{width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;color:#fff;flex-shrink:0;}
      .dl-contact-info{flex:1;min-width:0;}
      .dl-contact-name{font-size:18px;font-weight:800;color:#0f172a;}
      .dl-contact-phone{font-size:15px;color:#009DDD;font-weight:600;margin-top:2px;letter-spacing:.3px;}
      .dl-contact-product{font-size:12px;color:#475569;margin-top:4px;}
      .dl-contact-stage{font-size:11px;color:#94a3b8;margin-top:2px;}
      .dl-prio-badge{padding:4px 12px;border-radius:8px;font-size:11px;font-weight:700;white-space:nowrap;align-self:flex-start;margin-top:4px;}
      .dl-alert-bar{display:flex;align-items:center;gap:8px;padding:10px 24px;background:#fef2f2;border-top:1px solid #fca5a5;font-size:12px;font-weight:600;color:#dc2626;}

      /* History */
      .dl-history{padding:0 24px 12px;border-top:1px solid #f0f2f5;}
      .dl-history-title{font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;padding:10px 0 6px;}
      .dl-history-item{display:flex;align-items:center;gap:8px;padding:4px 0;font-size:12px;}
      .dl-history-tipo{color:#009DDD;font-weight:600;min-width:80px;}
      .dl-history-desc{color:#475569;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .dl-history-time{color:#94a3b8;font-size:11px;flex-shrink:0;}

      /* Meta */
      .dl-contact-meta{display:flex;flex-wrap:wrap;gap:8px;padding:10px 24px 14px;border-top:1px solid #f0f2f5;font-size:11px;color:#94a3b8;}
      .dl-contact-meta span{display:flex;align-items:center;gap:4px;}

      /* Actions */
      .dl-actions{display:flex;flex-direction:column;align-items:center;gap:10px;margin-top:20px;width:100%;max-width:640px;}
      .dl-btn-call{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:16px;border-radius:12px;border:none;background:#10b981;color:#fff;font-size:17px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s;box-shadow:0 4px 16px rgba(16,185,129,.3);}
      .dl-btn-call:hover{background:#059669;transform:translateY(-1px);}
      .dl-btn-skip{padding:8px 16px;border-radius:8px;border:none;background:transparent;color:#94a3b8;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;}
      .dl-btn-skip:hover{background:#f4f6f9;color:#475569;}
      .dl-btn-ficha{margin-top:8px;padding:8px 16px;border-radius:8px;border:1px solid #e8edf2;background:#fff;color:#009DDD;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;}
      .dl-btn-ficha:hover{background:#f0f9ff;}

      /* Calling */
      .dl-calling-indicator{display:flex;align-items:center;gap:12px;padding:16px;font-size:15px;font-weight:600;color:#009DDD;}
      .dl-calling-pulse{width:14px;height:14px;border-radius:50%;background:#10b981;animation:dl-pulse 1.2s infinite;}
      @keyframes dl-pulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.5;transform:scale(1.3);}}
      .dl-btn-result{padding:12px 24px;border-radius:10px;border:none;background:#009DDD;color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;width:100%;max-width:640px;}
      .dl-btn-result:hover{background:#0088c2;}

      /* Result overlay */
      .dl-overlay{position:fixed;inset:0;background:rgba(15,23,42,.6);z-index:900;display:flex;align-items:center;justify-content:center;padding:20px;}
      .dl-result-card{background:#fff;border-radius:16px;padding:28px;width:420px;max-width:100%;box-shadow:0 20px 60px rgba(0,0,0,.2);}
      .dl-result-title{font-size:17px;font-weight:800;color:#0f172a;text-align:center;margin-bottom:4px;}
      .dl-result-dur{font-size:12px;color:#94a3b8;text-align:center;margin-bottom:16px;}
      .dl-result-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;}
      .dl-result-btn{display:flex;flex-direction:column;align-items:center;gap:6px;padding:16px 10px;border-radius:12px;border:2px solid transparent;background:#f4f6f9;cursor:pointer;font-family:inherit;font-size:12px;font-weight:600;color:#475569;transition:all .15s;}
      .dl-result-btn:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.08);}
      .dl-rb-green:hover{border-color:#10b981;background:#f0fdf4;color:#065f46;}
      .dl-rb-blue:hover{border-color:#3b82f6;background:#eff6ff;color:#1d4ed8;}
      .dl-rb-gray:hover{border-color:#94a3b8;background:#f9fafb;color:#374151;}
      .dl-rb-red:hover{border-color:#ef4444;background:#fef2f2;color:#991b1b;}

      /* Reagendar */
      .dl-reagendar-fields{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0 8px;}
      .dl-field-label{font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.3px;display:block;margin-bottom:3px;}
      .dl-field-input{width:100%;padding:8px 10px;border:1px solid #e8edf2;border-radius:8px;font-size:13px;font-family:inherit;color:#0f172a;box-sizing:border-box;}
      .dl-field-input:focus{outline:none;border-color:#009DDD;box-shadow:0 0 0 3px rgba(0,157,221,.1);}
      .dl-btn-confirm{width:100%;padding:10px;border-radius:8px;border:none;background:#3b82f6;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}
      .dl-btn-confirm:hover{background:#2563eb;}

      /* Done */
      .dl-done-card{background:#fff;border-radius:16px;padding:40px;max-width:420px;width:100%;box-shadow:0 4px 24px rgba(0,0,0,.06);text-align:center;}
      .dl-done-stats{display:flex;justify-content:center;gap:24px;margin-top:20px;}
      .dl-done-stat{text-align:center;}
      .dl-done-num{font-size:28px;font-weight:800;color:#0f172a;}
      .dl-done-label{font-size:11px;color:#94a3b8;font-weight:500;margin-top:2px;}

      /* Pause */
      .dl-pause-card{background:#fff;border-radius:16px;padding:40px;max-width:420px;width:100%;box-shadow:0 4px 24px rgba(0,0,0,.06);text-align:center;}

      /* Responsive tablet */
      @media(max-width:768px){
        .dl-contact-head{flex-direction:column;align-items:center;text-align:center;}
        .dl-prio-badge{align-self:center;}
        .dl-top-bar{flex-direction:column;align-items:stretch;text-align:center;}
        .dl-session-info{justify-content:center;flex-wrap:wrap;}
        .dl-result-card{width:100%;}
      }
    `;
  },
};
