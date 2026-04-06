// === Módulo Personas / Clientes ===

// Iconos SVG Gestavly (avants_icons_v2)
const _ICO = {
  volver: (s=16,c='currentColor') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 5l-7 7 7 7"/></svg>`,
  llamada: (s=16,c='currentColor') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z"/></svg>`,
  whatsapp: (s=16,c='currentColor') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"/></svg>`,
  email: (s=16,c='currentColor') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M2 8l10 7 10-7"/></svg>`,
  editar: (s=16,c='currentColor') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>`,
  agendar: (s=16,c='currentColor') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M8 14h1.5l1 2 2-4 1 2H15"/></svg>`,
  grabar: (s=16,c='currentColor') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="3" width="8" height="14" rx="4"/><path d="M5 10a7 7 0 0 0 14 0"/><path d="M12 17v4"/><path d="M9 21h6"/></svg>`,
  historial: (s=16,c='currentColor') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/><path d="M3.5 8.5A9 9 0 0 1 12 3"/></svg>`,
  propuesta: (s=16,c='currentColor') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 12h6M9 15h6M9 9h2"/></svg>`,
  polizas: (s=16,c='currentColor') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3L4 7v6c0 4.4 3.4 8.5 8 9.5 4.6-1 8-5.1 8-9.5V7z"/><path d="M9 12l2 2 4-4"/></svg>`,
  tramites: (s=16,c='currentColor') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 12h6M9 15h4"/><circle cx="17" cy="17" r="3" fill="white" stroke="currentColor"/><path d="M17 15.5v1.5l1 1"/></svg>`,
  nota: (s=16,c='currentColor') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>`,
  añadir: (s=16,c='currentColor') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>`,
  guardar: (s=16,c='currentColor') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/></svg>`,
  cierre: (s=16,c='currentColor') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="${c}"/></svg>`,
  seguimiento: (s=16,c='currentColor') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`,
  gestion: (s=16,c='currentColor') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1.5"/><path d="M9 12h6M9 15h4"/></svg>`,
  agenda: (s=16,c='currentColor') => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18"/><path d="M8 3v4M16 3v4"/><circle cx="8" cy="15" r="1" fill="${c}"/><circle cx="12" cy="15" r="1" fill="${c}"/><circle cx="16" cy="15" r="1" fill="${c}"/></svg>`,
};

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
          <select class="form-control filter-select" id="filter-etiqueta" style="max-width:180px;">
            <option value="">Etiqueta</option>
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

    document.getElementById('filter-etiqueta').addEventListener('change', (e) => {
      this.filters.etiqueta_id = e.target.value;
      this.currentPage = 1;
      this.loadPersonas();
    });

    // Cargar etiquetas para el filtro
    try {
      const etqs = await API.get('/etiquetas');
      const sel = document.getElementById('filter-etiqueta');
      etqs.forEach(e => {
        const opt = document.createElement('option');
        opt.value = e.id;
        opt.textContent = e.nombre;
        sel.appendChild(opt);
      });
    } catch {}

    document.getElementById('btn-new-persona')?.addEventListener('click', () => this.showPersonaForm(null));

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
      if (this.filters.etiqueta_id) query += `&etiqueta_id=${this.filters.etiqueta_id}`;

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
          <td><strong>${this._esc(p.nombre || '')}</strong> <span style="font-size:10px;color:#94a3b8">#${p.pipedrive_person_id || p.id}</span></td>
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

  // Card visual para propuestas/grabaciones en el historial
  _renderNotaPropuesta(n, txt) {
    if (!n || !txt) return '';
    const fecha = new Date(n.created_at).toLocaleString('es-ES');
    const esGrabacion = txt.includes('GRABACIÓN PÓLIZA');

    // Parsear datos de la nota
    const extractLine = (prefix) => {
      const regex = new RegExp(prefix + '\\s*:?\\s*(.+)', 'i');
      const m = txt.match(regex);
      return m ? (m[1] || '').trim() : '';
    };

    const producto = extractLine('Producto|POLIZA|Tipo') || extractLine('OPCIÓN 1');
    const precio = extractLine('Precio|Prima mensual|PRECIO');
    const puntos = extractLine('TOTAL.*pts|Puntos') || '';
    const puntosNum = parseInt((puntos.match(/[\d.]+/) || ['0'])[0].replace('.', ''));

    // Regalos por puntos
    let regalo = '';
    if (puntosNum >= 6000) regalo = '🎁 Aspirador Dyson V8';
    else if (puntosNum >= 4000) regalo = '🎁 Apple Watch SE';
    else if (puntosNum >= 3000) regalo = '🎁 AirPods Pro';
    else if (puntosNum >= 2000) regalo = '🎁 Tarjeta Amazon 50€';
    else if (puntosNum >= 1000) regalo = '🎁 Tarjeta Amazon 25€';

    // Extraer asegurados (buscar líneas numeradas tipo "1. NOMBRE")
    const asegLines = txt.match(/\d+\.\s+[A-ZÁÉÍÓÚÑ][\w\s]+/g) || [];

    return `<div style="background:#fff;border:1px solid #e8edf2;border-radius:16px;overflow:hidden;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,.06);cursor:pointer;" onclick="const d=document.getElementById('prop-detail-${n.id}');if(d){d.style.display=d.style.display==='none'?'block':'none';this.querySelector('.prop-arrow').textContent=d.style.display==='none'?'▾':'▴';}">
      <!-- Header -->
      <div style="background:${esGrabacion?'linear-gradient(135deg,#ef4444,#dc2626)':'linear-gradient(135deg,#009DDD,#0088c2)'};padding:14px 18px;display:flex;align-items:center;gap:10px;">
        <div style="width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;">
          ${esGrabacion?'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>':'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/></svg>'}
        </div>
        <div style="flex:1;">
          <div style="font-size:14px;font-weight:800;color:#fff;">${esGrabacion?'Grabación de Póliza':'Presupuesto ADESLAS'}</div>
          <div style="font-size:11px;color:rgba(255,255,255,.8);">${n.user_nombre||''} · ${fecha}</div>
        </div>
        ${producto?`<div style="background:rgba(255,255,255,.2);padding:4px 10px;border-radius:20px;font-size:11px;font-weight:700;color:#fff;">${this._esc(producto.substring(0,30))}</div>`:''}
        <span class="prop-arrow" style="color:rgba(255,255,255,.8);font-size:14px;">▾</span>
      </div>
      <!-- Body -->
      <div id="prop-detail-${n.id}" style="display:none;padding:14px 18px;border-top:1px solid #e8edf2;cursor:default;" onclick="event.stopPropagation()">
        ${asegLines.length>0?`<div style="margin-bottom:10px;">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8;letter-spacing:.8px;margin-bottom:6px;">Asegurados (${asegLines.length})</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${asegLines.slice(0,6).map((a,i)=>{const name=a.replace(/^\d+\.\s+/,'').split(' - ')[0].trim();return`<div style="display:flex;align-items:center;gap:5px;background:#f4f6f9;border-radius:8px;padding:4px 8px;font-size:11px;"><div style="width:20px;height:20px;border-radius:50%;background:hsl(${this._hu(i)},55%,55%);color:#fff;display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:700">${this._ini(name)}</div><span style="font-weight:600">${this._esc(name.substring(0,20))}</span></div>`;}).join('')}
          </div>
        </div>`:''}
        ${precio?`<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-top:1px solid #f0f0f0;border-bottom:1px solid #f0f0f0;">
          <span style="font-size:13px;color:#475569;">Total mensual</span>
          <span style="font-size:20px;font-weight:800;color:var(--accent);">${this._esc(precio.substring(0,20))}</span>
        </div>`:''}
        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
          ${puntosNum>0?`<div style="background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:5px 12px;border-radius:20px;font-size:11px;font-weight:700;">Pts: ${puntosNum.toLocaleString('es-ES')}</div>`:''}
          ${regalo?`<div style="background:#ecfdf5;color:#10b981;padding:5px 12px;border-radius:20px;font-size:11px;font-weight:700;">${regalo}</div>`:''}
        </div>
      </div>
    </div>`;
  },

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
              ${_ICO.volver(14,'#94a3b8')} Contactos
            </button>
            <div style="font-size:22px;font-weight:800;flex:1;">
              ${this._esc(p.nombre || 'Sin nombre')}
              <span style="font-size:12px;font-weight:600;color:#94a3b8;margin-left:8px;">#${p.pipedrive_person_id || p.id}</span>
            </div>
            <!-- Comunicación: Llamar + WhatsApp + Email -->
            <div style="display:flex;gap:6px;">
              ${p.telefono ? `<button id="btn-llamar-ct" onclick="PersonasModule._clickToCall('${p.telefono}',${p.id},'${(p.nombre||'').replace(/'/g,'')}')" style="padding:7px 12px;border-radius:8px;border:none;background:#10b981;color:#fff;cursor:pointer;font-size:12px;font-weight:700;font-family:inherit;display:flex;align-items:center;gap:5px" title="Llamar">${_ICO.llamada(16,'#fff')} Llamar</button>` : ''}
              ${p.telefono ? `<button onclick="abrirModalWhatsApp(${p.id}, '${(p.nombre||'').replace(/'/g,"\\'")}', '${p.telefono}')" style="padding:7px 12px;border-radius:8px;border:none;background:#25d366;color:#fff;cursor:pointer;font-size:12px;font-weight:700;font-family:inherit;display:flex;align-items:center;gap:5px" title="WhatsApp">${_ICO.whatsapp(16,'#fff')} WhatsApp</button>` : ''}
              ${p.email ? `<button onclick="window.open('mailto:${p.email}')" style="padding:7px 12px;border-radius:8px;border:1px solid #e8edf2;background:#fff;color:#475569;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit;display:flex;align-items:center;gap:5px" title="Email">${_ICO.email(16,'#475569')} Email</button>` : ''}
            </div>
            <div style="width:1px;height:24px;background:#e8edf2"></div>
            <button id="btn-edit-persona" style="padding:6px 12px;border-radius:8px;border:1px solid #e8edf2;background:#fff;font-size:12px;font-weight:600;color:#475569;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:5px">${_ICO.editar(14,'#475569')} Editar</button>
            ${p.pipedrive_person_id ? `<a href="https://avantssl.pipedrive.com/person/${p.pipedrive_person_id}" target="_blank" style="padding:6px 12px;border-radius:8px;border:1px solid #e8edf2;font-size:12px;font-weight:600;color:#94a3b8;text-decoration:none">Pipedrive ↗</a>` : ''}
            <button style="padding:7px 16px;border-radius:8px;border:none;background:#10b981;color:#fff;cursor:pointer;font-size:12px;font-weight:700;font-family:inherit">✓ Ganado</button>
            <button style="padding:7px 16px;border-radius:8px;border:1px solid #ef4444;background:#fff;color:#ef4444;cursor:pointer;font-size:12px;font-weight:700;font-family:inherit">✕ Perdido</button>
          </div>
          ${pipelineName ? `<div style="font-size:11px;color:#94a3b8;margin-bottom:8px">PIPELINE → <strong style="color:var(--accent)">${this._esc(pipelineName)}</strong></div>` : ''}

          <!-- Etiquetas -->
          <div id="persona-etiquetas" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;">
            ${(p.etiquetas || []).map(e => `
              <span class="etiqueta-chip" data-id="${e.id}" style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;color:#fff;background:${e.color || '#009DDD'};cursor:default;">
                ${this._esc(e.nombre)}
                <span class="etiqueta-remove" data-id="${e.id}" style="cursor:pointer;opacity:.7;font-size:13px;margin-left:2px;" title="Quitar">&times;</span>
              </span>
            `).join('')}
            <button id="btn-add-etiqueta" style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;color:#009DDD;background:#e6f6fd;border:1px dashed #009DDD;cursor:pointer;font-family:inherit;">+ Etiqueta</button>
          </div>

          <!-- TABS + Acciones derecha -->
          <div style="display:flex;gap:2px;border-top:1px solid #e8edf2;" id="persona-tabs">
            <button class="tab-btn active" data-tab="historial" style="${ts}">${_ICO.historial(14)} Historial</button>
            <button class="tab-btn" data-tab="propuestas" style="${ts}">${_ICO.propuesta(14)} Propuestas</button>
            <button class="tab-btn" data-tab="polizas" style="${ts}">${_ICO.polizas(14)} Pólizas</button>
            <button class="tab-btn" data-tab="tramites" style="${ts}">${_ICO.tramites(14)} Trámites (${tickets.length})</button>
            <button class="tab-btn" data-tab="notas" style="${ts}">${_ICO.nota(14)} Notas (${notas.length})</button>
            <button class="tab-btn" data-tab="documentos" style="${ts}">${_ICO.propuesta(14)} Documentos</button>
            <button class="tab-btn" data-tab="calculadora" style="${ts}">${typeof Icons !== 'undefined' ? Icons.calculadora(14) : ''} Calculadora</button>
            <div style="flex:1"></div>
            <div style="display:flex;gap:6px;align-items:center;padding:4px 0;">
              <button onclick="PersonasModule._showAddActivity(${p.id})" style="padding:7px 12px;border-radius:8px;border:1px solid #e8edf2;background:#fff;color:#475569;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit;display:flex;align-items:center;gap:5px">${_ICO.agendar(16,'#475569')} Actividad</button>
              <button onclick="PersonasModule._openGrabarInline()" style="padding:7px 12px;border-radius:8px;border:none;background:#ef4444;color:#fff;cursor:pointer;font-size:12px;font-weight:700;font-family:inherit;display:flex;align-items:center;gap:5px">${_ICO.grabar(16,'#fff')} Grabar</button>
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
              ${[['DNI',p.dni],['Teléfono',p.telefono],['Email',p.email],['F. Nacimiento',p.fecha_nacimiento?new Date(p.fecha_nacimiento).toLocaleDateString('es-ES'):null],['Sexo',p.sexo==='H'?'Hombre':p.sexo==='M'?'Mujer':p.sexo],['Dirección',p.direccion],['CP',p.codigo_postal],['Provincia',p.provincia],['Localidad',p.localidad],['Nacionalidad',p.nacionalidad],['Creado',p.created_at?new Date(p.created_at).toLocaleDateString('es-ES'):null]].map(([l,v])=>`<div style="display:flex;gap:8px;margin-bottom:8px"><div style="font-size:11px;font-weight:600;color:#94a3b8;min-width:85px;text-transform:uppercase;letter-spacing:.3px">${l}</div><div style="font-size:13px;color:#0f172a;font-weight:500;flex:1;word-break:break-word">${this._esc(v||'—')}</div></div>`).join('')}
            </div>

            <!-- Asegurados/Familiares -->
            <div style="border-bottom:1px solid #e8edf2;padding:16px 18px;">
              ${(() => {
                // Combinar familiares legacy + asegurados tabla nueva (sin duplicar por nombre)
                const aseguradosBD = (p.asegurados || []).filter(a => a.parentesco !== 'Titular');
                const nombresAseg = new Set(aseguradosBD.map(a => a.nombre?.toUpperCase()));
                const familiaresUnicos = familiares.filter(f => !nombresAseg.has(f.nombre?.toUpperCase()));
                const todos = [...aseguradosBD, ...familiaresUnicos];
                return `
                  <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#94a3b8;margin-bottom:12px">Asegurados (${todos.length})</div>
                  ${todos.length===0?'<div style="font-size:13px;color:#94a3b8">Sin asegurados registrados</div>':''}
                  ${todos.map(f=>`<div style="background:#f4f6f9;border-radius:10px;padding:10px 12px;margin-bottom:8px">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
                      <div style="width:24px;height:24px;border-radius:50%;background:hsl(${this._hu(f.id||0)},55%,55%);display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;color:#fff">${this._ini(f.nombre)}</div>
                      <div style="font-size:12px;font-weight:700;flex:1">${this._esc(f.nombre||'')}</div>
                      <span style="font-size:9px;font-weight:700;padding:2px 6px;border-radius:4px;background:#e6f5fc;color:var(--accent)">${f.parentesco||'Familiar'}</span>
                    </div>
                    <div style="font-size:11px;color:#94a3b8;display:flex;gap:10px">
                      ${(f.fecha_nacimiento||f.fecha_nac)?`<span>${new Date(f.fecha_nacimiento||f.fecha_nac).toLocaleDateString('es-ES')}</span>`:''}
                      ${f.sexo?`<span>${f.sexo==='H'?'Hombre':'Mujer'}</span>`:''}
                      ${f.dni?`<span>${f.dni}</span>`:''}
                    </div>
                  </div>`).join('')}
                `;
              })()}
            </div>

            <!-- Seguros actuales -->
            <div style="border-bottom:1px solid #e8edf2;padding:16px 18px;">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#94a3b8;margin-bottom:12px">Seguros actuales (${polizasActivas.length})</div>
              ${polizasActivas.length===0?'<div style="font-size:13px;color:#94a3b8">Sin pólizas activas</div>':''}
              ${polizasActivas.map((d,idx)=>`<div class="poliza-sidebar-item" style="padding:8px 0;border-bottom:1px solid #f0f0f0;cursor:pointer;" onclick="const det=document.getElementById('pol-det-${idx}');det.style.display=det.style.display==='none'?'block':'none';this.querySelector('.pol-arrow').textContent=det.style.display==='none'?'▸':'▾';">
                <div style="display:flex;align-items:center;gap:8px;">
                  <span style="display:flex;align-items:center">${_ICO.polizas(14,'#10b981')}</span>
                  <div style="flex:1;font-size:12px;font-weight:600;">${this._esc(d.tipo_poliza||d.producto||d.compania||'Póliza')}</div>
                  ${d.prima && d.prima <= 1000?`<span style="font-size:12px;font-weight:700;color:var(--accent);">${parseFloat(d.prima).toFixed(2)}€/mes</span>`:''}
                  <span class="pol-arrow" style="font-size:10px;color:#94a3b8;">▸</span>
                </div>
                <div id="pol-det-${idx}" style="display:none;margin-top:8px;padding-left:22px;font-size:11px;" onclick="event.stopPropagation();">
                  <div style="background:#f4f6f9;border-radius:8px;padding:10px;">
                    ${[
                      ['Tipo', d.tipo_poliza || d.producto],
                      ['Compañía', d.compania],
                      ['Prima/mes', d.prima && d.prima <= 1000 ? parseFloat(d.prima).toFixed(2) + ' €' : null],
                      ['Nº Póliza', d.poliza],
                      ['Nº Solicitud', d.num_solicitud],
                      ['Fecha efecto', d.fecha_efecto ? new Date(d.fecha_efecto).toLocaleDateString('es-ES') : null],
                      ['IBAN', d.iban],
                      ['Pipeline', d.pipeline_nombre],
                      ['Descuento', d.descuento],
                      ['Forma pago', d.frecuencia_pago],
                    ].filter(([,v]) => v).map(([l,v]) => `<div style="display:flex;gap:6px;margin-bottom:4px;"><span style="font-weight:600;color:#94a3b8;min-width:70px;">${l}</span><span style="color:#0f172a;font-weight:500;">${this._esc(String(v))}</span></div>`).join('')}
                  </div>
                </div>
              </div>`).join('')}
            </div>

            <!-- Oportunidades -->
            <div style="padding:16px 18px;">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#94a3b8;margin-bottom:12px">Deals (${(p.deals||[]).length})</div>
              ${(p.deals||[]).length===0?'<div style="font-size:13px;color:#94a3b8">Sin deals</div>':''}
              ${(p.deals||[]).map(d=>{
                const stCfg = d.pipedrive_status==='won' ? {bg:'#d1fae5',color:'#065f46',label:'Ganado'} : d.pipedrive_status==='lost' ? {bg:'#f1f5f9',color:'#94a3b8',label:'Perdido'} : {bg:'#e6f6fd',color:'#007ab8',label:'Activo'};
                const plColor = (d.pipeline_nombre||'').includes('DENTAL')?'#10b981':(d.pipeline_nombre||'').includes('MASCOT')?'#f59e0b':(d.pipeline_nombre||'').includes('DECES')?'#94a3b8':'#009DDD';
                return `<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #f0f0f0;cursor:pointer;${d.pipedrive_status==='lost'?'opacity:.6;':''}" onclick="PersonasModule._openDealDrawer(${d.id})" title="Ver detalle del deal">
                <span style="display:flex;align-items:center">${_ICO.cierre(14,stCfg.color)}</span>
                <div style="flex:1;min-width:0;">
                  <div style="font-size:12px;font-weight:600;${d.pipedrive_status==='lost'?'text-decoration:line-through;':''}">${this._esc(d.producto||d.compania||'Deal')}</div>
                  <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:2px;">
                    ${d.pipeline_nombre?`<span style="font-size:9px;font-weight:700;padding:1px 6px;border-radius:10px;background:${plColor}15;color:${plColor};">${d.pipeline_nombre}</span>`:''}
                    <span style="font-size:9px;font-weight:700;padding:1px 6px;border-radius:10px;background:${stCfg.bg};color:${stCfg.color};">${stCfg.label}</span>
                    ${d.etapa_nombre?`<span style="font-size:9px;color:#94a3b8;">${d.etapa_nombre}</span>`:''}
                  </div>
                </div>
                ${d.prima?`<div style="font-size:12px;font-weight:700;color:var(--accent)">${d.prima}€</div>`:''}
              </div>`;}).join('')}
            </div>
          </div>

          <!-- PANEL CENTRO -->
          <div style="flex:1;overflow-y:auto;padding:20px 24px;min-width:0;" id="persona-tab-content"></div>

        </div>
      </div>

      <!-- CSS timeline + responsive -->
      <style>
        .tl-wrap{padding-left:8px;}
        .tl-item{display:flex;gap:12px;margin-bottom:0;position:relative;}
        .tl-line{display:flex;flex-direction:column;align-items:center;flex-shrink:0;width:28px;}
        .tl-dot{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;z-index:1;}
        .tl-item:not(:last-child) .tl-line::after{content:'';flex:1;width:2px;background:#e8edf2;margin:4px 0;}
        .tl-card{flex:1;min-width:0;padding-bottom:12px;}
        .tl-card-head{display:flex;align-items:center;gap:8px;margin-bottom:4px;}
        .tl-card-label{font-size:11px;font-weight:700;}
        .tl-card-time{font-size:10px;color:#94a3b8;margin-left:auto;}
        .tl-card-body{background:#fff;border:1px solid #e8edf2;border-radius:8px;padding:10px 12px;}
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

    // Etiquetas — quitar
    document.querySelectorAll('.etiqueta-remove').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const etqId = btn.dataset.id;
        try {
          await API.delete(`/etiquetas/persona/${p.id}/${etqId}`);
          btn.closest('.etiqueta-chip').remove();
        } catch {}
      });
    });

    // Etiquetas — añadir
    document.getElementById('btn-add-etiqueta')?.addEventListener('click', async () => {
      try {
        const allEtiquetas = await API.get('/etiquetas');
        const current = (p.etiquetas || []).map(e => e.id);
        const available = allEtiquetas.filter(e => !current.includes(e.id));

        // Dropdown simple
        const btn = document.getElementById('btn-add-etiqueta');
        let dd = document.getElementById('etiqueta-dropdown');
        if (dd) { dd.remove(); return; }

        dd = document.createElement('div');
        dd.id = 'etiqueta-dropdown';
        dd.style.cssText = 'position:absolute;background:#fff;border:1px solid #e8edf2;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.12);padding:8px;z-index:100;max-height:200px;overflow-y:auto;min-width:180px;';
        dd.innerHTML = `
          <input type="text" id="etiqueta-new-input" placeholder="Nueva etiqueta..." style="width:100%;padding:6px 8px;border:1px solid #e8edf2;border-radius:6px;font-size:12px;font-family:inherit;margin-bottom:6px;box-sizing:border-box;">
          ${available.map(e => `<div class="etq-option" data-id="${e.id}" style="padding:6px 8px;cursor:pointer;font-size:12px;border-radius:4px;display:flex;align-items:center;gap:6px;">
            <span style="width:10px;height:10px;border-radius:50%;background:${e.color}"></span> ${e.nombre}
          </div>`).join('')}
        `;
        btn.parentElement.style.position = 'relative';
        btn.parentElement.appendChild(dd);

        // Seleccionar existente
        dd.querySelectorAll('.etq-option').forEach(opt => {
          opt.addEventListener('click', async () => {
            const etqId = opt.dataset.id;
            await API.post(`/etiquetas/persona/${p.id}`, { etiqueta_id: parseInt(etqId) });
            dd.remove();
            this.showFicha(p.id); // Recargar ficha
          });
        });

        // Crear nueva
        dd.querySelector('#etiqueta-new-input').addEventListener('keydown', async (e) => {
          if (e.key === 'Enter' && e.target.value.trim()) {
            const newEtq = await API.post('/etiquetas', { nombre: e.target.value.trim() });
            await API.post(`/etiquetas/persona/${p.id}`, { etiqueta_id: newEtq.id });
            dd.remove();
            this.showFicha(p.id);
          }
        });

        // Cerrar al hacer click fuera
        setTimeout(() => {
          document.addEventListener('click', function closeDD(ev) {
            if (!dd.contains(ev.target) && ev.target !== btn) {
              dd.remove();
              document.removeEventListener('click', closeDD);
            }
          });
        }, 10);
      } catch (err) {
        console.error('Error cargando etiquetas:', err);
      }
    });

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

    this.renderTab('historial', p);
  },

  // Popup actividad con calendario (estilo mockup_popup_postllamada)
  _showAddActivity(personaId) {
    const p = this._fichaPersona;
    const nombre = p?.nombre || 'Contacto';
    const DAYS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    let currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 1); // Mañana por defecto
    let selectedTipo = 'llamada';
    let selectedSlot = null;

    // Horas 09:00-19:30
    const HORAS = [];
    for (let h=9;h<=19;h++) { HORAS.push(`${String(h).padStart(2,'0')}:00`); HORAS.push(`${String(h).padStart(2,'0')}:30`); }

    const tipoConfig = {
      llamada: { label: 'Llamada', ico: _ICO.llamada(20,'#3b82f6'), color: '#3b82f6', bg: '#eff6ff' },
      cierre: { label: 'Cierre', ico: _ICO.cierre(20,'#10b981'), color: '#10b981', bg: '#ecfdf5' },
      seguimiento: { label: 'Seguimiento', ico: _ICO.seguimiento(20,'#f59e0b'), color: '#f59e0b', bg: '#fffbeb' },
      gestion: { label: 'Gestión', ico: _ICO.gestion(20,'#475569'), color: '#475569', bg: '#f4f6f9' },
    };

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.5);display:flex;align-items:center;justify-content:center;z-index:400;padding:20px;';
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    const popup = document.createElement('div');
    popup.style.cssText = 'background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.16);width:820px;max-height:92vh;display:flex;flex-direction:column;overflow:hidden;';

    const renderCal = () => {
      const d = currentDate;
      const dateStr = `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
      const calDate = popup.querySelector('#act-cal-date');
      if (calDate) calDate.textContent = dateStr;

      const timesEl = popup.querySelector('#act-cal-times');
      const eventsEl = popup.querySelector('#act-cal-events');
      if (!timesEl || !eventsEl) return;

      timesEl.innerHTML = HORAS.map(h => `<div style="height:48px;display:flex;align-items:flex-start;justify-content:flex-end;padding-right:8px;padding-top:2px;font-size:10px;font-weight:600;color:#94a3b8;border-bottom:1px ${h.endsWith(':30')?'dashed rgba(232,237,242,.8)':'solid #e8edf2'};">${h.endsWith(':00')?h:''}</div>`).join('');

      eventsEl.innerHTML = HORAS.map(h => {
        const isSelected = selectedSlot && selectedSlot.hora === h;
        return `<div style="height:48px;border-bottom:1px ${h.endsWith(':30')?'dashed rgba(232,237,242,.8)':'solid #e8edf2'};display:flex;align-items:center;padding:2px 6px;gap:4px;" class="act-cal-row" data-hora="${h}">
          ${isSelected ? `<div style="height:40px;border-radius:7px;padding:4px 8px;background:#ecfdf5;border:2px solid #10b981;display:flex;flex-direction:column;justify-content:center;min-width:120px;"><div style="font-size:11px;font-weight:700;color:#10b981;">${this._esc(nombre.split(' ')[0])}</div><div style="font-size:10px;color:#94a3b8;">Nueva actividad</div></div>` : ''}
          <div class="act-add-slot" data-hora="${h}" style="height:40px;border-radius:7px;padding:4px 8px;border:1px dashed #d1d9e0;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:#94a3b8;min-width:80px;transition:all .12s;flex:1;">+ Agendar aquí</div>
        </div>`;
      }).join('');

      // Click en slots
      eventsEl.querySelectorAll('.act-add-slot').forEach(slot => {
        slot.addEventListener('mouseenter', () => { slot.style.borderColor = 'var(--accent)'; slot.style.color = 'var(--accent)'; slot.style.background = '#fff0f3'; });
        slot.addEventListener('mouseleave', () => { slot.style.borderColor = '#d1d9e0'; slot.style.color = '#94a3b8'; slot.style.background = ''; });
        slot.addEventListener('click', () => {
          selectedSlot = { hora: slot.dataset.hora };
          renderCal();
          // Actualizar resumen
          const resEl = popup.querySelector('#act-sel-resumen');
          const dStr = `${DAYS[d.getDay()]} ${d.getDate()}/${String(d.getMonth()+1).padStart(2,'0')} · ${slot.dataset.hora}`;
          if (resEl) { resEl.style.display = 'flex'; resEl.querySelector('.act-sel-hora').textContent = dStr; }
          const footerEl = popup.querySelector('#act-footer-info');
          if (footerEl) footerEl.textContent = `Actividad agendada: ${dStr}`;
        });
      });
    };

    popup.innerHTML = `
      <!-- HEADER -->
      <div style="padding:16px 20px;border-bottom:1px solid #e8edf2;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
        <div>
          <div style="font-size:15px;font-weight:800;display:flex;align-items:center;gap:8px;">${_ICO.agendar(20,'var(--accent)')} Nueva actividad</div>
          <div style="font-size:13px;color:#94a3b8;font-weight:500;">${this._esc(nombre)}</div>
        </div>
        <button onclick="this.closest('div[style*=fixed]').remove()" style="background:none;border:none;cursor:pointer;color:#94a3b8;font-size:22px;padding:2px 8px;border-radius:6px;line-height:1;">×</button>
      </div>

      <!-- BODY -->
      <div style="display:flex;flex:1;overflow:hidden;">
        <!-- IZQUIERDA -->
        <div style="width:300px;flex-shrink:0;border-right:1px solid #e8edf2;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:14px;">
          <div>
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:8px;">Tipo de actividad</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;" id="act-tipo-grid">
              ${Object.entries(tipoConfig).map(([key, cfg]) => `
                <button class="act-tipo-btn" data-tipo="${key}" style="display:flex;align-items:center;gap:7px;padding:9px 10px;border-radius:8px;border:1px solid ${selectedTipo===key?cfg.color:'#e8edf2'};background:${selectedTipo===key?cfg.bg:'#fff'};cursor:pointer;font-size:11px;font-weight:600;color:${selectedTipo===key?cfg.color:'#475569'};text-align:left;transition:all .12s;">
                  ${cfg.ico} ${cfg.label}
                </button>
              `).join('')}
            </div>
          </div>

          <div>
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:8px;">Nota rápida</div>
            <textarea id="act-nota" style="width:100%;padding:9px 11px;border:1px solid #e8edf2;border-radius:8px;font-size:12px;resize:none;outline:none;color:#0f172a;line-height:1.6;font-family:inherit;" rows="3" placeholder="Ej: Muy interesada, llamar jueves tarde..."></textarea>
          </div>

          <div id="act-sel-resumen" style="background:#ecfdf5;border:1px solid rgba(16,185,129,.3);border-radius:8px;padding:8px 10px;display:none;align-items:center;gap:8px;">
            <div style="flex:1;">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:2px;">Actividad agendada</div>
              <div class="act-sel-hora" style="font-size:13px;font-weight:800;color:#10b981;">—</div>
            </div>
            ${_ICO.agendar(20,'#10b981')}
          </div>
        </div>

        <!-- DERECHA — CALENDARIO -->
        <div style="flex:1;overflow:hidden;display:flex;flex-direction:column;">
          <div style="padding:14px 16px;border-bottom:1px solid #e8edf2;display:flex;align-items:center;gap:12px;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:8px;">
              <button class="act-cal-nav" data-dir="-1" style="background:none;border:1px solid #e8edf2;border-radius:7px;width:28px;height:28px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#475569;">‹</button>
              <div id="act-cal-date" style="font-size:14px;font-weight:700;min-width:200px;">—</div>
              <button class="act-cal-nav" data-dir="1" style="background:none;border:1px solid #e8edf2;border-radius:7px;width:28px;height:28px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#475569;">›</button>
            </div>
            <button id="act-cal-today" style="padding:5px 12px;border-radius:7px;border:1px solid #e8edf2;background:#fff;cursor:pointer;font-size:11px;font-weight:600;color:#475569;font-family:inherit;">Hoy</button>
          </div>
          <div style="flex:1;overflow-y:auto;" id="act-cal-body">
            <div style="display:flex;min-height:100%;">
              <div id="act-cal-times" style="width:52px;flex-shrink:0;"></div>
              <div id="act-cal-events" style="flex:1;"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- FOOTER -->
      <div style="padding:12px 20px;border-top:1px solid #e8edf2;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;background:#fff;">
        <div id="act-footer-info" style="font-size:12px;color:#94a3b8;">Selecciona una franja horaria para agendar</div>
        <div style="display:flex;gap:8px;">
          <button onclick="this.closest('div[style*=fixed]').remove()" style="padding:9px 16px;border-radius:9px;border:1px solid #e8edf2;background:#fff;cursor:pointer;font-size:13px;font-weight:600;color:#475569;font-family:inherit;display:flex;align-items:center;gap:5px;">${_ICO.volver(14,'#475569')} Cancelar</button>
          <button id="act-btn-save" style="padding:9px 24px;border-radius:9px;border:none;background:var(--accent);color:white;cursor:pointer;font-size:13px;font-weight:700;box-shadow:0 3px 12px rgba(255,74,110,.3);font-family:inherit;display:flex;align-items:center;gap:5px;">${_ICO.guardar(14,'#fff')} Guardar</button>
        </div>
      </div>
    `;

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    // Render calendario
    renderCal();

    // Event: tipo selección
    popup.querySelectorAll('.act-tipo-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedTipo = btn.dataset.tipo;
        const cfg = tipoConfig[selectedTipo];
        popup.querySelectorAll('.act-tipo-btn').forEach(b => {
          const bc = tipoConfig[b.dataset.tipo];
          const isActive = b.dataset.tipo === selectedTipo;
          b.style.borderColor = isActive ? bc.color : '#e8edf2';
          b.style.background = isActive ? bc.bg : '#fff';
          b.style.color = isActive ? bc.color : '#475569';
        });
      });
    });

    // Event: navegación días
    popup.querySelectorAll('.act-cal-nav').forEach(btn => {
      btn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + parseInt(btn.dataset.dir));
        selectedSlot = null;
        renderCal();
      });
    });
    popup.querySelector('#act-cal-today').addEventListener('click', () => {
      currentDate = new Date();
      selectedSlot = null;
      renderCal();
    });

    // Event: guardar — crear tarea real + nota informativa
    popup.querySelector('#act-btn-save').addEventListener('click', async () => {
      if (!selectedSlot) return alert('Selecciona una hora en el calendario');
      const cfg = tipoConfig[selectedTipo];
      const nota = popup.querySelector('#act-nota')?.value || '';
      const d = currentDate;
      const fechaStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      try {
        // Crear tarea real en tabla tareas
        await API.post('/tareas', {
          persona_id: personaId,
          tipo: selectedTipo,
          titulo: `${cfg.label} — ${nombre}`,
          descripcion: nota || null,
          fecha_venc: fechaStr,
          hora_venc: selectedSlot.hora + ':00',
        });
        overlay.remove();
        if (this._fichaPersona) this.showFicha(personaId);
      } catch (e) { alert('Error: ' + e.message); }
    });
  },

  async renderTab(tab, p) {
    const content = document.getElementById('persona-tab-content');

    if (tab === 'historial') {
      this._renderHistorial(content, p);
      return;
    }

    if (tab === 'propuestas') {
      content.innerHTML = '<p class="text-light" style="font-size:13px;">Cargando propuestas...</p>';
      try {
        const propuestas = await API.get(`/calculadora/propuestas/persona/${p.id}`);
        // También buscar en notas las propuestas legacy
        const notasProp = (p.notas || []).filter(n => {
          const txt = n.texto || '';
          return txt.includes('PRESUPUESTO ADESLAS') || txt.includes('GRABACIÓN PÓLIZA');
        });

        if (propuestas.length === 0 && notasProp.length === 0) {
          content.innerHTML = `<div style="text-align:center;padding:40px;color:#94a3b8;">${_ICO.propuesta(32,'#d1d9e0')}<p style="margin-top:8px;">Sin propuestas guardadas</p><p style="font-size:12px;">Abre la <strong>Calculadora</strong> y pulsa "Guardar en CRM"</p></div>`;
          return;
        }

        content.innerHTML = `
          <div id="propuestas-list">
          ${propuestas.map(pr => {
            const color = pr.tipo_poliza === 'MASCOTAS' ? '#f59e0b' : pr.tipo_poliza === 'DENTAL' ? '#10b981' : pr.tipo_poliza === 'DECESOS' ? '#8b5cf6' : '#009DDD';
            return `
            <div class="card prop-card" data-id="${pr.id}" style="padding:14px;margin-bottom:10px;border-left:3px solid ${color};">
              <div style="display:flex;align-items:center;gap:10px;">
                <input type="checkbox" class="prop-check" data-id="${pr.id}" style="width:16px;height:16px;cursor:pointer;">
                <div style="flex:1;">
                  <div style="font-size:14px;font-weight:700;">${this._esc(pr.tipo_poliza || pr.producto || 'Propuesta')}</div>
                  <div style="font-size:12px;color:#94a3b8;">${pr.producto || ''} · ${pr.num_asegurados || 1} aseg. · ${new Date(pr.created_at).toLocaleDateString('es-ES')}</div>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:18px;font-weight:800;color:${color};">${pr.prima_mensual ? parseFloat(pr.prima_mensual).toFixed(2) + ' €/mes' : '—'}</div>
                  ${pr.campana_puntos > 0 ? `<div style="font-size:11px;color:#8b5cf6;font-weight:600;">${pr.campana_puntos} pts</div>` : ''}
                </div>
              </div>
              <div style="display:flex;gap:6px;margin-top:10px;">
                ${pr.nota_contenido ? `<button class="btn-ver-nota" data-nota="${this._esc(pr.nota_contenido?.substring(0, 5000))}" style="padding:4px 12px;border-radius:8px;border:1px solid #e8edf2;background:#fff;color:#475569;cursor:pointer;font-size:11px;font-weight:600;font-family:inherit;">Ver nota</button>` : ''}
                ${pr.pdf_url ? `<button class="btn-ver-pdf" data-id="${pr.id}" style="padding:4px 12px;border-radius:8px;border:none;background:#10b981;color:#fff;cursor:pointer;font-size:11px;font-weight:600;font-family:inherit;">PDF</button>` : ''}
                <button class="btn-usar-grab" data-propuesta='${JSON.stringify({tipo:pr.tipo_poliza||pr.producto,prima:pr.prima_mensual,asegurados:pr.asegurados_data})}' style="padding:4px 12px;border-radius:8px;border:1px solid var(--accent);background:#fff;color:var(--accent);cursor:pointer;font-size:11px;font-weight:600;font-family:inherit;">Usar en grabación</button>
                <button class="btn-del-prop" data-id="${pr.id}" style="padding:4px 12px;border-radius:8px;border:1px solid #ef4444;background:#fff;color:#ef4444;cursor:pointer;font-size:11px;font-weight:600;font-family:inherit;">Eliminar</button>
              </div>
            </div>`;
          }).join('')}
          </div>
          ${notasProp.length > 0 ? `<div style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;margin:16px 0 8px;">Propuestas legacy (notas)</div>` : ''}
          ${notasProp.map(n => this._renderNotaPropuesta(n, n.texto)).join('')}

          <!-- Barra enviar seleccionados -->
          <div id="prop-send-bar" style="display:none;position:sticky;bottom:0;background:#fff;border-top:1px solid #e8edf2;padding:10px 0;margin-top:10px;">
            <div style="display:flex;gap:8px;justify-content:center;">
              <span id="prop-count" style="font-size:12px;font-weight:600;color:#94a3b8;align-self:center;"></span>
              <button id="prop-send-wa" style="padding:6px 16px;border-radius:8px;border:none;background:#25D366;color:#fff;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit;display:flex;align-items:center;gap:4px;">💬 WhatsApp</button>
              <button id="prop-send-email" style="padding:6px 16px;border-radius:8px;border:none;background:#009DDD;color:#fff;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit;display:flex;align-items:center;gap:4px;">📧 Email</button>
            </div>
          </div>
        `;

        // Toggle barra enviar
        const updateSendBar = () => {
          const checked = content.querySelectorAll('.prop-check:checked');
          const bar = document.getElementById('prop-send-bar');
          const count = document.getElementById('prop-count');
          if (bar) bar.style.display = checked.length > 0 ? 'block' : 'none';
          if (count) count.textContent = checked.length + ' seleccionada' + (checked.length > 1 ? 's' : '');
        };
        content.querySelectorAll('.prop-check').forEach(cb => cb.addEventListener('change', updateSendBar));

        // PDF — window.open para que el browser respete Content-Disposition
        content.querySelectorAll('.btn-ver-pdf').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            window.open(`/api/calculadora/propuestas/${id}/pdf`, '_blank');
          });
        });

        // Ver nota → modal
        content.querySelectorAll('.btn-ver-nota').forEach(btn => {
          btn.addEventListener('click', () => {
            const nota = btn.dataset.nota;
            const overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);z-index:1000;display:flex;align-items:center;justify-content:center;';
            overlay.innerHTML = `<div style="background:#fff;border-radius:12px;padding:20px;max-width:600px;max-height:80vh;overflow-y:auto;width:90%;"><div style="display:flex;justify-content:space-between;margin-bottom:12px;"><strong>Nota de propuesta</strong><button id="close-nota-modal" style="background:none;border:none;font-size:18px;cursor:pointer;">×</button></div><pre style="white-space:pre-wrap;font-family:inherit;font-size:12px;background:#f4f6f9;padding:12px;border-radius:8px;">${nota}</pre><button id="copy-nota-modal" style="margin-top:10px;padding:8px 16px;border-radius:8px;border:none;background:#009DDD;color:#fff;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit;width:100%;">Copiar al portapapeles</button></div>`;
            document.body.appendChild(overlay);
            overlay.querySelector('#close-nota-modal').addEventListener('click', () => overlay.remove());
            overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
            overlay.querySelector('#copy-nota-modal').addEventListener('click', () => {
              navigator.clipboard.writeText(nota).then(() => { overlay.querySelector('#copy-nota-modal').textContent = 'Copiado'; });
            });
          });
        });

        // Usar en grabación
        content.querySelectorAll('.btn-usar-grab').forEach(btn => {
          btn.addEventListener('click', () => {
            try {
              const data = JSON.parse(btn.dataset.propuesta);
              this._fichaPersona._propuestaPrecarga = data;
            } catch(e) {}
            this._openGrabarInline();
          });
        });

        // Eliminar propuesta
        content.querySelectorAll('.btn-del-prop').forEach(btn => {
          btn.addEventListener('click', async () => {
            if (!confirm('¿Eliminar esta propuesta?')) return;
            try {
              await API.delete(`/calculadora/propuestas/${btn.dataset.id}`);
              btn.closest('.prop-card').remove();
            } catch (e) { alert('Error: ' + e.message); }
          });
        });

        // Enviar por WhatsApp
        document.getElementById('prop-send-wa')?.addEventListener('click', () => {
          const checked = Array.from(content.querySelectorAll('.prop-check:checked')).map(cb => parseInt(cb.dataset.id));
          const selected = propuestas.filter(pr => checked.includes(pr.id));
          const nombre = p.nombre?.split(' ')[0] || '';
          let msg = `Hola ${nombre}, te envío tus presupuestos de seguro:\n\n`;
          selected.forEach(pr => {
            msg += `═══ ${pr.tipo_poliza || pr.producto || 'Propuesta'} ═══\n`;
            msg += pr.nota_contenido ? pr.nota_contenido + '\n\n' : `Prima: ${parseFloat(pr.prima_mensual||0).toFixed(2)} €/mes\n\n`;
          });
          msg += 'Un saludo, Avants Seguros';
          const tel = (p.telefono || '').replace(/\D/g, '').replace(/^34/, '');
          window.open('https://wa.me/34' + tel + '?text=' + encodeURIComponent(msg), '_blank');
        });

        // Enviar por Email
        document.getElementById('prop-send-email')?.addEventListener('click', () => {
          const checked = Array.from(content.querySelectorAll('.prop-check:checked')).map(cb => parseInt(cb.dataset.id));
          const selected = propuestas.filter(pr => checked.includes(pr.id));
          const nombre = p.nombre?.split(' ')[0] || '';
          let body = `Hola ${nombre},\n\nTe adjunto tus presupuestos de seguro:\n\n`;
          selected.forEach(pr => {
            body += `--- ${pr.tipo_poliza || pr.producto || 'Propuesta'} ---\n`;
            body += pr.nota_contenido ? pr.nota_contenido + '\n\n' : `Prima: ${parseFloat(pr.prima_mensual||0).toFixed(2)} €/mes\n\n`;
          });
          body += 'Un saludo,\nAvants Seguros';
          const subject = 'Tus presupuestos de seguro - Avants';
          window.open('mailto:' + (p.email || '') + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body));
        });
      } catch (err) {
        content.innerHTML = `<p style="color:#ef4444;font-size:13px;">Error: ${err.message}</p>`;
      }
      return;
    }

    if (tab === 'polizas') {
      this.renderTabGrabaciones(content, p);
      return;
    }

    if (tab === 'calculadora') {
      this._openCalculadora(p.id);
      return;
    }

    if (tab === 'tramites') {
      const tickets = p.tickets || [];
      content.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <h4 style="margin:0;font-size:16px;font-weight:700;">Trámites</h4>
          <button class="btn btn-primary btn-sm" id="btn-new-tramite-ficha" style="display:flex;align-items:center;gap:5px;">${_ICO.añadir(14,'#fff')} Nuevo trámite</button>
        </div>
        ${tickets.length === 0 ? `<div style="text-align:center;padding:40px;color:#94a3b8;">${_ICO.tramites(32,'#d1d9e0')}<p style="margin-top:8px;">Sin trámites</p></div>` : `
        <table>
          <thead><tr><th>#</th><th>Tipo</th><th>Estado</th><th>Descripción</th><th>Fecha</th></tr></thead>
          <tbody>
            ${tickets.map(t => `
              <tr class="tramite-row" data-ticket-id="${t.id}" style="cursor:pointer;">
                <td>${t.id}</td>
                <td>${t.tipo_nombre || '—'}</td>
                <td>${this._estadoBadge(t.estado)}</td>
                <td>${this._esc((t.descripcion || '').substring(0, 60))}</td>
                <td>${new Date(t.created_at).toLocaleDateString('es-ES')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>`}
      `;

      // Botón nuevo trámite → abre panel lateral con contacto_id
      document.getElementById('btn-new-tramite-ficha')?.addEventListener('click', () => {
        if (typeof TicketsModule !== 'undefined' && TicketsModule.openNewPanel) {
          TicketsModule.openNewPanel(p.id);
        }
      });
      // Filas clickables → abre panel del trámite
      content.querySelectorAll('.tramite-row').forEach(row => {
        row.addEventListener('click', () => {
          if (typeof TicketsModule !== 'undefined' && TicketsModule.openPanel) {
            TicketsModule.openPanel(parseInt(row.dataset.ticketId));
          }
        });
      });
      return;
    }

    if (tab === 'notas') {
      const notas = (p.notas || []).filter(n => {
        const txt = n.texto || '';
        return !txt.includes('PRESUPUESTO ADESLAS') && !txt.includes('GRABACIÓN PÓLIZA');
      });
      content.innerHTML = `
        <div style="margin-bottom:16px;display:flex;gap:8px;align-items:flex-start;">
          <textarea class="form-control" id="new-nota" rows="2" placeholder="Escribe una nota..." style="flex:1;"></textarea>
          <button class="btn btn-primary" id="btn-add-nota" style="display:flex;align-items:center;gap:5px;white-space:nowrap;">${_ICO.añadir(14,'#fff')} Añadir</button>
        </div>
        <div id="notas-list">
          ${notas.length === 0 ? `<div style="text-align:center;padding:40px;color:#94a3b8;">${_ICO.nota(32,'#d1d9e0')}<p style="margin-top:8px;">Sin notas</p></div>` : notas.map(n => {
            const txt = this._stripHtml(n.texto || '');
            const time = new Date(n.created_at).toLocaleString('es-ES', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
            return `<div style="background:#fff;border:1px solid #e8edf2;border-radius:10px;padding:12px 14px;margin-bottom:8px;">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                <span style="font-size:12px;font-weight:600;color:#0f172a;">${n.user_nombre||'Sistema'}</span>
                <span style="font-size:11px;color:#94a3b8;">${time}</span>
              </div>
              <div style="font-size:13px;color:#475569;white-space:pre-wrap;line-height:1.5;">${this._esc(txt.substring(0,400))}${txt.length>400?'...':''}</div>
            </div>`;
          }).join('')}
        </div>
      `;

      document.getElementById('btn-add-nota').addEventListener('click', async () => {
        const input = document.getElementById('new-nota');
        const texto = input.value.trim();
        if (!texto) return;
        await API.post(`/personas/${p.id}/notas`, { texto });
        this.showFicha(p.id);
      });
      return;
    }

    if (tab === 'documentos') {
      content.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h4 style="margin:0;font-size:16px;font-weight:700;">Documentos</h4>
          <label style="display:flex;align-items:center;gap:5px;padding:7px 12px;border-radius:8px;background:#009DDD;color:#fff;cursor:pointer;font-size:12px;font-weight:600;">
            ${_ICO.añadir(14,'#fff')} Subir archivo
            <input type="file" id="doc-upload" style="display:none;" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx">
          </label>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:12px;">
          <select id="doc-cat" class="form-control" style="max-width:180px;font-size:12px;">
            <option value="Otro">Categoría...</option>
            <option value="Propuesta">Propuesta</option>
            <option value="Póliza">Póliza</option>
            <option value="DNI">DNI / Documentación</option>
            <option value="Otro">Otro</option>
          </select>
        </div>
        <div id="doc-list"><p class="text-light">Cargando...</p></div>
      `;

      // Cargar documentos existentes
      this._loadDocumentos(p.id);

      // Upload handler
      document.getElementById('doc-upload')?.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const cat = document.getElementById('doc-cat')?.value || 'Otro';
        const fd = new FormData();
        fd.append('file', file);
        fd.append('categoria', cat);
        try {
          await API.upload('/documentos/' + p.id, fd);
          this._loadDocumentos(p.id);
        } catch (err) { alert('Error: ' + err.message); }
      });
      return;
    }
  },

  async _loadDocumentos(personaId) {
    const el = document.getElementById('doc-list');
    if (!el) return;
    try {
      const docs = await API.get('/documentos/' + personaId);
      if (docs.length === 0) {
        el.innerHTML = `<div style="text-align:center;padding:40px;color:#94a3b8;">${_ICO.propuesta(32,'#d1d9e0')}<p style="margin-top:8px;">Sin documentos</p></div>`;
        return;
      }
      const catColors = { Propuesta:'#009DDD', 'Póliza':'#10b981', DNI:'#8b5cf6', Otro:'#94a3b8' };
      el.innerHTML = docs.map(d => {
        const size = d.tamano > 1024*1024 ? (d.tamano/1024/1024).toFixed(1)+'MB' : Math.round(d.tamano/1024)+'KB';
        const color = catColors[d.categoria] || '#94a3b8';
        return `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #e8edf2;">
          <div style="width:36px;height:36px;border-radius:8px;background:${color}15;display:flex;align-items:center;justify-content:center;">${_ICO.propuesta(16,color)}</div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${this._esc(d.nombre)}</div>
            <div style="font-size:11px;color:#94a3b8;">${d.categoria} · ${size} · ${d.user_nombre||'Sistema'} · ${new Date(d.created_at).toLocaleDateString('es-ES')}</div>
          </div>
          <a href="${d.ruta}?token=${API.getToken()}" target="_blank" style="padding:5px 10px;border-radius:6px;border:1px solid #e8edf2;background:#fff;color:#009DDD;font-size:11px;font-weight:600;text-decoration:none;display:flex;align-items:center;gap:4px;">
            ${_ICO.propuesta(12,'#009DDD')} Descargar
          </a>
        </div>`;
      }).join('');
    } catch (e) {
      el.innerHTML = `<p style="color:#ef4444;">${e.message}</p>`;
    }
  },

  // ═══════════════════════════════════════════
  // HISTORIAL — API contact_history
  // ═══════════════════════════════════════════
  _historialFilter: null,
  _historialOffset: 0,

  async _renderHistorial(content, p) {
    const TIPOS = [
      { key: null, label: 'Todo' },
      { key: 'llamada', label: 'Llamadas', ico: _ICO.llamada(12,'#009DDD') },
      { key: 'nota', label: 'Notas', ico: _ICO.nota(12,'#d97706') },
      { key: 'etapa', label: 'Etapas', ico: _ICO.historial(12,'#8b5cf6') },
      { key: 'email', label: 'Emails', ico: _ICO.email(12,'#10b981') },
      { key: 'whatsapp', label: 'WhatsApp', ico: _ICO.whatsapp(12,'#25D366') },
      { key: 'tramite', label: 'Trámites', ico: _ICO.tramites(12,'#f97316') },
      { key: 'propuesta', label: 'Propuestas', ico: _ICO.propuesta(12,'#7c3aed') },
    ];

    this._historialFilter = null;
    this._historialOffset = 0;

    content.innerHTML = `
      <div style="display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap;" id="tl-filters">
        ${TIPOS.map(t => `<button class="tl-filter-btn ${t.key === null ? 'active' : ''}" data-tipo="${t.key||''}" style="display:flex;align-items:center;gap:4px;padding:5px 12px;border-radius:20px;border:1px solid #e8edf2;background:${t.key===null?'#009DDD':'#fff'};color:${t.key===null?'#fff':'#475569'};font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;">${t.ico||''}${t.label}</button>`).join('')}
      </div>
      <div style="display:flex;gap:8px;margin-bottom:16px;">
        <textarea id="tl-new-nota" class="form-control" rows="1" placeholder="Añadir nota..." style="flex:1;font-size:13px;resize:none;"></textarea>
        <button id="tl-add-nota" style="padding:6px 14px;border-radius:8px;border:none;background:#009DDD;color:#fff;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit;white-space:nowrap;">${_ICO.añadir(12,'#fff')} Añadir</button>
      </div>
      <div id="tl-wrap" class="tl-wrap"></div>
      <div id="tl-more" style="text-align:center;padding:12px;display:none;">
        <button onclick="PersonasModule._loadMoreHistorial(${p.id})" style="padding:8px 20px;border-radius:8px;border:1px solid #e8edf2;background:#fff;color:#009DDD;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit;">Ver más</button>
      </div>
    `;

    // Filtros
    content.querySelectorAll('.tl-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        content.querySelectorAll('.tl-filter-btn').forEach(b => { b.style.background = '#fff'; b.style.color = '#475569'; });
        btn.style.background = '#009DDD'; btn.style.color = '#fff';
        this._historialFilter = btn.dataset.tipo || null;
        this._historialOffset = 0;
        this._loadHistorial(p.id);
      });
    });

    // Añadir nota
    document.getElementById('tl-add-nota')?.addEventListener('click', async () => {
      const input = document.getElementById('tl-new-nota');
      const texto = input?.value?.trim();
      if (!texto) return;
      try {
        await API.post('/history', { persona_id: p.id, tipo: 'nota', descripcion: texto });
        input.value = '';
        this._historialOffset = 0;
        this._loadHistorial(p.id);
      } catch (e) { alert('Error: ' + e.message); }
    });

    // Cargar datos
    this._loadHistorial(p.id);
  },

  async _loadHistorial(personaId) {
    const wrap = document.getElementById('tl-wrap');
    const more = document.getElementById('tl-more');
    if (!wrap) return;

    const qs = `?limit=30&offset=${this._historialOffset}${this._historialFilter ? '&tipo=' + this._historialFilter : ''}`;
    try {
      const res = await API.get(`/history/${personaId}${qs}`);
      const items = res.data || [];
      const total = res.total || 0;

      if (this._historialOffset === 0) wrap.innerHTML = '';

      if (items.length === 0 && this._historialOffset === 0) {
        wrap.innerHTML = `<div style="text-align:center;padding:40px;color:#94a3b8;">${_ICO.historial(32,'#d1d9e0')}<p style="margin-top:8px;">Sin actividad registrada</p></div>`;
        more.style.display = 'none';
        return;
      }

      wrap.insertAdjacentHTML('beforeend', items.map(h => this._renderHistoryCard(h)).join(''));
      this._historialOffset += items.length;
      more.style.display = this._historialOffset < total ? 'block' : 'none';
    } catch (e) {
      wrap.innerHTML = `<p style="color:#ef4444;padding:20px;">${e.message}</p>`;
    }
  },

  async _loadMoreHistorial(personaId) {
    await this._loadHistorial(personaId);
  },

  _renderHistoryCard(h) {
    const CFG = {
      llamada:   { ico: _ICO.llamada(18,'#009DDD'),   bg: '#e6f6fd', stroke: '#009DDD' },
      nota:      { ico: _ICO.nota(18,'#d97706'),        bg: '#fef3c7', stroke: '#d97706' },
      etapa:     { ico: _ICO.historial(18,'#8b5cf6'),    bg: '#ede9fe', stroke: '#8b5cf6' },
      email:     { ico: _ICO.email(18,'#10b981'),        bg: '#f0fdf4', stroke: '#10b981' },
      tramite:   { ico: _ICO.tramites(18,'#f97316'),     bg: '#fff7ed', stroke: '#f97316' },
      propuesta: { ico: _ICO.gestion(18,'#7c3aed'),      bg: '#faf5ff', stroke: '#7c3aed' },
      poliza:    { ico: _ICO.polizas(18,'#10b981'),      bg: '#f0fdf4', stroke: '#10b981' },
      whatsapp:  { ico: _ICO.whatsapp(18,'#25D366'),      bg: '#f0fdf4', stroke: '#25D366' },
      facebook:  { ico: _ICO.llamada(18,'#1d6ef5'),      bg: '#eff6ff', stroke: '#1d6ef5' },
      reunion:   { ico: _ICO.agenda(18,'#0284c7'),        bg: '#e0f2fe', stroke: '#0284c7' },
      tarea:     { ico: _ICO.gestion(18,'#ea580c'),       bg: '#fff7ed', stroke: '#ea580c' },
    };
    const cfg = CFG[h.tipo] || CFG.nota;
    const desc = this._stripHtml(h.descripcion || '');
    const meta = h.metadata || {};

    // Fecha relativa
    const now = new Date();
    const d = new Date(h.created_at);
    const diffH = (now - d) / 3600000;
    const timeStr = diffH < 1 ? 'hace ' + Math.round(diffH * 60) + 'min'
      : diffH < 24 ? 'hace ' + Math.round(diffH) + 'h'
      : d.toLocaleString('es-ES', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });

    // Badge estado llamada + dirección + devolver llamada
    let badge = '';
    if (h.tipo === 'llamada' && h.subtipo) {
      if (h.subtipo === 'devolver_llamada') {
        // Caso crítico: cliente intentó llamar al 900 — prioridad alta
        badge = `<span style="padding:3px 10px;border-radius:10px;font-size:11px;font-weight:800;background:#ef4444;color:#fff;animation:ct-pulse-red 1.5s infinite;">Devolver llamada</span>`;
      } else {
        const badgeCfg = { contestada: { bg:'#d1fae5', color:'#065f46', label:'Contestada' }, no_contestada: { bg:'#fee2e2', color:'#991b1b', label:'No contestó' }, buzon: { bg:'#f3f4f6', color:'#6b7280', label:'Buzón' } };
        const bc = badgeCfg[h.subtipo] || badgeCfg.buzon;
        badge = `<span style="padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;background:${bc.bg};color:${bc.color};">${bc.label}</span>`;
      }
      if (meta.direction === 'inbound') {
        badge += `<span style="padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;background:#e6f6fd;color:#0284c7;">↓ Entrante</span>`;
      } else if (meta.direction === 'outbound') {
        badge += `<span style="padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;background:#fef3c7;color:#92400e;">↑ Saliente</span>`;
      }
    }

    // Badge tarea por fecha
    if (meta.done === false && meta.due_date) {
      const hoy = new Date().toDateString();
      const fechaT = new Date(meta.due_date).toDateString();
      const vencida = new Date(meta.due_date) < new Date();
      if (vencida) badge = `<span style="padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;background:#fee2e2;color:#991b1b;">Vencida</span>`;
      else if (fechaT === hoy) badge = `<span style="padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;background:#fef3c7;color:#92400e;">Hoy</span>`;
      else badge = `<span style="padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;background:#f3f4f6;color:#6b7280;">Pendiente</span>`;
    } else if (meta.done === true) {
      badge = `<span style="padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;background:#d1fae5;color:#065f46;">Hecha</span>`;
    }

    // Contenido específico por tipo
    let body = '';
    if (h.tipo === 'etapa' && meta.etapa_origen && meta.etapa_destino) {
      body = `<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
        <span style="padding:3px 10px;border-radius:6px;font-size:11px;font-weight:600;background:#fef3c7;color:#92400e;">${this._esc(meta.etapa_origen)}</span>
        <span style="color:#94a3b8;">→</span>
        <span style="padding:3px 10px;border-radius:6px;font-size:11px;font-weight:600;background:#e6f6fd;color:#007ab8;">${this._esc(meta.etapa_destino)}</span>
      </div>`;
    } else if (h.tipo === 'propuesta' && meta.total_mensual) {
      body = `<div style="font-size:15px;font-weight:700;color:#0f172a;">${meta.total_mensual}</div>
        ${meta.puntos ? `<div style="font-size:11px;color:#7c3aed;margin-top:2px;">${meta.puntos} pts campaña</div>` : ''}`;
    } else if (desc) {
      if (h.tipo === 'nota' && desc.length > 300) {
        const uid = 'nota-exp-' + h.id;
        body = `<div style="font-size:13px;color:#475569;white-space:pre-wrap;line-height:1.5;">
          <span id="${uid}-short">${this._esc(desc.substring(0, 300))}...</span>
          <span id="${uid}-full" style="display:none;">${this._esc(desc)}</span>
        </div>
        <button onclick="event.stopPropagation();var s=document.getElementById('${uid}-short'),f=document.getElementById('${uid}-full'),b=this;if(f.style.display==='none'){f.style.display='inline';s.style.display='none';b.textContent='Ocultar';}else{f.style.display='none';s.style.display='inline';b.textContent='Ver nota completa';}"
          style="margin-top:6px;padding:3px 10px;border-radius:6px;border:1px solid #e8edf2;background:#fff;color:#d97706;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;">Ver nota completa</button>`;
      } else {
        body = `<div style="font-size:13px;color:#475569;white-space:pre-wrap;line-height:1.5;">${this._esc(desc.substring(0, 300))}${desc.length > 300 ? '...' : ''}</div>`;
      }
    }

    // Botón devolver llamada — caso de negocio crítico
    if (h.tipo === 'llamada' && h.subtipo === 'devolver_llamada' && meta.direction === 'inbound') {
      const callPhone = (h.descripcion || '').split('→').pop()?.trim() || '';
      body += `<div style="display:flex;align-items:center;gap:8px;margin-top:8px;padding:10px 12px;background:#fef2f2;border:1px solid #fca5a5;border-radius:10px;">
        <span style="font-size:13px;font-weight:700;color:#991b1b;">Cliente intentó llamar al 900</span>
        ${callPhone ? `<button onclick="event.stopPropagation();PersonasModule._clickToCall('${callPhone}',${h.persona_id},'')" style="margin-left:auto;padding:6px 14px;border-radius:8px;border:none;background:#ef4444;color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:5px;">${_ICO.llamada(14,'#fff')} Devolver</button>` : ''}
      </div>`;
    }

    // Grabación de CloudTalk — reproductor inline
    if (h.tipo === 'llamada' && meta.grabacion_url) {
      body += `<div style="margin-top:8px;padding:8px 10px;background:#f4f6f9;border-radius:8px;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
          ${_ICO.llamada(14,'#009DDD')}
          <span style="font-size:12px;font-weight:600;color:#009DDD;">Grabación</span>
          ${meta.duracion_seg ? `<span style="font-size:11px;color:#94a3b8;margin-left:auto;">${Math.floor(meta.duracion_seg/60)}:${String(meta.duracion_seg%60).padStart(2,'0')}</span>` : ''}
        </div>
        <audio controls preload="none" style="width:100%;height:36px;border-radius:6px;">
          <source src="${this._esc(meta.grabacion_url)}">
        </audio>
        ${meta.cloudtalk_call_id ? `<button onclick="PersonasModule._showTranscripcion('${this._esc(meta.cloudtalk_call_id)}')" style="margin-top:6px;padding:4px 10px;border-radius:6px;border:1px solid #e8edf2;background:#fff;color:#009DDD;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;">Ver transcripcion</button>` : ''}
      </div>`;
    }

    return `<div class="tl-item">
      <div class="tl-line">
        <div class="tl-dot" style="background:${cfg.bg};border:2px solid #fff;">${cfg.ico}</div>
      </div>
      <div class="tl-card">
        <div class="tl-card-head">
          <span class="tl-card-label" style="color:${cfg.stroke};">${h.titulo || h.tipo}</span>
          ${badge}
          <span class="tl-card-time">${timeStr}</span>
        </div>
        ${body ? `<div class="tl-card-body">${h.agente_nombre ? `<div style="font-size:11px;color:#94a3b8;margin-bottom:4px;">${h.agente_nombre}</div>` : ''}${body}</div>` : ''}
      </div>
    </div>`;
  },

  _stripHtml(str) {
    if (!str) return '';
    return str.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\n{3,}/g, '\n\n').trim();
  },

  // === Click-to-call via CloudTalk Widget ===
  _listenPropuestaGuardada() {
    if (this._propuestaListener) return;
    this._propuestaListener = true;
    window.addEventListener('message', (e) => {
      if (e.data?.type === 'propuesta-guardada' && e.data.persona_id) {
        this.showFicha(e.data.persona_id);
      }
    });
  },

  _openCalculadora(personaId) {
    this._listenPropuestaGuardada();
    const p = this._fichaPersona;
    const params = new URLSearchParams();
    if (p) {
      if (p.nombre) params.set('nombre', p.nombre);
      if (p.telefono) params.set('telefono', p.telefono);
      if (p.email) params.set('email', p.email);
      params.set('persona_id', personaId);
    }
    const qs = params.toString() ? '?' + params.toString() : '';
    const content = document.getElementById('persona-tab-content');
    // Desactivar tabs
    document.querySelectorAll('#persona-tabs .tab-btn').forEach(b => {
      b.style.color = '#94a3b8'; b.style.borderBottomColor = 'transparent';
    });
    content.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <span style="font-size:16px;font-weight:700;display:flex;align-items:center;gap:6px;">${typeof Icons !== 'undefined' ? Icons.calculadora(20,'var(--accent)') : ''} Calculadora ADESLAS</span>
        <button id="btn-volver-calc" style="margin-left:auto;padding:6px 12px;border-radius:8px;border:1px solid #e8edf2;background:#fff;color:#475569;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit;display:flex;align-items:center;gap:5px">${_ICO.volver(14,'#475569')} Volver</button>
      </div>
      <iframe src="/calculadora/index.html${qs}" style="width:100%;height:calc(100vh - 240px);border:1px solid #e8edf2;border-radius:12px;"></iframe>`;
    document.getElementById('btn-volver-calc').addEventListener('click', () => {
      const firstTab = document.querySelector('#persona-tabs .tab-btn');
      if (firstTab) { firstTab.style.color = 'var(--accent)'; firstTab.style.borderBottomColor = 'var(--accent)'; }
      this.renderTab('historial', p);
    });
  },

  _normalizePhone(phone) {
    if (!phone) return '';
    let digits = phone.replace(/\D/g, '');
    // Si empieza por 34 y tiene 11 digitos → ya es formato español completo
    if (digits.startsWith('34') && digits.length === 11) return '+' + digits;
    // Si tiene 9 digitos → añadir +34
    if (digits.length === 9) return '+34' + digits;
    // Si ya tiene + al inicio, devolver tal cual
    if (phone.startsWith('+')) return phone.replace(/\s/g, '');
    return '+' + digits;
  },

  _clickToCall(phone, personaId, nombre) {
    const normalized = this._normalizePhone(phone);
    if (!normalized) return;
    // Mostrar tab Briefing + iniciar llamada
    this._showBriefingTab(personaId);
    if (typeof GVPhone !== 'undefined') {
      GVPhone.call(normalized, personaId, nombre);
    } else {
      window.open('tel:' + normalized);
    }
  },

  // ══════════════════════════════════════════
  // BRIEFING TAB — aparece/desaparece con llamada activa
  // ══════════════════════════════════════════

  async _showBriefingTab(personaId) {
    const tabs = document.getElementById('persona-tabs');
    if (!tabs || document.getElementById('tab-briefing')) return; // ya existe

    // Insertar tab Briefing al inicio
    const ts = 'padding:11px 16px;font-size:13px;font-weight:600;color:#94a3b8;cursor:pointer;border:none;background:none;border-bottom:2px solid transparent;margin-bottom:-1px;white-space:nowrap;font-family:inherit;';
    const btn = document.createElement('button');
    btn.id = 'tab-briefing';
    btn.className = 'tab-btn';
    btn.dataset.tab = 'briefing';
    btn.style.cssText = ts;
    btn.innerHTML = `<span style="display:inline-flex;align-items:center;gap:4px;"><span style="width:6px;height:6px;border-radius:50%;background:#10b981;animation:ct-pulse-red 1.2s infinite;"></span> Briefing</span>`;
    tabs.insertBefore(btn, tabs.firstChild);

    // Click handler
    btn.addEventListener('click', () => {
      tabs.querySelectorAll('.tab-btn').forEach(b => { b.style.color = '#94a3b8'; b.style.borderBottomColor = 'transparent'; });
      btn.style.color = 'var(--accent)';
      btn.style.borderBottomColor = 'var(--accent)';
      this._renderBriefingContent(personaId);
    });

    // Activar Briefing tab
    tabs.querySelectorAll('.tab-btn').forEach(b => { b.style.color = '#94a3b8'; b.style.borderBottomColor = 'transparent'; });
    btn.style.color = 'var(--accent)';
    btn.style.borderBottomColor = 'var(--accent)';

    // Cargar y renderizar
    this._renderBriefingContent(personaId);
  },

  _hideBriefingTab() {
    document.getElementById('tab-briefing')?.remove();
  },

  async _renderBriefingContent(personaId) {
    const content = document.getElementById('persona-tab-content');
    if (!content) return;
    content.innerHTML = '<p style="color:#94a3b8;font-size:13px;">Cargando briefing...</p>';

    let d;
    try {
      d = await API.get(`/personas/call-drawer/${personaId}`);
    } catch {
      d = { ia_briefing: null, historial_reciente: [], seguros_activos: [], propuestas_recientes: [], ultima_nota: null };
    }

    const ia = d.ia_briefing;
    const hist = d.historial_reciente || [];
    const seguros = d.seguros_activos || [];
    const props = d.propuestas_recientes || [];
    const nota = d.ultima_nota;

    // Seccion IA
    let iaHtml = '';
    if (ia) {
      iaHtml = `<div style="background:#eff6ff;border-radius:10px;padding:14px;margin-bottom:14px;">
        <div style="font-size:12px;font-weight:700;color:#1d4ed8;margin-bottom:8px;">${_ICO.gestion(14,'#1d4ed8')} Recomendacion IA</div>
        ${ia.tactica ? `<div style="font-size:13px;color:#0f172a;margin-bottom:5px;"><strong>Tactica:</strong> ${this._esc(ia.tactica)}</div>` : ''}
        ${ia.oportunidad ? `<div style="font-size:13px;color:#0f172a;margin-bottom:5px;"><strong>Oportunidad:</strong> ${this._esc(ia.oportunidad)}</div>` : ''}
        ${ia.productos_detalle?.length ? `
          <div style="margin:8px 0 5px;"><strong style="font-size:12px;color:#10b981;">Productos recomendados:</strong></div>
          <div style="display:flex;flex-wrap:wrap;gap:4px;">
            ${ia.productos_detalle.map((p, i) => `
              <span class="ia-prod-pill" onclick="this.nextElementSibling.classList.toggle('ia-prod-hidden')"
                style="padding:3px 10px;border-radius:8px;font-size:11px;font-weight:600;background:#e6f6fd;color:#009DDD;cursor:pointer;border:1px solid #b3e0f7;">
                ${this._esc(p.nombre)}${p.precio ? ' ' + p.precio + '€' : ''}
              </span>
              <div class="ia-prod-hidden" style="width:100%;font-size:11px;color:#475569;padding:6px 8px;background:#f8fafc;border-radius:6px;margin-bottom:4px;display:none;">
                ${p.compania ? `<strong>${this._esc(p.compania)}</strong> → ${this._esc(p.categoria || '')}` : ''}
                ${p.coberturas ? `<div style="margin-top:2px;">${this._esc(p.coberturas)}</div>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
        ${ia.tono ? `<div style="font-size:12px;color:#475569;margin-top:5px;"><strong>Tono:</strong> ${this._esc(ia.tono)}</div>` : ''}
        ${ia.evitar?.length ? `<div style="font-size:12px;color:#991b1b;margin-top:3px;"><strong>Evitar:</strong> ${ia.evitar.join(', ')}</div>` : ''}
        ${ia.resumen ? `<div style="font-size:12px;color:#475569;margin-top:8px;padding-top:8px;border-top:1px solid #bfdbfe;">${this._esc(ia.resumen)}</div>` : ''}
      </div>`;
      // CSS for product pill toggle
      if (!document.getElementById('ia-prod-css')) {
        const st = document.createElement('style'); st.id = 'ia-prod-css';
        st.textContent = '.ia-prod-hidden{display:none!important;} .ia-prod-pill:hover{background:#ccedf9!important;}';
        document.head.appendChild(st);
      }
    }

    // Datos reales
    let datosItems = '';
    if (hist.length) {
      const h = hist[0];
      datosItems += `<div style="font-size:12px;color:#475569;margin-bottom:5px;">${_ICO.historial(14,'#009DDD')} <strong>Ultima:</strong> ${h.tipo}${h.subtipo?' · '+h.subtipo:''} — ${this._fmtRelative(h.created_at)}</div>`;
    }
    if (props.length) {
      datosItems += `<div style="font-size:12px;color:#475569;margin-bottom:5px;">${_ICO.propuesta(14,'#7c3aed')} <strong>Propuesta:</strong> ${this._esc(props[0].producto||props[0].tipo_poliza||'')} ${props[0].prima_mensual?props[0].prima_mensual+'/mes':''}</div>`;
    }
    if (seguros.length) {
      datosItems += `<div style="font-size:12px;color:#475569;margin-bottom:5px;">${_ICO.polizas(14,'#10b981')} <strong>Seguros:</strong> ${seguros.map(s=>this._esc(s.producto)+(s.prima_mensual?' '+s.prima_mensual+'/mes':'')).join(', ')}</div>`;
    }
    if (nota) {
      datosItems += `<div style="font-size:12px;color:#475569;">${_ICO.nota(14,'#f59e0b')} <strong>Nota:</strong> ${this._esc((nota.contenido||'').substring(0,120))}</div>`;
    }

    // Historial compacto
    let histHtml = '';
    if (hist.length) {
      histHtml = `<div style="margin-bottom:14px;">
        <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">Ultimas interacciones</div>
        ${hist.map(h => `<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #f0f2f5;font-size:12px;">
          <span style="font-weight:600;color:#009DDD;min-width:65px;">${h.tipo}</span>
          <span style="color:#475569;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${this._esc((h.descripcion||h.titulo||'').substring(0,60))}</span>
          <span style="color:#94a3b8;flex-shrink:0;font-size:11px;">${this._fmtRelative(h.created_at)}</span>
        </div>`).join('')}
      </div>`;
    }

    // Botones rapidos
    const botonesHtml = `<div style="display:flex;gap:8px;">
      <button onclick="PersonasModule._briefingNotaRapida(${personaId})" style="padding:7px 14px;border-radius:8px;border:1px solid #e8edf2;background:#fff;color:#475569;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:5px;">${_ICO.nota(14,'#475569')} Nota rapida</button>
      <button onclick="PersonasModule._showAddActivity(${personaId})" style="padding:7px 14px;border-radius:8px;border:1px solid #e8edf2;background:#fff;color:#475569;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:5px;">${_ICO.agendar(14,'#475569')} Agendar</button>
    </div>`;

    // Chat IA
    const chatHtml = `<div style="background:#f5f3ff;border-radius:10px;padding:12px;margin-bottom:14px;">
      <div style="font-size:11px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;">${_ICO.gestion(14,'#7c3aed')} Consulta a la IA</div>
      <div id="ia-chat-messages" style="min-height:60px;max-height:25vh;overflow-y:auto;margin-bottom:8px;"></div>
      <div style="display:flex;gap:6px;">
        <input id="ia-chat-input" class="ia-chat-input" placeholder="Pregunta sobre el producto o el cliente..." onkeydown="if(event.key==='Enter')PersonasModule._sendIAChat(${personaId})">
        <button onclick="PersonasModule._sendIAChat(${personaId})" class="ia-chat-send">${_ICO.gestion(14,'#fff')} Enviar</button>
      </div>
    </div>`;

    // CSS del chat
    if (!document.getElementById('ia-chat-css')) {
      const st = document.createElement('style'); st.id = 'ia-chat-css';
      st.textContent = `
        .ia-chat-input{flex:1;padding:8px 10px;border:1px solid #e8edf2;border-radius:8px;font-size:12px;font-family:inherit;color:#0f172a;}
        .ia-chat-input:focus{outline:none;border-color:#7c3aed;box-shadow:0 0 0 3px rgba(124,58,237,.1);}
        .ia-chat-send{padding:8px 14px;border-radius:8px;border:none;background:#7c3aed;color:#fff;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:4px;white-space:nowrap;}
        .ia-chat-send:hover{background:#6d28d9;}
        .ia-chat-msg{padding:8px 10px;border-radius:8px;margin-bottom:6px;font-size:12px;line-height:1.5;max-width:90%;}
        .ia-chat-user{background:#e6f6fd;color:#0f172a;margin-left:auto;}
        .ia-chat-ia{background:#f5f3ff;color:#475569;border:1px solid #e9e5f5;}
      `;
      document.head.appendChild(st);
    }

    content.innerHTML = `<div style="width:100%;">
      ${iaHtml}
      ${chatHtml}
      <details style="margin-bottom:10px;" open>
        <summary style="font-size:11px;font-weight:700;color:#009DDD;text-transform:uppercase;letter-spacing:.5px;cursor:pointer;margin-bottom:6px;user-select:none;">${_ICO.gestion(14,'#009DDD')} Contexto del cliente</summary>
        <div style="background:#e6f6fd;border-radius:10px;padding:12px;">
          ${datosItems || '<div style="font-size:12px;color:#94a3b8;">Sin datos previos</div>'}
        </div>
      </details>
      ${histHtml}
      ${botonesHtml}
    </div>`;
  },

  _briefingNotaRapida(personaId) {
    const content = document.getElementById('persona-tab-content');
    if (!content) return;
    // Insertar textarea al final del content
    if (document.getElementById('briefing-nota-wrap')) return;
    const wrap = document.createElement('div');
    wrap.id = 'briefing-nota-wrap';
    wrap.style.cssText = 'margin-top:14px;padding-top:14px;border-top:1px solid #e8edf2;';
    wrap.innerHTML = `
      <textarea id="briefing-nota-text" style="width:100%;height:80px;padding:10px;border:1px solid #e8edf2;border-radius:8px;font-size:13px;font-family:inherit;color:#0f172a;resize:vertical;box-sizing:border-box;" placeholder="Nota rapida..."></textarea>
      <div style="display:flex;gap:6px;margin-top:6px;">
        <button id="briefing-nota-save" style="padding:6px 14px;border-radius:8px;border:none;background:#009DDD;color:#fff;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">Guardar</button>
        <button onclick="document.getElementById('briefing-nota-wrap').remove()" style="padding:6px 14px;border-radius:8px;border:1px solid #e8edf2;background:#fff;color:#475569;font-size:12px;cursor:pointer;font-family:inherit;">Cancelar</button>
      </div>
    `;
    content.querySelector('div')?.appendChild(wrap);
    document.getElementById('briefing-nota-text')?.focus();
    document.getElementById('briefing-nota-save')?.addEventListener('click', async () => {
      const t = document.getElementById('briefing-nota-text')?.value?.trim();
      if (!t) return;
      await API.post('/history', { persona_id: personaId, tipo: 'nota', titulo: 'Nota en llamada', descripcion: t, origen: 'manual' });
      wrap.innerHTML = '<div style="font-size:12px;color:#10b981;font-weight:600;padding:8px 0;">Nota guardada</div>';
      setTimeout(() => wrap.remove(), 1500);
    });
  },

  _iaChatHistory: [],
  _iaChatPersonaId: null,

  async _sendIAChat(personaId) {
    const input = document.getElementById('ia-chat-input');
    const msgs = document.getElementById('ia-chat-messages');
    if (!input || !msgs) return;
    const mensaje = input.value.trim();
    if (!mensaje) return;

    // Reset si cambio de contacto
    if (this._iaChatPersonaId !== personaId) {
      this._iaChatHistory = [];
      this._iaChatPersonaId = personaId;
    }

    // Mostrar mensaje del usuario
    msgs.innerHTML += `<div class="ia-chat-msg ia-chat-user">${this._esc(mensaje)}</div>`;
    input.value = '';
    msgs.scrollTop = msgs.scrollHeight;

    // Indicador "pensando"
    const thinkId = 'ia-think-' + Date.now();
    msgs.innerHTML += `<div class="ia-chat-msg ia-chat-ia" id="${thinkId}" style="opacity:.5;">Pensando...</div>`;
    msgs.scrollTop = msgs.scrollHeight;

    try {
      const r = await API.post('/ia/chat-llamada', {
        personaId,
        mensaje,
        historial: this._iaChatHistory,
      });

      document.getElementById(thinkId)?.remove();
      msgs.innerHTML += `<div class="ia-chat-msg ia-chat-ia">${this._esc(r.respuesta)}</div>`;
      msgs.scrollTop = msgs.scrollHeight;

      // Guardar en historial de sesion
      this._iaChatHistory.push({ role: 'user', content: mensaje });
      this._iaChatHistory.push({ role: 'assistant', content: r.respuesta });
      // Limitar a ultimos 10 mensajes
      if (this._iaChatHistory.length > 10) this._iaChatHistory = this._iaChatHistory.slice(-10);
    } catch (e) {
      document.getElementById(thinkId)?.remove();
      msgs.innerHTML += `<div class="ia-chat-msg ia-chat-ia" style="color:#ef4444;">${e.message || 'Error'}</div>`;
    }
  },

  // === Deal drawer — vista detalle inline ===
  async _openDealDrawer(dealId) {
    // Cerrar drawer previo si existe
    document.getElementById('deal-drawer-overlay')?.remove();

    // Overlay + drawer
    const overlay = document.createElement('div');
    overlay.id = 'deal-drawer-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.3);z-index:900;display:flex;justify-content:flex-end;';
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    const drawer = document.createElement('div');
    drawer.style.cssText = 'width:min(460px,90vw);height:100%;background:#fff;box-shadow:-4px 0 24px rgba(0,0,0,.08);overflow-y:auto;padding:24px 20px;font-family:var(--font-family);animation:dd-slide .2s ease;';
    drawer.innerHTML = '<p style="color:#94a3b8;font-size:13px;">Cargando deal...</p>';
    overlay.appendChild(drawer);
    document.body.appendChild(overlay);

    // CSS animacion
    if (!document.getElementById('deal-drawer-css')) {
      const st = document.createElement('style'); st.id = 'deal-drawer-css';
      st.textContent = '@keyframes dd-slide{from{transform:translateX(100%)}to{transform:translateX(0)}}';
      document.head.appendChild(st);
    }

    try {
      const [deal, historial] = await Promise.all([
        API.get(`/pipeline/deals/${dealId}`),
        API.get(`/history/deal/${dealId}?limit=50`)
      ]);

      const d = deal;
      const hist = (historial.data || []);
      const stCfg = d.pipedrive_status === 'won' ? { bg:'#d1fae5', color:'#065f46', label:'Ganado' }
        : d.pipedrive_status === 'lost' ? { bg:'#f1f5f9', color:'#94a3b8', label:'Perdido' }
        : { bg:'#e6f6fd', color:'#007ab8', label:'Activo' };

      // Normalizar nombres de campos (pipeline endpoint usa stage_name/pipeline_name)
      d.pipeline_nombre = d.pipeline_nombre || d.pipeline_name || '';
      d.etapa_nombre = d.etapa_nombre || d.stage_name || '';

      // Campos del deal
      const campos = [
        { label: 'Compañia', value: d.compania },
        { label: 'Producto', value: d.producto },
        { label: 'Pipeline', value: d.pipeline_nombre },
        { label: 'Etapa', value: d.etapa_nombre },
        { label: 'Prima', value: d.prima ? d.prima + '€' : null },
        { label: 'Agente', value: d.agente_nombre },
        { label: 'Creado', value: d.created_at ? new Date(d.created_at).toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' }) : null },
      ].filter(c => c.value);

      // Historial del deal
      let histHtml = '';
      if (Array.isArray(hist) && hist.length > 0) {
        histHtml = hist.map(h => {
          const time = this._fmtRelative(h.created_at);
          const tipoCfg = { llamada:'#009DDD', nota:'#d97706', etapa:'#8b5cf6', email:'#10b981', poliza:'#10b981', propuesta:'#7c3aed', reunion:'#0284c7', tarea:'#ea580c' };
          const color = tipoCfg[h.tipo] || '#94a3b8';
          return `<div style="padding:8px 0;border-bottom:1px solid #f0f2f5;font-size:12px;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
              <span style="font-weight:700;color:${color};">${h.tipo}</span>
              ${h.subtipo ? `<span style="color:#94a3b8;">${h.subtipo}</span>` : ''}
              <span style="margin-left:auto;color:#94a3b8;font-size:11px;">${time}</span>
            </div>
            ${h.titulo ? `<div style="color:#0f172a;font-weight:600;">${this._esc(h.titulo)}</div>` : ''}
            ${h.descripcion ? `<div style="color:#475569;margin-top:2px;white-space:pre-wrap;">${this._esc((h.descripcion || '').substring(0, 200))}${(h.descripcion || '').length > 200 ? '...' : ''}</div>` : ''}
          </div>`;
        }).join('');
      } else {
        histHtml = '<div style="font-size:13px;color:#94a3b8;padding:12px 0;">Sin historial para este deal</div>';
      }

      // Enlace a Pipedrive
      const pdLink = d.pipedrive_id
        ? `<a href="https://avantssl.pipedrive.com/deal/${d.pipedrive_id}" target="_blank" rel="noopener"
             style="display:inline-flex;align-items:center;gap:5px;padding:6px 12px;border-radius:8px;border:1px solid #e8edf2;background:#fff;color:#475569;font-size:11px;font-weight:600;text-decoration:none;font-family:inherit;">
             ${_ICO.propuesta(14,'#475569')} Ver en Pipedrive
           </a>`
        : '';

      drawer.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
          <div>
            <div style="font-size:16px;font-weight:700;color:#0f172a;">${this._esc(d.producto || d.compania || 'Deal')}</div>
            <div style="display:flex;gap:6px;margin-top:6px;">
              <span style="padding:3px 10px;border-radius:10px;font-size:11px;font-weight:700;background:${stCfg.bg};color:${stCfg.color};">${stCfg.label}</span>
              ${d.pipeline_nombre ? `<span style="padding:3px 10px;border-radius:10px;font-size:11px;font-weight:600;background:#e6f6fd;color:#009DDD;">${this._esc(d.pipeline_nombre)}</span>` : ''}
            </div>
          </div>
          <button onclick="document.getElementById('deal-drawer-overlay')?.remove()" style="width:32px;height:32px;border-radius:8px;border:1px solid #e8edf2;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;color:#94a3b8;">✕</button>
        </div>

        <div style="background:#f8fafc;border-radius:10px;padding:14px;margin-bottom:20px;">
          ${campos.map(c => `<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f0f2f5;">
            <span style="font-size:12px;color:#94a3b8;font-weight:600;">${c.label}</span>
            <span style="font-size:12px;color:#0f172a;font-weight:600;">${this._esc(c.value)}</span>
          </div>`).join('')}
        </div>

        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#94a3b8;">Historial del deal</div>
          ${pdLink}
        </div>
        <div>${histHtml}</div>
      `;
    } catch (e) {
      drawer.innerHTML = `<p style="color:#ef4444;font-size:13px;">Error cargando deal: ${e.message}</p>
        <button onclick="document.getElementById('deal-drawer-overlay')?.remove()" style="margin-top:12px;padding:8px 16px;border-radius:8px;border:1px solid #e8edf2;background:#fff;color:#475569;font-size:12px;cursor:pointer;">Cerrar</button>`;
    }
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

  async _showTranscripcion(callId) {
    // Buscar transcripcion por cloudtalk_call_id
    try {
      const r = await API.get('/transcriptions?contact_id=' + (this._fichaPersona?.id || ''));
      const t = (r.transcriptions || []).find(function(t) { return t.cloudtalk_call_id === callId; });
      if (!t) { alert('Transcripcion no disponible todavia. Se procesa automaticamente tras la llamada (min 2 min).'); return; }

      // Modal con resumen + transcripcion
      var overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.5);z-index:800;display:flex;align-items:center;justify-content:center;padding:20px;';
      overlay.innerHTML = `<div style="background:#fff;border-radius:12px;width:640px;max-width:100%;max-height:80vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.2);">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #e8edf2;">
          <span style="font-size:15px;font-weight:700;">Transcripcion de llamada</span>
          <button onclick="this.closest('[style]').parentElement.remove()" style="background:none;border:none;font-size:20px;color:#94a3b8;cursor:pointer;">&times;</button>
        </div>
        <div style="padding:20px;overflow-y:auto;flex:1;">
          ${t.resumen_ia ? `<div style="background:#eff6ff;border-radius:10px;padding:14px;margin-bottom:16px;">
            <div style="font-size:12px;font-weight:700;color:#1d4ed8;margin-bottom:6px;">Resumen IA</div>
            <div style="font-size:13px;color:#0f172a;line-height:1.5;">${this._esc(t.resumen_ia)}</div>
            ${t.resultado_llamada ? `<div style="margin-top:8px;"><span style="padding:3px 8px;border-radius:6px;font-size:10px;font-weight:700;background:#e6f6fd;color:#009DDD;">${t.resultado_llamada}</span></div>` : ''}
          </div>` : ''}
          ${t.estado === 'completado' && t.transcripcion ? `
            <div style="font-size:12px;font-weight:700;color:#475569;margin-bottom:6px;">Transcripcion completa</div>
            <div style="font-size:12px;color:#475569;line-height:1.6;white-space:pre-wrap;background:#f8fafc;border:1px solid #e8edf2;border-radius:8px;padding:14px;max-height:40vh;overflow-y:auto;">${this._esc(t.transcripcion)}</div>
          ` : `<div style="color:#94a3b8;font-size:13px;">Estado: ${t.estado}${t.error_mensaje ? ' — ' + this._esc(t.error_mensaje) : ''}</div>`}
        </div>
      </div>`;
      document.body.appendChild(overlay);
      overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
    } catch (e) {
      alert('Error: ' + e.message);
    }
  },

  // === Grabar póliza — formulario completo con 3 secciones ===
  _openGrabarInline() {
    const p = this._fichaPersona;
    if (!p) return;
    const content = document.getElementById('persona-tab-content');
    const activeDeal = (p.deals||[]).find(d=>d.estado==='en_tramite') || (p.deals||[])[0];
    const lbl = 'font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.3px;';
    const sec = 'font-size:13px;font-weight:700;color:#0f172a;margin-bottom:12px;display:flex;align-items:center;gap:6px;';

    // Propuestas previas
    const propuestas = (p.notas || []).filter(n => {
      const txt = n.texto || '';
      return txt.includes('PRESUPUESTO ADESLAS') || txt.includes('GRABACIÓN PÓLIZA') || txt.includes('OPCIÓN');
    });

    // Familiares precargados como asegurados
    const familiares = p.familiares || [];

    document.querySelectorAll('#persona-tabs .tab-btn').forEach(b => {
      b.style.color = '#94a3b8'; b.style.borderBottomColor = 'transparent';
    });

    content.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
        <span style="font-size:16px;font-weight:700;display:flex;align-items:center;gap:6px;">${_ICO.grabar(20,'#ef4444')} Grabar Póliza</span>
        <button id="btn-grabar-iframe" style="margin-left:auto;padding:6px 12px;border-radius:8px;border:1px solid #e8edf2;background:#fff;color:#475569;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit;">Abrir grabaciones</button>
        <button id="btn-volver-grabar" style="padding:6px 12px;border-radius:8px;border:1px solid #e8edf2;background:#fff;color:#475569;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit;display:flex;align-items:center;gap:5px">${_ICO.volver(14,'#475569')} Volver</button>
      </div>

      ${propuestas.length > 0 ? `
        <div style="background:#e6f6fd;border:1px solid #b3e0f7;border-radius:10px;padding:12px;margin-bottom:14px;">
          <div style="${lbl}margin-bottom:8px;">Cargar desde propuesta</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${propuestas.map((pr, i) => {
              const txt = pr.texto || '';
              const prod = (txt.match(/Producto[:\s]*(.+)/i) || txt.match(/OPCIÓN\s*\d+[:\s]*(.+)/i) || ['',''])[1].trim().substring(0,30);
              return `<button class="btn-cargar-prop" data-idx="${i}" style="padding:5px 12px;border-radius:8px;border:1px solid #009DDD;background:#fff;color:#009DDD;cursor:pointer;font-size:11px;font-weight:600;font-family:inherit;">${prod || 'Propuesta ' + (i+1)}</button>`;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <!-- SECCIÓN A: Tomador -->
      <div class="card" style="padding:16px;margin-bottom:14px;">
        <div style="${sec}">${_ICO.nota(16,'#009DDD')} Datos del tomador</div>
        <label style="display:flex;align-items:center;gap:6px;margin-bottom:12px;font-size:12px;cursor:pointer;">
          <input type="checkbox" id="grab-empresa"> Póliza de empresa (CIF)
        </label>
        <div id="grab-tomador-persona" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div><label style="${lbl}">Nombre</label><input class="form-control" id="grab-nombre" value="${this._esc(p.nombre||'')}"></div>
          <div><label style="${lbl}">DNI/NIE</label><input class="form-control" id="grab-dni" value="${this._esc(p.dni||'')}"></div>
          <div><label style="${lbl}">F. nacimiento</label><input type="date" class="form-control" id="grab-fnac" value="${p.fecha_nacimiento ? p.fecha_nacimiento.split('T')[0] : ''}"></div>
          <div><label style="${lbl}">Sexo</label><select class="form-control" id="grab-sexo"><option value="">—</option><option value="H" ${p.sexo==='H'?'selected':''}>Hombre</option><option value="M" ${p.sexo==='M'?'selected':''}>Mujer</option></select></div>
          <div><label style="${lbl}">Dirección</label><input class="form-control" id="grab-dir" value="${this._esc(p.direccion||'')}"></div>
          <div><label style="${lbl}">CP</label><input class="form-control" id="grab-cp" value="${this._esc(p.codigo_postal||'')}"></div>
          <div><label style="${lbl}">Provincia</label><input class="form-control" id="grab-prov" value="${this._esc(p.provincia||'')}"></div>
          <div><label style="${lbl}">Localidad</label><input class="form-control" id="grab-loc" value="${this._esc(p.localidad||'')}"></div>
          <div><label style="${lbl}">Teléfono</label><input class="form-control" id="grab-tel" value="${this._esc(p.telefono||'')}"></div>
          <div><label style="${lbl}">Email</label><input class="form-control" id="grab-email" value="${this._esc(p.email||'')}"></div>
          <div style="grid-column:1/-1;"><label style="${lbl}">IBAN</label><input class="form-control" id="grab-iban" value="${this._esc(activeDeal?.iban||p.iban||'')}"></div>
        </div>
        <div id="grab-tomador-empresa" style="display:none;grid-template-columns:1fr 1fr;gap:10px;">
          <div><label style="${lbl}">CIF</label><input class="form-control" id="grab-cif"></div>
          <div><label style="${lbl}">Nombre empresa</label><input class="form-control" id="grab-empresa-nombre"></div>
          <div><label style="${lbl}">Representante legal</label><input class="form-control" id="grab-representante"></div>
          <div><label style="${lbl}">Dirección fiscal</label><input class="form-control" id="grab-dir-fiscal"></div>
          <div><label style="${lbl}">CP</label><input class="form-control" id="grab-cp-emp"></div>
          <div><label style="${lbl}">Provincia</label><input class="form-control" id="grab-prov-emp"></div>
          <div><label style="${lbl}">Teléfono</label><input class="form-control" id="grab-tel-emp"></div>
          <div><label style="${lbl}">Email</label><input class="form-control" id="grab-email-emp"></div>
          <div style="grid-column:1/-1;"><label style="${lbl}">IBAN</label><input class="form-control" id="grab-iban-emp"></div>
        </div>
      </div>

      <!-- SECCIÓN B: Asegurados / Mascotas (dinámico) -->
      <div class="card" style="padding:16px;margin-bottom:14px;" id="grab-seccion-b">
        <!-- Asegurados (salud, dental, decesos) -->
        <div id="grab-panel-asegurados">
          <div style="${sec}">${_ICO.añadir(16,'#10b981')} Asegurados</div>
          <div id="grab-asegurados">
            <div class="aseg-row" style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr 28px;gap:8px;align-items:end;margin-bottom:8px;">
              <div><label style="${lbl}">Nombre</label><input class="form-control aseg-nombre" value="${this._esc(p.nombre||'')}"></div>
              <div><label style="${lbl}">DNI</label><input class="form-control aseg-dni" value="${this._esc(p.dni||'')}"></div>
              <div><label style="${lbl}">F. nac.</label><input type="date" class="form-control aseg-fnac" value="${p.fecha_nacimiento ? p.fecha_nacimiento.split('T')[0] : ''}"></div>
              <div><label style="${lbl}">Sexo</label><select class="form-control aseg-sexo"><option value="">—</option><option value="H" ${p.sexo==='H'?'selected':''}>H</option><option value="M" ${p.sexo==='M'?'selected':''}>M</option></select></div>
              <div><label style="${lbl}">Parentesco</label><select class="form-control aseg-parentesco"><option>Titular</option><option>Cónyuge</option><option>Hijo/a</option><option>Familiar</option><option>Otro</option></select></div>
              <div></div>
            </div>
            ${familiares.map(f => `
              <div class="aseg-row" style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr 28px;gap:8px;align-items:end;margin-bottom:8px;">
                <div><input class="form-control aseg-nombre" value="${this._esc(f.nombre||'')}"></div>
                <div><input class="form-control aseg-dni" value="${this._esc(f.dni||'')}"></div>
                <div><input type="date" class="form-control aseg-fnac" value="${f.fecha_nacimiento ? f.fecha_nacimiento.split('T')[0] : ''}"></div>
                <div><select class="form-control aseg-sexo"><option value="">—</option><option value="H">H</option><option value="M">M</option></select></div>
                <div><select class="form-control aseg-parentesco"><option>Titular</option><option>Cónyuge</option><option selected>Hijo/a</option><option>Familiar</option><option>Otro</option></select></div>
                <button class="aseg-remove" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:16px;padding:0;" title="Quitar">×</button>
              </div>
            `).join('')}
          </div>
          <button id="btn-add-aseg" style="padding:6px 12px;border-radius:8px;border:1px dashed #009DDD;background:#e6f6fd;color:#009DDD;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit;margin-top:4px;">+ Añadir asegurado</button>
        </div>
        <!-- Mascotas (solo MASCOTAS) -->
        <div id="grab-panel-mascotas" style="display:none;">
          <div style="${sec}">${_ICO.polizas(16,'#f59e0b')} Mascotas</div>
          <div id="grab-mascotas">
            <div class="mascota-row" style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr 28px;gap:8px;align-items:end;margin-bottom:8px;">
              <div><label style="${lbl}">Nombre mascota</label><input class="form-control masc-nombre"></div>
              <div><label style="${lbl}">Tipo</label><select class="form-control masc-tipo"><option>Perro</option><option>Gato</option><option>Otro</option></select></div>
              <div><label style="${lbl}">Raza</label><input class="form-control masc-raza"></div>
              <div><label style="${lbl}">F. nac.</label><input type="date" class="form-control masc-fnac"></div>
              <div><label style="${lbl}">Nº Chip</label><input class="form-control masc-chip"></div>
              <div></div>
            </div>
          </div>
          <button id="btn-add-mascota" style="padding:6px 12px;border-radius:8px;border:1px dashed #f59e0b;background:#fffbeb;color:#f59e0b;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit;margin-top:4px;">+ Añadir mascota</button>
        </div>
      </div>

      <!-- SECCIÓN C: Datos póliza -->
      <div class="card" style="padding:16px;margin-bottom:14px;">
        <div style="${sec}">${_ICO.polizas(16,'#10b981')} Datos de la póliza</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          <div><label style="${lbl}">Tipo de póliza</label><input class="form-control" id="grab-tipo" value="${this._esc(activeDeal?.tipo_poliza||activeDeal?.producto||'')}"></div>
          <div><label style="${lbl}">Compañía</label>
            <select class="form-control" id="grab-compania">
              <option value="ADESLAS" ${(activeDeal?.compania||'').includes('ADESLAS')?'selected':''}>ADESLAS</option>
              <option value="DKV" ${(activeDeal?.compania||'').includes('DKV')?'selected':''}>DKV</option>
              <option value="ADESLAS DENTAL">ADESLAS DENTAL</option>
              <option value="ADESLAS DECESOS">ADESLAS DECESOS</option>
              <option value="ADESLAS MASCOTAS">ADESLAS MASCOTAS</option>
            </select>
          </div>
          <div><label style="${lbl}">Prima mensual (€)</label><input type="number" step="0.01" class="form-control" id="grab-prima" value="${activeDeal?.prima && activeDeal.prima <= 1000 ? activeDeal.prima : ''}"></div>
          <div><label style="${lbl}">Prima anual (auto)</label><input type="text" class="form-control" id="grab-prima-anual" readonly style="background:#f4f6f9;"></div>
          <div><label style="${lbl}">Nº Póliza</label><input class="form-control" id="grab-poliza" value="${this._esc(activeDeal?.poliza||'')}"></div>
          <div><label style="${lbl}">Nº Solicitud</label><input class="form-control" id="grab-solicitud" value="${this._esc(activeDeal?.num_solicitud||'')}"></div>
          <div><label style="${lbl}">Fecha efecto</label><input type="date" class="form-control" id="grab-efecto" value="${activeDeal?.fecha_efecto ? activeDeal.fecha_efecto.split('T')[0] : ''}"></div>
          <div><label style="${lbl}">Campaña / Puntos</label><input class="form-control" id="grab-campana" value=""></div>
        </div>
      </div>

      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button id="btn-grabar-save" style="padding:10px 28px;border-radius:9px;border:none;background:#10b981;color:#fff;cursor:pointer;font-size:14px;font-weight:700;font-family:inherit;">${_ICO.guardar(18,'#fff')} Guardar póliza</button>
      </div>
    `;

    // Toggle persona / empresa
    document.getElementById('grab-empresa')?.addEventListener('change', (e) => {
      document.getElementById('grab-tomador-persona').style.display = e.target.checked ? 'none' : 'grid';
      document.getElementById('grab-tomador-empresa').style.display = e.target.checked ? 'grid' : 'none';
    });

    // Precargar desde propuesta si hay datos
    const precarga = p._propuestaPrecarga;
    if (precarga) {
      if (precarga.tipo) document.getElementById('grab-tipo').value = precarga.tipo;
      if (precarga.prima) { document.getElementById('grab-prima').value = parseFloat(precarga.prima); }
      delete p._propuestaPrecarga;
    }

    // Toggle asegurados / mascotas según compañía o tipo
    const companiaSelect = document.getElementById('grab-compania');
    const tipoInput = document.getElementById('grab-tipo');
    const toggleSeccionB = () => {
      const comp = (companiaSelect.value || '').toUpperCase();
      const tipo = (tipoInput.value || '').toUpperCase();
      const isMascotas = comp.includes('MASCOTAS') || tipo.includes('MASCOTA');
      document.getElementById('grab-panel-asegurados').style.display = isMascotas ? 'none' : 'block';
      document.getElementById('grab-panel-mascotas').style.display = isMascotas ? 'block' : 'none';
    };
    companiaSelect.addEventListener('change', toggleSeccionB);
    tipoInput.addEventListener('input', toggleSeccionB);
    toggleSeccionB();

    // Añadir mascota
    document.getElementById('btn-add-mascota')?.addEventListener('click', () => {
      const container = document.getElementById('grab-mascotas');
      const row = document.createElement('div');
      row.className = 'mascota-row';
      row.style.cssText = 'display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr 28px;gap:8px;align-items:end;margin-bottom:8px;';
      row.innerHTML = `
        <div><input class="form-control masc-nombre" placeholder="Nombre"></div>
        <div><select class="form-control masc-tipo"><option>Perro</option><option>Gato</option><option>Otro</option></select></div>
        <div><input class="form-control masc-raza" placeholder="Raza"></div>
        <div><input type="date" class="form-control masc-fnac"></div>
        <div><input class="form-control masc-chip" placeholder="Nº chip"></div>
        <button class="masc-remove" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:16px;padding:0;">×</button>
      `;
      container.appendChild(row);
      row.querySelector('.masc-remove').addEventListener('click', () => row.remove());
    });

    // Auto-calcular prima anual
    const primaInput = document.getElementById('grab-prima');
    const anualInput = document.getElementById('grab-prima-anual');
    const calcAnual = () => {
      const v = parseFloat(primaInput.value);
      anualInput.value = v ? (v * 12).toFixed(2) + ' €' : '';
    };
    primaInput.addEventListener('input', calcAnual);
    calcAnual();

    // Añadir asegurado
    document.getElementById('btn-add-aseg').addEventListener('click', () => {
      const container = document.getElementById('grab-asegurados');
      const row = document.createElement('div');
      row.className = 'aseg-row';
      row.style.cssText = 'display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr 28px;gap:8px;align-items:end;margin-bottom:8px;';
      row.innerHTML = `
        <div><input class="form-control aseg-nombre" placeholder="Nombre"></div>
        <div><input class="form-control aseg-dni" placeholder="DNI"></div>
        <div><input type="date" class="form-control aseg-fnac"></div>
        <div><select class="form-control aseg-sexo"><option value="">—</option><option value="H">H</option><option value="M">M</option></select></div>
        <div><select class="form-control aseg-parentesco"><option>Titular</option><option>Cónyuge</option><option>Hijo/a</option><option>Familiar</option><option>Otro</option></select></div>
        <button class="aseg-remove" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:16px;padding:0;">×</button>
      `;
      container.appendChild(row);
      row.querySelector('.aseg-remove').addEventListener('click', () => row.remove());
    });

    // Quitar asegurado existente
    content.querySelectorAll('.aseg-remove').forEach(btn => {
      btn.addEventListener('click', () => btn.closest('.aseg-row').remove());
    });

    // Cargar propuesta
    content.querySelectorAll('.btn-cargar-prop').forEach(btn => {
      btn.addEventListener('click', () => {
        const pr = propuestas[parseInt(btn.dataset.idx)];
        const txt = pr.texto || '';
        const extract = (rx) => (txt.match(rx) || ['',''])[1].trim();
        const prod = extract(/Producto[:\s]*(.+)/i) || extract(/OPCIÓN\s*\d+[:\s]*(.+)/i);
        const precio = extract(/Precio[:\s]*(.+)/i) || extract(/Prima mensual[:\s]*(.+)/i);
        if (prod) document.getElementById('grab-tipo').value = prod;
        if (precio) {
          const n = parseFloat(precio.replace(/[€\s]/g, '').replace(',', '.'));
          if (!isNaN(n)) { primaInput.value = n; calcAnual(); }
        }
      });
    });

    // Abrir grabaciones iframe
    document.getElementById('btn-grabar-iframe').addEventListener('click', () => {
      const params = new URLSearchParams();
      if (activeDeal?.pipedrive_deal_id) params.set('deal_id', activeDeal.pipedrive_deal_id);
      else if (activeDeal?.pipedrive_id) params.set('deal_id', activeDeal.pipedrive_id);
      params.set('persona_id', p.id);
      const qs = params.toString() ? '?' + params.toString() : '';
      content.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
          <span style="font-size:16px;font-weight:700;display:flex;align-items:center;gap:6px;">${_ICO.grabar(20,'#ef4444')} Grabación completa</span>
          <button id="btn-volver-grabar2" style="margin-left:auto;padding:6px 12px;border-radius:8px;border:1px solid #e8edf2;background:#fff;color:#475569;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit;display:flex;align-items:center;gap:5px">${_ICO.volver(14,'#475569')} Volver</button>
        </div>
        <iframe src="/grabaciones/index.html${qs}" style="width:100%;height:calc(100vh - 240px);border:1px solid #e8edf2;border-radius:12px;"></iframe>`;
      document.getElementById('btn-volver-grabar2').addEventListener('click', () => this._openGrabarInline());
    });

    // GUARDAR — flujo completo
    document.getElementById('btn-grabar-save').addEventListener('click', async () => {
      const saveBtn = document.getElementById('btn-grabar-save');
      saveBtn.disabled = true;
      saveBtn.textContent = 'Guardando...';

      // Recoger asegurados
      const asegurados = [];
      document.querySelectorAll('.aseg-row').forEach(row => {
        const nombre = row.querySelector('.aseg-nombre')?.value?.trim();
        if (!nombre) return;
        asegurados.push({
          nombre,
          dni: row.querySelector('.aseg-dni')?.value?.trim() || null,
          fecha_nac: row.querySelector('.aseg-fnac')?.value || null,
          sexo: row.querySelector('.aseg-sexo')?.value || null,
          parentesco: row.querySelector('.aseg-parentesco')?.value || 'Titular',
        });
      });

      const data = {
        persona_id: p.id,
        deal_id: activeDeal?.id || null,
        // Tomador
        nombre: document.getElementById('grab-nombre')?.value || p.nombre,
        dni: document.getElementById('grab-dni')?.value || null,
        fecha_nacimiento: document.getElementById('grab-fnac')?.value || null,
        sexo: document.getElementById('grab-sexo')?.value || null,
        direccion: document.getElementById('grab-dir')?.value || null,
        codigo_postal: document.getElementById('grab-cp')?.value || null,
        provincia: document.getElementById('grab-prov')?.value || null,
        localidad: document.getElementById('grab-loc')?.value || null,
        telefono: document.getElementById('grab-tel')?.value || null,
        email: document.getElementById('grab-email')?.value || null,
        iban: document.getElementById('grab-iban')?.value || null,
        // Empresa
        es_empresa: document.getElementById('grab-empresa')?.checked || false,
        cif: document.getElementById('grab-cif')?.value || null,
        nombre_empresa: document.getElementById('grab-empresa-nombre')?.value || null,
        representante: document.getElementById('grab-representante')?.value || null,
        // Póliza
        tipo_poliza: document.getElementById('grab-tipo')?.value || null,
        compania: document.getElementById('grab-compania')?.value || 'ADESLAS',
        prima: parseFloat(document.getElementById('grab-prima')?.value) || null,
        poliza: document.getElementById('grab-poliza')?.value || null,
        num_solicitud: document.getElementById('grab-solicitud')?.value || null,
        fecha_efecto: document.getElementById('grab-efecto')?.value || null,
        campana: document.getElementById('grab-campana')?.value || null,
        // Asegurados
        asegurados,
        // Datos específicos (mascotas, etc.)
        datos_especificos: (() => {
          const mascotas = [];
          document.querySelectorAll('.mascota-row').forEach(row => {
            const nombre = row.querySelector('.masc-nombre')?.value?.trim();
            if (!nombre) return;
            mascotas.push({
              nombre,
              tipo: row.querySelector('.masc-tipo')?.value || 'Perro',
              raza: row.querySelector('.masc-raza')?.value || null,
              fecha_nac: row.querySelector('.masc-fnac')?.value || null,
              chip: row.querySelector('.masc-chip')?.value || null,
            });
          });
          return mascotas.length > 0 ? { mascotas } : null;
        })(),
      };

      try {
        await API.post('/pipeline/grabar-poliza', data);
        this.showFicha(p.id);
      } catch (err) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Guardar póliza';
        alert('Error: ' + err.message);
      }
    });

    // Volver
    document.getElementById('btn-volver-grabar').addEventListener('click', () => {
      const firstTab = document.querySelector('#persona-tabs .tab-btn');
      if (firstTab) { firstTab.style.color = 'var(--accent)'; firstTab.style.borderBottomColor = 'var(--accent)'; }
      this.renderTab('historial', p);
    });
  },

  // === TAB GRABACIONES (pólizas del CRM) ===
  async renderTabGrabaciones(content, p) {
    // Deals ganados = pólizas desde Pipedrive
    const dealsGanados = (p.deals || []).filter(d => d.pipedrive_status === 'won' || d.estado === 'poliza_activa');

    content.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h3 style="font-weight:700;font-size:16px;">Pólizas</h3>
        <a href="/grabaciones/?persona_id=${p.id}" target="_blank" class="btn btn-primary btn-sm" style="text-decoration:none;">+ Grabar póliza</a>
      </div>
      ${dealsGanados.length > 0 ? `
        <div style="margin-bottom:16px;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#94a3b8;margin-bottom:8px;">Pólizas activas (Pipedrive)</div>
          ${dealsGanados.map((d,i) => `<div class="poliza-card" style="background:#f0fdf4;border:1px solid #d1fae5;border-radius:10px;padding:12px;margin-bottom:8px;cursor:pointer;" onclick="const det=document.getElementById('polcard-${i}');det.style.display=det.style.display==='none'?'block':'none';this.querySelector('.polc-arrow').textContent=det.style.display==='none'?'▸':'▾';">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
              ${_ICO.polizas(16,'#10b981')}
              <span style="font-size:14px;font-weight:700;color:#065f46;">${this._esc(d.tipo_poliza || d.producto || 'Póliza')}</span>
              ${d.prima && d.prima <= 1000 ? `<span style="margin-left:auto;font-size:14px;font-weight:700;color:#009DDD;">${parseFloat(d.prima).toFixed(2)}€/mes</span>` : ''}
              <span class="polc-arrow" style="font-size:11px;color:#94a3b8;margin-left:${d.prima ? '8px' : 'auto'};">▸</span>
            </div>
            <div style="display:flex;gap:12px;font-size:12px;color:#475569;flex-wrap:wrap;">
              ${d.poliza ? `<span>Póliza: <strong>${this._esc(d.poliza)}</strong></span>` : '<span style="color:#94a3b8;">Nº póliza pendiente</span>'}
              ${d.num_solicitud ? `<span>Sol: ${this._esc(d.num_solicitud)}</span>` : ''}
              ${d.pipeline_nombre ? `<span>${d.pipeline_nombre}</span>` : ''}
            </div>
            <div id="polcard-${i}" style="display:none;margin-top:10px;padding-top:10px;border-top:1px solid #d1fae5;" onclick="event.stopPropagation();">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;">
                ${[
                  ['Tipo póliza', d.tipo_poliza || d.producto],
                  ['Compañía', d.compania],
                  ['Prima/mes', d.prima && d.prima <= 1000 ? parseFloat(d.prima).toFixed(2) + ' €' : null],
                  ['Nº Póliza', d.poliza],
                  ['Nº Solicitud', d.num_solicitud],
                  ['Fecha efecto', d.fecha_efecto ? new Date(d.fecha_efecto).toLocaleDateString('es-ES') : null],
                  ['IBAN', d.iban],
                  ['Pipeline', d.pipeline_nombre],
                  ['Etapa', d.etapa_nombre],
                  ['Agente', d.agente_nombre],
                  ['Descuento', d.descuento],
                  ['Forma pago', d.frecuencia_pago],
                  ['Observaciones', d.observaciones],
                ].filter(([,v]) => v).map(([l,v]) => `<div><span style="font-weight:600;color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:.5px;display:block;">${l}</span><span style="color:#0f172a;font-weight:500;">${this._esc(String(v))}</span></div>`).join('')}
              </div>
            </div>
          </div>`).join('')}
        </div>
      ` : ''}
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#94a3b8;margin-bottom:8px;">Grabaciones CRM</div>
      <div id="grabaciones-list"><p class="text-light">Cargando...</p></div>
    `;

    try {
      const polizas = await API.get('/grabaciones/polizas/persona/' + p.id);
      const listEl = document.getElementById('grabaciones-list');

      if (!polizas || polizas.length === 0) {
        listEl.innerHTML = dealsGanados.length > 0
          ? '<p class="text-light">Sin grabaciones adicionales en el CRM.</p>'
          : '<p class="text-light">Sin pólizas. Usa "Grabar póliza" para registrar una.</p>';
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
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Sexo</label>
              <select class="form-control" name="sexo">
                <option value="">—</option>
                <option value="H" ${isEdit && existing.sexo==='H'?'selected':''}>Hombre</option>
                <option value="M" ${isEdit && existing.sexo==='M'?'selected':''}>Mujer</option>
              </select>
            </div>
            <div class="form-group">
              <label>CP</label>
              <input type="text" class="form-control" name="codigo_postal" value="${isEdit ? (existing.codigo_postal || '') : ''}">
            </div>
          </div>
          <div class="form-group">
            <label>Dirección</label>
            <input type="text" class="form-control" name="direccion" value="${isEdit ? this._esc(existing.direccion || '') : ''}">
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Provincia</label>
              <input type="text" class="form-control" name="provincia" value="${isEdit ? (existing.provincia || '') : ''}">
            </div>
            <div class="form-group">
              <label>Localidad</label>
              <input type="text" class="form-control" name="localidad" value="${isEdit ? (existing.localidad || '') : ''}">
            </div>
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
        sexo: form.sexo.value || null,
        provincia: form.provincia.value.trim() || null,
        localidad: form.localidad.value.trim() || null,
        codigo_postal: form.codigo_postal.value.trim() || null,
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

// =============================================
// Modal WhatsApp — enviar texto y propuestas
// =============================================
function abrirModalWhatsApp(personaId, nombre, telefono) {
  document.getElementById('modal-whatsapp')?.remove();

  const modal = document.createElement('div');
  modal.id = 'modal-whatsapp';
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.5);
    display:flex;align-items:center;justify-content:center;z-index:9999
  `;
  modal.innerHTML = `
    <div style="background:#fff;border-radius:12px;padding:24px;width:480px;
      max-width:95vw;box-shadow:0 8px 32px rgba(0,0,0,0.15)">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
        <div style="width:36px;height:36px;background:#25D366;border-radius:50%;
          display:flex;align-items:center;justify-content:center">
          ${_ICO.whatsapp(18,'#fff')}
        </div>
        <div>
          <div style="font-weight:600;font-size:15px">${nombre}</div>
          <div style="font-size:12px;color:#666">${telefono}</div>
        </div>
        <button onclick="document.getElementById('modal-whatsapp').remove()"
          style="margin-left:auto;background:none;border:none;font-size:20px;
          cursor:pointer;color:#999">&times;</button>
      </div>

      <div style="margin-bottom:16px">
        <label style="font-size:13px;font-weight:500;display:block;margin-bottom:6px">
          Mensaje
        </label>
        <textarea id="wa-mensaje" rows="4"
          style="width:100%;border:1px solid #e0e0e0;border-radius:8px;padding:10px;
          font-size:14px;resize:vertical;box-sizing:border-box"
          placeholder="Escribe el mensaje..."></textarea>
      </div>

      <div id="wa-propuestas-container" style="margin-bottom:16px;display:none">
        <label style="font-size:13px;font-weight:500;display:block;margin-bottom:6px">
          O enviar propuesta PDF
        </label>
        <div id="wa-propuestas-lista"></div>
      </div>

      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button onclick="document.getElementById('modal-whatsapp').remove()"
          class="btn">Cancelar</button>
        <button onclick="enviarWhatsAppTexto(${personaId})"
          class="btn btn-success" id="btn-wa-enviar">
          Enviar mensaje
        </button>
      </div>
      <div id="wa-feedback" style="margin-top:12px;font-size:13px;text-align:center"></div>
    </div>
  `;
  document.body.appendChild(modal);
  cargarPropuestasParaWA(personaId);
}

async function cargarPropuestasParaWA(personaId) {
  try {
    const propuestas = await apiGet(`/api/calculadora/propuestas/persona/${personaId}`);
    if (!propuestas?.length) return;
    const container = document.getElementById('wa-propuestas-container');
    const lista = document.getElementById('wa-propuestas-lista');
    if (!container || !lista) return;
    const conPdf = propuestas.filter(p => p.pdf_url?.startsWith('https://'));
    if (!conPdf.length) return;
    container.style.display = 'block';
    lista.innerHTML = conPdf.map(p => `
      <div style="display:flex;align-items:center;justify-content:space-between;
        padding:8px 12px;border:1px solid #e0e0e0;border-radius:8px;margin-bottom:6px">
        <div>
          <div style="font-size:13px;font-weight:500">${p.tipo_poliza || 'Propuesta'}</div>
          <div style="font-size:12px;color:#666">${p.prima_mensual}\u20AC/mes</div>
        </div>
        <button onclick="enviarWhatsAppPropuesta(${personaId}, ${p.id})"
          class="btn btn-primary" style="font-size:12px;padding:4px 10px">
          Enviar PDF
        </button>
      </div>
    `).join('');
  } catch (e) {
    console.warn('No se pudieron cargar propuestas WA:', e);
  }
}

async function enviarWhatsAppTexto(personaId) {
  const mensaje  = document.getElementById('wa-mensaje')?.value?.trim();
  const feedback = document.getElementById('wa-feedback');
  const btn      = document.getElementById('btn-wa-enviar');
  if (!mensaje) {
    feedback.style.color = '#e53e3e';
    feedback.textContent = 'Escribe un mensaje antes de enviar';
    return;
  }
  btn.disabled = true;
  feedback.style.color = '#666';
  feedback.textContent = 'Enviando...';
  try {
    await apiPost('/api/whatsapp/send/texto', { persona_id: personaId, mensaje });
    feedback.style.color = '#25D366';
    feedback.textContent = 'Mensaje enviado correctamente';
    setTimeout(() => document.getElementById('modal-whatsapp')?.remove(), 1500);
    if (typeof PersonasModule !== 'undefined' && PersonasModule._currentPersona) {
      PersonasModule.renderTab('historial', PersonasModule._currentPersona);
    }
  } catch (e) {
    btn.disabled = false;
    feedback.style.color = '#e53e3e';
    feedback.textContent = `Error: ${e.message}`;
  }
}

async function enviarWhatsAppPropuesta(personaId, propuestaId) {
  const feedback = document.getElementById('wa-feedback');
  feedback.style.color = '#666';
  feedback.textContent = 'Enviando propuesta...';
  try {
    await apiPost('/api/whatsapp/send/propuesta', { persona_id: personaId, propuesta_id: propuestaId });
    feedback.style.color = '#25D366';
    feedback.textContent = 'Propuesta enviada por WhatsApp';
    setTimeout(() => document.getElementById('modal-whatsapp')?.remove(), 1500);
    if (typeof PersonasModule !== 'undefined' && PersonasModule._currentPersona) {
      PersonasModule.renderTab('historial', PersonasModule._currentPersona);
    }
  } catch (e) {
    feedback.style.color = '#e53e3e';
    feedback.textContent = `Error: ${e.message}`;
  }
}
