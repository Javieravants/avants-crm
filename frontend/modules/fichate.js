// === Módulo Fichate — Control horario y RRHH ===

const FichateModule = {
  activeTab: 'fichaje',

  async render() {
    const container = document.getElementById('main-content');
    const isAdmin = Auth.hasRole('admin', 'supervisor');

    container.innerHTML = `
      <h1 class="page-title">Fichate</h1>
      <div class="tabs" id="fichate-tabs" style="margin-bottom:16px;">
        <button class="tab-btn active" data-tab="fichaje">Fichaje</button>
        <button class="tab-btn" data-tab="registros">Mis registros</button>
        <button class="tab-btn" data-tab="ausencias">Ausencias</button>
        ${isAdmin ? '<button class="tab-btn" data-tab="dashboard">Dashboard</button>' : ''}
        ${isAdmin ? '<button class="tab-btn" data-tab="equipo">Equipo</button>' : ''}
        ${isAdmin ? '<button class="tab-btn" data-tab="festivos">Festivos</button>' : ''}
      </div>
      <div id="fichate-content"></div>
    `;

    document.getElementById('fichate-tabs').addEventListener('click', (e) => {
      const btn = e.target.closest('.tab-btn');
      if (!btn) return;
      document.querySelectorAll('#fichate-tabs .tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this.activeTab = btn.dataset.tab;
      this.renderTab(btn.dataset.tab);
    });

    this.renderTab('fichaje');
  },

  async renderTab(tab) {
    const c = document.getElementById('fichate-content');
    if (tab === 'fichaje') await this.renderFichaje(c);
    else if (tab === 'registros') await this.renderRegistros(c);
    else if (tab === 'ausencias') await this.renderAusencias(c);
    else if (tab === 'dashboard') await this.renderDashboard(c);
    else if (tab === 'equipo') await this.renderEquipo(c);
    else if (tab === 'festivos') await this.renderFestivos(c);
  },

  // === FICHAJE ===
  async renderFichaje(c) {
    c.innerHTML = '<div class="card" style="padding:40px;text-align:center;"><p class="text-light">Cargando...</p></div>';

    try {
      const data = await API.get('/fichate/status');
      const isClockedIn = data.is_clocked_in;
      const records = data.records || [];

      // Calcular horas trabajadas hoy
      let totalHours = 0;
      records.forEach(r => {
        if (r.clock_in && r.clock_out) {
          totalHours += (new Date(r.clock_out) - new Date(r.clock_in)) / 3600000;
        } else if (r.clock_in && !r.clock_out) {
          totalHours += (new Date() - new Date(r.clock_in)) / 3600000;
        }
      });

      const h = Math.floor(totalHours);
      const m = Math.round((totalHours - h) * 60);

      c.innerHTML = `
        <div class="card" style="padding:40px;text-align:center;">
          <div style="font-size:48px;margin-bottom:16px;">${isClockedIn ? '🟢' : '🔴'}</div>
          <div style="font-size:20px;font-weight:700;margin-bottom:8px;">
            ${isClockedIn ? 'Estás fichado' : 'No fichado'}
          </div>
          <div style="font-size:36px;font-weight:700;color:var(--accent);margin-bottom:24px;">
            ${h}h ${m}m
          </div>
          <button class="btn ${isClockedIn ? 'btn-secondary' : 'btn-primary'}" id="btn-clock"
            style="font-size:18px;padding:16px 48px;border-radius:16px;">
            ${isClockedIn ? '⏹ Fichar salida' : '▶ Fichar entrada'}
          </button>
          ${records.length > 0 ? `
            <div style="margin-top:24px;text-align:left;">
              <p style="font-size:13px;font-weight:700;color:var(--txt2);margin-bottom:8px;">Registros de hoy</p>
              ${records.map(r => `
                <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px;">
                  <span>Entrada: ${r.clock_in ? new Date(r.clock_in).toLocaleTimeString('es-ES', {hour:'2-digit',minute:'2-digit'}) : '—'}</span>
                  <span>Salida: ${r.clock_out ? new Date(r.clock_out).toLocaleTimeString('es-ES', {hour:'2-digit',minute:'2-digit'}) : '—'}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;

      document.getElementById('btn-clock').addEventListener('click', async () => {
        try {
          await API.post('/fichate/clock', { action: 'toggle' });
          this.renderFichaje(c);
        } catch (err) {
          alert(err.message);
        }
      });
    } catch (err) {
      c.innerHTML = `<div class="card"><p style="color:#c62828;">${err.message}</p></div>`;
    }
  },

  // === REGISTROS ===
  async renderRegistros(c) {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

    c.innerHTML = `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h3 style="font-weight:700;">Mis registros</h3>
          <input type="month" id="fichate-month" value="${month}" style="padding:6px 12px;border:1px solid var(--border);border-radius:8px;">
        </div>
        <div id="fichate-records-table"><p class="text-light">Cargando...</p></div>
      </div>
    `;

    const load = async (m) => {
      const data = await API.get('/fichate/records?month=' + m);
      const tableEl = document.getElementById('fichate-records-table');
      const records = data.records || [];

      if (records.length === 0) {
        tableEl.innerHTML = '<p class="text-light">Sin registros este mes</p>';
        return;
      }

      // Agrupar por día
      const byDay = {};
      records.forEach(r => {
        const day = r.fecha?.split('T')[0] || r.fecha;
        if (!byDay[day]) byDay[day] = [];
        byDay[day].push(r);
      });

      let totalHoras = 0;
      const rows = Object.entries(byDay).sort(([a],[b]) => b.localeCompare(a)).map(([day, recs]) => {
        let dayHours = 0;
        recs.forEach(r => {
          if (r.clock_in && r.clock_out) {
            dayHours += (new Date(r.clock_out) - new Date(r.clock_in)) / 3600000;
          }
        });
        totalHoras += dayHours;
        const h = Math.floor(dayHours);
        const min = Math.round((dayHours - h) * 60);

        return `<tr>
          <td>${new Date(day).toLocaleDateString('es-ES', {weekday:'short', day:'2-digit', month:'short'})}</td>
          <td>${recs.map(r => r.clock_in ? new Date(r.clock_in).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}) : '—').join(', ')}</td>
          <td>${recs.map(r => r.clock_out ? new Date(r.clock_out).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}) : '—').join(', ')}</td>
          <td><strong>${h}h ${min}m</strong></td>
        </tr>`;
      });

      const th = Math.floor(totalHoras);
      const tm = Math.round((totalHoras - th) * 60);

      tableEl.innerHTML = `
        <div class="table-wrapper">
          <table>
            <thead><tr><th>Día</th><th>Entrada</th><th>Salida</th><th>Horas</th></tr></thead>
            <tbody>${rows.join('')}</tbody>
            <tfoot><tr><td colspan="3" style="text-align:right;font-weight:700;">Total mes:</td><td style="font-weight:700;color:var(--accent);">${th}h ${tm}m</td></tr></tfoot>
          </table>
        </div>
      `;
    };

    await load(month);
    document.getElementById('fichate-month').addEventListener('change', (e) => load(e.target.value));
  },

  // === AUSENCIAS ===
  async renderAusencias(c) {
    c.innerHTML = `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h3 style="font-weight:700;">Ausencias</h3>
          <button class="btn btn-primary btn-sm" id="btn-nueva-ausencia">+ Solicitar ausencia</button>
        </div>
        <div id="fichate-ausencias-list"><p class="text-light">Cargando...</p></div>
      </div>
    `;

    const estadoColors = { pendiente: '#f59e0b', aprobada: '#10b981', rechazada: '#ef4444', cancelada: '#6b7280' };
    const tipoLabels = { vacaciones:'Vacaciones', medica:'Baja médica', personal:'Personal', maternidad:'Maternidad/Paternidad', formacion:'Formación', compensacion:'Compensación', otro:'Otro' };
    const isAdmin = Auth.hasRole('admin', 'supervisor');

    try {
      const data = await API.get('/fichate/absences');
      const listEl = document.getElementById('fichate-ausencias-list');
      const reqs = data.requests || [];

      if (reqs.length === 0) {
        listEl.innerHTML = '<p class="text-light">Sin solicitudes de ausencia</p>';
      } else {
        listEl.innerHTML = `
          <div class="table-wrapper">
            <table>
              <thead><tr><th>Empleado</th><th>Tipo</th><th>Desde</th><th>Hasta</th><th>Estado</th>${isAdmin ? '<th>Acción</th>' : ''}</tr></thead>
              <tbody>
                ${reqs.map(r => `
                  <tr>
                    <td>${r.employee_name || '—'}</td>
                    <td>${tipoLabels[r.tipo] || r.tipo}</td>
                    <td>${r.fecha_inicio ? new Date(r.fecha_inicio).toLocaleDateString('es-ES') : '—'}</td>
                    <td>${r.fecha_fin ? new Date(r.fecha_fin).toLocaleDateString('es-ES') : '—'}</td>
                    <td><span class="badge" style="background:${estadoColors[r.estado] || '#6b7280'};color:#fff;">${r.estado}</span></td>
                    ${isAdmin && r.estado === 'pendiente' ? `
                      <td>
                        <button class="btn btn-sm" style="background:#10b981;color:#fff;margin-right:4px;" onclick="FichateModule.reviewAbsence(${r.id},'aprobada')">Aprobar</button>
                        <button class="btn btn-sm" style="background:#ef4444;color:#fff;" onclick="FichateModule.reviewAbsence(${r.id},'rechazada')">Rechazar</button>
                      </td>
                    ` : (isAdmin ? '<td>—</td>' : '')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
    } catch (err) {
      document.getElementById('fichate-ausencias-list').innerHTML = `<p style="color:#c62828;">${err.message}</p>`;
    }

    document.getElementById('btn-nueva-ausencia').addEventListener('click', () => this.showAbsenceForm());
  },

  showAbsenceForm() {
    const prev = document.getElementById('modal-absence');
    if (prev) prev.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-absence';
    overlay.innerHTML = `
      <div class="modal">
        <h2 class="modal-title">Solicitar ausencia</h2>
        <form id="form-absence">
          <div class="form-group">
            <label>Tipo</label>
            <select class="form-control" name="tipo" required>
              <option value="vacaciones">Vacaciones</option>
              <option value="medica">Baja médica</option>
              <option value="personal">Personal</option>
              <option value="maternidad">Maternidad/Paternidad</option>
              <option value="formacion">Formación</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div class="form-group"><label>Desde</label><input type="date" class="form-control" name="fecha_inicio" required></div>
          <div class="form-group"><label>Hasta</label><input type="date" class="form-control" name="fecha_fin" required></div>
          <div class="form-group"><label>Motivo</label><textarea class="form-control" name="motivo" rows="2"></textarea></div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" id="btn-cancel-absence">Cancelar</button>
            <button type="submit" class="btn btn-primary">Enviar solicitud</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('btn-cancel-absence').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    document.getElementById('form-absence').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      try {
        await API.post('/fichate/absences', {
          tipo: form.tipo.value,
          fecha_inicio: form.fecha_inicio.value,
          fecha_fin: form.fecha_fin.value,
          motivo: form.motivo.value
        });
        overlay.remove();
        this.renderTab('ausencias');
      } catch (err) {
        alert(err.message);
      }
    });
  },

  async reviewAbsence(id, estado) {
    const motivo = estado === 'rechazada' ? prompt('Motivo del rechazo:') : null;
    if (estado === 'rechazada' && motivo === null) return;
    try {
      await API.patch('/fichate/absences/' + id, { estado, motivo_rechazo: motivo });
      this.renderTab('ausencias');
    } catch (err) {
      alert(err.message);
    }
  },

  // === DASHBOARD (admin) ===
  async renderDashboard(c) {
    c.innerHTML = '<div class="card"><p class="text-light">Cargando dashboard...</p></div>';
    try {
      const data = await API.get('/fichate/dashboard');
      c.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;margin-bottom:16px;">
          <div class="card text-center">
            <p style="font-size:32px;font-weight:700;color:#3b82f6;">${data.active_employees}</p>
            <p class="text-light" style="font-size:13px;">Empleados activos</p>
          </div>
          <div class="card text-center">
            <p style="font-size:32px;font-weight:700;color:#10b981;">${data.clocked_in}</p>
            <p class="text-light" style="font-size:13px;">Fichados ahora</p>
          </div>
          <div class="card text-center">
            <p style="font-size:32px;font-weight:700;color:var(--accent);">${data.hours_today}h</p>
            <p class="text-light" style="font-size:13px;">Horas hoy</p>
          </div>
          <div class="card text-center">
            <p style="font-size:32px;font-weight:700;color:#f59e0b;">${data.pending_requests}</p>
            <p class="text-light" style="font-size:13px;">Solicitudes pendientes</p>
          </div>
        </div>
        <div class="card">
          <h3 style="font-weight:700;margin-bottom:12px;">Fichajes de hoy</h3>
          ${data.today_records.length === 0 ? '<p class="text-light">Nadie ha fichado aún</p>' : `
            <div class="table-wrapper">
              <table>
                <thead><tr><th>Empleado</th><th>Entrada</th><th>Salida</th><th>Estado</th></tr></thead>
                <tbody>
                  ${data.today_records.map(r => `
                    <tr>
                      <td><strong>${r.employee_name}</strong></td>
                      <td>${r.clock_in ? new Date(r.clock_in).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}) : '—'}</td>
                      <td>${r.clock_out ? new Date(r.clock_out).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}) : '—'}</td>
                      <td>${r.clock_out ? '<span class="badge" style="background:#6b7280;color:#fff;">Finalizado</span>' : '<span class="badge" style="background:#10b981;color:#fff;">Trabajando</span>'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      `;
    } catch (err) {
      c.innerHTML = `<div class="card"><p style="color:#c62828;">${err.message}</p></div>`;
    }
  },

  // === EQUIPO (admin) ===
  async renderEquipo(c) {
    c.innerHTML = '<div class="card"><p class="text-light">Cargando equipo...</p></div>';
    try {
      const data = await API.get('/fichate/dashboard');
      const today = new Date().toISOString().split('T')[0];

      // Obtener todos los registros de hoy agrupados por usuario
      const recordsData = await API.get('/fichate/records?month=' + today.slice(0, 7));
      const todayRecs = (recordsData.records || []).filter(r => (r.fecha?.split('T')[0] || r.fecha) === today);
      const byUser = {};
      todayRecs.forEach(r => {
        if (!byUser[r.employee_name]) byUser[r.employee_name] = [];
        byUser[r.employee_name].push(r);
      });

      c.innerHTML = `
        <div class="card">
          <h3 style="font-weight:700;margin-bottom:12px;">Presencia del equipo</h3>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;">
            ${Object.entries(byUser).map(([name, recs]) => {
              const isIn = recs.some(r => !r.clock_out);
              let hours = 0;
              recs.forEach(r => {
                if (r.clock_in && r.clock_out) hours += (new Date(r.clock_out) - new Date(r.clock_in)) / 3600000;
                else if (r.clock_in) hours += (new Date() - new Date(r.clock_in)) / 3600000;
              });
              return `
                <div class="card" style="padding:16px;border-left:4px solid ${isIn ? '#10b981' : '#6b7280'};">
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                    <span style="font-size:16px;">${isIn ? '🟢' : '⚪'}</span>
                    <strong style="font-size:14px;">${name}</strong>
                  </div>
                  <p class="text-light" style="font-size:12px;">${hours.toFixed(1)}h hoy</p>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    } catch (err) {
      c.innerHTML = `<div class="card"><p style="color:#c62828;">${err.message}</p></div>`;
    }
  },

  // === FESTIVOS (admin) ===
  async renderFestivos(c) {
    const year = new Date().getFullYear();
    c.innerHTML = `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h3 style="font-weight:700;">Festivos ${year}</h3>
          <button class="btn btn-primary btn-sm" id="btn-add-holiday">+ Añadir festivo</button>
        </div>
        <div id="fichate-holidays-list"><p class="text-light">Cargando...</p></div>
      </div>
    `;

    try {
      const data = await API.get('/fichate/holidays?year=' + year);
      const listEl = document.getElementById('fichate-holidays-list');
      const holidays = data.holidays || [];

      if (holidays.length === 0) {
        listEl.innerHTML = '<p class="text-light">No hay festivos configurados para este año</p>';
      } else {
        listEl.innerHTML = `
          <div class="table-wrapper">
            <table>
              <thead><tr><th>Fecha</th><th>Nombre</th><th>Tipo</th><th></th></tr></thead>
              <tbody>
                ${holidays.map(h => `
                  <tr>
                    <td>${new Date(h.fecha).toLocaleDateString('es-ES', {weekday:'short', day:'2-digit', month:'long'})}</td>
                    <td><strong>${h.nombre}</strong></td>
                    <td><span class="badge badge-supervisor">${h.tipo}</span></td>
                    <td><button class="btn btn-sm" style="background:#ef4444;color:#fff;font-size:11px;" onclick="FichateModule.deleteHoliday(${h.id})">Eliminar</button></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
    } catch (err) {
      document.getElementById('fichate-holidays-list').innerHTML = `<p style="color:#c62828;">${err.message}</p>`;
    }

    document.getElementById('btn-add-holiday').addEventListener('click', () => {
      const fecha = prompt('Fecha del festivo (AAAA-MM-DD):');
      if (!fecha) return;
      const nombre = prompt('Nombre del festivo:');
      if (!nombre) return;
      API.post('/fichate/holidays', { fecha, nombre, tipo: 'nacional' })
        .then(() => this.renderTab('festivos'))
        .catch(err => alert(err.message));
    });
  },

  async deleteHoliday(id) {
    if (!confirm('¿Eliminar este festivo?')) return;
    try {
      await API.delete('/fichate/holidays/' + id);
      this.renderTab('festivos');
    } catch (err) {
      alert(err.message);
    }
  }
};
