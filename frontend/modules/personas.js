// === Módulo Personas / Clientes ===

const PersonasModule = {
  currentPage: 1,
  filters: {},

  async render() {
    const container = document.getElementById('main-content');
    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
        <h1 class="page-title" style="margin-bottom:0;">Clientes</h1>
        <button class="btn btn-primary" id="btn-new-persona">+ Nueva persona</button>
      </div>

      <div class="card" style="margin-bottom:16px;">
        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <input type="text" class="form-control" id="search-personas" placeholder="Buscar por nombre, DNI, teléfono, email, póliza..." style="flex:1;min-width:250px;">
          <select class="form-control filter-select" id="filter-compania" style="max-width:180px;">
            <option value="">Compañía</option>
            <option value="ADESLAS">ADESLAS</option>
            <option value="DKV">DKV</option>
          </select>
          <select class="form-control filter-select" id="filter-estado" style="max-width:180px;">
            <option value="">Estado</option>
            <option value="poliza_activa">Póliza activa</option>
            <option value="en_tramite">En trámite</option>
            <option value="perdido">Perdido</option>
          </select>
        </div>
      </div>

      <div class="card">
        <div id="personas-count" class="text-light" style="font-size:13px;margin-bottom:12px;"></div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>DNI</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Pólizas</th>
                <th>Deals</th>
              </tr>
            </thead>
            <tbody id="personas-tbody">
              <tr><td colspan="6" class="text-center text-light">Cargando...</td></tr>
            </tbody>
          </table>
        </div>
        <div id="personas-pagination" style="display:flex;justify-content:center;gap:8px;margin-top:16px;"></div>
      </div>
    `;

    // Búsqueda con debounce
    let searchTimeout;
    document.getElementById('search-personas').addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.filters.q = e.target.value;
        this.currentPage = 1;
        this.loadPersonas();
      }, 400);
    });

    document.getElementById('filter-compania').addEventListener('change', (e) => {
      this.filters.compania = e.target.value;
      this.currentPage = 1;
      this.loadPersonas();
    });

    document.getElementById('filter-estado').addEventListener('change', (e) => {
      this.filters.estado_poliza = e.target.value;
      this.currentPage = 1;
      this.loadPersonas();
    });

    document.getElementById('btn-new-persona').addEventListener('click', () => this.showPersonaForm(null));

    this.loadPersonas();
  },

  async loadPersonas() {
    const tbody = document.getElementById('personas-tbody');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-light">Cargando...</td></tr>';

    try {
      let query = `?page=${this.currentPage}&limit=50`;
      if (this.filters.q) query += `&q=${encodeURIComponent(this.filters.q)}`;
      if (this.filters.compania) query += `&compania=${encodeURIComponent(this.filters.compania)}`;
      if (this.filters.estado_poliza) query += `&estado_poliza=${this.filters.estado_poliza}`;

      const data = await API.get(`/personas${query}`);
      const { personas, pagination } = data;

      document.getElementById('personas-count').textContent =
        `${pagination.total.toLocaleString('es-ES')} personas encontradas`;

      if (personas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-light">Sin resultados</td></tr>';
        return;
      }

      tbody.innerHTML = personas.map((p) => `
        <tr class="persona-row" data-id="${p.id}" style="cursor:pointer;">
          <td><strong>${this._esc(p.nombre || '')}</strong></td>
          <td>${p.dni || '<span class="text-light">—</span>'}</td>
          <td>${p.telefono || '<span class="text-light">—</span>'}</td>
          <td>${p.email || '<span class="text-light">—</span>'}</td>
          <td>${p.polizas_activas > 0 ? `<span class="badge badge-agent">${p.polizas_activas}</span>` : '<span class="text-light">0</span>'}</td>
          <td>${p.deals_abiertos > 0 ? `<span class="badge badge-supervisor">${p.deals_abiertos}</span>` : '<span class="text-light">0</span>'}</td>
        </tr>
      `).join('');

      tbody.querySelectorAll('.persona-row').forEach((row) => {
        row.addEventListener('click', () => this.showFicha(parseInt(row.dataset.id)));
      });

      // Paginación
      this.renderPagination(pagination);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" style="color:#c62828">${err.message}</td></tr>`;
    }
  },

  renderPagination(pagination) {
    const container = document.getElementById('personas-pagination');
    if (pagination.pages <= 1) { container.innerHTML = ''; return; }

    let html = '';
    if (pagination.page > 1) {
      html += `<button class="btn btn-secondary btn-sm" data-page="${pagination.page - 1}">← Anterior</button>`;
    }
    html += `<span class="text-light" style="align-self:center;font-size:13px;">Página ${pagination.page} de ${pagination.pages}</span>`;
    if (pagination.page < pagination.pages) {
      html += `<button class="btn btn-secondary btn-sm" data-page="${pagination.page + 1}">Siguiente →</button>`;
    }
    container.innerHTML = html;

    container.querySelectorAll('[data-page]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.currentPage = parseInt(btn.dataset.page);
        this.loadPersonas();
      });
    });
  },

  // === FICHA DE PERSONA ===
  async showFicha(personaId) {
    const container = document.getElementById('main-content');
    container.innerHTML = '<p class="text-light">Cargando ficha...</p>';

    try {
      const persona = await API.get(`/personas/${personaId}`);
      this.renderFicha(persona);
    } catch (err) {
      container.innerHTML = `<p style="color:#c62828">${err.message}</p>`;
    }
  },

  _ini(n) { return (n||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase(); },
  _hu(id) { return (id*47)%360; },

  renderFicha(p) {
    const container = document.getElementById('main-content');
    container.style.padding = '0';
    container.style.overflow = 'hidden';

    const polizasActivas = (p.deals || []).filter(d => d.estado === 'poliza_activa');
    const dealsAbiertos = (p.deals || []).filter(d => d.estado === 'en_tramite');
    const otrosDeals = (p.deals || []).filter(d => !['poliza_activa', 'en_tramite'].includes(d.estado));
    const familiares = p.familiares || [];
    const notas = p.notas || [];
    const tickets = p.tickets || [];
    this._fichaPersona = p; // Guardar referencia para tabs

    // Pipeline info del deal más reciente
    const activeDeal = dealsAbiertos[0] || (p.deals||[])[0];
    const pipelineName = activeDeal?.pipedrive_stage || '';
    const dealParam = activeDeal?.pipedrive_deal_id ? '?deal_id='+activeDeal.pipedrive_deal_id : '';

    // Estilo de tab inline
    const ts = 'padding:11px 16px;font-size:13px;font-weight:600;color:#94a3b8;cursor:pointer;border:none;background:none;border-bottom:2px solid transparent;margin-bottom:-1px;white-space:nowrap;font-family:inherit;';

    container.innerHTML = `
      <div class="ficha-wrap" style="display:flex;flex-direction:column;height:calc(100vh - 60px);overflow:hidden;font-size:15px;">

        <!-- CONTACT HEADER -->
        <div style="background:#fff;border-bottom:1px solid #e8edf2;padding:16px 24px 0;flex-shrink:0;">
          <!-- Fila 1: Back + Nombre + Comunicación + Acciones -->
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
            <button id="btn-back-personas" style="background:none;border:none;cursor:pointer;color:#94a3b8;font-size:13px;display:flex;align-items:center;gap:4px;font-family:inherit;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>
              Contactos
            </button>
            <div style="font-size:22px;font-weight:800;flex:1;">${this._esc(p.nombre || 'Sin nombre')}</div>
            <!-- Comunicación: Llamar + WhatsApp + Email -->
            <div style="display:flex;gap:6px;">
              ${p.telefono ? `<button onclick="window.open('tel:${p.telefono}')" style="padding:7px 12px;border-radius:8px;border:none;background:#10b981;color:#fff;cursor:pointer;font-size:12px;font-weight:700;font-family:inherit;display:flex;align-items:center;gap:4px" title="Llamar">📞 Llamar</button>` : ''}
              ${p.telefono ? `<button onclick="window.open('https://wa.me/34${(p.telefono||'').replace(/\\D/g,'')}')" style="padding:7px 12px;border-radius:8px;border:none;background:#25d366;color:#fff;cursor:pointer;font-size:12px;font-weight:700;font-family:inherit;display:flex;align-items:center;gap:4px" title="WhatsApp">💬 WhatsApp</button>` : ''}
              ${p.email ? `<button onclick="window.open('mailto:${p.email}')" style="padding:7px 12px;border-radius:8px;border:1px solid #e8edf2;background:#fff;color:#475569;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit;display:flex;align-items:center;gap:4px" title="Email">📧 Email</button>` : ''}
            </div>
            <div style="width:1px;height:24px;background:#e8edf2"></div>
            <button id="btn-edit-persona" style="padding:6px 12px;border-radius:8px;border:1px solid #e8edf2;background:#fff;font-size:12px;font-weight:600;color:#475569;cursor:pointer;font-family:inherit">✏️ Editar</button>
            ${p.pipedrive_person_id ? `<a href="https://avantssl.pipedrive.com/person/${p.pipedrive_person_id}" target="_blank" style="padding:6px 12px;border-radius:8px;border:1px solid #e8edf2;font-size:12px;font-weight:600;color:#94a3b8;text-decoration:none">Pipedrive ↗</a>` : ''}
            <button style="padding:7px 16px;border-radius:8px;border:none;background:#10b981;color:#fff;cursor:pointer;font-size:12px;font-weight:700;font-family:inherit">✓ Ganado</button>
            <button style="padding:7px 16px;border-radius:8px;border:1px solid #ef4444;background:#fff;color:#ef4444;cursor:pointer;font-size:12px;font-weight:700;font-family:inherit">✕ Perdido</button>
          </div>
          ${pipelineName ? `<div style="font-size:11px;color:#94a3b8;margin-bottom:8px">PIPELINE → <strong style="color:var(--accent)">${this._esc(pipelineName)}</strong></div>` : ''}

          <!-- TABS + Acciones derecha -->
          <div style="display:flex;gap:2px;border-top:1px solid #e8edf2;" id="persona-tabs">
            <button class="tab-btn active" data-tab="grabaciones" style="${ts}">Pólizas</button>
            <button class="tab-btn" data-tab="deals" style="${ts}">Oportunidades (${dealsAbiertos.length})</button>
            <button class="tab-btn" data-tab="tramites" style="${ts}">Trámites (${tickets.length})</button>
            <button class="tab-btn" data-tab="familiares" style="${ts}">Familiares (${familiares.length})</button>
            <button class="tab-btn" data-tab="notas" style="${ts}">Notas (${notas.length})</button>
            <button class="tab-btn" data-tab="calculadora" style="${ts}">Calculadora</button>
            <div style="flex:1"></div>
            <div style="display:flex;gap:6px;align-items:center;padding:4px 0;">
              <button onclick="PersonasModule._showAddActivity(${p.id})" style="padding:7px 12px;border-radius:8px;border:1px solid #e8edf2;background:#fff;color:#475569;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit;display:flex;align-items:center;gap:4px">📅 Actividad</button>
              <button onclick="App.navigate('grabaciones')" style="padding:7px 12px;border-radius:8px;border:none;background:#ef4444;color:#fff;cursor:pointer;font-size:12px;font-weight:700;font-family:inherit;display:flex;align-items:center;gap:4px">🎙 Grabar</button>
            </div>
          </div>
        </div>

        <!-- BODY: 2 columnas -->
        <div style="flex:1;display:flex;overflow:hidden;" id="ficha-body">

          <!-- PANEL IZQUIERDO 300px -->
          <div class="ficha-left" style="width:300px;flex-shrink:0;border-right:1px solid #e8edf2;overflow-y:auto;background:#fff;">

            <!-- Datos personales -->
            <div style="border-bottom:1px solid #e8edf2;padding:16px 18px;">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#94a3b8;margin-bottom:12px">Datos personales</div>
              ${[['DNI',p.dni],['Teléfono',p.telefono],['Email',p.email],['F. Nacimiento',p.fecha_nacimiento?new Date(p.fecha_nacimiento).toLocaleDateString('es-ES'):null],['Dirección',p.direccion],['Nacionalidad',p.nacionalidad],['Creado',p.created_at?new Date(p.created_at).toLocaleDateString('es-ES'):null]].map(([l,v])=>`<div style="display:flex;gap:8px;margin-bottom:8px"><div style="font-size:11px;font-weight:600;color:#94a3b8;min-width:85px;text-transform:uppercase;letter-spacing:.3px">${l}</div><div style="font-size:13px;color:#0f172a;font-weight:500;flex:1;word-break:break-word">${this._esc(v||'—')}</div></div>`).join('')}
            </div>

            <!-- Asegurados/Familiares -->
            <div style="border-bottom:1px solid #e8edf2;padding:16px 18px;">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#94a3b8;margin-bottom:12px">Asegurados (${familiares.length})</div>
              ${familiares.length===0?'<div style="font-size:13px;color:#94a3b8">Sin familiares registrados</div>':''}
              ${familiares.map(f=>`<div style="background:#f4f6f9;border-radius:10px;padding:10px 12px;margin-bottom:8px">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
                  <div style="width:24px;height:24px;border-radius:50%;background:hsl(${this._hu(f.id)},55%,55%);display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;color:#fff">${this._ini(f.nombre)}</div>
                  <div style="font-size:12px;font-weight:700;flex:1">${this._esc(f.nombre)}</div>
                  <span style="font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px;background:#e6f5fc;color:var(--accent)">${f.parentesco||'Familiar'}</span>
                </div>
                <div style="font-size:11px;color:#94a3b8;display:flex;gap:10px">
                  ${f.fecha_nacimiento?`<span>${new Date(f.fecha_nacimiento).toLocaleDateString('es-ES')}</span>`:''}
                  ${f.dni?`<span>${f.dni}</span>`:''}
                </div>
              </div>`).join('')}
            </div>

            <!-- Seguros actuales -->
            <div style="border-bottom:1px solid #e8edf2;padding:16px 18px;">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#94a3b8;margin-bottom:12px">Seguros actuales (${polizasActivas.length})</div>
              ${polizasActivas.length===0?'<div style="font-size:13px;color:#94a3b8">Sin pólizas activas</div>':''}
              ${polizasActivas.map(d=>`<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f0f0f0">
                <span style="font-size:16px">🏥</span>
                <div style="flex:1"><div style="font-size:12px;font-weight:600">${this._esc(d.compania||'')} · ${this._esc(d.producto||'')}</div><div style="font-size:11px;color:#94a3b8">${d.poliza||'Sin nº póliza'}</div></div>
                ${d.prima?`<div style="font-size:13px;font-weight:700;color:var(--accent)">${d.prima}€</div>`:''}
              </div>`).join('')}
            </div>

            <!-- Oportunidades -->
            <div style="padding:16px 18px;">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#94a3b8;margin-bottom:12px">Oportunidades (${dealsAbiertos.length})</div>
              ${dealsAbiertos.length===0?'<div style="font-size:13px;color:#94a3b8">Sin oportunidades abiertas</div>':''}
              ${dealsAbiertos.map(d=>`<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f0f0f0">
                <span style="font-size:16px">🎯</span>
                <div style="flex:1"><div style="font-size:12px;font-weight:600">${this._esc(d.compania||'')} · ${this._esc(d.producto||'')}</div><div style="font-size:11px;color:#94a3b8">${d.pipedrive_stage||d.estado||''}</div></div>
                ${d.prima?`<div style="font-size:13px;font-weight:700;color:var(--accent)">${d.prima}€</div>`:''}
              </div>`).join('')}
            </div>
          </div>

          <!-- PANEL CENTRO -->
          <div style="flex:1;overflow-y:auto;padding:20px 24px;min-width:0;" id="persona-tab-content"></div>

        </div>
      </div>

      <!-- CSS responsive -->
      <style>
        @media(max-width:768px){
          .ficha-wrap{font-size:14px!important}
          .ficha-left{display:none!important}
          #persona-tabs{overflow-x:auto;flex-wrap:nowrap}
          #persona-tabs .tab-btn{font-size:11px!important;padding:8px 10px!important}
        }
      </style>
    `;

    // Event listeners
    document.getElementById('btn-back-personas').addEventListener('click', () => {
      container.style.padding = '';
      container.style.overflow = '';
      this.render();
    });
    document.getElementById('btn-edit-persona').addEventListener('click', () => this.showPersonaForm(p));

    // Tab styling
    const setActiveTab = (btn) => {
      document.querySelectorAll('#persona-tabs .tab-btn').forEach(b => {
        b.style.color = '#94a3b8';
        b.style.borderBottomColor = 'transparent';
      });
      btn.style.color = 'var(--accent)';
      btn.style.borderBottomColor = 'var(--accent)';
    };
    setActiveTab(document.querySelector('#persona-tabs .tab-btn'));

    document.getElementById('persona-tabs').addEventListener('click', (e) => {
      const btn = e.target.closest('.tab-btn');
      if (!btn) return;
      setActiveTab(btn);
      this.renderTab(btn.dataset.tab, p);
    });

    this.renderTab('grabaciones', p);
  },

  // Modal para añadir actividad (próxima llamada)
  _showAddActivity(personaId) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.5);display:flex;align-items:center;justify-content:center;z-index:400';
    modal.onclick = (e) => { if(e.target===modal) modal.remove(); };
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
    const defDate = tomorrow.toISOString().split('T')[0];
    modal.innerHTML = `<div style="background:#fff;border-radius:14px;width:400px;box-shadow:0 20px 60px rgba(0,0,0,.2);overflow:hidden">
      <div style="padding:18px 20px;border-bottom:1px solid #e8edf2;display:flex;align-items:center;gap:12px">
        <span style="font-size:20px">📅</span>
        <div style="font-size:16px;font-weight:800;flex:1">Nueva Actividad</div>
        <button onclick="this.closest('div[style*=fixed]').remove()" style="background:none;border:none;cursor:pointer;color:#94a3b8;font-size:18px">✕</button>
      </div>
      <div style="padding:20px;display:flex;flex-direction:column;gap:12px">
        <div><label style="font-size:11px;font-weight:700;text-transform:uppercase;color:#94a3b8;letter-spacing:.6px">Tipo</label>
          <select id="act-tipo" class="form-control" style="margin-top:4px"><option value="call">Llamada</option><option value="email">Email</option><option value="meeting">Reunión</option></select></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div><label style="font-size:11px;font-weight:700;text-transform:uppercase;color:#94a3b8;letter-spacing:.6px">Fecha</label>
            <input type="date" id="act-fecha" class="form-control" style="margin-top:4px" value="${defDate}"></div>
          <div><label style="font-size:11px;font-weight:700;text-transform:uppercase;color:#94a3b8;letter-spacing:.6px">Hora</label>
            <input type="time" id="act-hora" class="form-control" style="margin-top:4px" value="10:00"></div>
        </div>
        <div><label style="font-size:11px;font-weight:700;text-transform:uppercase;color:#94a3b8;letter-spacing:.6px">Nota</label>
          <textarea id="act-nota" class="form-control" rows="2" style="margin-top:4px" placeholder="Ej: Llamar para seguimiento propuesta"></textarea></div>
        <button onclick="PersonasModule._saveActivity(${personaId})" style="padding:10px;border-radius:8px;border:none;background:var(--accent);color:#fff;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">Programar actividad</button>
      </div>
    </div>`;
    document.body.appendChild(modal);
  },

  async _saveActivity(personaId) {
    const tipo = document.getElementById('act-tipo')?.value;
    const fecha = document.getElementById('act-fecha')?.value;
    const hora = document.getElementById('act-hora')?.value;
    const nota = document.getElementById('act-nota')?.value;
    if (!fecha) return alert('Selecciona fecha');
    try {
      await API.post(`/personas/${personaId}/notas`, { texto: `📅 ${tipo==='call'?'Llamada':tipo==='email'?'Email':'Reunión'} programada: ${fecha} ${hora||''}\n${nota||''}` });
      document.querySelector('div[style*="fixed"]')?.remove();
      if (this._fichaPersona) this.showFicha(personaId);
    } catch(e) { alert('Error: '+e.message); }
  },

  renderTab(tab, p) {
    const content = document.getElementById('persona-tab-content');

    // Tab Calculadora → iframe interno
    if (tab === 'calculadora') {
      const activeDeal = (p.deals||[]).find(d=>d.estado==='en_tramite') || (p.deals||[])[0];
      const dealParam = activeDeal?.pipedrive_deal_id ? '?deal_id='+activeDeal.pipedrive_deal_id : '';
      content.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
          <span style="font-size:15px;font-weight:700;">Calculadora ADESLAS</span>
          <button onclick="PersonasModule.renderTab('grabaciones',PersonasModule._fichaPersona)" style="margin-left:auto;padding:6px 12px;border-radius:8px;border:1px solid #e8edf2;background:#fff;color:#475569;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit">← Volver al contacto</button>
        </div>
        <iframe src="/calculadora/index.html${dealParam}" style="width:100%;height:calc(100vh - 240px);border:1px solid #e8edf2;border-radius:12px;"></iframe>`;
      return;
    }

    if (tab === 'grabaciones') {
      this.renderTabGrabaciones(content, p);
      return;
    } else if (tab === 'polizas') {
      const polizas = (p.deals || []).filter(d => d.estado === 'poliza_activa');
      if (polizas.length === 0) {
        content.innerHTML = '<p class="text-light">Sin pólizas activas</p>';
        return;
      }
      content.innerHTML = `
        <table>
          <thead><tr><th>Póliza</th><th>Producto</th><th>Compañía</th><th>Prima</th><th>Fecha efecto</th><th>Agente</th></tr></thead>
          <tbody>
            ${polizas.map(d => `
              <tr>
                <td><strong>${d.poliza || '—'}</strong></td>
                <td>${this._esc(d.producto || '—')}</td>
                <td>${d.datos_extra?.etiqueta || d.compania || '—'}</td>
                <td>${d.prima ? d.prima.toLocaleString('es-ES', {style:'currency',currency:'EUR'}) : '—'}</td>
                <td>${d.fecha_efecto ? new Date(d.fecha_efecto).toLocaleDateString('es-ES') : '—'}</td>
                <td>${d.agente_nombre || d.pipedrive_owner || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (tab === 'deals') {
      const deals = (p.deals || []).filter(d => d.estado === 'en_tramite');
      if (deals.length === 0) {
        content.innerHTML = '<p class="text-light">Sin oportunidades abiertas</p>';
        return;
      }
      content.innerHTML = `
        <table>
          <thead><tr><th>Deal</th><th>Producto</th><th>Etapa</th><th>Valor</th><th>Fecha</th></tr></thead>
          <tbody>
            ${deals.map(d => `
              <tr>
                <td><strong>${d.poliza || d.pipedrive_id || '—'}</strong></td>
                <td>${this._esc(d.producto || '—')}</td>
                <td><span class="badge badge-supervisor">${d.pipedrive_stage || '—'}</span></td>
                <td>${d.prima ? d.prima.toLocaleString('es-ES', {style:'currency',currency:'EUR'}) : '—'}</td>
                <td>${d.created_at ? new Date(d.created_at).toLocaleDateString('es-ES') : '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (tab === 'tramites') {
      const tickets = p.tickets || [];
      if (tickets.length === 0) {
        content.innerHTML = '<p class="text-light">Sin trámites</p>';
        return;
      }
      content.innerHTML = `
        <table>
          <thead><tr><th>#</th><th>Tipo</th><th>Estado</th><th>Descripción</th><th>Fecha</th></tr></thead>
          <tbody>
            ${tickets.map(t => `
              <tr>
                <td>${t.id}</td>
                <td>${t.tipo_nombre || '—'}</td>
                <td>${this._estadoBadge(t.estado)}</td>
                <td>${this._esc((t.descripcion || '').substring(0, 60))}</td>
                <td>${new Date(t.created_at).toLocaleDateString('es-ES')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (tab === 'familiares') {
      const fams = p.familiares || [];
      content.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <h4 style="margin:0;">Familiares / Asegurados</h4>
          <button class="btn btn-primary btn-sm" id="btn-add-familiar">+ Añadir</button>
        </div>
        ${fams.length === 0 ? '<p class="text-light">Sin familiares vinculados</p>' : `
        <table>
          <thead><tr><th>Nombre</th><th>DNI</th><th>Parentesco</th><th>F. Nacimiento</th><th>Teléfono</th><th></th></tr></thead>
          <tbody>
            ${fams.map(f => `
              <tr>
                <td><strong>${this._esc(f.nombre)}</strong></td>
                <td>${f.dni || '—'}</td>
                <td>${f.parentesco || '—'}</td>
                <td>${f.fecha_nacimiento ? new Date(f.fecha_nacimiento).toLocaleDateString('es-ES') : '—'}</td>
                <td>${f.telefono || '—'}</td>
                <td><button class="btn btn-secondary btn-sm btn-danger-text" data-del-fam="${f.id}">Eliminar</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>`}
      `;

      document.getElementById('btn-add-familiar').addEventListener('click', () => this.showFamiliarForm(p.id));
      content.querySelectorAll('[data-del-fam]').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('¿Eliminar este familiar?')) return;
          await API.delete(`/personas/${p.id}/familiares/${btn.dataset.delFam}`);
          this.showFicha(p.id);
        });
      });
    } else if (tab === 'historial') {
      const otros = (p.deals || []).filter(d => !['poliza_activa', 'en_tramite'].includes(d.estado));
      if (otros.length === 0) {
        content.innerHTML = '<p class="text-light">Sin historial</p>';
        return;
      }
      content.innerHTML = `
        <table>
          <thead><tr><th>Deal</th><th>Producto</th><th>Estado</th><th>Valor</th><th>Fecha</th></tr></thead>
          <tbody>
            ${otros.map(d => `
              <tr style="opacity:0.7;">
                <td>${d.poliza || d.pipedrive_id || '—'}</td>
                <td>${this._esc(d.producto || '—')}</td>
                <td>${this._estadoBadge(d.estado)}</td>
                <td>${d.prima ? d.prima.toLocaleString('es-ES', {style:'currency',currency:'EUR'}) : '—'}</td>
                <td>${d.created_at ? new Date(d.created_at).toLocaleDateString('es-ES') : '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (tab === 'notas') {
      const notas = p.notas || [];
      content.innerHTML = `
        <div style="margin-bottom:12px;">
          <textarea class="form-control" id="new-nota" rows="2" placeholder="Escribe una nota..."></textarea>
          <button class="btn btn-primary btn-sm" id="btn-add-nota" style="margin-top:8px;">Añadir nota</button>
        </div>
        <div id="notas-list">
          ${notas.length === 0 ? '<p class="text-light">Sin notas</p>' : notas.map(n => `
            <div class="comment" style="margin-bottom:8px;">
              <div class="comment-header">
                <strong>${n.user_nombre || 'Sistema'}</strong>
                <span class="text-light">${new Date(n.created_at).toLocaleString('es-ES')}</span>
              </div>
              <div class="comment-body">${this._esc(n.texto)}</div>
            </div>
          `).join('')}
        </div>
      `;

      document.getElementById('btn-add-nota').addEventListener('click', async () => {
        const input = document.getElementById('new-nota');
        const texto = input.value.trim();
        if (!texto) return;
        await API.post(`/personas/${p.id}/notas`, { texto });
        this.showFicha(p.id);
      });
    }
  },

  // === TAB GRABACIONES (pólizas del CRM) ===
  async renderTabGrabaciones(content, p) {
    content.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h3 style="font-weight:700;font-size:16px;">Pólizas grabadas</h3>
        <a href="/grabaciones/?persona_id=${p.id}" target="_blank" class="btn btn-primary btn-sm" style="text-decoration:none;">+ Grabar póliza</a>
      </div>
      <div id="grabaciones-list"><p class="text-light">Cargando...</p></div>
    `;

    try {
      const polizas = await API.get('/grabaciones/polizas/persona/' + p.id);
      const listEl = document.getElementById('grabaciones-list');

      if (!polizas || polizas.length === 0) {
        listEl.innerHTML = '<p class="text-light">Sin pólizas grabadas en el CRM. Usa "Grabar póliza" para registrar una.</p>';
        return;
      }

      const estadoColors = {
        grabado: '#f59e0b', solicitud_enviada: '#3b82f6', aceptado: '#10b981',
        poliza_emitida: '#059669', rechazado: '#ef4444', baja: '#6b7280', impago: '#dc2626'
      };
      const estadoLabels = {
        grabado: 'Grabado', solicitud_enviada: 'Solicitud enviada', aceptado: 'Aceptado',
        poliza_emitida: 'Póliza emitida', rechazado: 'Rechazado', baja: 'Baja', impago: 'Impago'
      };

      listEl.innerHTML = `
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Estado</th>
                <th>Prima</th>
                <th>Nº Póliza</th>
                <th>Fecha efecto</th>
                <th>Agente</th>
                <th>Fecha grabación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${polizas.map(pol => `
                <tr>
                  <td><strong>${this._esc(pol.producto || '—')}</strong><br><span class="text-light" style="font-size:11px;">${pol.compania || ''}</span></td>
                  <td>
                    <span class="badge" style="background:${estadoColors[pol.estado] || '#6b7280'};color:#fff;font-size:11px;">
                      ${estadoLabels[pol.estado] || pol.estado}
                    </span>
                  </td>
                  <td>${pol.prima_mensual ? parseFloat(pol.prima_mensual).toFixed(2) + ' €/mes' : '—'}</td>
                  <td>${pol.n_poliza || '—'}</td>
                  <td>${pol.fecha_efecto ? new Date(pol.fecha_efecto).toLocaleDateString('es-ES') : '—'}</td>
                  <td>${pol.agente_nombre || '—'}</td>
                  <td>${pol.created_at ? new Date(pol.created_at).toLocaleDateString('es-ES') : '—'}</td>
                  <td>
                    <select onchange="PersonasModule.cambiarEstadoPoliza(${pol.id}, this.value)" style="font-size:12px;padding:4px;border-radius:8px;border:1px solid #ddd;">
                      ${['grabado','solicitud_enviada','aceptado','poliza_emitida','rechazado','baja','impago'].map(e =>
                        `<option value="${e}" ${pol.estado === e ? 'selected' : ''}>${estadoLabels[e]}</option>`
                      ).join('')}
                    </select>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      document.getElementById('grabaciones-list').innerHTML =
        `<p style="color:#c62828;">${err.message}</p>`;
    }
  },

  async cambiarEstadoPoliza(polizaId, nuevoEstado) {
    try {
      await API.patch('/grabaciones/polizas/' + polizaId + '/estado', { estado: nuevoEstado });
    } catch (err) {
      alert('Error: ' + err.message);
    }
  },

  // === FORMULARIOS ===
  showPersonaForm(existing) {
    const prev = document.getElementById('modal-persona');
    if (prev) prev.remove();

    const isEdit = !!existing;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-persona';
    overlay.innerHTML = `
      <div class="modal" style="max-width:560px;">
        <h2 class="modal-title">${isEdit ? 'Editar persona' : 'Nueva persona'}</h2>
        <div id="persona-form-error" class="login-error"></div>
        <form id="form-persona">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Nombre completo</label>
              <input type="text" class="form-control" name="nombre" value="${isEdit ? this._esc(existing.nombre || '') : ''}" required>
            </div>
            <div class="form-group">
              <label>DNI/NIF</label>
              <input type="text" class="form-control" name="dni" value="${isEdit ? (existing.dni || '') : ''}" placeholder="12345678A">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Teléfono</label>
              <input type="tel" class="form-control" name="telefono" value="${isEdit ? (existing.telefono || '') : ''}">
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" class="form-control" name="email" value="${isEdit ? (existing.email || '') : ''}">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Fecha nacimiento</label>
              <input type="date" class="form-control" name="fecha_nacimiento" value="${isEdit && existing.fecha_nacimiento ? existing.fecha_nacimiento.substring(0, 10) : ''}">
            </div>
            <div class="form-group">
              <label>Nacionalidad</label>
              <input type="text" class="form-control" name="nacionalidad" value="${isEdit ? (existing.nacionalidad || '') : ''}">
            </div>
          </div>
          <div class="form-group">
            <label>Dirección</label>
            <input type="text" class="form-control" name="direccion" value="${isEdit ? this._esc(existing.direccion || '') : ''}">
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
            <button type="submit" class="btn btn-primary">${isEdit ? 'Guardar' : 'Crear persona'}</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    document.getElementById('form-persona').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const errEl = document.getElementById('persona-form-error');
      errEl.style.display = 'none';

      const body = {
        nombre: form.nombre.value.trim(),
        dni: form.dni.value.trim() || null,
        telefono: form.telefono.value.trim() || null,
        email: form.email.value.trim() || null,
        fecha_nacimiento: form.fecha_nacimiento.value || null,
        nacionalidad: form.nacionalidad.value.trim() || null,
        direccion: form.direccion.value.trim() || null,
      };

      try {
        if (isEdit) {
          await API.patch(`/personas/${existing.id}`, body);
          overlay.remove();
          this.showFicha(existing.id);
        } else {
          const created = await API.post('/personas', body);
          overlay.remove();
          this.showFicha(created.id);
        }
      } catch (err) {
        errEl.textContent = err.message;
        errEl.style.display = 'block';
      }
    });
  },

  showFamiliarForm(personaId) {
    const prev = document.getElementById('modal-persona');
    if (prev) prev.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-persona';
    overlay.innerHTML = `
      <div class="modal">
        <h2 class="modal-title">Añadir familiar</h2>
        <form id="form-familiar">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Nombre</label>
              <input type="text" class="form-control" name="nombre" required>
            </div>
            <div class="form-group">
              <label>DNI</label>
              <input type="text" class="form-control" name="dni">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Parentesco</label>
              <select class="form-control" name="parentesco">
                <option value="">Seleccionar</option>
                <option value="Cónyuge">Cónyuge</option>
                <option value="Hijo/a">Hijo/a</option>
                <option value="Hermano/a">Hermano/a</option>
                <option value="Padre/Madre">Padre/Madre</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div class="form-group">
              <label>Fecha nacimiento</label>
              <input type="date" class="form-control" name="fecha_nacimiento">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Teléfono</label>
              <input type="tel" class="form-control" name="telefono">
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" class="form-control" name="email">
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
            <button type="submit" class="btn btn-primary">Añadir</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    document.getElementById('form-familiar').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      await API.post(`/personas/${personaId}/familiares`, {
        nombre: form.nombre.value,
        dni: form.dni.value || null,
        parentesco: form.parentesco.value || null,
        fecha_nacimiento: form.fecha_nacimiento.value || null,
        telefono: form.telefono.value || null,
        email: form.email.value || null,
      });
      overlay.remove();
      this.showFicha(personaId);
    });
  },

  // Helpers
  _esc(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  },

  _estadoBadge(estado) {
    const colors = {
      poliza_activa: '#2e7d32', en_tramite: '#1565c0', perdido: '#6b7280',
      nuevo: '#1565c0', en_gestion: '#e65100', esperando: '#f9a825',
      resuelto: '#2e7d32', cerrado: '#6b7280', eliminado: '#c62828',
    };
    const color = colors[estado] || '#6b7280';
    const label = (estado || '').replace(/_/g, ' ');
    return `<span class="badge" style="background:${color}20;color:${color};">${label}</span>`;
  },
};
