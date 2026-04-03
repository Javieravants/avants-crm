// === Modulo Campanas — Power Dialer (admin) ===
// REGLA: todo dinamico por ID, nunca nombres hardcodeados

const CampanasModule = {
  campanas: [],
  pipelines: [],
  stages: {},    // pipeline_id → stages[]
  agents: [],

  esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; },

  async render() {
    const c = document.getElementById('main-content');
    c.style.padding = '';
    c.style.overflow = '';
    c.innerHTML = '<p style="color:#94a3b8">Cargando campanas...</p>';

    try {
      const [campanas, pipelinesR, users] = await Promise.all([
        API.get('/campanas'),
        API.get('/pipeline'),
        API.get('/auth/users'),
      ]);
      this.campanas = campanas.campanas || [];
      this.pipelines = pipelinesR.pipelines || pipelinesR || [];
      this.agents = (users || []).filter(u => u.activo);

      // Precargar stages de cada pipeline
      for (const pl of this.pipelines) {
        try {
          const r = await API.get(`/pipeline/${pl.id}/stages`);
          this.stages[pl.id] = r.stages || [];
        } catch { this.stages[pl.id] = []; }
      }

      this.renderLayout();
    } catch (err) {
      c.innerHTML = `<p style="color:#ef4444">${err.message}</p>`;
    }
  },

  renderLayout() {
    const c = document.getElementById('main-content');
    c.innerHTML = `
      <style>${this.getCSS()}</style>
      <div class="cp-wrap">
        <div class="cp-toolbar">
          <h1 class="cp-title">${Icons.llamada(22, '#009DDD')} Campanas</h1>
          <span class="cp-count">${this.campanas.length} campanas</span>
          <div style="flex:1"></div>
          <button class="cp-btn cp-btn-primary" onclick="CampanasModule.openNew()">
            ${Icons.llamada(16, '#fff')} Nueva campana
          </button>
        </div>
        <div class="cp-grid" id="cp-grid">
          ${this.campanas.length ? this.campanas.map(c => this.renderCard(c)).join('') : this.renderEmpty()}
        </div>
      </div>
    `;
  },

  renderCard(c) {
    const total = parseInt(c.total_contactos) || 0;
    const pendientes = parseInt(c.pendientes) || 0;
    const completados = parseInt(c.completados) || 0;
    const tasa = c.tasa_contacto || 0;
    const pipelinesHtml = (c.pipelines_origen || []).map(po =>
      `<span class="cp-pill" style="background:${po.pipeline_color || '#009DDD'}20;color:${po.pipeline_color || '#009DDD'};border:1px solid ${po.pipeline_color || '#009DDD'}40;">${this.esc(po.pipeline_nombre)}</span>`
    ).join('') || '<span class="cp-pill" style="background:#f4f6f9;color:#94a3b8;">Sin pipelines</span>';

    const estadoCfg = {
      activa:     { bg: '#d1fae5', color: '#065f46', label: 'Activa' },
      pausada:    { bg: '#fef3c7', color: '#92400e', label: 'Pausada' },
      completada: { bg: '#f3f4f6', color: '#6b7280', label: 'Completada' },
    };
    const est = estadoCfg[c.estado] || estadoCfg.activa;

    return `<div class="cp-card" onclick="CampanasModule.openDetail(${c.id})">
      <div class="cp-card-head">
        <div class="cp-card-title">${this.esc(c.nombre)}</div>
        <span class="cp-badge" style="background:${est.bg};color:${est.color};">${est.label}</span>
      </div>
      <div class="cp-card-pills">${pipelinesHtml}</div>
      <div class="cp-card-stats">
        <div class="cp-stat">
          <div class="cp-stat-num">${total}</div>
          <div class="cp-stat-label">Contactos</div>
        </div>
        <div class="cp-stat">
          <div class="cp-stat-num">${pendientes}</div>
          <div class="cp-stat-label">Pendientes</div>
        </div>
        <div class="cp-stat">
          <div class="cp-stat-num">${completados}</div>
          <div class="cp-stat-label">Completados</div>
        </div>
        <div class="cp-stat">
          <div class="cp-stat-num" style="color:${tasa >= 50 ? '#10b981' : tasa >= 25 ? '#f59e0b' : '#94a3b8'}">${tasa}%</div>
          <div class="cp-stat-label">Tasa</div>
        </div>
      </div>
      <div class="cp-card-foot">
        <span style="color:#94a3b8;font-size:11px;">${c.num_agentes || 0} agentes</span>
        <span style="color:#94a3b8;font-size:11px;">${c.tipo || 'manual'}</span>
      </div>
    </div>`;
  },

  renderEmpty() {
    return `<div class="cp-empty">
      ${Icons.llamada(48, '#d1d9e0')}
      <div style="font-size:15px;font-weight:600;color:#475569;margin-top:12px;">Sin campanas</div>
      <div style="font-size:13px;color:#94a3b8;margin-top:4px;">Crea tu primera campana para empezar a llamar</div>
    </div>`;
  },

  // ══════════════════════════════════════════
  // CREAR CAMPANA
  // ══════════════════════════════════════════

  openNew() {
    this._showModal('Nueva campana', this._buildForm({}), async (form) => {
      const data = this._readForm(form);
      await API.post('/campanas', data);
      this.render();
    });
  },

  // ══════════════════════════════════════════
  // DETALLE CAMPANA
  // ══════════════════════════════════════════

  async openDetail(id) {
    const campana = this.campanas.find(c => c.id === id);
    if (!campana) return;

    // Cargar agentes de la campana
    let agentesData = [];
    let pipelinesOrigenData = [];
    try {
      const [agR, plR] = await Promise.all([
        API.get(`/campanas/${id}/agentes`),
        API.get(`/campanas/${id}/pipelines`),
      ]);
      agentesData = agR.agentes || [];
      pipelinesOrigenData = plR.pipelines || [];
    } catch {}

    const content = `
      <div class="cp-detail-section">
        <div class="cp-detail-head">
          <h3 style="margin:0;font-size:15px;">${this.esc(campana.nombre)}</h3>
          <div style="display:flex;gap:6px;">
            <button class="cp-btn cp-btn-sm" onclick="CampanasModule.editCampana(${id})">Editar</button>
            <button class="cp-btn cp-btn-sm" onclick="CampanasModule.toggleEstado(${id},'${campana.estado}')">${campana.estado === 'activa' ? 'Pausar' : 'Reanudar'}</button>
          </div>
        </div>
        <div style="font-size:12px;color:#94a3b8;margin-top:4px;">
          Horario: ${campana.hora_inicio?.substring(0,5) || '09:00'} - ${campana.hora_fin?.substring(0,5) || '21:00'}
          · Max intentos: ${campana.max_intentos || 3}
          · WA auto: ${campana.whatsapp_si_no_contesta ? 'Si' : 'No'}
        </div>
      </div>

      <div class="cp-detail-section">
        <div class="cp-detail-head">
          <h4 style="margin:0;font-size:13px;color:#475569;">Pipelines origen</h4>
          <button class="cp-btn cp-btn-sm" onclick="CampanasModule.editPipelines(${id})">Configurar</button>
        </div>
        <div class="cp-card-pills" style="margin-top:8px;">
          ${pipelinesOrigenData.map(po =>
            `<span class="cp-pill" style="background:${po.pipeline_color || '#009DDD'}20;color:${po.pipeline_color || '#009DDD'};">${this.esc(po.pipeline_nombre)}${po.stage_ids?.length ? ' (' + po.stage_ids.length + ' etapas)' : ''}</span>`
          ).join('') || '<span style="color:#94a3b8;font-size:12px;">Ninguno configurado</span>'}
        </div>
      </div>

      <div class="cp-detail-section">
        <div class="cp-detail-head">
          <h4 style="margin:0;font-size:13px;color:#475569;">Agentes (${agentesData.length})</h4>
          <button class="cp-btn cp-btn-sm" onclick="CampanasModule.editAgentes(${id})">Gestionar</button>
        </div>
        <div style="margin-top:8px;display:flex;flex-direction:column;gap:4px;">
          ${agentesData.map(a => `
            <div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:#f4f6f9;border-radius:8px;">
              <div style="width:26px;height:26px;border-radius:50%;background:hsl(${(a.user_id*47)%360},55%,55%);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff;">${(a.agente_nombre||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}</div>
              <span style="font-size:12px;font-weight:600;color:#0f172a;flex:1;">${this.esc(a.agente_nombre)}</span>
              <span style="font-size:11px;color:#94a3b8;">${a.pendientes || 0} pend. · ${a.completados || 0} comp.</span>
            </div>
          `).join('') || '<span style="color:#94a3b8;font-size:12px;">Sin agentes asignados</span>'}
        </div>
      </div>

      <div class="cp-detail-section">
        <div class="cp-detail-head">
          <h4 style="margin:0;font-size:13px;color:#475569;">Importar contactos</h4>
        </div>
        <div style="margin-top:8px;">
          <button class="cp-btn cp-btn-primary" onclick="CampanasModule.importarContactos(${id})">
            ${Icons.importar ? Icons.importar(16, '#fff') : ''} Importar desde pipelines configurados
          </button>
        </div>
      </div>
    `;

    this._showModal(campana.nombre, content, null, true);
  },

  // ══════════════════════════════════════════
  // EDITAR CAMPANA
  // ══════════════════════════════════════════

  editCampana(id) {
    const campana = this.campanas.find(c => c.id === id);
    if (!campana) return;
    this._closeModal();
    this._showModal('Editar campana', this._buildForm(campana), async (form) => {
      const data = this._readForm(form);
      await API.put(`/campanas/${id}`, data);
      this.render();
    });
  },

  async toggleEstado(id, estadoActual) {
    const nuevo = estadoActual === 'activa' ? 'pausada' : 'activa';
    await API.put(`/campanas/${id}`, { estado: nuevo });
    this._closeModal();
    this.render();
  },

  // ══════════════════════════════════════════
  // CONFIGURAR PIPELINES ORIGEN
  // ══════════════════════════════════════════

  async editPipelines(campanaId) {
    // Cargar pipelines origen actuales
    let current = [];
    try {
      const r = await API.get(`/campanas/${campanaId}/pipelines`);
      current = r.pipelines || [];
    } catch {}
    const currentIds = new Set(current.map(p => p.pipeline_id));

    let html = '<div style="display:flex;flex-direction:column;gap:8px;max-height:400px;overflow-y:auto;">';
    for (const pl of this.pipelines) {
      const checked = currentIds.has(pl.id) ? 'checked' : '';
      const stages = this.stages[pl.id] || [];
      const currentPo = current.find(p => p.pipeline_id === pl.id);
      const selectedStages = new Set(currentPo?.stage_ids || []);

      html += `
        <div class="cp-pl-item" style="border:1px solid #e8edf2;border-radius:10px;overflow:hidden;">
          <label style="display:flex;align-items:center;gap:8px;padding:10px 12px;cursor:pointer;background:${checked ? '#f0f9ff' : '#fff'};">
            <input type="checkbox" class="cp-pl-check" data-pipeline-id="${pl.id}" ${checked}
              onchange="CampanasModule._togglePipelineStages(this)">
            <span style="width:8px;height:8px;border-radius:50%;background:${pl.color || '#009DDD'};flex-shrink:0;"></span>
            <span style="font-size:13px;font-weight:600;color:#0f172a;">${this.esc(pl.name)}</span>
          </label>
          <div class="cp-stages-wrap" style="padding:0 12px 10px;display:${checked ? 'flex' : 'none'};flex-wrap:wrap;gap:4px;">
            ${stages.length ? stages.map(s => `
              <label style="display:flex;align-items:center;gap:4px;padding:3px 8px;border-radius:6px;background:#f4f6f9;cursor:pointer;font-size:11px;color:#475569;">
                <input type="checkbox" class="cp-stage-check" data-pipeline-id="${pl.id}" data-stage-id="${s.id}"
                  ${selectedStages.has(s.id) ? 'checked' : ''}>
                ${this.esc(s.name)}
              </label>
            `).join('') : '<span style="font-size:11px;color:#94a3b8;">Todas las etapas</span>'}
          </div>
        </div>`;
    }
    html += '</div><p style="font-size:11px;color:#94a3b8;margin-top:8px;">Si no seleccionas etapas, se incluyen todas las del pipeline.</p>';

    this._closeModal();
    this._showModal('Pipelines origen', html, async () => {
      const pipelines = [];
      document.querySelectorAll('.cp-pl-check:checked').forEach(cb => {
        const plId = parseInt(cb.dataset.pipelineId);
        const stageIds = [];
        document.querySelectorAll(`.cp-stage-check[data-pipeline-id="${plId}"]:checked`).forEach(scb => {
          stageIds.push(parseInt(scb.dataset.stageId));
        });
        pipelines.push({ pipeline_id: plId, stage_ids: stageIds });
      });
      await API.put(`/campanas/${campanaId}/pipelines`, { pipelines });
      this.render();
    });
  },

  _togglePipelineStages(checkbox) {
    const wrap = checkbox.closest('.cp-pl-item').querySelector('.cp-stages-wrap');
    if (wrap) wrap.style.display = checkbox.checked ? 'flex' : 'none';
    checkbox.closest('label').style.background = checkbox.checked ? '#f0f9ff' : '#fff';
  },

  // ══════════════════════════════════════════
  // GESTIONAR AGENTES
  // ══════════════════════════════════════════

  async editAgentes(campanaId) {
    let current = [];
    try {
      const r = await API.get(`/campanas/${campanaId}/agentes`);
      current = r.agentes || [];
    } catch {}
    const currentIds = new Set(current.map(a => a.user_id));

    // Cargar pipelines de la campana
    let campPipelines = [];
    try {
      const r = await API.get(`/campanas/${campanaId}/pipelines`);
      campPipelines = r.pipelines || [];
    } catch {}

    let html = '<div style="display:flex;flex-direction:column;gap:6px;max-height:450px;overflow-y:auto;">';
    for (const agent of this.agents) {
      const checked = currentIds.has(agent.id) ? 'checked' : '';
      const agData = current.find(a => a.user_id === agent.id);
      const pipPermitidos = new Set(agData?.pipelines_permitidos || []);
      const maxLlamadas = agData?.max_llamadas_dia || 100;

      html += `
        <div class="cp-ag-item" style="border:1px solid #e8edf2;border-radius:10px;overflow:hidden;">
          <label style="display:flex;align-items:center;gap:8px;padding:10px 12px;cursor:pointer;background:${checked ? '#f0f9ff' : '#fff'};">
            <input type="checkbox" class="cp-ag-check" data-user-id="${agent.id}" ${checked}
              onchange="this.closest('.cp-ag-item').querySelector('.cp-ag-config').style.display=this.checked?'block':'none';this.closest('label').style.background=this.checked?'#f0f9ff':'#fff';">
            <div style="width:26px;height:26px;border-radius:50%;background:hsl(${(agent.id*47)%360},55%,55%);display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff;flex-shrink:0;">${(agent.nombre||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()}</div>
            <span style="font-size:13px;font-weight:600;color:#0f172a;">${this.esc(agent.nombre)}</span>
            <span style="font-size:11px;color:#94a3b8;margin-left:auto;">${agent.rol}</span>
          </label>
          <div class="cp-ag-config" style="padding:8px 12px 12px;display:${checked ? 'block' : 'none'};border-top:1px solid #f0f2f5;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
              <label style="font-size:11px;font-weight:600;color:#94a3b8;">Max llamadas/dia:</label>
              <input type="number" class="cp-ag-max" data-user-id="${agent.id}" value="${maxLlamadas}"
                style="width:60px;padding:4px 8px;border:1px solid #e8edf2;border-radius:6px;font-size:12px;font-family:inherit;">
            </div>
            ${campPipelines.length ? `
              <div style="font-size:11px;font-weight:600;color:#94a3b8;margin-bottom:4px;">Pipelines permitidos:</div>
              <div style="display:flex;flex-wrap:wrap;gap:4px;">
                ${campPipelines.map(po => `
                  <label style="display:flex;align-items:center;gap:4px;padding:3px 8px;border-radius:6px;background:#f4f6f9;cursor:pointer;font-size:11px;color:#475569;">
                    <input type="checkbox" class="cp-ag-pip" data-user-id="${agent.id}" data-pipeline-id="${po.pipeline_id}"
                      ${!agData || pipPermitidos.size === 0 || pipPermitidos.has(po.pipeline_id) ? 'checked' : ''}>
                    <span style="width:6px;height:6px;border-radius:50%;background:${po.pipeline_color || '#009DDD'};"></span>
                    ${this.esc(po.pipeline_nombre)}
                  </label>
                `).join('')}
              </div>
            ` : ''}
          </div>
        </div>`;
    }
    html += '</div>';

    this._closeModal();
    this._showModal('Gestionar agentes', html, async () => {
      const agentes = [];
      document.querySelectorAll('.cp-ag-check:checked').forEach(cb => {
        const userId = parseInt(cb.dataset.userId);
        const maxEl = document.querySelector(`.cp-ag-max[data-user-id="${userId}"]`);
        const pipelines = [];
        document.querySelectorAll(`.cp-ag-pip[data-user-id="${userId}"]:checked`).forEach(pcb => {
          pipelines.push(parseInt(pcb.dataset.pipelineId));
        });
        agentes.push({
          user_id: userId,
          max_llamadas_dia: parseInt(maxEl?.value) || 100,
          pipelines_permitidos: pipelines,
          orden_pipelines: pipelines,
        });
      });
      await API.post(`/campanas/${campanaId}/agentes`, { agentes });
      this.render();
    });
  },

  // ══════════════════════════════════════════
  // IMPORTAR CONTACTOS
  // ══════════════════════════════════════════

  async importarContactos(campanaId) {
    this._closeModal();
    try {
      const r = await API.post(`/campanas/${campanaId}/contactos/importar`, {});
      const msg = `Importados: ${r.importados} contactos de ${r.pipelines_consultados || 0} pipelines.${r.ya_existentes ? ' (' + r.ya_existentes + ' ya existian)' : ''}`;
      this._showModal('Resultado', `<div style="text-align:center;padding:20px;">
        <div style="font-size:32px;font-weight:800;color:#10b981;">${r.importados}</div>
        <div style="font-size:13px;color:#475569;margin-top:4px;">${msg}</div>
      </div>`, null, true);
      setTimeout(() => this.render(), 1500);
    } catch (err) {
      this._showModal('Error', `<p style="color:#ef4444">${err.message}</p>`, null, true);
    }
  },

  // ══════════════════════════════════════════
  // FORM HELPERS
  // ══════════════════════════════════════════

  _buildForm(data) {
    const tipos = ['manual', 'leads_nuevos', 'recuperacion', 'seguimiento'];
    return `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div>
          <label class="cp-label">Nombre</label>
          <input id="cp-f-nombre" class="cp-input" value="${this.esc(data.nombre || '')}" placeholder="Ej: Campana ADESLAS Abril">
        </div>
        <div>
          <label class="cp-label">Descripcion</label>
          <textarea id="cp-f-desc" class="cp-input" rows="2" placeholder="Descripcion opcional...">${this.esc(data.descripcion || '')}</textarea>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div>
            <label class="cp-label">Tipo</label>
            <select id="cp-f-tipo" class="cp-input">
              ${tipos.map(t => `<option value="${t}" ${data.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="cp-label">Prioridad base (1-4)</label>
            <input id="cp-f-prioridad" type="number" class="cp-input" min="1" max="4" value="${data.prioridad || 3}">
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div>
            <label class="cp-label">Hora inicio</label>
            <input id="cp-f-hora-ini" type="time" class="cp-input" value="${(data.hora_inicio || '09:00').substring(0,5)}">
          </div>
          <div>
            <label class="cp-label">Hora fin</label>
            <input id="cp-f-hora-fin" type="time" class="cp-input" value="${(data.hora_fin || '21:00').substring(0,5)}">
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div>
            <label class="cp-label">Max intentos</label>
            <input id="cp-f-max-int" type="number" class="cp-input" min="1" max="20" value="${data.max_intentos || 3}">
          </div>
          <div>
            <label class="cp-label">Min entre intentos</label>
            <input id="cp-f-min-entre" type="number" class="cp-input" min="5" value="${data.minutos_entre_intentos || 60}">
          </div>
        </div>
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;color:#475569;">
          <input id="cp-f-wa" type="checkbox" ${data.whatsapp_si_no_contesta !== false ? 'checked' : ''}>
          WhatsApp automatico si no contesta
        </label>
      </div>
    `;
  },

  _readForm() {
    return {
      nombre: document.getElementById('cp-f-nombre')?.value?.trim(),
      descripcion: document.getElementById('cp-f-desc')?.value?.trim() || null,
      tipo: document.getElementById('cp-f-tipo')?.value,
      prioridad: parseInt(document.getElementById('cp-f-prioridad')?.value) || 3,
      hora_inicio: document.getElementById('cp-f-hora-ini')?.value || '09:00',
      hora_fin: document.getElementById('cp-f-hora-fin')?.value || '21:00',
      max_intentos: parseInt(document.getElementById('cp-f-max-int')?.value) || 3,
      minutos_entre_intentos: parseInt(document.getElementById('cp-f-min-entre')?.value) || 60,
      whatsapp_si_no_contesta: document.getElementById('cp-f-wa')?.checked !== false,
    };
  },

  // ══════════════════════════════════════════
  // MODAL GENERICO
  // ══════════════════════════════════════════

  _showModal(title, content, onSave, readOnly) {
    // Cerrar anterior
    this._closeModal();

    const overlay = document.createElement('div');
    overlay.id = 'cp-modal-overlay';
    overlay.className = 'cp-overlay';
    overlay.innerHTML = `
      <div class="cp-modal">
        <div class="cp-modal-head">
          <span style="font-size:15px;font-weight:700;color:#0f172a;">${title}</span>
          <button onclick="CampanasModule._closeModal()" class="cp-modal-close">&times;</button>
        </div>
        <div class="cp-modal-body">${content}</div>
        ${!readOnly ? `<div class="cp-modal-foot">
          <button class="cp-btn" onclick="CampanasModule._closeModal()">Cancelar</button>
          <button class="cp-btn cp-btn-primary" id="cp-modal-save">Guardar</button>
        </div>` : ''}
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) this._closeModal(); });

    if (onSave) {
      document.getElementById('cp-modal-save')?.addEventListener('click', async () => {
        try {
          await onSave();
          this._closeModal();
        } catch (err) {
          alert(err.message);
        }
      });
    }
  },

  _closeModal() {
    document.getElementById('cp-modal-overlay')?.remove();
  },

  // ══════════════════════════════════════════
  // CSS
  // ══════════════════════════════════════════

  getCSS() {
    return `
      .cp-wrap{padding:24px;max-width:1200px;margin:0 auto;}
      .cp-toolbar{display:flex;align-items:center;gap:12px;margin-bottom:20px;}
      .cp-title{font-size:18px;font-weight:700;color:#0f172a;display:flex;align-items:center;gap:8px;margin:0;}
      .cp-count{font-size:12px;color:#94a3b8;font-weight:500;}
      .cp-btn{padding:7px 14px;border-radius:8px;border:1px solid #e8edf2;background:#fff;color:#475569;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:6px;transition:all .15s;}
      .cp-btn:hover{border-color:#d1d9e0;background:#f4f6f9;}
      .cp-btn-primary{background:#009DDD;color:#fff;border-color:#009DDD;}
      .cp-btn-primary:hover{background:#0088c2;}
      .cp-btn-sm{padding:5px 10px;font-size:11px;}
      .cp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;}
      .cp-card{background:#fff;border:1px solid #e8edf2;border-radius:12px;padding:16px;cursor:pointer;transition:all .15s;}
      .cp-card:hover{box-shadow:0 4px 16px rgba(0,0,0,.06);transform:translateY(-1px);}
      .cp-card-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
      .cp-card-title{font-size:14px;font-weight:700;color:#0f172a;}
      .cp-badge{padding:3px 8px;border-radius:8px;font-size:10px;font-weight:700;}
      .cp-card-pills{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px;}
      .cp-pill{padding:2px 8px;border-radius:6px;font-size:10px;font-weight:600;}
      .cp-card-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px;}
      .cp-stat{text-align:center;padding:6px 0;}
      .cp-stat-num{font-size:16px;font-weight:800;color:#0f172a;}
      .cp-stat-label{font-size:10px;color:#94a3b8;font-weight:500;}
      .cp-card-foot{display:flex;justify-content:space-between;padding-top:8px;border-top:1px solid #f0f2f5;}
      .cp-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;grid-column:1/-1;}
      .cp-detail-section{padding:14px 0;border-bottom:1px solid #f0f2f5;}
      .cp-detail-section:last-child{border-bottom:none;}
      .cp-detail-head{display:flex;align-items:center;justify-content:space-between;}
      .cp-label{font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.3px;display:block;margin-bottom:4px;}
      .cp-input{width:100%;padding:8px 10px;border:1px solid #e8edf2;border-radius:8px;font-size:13px;font-family:inherit;color:#0f172a;background:#fff;box-sizing:border-box;}
      .cp-input:focus{outline:none;border-color:#009DDD;box-shadow:0 0 0 3px rgba(0,157,221,.1);}
      .cp-overlay{position:fixed;inset:0;background:rgba(15,23,42,.5);z-index:800;display:flex;align-items:center;justify-content:center;padding:20px;}
      .cp-modal{background:#fff;border-radius:12px;width:520px;max-width:100%;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.2);}
      .cp-modal-head{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #e8edf2;}
      .cp-modal-close{background:none;border:none;font-size:22px;color:#94a3b8;cursor:pointer;padding:0 4px;line-height:1;}
      .cp-modal-close:hover{color:#0f172a;}
      .cp-modal-body{padding:20px;overflow-y:auto;flex:1;}
      .cp-modal-foot{display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;border-top:1px solid #e8edf2;}
    `;
  },
};
