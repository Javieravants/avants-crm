// === Módulo Informes — Rediseño completo ===

const InformesModule = {
  tab: 'todos',
  page: 1,
  filters: {},
  filterOptions: null,

  async render() {
    const now = new Date();
    this.filters = {
      desde: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
      hasta: now.toISOString().split('T')[0],
    };
    this.tab = 'todos';
    this.page = 1;

    const c = document.getElementById('main-content');
    c.innerHTML = `
      <h1 class="page-title" style="margin-bottom:16px;">Informes</h1>

      <!-- FILTROS -->
      <div class="card" style="margin-bottom:14px;padding:14px 16px;">
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
          <input type="date" id="inf-desde" class="form-control" style="max-width:150px;font-size:12px;" value="${this.filters.desde}">
          <input type="date" id="inf-hasta" class="form-control" style="max-width:150px;font-size:12px;" value="${this.filters.hasta}">
          <div style="display:flex;gap:3px;" id="inf-periods"></div>
          <select class="form-control" id="inf-agente" style="max-width:170px;font-size:12px;"><option value="">Agente</option></select>
          <select class="form-control" id="inf-pipeline" style="max-width:150px;font-size:12px;"><option value="">Pipeline</option></select>
          <select class="form-control" id="inf-etiqueta" style="max-width:150px;font-size:12px;"><option value="">Etiqueta</option></select>
          <select class="form-control" id="inf-status" style="max-width:130px;font-size:12px;">
            <option value="">Estado</option>
            <option value="won">Ganados</option>
            <option value="lost">Perdidos</option>
            <option value="open">Activos</option>
          </select>
        </div>
      </div>

      <!-- KPIs -->
      <div id="inf-kpis" style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:14px;"></div>

      <!-- TABS -->
      <div class="card" style="padding:0;margin-bottom:14px;">
        <div id="inf-tabs" style="display:flex;border-bottom:1px solid #e8edf2;overflow-x:auto;"></div>
      </div>

      <!-- TABLA -->
      <div class="card" style="padding:14px 16px;">
        <div id="inf-table-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;"></div>
        <div id="inf-table-body"></div>
        <div id="inf-pagination" style="display:flex;justify-content:center;gap:6px;margin-top:14px;"></div>
      </div>
    `;

    this._renderPeriods();
    this._renderTabs();
    this._bindFilters();
    await this._loadFilterOptions();
    this._refresh();
  },

  _renderPeriods() {
    const periods = [
      { key: 'today', label: 'Hoy' },
      { key: 'week', label: 'Semana' },
      { key: 'month', label: 'Mes', active: true },
      { key: 'year', label: 'Año' },
    ];
    document.getElementById('inf-periods').innerHTML = periods.map(p =>
      `<button class="inf-per" data-p="${p.key}" style="padding:4px 10px;border-radius:6px;border:1px solid #e8edf2;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;background:${p.active ? '#e6f6fd' : '#fff'};color:${p.active ? '#009DDD' : '#475569'};">${p.label}</button>`
    ).join('');

    document.getElementById('inf-periods').addEventListener('click', (e) => {
      const btn = e.target.closest('.inf-per');
      if (!btn) return;
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      let desde = today;
      if (btn.dataset.p === 'week') { const d = new Date(now); d.setDate(d.getDate() - d.getDay() + 1); desde = d.toISOString().split('T')[0]; }
      else if (btn.dataset.p === 'month') { desde = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]; }
      else if (btn.dataset.p === 'year') { desde = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]; }
      this.filters.desde = desde; this.filters.hasta = today;
      document.getElementById('inf-desde').value = desde;
      document.getElementById('inf-hasta').value = today;
      document.querySelectorAll('.inf-per').forEach(b => { b.style.background = '#fff'; b.style.color = '#475569'; });
      btn.style.background = '#e6f6fd'; btn.style.color = '#009DDD';
      this.page = 1; this._refresh();
    });
  },

  _renderTabs() {
    const tabs = [
      { key: 'todos', label: 'Todos los leads' },
      { key: 'ganados', label: 'Ganados' },
      { key: 'perdidos', label: 'Perdidos' },
      { key: 'activos', label: 'Activos' },
      { key: 'mrr', label: 'MRR-Primas' },
      { key: 'agentes', label: 'Por agente' },
    ];
    document.getElementById('inf-tabs').innerHTML = tabs.map(t =>
      `<button class="inf-tab" data-tab="${t.key}" style="padding:11px 18px;font-size:13px;font-weight:600;border:none;background:none;cursor:pointer;border-bottom:2px solid ${t.key === this.tab ? 'var(--accent)' : 'transparent'};color:${t.key === this.tab ? 'var(--accent)' : '#94a3b8'};white-space:nowrap;font-family:inherit;">${t.label}</button>`
    ).join('');

    document.getElementById('inf-tabs').addEventListener('click', (e) => {
      const btn = e.target.closest('.inf-tab');
      if (!btn) return;
      this.tab = btn.dataset.tab;
      this.page = 1;
      document.querySelectorAll('.inf-tab').forEach(b => { b.style.color = '#94a3b8'; b.style.borderBottomColor = 'transparent'; });
      btn.style.color = 'var(--accent)'; btn.style.borderBottomColor = 'var(--accent)';
      this._loadTable();
    });
  },

  _bindFilters() {
    const refresh = () => { this.page = 1; this._refresh(); };
    document.getElementById('inf-desde').addEventListener('change', (e) => { this.filters.desde = e.target.value; refresh(); });
    document.getElementById('inf-hasta').addEventListener('change', (e) => { this.filters.hasta = e.target.value; refresh(); });
    document.getElementById('inf-agente').addEventListener('change', (e) => { this.filters.agente_id = e.target.value; refresh(); });
    document.getElementById('inf-pipeline').addEventListener('change', (e) => { this.filters.pipeline_id = e.target.value; refresh(); });
    document.getElementById('inf-etiqueta').addEventListener('change', (e) => { this.filters.etiqueta_id = e.target.value; refresh(); });
    document.getElementById('inf-status').addEventListener('change', (e) => { this.filters.status = e.target.value; refresh(); });
  },

  async _loadFilterOptions() {
    try {
      const data = await API.get('/informes/filtros');
      this.filterOptions = data;
      const agSel = document.getElementById('inf-agente');
      data.agentes.forEach(a => { const o = document.createElement('option'); o.value = a.id; o.textContent = a.nombre; agSel.appendChild(o); });
      const piSel = document.getElementById('inf-pipeline');
      data.pipelines.forEach(p => { const o = document.createElement('option'); o.value = p.id; o.textContent = p.name; piSel.appendChild(o); });
      const etSel = document.getElementById('inf-etiqueta');
      data.etiquetas.forEach(e => { const o = document.createElement('option'); o.value = e.id; o.textContent = e.nombre; etSel.appendChild(o); });
    } catch {}
  },

  _qs() {
    let q = '';
    if (this.filters.desde) q += `&desde=${this.filters.desde}`;
    if (this.filters.hasta) q += `&hasta=${this.filters.hasta}`;
    if (this.filters.agente_id) q += `&agente_id=${this.filters.agente_id}`;
    if (this.filters.pipeline_id) q += `&pipeline_id=${this.filters.pipeline_id}`;
    if (this.filters.etiqueta_id) q += `&etiqueta_id=${this.filters.etiqueta_id}`;
    if (this.filters.status) q += `&status=${this.filters.status}`;
    return q.substring(1);
  },

  async _refresh() {
    this._loadKPIs();
    this._loadTable();
  },

  // =============================================
  // KPIs
  // =============================================
  async _loadKPIs() {
    const el = document.getElementById('inf-kpis');
    try {
      const d = await API.get(`/informes/kpis?${this._qs()}`);
      const kpis = [
        { label: 'Leads recibidos', val: d.leads.toLocaleString('es-ES'), color: '#009DDD' },
        { label: 'Ganados', val: d.ganados.toLocaleString('es-ES'), color: '#10b981' },
        { label: 'Perdidos', val: d.perdidos.toLocaleString('es-ES'), color: '#ef4444' },
        { label: 'Conversión', val: d.conversion + '%', color: '#8b5cf6' },
        { label: 'Prima ganada', val: this._money(d.prima_total), color: '#10b981' },
      ];
      el.innerHTML = kpis.map(k => `
        <div class="card" style="text-align:center;padding:16px 10px;">
          <div style="font-size:24px;font-weight:800;color:${k.color};">${k.val}</div>
          <div style="font-size:11px;font-weight:600;color:#94a3b8;margin-top:3px;">${k.label}</div>
        </div>
      `).join('');
    } catch (err) {
      el.innerHTML = `<div class="card" style="grid-column:1/-1;color:#ef4444;font-size:13px;">Error: ${err.message}</div>`;
    }
  },

  // =============================================
  // TABLA
  // =============================================
  async _loadTable() {
    const header = document.getElementById('inf-table-header');
    const body = document.getElementById('inf-table-body');
    const pag = document.getElementById('inf-pagination');
    body.innerHTML = '<p class="text-light" style="font-size:13px;">Cargando...</p>';

    try {
      const data = await API.get(`/informes/leads?${this._qs()}&tab=${this.tab}&page=${this.page}&limit=50`);

      if (data.type === 'agentes') return this._renderAgentes(data.rows, header, body, pag);
      if (data.type === 'mrr') return this._renderMRR(data.rows, header, body, pag);

      const { rows, totals, pagination } = data;
      const activeFilters = this._describeFilters();

      // Header
      header.innerHTML = `
        <div style="font-size:13px;color:#94a3b8;">${pagination.total.toLocaleString('es-ES')} resultados${activeFilters ? ' · ' + activeFilters : ''}</div>
        <div style="display:flex;gap:6px;">
          <button id="btn-exp-csv" style="padding:5px 12px;border-radius:8px;border:1px solid #e8edf2;background:#fff;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;color:#475569;">Exportar CSV</button>
          <button id="btn-exp-xlsx" style="padding:5px 12px;border-radius:8px;border:none;background:#10b981;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;color:#fff;">Exportar Excel</button>
        </div>
      `;
      document.getElementById('btn-exp-csv').addEventListener('click', () => this._export('csv'));
      document.getElementById('btn-exp-xlsx').addEventListener('click', () => this._export('xlsx'));

      if (rows.length === 0) {
        body.innerHTML = '<p class="text-light" style="text-align:center;padding:32px;font-size:13px;">Sin resultados para estos filtros</p>';
        pag.innerHTML = '';
        return;
      }

      // Tabla
      body.innerHTML = `
        <div class="table-wrapper">
          <table style="font-size:12px;">
            <thead>
              <tr>
                <th>Contacto</th><th>Teléfono</th><th>Email</th><th>Agente</th>
                <th>Pipeline</th><th>Etiqueta</th><th>Estado</th><th>Tipo póliza</th>
                <th style="text-align:right">Prima</th><th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(r => `
                <tr style="cursor:pointer" onclick="App.navigate('personas');setTimeout(()=>PersonasModule.showFicha(${r.persona_id}),200)">
                  <td><strong>${this._esc(r.contacto || '—')}</strong></td>
                  <td>${r.telefono || '<span class="text-light">—</span>'}</td>
                  <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;">${r.email || '<span class="text-light">—</span>'}</td>
                  <td>${r.agente_nombre ? `<span style="display:inline-flex;align-items:center;gap:4px;"><span style="width:18px;height:18px;border-radius:50%;background:${r.avatar_color || '#009DDD'};color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;">${this._initials(r.agente_nombre)}</span>${this._esc(r.agente_nombre)}</span>` : '<span class="text-light">—</span>'}</td>
                  <td>${r.pipeline_nombre ? `<span style="display:inline-flex;align-items:center;gap:4px;"><span style="width:8px;height:8px;border-radius:50%;background:${r.pipeline_color || '#94a3b8'}"></span>${this._esc(r.pipeline_nombre)}</span>` : '<span class="text-light">—</span>'}</td>
                  <td>${r.etiqueta_nombre ? `<span style="background:#f4f6f9;color:#475569;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600;">${this._esc(r.etiqueta_nombre)}</span>` : ''}</td>
                  <td>${this._statusBadge(r.status)}</td>
                  <td>${this._esc(r.tipo_poliza || r.producto || '—')}</td>
                  <td style="text-align:right;font-weight:600;${r.prima > 0 && r.prima <= 1000 ? 'color:#10b981' : ''}">${r.prima > 0 && r.prima <= 1000 ? parseFloat(r.prima).toFixed(2) + ' €' : '<span class="text-light">—</span>'}</td>
                  <td style="white-space:nowrap;">${r.created_at ? new Date(r.created_at).toLocaleDateString('es-ES') : '—'}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="font-weight:700;background:#f4f6f9;">
                <td colspan="6">Total</td>
                <td>${parseInt(totals.ganados)} ganados · ${parseInt(totals.perdidos)} perdidos</td>
                <td></td>
                <td style="text-align:right;color:#10b981;">${this._money(parseFloat(totals.prima_ganada))}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      `;

      // Paginación
      this._renderPagination(pag, pagination);
    } catch (err) {
      body.innerHTML = `<p style="color:#ef4444;font-size:13px;">${err.message}</p>`;
    }
  },

  _renderAgentes(rows, header, body, pag) {
    header.innerHTML = `<div style="font-size:13px;color:#94a3b8;">${rows.length} agentes</div><div></div>`;
    pag.innerHTML = '';
    body.innerHTML = `
      <div class="table-wrapper">
        <table style="font-size:12px;">
          <thead><tr><th>Agente</th><th style="text-align:center">Total</th><th style="text-align:center">Ganados</th><th style="text-align:center">Perdidos</th><th style="text-align:center">Activos</th><th style="text-align:right">Prima ganada</th></tr></thead>
          <tbody>
            ${rows.map(a => `
              <tr>
                <td><span style="display:inline-flex;align-items:center;gap:6px;"><span style="width:24px;height:24px;border-radius:50%;background:${a.avatar_color || '#009DDD'};color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;">${this._initials(a.nombre)}</span><strong>${this._esc(a.nombre)}</strong></span></td>
                <td style="text-align:center">${a.total_deals}</td>
                <td style="text-align:center;color:#10b981;font-weight:700;">${a.ganados}</td>
                <td style="text-align:center;color:#ef4444;">${a.perdidos}</td>
                <td style="text-align:center;color:#009DDD;">${a.activos}</td>
                <td style="text-align:right;font-weight:700;color:#10b981;">${this._money(parseFloat(a.prima_ganada))}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  _renderMRR(rows, header, body, pag) {
    const total = rows.reduce((s, r) => s + parseFloat(r.prima_total), 0);
    header.innerHTML = `<div style="font-size:13px;color:#94a3b8;">MRR total: <strong style="color:#10b981;">${this._money(total)}</strong></div><div></div>`;
    pag.innerHTML = '';
    body.innerHTML = `
      <div class="table-wrapper">
        <table style="font-size:12px;">
          <thead><tr><th>Pipeline</th><th style="text-align:center">Pólizas</th><th style="text-align:right">Prima total</th><th style="text-align:right">Prima media</th></tr></thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                <td><span style="display:inline-flex;align-items:center;gap:6px;"><span style="width:10px;height:10px;border-radius:50%;background:${r.color || '#94a3b8'}"></span><strong>${this._esc(r.pipeline || 'Sin pipeline')}</strong></span></td>
                <td style="text-align:center">${r.total}</td>
                <td style="text-align:right;font-weight:700;color:#10b981;">${this._money(parseFloat(r.prima_total))}</td>
                <td style="text-align:right">${this._money(parseFloat(r.prima_media || 0))}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  _renderPagination(el, p) {
    if (p.pages <= 1) { el.innerHTML = ''; return; }
    let html = '';
    if (p.page > 1) html += `<button class="inf-page" data-p="${p.page - 1}" style="padding:4px 10px;border-radius:6px;border:1px solid #e8edf2;background:#fff;font-size:11px;cursor:pointer;font-family:inherit;">Anterior</button>`;
    const start = Math.max(1, p.page - 2);
    const end = Math.min(p.pages, p.page + 2);
    for (let i = start; i <= end; i++) {
      html += `<button class="inf-page" data-p="${i}" style="padding:4px 10px;border-radius:6px;border:1px solid ${i === p.page ? '#009DDD' : '#e8edf2'};background:${i === p.page ? '#009DDD' : '#fff'};color:${i === p.page ? '#fff' : '#475569'};font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;">${i}</button>`;
    }
    if (p.page < p.pages) html += `<button class="inf-page" data-p="${p.page + 1}" style="padding:4px 10px;border-radius:6px;border:1px solid #e8edf2;background:#fff;font-size:11px;cursor:pointer;font-family:inherit;">Siguiente</button>`;
    el.innerHTML = html;
    el.querySelectorAll('.inf-page').forEach(btn => {
      btn.addEventListener('click', () => { this.page = parseInt(btn.dataset.p); this._loadTable(); });
    });
  },

  // =============================================
  // EXPORTAR
  // =============================================
  async _export(formato) {
    try {
      const token = Auth.getToken();
      const url = `/api/informes/exportar?${this._qs()}&tab=${this.tab}&formato=${formato}`;
      const resp = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!resp.ok) { const e = await resp.json(); throw new Error(e.error || 'Error'); }
      const blob = await resp.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `informes_export.${formato === 'xlsx' ? 'xlsx' : 'csv'}`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      alert('Error exportando: ' + err.message);
    }
  },

  // =============================================
  // HELPERS
  // =============================================
  _statusBadge(s) {
    if (s === 'won') return '<span style="background:#d1fae5;color:#065f46;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;">Ganado</span>';
    if (s === 'lost') return '<span style="background:#fee2e2;color:#991b1b;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;">Perdido</span>';
    return '<span style="background:#e6f6fd;color:#007ab8;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;">Activo</span>';
  },

  _describeFilters() {
    const parts = [];
    if (this.filters.agente_id) {
      const a = this.filterOptions?.agentes?.find(a => a.id == this.filters.agente_id);
      if (a) parts.push(a.nombre);
    }
    if (this.filters.pipeline_id) {
      const p = this.filterOptions?.pipelines?.find(p => p.id == this.filters.pipeline_id);
      if (p) parts.push(p.name);
    }
    if (this.filters.status) {
      parts.push({ won: 'Ganados', lost: 'Perdidos', open: 'Activos' }[this.filters.status] || this.filters.status);
    }
    return parts.join(' · ');
  },

  _initials(n) { return (n || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase(); },
  _esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; },
  _money(n) {
    if (!n || isNaN(n)) return '0 €';
    return parseFloat(n).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  },
};
