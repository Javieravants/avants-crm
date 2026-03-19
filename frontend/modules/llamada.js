// === Módulo Pantalla de Llamada Activa ===

const LlamadaModule = {
  state: 'idle', // idle, ringing, talking, post
  timerInterval: null,
  timerSecs: 0,
  contactType: 'new', // new, second, client
  activeTab: 'script',
  contact: null,

  // ═══════════════════════════════════════════
  // RENDER PRINCIPAL
  // ═══════════════════════════════════════════
  async render(contactData) {
    // Datos de ejemplo (se reemplazarán con datos reales)
    this.contact = contactData || this._demoContact();
    this.contactType = this._detectContactType(this.contact);
    this.state = 'talking';
    this.timerSecs = 0;

    const container = document.getElementById('main-content');
    container.className = 'main-content llamada-active';
    container.innerHTML = `
      ${this._renderCallHeader()}
      <div class="ll-body">
        ${this._renderContactPanel()}
        <div class="ll-central">
          ${this._renderTabs()}
          <div class="ll-carea" id="ll-carea">
            ${this._renderTabContent()}
          </div>
        </div>
      </div>
      ${this._renderPostCallPopup()}
    `;

    this._startTimer();
    this._setupEvents();
  },

  // ═══════════════════════════════════════════
  // CALL HEADER (barra superior de llamada)
  // ═══════════════════════════════════════════
  _renderCallHeader() {
    const c = this.contact;
    return `
      <div class="ll-header" id="ll-header">
        <div class="ll-header-left">
          <div class="ll-status-dot" id="ll-dot"></div>
          <div>
            <div class="ll-call-name">${this._esc(c.nombre)}</div>
            <div class="ll-call-sub" id="ll-call-sub">En llamada · ${c.campana || 'Sin campaña'}</div>
          </div>
        </div>
        <div class="ll-timer" id="ll-timer">00:00</div>
        <div class="ll-header-btns">
          <button class="ll-hbtn ll-btn-wa" onclick="LlamadaModule.sendWhatsApp()">💬 WhatsApp</button>
          <button class="ll-hbtn ll-btn-calc" onclick="LlamadaModule.setTab('calc')">🧮 Calculadora</button>
          <button class="ll-hbtn ll-btn-mute" id="ll-btn-mute" onclick="LlamadaModule.toggleMute()">🔇 Silencio</button>
          <button class="ll-hbtn ll-btn-hangup" id="ll-btn-hangup" onclick="LlamadaModule.hangUp()">📵 Colgar</button>
        </div>
      </div>
    `;
  },

  // ═══════════════════════════════════════════
  // PANEL CONTACTO (columna izquierda)
  // ═══════════════════════════════════════════
  _renderContactPanel() {
    const c = this.contact;
    const type = this.contactType;

    let tagHtml = '';
    let tagClass = '';
    let avatarBg = 'var(--accent)';
    if (type === 'new') {
      tagHtml = '🆕 Contacto nuevo';
      tagClass = 'cp-tag-new';
      avatarBg = 'var(--accent)';
    } else if (type === 'second') {
      tagHtml = '🔄 Segunda llamada · Cierre';
      tagClass = 'cp-tag-second';
      avatarBg = 'var(--amber)';
    } else {
      tagHtml = `✅ Cliente activo · ${c.antiguedad || ''}`;
      tagClass = 'cp-tag-client';
      avatarBg = 'var(--green)';
    }

    const initials = this._initials(c.nombre);

    return `
      <div class="ll-contact-panel" id="ll-contact-panel">
        <!-- Cabecera -->
        <div class="ll-cp-head">
          <div class="ll-cp-av" style="background:${avatarBg}">${initials}</div>
          <div class="ll-cp-name">${this._esc(c.nombre)}</div>
          <div><span class="ll-cp-tag ${tagClass}">${tagHtml}</span></div>
          <div class="ll-cp-phone">📞 ${c.telefono || '---'}</div>
          <div class="ll-cp-actions">
            <button class="ll-cpbtn ll-cpbtn-wa" onclick="LlamadaModule.sendWhatsApp()">💬 WhatsApp</button>
            <button class="ll-cpbtn" onclick="LlamadaModule.openFicha()">👤 Ficha</button>
          </div>
        </div>

        ${type === 'new' ? this._renderNewContactPanel(c) : ''}
        ${type === 'second' ? this._renderSecondCallPanel(c) : ''}
        ${type === 'client' ? this._renderClientPanel(c) : ''}

        <!-- Nota de la llamada (siempre) -->
        <div class="ll-sec">
          <div class="ll-sec-title">Nota de la llamada</div>
          <textarea class="ll-nota-ta" id="ll-nota" rows="3" placeholder="Ej: Interesada para ella y su marido. Tiene seguro en Sanitas..."></textarea>
        </div>
      </div>
    `;
  },

  // --- Contacto nuevo ---
  _renderNewContactPanel(c) {
    return `
      <!-- Campaña origen -->
      <div class="ll-sec">
        <div class="ll-sec-title">Campaña origen</div>
        <div class="ll-campana-card">
          <div class="ll-campana-nombre">${c.campana || 'Sin campaña'}</div>
          <div class="ll-campana-meta">
            ${c.anuncio ? `Anuncio: ${this._esc(c.anuncio)}<br>` : ''}
            Fecha lead: ${c.fecha_lead || 'Hoy'}
          </div>
          ${c.campaign_id ? `<div class="ll-campana-id">ID campaña: ${c.campaign_id}${c.ad_id ? ' · Ad: ' + c.ad_id : ''}</div>` : ''}
        </div>
      </div>

      <!-- Datos que tenemos -->
      <div class="ll-sec">
        <div class="ll-sec-title">Datos que tenemos</div>
        ${this._dataRow('Nombre', c.nombre)}
        ${this._dataRow('Email', c.email)}
        ${this._dataRow('Provincia', c.provincia)}
        ${this._dataRow('DNI', c.dni)}
      </div>

      <!-- Asegurados vacíos -->
      <div class="ll-sec">
        <div class="ll-sec-title">Asegurados (se rellenan al cotizar)</div>
        <div class="ll-aseg-empty">
          <span>👥</span>
          <span>Sin asegurados aún — añadir al cotizar</span>
        </div>
        <button class="ll-btn-add-aseg" onclick="LlamadaModule.setTab('script')">+ Añadir asegurado</button>
      </div>
    `;
  },

  // --- Segunda llamada ---
  _renderSecondCallPanel(c) {
    const propuestas = c.propuestas || [];
    const asegurados = c.asegurados || [];
    return `
      <!-- Presupuesto enviado -->
      <div class="ll-sec">
        <div class="ll-sec-title">Presupuesto enviado</div>
        ${propuestas.map(p => `
          <div class="ll-presup-card">
            <div class="ll-presup-nombre">${this._esc(p.producto)}</div>
            <div class="ll-presup-meta">Cotizado el ${p.fecha || ''} · ${p.agente || ''}</div>
            <div class="ll-presup-price">${p.prima_mensual || 0}€ <span class="ll-presup-price-sub">/mes</span></div>
            <div class="ll-presup-aseg">${asegurados.length} asegurados${p.descuento ? ' · ' + p.descuento + '% dto' : ''}</div>
          </div>
        `).join('')}
      </div>

      <!-- Asegurados -->
      <div class="ll-sec">
        <div class="ll-sec-title">Asegurados</div>
        ${asegurados.map((a, i) => `
          <div class="ll-aseg-item">
            <div class="ll-aseg-num">${i + 1}</div>
            <div class="ll-aseg-info">
              <div class="ll-aseg-name">${this._esc(a.nombre)} ${a.parentesco ? '(' + a.parentesco + ')' : ''}</div>
              <div class="ll-aseg-meta">${[a.fecha_nac, a.provincia, a.localidad].filter(Boolean).join(' · ')}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Llamada anterior + objeción -->
      <div class="ll-sec">
        <div class="ll-sec-title">Llamada anterior</div>
        ${c.ultima_llamada ? `
          <div class="ll-last-call" style="margin-bottom:8px;">
            <div class="ll-last-call-date">${c.ultima_llamada.fecha} · ${c.ultima_llamada.duracion}</div>
            <div class="ll-last-call-text">${this._esc(c.ultima_llamada.nota)}</div>
          </div>
        ` : ''}
        ${c.objecion ? `
          <div class="ll-objec-card">
            <div class="ll-objec-label">⚠️ Objeción</div>
            <div class="ll-objec-text">${this._esc(c.objecion)}</div>
          </div>
        ` : ''}
      </div>
    `;
  },

  // --- Cliente existente ---
  _renderClientPanel(c) {
    const polizas = c.polizas || [];
    const oportunidades = c.oportunidades || [];
    const asegurados = c.asegurados || [];
    return `
      <!-- Pólizas -->
      <div class="ll-sec">
        <div class="ll-sec-title">Ya tiene contratado</div>
        ${polizas.map(p => `
          <div class="ll-pol-item">
            <div class="ll-pol-ico">${p.icono || '🏥'}</div>
            <div class="ll-pol-info">
              <div class="ll-pol-name">${this._esc(p.producto)}</div>
              <div class="ll-pol-meta">${p.asegurados || 0} asegurados · ${p.desde || ''}</div>
            </div>
            <div class="ll-pol-price">${p.prima || 0}€</div>
          </div>
        `).join('')}
      </div>

      <!-- Oportunidades -->
      <div class="ll-sec">
        <div class="ll-sec-title">Puede interesarle</div>
        ${oportunidades.map(o => `
          <div class="ll-opp-item"><div class="ll-opp-dot"></div><div class="ll-opp-label">${this._esc(o)}</div></div>
        `).join('')}
      </div>

      <!-- Asegurados -->
      <div class="ll-sec">
        <div class="ll-sec-title">Asegurados</div>
        ${asegurados.map((a, i) => `
          <div class="ll-aseg-item">
            <div class="ll-aseg-num">${i + 1}</div>
            <div class="ll-aseg-info">
              <div class="ll-aseg-name">${this._esc(a.nombre)} ${a.parentesco ? '(' + a.parentesco + ')' : ''}</div>
              <div class="ll-aseg-meta">${[a.fecha_nac, a.provincia, a.localidad].filter(Boolean).join(' · ')}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Último contacto -->
      ${c.ultima_llamada ? `
      <div class="ll-sec">
        <div class="ll-sec-title">Último contacto</div>
        <div class="ll-last-call">
          <div class="ll-last-call-date">${c.ultima_llamada.fecha} · ${c.ultima_llamada.duracion}</div>
          <div class="ll-last-call-text">${this._esc(c.ultima_llamada.nota)}</div>
        </div>
      </div>
      ` : ''}
    `;
  },

  // ═══════════════════════════════════════════
  // TABS (pantalla central)
  // ═══════════════════════════════════════════
  _renderTabs() {
    const propCount = (this.contact.propuestas || []).length;
    return `
      <div class="ll-tabs" id="ll-tabs">
        <button class="ll-tab active" data-tab="script">📋 Cualificación</button>
        <button class="ll-tab" data-tab="propuestas">🧮 Propuestas ${propCount ? `<span class="ll-tab-badge">${propCount}</span>` : ''}</button>
        <button class="ll-tab" data-tab="calc">🖩 Calculadora</button>
        <button class="ll-tab" data-tab="notas">📝 Notas</button>
      </div>
    `;
  },

  _renderTabContent() {
    return `
      <div class="ll-section active" id="ll-sec-script">${this._renderTabScript()}</div>
      <div class="ll-section" id="ll-sec-propuestas">${this._renderTabPropuestas()}</div>
      <div class="ll-section" id="ll-sec-calc">${this._renderTabCalc()}</div>
      <div class="ll-section" id="ll-sec-notas">${this._renderTabNotas()}</div>
    `;
  },

  // --- Tab Cualificación ---
  _renderTabScript() {
    const aseg = this.contact.asegurados || [];
    return `
      <!-- Asegurados -->
      <div class="ll-card">
        <div class="ll-card-head" onclick="LlamadaModule.toggleCard(this)">
          <div class="ll-card-title">👥 Asegurados</div>
          <div style="display:flex;align-items:center;gap:8px;">
            <button class="ll-btn-add-row" onclick="event.stopPropagation();LlamadaModule.addAsegurado()">+ Añadir</button>
            <span class="ll-card-arrow">▼</span>
          </div>
        </div>
        <div class="ll-card-body">
          <div class="ll-aseg-wrap">
            <table class="ll-aseg-t">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Parentesco</th>
                  <th>Fecha nac.</th>
                  <th>Provincia</th>
                  <th>Localidad</th>
                  <th>Situación laboral</th>
                  <th></th>
                </tr>
              </thead>
              <tbody id="ll-aseg-body">
                ${aseg.length > 0 ? aseg.map(a => this._asegRow(a)).join('') : this._asegRow({nombre: this.contact.nombre})}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Seguros actuales -->
      <div class="ll-card">
        <div class="ll-card-head" onclick="LlamadaModule.toggleCard(this)">
          <div class="ll-card-title">🛡️ ¿Qué seguros tiene?</div>
          <span class="ll-card-arrow">▼</span>
        </div>
        <div class="ll-card-body">
          <div class="ll-check-grid">
            <div class="ll-check-item" onclick="this.classList.toggle('on')">🐾 Mascotas</div>
            <div class="ll-check-item" onclick="this.classList.toggle('on')">🏠 Hogar</div>
            <div class="ll-check-item" onclick="this.classList.toggle('on')">🚗 Coche</div>
            <div class="ll-check-item" onclick="this.classList.toggle('on')">❤️ Vida</div>
            <div class="ll-check-item" onclick="this.classList.toggle('on')">⚰️ Decesos</div>
            <div class="ll-check-item" onclick="this.classList.toggle('on')">🏥 Salud (otra cía)</div>
          </div>
        </div>
      </div>

      <div style="display:flex;gap:8px;">
        <button class="ll-hbtn ll-btn-primary" onclick="LlamadaModule.setTab('calc')">🧮 Ir a cotizar</button>
        <button class="ll-hbtn ll-btn-secondary" onclick="LlamadaModule.saveQualification()">💾 Guardar datos</button>
      </div>
    `;
  },

  _asegRow(a) {
    return `
      <tr>
        <td><input class="ll-t-input" value="${this._esc(a.nombre || '')}" style="width:120px;" placeholder="Nombre"></td>
        <td><select class="ll-t-select" style="width:100px;">
          <option ${a.parentesco === 'Titular' ? 'selected' : ''}>Titular</option>
          <option ${a.parentesco === 'Cónyuge' ? 'selected' : ''}>Cónyuge</option>
          <option ${a.parentesco === 'Hijo/a' ? 'selected' : ''}>Hijo/a</option>
          <option ${a.parentesco === 'Otro' ? 'selected' : ''}>Otro</option>
        </select></td>
        <td><input type="date" class="ll-t-input" value="${a.fecha_nac_iso || ''}" style="width:130px;"></td>
        <td><input class="ll-t-input" value="${this._esc(a.provincia || '')}" placeholder="Provincia" style="width:90px;"></td>
        <td><input class="ll-t-input" value="${this._esc(a.localidad || '')}" placeholder="Localidad" style="width:110px;"></td>
        <td><select class="ll-t-select" style="width:130px;">
          <option>Cuenta ajena</option><option>Autónomo</option><option>Empresario</option>
          <option>Funcionario</option><option>Jubilado</option><option>Estudiante</option>
        </select></td>
        <td><button class="ll-t-del" onclick="this.closest('tr').remove()">×</button></td>
      </tr>
    `;
  },

  // --- Tab Propuestas ---
  _renderTabPropuestas() {
    const props = this.contact.propuestas || [];
    if (props.length === 0) {
      return `
        <div style="text-align:center;padding:40px 20px;color:var(--txt3);">
          <div style="font-size:36px;margin-bottom:10px;">🧮</div>
          <div style="font-size:14px;font-weight:700;color:var(--txt2);margin-bottom:6px;">Sin propuestas aún</div>
          <div style="font-size:12px;margin-bottom:16px;">Cotiza desde la calculadora para crear propuestas</div>
          <button class="ll-hbtn ll-btn-primary" onclick="LlamadaModule.setTab('calc')">🧮 Nueva cotización</button>
        </div>
      `;
    }
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <div style="font-size:14px;font-weight:700;">Propuestas guardadas</div>
        <button class="ll-hbtn ll-btn-primary" onclick="LlamadaModule.setTab('calc')">🧮 Nueva cotización</button>
      </div>
      ${props.map((p, i) => this._renderPropuestaCard(p, i === 0)).join('')}
    `;
  },

  _renderPropuestaCard(p, isOpen) {
    const aseg = this.contact.asegurados || [];
    return `
      <div class="ll-prop-card ${isOpen ? 'open' : ''}">
        <div class="ll-prop-head" onclick="LlamadaModule.toggleProp(this.closest('.ll-prop-card'))">
          <div class="ll-prop-ico ll-prop-ico-s">${p.icono || '🏥'}</div>
          <div class="ll-prop-info">
            <div class="ll-prop-name">${this._esc(p.producto)}</div>
            <div class="ll-prop-meta">${p.fecha || ''} · ${p.agente || ''}</div>
          </div>
          <div style="text-align:right;margin-right:10px;">
            <div class="ll-prop-price">${p.prima_mensual || 0}€<span style="font-size:10px;color:var(--txt3);font-weight:400;">/mes</span></div>
          </div>
          <div class="ll-prop-arrow">▼</div>
        </div>
        <div class="ll-prop-detail">
          ${p.campana_promo ? `<div class="ll-campana-tag">🎯 ${this._esc(p.campana_promo)}</div>` : ''}
          <div class="ll-detail-grid">
            <div class="ll-detail-item"><div class="ll-detail-label">Modalidad</div><div class="ll-detail-value">${this._esc(p.modalidad || p.producto)}</div></div>
            <div class="ll-detail-item"><div class="ll-detail-label">Asegurados</div><div class="ll-detail-value">${aseg.length}</div></div>
            <div class="ll-detail-item"><div class="ll-detail-label">Descuento</div><div class="ll-detail-value">${p.descuento ? p.descuento + '%' : '—'}</div></div>
            <div class="ll-detail-item"><div class="ll-detail-label">Prima mes</div><div class="ll-detail-value" style="color:var(--accent);font-weight:800;">${p.prima_mensual || 0}€</div></div>
            <div class="ll-detail-item"><div class="ll-detail-label">Prima año</div><div class="ll-detail-value">${p.prima_anual || 0}€</div></div>
            <div class="ll-detail-item"><div class="ll-detail-label">Fecha efecto</div><div class="ll-detail-value">${p.fecha_efecto || '—'}</div></div>
          </div>
          ${aseg.length > 0 ? `
          <table class="ll-prop-aseg-table">
            <thead><tr><th>Nombre</th><th>Parentesco</th><th>Fecha nac.</th><th>Provincia</th><th>Localidad</th></tr></thead>
            <tbody>
              ${aseg.map(a => `<tr><td>${this._esc(a.nombre)}</td><td>${a.parentesco || ''}</td><td>${a.fecha_nac || ''}</td><td>${a.provincia || ''}</td><td>${a.localidad || ''}</td></tr>`).join('')}
            </tbody>
          </table>` : ''}
          <div class="ll-prop-btns">
            <button class="ll-btn-grabar">📋 Grabar póliza</button>
            <button class="ll-btn-enviar-prop" onclick="LlamadaModule.openEnvioModal()">📤 Enviar</button>
          </div>
        </div>
      </div>
    `;
  },

  // --- Tab Calculadora ---
  _renderTabCalc() {
    setTimeout(() => {
      const container = document.getElementById('ll-sec-calc');
      if (container) {
        const dealParam = this.contact?.pipedrive_deal_id ? `?deal_id=${this.contact.pipedrive_deal_id}` : '';
        container.innerHTML = `<iframe src="/calculadora/index.html${dealParam}" style="width:100%;height:calc(100vh - 200px);border:none;border-radius:12px;"></iframe>`;
      }
    }, 0);
    return '<div style="padding:8px;">Cargando calculadora...</div>';
  },

  // --- Tab Notas ---
  _renderTabNotas() {
    const notas = this.contact.notas || [];
    return `
      <div class="ll-card">
        <div class="ll-card-head">
          <div class="ll-card-title">📝 Notas de la llamada</div>
        </div>
        <div class="ll-card-body">
          <textarea class="ll-nota-ta" id="ll-nota-central" rows="4" placeholder="Ej: Muy interesada. Su marido trabaja como autónomo. Le preocupa el precio..."></textarea>
          <button class="ll-btn-save-nota" onclick="LlamadaModule.saveNote()">💾 Guardar nota</button>
          ${notas.length > 0 ? `
            <div class="ll-divider"></div>
            <div style="font-size:12px;font-weight:700;color:var(--txt2);margin-bottom:8px;">Notas anteriores</div>
            ${notas.map(n => `
              <div style="background:var(--amber-bg);border-radius:8px;padding:10px 12px;font-size:12px;margin-bottom:6px;">
                <div style="font-size:11px;color:var(--amber);font-weight:700;margin-bottom:3px;">${this._esc(n.agente)} · ${n.fecha}</div>
                ${this._esc(n.texto)}
              </div>
            `).join('')}
          ` : ''}
        </div>
      </div>
    `;
  },

  // ═══════════════════════════════════════════
  // POPUP POST LLAMADA
  // ═══════════════════════════════════════════
  _renderPostCallPopup() {
    return `
      <div class="ll-popup-overlay" id="ll-popup-overlay">
        <div class="ll-popup">
          <!-- Header -->
          <div class="ll-popup-header">
            <div>
              <div class="ll-popup-title">📵 Llamada terminada · <span style="color:var(--green)" id="ll-popup-duration">0:00</span></div>
              <div class="ll-popup-contact">${this._esc(this.contact.nombre)} · ${this.contact.campana || ''}</div>
            </div>
            <button class="ll-popup-close" onclick="LlamadaModule.closePopup()">✕</button>
          </div>

          <!-- Body -->
          <div class="ll-popup-body">
            <!-- Izquierda -->
            <div class="ll-popup-left">
              ${this._renderPostCallLeft()}
            </div>
            <!-- Derecha — Calendario -->
            <div class="ll-popup-right">
              ${this._renderCalendar()}
            </div>
          </div>

          <!-- Footer -->
          <div class="ll-popup-footer">
            <div class="ll-footer-info" id="ll-footer-info">Selecciona una franja horaria para agendar la siguiente llamada</div>
            <div class="ll-footer-btns">
              <button class="ll-btn-volver" onclick="LlamadaModule.openFicha()">← Volver al contacto</button>
              <button class="ll-btn-guardar" onclick="LlamadaModule.saveAll()">💾 Guardar todo</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  _renderPostCallLeft() {
    return `
      <!-- Resultado -->
      <div>
        <div class="ll-sec-title">Resultado de la llamada</div>
        <div class="ll-res-grid">
          <button class="ll-res-btn" onclick="LlamadaModule.selResult(this,'sel-green')"><span class="ll-res-ico">🎯</span>Venta cerrada</button>
          <button class="ll-res-btn" onclick="LlamadaModule.selResult(this,'sel-accent')"><span class="ll-res-ico">✅</span>Interesado</button>
          <button class="ll-res-btn" onclick="LlamadaModule.selResult(this,'sel-accent')"><span class="ll-res-ico">📅</span>Volver a llamar</button>
          <button class="ll-res-btn" onclick="LlamadaModule.selResult(this,'sel-accent')"><span class="ll-res-ico">💬</span>Enviar por WA</button>
          <button class="ll-res-btn" onclick="LlamadaModule.selResult(this,'sel-red','perdido')"><span class="ll-res-ico">❌</span>No interesado</button>
          <button class="ll-res-btn" onclick="LlamadaModule.selResult(this,'sel-red')"><span class="ll-res-ico">📵</span>No contesta</button>
          <button class="ll-res-btn" onclick="LlamadaModule.selResult(this,'sel-red')"><span class="ll-res-ico">🚫</span>Nº erróneo</button>
          <button class="ll-res-btn" onclick="LlamadaModule.selResult(this,'sel-accent')"><span class="ll-res-ico">📱</span>Más tarde</button>
        </div>
      </div>

      <!-- Pérdida -->
      <div class="ll-perdida-box" id="ll-perdida-box">
        <div class="ll-perdida-label">⚠️ Motivo de pérdida</div>
        <select class="ll-perdida-select" id="ll-perdida-motivo">
          <option value="">Seleccionar...</option>
          <option>Precio demasiado alto</option>
          <option>Ya tiene seguro y está contento</option>
          <option>No le interesa el producto</option>
          <option>Momento económico malo</option>
          <option>Prefiere otra compañía</option>
          <option>Otro</option>
        </select>
        <div class="ll-dkv-box" id="ll-dkv-box">
          <div class="ll-dkv-text">🔵 ¿Pasar a cola DKV?</div>
          <div class="ll-dkv-btns">
            <button class="ll-btn-dkv-si">Sí</button>
            <button class="ll-btn-dkv-no">No</button>
          </div>
        </div>
      </div>

      <!-- Nota -->
      <div>
        <div class="ll-sec-title">Nota rápida</div>
        <textarea class="ll-nota-ta" id="ll-popup-nota" rows="3" placeholder="Ej: Muy interesada, tiene Sanitas hasta marzo..."></textarea>
      </div>

      <!-- Envío -->
      <div>
        <div class="ll-sec-title">Enviar propuesta</div>
        <div class="ll-envio-row">
          <div class="ll-envio-card">
            <div class="ll-envio-head"><span class="ll-envio-ico">💬</span><span class="ll-envio-title">WhatsApp</span></div>
            <select class="ll-envio-select" id="ll-envio-wa-tpl">
              <option value="">Template...</option>
              <option value="prop">📄 Enviar propuesta</option>
              <option>Primera llamada</option>
              <option>No contesta</option>
              <option>Seguimiento</option>
            </select>
            <button class="ll-btn-enviar ll-btn-enviar-wa">💬 Enviar</button>
          </div>
          <div class="ll-envio-card">
            <div class="ll-envio-head"><span class="ll-envio-ico">📧</span><span class="ll-envio-title">Email</span></div>
            <select class="ll-envio-select" id="ll-envio-mail-tpl">
              <option value="">Template...</option>
              <option value="prop">📄 Enviar propuesta</option>
              <option>Propuesta completa</option>
              <option>Seguimiento</option>
            </select>
            <button class="ll-btn-enviar ll-btn-enviar-mail">📧 Enviar</button>
          </div>
        </div>
      </div>

      <!-- Llamada agendada -->
      <div class="ll-nueva-sel" id="ll-nueva-sel">
        <div>
          <div class="ll-sec-title" style="margin-bottom:2px;">Llamada agendada</div>
          <div class="ll-nueva-sel-hora" id="ll-nueva-sel-hora"></div>
        </div>
        <span style="font-size:18px;">✅</span>
      </div>
    `;
  },

  // ═══════════════════════════════════════════
  // CALENDARIO (popup derecho)
  // ═══════════════════════════════════════════
  _calendarDate: null,
  _calendarEvents: {},
  _selectedSlot: null,

  _renderCalendar() {
    const DAYS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

    if (!this._calendarDate) {
      this._calendarDate = new Date();
      this._calendarDate.setDate(this._calendarDate.getDate() + 1); // mañana por defecto
    }
    const d = this._calendarDate;
    const dateStr = `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

    // Generar franjas horarias de 09:00 a 19:30
    const horas = [];
    for (let h = 9; h <= 19; h++) {
      horas.push(`${String(h).padStart(2, '0')}:00`);
      horas.push(`${String(h).padStart(2, '0')}:30`);
    }

    const events = this._calendarEvents[this._calKey(d)] || [];

    let timesHtml = '';
    let eventsHtml = '';
    horas.forEach(hora => {
      const isHalf = hora.endsWith(':30');
      timesHtml += `<div class="ll-cal-time-slot${isHalf ? ' half' : ''}">${isHalf ? '' : hora}</div>`;

      const slotEvents = events.filter(e => e.hora === hora);
      let evHtml = slotEvents.map(e => `
        <div class="ll-cal-event tipo-${e.tipo}">
          <div class="ll-cal-event-name">${this._esc(e.nombre)}</div>
          <div class="ll-cal-event-meta">${this._esc(e.producto || '')}</div>
        </div>
      `).join('');

      evHtml += `<div class="ll-cal-add-slot" onclick="LlamadaModule.agendarSlot('${hora}')">+ Agendar aquí</div>`;
      eventsHtml += `<div class="ll-cal-row${isHalf ? ' half' : ''}" data-hora="${hora}">${evHtml}</div>`;
    });

    return `
      <div class="ll-cal-header">
        <div class="ll-cal-nav">
          <button class="ll-cal-nav-btn" onclick="LlamadaModule.changeCalDay(-1)">‹</button>
          <div class="ll-cal-date" id="ll-cal-date">${dateStr}</div>
          <button class="ll-cal-nav-btn" onclick="LlamadaModule.changeCalDay(1)">›</button>
        </div>
        <button class="ll-cal-today-btn" onclick="LlamadaModule.goCalToday()">Hoy</button>
        <div class="ll-cal-summary" id="ll-cal-summary">${events.length} llamada${events.length !== 1 ? 's' : ''}</div>
      </div>
      <div class="ll-cal-body" id="ll-cal-body">
        <div class="ll-cal-grid">
          <div class="ll-cal-times" id="ll-cal-times">${timesHtml}</div>
          <div class="ll-cal-events" id="ll-cal-events">${eventsHtml}</div>
        </div>
      </div>
    `;
  },

  // ═══════════════════════════════════════════
  // ACCIONES
  // ═══════════════════════════════════════════
  _startTimer() {
    clearInterval(this.timerInterval);
    this.timerSecs = 0;
    this.timerInterval = setInterval(() => {
      this.timerSecs++;
      const m = String(Math.floor(this.timerSecs / 60)).padStart(2, '0');
      const s = String(this.timerSecs % 60).padStart(2, '0');
      const el = document.getElementById('ll-timer');
      if (el) el.textContent = m + ':' + s;
    }, 1000);
  },

  hangUp() {
    clearInterval(this.timerInterval);
    this.state = 'post';
    const m = String(Math.floor(this.timerSecs / 60)).padStart(2, '0');
    const s = String(this.timerSecs % 60).padStart(2, '0');
    const duration = `${parseInt(m)} min ${s} seg`;

    // Copiar nota del panel lateral si hay
    const notaLateral = document.getElementById('ll-nota');
    const notaPopup = document.getElementById('ll-popup-nota');
    if (notaLateral && notaPopup && notaLateral.value) {
      notaPopup.value = notaLateral.value;
    }

    // Mostrar popup
    const el = document.getElementById('ll-popup-duration');
    if (el) el.textContent = duration;
    document.getElementById('ll-popup-overlay').classList.add('visible');

    // Header actualizar
    const dot = document.getElementById('ll-dot');
    if (dot) dot.style.background = 'var(--txt3)';
    const sub = document.getElementById('ll-call-sub');
    if (sub) sub.textContent = `Llamada terminada · ${duration}`;
    const timer = document.getElementById('ll-timer');
    if (timer) timer.textContent = duration;
    const btnHangup = document.getElementById('ll-btn-hangup');
    if (btnHangup) btnHangup.style.display = 'none';
    const btnMute = document.getElementById('ll-btn-mute');
    if (btnMute) btnMute.style.display = 'none';
  },

  closePopup() {
    document.getElementById('ll-popup-overlay').classList.remove('visible');
  },

  setTab(tab) {
    this.activeTab = tab;
    document.querySelectorAll('.ll-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    document.querySelectorAll('.ll-section').forEach(s => s.classList.remove('active'));
    const sec = document.getElementById('ll-sec-' + tab);
    if (sec) sec.classList.add('active');
  },

  toggleCard(head) {
    const card = head.closest('.ll-card');
    card.classList.toggle('collapsed');
    const arrow = head.querySelector('.ll-card-arrow');
    if (arrow) arrow.textContent = card.classList.contains('collapsed') ? '▶' : '▼';
  },

  toggleProp(card) {
    const wasOpen = card.classList.contains('open');
    document.querySelectorAll('.ll-prop-card').forEach(c => c.classList.remove('open'));
    if (!wasOpen) card.classList.add('open');
  },

  addAsegurado() {
    const tbody = document.getElementById('ll-aseg-body');
    if (!tbody) return;
    const tr = document.createElement('tr');
    tr.innerHTML = this._asegRow({});
    // Extraer el TR del wrapper
    const temp = document.createElement('table');
    temp.innerHTML = `<tbody>${this._asegRow({})}</tbody>`;
    tbody.appendChild(temp.querySelector('tr'));
  },

  toggleMute() {
    const btn = document.getElementById('ll-btn-mute');
    if (btn.classList.contains('muted')) {
      btn.classList.remove('muted');
      btn.textContent = '🔇 Silencio';
    } else {
      btn.classList.add('muted');
      btn.textContent = '🔊 Activar';
    }
  },

  selResult(btn, cls, action) {
    document.querySelectorAll('.ll-res-btn').forEach(b => b.className = 'll-res-btn');
    btn.classList.add(cls);
    const perdida = document.getElementById('ll-perdida-box');
    if (action === 'perdido') {
      perdida.classList.add('visible');
    } else {
      perdida.classList.remove('visible');
    }
  },

  // Calendario
  _calKey(d) { return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; },

  changeCalDay(delta) {
    this._calendarDate.setDate(this._calendarDate.getDate() + delta);
    this._selectedSlot = null;
    const right = document.querySelector('.ll-popup-right');
    if (right) right.innerHTML = this._renderCalendar();
  },

  goCalToday() {
    this._calendarDate = new Date();
    this._selectedSlot = null;
    const right = document.querySelector('.ll-popup-right');
    if (right) right.innerHTML = this._renderCalendar();
  },

  agendarSlot(hora) {
    const d = this._calendarDate;
    const DAYS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    const dStr = `${DAYS[d.getDay()]} ${d.getDate()}/${String(d.getMonth() + 1).padStart(2, '0')} · ${hora}`;

    this._selectedSlot = { hora, date: new Date(d) };

    // Mostrar en panel izquierdo
    const sel = document.getElementById('ll-nueva-sel');
    if (sel) sel.classList.add('visible');
    const horaEl = document.getElementById('ll-nueva-sel-hora');
    if (horaEl) horaEl.textContent = dStr;
    const footerInfo = document.getElementById('ll-footer-info');
    if (footerInfo) footerInfo.textContent = `✅ Llamada agendada: ${dStr}`;

    // Añadir evento al calendario
    const key = this._calKey(d);
    if (!this._calendarEvents[key]) this._calendarEvents[key] = [];
    // Evitar duplicado
    const exists = this._calendarEvents[key].find(e => e.hora === hora && e.nombre === this.contact.nombre);
    if (!exists) {
      this._calendarEvents[key].push({ hora, nombre: this.contact.nombre, tipo: 'nueva', producto: 'Nueva llamada' });
    }

    const right = document.querySelector('.ll-popup-right');
    if (right) right.innerHTML = this._renderCalendar();
  },

  // Guardar todo
  async saveAll() {
    // Recoger datos del popup
    const nota = document.getElementById('ll-popup-nota')?.value || '';
    const resultado = document.querySelector('.ll-res-btn.sel-green, .ll-res-btn.sel-accent, .ll-res-btn.sel-red');

    // TODO: Enviar al backend
    console.log('Guardando:', {
      contacto: this.contact.id,
      resultado: resultado?.textContent?.trim(),
      nota,
      slot: this._selectedSlot,
    });

    this.closePopup();
    // Volver al módulo anterior
    if (typeof App !== 'undefined') {
      App.navigate('personas');
    }
  },

  saveQualification() {
    // Recoger datos de la tabla de asegurados
    const rows = document.querySelectorAll('#ll-aseg-body tr');
    const asegurados = [];
    rows.forEach(row => {
      const inputs = row.querySelectorAll('.ll-t-input');
      const selects = row.querySelectorAll('.ll-t-select');
      if (inputs[0]?.value) {
        asegurados.push({
          nombre: inputs[0].value,
          parentesco: selects[0]?.value,
          fecha_nac: inputs[1]?.value,
          provincia: inputs[2]?.value,
          localidad: inputs[3]?.value,
          situacion: selects[1]?.value,
        });
      }
    });
    console.log('Asegurados guardados:', asegurados);
    // TODO: Enviar al backend
  },

  saveNote() {
    const nota = document.getElementById('ll-nota-central')?.value;
    if (!nota) return;
    console.log('Nota guardada:', nota);
    // TODO: Enviar al backend
  },

  sendWhatsApp() {
    console.log('Abrir WhatsApp para:', this.contact.telefono);
    // TODO: Integración WhatsApp
  },

  openFicha() {
    if (this.contact.id && typeof PersonasModule !== 'undefined') {
      PersonasModule.showFicha(this.contact.id);
    }
  },

  openEnvioModal() {
    // TODO: Modal de envío de propuesta
    console.log('Abrir modal envío propuesta');
  },

  // ═══════════════════════════════════════════
  // EVENTOS
  // ═══════════════════════════════════════════
  _setupEvents() {
    // Tabs
    document.getElementById('ll-tabs')?.addEventListener('click', (e) => {
      const tab = e.target.closest('.ll-tab');
      if (!tab) return;
      this.setTab(tab.dataset.tab);
    });
  },

  // ═══════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════
  _esc(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  },

  _initials(nombre) {
    if (!nombre) return '?';
    const parts = nombre.split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  },

  _dataRow(label, value) {
    return `
      <div class="ll-data-row">
        <div class="ll-data-label">${label}</div>
        ${value ? `<div class="ll-data-value">${this._esc(value)}</div>` : `<div class="ll-data-empty">Sin datos aún</div>`}
      </div>
    `;
  },

  _detectContactType(c) {
    if (c.polizas && c.polizas.length > 0) return 'client';
    if (c.propuestas && c.propuestas.length > 0) return 'second';
    return 'new';
  },

  // Datos de ejemplo
  _demoContact() {
    return {
      id: 1,
      nombre: 'María García López',
      telefono: '612 345 678',
      email: 'mgarcia@gmail.com',
      dni: null,
      provincia: null,
      campana: 'ADESLAS Salud · Facebook',
      anuncio: 'Seguro salud desde 30€/mes',
      fecha_lead: 'Hoy 09:34',
      campaign_id: '23847291',
      ad_id: '88472910',
      asegurados: [],
      propuestas: [
        { producto: 'ADESLAS Plena Total', modalidad: 'Plena Total', icono: '🏥', fecha: '14/03/2026', agente: 'Eva Mora', prima_mensual: 149, prima_anual: 1788, descuento: 5, fecha_efecto: '01/04/2026', campana_promo: '3 meses gratis · 350 puntos' },
        { producto: 'ADESLAS Decesos Plus', modalidad: 'Decesos Plus', icono: '⚰️', fecha: '14/03/2026', agente: 'Eva Mora', prima_mensual: 24, prima_anual: 288, descuento: null, fecha_efecto: '01/04/2026', campana_promo: '250 puntos campaña' },
      ],
      polizas: [],
      oportunidades: [],
      notas: [
        { agente: 'Eva Mora', fecha: '14/03/2026', texto: 'Llamar después de las 17h. Tiene seguro en Sanitas hasta marzo. Le mando propuesta por WA.' }
      ],
      ultima_llamada: { fecha: '14/03/2026', duracion: '4 min 32 seg', nota: 'Interesada. Pidió tiempo para hablarlo con su marido.' },
      objecion: 'Le parece caro. Comparar con Sanitas (120€/mes, 2 asegurados).',
      antiguedad: null,
    };
  },
};
