// === Popup Post-Llamada — 3 pasos con sugerencias IA ===

var CallResultsPopup = {
  step: 1,
  contactId: null,
  duracion: 0,
  suggestion: null,
  propuestas: [],
  companias: [],
  contacto: null,
  resultado: null,
  accion: null,

  esc: function(s) { var d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; },

  async open(contactId, duracion) {
    this.contactId = contactId;
    this.duracion = duracion || 0;
    this.step = 1;
    this.resultado = null;
    this.accion = null;

    // Mostrar overlay con loading
    this._createOverlay();
    this._setContent('<div style="text-align:center;padding:40px;color:#94a3b8;">Analizando llamada...</div>');

    // Pedir sugerencia a la IA
    try {
      var r = await API.post('/call-results/suggest', { contact_id: contactId, duracion_segundos: duracion });
      this.suggestion = r.suggestion || {};
      this.propuestas = r.propuestas || [];
      this.companias = r.companias || [];
      this.contacto = r.contacto || {};
      this.resultado = this.suggestion.resultado_sugerido || 'pendiente';
      this.accion = this.suggestion.accion_sugerida || 'ninguna';
    } catch(e) {
      this.suggestion = { resultado_sugerido: 'pendiente', accion_sugerida: 'ninguna', razonamiento: 'Error IA' };
      this.resultado = 'pendiente';
      this.accion = 'ninguna';
    }

    this._renderStep();
  },

  _createOverlay: function() {
    var existing = document.getElementById('cr-overlay');
    if (existing) existing.remove();
    var overlay = document.createElement('div');
    overlay.id = 'cr-overlay';
    overlay.className = 'cr-overlay';
    // No se puede cerrar sin completar
    overlay.innerHTML = '<div class="cr-modal" id="cr-modal"></div>';
    if (!document.getElementById('cr-css')) {
      var st = document.createElement('style'); st.id = 'cr-css';
      st.textContent = this._css();
      document.head.appendChild(st);
    }
    document.body.appendChild(overlay);
  },

  _setContent: function(html) {
    var modal = document.getElementById('cr-modal');
    if (modal) modal.innerHTML = html;
  },

  _renderStep: function() {
    if (this.step === 1) this._renderStep1();
    else if (this.step === 2) this._renderStep2();
    else if (this.step === 3) this._renderStep3();
  },

  // ══════════════════════════════════════════
  // PASO 1 — Resultado
  // ══════════════════════════════════════════

  _renderStep1: function() {
    var s = this.suggestion || {};
    var dur = this.duracion;
    var durStr = dur > 0 ? Math.floor(dur / 60) + ':' + String(dur % 60).padStart(2, '0') : '0:00';
    var self = this;

    var resultados = [
      { id: 'interesado', label: 'Interesado', icon: '&#128522;' },
      { id: 'pendiente', label: 'Pendiente', icon: '&#128528;' },
      { id: 'no_interesado', label: 'No interesado', icon: '&#128542;' },
      { id: 'cerrado', label: 'Cerrado', icon: '&#9989;' },
      { id: 'no_contesto', label: 'No contesto', icon: '&#128245;' },
      { id: 'volver_llamar', label: 'Volver a llamar', icon: '&#128260;' },
    ];

    this._setContent(
      '<div class="cr-head">' +
        '<div class="cr-step-indicator">Paso 1 de 3</div>' +
        '<div class="cr-head-title">' + this.esc(this.contacto.nombre || 'Contacto') + ' · ' + durStr + '</div>' +
      '</div>' +
      (s.razonamiento ? '<div class="cr-ia-hint">IA sugiere: ' + this.esc(s.razonamiento) + '</div>' : '') +
      '<div class="cr-body">' +
        '<div class="cr-result-grid">' +
          resultados.map(function(r) {
            var sel = self.resultado === r.id ? ' cr-selected' : '';
            var sug = s.resultado_sugerido === r.id ? ' cr-suggested' : '';
            return '<button class="cr-result-btn' + sel + sug + '" onclick="CallResultsPopup._selectResultado(\'' + r.id + '\')">' +
              '<span class="cr-result-icon">' + r.icon + '</span>' +
              '<span class="cr-result-label">' + r.label + '</span>' +
              (s.resultado_sugerido === r.id ? '<span class="cr-ai-badge">IA</span>' : '') +
            '</button>';
          }).join('') +
        '</div>' +
      '</div>' +
      '<div class="cr-footer">' +
        '<button class="cr-btn cr-btn-primary" onclick="CallResultsPopup._nextStep()">Siguiente</button>' +
      '</div>'
    );
  },

  _selectResultado: function(id) {
    this.resultado = id;
    this._renderStep1();
  },

  // ══════════════════════════════════════════
  // PASO 2 — Accion
  // ══════════════════════════════════════════

  _renderStep2: function() {
    var s = this.suggestion || {};
    var self = this;

    var acciones = [
      { id: 'whatsapp', label: 'WhatsApp', icon: '&#128172;' },
      { id: 'email', label: 'Email', icon: '&#128231;' },
      { id: 'agendar', label: 'Agendar callback', icon: '&#128197;' },
      { id: 'derivar', label: 'Derivar', icon: '&#10145;' },
      { id: 'ninguna', label: 'Sin accion', icon: '&#128683;' },
    ];

    var compOpts = this.companias.map(function(c) {
      var sel = s.compania_derivacion_id === c.id ? ' selected' : '';
      return '<option value="' + c.id + '"' + sel + '>' + self.esc(c.nombre) + '</option>';
    }).join('');

    this._setContent(
      '<div class="cr-head">' +
        '<div class="cr-step-indicator">Paso 2 de 3</div>' +
        '<div class="cr-head-title">Que hacemos ahora?</div>' +
      '</div>' +
      (s.accion_sugerida ? '<div class="cr-ia-hint">IA recomienda: ' + this.esc(s.accion_sugerida) + '</div>' : '') +
      '<div class="cr-body">' +
        '<div class="cr-action-grid">' +
          acciones.map(function(a) {
            var sel = self.accion === a.id ? ' cr-selected' : '';
            var sug = s.accion_sugerida === a.id ? ' cr-suggested' : '';
            return '<button class="cr-action-btn' + sel + sug + '" onclick="CallResultsPopup._selectAccion(\'' + a.id + '\')">' +
              '<span class="cr-result-icon">' + a.icon + '</span>' +
              '<span class="cr-result-label">' + a.label + '</span>' +
              (s.accion_sugerida === a.id ? '<span class="cr-ai-badge">IA</span>' : '') +
            '</button>';
          }).join('') +
        '</div>' +
        (this.accion === 'derivar' ? '<div style="margin-top:10px;"><select id="cr-derivar-comp" class="cr-input">' + compOpts + '</select></div>' : '') +
      '</div>' +
      '<div class="cr-footer">' +
        '<button class="cr-btn" onclick="CallResultsPopup._prevStep()">Anterior</button>' +
        '<button class="cr-btn cr-btn-primary" onclick="CallResultsPopup._nextStep()">Siguiente</button>' +
      '</div>'
    );
  },

  _selectAccion: function(id) {
    this.accion = id;
    this._renderStep2();
  },

  // ══════════════════════════════════════════
  // PASO 3 — Ejecutar
  // ══════════════════════════════════════════

  _renderStep3: function() {
    var s = this.suggestion || {};
    var self = this;
    var html = '';

    if (this.accion === 'whatsapp' || this.accion === 'email') {
      var propsHtml = this.propuestas.map(function(p) {
        return '<label style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:12px;cursor:pointer;">' +
          '<input type="checkbox" class="cr-prop-cb" value="' + p.id + '" checked>' +
          self.esc(p.producto || p.tipo_poliza || 'Propuesta') + ' ' + (p.prima_mensual || '') + ' EUR/mes' +
        '</label>';
      }).join('') || '<div style="font-size:12px;color:#94a3b8;">Sin propuestas disponibles</div>';

      html =
        '<div class="cr-section-title">Propuestas a enviar</div>' +
        '<div style="margin-bottom:12px;">' + propsHtml + '</div>' +
        '<div class="cr-section-title">Mensaje</div>' +
        '<textarea id="cr-mensaje" class="cr-textarea">' + this.esc(s.mensaje_whatsapp || 'Hola ' + (this.contacto.nombre || '') + ', te envio tu presupuesto personalizado.') + '</textarea>';
    } else if (this.accion === 'agendar') {
      var ahora = new Date();
      var fecha = new Date(ahora);
      if (ahora.getHours() < 14) { fecha.setHours(16, 0); } else { fecha.setDate(fecha.getDate() + 1); fecha.setHours(10, 0); }
      html =
        '<div class="cr-section-title">Agendar callback</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">' +
          '<div><label class="cr-label">Fecha</label><input type="date" id="cr-fecha" class="cr-input" value="' + fecha.toISOString().split('T')[0] + '"></div>' +
          '<div><label class="cr-label">Hora</label><input type="time" id="cr-hora" class="cr-input" value="' + String(fecha.getHours()).padStart(2,'0') + ':00"></div>' +
        '</div>';
    } else if (this.accion === 'derivar') {
      html = '<div style="text-align:center;padding:16px;font-size:13px;color:#475569;">El contacto entrara en el pipeline de la compania seleccionada como lead nuevo.</div>';
    }

    html += '<div style="margin-top:10px;"><label class="cr-label">Notas (opcional)</label><input id="cr-notas" class="cr-input" placeholder="Nota rapida..."></div>';

    this._setContent(
      '<div class="cr-head">' +
        '<div class="cr-step-indicator">Paso 3 de 3</div>' +
        '<div class="cr-head-title">Ejecutar</div>' +
      '</div>' +
      '<div class="cr-body">' + html + '</div>' +
      '<div class="cr-footer">' +
        '<button class="cr-btn" onclick="CallResultsPopup._prevStep()">Anterior</button>' +
        '<button class="cr-btn cr-btn-primary" onclick="CallResultsPopup._submit()">Confirmar y cerrar</button>' +
      '</div>'
    );
  },

  // ══════════════════════════════════════════
  // NAVEGACION + SUBMIT
  // ══════════════════════════════════════════

  _nextStep: function() { this.step = Math.min(this.step + 1, 3); this._renderStep(); },
  _prevStep: function() { this.step = Math.max(this.step - 1, 1); this._renderStep(); },

  async _submit() {
    var s = this.suggestion || {};
    var notas = document.getElementById('cr-notas')?.value?.trim() || '';
    var mensaje = document.getElementById('cr-mensaje')?.value?.trim() || null;
    var propIds = [];
    document.querySelectorAll('.cr-prop-cb:checked').forEach(function(cb) { propIds.push(parseInt(cb.value)); });

    var compDeriv = null;
    var compEl = document.getElementById('cr-derivar-comp');
    if (compEl) compDeriv = parseInt(compEl.value) || null;

    try {
      await API.post('/call-results', {
        contact_id: this.contactId,
        duracion_segundos: this.duracion,
        resultado: this.resultado,
        accion_siguiente: this.accion,
        compania_derivacion_id: compDeriv,
        propuestas_enviadas: propIds,
        notas: notas || null,
        mensaje_whatsapp: mensaje,
        ia_sugerencia_resultado: s.resultado_sugerido,
        ia_sugerencia_accion: s.accion_sugerida,
        ia_razonamiento: s.razonamiento,
      });
    } catch(e) {
      alert('Error guardando resultado: ' + e.message);
      return;
    }

    this.close();
  },

  close: function() {
    var overlay = document.getElementById('cr-overlay');
    if (overlay) overlay.remove();
  },

  // ══════════════════════════════════════════
  // CSS
  // ══════════════════════════════════════════

  _css: function() {
    return '' +
      '.cr-overlay{position:fixed;inset:0;background:rgba(15,23,42,.6);z-index:950;display:flex;align-items:center;justify-content:center;padding:20px;}' +
      '.cr-modal{background:#fff;border-radius:16px;width:480px;max-width:100%;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.25);overflow:hidden;}' +
      '.cr-head{padding:16px 20px 10px;border-bottom:1px solid #e8edf2;}' +
      '.cr-step-indicator{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;}' +
      '.cr-head-title{font-size:16px;font-weight:700;color:#0f172a;margin-top:2px;}' +
      '.cr-ia-hint{padding:8px 20px;background:#eff6ff;font-size:12px;color:#1d4ed8;font-weight:500;border-bottom:1px solid #bfdbfe;}' +
      '.cr-body{padding:16px 20px;overflow-y:auto;flex:1;}' +
      '.cr-footer{padding:12px 20px;border-top:1px solid #e8edf2;display:flex;justify-content:flex-end;gap:8px;}' +
      '.cr-btn{padding:8px 18px;border-radius:8px;border:1px solid #e8edf2;background:#fff;color:#475569;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;}' +
      '.cr-btn-primary{background:#009DDD;color:#fff;border-color:#009DDD;}' +
      '.cr-btn-primary:hover{background:#0088c2;}' +
      '.cr-result-grid,.cr-action-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;}' +
      '.cr-result-btn,.cr-action-btn{display:flex;flex-direction:column;align-items:center;gap:4px;padding:14px 8px;border-radius:12px;border:2px solid #e8edf2;background:#fff;cursor:pointer;font-family:inherit;transition:all .15s;position:relative;}' +
      '.cr-result-btn:hover,.cr-action-btn:hover{border-color:#d1d9e0;background:#f8fafc;}' +
      '.cr-selected{border-color:#009DDD!important;background:#e6f6fd!important;}' +
      '.cr-suggested{box-shadow:0 0 0 1px #3b82f6 inset;}' +
      '.cr-result-icon{font-size:24px;}' +
      '.cr-result-label{font-size:11px;font-weight:600;color:#475569;}' +
      '.cr-ai-badge{position:absolute;top:4px;right:4px;font-size:8px;font-weight:700;color:#1d4ed8;background:#dbeafe;padding:1px 4px;border-radius:4px;}' +
      '.cr-section-title{font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;}' +
      '.cr-textarea{width:100%;min-height:20vh;padding:10px;border:1px solid #e8edf2;border-radius:8px;font-size:12px;font-family:inherit;color:#0f172a;resize:vertical;box-sizing:border-box;}' +
      '.cr-textarea:focus{outline:none;border-color:#009DDD;}' +
      '.cr-input{width:100%;padding:7px 10px;border:1px solid #e8edf2;border-radius:8px;font-size:12px;font-family:inherit;color:#0f172a;box-sizing:border-box;}' +
      '.cr-label{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;display:block;margin-bottom:3px;}' +
      '@media(max-width:480px){.cr-result-grid,.cr-action-grid{grid-template-columns:1fr 1fr;}}';
  },
};
