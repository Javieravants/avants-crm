// === Módulo Fichate — Control horario y RRHH (nativo CRM) ===

const FichateModule = {
  // Estado
  view: 'clock',
  emps: [],
  recs: [],
  reqs: [],
  hols: [],
  dash: null,
  shifts: [],
  creds: [],
  docs: [],
  selEmp: null,
  clockInterval: null,

  // Tipos de ausencia
  AT: {
    vacaciones: { l: 'Vacaciones', c: '#6366f1' },
    medica: { l: 'Baja Médica', c: '#ef4444' },
    personal: { l: 'Asunto Personal', c: '#8b5cf6' },
    maternidad: { l: 'Maternidad/Pat.', c: '#14b8a6' },
    formacion: { l: 'Formación', c: '#3b82f6' },
    otro: { l: 'Otro', c: '#64748b' }
  },

  isA() { return Auth.hasRole('admin', 'supervisor'); },
  esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; },

  async render() {
    if (this.clockInterval) { clearInterval(this.clockInterval); this.clockInterval = null; }
    const c = document.getElementById('main-content');
    const adm = this.isA();

    // Sidebar personal + empresa (admin)
    const NP = [
      { id: 'clock', icon: '⏱️', label: 'Fichaje' },
      { id: 'requests', icon: '📅', label: 'Ausencias' },
      { id: 'credentials', icon: '🔑', label: 'Credenciales' }
    ];
    const NC = [
      { id: 'dashboard', icon: '📊', label: 'Panel' },
      { id: 'employees', icon: '👥', label: 'Empleados' },
      { id: 'records', icon: '📋', label: 'Registros' },
      { id: 'documents', icon: '📄', label: 'Documentos' },
      { id: 'reports', icon: '📈', label: 'Informes' },
      { id: 'settings', icon: '⚙️', label: 'Ajustes' }
    ];

    c.innerHTML = `
      <div style="display:flex;height:calc(100vh - 54px);margin:-24px;">
        <div class="fichate-sidebar" id="ft-sidebar">
          <div style="padding:20px 16px 12px;font-size:11px;text-transform:uppercase;font-weight:700;color:var(--txt3);letter-spacing:1px;">Personal</div>
          ${NP.map(n => `<a class="ft-nav ${this.view === n.id ? 'active' : ''}" data-view="${n.id}">${n.icon} ${n.label}</a>`).join('')}
          ${adm ? `
            <div style="padding:20px 16px 12px;font-size:11px;text-transform:uppercase;font-weight:700;color:var(--txt3);letter-spacing:1px;border-top:1px solid var(--border);margin-top:8px;">Empresa</div>
            ${NC.map(n => `<a class="ft-nav ${this.view === n.id ? 'active' : ''}" data-view="${n.id}">${n.icon} ${n.label}</a>`).join('')}
          ` : ''}
        </div>
        <div class="fichate-main" id="ft-main">
          <div id="ft-content" style="padding:24px;overflow-y:auto;height:100%;"></div>
        </div>
      </div>
    `;

    // Estilos inline para el sidebar de fichate
    this._injectStyles();

    document.getElementById('ft-sidebar').addEventListener('click', (e) => {
      const nav = e.target.closest('.ft-nav');
      if (!nav) return;
      this.view = nav.dataset.view;
      document.querySelectorAll('.ft-nav').forEach(n => n.classList.remove('active'));
      nav.classList.add('active');
      this.loadView();
    });

    await this.loadData();
    this.loadView();
  },

  _injectStyles() {
    if (document.getElementById('ft-styles')) return;
    const style = document.createElement('style');
    style.id = 'ft-styles';
    style.textContent = `
      .fichate-sidebar { width:220px; background:#fff; border-right:1px solid var(--border); flex-shrink:0; overflow-y:auto; }
      .fichate-main { flex:1; background:var(--bg); overflow:hidden; }
      .ft-nav { display:flex; align-items:center; gap:10px; padding:10px 16px; font-size:13px; font-weight:500; color:var(--txt2); cursor:pointer; text-decoration:none; transition:all .15s; border-left:3px solid transparent; }
      .ft-nav:hover { background:var(--bg); color:var(--txt); }
      .ft-nav.active { background:#fff0f3; color:var(--accent); border-left-color:var(--accent); font-weight:600; }
      .ft-card { background:#fff; border:1px solid var(--border); border-radius:16px; padding:20px; margin-bottom:16px; }
      .ft-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:16px; margin-bottom:20px; }
      .ft-kpi { background:#fff; border:1px solid var(--border); border-radius:16px; padding:20px; text-align:center; }
      .ft-kpi-val { font-size:32px; font-weight:800; color:var(--accent); }
      .ft-kpi-lbl { font-size:12px; color:var(--txt3); margin-top:4px; font-weight:600; text-transform:uppercase; letter-spacing:.5px; }
      .ft-table { width:100%; border-collapse:collapse; font-size:13px; }
      .ft-table th { text-align:left; padding:10px 12px; background:var(--bg); font-size:11px; text-transform:uppercase; color:var(--txt3); font-weight:700; letter-spacing:.5px; }
      .ft-table td { padding:10px 12px; border-bottom:1px solid var(--border); }
      .ft-table tr:hover td { background:#fafafa; }
      .ft-badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; }
      .ft-btn { padding:8px 16px; border-radius:10px; border:none; font-size:13px; font-weight:600; cursor:pointer; transition:all .15s; }
      .ft-btn-p { background:var(--accent); color:#fff; }
      .ft-btn-p:hover { background:#e0425f; }
      .ft-btn-s { background:var(--bg); color:var(--txt2); border:1px solid var(--border); }
      .ft-btn-g { background:#22c55e; color:#fff; }
      .ft-btn-r { background:#ef4444; color:#fff; }
      .ft-btn-sm { padding:4px 10px; font-size:11px; }
      .ft-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
      .ft-header h2 { font-size:20px; font-weight:800; color:var(--txt); }
      .ft-inp { padding:8px 12px; border:1px solid var(--border); border-radius:10px; font-size:13px; font-family:inherit; }
      .ft-inp:focus { outline:none; border-color:var(--accent); box-shadow:0 0 0 3px rgba(255,74,110,.15); }
      .ft-sel { padding:8px 12px; border:1px solid var(--border); border-radius:10px; font-size:13px; background:#fff; }
      @media(max-width:768px) { .fichate-sidebar { width:60px; } .ft-nav span:last-child { display:none; } .ft-grid { grid-template-columns:1fr 1fr; } }
    `;
    document.head.appendChild(style);
  },

  async loadData() {
    try {
      const [empR, holR, shiftR] = await Promise.all([
        API.get('/fichate/employees'),
        API.get('/fichate/holidays?year=' + new Date().getFullYear()),
        API.get('/fichate/shifts')
      ]);
      this.emps = empR.employees || [];
      this.hols = holR.holidays || [];
      this.shifts = shiftR.shifts || [];
    } catch (e) { console.error('Error cargando datos fichate:', e); }
  },

  loadView() {
    if (this.clockInterval) { clearInterval(this.clockInterval); this.clockInterval = null; }
    const c = document.getElementById('ft-content');
    if (!c) return;

    const views = {
      clock: () => this.vClock(c),
      dashboard: () => this.vDashboard(c),
      employees: () => this.vEmployees(c),
      records: () => this.vRecords(c),
      requests: () => this.vRequests(c),
      documents: () => this.vDocuments(c),
      credentials: () => this.vCredentials(c),
      reports: () => this.vReports(c),
      settings: () => this.vSettings(c)
    };
    const fn = views[this.view];
    if (fn) fn();
    else c.innerHTML = '<p>Vista no encontrada</p>';
  },

  // ══════════════════════════════════════
  // VISTA: FICHAJE
  // ══════════════════════════════════════
  async vClock(c) {
    c.innerHTML = '<div class="ft-card" style="text-align:center;padding:40px;"><p style="color:var(--txt3);">Cargando...</p></div>';
    try {
      const data = await API.get('/fichate/status');
      const isIn = data.is_clocked_in;
      const recs = data.records || [];

      let totalH = 0;
      recs.forEach(r => {
        const cin = new Date(r.clock_in);
        const cout = r.clock_out ? new Date(r.clock_out) : new Date();
        totalH += (cout - cin) / 3600000;
      });

      const user = Auth.getUser();
      const emp = this.emps.find(e => e.id === user.id) || {};
      const vacAvail = (emp.vacation_days || 22) - (emp.used_vacation_days || 0);

      c.innerHTML = `
        <div class="ft-card" style="text-align:center;padding:48px 24px;">
          <div id="ft-live-clock" style="font-size:48px;font-weight:800;color:var(--txt);margin-bottom:8px;font-variant-numeric:tabular-nums;"></div>
          <div style="font-size:14px;color:var(--txt3);margin-bottom:32px;">${new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>

          <div style="display:flex;gap:16px;justify-content:center;margin-bottom:24px;">
            <button class="ft-btn ${isIn ? 'ft-btn-s' : 'ft-btn-p'}" id="ft-btn-in" style="padding:16px 32px;font-size:16px;" ${isIn ? 'disabled style="opacity:.4;padding:16px 32px;font-size:16px;"' : ''}>
              ▶ Entrada
            </button>
            <button class="ft-btn ${isIn ? 'ft-btn-r' : 'ft-btn-s'}" id="ft-btn-out" style="padding:16px 32px;font-size:16px;" ${!isIn ? 'disabled style="opacity:.4;padding:16px 32px;font-size:16px;"' : ''}>
              ⏹ Salida
            </button>
          </div>

          <div id="ft-clock-status" style="font-size:14px;color:${isIn ? '#22c55e' : 'var(--txt3)'};font-weight:600;margin-bottom:16px;">
            ${isIn ? '🟢 Trabajando' : (recs.length > 0 ? '⚪ Jornada finalizada' : '⚪ Sin fichar hoy')}
          </div>

          <div style="font-size:36px;font-weight:800;color:var(--accent);">
            ${Math.floor(totalH)}h ${Math.round((totalH % 1) * 60)}m
          </div>
          <div style="font-size:12px;color:var(--txt3);margin-top:4px;">Horas hoy</div>
        </div>

        ${recs.length > 0 ? `
          <div class="ft-card">
            <h3 style="font-weight:700;margin-bottom:12px;font-size:14px;">Registros de hoy</h3>
            ${recs.map(r => {
              const cin = new Date(r.clock_in);
              const cout = r.clock_out ? new Date(r.clock_out) : null;
              const hrs = cout ? ((cout - cin) / 3600000).toFixed(2) : 'En curso';
              return `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px;">
                <span>▶ ${cin.toLocaleTimeString('es-ES', {hour:'2-digit',minute:'2-digit'})}</span>
                <span>${cout ? '⏹ ' + cout.toLocaleTimeString('es-ES', {hour:'2-digit',minute:'2-digit'}) : '<span class="ft-badge" style="background:#dcfce7;color:#16a34a;">En curso</span>'}</span>
                <span style="font-weight:700;">${hrs}${cout ? 'h' : ''}</span>
              </div>`;
            }).join('')}
          </div>
        ` : ''}

        <div class="ft-grid" style="grid-template-columns:1fr 1fr;">
          <div class="ft-card">
            <div style="font-size:13px;font-weight:700;margin-bottom:8px;">🏖️ Vacaciones</div>
            <div style="font-size:28px;font-weight:800;color:${vacAvail <= 3 ? '#ef4444' : 'var(--accent)'};">${vacAvail}</div>
            <div style="font-size:12px;color:var(--txt3);">días disponibles de ${emp.vacation_days || 22}</div>
          </div>
          <div class="ft-card">
            <div style="font-size:13px;font-weight:700;margin-bottom:8px;">📅 Próximos festivos</div>
            ${this.hols.filter(h => new Date(h.fecha) >= new Date()).slice(0, 3).map(h =>
              `<div style="font-size:12px;padding:4px 0;border-bottom:1px solid var(--border);">${new Date(h.fecha).toLocaleDateString('es-ES', {day:'2-digit',month:'short'})} — ${h.nombre}</div>`
            ).join('') || '<div style="font-size:12px;color:var(--txt3);">Sin festivos próximos</div>'}
          </div>
        </div>
      `;

      // Reloj en vivo
      const updateClock = () => {
        const el = document.getElementById('ft-live-clock');
        if (el) el.textContent = new Date().toLocaleTimeString('es-ES', {hour:'2-digit',minute:'2-digit',second:'2-digit'});
      };
      updateClock();
      this.clockInterval = setInterval(updateClock, 1000);

      // Eventos
      document.getElementById('ft-btn-in')?.addEventListener('click', async () => {
        try { await API.post('/fichate/clock', { action: 'in' }); this.vClock(c); } catch (e) { alert(e.message); }
      });
      document.getElementById('ft-btn-out')?.addEventListener('click', async () => {
        try { await API.post('/fichate/clock', { action: 'out' }); this.vClock(c); } catch (e) { alert(e.message); }
      });
    } catch (e) {
      c.innerHTML = `<div class="ft-card"><p style="color:#ef4444;">${e.message}</p></div>`;
    }
  },

  // ══════════════════════════════════════
  // VISTA: DASHBOARD (admin)
  // ══════════════════════════════════════
  async vDashboard(c) {
    if (!this.isA()) { c.innerHTML = '<p>Sin permisos</p>'; return; }
    c.innerHTML = '<p style="color:var(--txt3);">Cargando dashboard...</p>';
    try {
      const d = await API.get('/fichate/dashboard');
      const avgH = d.active_employees > 0 ? (parseFloat(d.today_hours) / Math.max(d.clocked_in, 1)).toFixed(1) : '0';

      c.innerHTML = `
        <div class="ft-header"><h2>Panel Fichate</h2></div>
        <div class="ft-grid">
          <div class="ft-kpi">
            <div class="ft-kpi-val" style="color:#3b82f6;">${d.clocked_in}/${d.active_employees}</div>
            <div class="ft-kpi-lbl">Fichados hoy</div>
          </div>
          <div class="ft-kpi">
            <div class="ft-kpi-val">${d.today_hours}h</div>
            <div class="ft-kpi-lbl">Horas hoy (media ${avgH}h)</div>
          </div>
          <div class="ft-kpi">
            <div class="ft-kpi-val" style="color:${d.pending_requests > 0 ? '#f59e0b' : '#22c55e'};">${d.pending_requests}</div>
            <div class="ft-kpi-lbl">Solicitudes pendientes</div>
          </div>
          <div class="ft-kpi">
            <div class="ft-kpi-val" style="color:#8b5cf6;">${d.vacation_used || 0}</div>
            <div class="ft-kpi-lbl">Vacaciones usadas (total)</div>
          </div>
        </div>

        ${d.weekly_attendance && d.weekly_attendance.length > 0 ? `
          <div class="ft-card">
            <h3 style="font-weight:700;margin-bottom:16px;font-size:14px;">Asistencia semanal</h3>
            <div style="display:flex;gap:8px;align-items:flex-end;height:120px;">
              ${d.weekly_attendance.map(w => {
                const pct = d.active_employees > 0 ? Math.round((w.count / d.active_employees) * 100) : 0;
                const isToday = w.fecha === new Date().toISOString().split('T')[0];
                return `<div style="flex:1;text-align:center;">
                  <div style="background:${isToday ? 'var(--accent)' : '#e5e7eb'};height:${Math.max(pct, 5)}%;border-radius:8px 8px 0 0;min-height:8px;transition:height .3s;"></div>
                  <div style="font-size:10px;color:var(--txt3);margin-top:4px;">${new Date(w.fecha).toLocaleDateString('es-ES',{weekday:'short'})}</div>
                  <div style="font-size:11px;font-weight:700;">${w.count}</div>
                </div>`;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div class="ft-card">
            <h3 style="font-weight:700;margin-bottom:12px;font-size:14px;">Presencia del equipo</h3>
            ${d.today_records.length === 0 ? '<p style="font-size:13px;color:var(--txt3);">Nadie ha fichado aún</p>' : `
              ${[...new Map(d.today_records.map(r => [r.user_id, r])).values()].map(r => {
                const isIn = !r.clock_out;
                return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);">
                  <span style="color:${isIn ? '#22c55e' : '#9ca3af'};">${isIn ? '🟢' : '⚪'}</span>
                  <span style="font-size:13px;font-weight:600;">${this.esc(r.employee_name)}</span>
                  <span style="margin-left:auto;font-size:11px;color:var(--txt3);">${new Date(r.clock_in).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}</span>
                </div>`;
              }).join('')}
            `}
          </div>
          <div class="ft-card">
            <h3 style="font-weight:700;margin-bottom:12px;font-size:14px;">Solicitudes pendientes</h3>
            ${(d.pending_reqs || []).length === 0 ? '<p style="font-size:13px;color:var(--txt3);">Sin solicitudes</p>' : `
              ${d.pending_reqs.map(r => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);">
                  <div>
                    <div style="font-size:13px;font-weight:600;">${this.esc(r.employee_name)}</div>
                    <div style="font-size:11px;color:var(--txt3);">${this.AT[r.tipo]?.l || r.tipo} · ${new Date(r.fecha_inicio).toLocaleDateString('es-ES')} - ${new Date(r.fecha_fin).toLocaleDateString('es-ES')}</div>
                  </div>
                  <div style="display:flex;gap:4px;">
                    <button class="ft-btn ft-btn-g ft-btn-sm" onclick="FichateModule.reviewAbs(${r.id},'aprobada')">✓</button>
                    <button class="ft-btn ft-btn-r ft-btn-sm" onclick="FichateModule.reviewAbs(${r.id},'rechazada')">✕</button>
                  </div>
                </div>
              `).join('')}
            `}
          </div>
        </div>
      `;
    } catch (e) {
      c.innerHTML = `<div class="ft-card"><p style="color:#ef4444;">${e.message}</p></div>`;
    }
  },

  // ══════════════════════════════════════
  // VISTA: EMPLEADOS (admin)
  // ══════════════════════════════════════
  async vEmployees(c) {
    if (!this.isA()) { c.innerHTML = '<p>Sin permisos</p>'; return; }
    await this.loadData();

    c.innerHTML = `
      <div class="ft-header">
        <h2>Empleados</h2>
        <input type="text" class="ft-inp" id="ft-emp-search" placeholder="Buscar..." style="width:220px;">
      </div>
      <div class="ft-card" style="padding:0;overflow:hidden;">
        <table class="ft-table">
          <thead><tr><th>Empleado</th><th>DNI</th><th>Puesto</th><th>Rol</th><th>Vacaciones</th><th>Estado</th></tr></thead>
          <tbody id="ft-emp-body">
            ${this.emps.map(e => this._empRow(e)).join('')}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('ft-emp-search')?.addEventListener('input', (ev) => {
      const q = ev.target.value.toLowerCase();
      const filtered = this.emps.filter(e => (e.nombre || '').toLowerCase().includes(q) || (e.email || '').toLowerCase().includes(q));
      document.getElementById('ft-emp-body').innerHTML = filtered.map(e => this._empRow(e)).join('');
    });
  },

  _empRow(e) {
    const used = e.used_vacation_days || 0;
    const total = e.vacation_days || 22;
    const pct = Math.round((used / total) * 100);
    const rolColors = { admin: 'var(--accent)', supervisor: '#8b5cf6', agent: '#3b82f6' };
    return `<tr style="cursor:pointer;" onclick="FichateModule.showEmpProfile(${e.id})">
      <td><strong>${this.esc(e.nombre)}</strong><br><span style="font-size:11px;color:var(--txt3);">${e.email || ''}</span></td>
      <td>${e.dni || '—'}</td>
      <td>${e.position || '—'}</td>
      <td><span class="ft-badge" style="background:${rolColors[e.rol] || '#6b7280'};color:#fff;">${e.rol}</span></td>
      <td>
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="flex:1;height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden;">
            <div style="width:${pct}%;height:100%;background:${pct > 80 ? '#ef4444' : pct > 60 ? '#f59e0b' : 'var(--accent)'};border-radius:3px;"></div>
          </div>
          <span style="font-size:11px;white-space:nowrap;">${used}/${total}</span>
        </div>
      </td>
      <td>${e.activo ? '<span class="ft-badge" style="background:#dcfce7;color:#16a34a;">Activo</span>' : '<span class="ft-badge" style="background:#fef2f2;color:#ef4444;">Inactivo</span>'}</td>
    </tr>`;
  },

  async showEmpProfile(id) {
    const emp = this.emps.find(e => e.id === id);
    if (!emp) return;
    this.selEmp = emp;
    const c = document.getElementById('ft-content');

    c.innerHTML = `
      <div style="margin-bottom:16px;">
        <button class="ft-btn ft-btn-s" onclick="FichateModule.vEmployees(document.getElementById('ft-content'))">← Volver a empleados</button>
      </div>
      <div class="ft-card">
        <div style="display:flex;align-items:center;gap:16px;">
          <div style="width:56px;height:56px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;">
            ${(emp.nombre || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style="font-size:18px;font-weight:800;">${this.esc(emp.nombre)}</h2>
            <p style="font-size:13px;color:var(--txt3);">${emp.position || '—'} · ${emp.email || ''}</p>
            <div style="margin-top:4px;">
              <span class="ft-badge" style="background:var(--accent);color:#fff;">${emp.rol}</span>
              ${emp.dni ? `<span style="font-size:12px;color:var(--txt3);margin-left:8px;">DNI: ${emp.dni}</span>` : ''}
            </div>
          </div>
          <button class="ft-btn ft-btn-s" style="margin-left:auto;" onclick="FichateModule.editEmpModal(${emp.id})">✏️ Editar</button>
        </div>
      </div>

      <div class="ft-grid" style="grid-template-columns:repeat(4,1fr);">
        <div class="ft-kpi">
          <div class="ft-kpi-val" style="font-size:24px;">${(emp.vacation_days || 22) - (emp.used_vacation_days || 0)}</div>
          <div class="ft-kpi-lbl">Vacaciones libres</div>
        </div>
        <div class="ft-kpi">
          <div class="ft-kpi-val" style="font-size:24px;">${emp.used_vacation_days || 0}/${emp.vacation_days || 22}</div>
          <div class="ft-kpi-lbl">Usadas/Total</div>
        </div>
        <div class="ft-kpi">
          <div class="ft-kpi-val" style="font-size:24px;">${emp.last_login ? new Date(emp.last_login).toLocaleDateString('es-ES') : 'Nunca'}</div>
          <div class="ft-kpi-lbl">Último acceso</div>
        </div>
        <div class="ft-kpi">
          <div class="ft-kpi-val" style="font-size:24px;">${emp.start_date ? new Date(emp.start_date).toLocaleDateString('es-ES') : '—'}</div>
          <div class="ft-kpi-lbl">Fecha alta</div>
        </div>
      </div>
    `;
  },

  editEmpModal(id) {
    const emp = this.emps.find(e => e.id === id);
    if (!emp) return;
    const prev = document.getElementById('ft-modal');
    if (prev) prev.remove();

    const ov = document.createElement('div');
    ov.className = 'modal-overlay';
    ov.id = 'ft-modal';
    ov.innerHTML = `
      <div class="modal" style="max-width:500px;">
        <h2 class="modal-title">Editar ${this.esc(emp.nombre)}</h2>
        <form id="ft-edit-emp-form">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group"><label>Nombre</label><input class="form-control" name="nombre" value="${this.esc(emp.nombre || '')}"></div>
            <div class="form-group"><label>DNI</label><input class="form-control" name="dni" value="${emp.dni || ''}"></div>
            <div class="form-group"><label>Teléfono</label><input class="form-control" name="telefono" value="${emp.telefono || ''}"></div>
            <div class="form-group"><label>Puesto</label><input class="form-control" name="position" value="${emp.position || ''}"></div>
            <div class="form-group"><label>Vacaciones (días)</label><input type="number" class="form-control" name="vacation_days" value="${emp.vacation_days || 22}"></div>
            <div class="form-group"><label>Usadas</label><input type="number" class="form-control" name="used_vacation_days" value="${emp.used_vacation_days || 0}"></div>
            <div class="form-group"><label>Horas/día</label><input type="number" step="0.5" class="form-control" name="daily_hours" value="${emp.daily_hours || 7.5}"></div>
            <div class="form-group"><label>Rol</label>
              <select class="form-control" name="rol">
                <option value="agent" ${emp.rol === 'agent' ? 'selected' : ''}>Agente</option>
                <option value="supervisor" ${emp.rol === 'supervisor' ? 'selected' : ''}>Supervisor</option>
                <option value="admin" ${emp.rol === 'admin' ? 'selected' : ''}>Admin</option>
              </select>
            </div>
          </div>
          <div class="modal-actions" style="margin-top:16px;">
            <button type="button" class="btn btn-secondary" onclick="document.getElementById('ft-modal').remove()">Cancelar</button>
            <button type="submit" class="btn btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(ov);
    ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });

    document.getElementById('ft-edit-emp-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      try {
        await API.patch('/fichate/employees/' + id, {
          nombre: f.nombre.value, dni: f.dni.value, telefono: f.telefono.value,
          position: f.position.value, vacation_days: parseInt(f.vacation_days.value),
          used_vacation_days: parseInt(f.used_vacation_days.value),
          daily_hours: parseFloat(f.daily_hours.value), rol: f.rol.value
        });
        ov.remove();
        await this.loadData();
        this.showEmpProfile(id);
      } catch (err) { alert(err.message); }
    });
  },

  // ══════════════════════════════════════
  // VISTA: REGISTROS
  // ══════════════════════════════════════
  async vRecords(c) {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

    c.innerHTML = `
      <div class="ft-header">
        <h2>Registros horarios</h2>
        <div style="display:flex;gap:8px;align-items:center;">
          ${this.isA() ? `<select class="ft-sel" id="ft-rec-emp"><option value="all">Todos</option>${this.emps.map(e => `<option value="${e.id}">${this.esc(e.nombre)}</option>`).join('')}</select>` : ''}
          <input type="month" class="ft-inp" id="ft-rec-month" value="${month}">
        </div>
      </div>
      <div class="ft-card" style="padding:0;overflow:hidden;" id="ft-rec-table"></div>
    `;

    const load = async () => {
      const m = document.getElementById('ft-rec-month').value;
      const uid = document.getElementById('ft-rec-emp')?.value || '';
      const params = `month=${m}${uid && uid !== 'all' ? '&user_id=' + uid : ''}`;
      const data = await API.get('/fichate/records?' + params);
      const recs = data.records || [];

      let totalH = 0;
      recs.forEach(r => {
        if (r.clock_in && r.clock_out) totalH += (new Date(r.clock_out) - new Date(r.clock_in)) / 3600000;
      });

      document.getElementById('ft-rec-table').innerHTML = `
        <div style="padding:12px 16px;background:var(--bg);font-size:13px;font-weight:600;">
          ${recs.length} registros · ${Math.floor(totalH)}h ${Math.round((totalH % 1) * 60)}m total
        </div>
        <table class="ft-table">
          <thead><tr>${this.isA() ? '<th>Empleado</th>' : ''}<th>Fecha</th><th>Entrada</th><th>Salida</th><th>Horas</th>${this.isA() ? '<th></th>' : ''}</tr></thead>
          <tbody>
            ${recs.map(r => {
              const hrs = r.clock_out ? ((new Date(r.clock_out) - new Date(r.clock_in)) / 3600000).toFixed(2) : '';
              return `<tr>
                ${this.isA() ? `<td><strong>${this.esc(r.employee_name)}</strong></td>` : ''}
                <td>${new Date(r.fecha).toLocaleDateString('es-ES', {weekday:'short',day:'2-digit',month:'short'})}</td>
                <td>${r.clock_in ? new Date(r.clock_in).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}) : '—'}</td>
                <td>${r.clock_out ? new Date(r.clock_out).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}) : '<span class="ft-badge" style="background:#dcfce7;color:#16a34a;">En curso</span>'}</td>
                <td style="font-weight:700;">${hrs ? hrs + 'h' : '—'}</td>
                ${this.isA() ? `<td><button class="ft-btn ft-btn-r ft-btn-sm" onclick="FichateModule.deleteRec(${r.id})">✕</button></td>` : ''}
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      `;
    };

    await load();
    document.getElementById('ft-rec-month').addEventListener('change', load);
    document.getElementById('ft-rec-emp')?.addEventListener('change', load);
  },

  async deleteRec(id) {
    if (!confirm('¿Eliminar este registro?')) return;
    try { await API.delete('/fichate/records/' + id); this.vRecords(document.getElementById('ft-content')); } catch (e) { alert(e.message); }
  },

  // ══════════════════════════════════════
  // VISTA: AUSENCIAS
  // ══════════════════════════════════════
  async vRequests(c) {
    c.innerHTML = '<p style="color:var(--txt3);">Cargando...</p>';
    try {
      const data = await API.get('/fichate/absences');
      const reqs = data.requests || [];

      c.innerHTML = `
        <div class="ft-header">
          <h2>Ausencias</h2>
          <button class="ft-btn ft-btn-p" onclick="FichateModule.newAbsenceModal()">+ Solicitar ausencia</button>
        </div>
        <div class="ft-card" style="padding:0;overflow:hidden;">
          <table class="ft-table">
            <thead><tr><th>Empleado</th><th>Tipo</th><th>Desde</th><th>Hasta</th><th>Estado</th>${this.isA() ? '<th>Acción</th>' : ''}</tr></thead>
            <tbody>
              ${reqs.length === 0 ? `<tr><td colspan="6" style="text-align:center;color:var(--txt3);padding:24px;">Sin solicitudes</td></tr>` : ''}
              ${reqs.map(r => {
                const tipo = this.AT[r.tipo] || { l: r.tipo, c: '#6b7280' };
                const estColors = { pendiente: '#f59e0b', aprobada: '#22c55e', rechazada: '#ef4444', cancelada: '#6b7280' };
                return `<tr>
                  <td><strong>${this.esc(r.employee_name)}</strong></td>
                  <td><span class="ft-badge" style="background:${tipo.c};color:#fff;">${tipo.l}</span></td>
                  <td>${new Date(r.fecha_inicio).toLocaleDateString('es-ES')}</td>
                  <td>${new Date(r.fecha_fin).toLocaleDateString('es-ES')}</td>
                  <td><span class="ft-badge" style="background:${estColors[r.estado] || '#6b7280'};color:#fff;">${r.estado}</span></td>
                  ${this.isA() && r.estado === 'pendiente' ? `<td>
                    <button class="ft-btn ft-btn-g ft-btn-sm" onclick="FichateModule.reviewAbs(${r.id},'aprobada')">Aprobar</button>
                    <button class="ft-btn ft-btn-r ft-btn-sm" onclick="FichateModule.reviewAbs(${r.id},'rechazada')">Rechazar</button>
                  </td>` : (this.isA() ? '<td>—</td>' : '')}
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (e) {
      c.innerHTML = `<div class="ft-card"><p style="color:#ef4444;">${e.message}</p></div>`;
    }
  },

  async reviewAbs(id, estado) {
    let motivo = null;
    if (estado === 'rechazada') {
      motivo = prompt('Motivo del rechazo:');
      if (motivo === null) return;
    }
    try {
      await API.patch('/fichate/absences/' + id, { estado, motivo_rechazo: motivo });
      // Refrescar vista actual
      const c = document.getElementById('ft-content');
      if (this.view === 'requests') this.vRequests(c);
      else if (this.view === 'dashboard') this.vDashboard(c);
    } catch (e) { alert(e.message); }
  },

  newAbsenceModal() {
    const prev = document.getElementById('ft-modal');
    if (prev) prev.remove();

    const ov = document.createElement('div');
    ov.className = 'modal-overlay';
    ov.id = 'ft-modal';
    ov.innerHTML = `
      <div class="modal" style="max-width:450px;">
        <h2 class="modal-title">Solicitar ausencia</h2>
        <form id="ft-abs-form">
          <div class="form-group"><label>Tipo</label>
            <select class="form-control" name="tipo">
              ${Object.entries(this.AT).map(([k, v]) => `<option value="${k}">${v.l}</option>`).join('')}
            </select>
          </div>
          ${this.isA() ? `<div class="form-group"><label>Empleado</label>
            <select class="form-control" name="user_id">
              <option value="">Yo mismo</option>
              ${this.emps.filter(e => e.activo).map(e => `<option value="${e.id}">${this.esc(e.nombre)}</option>`).join('')}
            </select>
          </div>` : ''}
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group"><label>Desde</label><input type="date" class="form-control" name="fecha_inicio" required></div>
            <div class="form-group"><label>Hasta</label><input type="date" class="form-control" name="fecha_fin" required></div>
          </div>
          <div class="form-group"><label>Motivo</label><textarea class="form-control" name="motivo" rows="2"></textarea></div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" onclick="document.getElementById('ft-modal').remove()">Cancelar</button>
            <button type="submit" class="btn btn-primary">Enviar</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(ov);
    ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });

    document.getElementById('ft-abs-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      try {
        await API.post('/fichate/absences', {
          tipo: f.tipo.value,
          fecha_inicio: f.fecha_inicio.value,
          fecha_fin: f.fecha_fin.value,
          motivo: f.motivo.value,
          user_id: f.user_id?.value || null
        });
        ov.remove();
        this.vRequests(document.getElementById('ft-content'));
      } catch (err) { alert(err.message); }
    });
  },

  // ══════════════════════════════════════
  // VISTA: CREDENCIALES
  // ══════════════════════════════════════
  async vCredentials(c) {
    c.innerHTML = '<p style="color:var(--txt3);">Cargando...</p>';
    try {
      const data = await API.get('/fichate/credentials');
      const creds = data.credentials || [];
      const personal = creds.filter(cr => cr.user_id);
      const shared = creds.filter(cr => !cr.user_id);

      c.innerHTML = `
        <div class="ft-header">
          <h2>Credenciales</h2>
          <button class="ft-btn ft-btn-p" onclick="FichateModule.newCredModal()">+ Nueva credencial</button>
        </div>
        ${shared.length > 0 ? `
          <div class="ft-card">
            <h3 style="font-weight:700;margin-bottom:12px;font-size:14px;">Compartidas</h3>
            <table class="ft-table">
              <thead><tr><th>Aplicación</th><th>Usuario</th><th>Contraseña</th><th>Notas</th><th></th></tr></thead>
              <tbody>${shared.map(cr => this._credRow(cr)).join('')}</tbody>
            </table>
          </div>
        ` : ''}
        <div class="ft-card">
          <h3 style="font-weight:700;margin-bottom:12px;font-size:14px;">Mis credenciales</h3>
          ${personal.length === 0 ? '<p style="font-size:13px;color:var(--txt3);">Sin credenciales guardadas</p>' : `
            <table class="ft-table">
              <thead><tr><th>Aplicación</th><th>Usuario</th><th>Contraseña</th><th>Notas</th><th></th></tr></thead>
              <tbody>${personal.map(cr => this._credRow(cr)).join('')}</tbody>
            </table>
          `}
        </div>
      `;
    } catch (e) {
      c.innerHTML = `<div class="ft-card"><p style="color:#ef4444;">${e.message}</p></div>`;
    }
  },

  _credRow(cr) {
    return `<tr>
      <td><strong>${this.esc(cr.app_name)}</strong>${cr.app_url ? ` <a href="${cr.app_url}" target="_blank" style="font-size:11px;">🔗</a>` : ''}</td>
      <td style="font-family:monospace;">${this.esc(cr.username || '—')}</td>
      <td style="font-family:monospace;">${this.esc(cr.password_plain || '—')}</td>
      <td style="font-size:12px;color:var(--txt3);">${this.esc(cr.notas || '')}</td>
      <td><button class="ft-btn ft-btn-r ft-btn-sm" onclick="FichateModule.deleteCred(${cr.id})">✕</button></td>
    </tr>`;
  },

  newCredModal() {
    const prev = document.getElementById('ft-modal');
    if (prev) prev.remove();
    const ov = document.createElement('div');
    ov.className = 'modal-overlay';
    ov.id = 'ft-modal';
    ov.innerHTML = `
      <div class="modal" style="max-width:400px;">
        <h2 class="modal-title">Nueva credencial</h2>
        <form id="ft-cred-form">
          <div class="form-group"><label>Nombre de la app</label><input class="form-control" name="app_name" required></div>
          <div class="form-group"><label>URL (opcional)</label><input class="form-control" name="app_url"></div>
          <div class="form-group"><label>Usuario</label><input class="form-control" name="username"></div>
          <div class="form-group"><label>Contraseña</label><input class="form-control" name="password_plain"></div>
          <div class="form-group"><label>Notas</label><textarea class="form-control" name="notas" rows="2"></textarea></div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" onclick="document.getElementById('ft-modal').remove()">Cancelar</button>
            <button type="submit" class="btn btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(ov);
    ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });
    document.getElementById('ft-cred-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      try {
        await API.post('/fichate/credentials', {
          app_name: f.app_name.value, app_url: f.app_url.value,
          username: f.username.value, password_plain: f.password_plain.value, notas: f.notas.value
        });
        ov.remove();
        this.vCredentials(document.getElementById('ft-content'));
      } catch (err) { alert(err.message); }
    });
  },

  async deleteCred(id) {
    if (!confirm('¿Eliminar credencial?')) return;
    try { await API.delete('/fichate/credentials/' + id); this.vCredentials(document.getElementById('ft-content')); } catch (e) { alert(e.message); }
  },

  // ══════════════════════════════════════
  // VISTA: DOCUMENTOS
  // ══════════════════════════════════════
  async vDocuments(c) {
    c.innerHTML = '<p style="color:var(--txt3);">Cargando...</p>';
    try {
      const data = await API.get('/fichate/documents');
      const docs = data.documents || [];
      const cats = { payroll: 'Nómina', contract: 'Contrato', medical: 'Médico', certificate: 'Certificado', otro: 'Otro' };

      c.innerHTML = `
        <div class="ft-header">
          <h2>Documentos</h2>
          ${this.isA() ? '<button class="ft-btn ft-btn-p" onclick="FichateModule.uploadDocModal()">+ Subir documento</button>' : ''}
        </div>
        <div class="ft-card" style="padding:0;overflow:hidden;">
          <table class="ft-table">
            <thead><tr><th>Nombre</th><th>Empleado</th><th>Tipo</th><th>Fecha</th><th></th></tr></thead>
            <tbody>
              ${docs.length === 0 ? '<tr><td colspan="5" style="text-align:center;color:var(--txt3);padding:24px;">Sin documentos</td></tr>' : ''}
              ${docs.map(d => `<tr>
                <td><strong>${this.esc(d.nombre)}</strong></td>
                <td>${this.esc(d.employee_name || '—')}</td>
                <td><span class="ft-badge" style="background:#e5e7eb;color:var(--txt);">${cats[d.categoria] || d.categoria}</span></td>
                <td>${d.fecha ? new Date(d.fecha).toLocaleDateString('es-ES') : '—'}</td>
                <td>
                  <a href="/api/fichate/documents/${d.id}/download?preview=1" target="_blank" class="ft-btn ft-btn-s ft-btn-sm">👁</a>
                  ${this.isA() ? `<button class="ft-btn ft-btn-r ft-btn-sm" onclick="FichateModule.deleteDoc(${d.id})">✕</button>` : ''}
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (e) {
      c.innerHTML = `<div class="ft-card"><p style="color:#ef4444;">${e.message}</p></div>`;
    }
  },

  uploadDocModal() {
    const prev = document.getElementById('ft-modal');
    if (prev) prev.remove();
    const ov = document.createElement('div');
    ov.className = 'modal-overlay';
    ov.id = 'ft-modal';
    ov.innerHTML = `
      <div class="modal" style="max-width:400px;">
        <h2 class="modal-title">Subir documento</h2>
        <form id="ft-doc-form">
          <div class="form-group"><label>Empleado</label>
            <select class="form-control" name="user_id" required>
              ${this.emps.filter(e => e.activo).map(e => `<option value="${e.id}">${this.esc(e.nombre)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label>Categoría</label>
            <select class="form-control" name="categoria">
              <option value="payroll">Nómina</option><option value="contract">Contrato</option>
              <option value="medical">Médico</option><option value="certificate">Certificado</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div class="form-group"><label>Nombre</label><input class="form-control" name="nombre"></div>
          <div class="form-group"><label>Fecha</label><input type="date" class="form-control" name="fecha"></div>
          <div class="form-group"><label>Archivo</label><input type="file" name="file" accept=".pdf,.jpg,.jpeg,.png" required></div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" onclick="document.getElementById('ft-modal').remove()">Cancelar</button>
            <button type="submit" class="btn btn-primary">Subir</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(ov);
    ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });
    document.getElementById('ft-doc-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      const fd = new FormData();
      fd.append('file', f.file.files[0]);
      fd.append('user_id', f.user_id.value);
      fd.append('categoria', f.categoria.value);
      fd.append('nombre', f.nombre.value || f.file.files[0].name);
      fd.append('fecha', f.fecha.value || new Date().toISOString().split('T')[0]);
      try {
        await API.upload('/fichate/documents', fd);
        ov.remove();
        this.vDocuments(document.getElementById('ft-content'));
      } catch (err) { alert(err.message); }
    });
  },

  async deleteDoc(id) {
    if (!confirm('¿Eliminar documento?')) return;
    try { await API.delete('/fichate/documents/' + id); this.vDocuments(document.getElementById('ft-content')); } catch (e) { alert(e.message); }
  },

  // ══════════════════════════════════════
  // VISTA: INFORMES
  // ══════════════════════════════════════
  vReports(c) {
    if (!this.isA()) { c.innerHTML = '<p>Sin permisos</p>'; return; }
    const month = new Date().toISOString().slice(0, 7);

    c.innerHTML = `
      <div class="ft-header"><h2>Informes</h2></div>
      <div style="margin-bottom:20px;">
        <label style="font-size:13px;font-weight:600;margin-right:8px;">Mes:</label>
        <input type="month" class="ft-inp" id="ft-rep-month" value="${month}">
      </div>
      <div class="ft-grid" style="grid-template-columns:repeat(3,1fr);">
        <div class="ft-card" style="cursor:pointer;text-align:center;" onclick="FichateModule.downloadCSV('hours')">
          <div style="font-size:36px;margin-bottom:8px;">📊</div>
          <div style="font-weight:700;">Registro de Jornada</div>
          <div style="font-size:12px;color:var(--txt3);margin-top:4px;">Entradas, salidas y horas por empleado</div>
        </div>
        <div class="ft-card" style="cursor:pointer;text-align:center;" onclick="FichateModule.downloadCSV('absences')">
          <div style="font-size:36px;margin-bottom:8px;">📅</div>
          <div style="font-weight:700;">Ausencias y Permisos</div>
          <div style="font-size:12px;color:var(--txt3);margin-top:4px;">Vacaciones, bajas y permisos</div>
        </div>
        <div class="ft-card" style="cursor:pointer;text-align:center;" onclick="FichateModule.downloadCSV('summary')">
          <div style="font-size:36px;margin-bottom:8px;">📈</div>
          <div style="font-weight:700;">Resumen Mensual</div>
          <div style="font-size:12px;color:var(--txt3);margin-top:4px;">Días, horas, vacaciones por empleado</div>
        </div>
      </div>
    `;
  },

  downloadCSV(type) {
    const month = document.getElementById('ft-rep-month')?.value || new Date().toISOString().slice(0, 7);
    const token = API.getToken();
    window.open(`/api/fichate/reports/csv?type=${type}&month=${month}&token=${token}`, '_blank');
  },

  // ══════════════════════════════════════
  // VISTA: AJUSTES
  // ══════════════════════════════════════
  async vSettings(c) {
    if (!this.isA()) { c.innerHTML = '<p>Sin permisos</p>'; return; }
    await this.loadData();

    c.innerHTML = `
      <div class="ft-header"><h2>Ajustes</h2></div>

      <div class="ft-card">
        <h3 style="font-weight:700;margin-bottom:16px;font-size:14px;">Festivos ${new Date().getFullYear()}</h3>
        <div style="margin-bottom:12px;">
          <button class="ft-btn ft-btn-p ft-btn-sm" onclick="FichateModule.addHolidayPrompt()">+ Añadir festivo</button>
        </div>
        <table class="ft-table">
          <thead><tr><th>Fecha</th><th>Nombre</th><th>Tipo</th><th></th></tr></thead>
          <tbody>
            ${this.hols.map(h => `<tr>
              <td>${new Date(h.fecha).toLocaleDateString('es-ES', {weekday:'short',day:'2-digit',month:'long'})}</td>
              <td><strong>${h.nombre}</strong></td>
              <td><span class="ft-badge" style="background:#e5e7eb;color:var(--txt);">${h.tipo}</span></td>
              <td><button class="ft-btn ft-btn-r ft-btn-sm" onclick="FichateModule.deleteHoliday(${h.id})">✕</button></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>

      <div class="ft-card">
        <h3 style="font-weight:700;margin-bottom:16px;font-size:14px;">Turnos</h3>
        <div style="margin-bottom:12px;">
          <button class="ft-btn ft-btn-p ft-btn-sm" onclick="FichateModule.addShiftModal()">+ Crear turno</button>
        </div>
        <div class="ft-grid" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr));">
          ${this.shifts.map(s => `
            <div class="ft-card" style="border-left:4px solid ${s.color || 'var(--accent)'};">
              <div style="font-weight:700;">${this.esc(s.nombre)}</div>
              <div style="font-size:12px;color:var(--txt3);margin-top:4px;">${s.hora_entrada} - ${s.hora_salida}</div>
              <div style="font-size:12px;color:var(--txt3);">Descanso: ${s.descanso_min || 0} min</div>
              <button class="ft-btn ft-btn-r ft-btn-sm" style="margin-top:8px;" onclick="FichateModule.deleteShift(${s.id})">Eliminar</button>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="ft-card">
        <h3 style="font-weight:700;margin-bottom:16px;font-size:14px;">Asignación de turnos</h3>
        <table class="ft-table">
          <thead><tr><th>Empleado</th><th>Turno actual</th><th>Cambiar a</th></tr></thead>
          <tbody>
            ${this.emps.filter(e => e.activo).map(e => `<tr>
              <td><strong>${this.esc(e.nombre)}</strong></td>
              <td>${this.shifts.find(s => s.id === e.shift_id)?.nombre || '<span style="color:var(--txt3);">Sin asignar</span>'}</td>
              <td>
                <select class="ft-sel" onchange="FichateModule.assignShift(${e.id}, this.value)">
                  <option value="">Sin turno</option>
                  ${this.shifts.map(s => `<option value="${s.id}" ${e.shift_id === s.id ? 'selected' : ''}>${this.esc(s.nombre)}</option>`).join('')}
                </select>
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  addHolidayPrompt() {
    const fecha = prompt('Fecha (AAAA-MM-DD):');
    if (!fecha) return;
    const nombre = prompt('Nombre del festivo:');
    if (!nombre) return;
    API.post('/fichate/holidays', { fecha, nombre, tipo: 'nacional' })
      .then(() => { this.loadData().then(() => this.vSettings(document.getElementById('ft-content'))); })
      .catch(e => alert(e.message));
  },

  async deleteHoliday(id) {
    if (!confirm('¿Eliminar festivo?')) return;
    try {
      await API.delete('/fichate/holidays/' + id);
      await this.loadData();
      this.vSettings(document.getElementById('ft-content'));
    } catch (e) { alert(e.message); }
  },

  addShiftModal() {
    const prev = document.getElementById('ft-modal');
    if (prev) prev.remove();
    const ov = document.createElement('div');
    ov.className = 'modal-overlay';
    ov.id = 'ft-modal';
    ov.innerHTML = `
      <div class="modal" style="max-width:400px;">
        <h2 class="modal-title">Crear turno</h2>
        <form id="ft-shift-form">
          <div class="form-group"><label>Nombre</label><input class="form-control" name="nombre" required placeholder="Ej: Mañana"></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group"><label>Entrada</label><input type="time" class="form-control" name="hora_entrada" value="09:00" required></div>
            <div class="form-group"><label>Salida</label><input type="time" class="form-control" name="hora_salida" value="17:00" required></div>
          </div>
          <div class="form-group"><label>Descanso (min)</label><input type="number" class="form-control" name="descanso_min" value="30"></div>
          <div class="form-group"><label>Color</label><input type="color" name="color" value="#ff4a6e" style="height:40px;border:none;"></div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" onclick="document.getElementById('ft-modal').remove()">Cancelar</button>
            <button type="submit" class="btn btn-primary">Crear</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(ov);
    ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });
    document.getElementById('ft-shift-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      try {
        await API.post('/fichate/shifts', {
          nombre: f.nombre.value, hora_entrada: f.hora_entrada.value,
          hora_salida: f.hora_salida.value, descanso_min: parseInt(f.descanso_min.value),
          color: f.color.value
        });
        ov.remove();
        await this.loadData();
        this.vSettings(document.getElementById('ft-content'));
      } catch (err) { alert(err.message); }
    });
  },

  async deleteShift(id) {
    if (!confirm('¿Eliminar turno?')) return;
    try {
      await API.delete('/fichate/shifts/' + id);
      await this.loadData();
      this.vSettings(document.getElementById('ft-content'));
    } catch (e) { alert(e.message); }
  },

  async assignShift(userId, shiftId) {
    try {
      await API.patch('/fichate/employees/' + userId, { shift_id: shiftId ? parseInt(shiftId) : null });
      await this.loadData();
    } catch (e) { alert(e.message); }
  }
};
