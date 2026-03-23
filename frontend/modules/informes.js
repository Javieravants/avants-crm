// === Módulo Informes ===

const InformesModule = {
  activeTab: 'resumen',
  filters: {
    desde: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    hasta: new Date().toISOString().split('T')[0],
  },

  async render() {
    const container = document.getElementById('main-content');
    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <h1 class="page-title" style="margin-bottom:0;">Informes</h1>
      </div>

      <!-- Tabs -->
      <div class="card" style="padding:0;margin-bottom:16px;">
        <div id="informes-tabs" style="display:flex;border-bottom:1px solid #e8edf2;overflow-x:auto;">
          <button class="inf-tab active" data-tab="resumen" style="padding:12px 20px;font-size:13px;font-weight:600;border:none;background:none;cursor:pointer;border-bottom:2px solid var(--accent);color:var(--accent);white-space:nowrap;font-family:inherit;">Resumen</button>
          <button class="inf-tab" data-tab="deals" style="padding:12px 20px;font-size:13px;font-weight:600;border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;color:#94a3b8;white-space:nowrap;font-family:inherit;">Ganados / Perdidos</button>
          <button class="inf-tab" data-tab="mrr" style="padding:12px 20px;font-size:13px;font-weight:600;border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;color:#94a3b8;white-space:nowrap;font-family:inherit;">MRR — Primas</button>
          <button class="inf-tab" data-tab="agentes" style="padding:12px 20px;font-size:13px;font-weight:600;border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;color:#94a3b8;white-space:nowrap;font-family:inherit;">Actividad agentes</button>
          <button class="inf-tab" data-tab="exportar" style="padding:12px 20px;font-size:13px;font-weight:600;border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;color:#94a3b8;white-space:nowrap;font-family:inherit;">Exportar / Importar</button>
        </div>
      </div>

      <!-- Filtros globales -->
      <div class="card" style="margin-bottom:16px;" id="informes-filters">
        <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;">
          <div style="display:flex;align-items:center;gap:6px;">
            <label style="font-size:12px;font-weight:600;color:#475569;">Desde</label>
            <input type="date" id="inf-desde" class="form-control" style="max-width:160px;" value="${this.filters.desde}">
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <label style="font-size:12px;font-weight:600;color:#475569;">Hasta</label>
            <input type="date" id="inf-hasta" class="form-control" style="max-width:160px;" value="${this.filters.hasta}">
          </div>
          <select class="form-control" id="inf-agente" style="max-width:180px;">
            <option value="">Todos los agentes</option>
          </select>
          <select class="form-control" id="inf-pipeline" style="max-width:180px;">
            <option value="">Todos los pipelines</option>
          </select>
          <select class="form-control" id="inf-etiqueta" style="max-width:180px;">
            <option value="">Todas las etiquetas</option>
          </select>
          <!-- Atajos de periodo -->
          <div style="display:flex;gap:4px;">
            <button class="inf-period" data-period="today" style="padding:4px 10px;border-radius:6px;border:1px solid #e8edf2;background:#fff;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;color:#475569;">Hoy</button>
            <button class="inf-period" data-period="week" style="padding:4px 10px;border-radius:6px;border:1px solid #e8edf2;background:#fff;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;color:#475569;">Semana</button>
            <button class="inf-period" data-period="month" style="padding:4px 10px;border-radius:6px;border:1px solid #e8edf2;background:#e6f6fd;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;color:#009DDD;">Mes</button>
            <button class="inf-period" data-period="year" style="padding:4px 10px;border-radius:6px;border:1px solid #e8edf2;background:#fff;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;color:#475569;">Año</button>
          </div>
        </div>
      </div>

      <!-- Contenido del tab -->
      <div id="informes-content"></div>
    `;

    // Cargar opciones de filtros
    this._loadFilterOptions();

    // Event listeners
    document.getElementById('informes-tabs').addEventListener('click', (e) => {
      const btn = e.target.closest('.inf-tab');
      if (!btn) return;
      document.querySelectorAll('.inf-tab').forEach(b => {
        b.style.color = '#94a3b8';
        b.style.borderBottomColor = 'transparent';
      });
      btn.style.color = 'var(--accent)';
      btn.style.borderBottomColor = 'var(--accent)';
      this.activeTab = btn.dataset.tab;
      this._renderTab();
    });

    // Filtros de fecha
    document.getElementById('inf-desde').addEventListener('change', (e) => { this.filters.desde = e.target.value; this._renderTab(); });
    document.getElementById('inf-hasta').addEventListener('change', (e) => { this.filters.hasta = e.target.value; this._renderTab(); });
    document.getElementById('inf-agente').addEventListener('change', (e) => { this.filters.agente_id = e.target.value; this._renderTab(); });
    document.getElementById('inf-pipeline').addEventListener('change', (e) => { this.filters.pipeline_id = e.target.value; this._renderTab(); });
    document.getElementById('inf-etiqueta').addEventListener('change', (e) => { this.filters.etiqueta_id = e.target.value; this._renderTab(); });

    // Atajos de periodo
    document.querySelectorAll('.inf-period').forEach(btn => {
      btn.addEventListener('click', () => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        let desde = today;

        if (btn.dataset.period === 'week') {
          const d = new Date(now);
          d.setDate(d.getDate() - d.getDay() + 1);
          desde = d.toISOString().split('T')[0];
        } else if (btn.dataset.period === 'month') {
          desde = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        } else if (btn.dataset.period === 'year') {
          desde = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        }

        this.filters.desde = desde;
        this.filters.hasta = today;
        document.getElementById('inf-desde').value = desde;
        document.getElementById('inf-hasta').value = today;

        document.querySelectorAll('.inf-period').forEach(b => {
          b.style.background = '#fff'; b.style.color = '#475569';
        });
        btn.style.background = '#e6f6fd'; btn.style.color = '#009DDD';

        this._renderTab();
      });
    });

    this._renderTab();
  },

  async _loadFilterOptions() {
    try {
      const [users, pipelines, etiquetas] = await Promise.all([
        API.get('/auth/users'),
        API.get('/pipeline/pipelines'),
        API.get('/etiquetas'),
      ]);

      const agSel = document.getElementById('inf-agente');
      users.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id; opt.textContent = u.nombre;
        agSel.appendChild(opt);
      });

      const plSel = document.getElementById('inf-pipeline');
      const plList = Array.isArray(pipelines) ? pipelines : (pipelines?.pipelines || []);
      plList.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id; opt.textContent = p.nombre || p.name;
        plSel.appendChild(opt);
      });

      const etqSel = document.getElementById('inf-etiqueta');
      etiquetas.forEach(e => {
        const opt = document.createElement('option');
        opt.value = e.id; opt.textContent = e.nombre;
        etqSel.appendChild(opt);
      });
    } catch {}
  },

  _qs() {
    let q = `desde=${this.filters.desde}&hasta=${this.filters.hasta}`;
    if (this.filters.agente_id) q += `&agente_id=${this.filters.agente_id}`;
    if (this.filters.pipeline_id) q += `&pipeline_id=${this.filters.pipeline_id}`;
    if (this.filters.etiqueta_id) q += `&etiqueta_id=${this.filters.etiqueta_id}`;
    return q;
  },

  async _renderTab() {
    const el = document.getElementById('informes-content');
    el.innerHTML = '<div class="card"><p class="text-light">Cargando...</p></div>';

    try {
      switch (this.activeTab) {
        case 'resumen': await this._renderResumen(el); break;
        case 'deals': await this._renderDeals(el); break;
        case 'mrr': await this._renderMRR(el); break;
        case 'agentes': await this._renderAgentes(el); break;
        case 'exportar': this._renderExportar(el); break;
      }
    } catch (err) {
      el.innerHTML = `<div class="card"><p style="color:#ef4444">${err.message}</p></div>`;
    }
  },

  // === TAB 1: Resumen ===
  async _renderResumen(el) {
    const data = await API.get(`/informes/resumen?${this._qs()}`);

    const kpis = [
      { label: 'Leads recibidos', value: data.leads, color: '#009DDD', icon: 'pipeline' },
      { label: 'Deals ganados', value: data.ganados, color: '#10b981', icon: 'polizas' },
      { label: 'Importe ganado', value: this._money(data.importe_ganado), color: '#10b981', icon: null },
      { label: 'Deals perdidos', value: data.perdidos, color: '#ef4444', icon: null },
      { label: 'Tasa conversión', value: data.tasa_conversion + '%', color: '#8b5cf6', icon: null },
      { label: 'MRR activo', value: this._money(data.mrr), color: '#009DDD', icon: 'informes' },
      { label: 'Llamadas', value: data.llamadas, color: '#f59e0b', icon: 'llamada' },
    ];

    el.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;">
        ${kpis.map(k => `
          <div class="card" style="text-align:center;padding:20px 14px;">
            ${k.icon && typeof Icons !== 'undefined' && Icons[k.icon] ? `<div style="margin-bottom:8px;opacity:.5;">${Icons[k.icon](28, k.color)}</div>` : ''}
            <div style="font-size:28px;font-weight:800;color:${k.color};">${k.value}</div>
            <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-top:4px;">${k.label}</div>
          </div>
        `).join('')}
      </div>
    `;
  },

  // === TAB 2: Ganados / Perdidos ===
  async _renderDeals(el) {
    const wonData = await API.get(`/informes/deals?status=won&${this._qs()}&limit=50`);
    const lostData = await API.get(`/informes/deals?status=lost&${this._qs()}&limit=50`);

    el.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        <!-- Ganados -->
        <div class="card">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
            <span style="width:10px;height:10px;border-radius:50%;background:#10b981"></span>
            <strong style="font-size:14px;">Ganados (${wonData.pagination.total})</strong>
          </div>
          <div class="table-wrapper">
            <table>
              <thead><tr><th>Fecha</th><th>Contacto</th><th>Pipeline</th><th>Prima</th><th>Agente</th></tr></thead>
              <tbody>
                ${wonData.deals.length === 0 ? '<tr><td colspan="5" class="text-center text-light">Sin deals ganados</td></tr>' :
                  wonData.deals.map(d => `
                    <tr style="cursor:pointer" onclick="App.navigate('personas');setTimeout(()=>PersonasModule.showFicha(${d.persona_id}),200)">
                      <td style="font-size:12px;">${this._date(d.updated_at)}</td>
                      <td><strong>${this._esc(d.contacto || '—')}</strong></td>
                      <td><span style="font-size:11px;color:#94a3b8;">${this._esc(d.pipeline || '')}</span></td>
                      <td style="font-weight:700;color:#10b981;">${d.prima ? parseFloat(d.prima).toFixed(2) + ' €' : '—'}</td>
                      <td style="font-size:12px;">${this._esc(d.agente || '—')}</td>
                    </tr>
                  `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Perdidos -->
        <div class="card">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
            <span style="width:10px;height:10px;border-radius:50%;background:#ef4444"></span>
            <strong style="font-size:14px;">Perdidos (${lostData.pagination.total})</strong>
          </div>
          <div class="table-wrapper">
            <table>
              <thead><tr><th>Fecha</th><th>Contacto</th><th>Pipeline</th><th>Prima</th><th>Agente</th></tr></thead>
              <tbody>
                ${lostData.deals.length === 0 ? '<tr><td colspan="5" class="text-center text-light">Sin deals perdidos</td></tr>' :
                  lostData.deals.map(d => `
                    <tr style="cursor:pointer" onclick="App.navigate('personas');setTimeout(()=>PersonasModule.showFicha(${d.persona_id}),200)">
                      <td style="font-size:12px;">${this._date(d.updated_at)}</td>
                      <td><strong>${this._esc(d.contacto || '—')}</strong></td>
                      <td><span style="font-size:11px;color:#94a3b8;">${this._esc(d.pipeline || '')}</span></td>
                      <td style="font-size:12px;">${d.prima ? parseFloat(d.prima).toFixed(2) + ' €' : '—'}</td>
                      <td style="font-size:12px;">${this._esc(d.agente || '—')}</td>
                    </tr>
                  `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  // === TAB 3: MRR ===
  async _renderMRR(el) {
    const data = await API.get('/informes/mrr');

    // Gráfico de barras simple con CSS
    const maxVal = Math.max(...data.mensual.map(m => parseFloat(m.total)), 1);

    el.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
        <div class="card" style="text-align:center;">
          <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:8px;">MRR Total (Primas activas)</div>
          <div style="font-size:32px;font-weight:800;color:#009DDD;">${this._money(data.mrr_total)}</div>
        </div>
        <div class="card">
          <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;">Desglose por pipeline</div>
          ${data.por_pipeline.map(p => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #f4f6f9;">
              <span style="font-size:13px;font-weight:600;">${this._esc(p.pipeline || 'Sin pipeline')}</span>
              <span style="font-size:13px;font-weight:700;color:#009DDD;">${this._money(parseFloat(p.total))}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Gráfico de barras mensual -->
      <div class="card">
        <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:14px;">Primas mensuales (últimos 12 meses)</div>
        <div style="display:flex;align-items:flex-end;gap:6px;height:200px;padding-top:10px;">
          ${data.mensual.map(m => {
            const pct = (parseFloat(m.total) / maxVal) * 100;
            const mes = m.mes.split('-')[1];
            const meses = ['','Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
            return `
              <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;">
                <div style="font-size:10px;font-weight:700;color:#009DDD;">${this._money(parseFloat(m.total), true)}</div>
                <div style="width:100%;background:#009DDD;border-radius:4px 4px 0 0;height:${Math.max(pct, 2)}%;min-height:4px;transition:height .3s;" title="${m.cantidad} deals · ${this._money(parseFloat(m.total))}"></div>
                <div style="font-size:10px;color:#94a3b8;font-weight:600;">${meses[parseInt(mes)]}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  // === TAB 4: Actividad agentes ===
  async _renderAgentes(el) {
    const data = await API.get(`/informes/agentes?desde=${this.filters.desde}&hasta=${this.filters.hasta}`);

    el.innerHTML = `
      <div class="card">
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Agente</th>
                <th style="text-align:center;">Llamadas</th>
                <th style="text-align:center;">Notas</th>
                <th style="text-align:center;">Propuestas</th>
                <th style="text-align:center;">Ganados</th>
                <th style="text-align:center;">Puntos</th>
              </tr>
            </thead>
            <tbody>
              ${data.agentes.length === 0 ? '<tr><td colspan="6" class="text-center text-light">Sin datos</td></tr>' :
                data.agentes.map(a => `
                  <tr>
                    <td>
                      <div style="display:flex;align-items:center;gap:8px;">
                        <div style="width:28px;height:28px;border-radius:50%;background:${a.avatar_color || '#009DDD'};color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;">
                          ${(a.nombre || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <strong style="font-size:13px;">${this._esc(a.nombre)}</strong>
                      </div>
                    </td>
                    <td style="text-align:center;font-weight:600;">${a.llamadas}</td>
                    <td style="text-align:center;">${a.notas}</td>
                    <td style="text-align:center;">${a.propuestas}</td>
                    <td style="text-align:center;font-weight:700;color:#10b981;">${a.ganados}</td>
                    <td style="text-align:center;">
                      ${parseInt(a.puntos) > 0 ? `<span style="background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;">${parseInt(a.puntos).toLocaleString('es-ES')} pts</span>` : '<span class="text-light">0</span>'}
                    </td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // === TAB 5: Exportar / Importar ===
  _renderExportar(el) {
    el.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        <!-- EXPORTAR -->
        <div class="card">
          <h3 style="font-size:16px;font-weight:700;margin-bottom:14px;">Exportar datos</h3>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <select class="form-control" id="exp-tipo">
              <option value="contactos">Contactos</option>
              <option value="ganados">Deals ganados</option>
              <option value="perdidos">Deals perdidos</option>
              <option value="todos">Todos los deals</option>
            </select>
            <div style="display:flex;gap:8px;">
              <button id="btn-export-csv" class="btn btn-primary" style="flex:1;">Descargar CSV</button>
              <button id="btn-export-xlsx" class="btn btn-primary" style="flex:1;background:#10b981;">Descargar Excel</button>
            </div>
          </div>
        </div>

        <!-- IMPORTAR -->
        <div class="card">
          <h3 style="font-size:16px;font-weight:700;margin-bottom:14px;">Importar contactos</h3>
          <div id="import-zone" style="border:2px dashed #e8edf2;border-radius:12px;padding:32px;text-align:center;cursor:pointer;transition:border-color .2s;">
            <div style="font-size:13px;color:#94a3b8;margin-bottom:8px;">Arrastra un archivo CSV o Excel aquí</div>
            <div style="font-size:11px;color:#94a3b8;">o haz click para seleccionar</div>
            <input type="file" id="import-file" accept=".csv,.xlsx,.xls" style="display:none;">
          </div>
          <div id="import-preview" style="display:none;margin-top:12px;"></div>
          <div id="import-result" style="display:none;margin-top:12px;"></div>
        </div>
      </div>
    `;

    // Export buttons
    document.getElementById('btn-export-csv')?.addEventListener('click', () => this._doExport('csv'));
    document.getElementById('btn-export-xlsx')?.addEventListener('click', () => this._doExport('xlsx'));

    // Import zone
    const zone = document.getElementById('import-zone');
    const fileInput = document.getElementById('import-file');

    zone?.addEventListener('click', () => fileInput.click());
    zone?.addEventListener('dragover', (e) => { e.preventDefault(); zone.style.borderColor = '#009DDD'; });
    zone?.addEventListener('dragleave', () => { zone.style.borderColor = '#e8edf2'; });
    zone?.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.style.borderColor = '#e8edf2';
      if (e.dataTransfer.files[0]) this._handleImportFile(e.dataTransfer.files[0]);
    });
    fileInput?.addEventListener('change', (e) => {
      if (e.target.files[0]) this._handleImportFile(e.target.files[0]);
    });
  },

  async _doExport(formato) {
    const tipo = document.getElementById('exp-tipo')?.value || 'contactos';
    const url = `/informes/exportar?tipo=${tipo}&formato=${formato}&${this._qs()}`;

    try {
      const token = Auth.getToken();
      const response = await fetch(`/api${url}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Error exportando');
      const blob = await response.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || `export.csv`;
      a.click();
    } catch (err) {
      alert('Error exportando: ' + err.message);
    }
  },

  async _handleImportFile(file) {
    const preview = document.getElementById('import-preview');
    const result = document.getElementById('import-result');
    preview.style.display = 'block';
    preview.innerHTML = '<p class="text-light">Analizando archivo...</p>';
    result.style.display = 'none';

    try {
      // Previsualización
      const fd = new FormData();
      fd.append('file', file);
      const token = Auth.getToken();
      const previewRes = await fetch('/api/informes/importar/preview', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd,
      });
      const previewData = await previewRes.json();
      if (!previewRes.ok) throw new Error(previewData.error);

      // Mostrar previsualización con mapeo de columnas
      preview.innerHTML = `
        <div style="font-size:13px;font-weight:600;margin-bottom:8px;">${previewData.total} filas detectadas</div>
        <div style="margin-bottom:10px;">
          <div style="font-size:11px;font-weight:600;color:#94a3b8;margin-bottom:4px;">Mapeo de columnas:</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${previewData.headers.map((h, i) => `
              <select class="form-control col-map" data-idx="${i}" style="max-width:150px;font-size:11px;">
                <option value="">— Ignorar —</option>
                <option value="nombre" ${/nombre|name|contacto/i.test(h) ? 'selected' : ''}>${h} → Nombre</option>
                <option value="telefono" ${/telefono|phone|tel/i.test(h) ? 'selected' : ''}>${h} → Teléfono</option>
                <option value="email" ${/email|correo/i.test(h) ? 'selected' : ''}>${h} → Email</option>
                <option value="dni" ${/dni|nif/i.test(h) ? 'selected' : ''}>${h} → DNI</option>
              </select>
            `).join('')}
          </div>
        </div>
        <div class="table-wrapper" style="max-height:150px;overflow-y:auto;">
          <table style="font-size:11px;">
            <thead><tr>${previewData.headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
            <tbody>${previewData.rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>
          </table>
        </div>
        <button id="btn-confirm-import" class="btn btn-primary" style="margin-top:10px;width:100%;">Importar ${previewData.total} contactos</button>
      `;

      // Guardar archivo para importación real
      this._pendingFile = file;

      document.getElementById('btn-confirm-import')?.addEventListener('click', async () => {
        // Recoger mapeo de columnas
        const colMap = {};
        document.querySelectorAll('.col-map').forEach(sel => {
          if (sel.value) colMap[sel.value] = parseInt(sel.dataset.idx);
        });

        const importFd = new FormData();
        importFd.append('file', this._pendingFile);
        importFd.append('column_map', JSON.stringify(colMap));

        preview.innerHTML = '<p class="text-light">Importando...</p>';

        const impRes = await fetch('/api/informes/importar', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: importFd,
        });
        const impData = await impRes.json();

        preview.style.display = 'none';
        result.style.display = 'block';
        result.innerHTML = `
          <div class="card" style="background:#ecfdf5;border:1px solid #10b981;">
            <div style="font-size:14px;font-weight:700;color:#10b981;margin-bottom:8px;">Importación completada</div>
            <div style="font-size:13px;display:flex;gap:16px;">
              <span><strong>${impData.imported}</strong> importados</span>
              <span><strong>${impData.duplicates}</strong> duplicados</span>
              <span><strong>${impData.errors}</strong> errores</span>
            </div>
          </div>
        `;
      });
    } catch (err) {
      preview.innerHTML = `<p style="color:#ef4444;font-size:13px;">${err.message}</p>`;
    }
  },

  // Helpers
  _esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; },
  _date(d) { return d ? new Date(d).toLocaleDateString('es-ES') : '—'; },
  _money(n, short) {
    if (!n || isNaN(n)) return '0 €';
    if (short && n >= 1000) return (n / 1000).toFixed(1) + 'k €';
    return parseFloat(n).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
  },
};
