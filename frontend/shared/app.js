// === Gestavly — Shell principal ===

const App = {
  currentModule: null,
  notifInterval: null,

  init() {
    if (Auth.isLoggedIn()) {
      this.showApp();
    } else {
      this.showLogin();
    }
  },

  showLogin() {
    document.getElementById('login-view').classList.remove('hidden');
    document.getElementById('app-view').classList.add('hidden');
    this.setupLoginForm();
  },

  showApp() {
    document.getElementById('login-view').classList.add('hidden');
    document.getElementById('app-view').classList.remove('hidden');

    const user = Auth.getUser();
    document.getElementById('user-name').textContent = user.nombre;
    document.getElementById('user-role').textContent = user.rol;

    // Visibilidad por rol
    if (!Auth.hasRole('admin', 'superadmin', 'supervisor')) {
      document.getElementById('nav-import')?.classList.add('hidden');
      document.getElementById('nav-personas')?.classList.add('hidden');
      document.getElementById('nav-informes')?.classList.add('hidden');
    }
    if (!Auth.hasRole('admin', 'superadmin')) {
      document.getElementById('nav-usuarios')?.classList.add('hidden');
      document.getElementById('nav-settings')?.classList.add('hidden');
      document.getElementById('nav-assistant')?.classList.add('hidden');
      document.getElementById('nav-importar-polizas')?.classList.add('hidden');
    }

    // Inyectar iconos SVG en sidebar
    if (typeof Icons !== 'undefined') {
      const icoMap = {dashboard:'dashboard',personas:'contactos',pipeline:'pipeline',fichate:'fichate',tickets:'tickets',llamada:'llamada',calculadora:'calculadora',grabaciones:'grabaciones',informes:'informes',impagos:'impagos',importar:'importar','importar-polizas':'polizas',settings:'settings',asistente:'asistente',usuarios:'usuarios'};
      Object.entries(icoMap).forEach(([id, fn]) => {
        const el = document.getElementById('ico-' + id);
        if (el && Icons[fn]) el.innerHTML = Icons[fn](16);
      });
    }

    this.setupNavigation();

    // Recordar última ruta visitada
    const lastRoute = localStorage.getItem('lastRoute');
    const isAdmin = Auth.hasRole('admin', 'superadmin');
    const defaultRoute = isAdmin ? 'dashboard' : 'pipeline';
    this.navigate(lastRoute || defaultRoute);

    this.startNotificationPolling();
  },

  setupLoginForm() {
    const form = document.getElementById('login-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorEl = document.getElementById('login-error');
      errorEl.style.display = 'none';

      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;

      try {
        const data = await API.post('/auth/login', { email, password });
        Auth.login(data.token, data.user);
        this.showApp();
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.style.display = 'block';
      }
    });
  },

  setupNavigation() {
    const nav = document.getElementById('sidebar-nav');
    nav.addEventListener('click', (e) => {
      const link = e.target.closest('.sidebar-link');
      if (!link) return;
      const module = link.dataset.module;
      if (module) this.navigate(module);
    });

    document.getElementById('btn-logout').addEventListener('click', () => {
      if (this.notifInterval) clearInterval(this.notifInterval);
      Auth.logout();
    });

    // Sidebar toggle
    document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
      const sb = document.getElementById('sidebar');
      if (!sb) return;
      sb.classList.toggle('collapsed');
      localStorage.setItem('sidebar', sb.classList.contains('collapsed') ? '1' : '0');
    });
  },

  navigate(moduleName) {
    document.querySelectorAll('.sidebar-link').forEach((el) => {
      el.classList.toggle('active', el.dataset.module === moduleName);
    });

    this.currentModule = moduleName;
    localStorage.setItem('lastRoute', moduleName);
    this.loadModule(moduleName);
  },

  async loadModule(name) {
    const container = document.getElementById('main-content');
    // Resetear estilos del iframe cuando se cambia de módulo
    container.style.padding = '';
    container.style.overflow = '';

    const modules = {
      dashboard: () => DashboardModule.render(),
      personas: () => PersonasModule.render(),
      tickets: () => TicketsModule.render(),
      import: () => ImportModule.render(),
      settings: () => SettingsModule.render(),
      assistant: () => AssistantModule.render(),
      usuarios: () => this.renderUsuarios(),
      fichate: () => FichateModule.render(),
      llamada: () => LlamadaModule.render(),
      calculadora: () => {
        container.style.padding = '0';
        container.style.overflow = 'hidden';
        container.innerHTML = '<iframe src="/calculadora/index.html" style="width:100%;height:calc(100vh - 60px);border:none;"></iframe>';
      },
      grabaciones: () => this.renderGrabacionesList(),
      leads: () => PipelineModule.render(),
      pipeline: () => PipelineModule.render(),
      informes: () => InformesModule.render(),
      'importar-polizas': () => ImportarPolizasModule.render(),
      impagos: () => this.renderPlaceholder('Impagos', 'Módulo de impagos — próximamente en Fase 5'),
    };

    const render = modules[name];
    if (render) {
      await render();
    } else {
      container.innerHTML = '<p>Módulo no encontrado.</p>';
    }
  },

  // === Notificaciones ===
  startNotificationPolling() {
    this.checkNotifications();
    this.notifInterval = setInterval(() => this.checkNotifications(), 30000);
  },

  async checkNotifications() {
    try {
      const data = await API.get('/notifications/unread-count');
      const badge = document.getElementById('badge-tickets');
      if (data.count > 0) {
        badge.textContent = data.count;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    } catch {
      // Silenciar errores de polling
    }
    // Grabaciones pendientes
    try {
      const gData = await API.get('/grabaciones/pendientes');
      const gBadge = document.getElementById('badge-grabaciones');
      if (gBadge) {
        if (gData.count > 0) {
          gBadge.textContent = gData.count;
          gBadge.classList.remove('hidden');
        } else {
          gBadge.classList.add('hidden');
        }
      }
    } catch {
      // Silenciar
    }
  },

  // === Dashboard ===
  renderDashboard() {
    const user = Auth.getUser();
    const container = document.getElementById('main-content');
    container.innerHTML = `
      <h1 class="page-title">Dashboard</h1>
      <div class="card">
        <h3>Bienvenido, ${user.nombre}</h3>
        <p class="text-light mt-8">Rol: <span class="badge badge-${user.rol}">${user.rol}</span></p>
        <p class="text-light mt-16">Gestavly — tu CRM para gestión de seguros de salud.</p>
      </div>
      <div class="dashboard-stats" id="dashboard-stats">
        <div class="card text-center"><p class="text-light">Cargando estadísticas...</p></div>
      </div>
    `;
    this.loadDashboardStats();
  },

  async loadDashboardStats() {
    const container = document.getElementById('dashboard-stats');
    try {
      const tickets = await API.get('/tickets');
      const byEstado = {};
      tickets.forEach((t) => {
        byEstado[t.estado] = (byEstado[t.estado] || 0) + 1;
      });

      const stats = [
        { label: 'Nuevos', value: byEstado.nuevo || 0, color: '#1565c0' },
        { label: 'En gestión', value: byEstado.en_gestion || 0, color: '#e65100' },
        { label: 'Esperando', value: byEstado.esperando || 0, color: '#f9a825' },
        { label: 'Resueltos', value: byEstado.resuelto || 0, color: '#2e7d32' },
        { label: 'Total', value: tickets.length, color: 'var(--accent)' },
      ];

      container.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;margin-top:16px;">
          ${stats.map((s) => `
            <div class="card text-center">
              <p style="font-size:32px;font-weight:700;color:${s.color};">${s.value}</p>
              <p class="text-light" style="font-size:14px;">${s.label}</p>
            </div>
          `).join('')}
        </div>
      `;
    } catch {
      container.innerHTML = '';
    }
  },

  // === Grabaciones (vista de listado nativa) ===
  async renderGrabacionesList() {
    const container = document.getElementById('main-content');
    container.innerHTML = `
      <h1 class="page-title">Grabaciones</h1>
      <div class="tabs" id="grab-tabs">
        <button class="tab-btn active" data-tab="llamadas">Llamadas CloudTalk</button>
        <button class="tab-btn" data-tab="polizas">Grabaciones de pólizas</button>
      </div>
      <div class="card" id="grab-container"><p class="text-light">Cargando...</p></div>
    `;

    const renderLlamadas = async () => {
      const gc = document.getElementById('grab-container');
      gc.innerHTML = '<p class="text-light">Cargando...</p>';
      try {
        const data = await API.get('/history/recordings/list?limit=100');
        const recs = data.data || [];
        if (recs.length === 0) {
          gc.innerHTML = '<p class="text-light">No hay llamadas grabadas en CloudTalk.</p>';
          return;
        }
        gc.innerHTML = `<div class="table-wrapper"><table><thead><tr><th>Fecha</th><th>Contacto</th><th>Agente</th><th>Duración</th><th>Estado</th><th></th></tr></thead><tbody>
          ${recs.map(r => {
            const m = r.metadata || {};
            const dur = m.duracion_seg ? Math.floor(m.duracion_seg/60)+':'+String(m.duracion_seg%60).padStart(2,'0') : '—';
            const subLabels = { contestada:'Contestada', no_contestada:'No contestada', buzon:'Buzón' };
            const subColors = { contestada:'#10b981', no_contestada:'#ef4444', buzon:'#f59e0b' };
            const subColor = subColors[r.subtipo] || '#94a3b8';
            return `<tr>
              <td style="white-space:nowrap;">${new Date(r.created_at).toLocaleString('es-ES',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}</td>
              <td><a href="#" onclick="App.navigate('personas');setTimeout(()=>PersonasModule.showFicha(${r.persona_id}),200);return false" style="color:#009DDD;text-decoration:none;font-weight:600;">${r.persona_nombre||'—'}</a><br><span class="text-light" style="font-size:11px;">${r.persona_telefono||''}</span></td>
              <td>${r.agente_nombre||'—'}</td>
              <td>${dur}</td>
              <td><span class="badge" style="background:${subColor};color:#fff;font-size:11px;">${subLabels[r.subtipo]||r.subtipo||'—'}</span></td>
              <td><a href="${m.grabacion_url}" target="_blank" style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:#e6f6fd;border:1px solid #009DDD;border-radius:6px;color:#009DDD;font-size:11px;font-weight:600;text-decoration:none;">▶ Escuchar</a></td>
            </tr>`;
          }).join('')}
        </tbody></table></div>`;
      } catch (err) {
        gc.innerHTML = `<p style="color:#c62828;">${err.message}</p>`;
      }
    };

    const renderPolizas = async () => {
      const gc = document.getElementById('grab-container');
      gc.innerHTML = '<p class="text-light">Cargando...</p>';
      try {
        const data = await API.get('/grabaciones/polizas?limit=100');
        const polizas = data.polizas || [];
        if (polizas.length === 0) {
          gc.innerHTML = '<p class="text-light">No hay pólizas grabadas. Graba desde la ficha de un contacto.</p>';
          return;
        }
        const estadoLabels = { grabado:'Grabado', solicitud_enviada:'Solicitud enviada', aceptado:'Aceptado', poliza_emitida:'Emitida', rechazado:'Rechazado', baja:'Baja', impago:'Impago' };
        const estadoColors = { grabado:'#f59e0b', solicitud_enviada:'#3b82f6', aceptado:'#10b981', poliza_emitida:'#059669', rechazado:'#ef4444', baja:'#6b7280', impago:'#dc2626' };
        gc.innerHTML = `<div class="table-wrapper"><table><thead><tr><th>Cliente</th><th>Producto</th><th>Estado</th><th>Prima</th><th>Nº Póliza</th><th>Agente</th><th>Fecha</th></tr></thead><tbody>
          ${polizas.map(p => `<tr style="cursor:pointer" onclick="App.navigate('personas');setTimeout(()=>PersonasModule.showFicha(${p.persona_id}),200)">
            <td><strong>${p.persona_nombre||'—'}</strong><br><span class="text-light" style="font-size:11px;">${p.persona_dni||''}</span></td>
            <td>${p.producto||'—'}<br><span class="text-light" style="font-size:11px;">${p.compania||''}</span></td>
            <td><span class="badge" style="background:${estadoColors[p.estado]||'#6b7280'};color:#fff;font-size:11px;">${estadoLabels[p.estado]||p.estado}</span></td>
            <td>${p.prima_mensual?parseFloat(p.prima_mensual).toFixed(2)+' €':'—'}</td>
            <td>${p.n_poliza||'—'}</td>
            <td>${p.agente_nombre||'—'}</td>
            <td>${p.created_at?new Date(p.created_at).toLocaleDateString('es-ES'):'—'}</td>
          </tr>`).join('')}
        </tbody></table></div>`;
      } catch (err) {
        gc.innerHTML = `<p style="color:#c62828;">${err.message}</p>`;
      }
    };

    // Tab switching
    document.getElementById('grab-tabs').addEventListener('click', (e) => {
      const btn = e.target.closest('.tab-btn');
      if (!btn) return;
      document.querySelectorAll('#grab-tabs .tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (btn.dataset.tab === 'llamadas') renderLlamadas();
      else renderPolizas();
    });

    // Default: llamadas CloudTalk
    renderLlamadas();
  },

  // === Placeholder ===
  renderPlaceholder(title, description) {
    const container = document.getElementById('main-content');
    container.innerHTML = `
      <h1 class="page-title">${title}</h1>
      <div class="card text-center" style="padding:64px 24px;">
        <p style="font-size:48px;margin-bottom:16px;">🚧</p>
        <p class="text-light">${description}</p>
      </div>
    `;
  },

  // === Usuarios ===
  async renderUsuarios() {
    if (!Auth.hasRole('admin')) {
      return this.renderPlaceholder('Acceso denegado', 'No tienes permiso para ver esta sección.');
    }

    const container = document.getElementById('main-content');
    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <h1 class="page-title" style="margin-bottom:0;">Usuarios</h1>
        <button class="btn btn-primary" id="btn-new-user">+ Nuevo usuario</button>
      </div>
      <div class="card mt-16">
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Fecha alta</th>
              </tr>
            </thead>
            <tbody id="users-table-body">
              <tr><td colspan="5" class="text-center text-light">Cargando...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    try {
      const users = await API.get('/auth/users');
      const tbody = document.getElementById('users-table-body');
      if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-light">No hay usuarios</td></tr>';
        return;
      }
      tbody.innerHTML = users.map((u) => `
        <tr>
          <td><strong>${u.nombre}</strong></td>
          <td>${u.email}</td>
          <td><span class="badge badge-${u.rol}">${u.rol}</span></td>
          <td>${u.activo ? '✅ Activo' : '❌ Inactivo'}</td>
          <td class="text-light">${new Date(u.created_at).toLocaleDateString('es-ES')}</td>
        </tr>
      `).join('');
    } catch (err) {
      document.getElementById('users-table-body').innerHTML =
        `<tr><td colspan="5" class="text-center" style="color:#c62828">${err.message}</td></tr>`;
    }

    document.getElementById('btn-new-user').addEventListener('click', () => {
      this.showNewUserModal();
    });
  },

  showNewUserModal(onSuccess) {
    const prev = document.getElementById('modal-new-user');
    if (prev) prev.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-new-user';
    overlay.innerHTML = `
      <div class="modal">
        <h2 class="modal-title">Nuevo usuario</h2>
        <div id="modal-error" class="login-error"></div>
        <form id="form-new-user">
          <div class="form-group">
            <label>Nombre</label>
            <input type="text" class="form-control" name="nombre" required>
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" class="form-control" name="email" required>
          </div>
          <div class="form-group">
            <label>Contraseña</label>
            <input type="password" class="form-control" name="password" required minlength="6">
          </div>
          <div class="form-group">
            <label>Rol</label>
            <select class="form-control" name="rol" required>
              <option value="agent">Agent</option>
              <option value="supervisor">Supervisor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" id="btn-cancel-user">Cancelar</button>
            <button type="submit" class="btn btn-primary">Crear usuario</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('btn-cancel-user').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    document.getElementById('form-new-user').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const errorEl = document.getElementById('modal-error');
      errorEl.style.display = 'none';

      const body = {
        nombre: form.nombre.value,
        email: form.email.value,
        password: form.password.value,
        rol: form.rol.value,
      };

      try {
        await API.post('/auth/users', body);
        overlay.remove();
        if (onSuccess) onSuccess();
        else this.renderUsuarios();
      } catch (err) {
        errorEl.textContent = err.message;
        errorEl.style.display = 'block';
      }
    });
  },
};

// Iniciar la app
document.addEventListener('DOMContentLoaded', () => {
  // Restaurar estado del sidebar desde localStorage
  if (localStorage.getItem('sidebar') === '1') {
    document.getElementById('sidebar')?.classList.add('collapsed');
  }
  App.init();
});
