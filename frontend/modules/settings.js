// === Módulo Settings (solo admin) ===

const SettingsModule = {
  currentTab: 'ticket-types',

  async render() {
    if (!Auth.hasRole('admin')) {
      document.getElementById('main-content').innerHTML = `
        <h1 class="page-title">Acceso denegado</h1>
        <div class="card text-center" style="padding:64px;"><p class="text-light">No tienes permiso.</p></div>
      `;
      return;
    }

    const container = document.getElementById('main-content');
    const isSuperadmin = Auth.hasRole('superadmin');
    container.innerHTML = `
      <h1 class="page-title">Configuración</h1>
      <div class="tabs" id="settings-tabs">
        <button class="tab-btn active" data-tab="ticket-types">Tipos de trámites</button>
        <button class="tab-btn" data-tab="ticket-columns">Columnas / Bandejas</button>
        <button class="tab-btn" data-tab="users">Usuarios</button>
        ${isSuperadmin ? '<button class="tab-btn" data-tab="importar-polizas">Importación de Pólizas</button>' : ''}
      </div>
      <div class="card" style="margin-top:16px;" id="settings-content">
        <p class="text-light">Cargando...</p>
      </div>
    `;

    document.getElementById('settings-tabs').addEventListener('click', (e) => {
      const btn = e.target.closest('.tab-btn');
      if (!btn) return;
      this.currentTab = btn.dataset.tab;
      document.querySelectorAll('#settings-tabs .tab-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      this.loadTab();
    });

    this.loadTab();
  },

  async loadTab() {
    const content = document.getElementById('settings-content');
    content.innerHTML = '<p class="text-light">Cargando...</p>';

    try {
      if (this.currentTab === 'ticket-types') await this.renderTicketTypes(content);
      else if (this.currentTab === 'ticket-columns') await this.renderTicketColumns(content);
      else if (this.currentTab === 'users') await this.renderUsers(content);
      else if (this.currentTab === 'importar-polizas') await this.renderImportarPolizas(content);
    } catch (err) {
      content.innerHTML = `<p style="color:#c62828">${err.message}</p>`;
    }
  },

  // =============================================
  // TIPOS DE TRÁMITES
  // =============================================
  async renderTicketTypes(container) {
    const types = await API.get('/settings/ticket-types');
    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="margin:0;">Tipos de trámites</h3>
        <button class="btn btn-primary" id="btn-add-type">+ Añadir tipo</button>
      </div>
      <table>
        <thead><tr><th>ID</th><th>Nombre</th><th>Orden</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody id="types-tbody">
          ${types.map((t) => `
            <tr>
              <td>${t.id}</td>
              <td><strong>${t.nombre}</strong></td>
              <td>${t.orden}</td>
              <td>${t.activo ? '<span class="badge badge-agent">Activo</span>' : '<span class="badge" style="background:#eee;color:#999;">Inactivo</span>'}</td>
              <td>
                <button class="btn btn-secondary btn-sm" data-edit-type="${t.id}" data-nombre="${t.nombre}" data-orden="${t.orden}" data-activo="${t.activo}">Editar</button>
                <button class="btn btn-secondary btn-sm" data-delete-type="${t.id}" style="color:#c62828;">Eliminar</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    document.getElementById('btn-add-type').addEventListener('click', () => this.showTypeModal());

    container.querySelectorAll('[data-edit-type]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.showTypeModal({
          id: btn.dataset.editType,
          nombre: btn.dataset.nombre,
          orden: btn.dataset.orden,
          activo: btn.dataset.activo === 'true',
        });
      });
    });

    container.querySelectorAll('[data-delete-type]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('¿Eliminar este tipo de trámite?')) return;
        await API.delete(`/settings/ticket-types/${btn.dataset.deleteType}`);
        this.loadTab();
      });
    });
  },

  showTypeModal(existing) {
    const prev = document.getElementById('modal-settings');
    if (prev) prev.remove();

    const isEdit = !!existing;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-settings';
    overlay.innerHTML = `
      <div class="modal">
        <h2 class="modal-title">${isEdit ? 'Editar' : 'Nuevo'} tipo de trámite</h2>
        <form id="form-type">
          <div class="form-group">
            <label>Nombre</label>
            <input type="text" class="form-control" name="nombre" value="${isEdit ? existing.nombre : ''}" required>
          </div>
          <div class="form-group">
            <label>Orden</label>
            <input type="number" class="form-control" name="orden" value="${isEdit ? existing.orden : 0}">
          </div>
          ${isEdit ? `
          <div class="form-group">
            <label>Estado</label>
            <select class="form-control" name="activo">
              <option value="true" ${existing.activo ? 'selected' : ''}>Activo</option>
              <option value="false" ${!existing.activo ? 'selected' : ''}>Inactivo</option>
            </select>
          </div>` : ''}
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
            <button type="submit" class="btn btn-primary">${isEdit ? 'Guardar' : 'Crear'}</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    document.getElementById('form-type').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const body = { nombre: form.nombre.value, orden: parseInt(form.orden.value) || 0 };
      if (isEdit) body.activo = form.activo.value === 'true';

      if (isEdit) {
        await API.patch(`/settings/ticket-types/${existing.id}`, body);
      } else {
        await API.post('/settings/ticket-types', body);
      }
      overlay.remove();
      this.loadTab();
    });
  },

  // =============================================
  // COLUMNAS / BANDEJAS
  // =============================================
  async renderTicketColumns(container) {
    const [columns, users] = await Promise.all([
      API.get('/settings/ticket-columns'),
      API.get('/auth/users'),
    ]);

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <h3 style="margin:0;">Columnas / Bandejas</h3>
        <button class="btn btn-primary" id="btn-add-col">+ Añadir columna</button>
      </div>
      <table>
        <thead><tr><th>ID</th><th>Nombre</th><th>Roles visibles</th><th>Usuarios</th><th>Orden</th><th>Acciones</th></tr></thead>
        <tbody>
          ${columns.map((c) => {
            const userNames = (c.visible_user_ids || []).map((uid) => {
              const u = users.find((x) => x.id === uid);
              return u ? u.nombre : uid;
            }).join(', ');
            return `
            <tr>
              <td>${c.id}</td>
              <td><strong>${c.nombre}</strong></td>
              <td>${(c.visible_roles || []).join(', ')}</td>
              <td>${userNames || '-'}</td>
              <td>${c.orden}</td>
              <td>
                <button class="btn btn-secondary btn-sm" data-edit-col="${c.id}">Editar</button>
                <button class="btn btn-secondary btn-sm" data-delete-col="${c.id}" style="color:#c62828;">Eliminar</button>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    `;

    this._colUsers = users;

    document.getElementById('btn-add-col').addEventListener('click', () => this.showColumnModal(null, users));

    container.querySelectorAll('[data-edit-col]').forEach((btn) => {
      const col = columns.find((c) => c.id === parseInt(btn.dataset.editCol));
      btn.addEventListener('click', () => this.showColumnModal(col, users));
    });

    container.querySelectorAll('[data-delete-col]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('¿Eliminar esta columna?')) return;
        try {
          await API.delete(`/settings/ticket-columns/${btn.dataset.deleteCol}`);
          this.loadTab();
        } catch (err) {
          alert(err.message);
        }
      });
    });
  },

  showColumnModal(existing, users) {
    const prev = document.getElementById('modal-settings');
    if (prev) prev.remove();

    const isEdit = !!existing;
    const roles = ['admin', 'supervisor', 'agent'];

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-settings';
    overlay.innerHTML = `
      <div class="modal" style="max-width:560px;">
        <h2 class="modal-title">${isEdit ? 'Editar' : 'Nueva'} columna</h2>
        <form id="form-col">
          <div class="form-group">
            <label>Nombre</label>
            <input type="text" class="form-control" name="nombre" value="${isEdit ? existing.nombre : ''}" required>
          </div>
          <div class="form-group">
            <label>Descripción</label>
            <input type="text" class="form-control" name="descripcion" value="${isEdit ? (existing.descripcion || '') : ''}">
          </div>
          <div class="form-group">
            <label>Roles que la ven</label>
            <div id="roles-checks">
              ${roles.map((r) => `
                <label style="display:inline-flex;align-items:center;gap:6px;margin-right:16px;font-size:14px;">
                  <input type="checkbox" name="role" value="${r}" ${isEdit && (existing.visible_roles || []).includes(r) ? 'checked' : ''}>
                  ${r}
                </label>
              `).join('')}
            </div>
          </div>
          <div class="form-group">
            <label>Usuarios específicos (además de roles)</label>
            <div id="users-checks" style="max-height:120px;overflow-y:auto;">
              ${users.filter((u) => u.activo).map((u) => `
                <label style="display:block;font-size:14px;margin-bottom:4px;">
                  <input type="checkbox" name="user_id" value="${u.id}" ${isEdit && (existing.visible_user_ids || []).includes(u.id) ? 'checked' : ''}>
                  ${u.nombre} (${u.rol})
                </label>
              `).join('')}
            </div>
          </div>
          <div class="form-group">
            <label>Orden</label>
            <input type="number" class="form-control" name="orden" value="${isEdit ? existing.orden : 0}">
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
            <button type="submit" class="btn btn-primary">${isEdit ? 'Guardar' : 'Crear'}</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    document.getElementById('form-col').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const checkedRoles = [...form.querySelectorAll('input[name="role"]:checked')].map((c) => c.value);
      const checkedUsers = [...form.querySelectorAll('input[name="user_id"]:checked')].map((c) => parseInt(c.value));

      const body = {
        nombre: form.nombre.value,
        descripcion: form.descripcion.value,
        visible_roles: checkedRoles,
        visible_user_ids: checkedUsers,
        orden: parseInt(form.orden.value) || 0,
      };

      if (isEdit) {
        await API.patch(`/settings/ticket-columns/${existing.id}`, body);
      } else {
        await API.post('/settings/ticket-columns', body);
      }
      overlay.remove();
      this.loadTab();
    });
  },

  // =============================================
  // USUARIOS — Módulo completo de gestión
  // =============================================
  async renderUsers(container) {
    const users = await API.get('/auth/users');
    const activos = users.filter((u) => u.activo).length;
    const inactivos = users.length - activos;

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <div>
          <h3 style="margin:0;">Usuarios del sistema</h3>
          <p class="text-light" style="font-size:13px;margin-top:4px;">${users.length} usuarios (${activos} activos, ${inactivos} inactivos)</p>
        </div>
        <button class="btn btn-primary" id="btn-add-user-settings">+ Nuevo usuario</button>
      </div>

      <div style="display:flex;gap:12px;margin-bottom:16px;">
        <select class="form-control filter-select" id="filter-user-rol" style="max-width:180px;">
          <option value="">Todos los roles</option>
          <option value="admin">Admin</option>
          <option value="supervisor">Supervisor</option>
          <option value="agent">Agent</option>
        </select>
        <select class="form-control filter-select" id="filter-user-estado" style="max-width:180px;">
          <option value="">Todos</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
      </div>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Contraseña</th>
              <th>Telefono</th>
              <th>Rol</th>
              <th>Empresa</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="users-settings-tbody"></tbody>
        </table>
      </div>
    `;

    this._allUsers = users;
    this._renderUsersTable(users);

    document.getElementById('btn-add-user-settings').addEventListener('click', () => {
      this.showUserFormModal(null);
    });

    document.getElementById('filter-user-rol').addEventListener('change', () => this._applyUserFilters());
    document.getElementById('filter-user-estado').addEventListener('change', () => this._applyUserFilters());
  },

  _applyUserFilters() {
    const rol = document.getElementById('filter-user-rol').value;
    const estado = document.getElementById('filter-user-estado').value;
    let filtered = this._allUsers;
    if (rol) filtered = filtered.filter((u) => u.rol === rol);
    if (estado === 'activo') filtered = filtered.filter((u) => u.activo);
    if (estado === 'inactivo') filtered = filtered.filter((u) => !u.activo);
    this._renderUsersTable(filtered);
  },

  _renderUsersTable(users) {
    const tbody = document.getElementById('users-settings-tbody');
    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center text-light">No hay usuarios</td></tr>';
      return;
    }

    tbody.innerHTML = users.map((u) => `
      <tr class="${!u.activo ? 'user-row-inactive' : ''}">
        <td><strong>${this._esc(u.nombre)}</strong></td>
        <td>${this._esc(u.email)}</td>
        <td>${u.password_visible ? `<code class="password-cell">${this._esc(u.password_visible)}</code>` : '<span class="text-light">—</span>'}</td>
        <td>${u.telefono ? this._esc(u.telefono) : '<span class="text-light">—</span>'}</td>
        <td><span class="badge badge-${u.rol}">${u.rol}</span></td>
        <td>${u.empresa ? `<span class="badge" style="background:${u.empresa === 'DKV' ? '#00835e20' : '#009DDD20'};color:${u.empresa === 'DKV' ? '#00835e' : '#009DDD'};">${u.empresa}</span>` : '<span class="text-light">—</span>'}</td>
        <td>
          <button class="btn-toggle-status ${u.activo ? 'active' : 'inactive'}" data-toggle-id="${u.id}" data-activo="${u.activo}" title="${u.activo ? 'Desactivar' : 'Activar'}">
            ${u.activo ? 'Activo' : 'Inactivo'}
          </button>
        </td>
        <td class="text-light">${new Date(u.created_at).toLocaleDateString('es-ES')}</td>
        <td>
          <div class="user-actions">
            <button class="btn btn-secondary btn-sm" data-edit-user="${u.id}" title="Editar">Editar</button>
            <button class="btn btn-secondary btn-sm" data-pass-user="${u.id}" title="Cambiar contraseña">Clave</button>
            <button class="btn btn-secondary btn-sm btn-danger-text" data-delete-user="${u.id}" data-nombre="${this._esc(u.nombre)}" title="Eliminar">Eliminar</button>
          </div>
        </td>
      </tr>
    `).join('');

    // Toggle activo/inactivo
    tbody.querySelectorAll('[data-toggle-id]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.toggleId;
        const currentlyActive = btn.dataset.activo === 'true';
        const action = currentlyActive ? 'desactivar' : 'activar';
        if (!confirm(`¿${action.charAt(0).toUpperCase() + action.slice(1)} este usuario?`)) return;
        try {
          await API.patch(`/auth/users/${id}`, { activo: !currentlyActive });
          this.loadTab();
        } catch (err) { alert(err.message); }
      });
    });

    // Editar
    tbody.querySelectorAll('[data-edit-user]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const user = this._allUsers.find((u) => u.id === parseInt(btn.dataset.editUser));
        if (user) this.showUserFormModal(user);
      });
    });

    // Cambiar contraseña
    tbody.querySelectorAll('[data-pass-user]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const user = this._allUsers.find((u) => u.id === parseInt(btn.dataset.passUser));
        if (user) this.showChangePasswordModal(user);
      });
    });

    // Eliminar
    tbody.querySelectorAll('[data-delete-user]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.deleteUser;
        const nombre = btn.dataset.nombre;
        if (!confirm(`¿Eliminar permanentemente a "${nombre}"?\n\nEsta acción no se puede deshacer. Si solo quieres que no acceda, desactívalo en su lugar.`)) return;
        try {
          await API.delete(`/auth/users/${id}`);
          this.loadTab();
        } catch (err) { alert(err.message); }
      });
    });
  },

  // Modal crear / editar usuario
  showUserFormModal(existing) {
    const prev = document.getElementById('modal-settings');
    if (prev) prev.remove();

    const isEdit = !!existing;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-settings';
    overlay.innerHTML = `
      <div class="modal" style="max-width:520px;">
        <h2 class="modal-title">${isEdit ? 'Editar usuario' : 'Nuevo usuario'}</h2>
        <div id="user-form-error" class="login-error"></div>
        <form id="form-user">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Nombre completo</label>
              <input type="text" class="form-control" name="nombre" value="${isEdit ? this._esc(existing.nombre) : ''}" required>
            </div>
            <div class="form-group">
              <label>Telefono</label>
              <input type="tel" class="form-control" name="telefono" value="${isEdit && existing.telefono ? this._esc(existing.telefono) : ''}" placeholder="612 345 678">
            </div>
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" class="form-control" name="email" value="${isEdit ? this._esc(existing.email) : ''}" required>
          </div>
          ${!isEdit ? `
          <div class="form-group">
            <label>Contraseña</label>
            <input type="password" class="form-control" name="password" required minlength="4" placeholder="Mínimo 4 caracteres">
          </div>` : ''}
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Rol</label>
              <select class="form-control" name="rol" required>
                <option value="agent" ${isEdit && existing.rol === 'agent' ? 'selected' : ''}>Agent</option>
                <option value="supervisor" ${isEdit && existing.rol === 'supervisor' ? 'selected' : ''}>Supervisor</option>
                <option value="admin" ${isEdit && existing.rol === 'admin' ? 'selected' : ''}>Admin</option>
              </select>
            </div>
            <div class="form-group">
              <label>Empresa</label>
              <select class="form-control" name="empresa">
                <option value="ADESLAS" ${isEdit && existing.empresa === 'ADESLAS' ? 'selected' : ''}>ADESLAS</option>
                <option value="DKV" ${isEdit && existing.empresa === 'DKV' ? 'selected' : ''}>DKV</option>
                <option value="" ${isEdit && !existing.empresa ? 'selected' : ''}>Sin empresa (admin)</option>
              </select>
            </div>
          </div>
          ${isEdit ? `
          <div class="form-group">
            <label>Estado</label>
            <select class="form-control" name="activo">
              <option value="true" ${existing.activo ? 'selected' : ''}>Activo</option>
              <option value="false" ${!existing.activo ? 'selected' : ''}>Inactivo</option>
            </select>
          </div>` : ''}
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
            <button type="submit" class="btn btn-primary">${isEdit ? 'Guardar cambios' : 'Crear usuario'}</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    document.getElementById('form-user').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const errEl = document.getElementById('user-form-error');
      errEl.style.display = 'none';

      const body = {
        nombre: form.nombre.value.trim(),
        email: form.email.value.trim(),
        rol: form.rol.value,
        telefono: form.telefono.value.trim() || null,
        empresa: form.empresa.value || null,
      };

      if (isEdit) {
        body.activo = form.activo.value === 'true';
      } else {
        body.password = form.password.value;
      }

      try {
        if (isEdit) {
          await API.patch(`/auth/users/${existing.id}`, body);
        } else {
          await API.post('/auth/users', body);
        }
        overlay.remove();
        this.loadTab();
      } catch (err) {
        errEl.textContent = err.message;
        errEl.style.display = 'block';
      }
    });
  },

  // Modal cambiar contraseña
  showChangePasswordModal(user) {
    const prev = document.getElementById('modal-settings');
    if (prev) prev.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-settings';
    overlay.innerHTML = `
      <div class="modal" style="max-width:420px;">
        <h2 class="modal-title">Cambiar contraseña</h2>
        <p class="text-light" style="margin-bottom:16px;">Usuario: <strong>${this._esc(user.nombre)}</strong> (${this._esc(user.email)})</p>
        <div id="pass-form-error" class="login-error"></div>
        <form id="form-change-pass">
          <div class="form-group">
            <label>Nueva contraseña</label>
            <input type="password" class="form-control" name="password" required minlength="4" placeholder="Mínimo 4 caracteres">
          </div>
          <div class="form-group">
            <label>Confirmar contraseña</label>
            <input type="password" class="form-control" name="password_confirm" required minlength="4">
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
            <button type="submit" class="btn btn-primary">Cambiar contraseña</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    document.getElementById('form-change-pass').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const errEl = document.getElementById('pass-form-error');
      errEl.style.display = 'none';

      if (form.password.value !== form.password_confirm.value) {
        errEl.textContent = 'Las contraseñas no coinciden';
        errEl.style.display = 'block';
        return;
      }

      try {
        await API.patch(`/auth/users/${user.id}`, { password: form.password.value });
        overlay.remove();
        alert(`Contraseña de ${user.nombre} actualizada correctamente.`);
      } catch (err) {
        errEl.textContent = err.message;
        errEl.style.display = 'block';
      }
    });
  },

  _esc(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  },

  // =============================================
  // Pestaña: Importación de Pólizas (solo superadmin)
  // =============================================
  async renderImportarPolizas(container) {
    container.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:24px;">

        <!-- Sección A: Importar desde Google Sheet -->
        <div style="border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
            <div style="width:40px;height:40px;border-radius:10px;background:#e6f6fd;display:flex;align-items:center;justify-content:center;">
              ${Icons.polizas(22, '#009DDD')}
            </div>
            <div>
              <div style="font-size:15px;font-weight:700;">Importar desde Google Sheet</div>
              <div style="font-size:12px;color:#94a3b8;">Sheets configurados: 2020–2026 · Lectura directa desde el backend</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:12px;">
            <select id="import-sheet-year" style="padding:8px 14px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;">
              <option value="2025">2025 + 2026</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
              <option value="2020">2020</option>
            </select>
            <button id="btn-import-sheet" class="btn btn-primary" style="padding:8px 20px;font-size:13px;">
              ${Icons.importar(16, '#fff')} Importar Sheet
            </button>
          </div>
          <div id="import-sheet-progress" style="margin-top:12px;max-height:200px;overflow-y:auto;display:none;"></div>
        </div>

        <!-- Sección B: Subir Excel histórico -->
        <div style="border:1px solid #e2e8f0;border-radius:12px;padding:20px;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
            <div style="width:40px;height:40px;border-radius:10px;background:#f0fdf4;display:flex;align-items:center;justify-content:center;">
              ${Icons.importar(22, '#10b981')}
            </div>
            <div>
              <div style="font-size:15px;font-weight:700;">Subir Excel histórico</div>
              <div style="font-size:12px;color:#94a3b8;">Fichero .xlsx o .xls con pestañas mensuales</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
            <input type="file" id="import-excel-file" accept=".xlsx,.xls" style="font-size:13px;" />
            <select id="import-excel-year" style="padding:8px 14px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;">
              <option value="">Seleccionar año</option>
              <option value="2020">2020</option>
              <option value="2021">2021</option>
              <option value="2022">2022</option>
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
            </select>
            <button id="btn-import-excel" class="btn" style="padding:8px 20px;font-size:13px;background:#10b981;color:#fff;border:none;border-radius:8px;cursor:pointer;">
              ${Icons.importar(16, '#fff')} Importar Excel
            </button>
          </div>
        </div>

        <!-- Sección C: Informe -->
        <div id="import-result" style="display:none;"></div>
      </div>
    `;

    // Event: Importar Sheet
    document.getElementById('btn-import-sheet').addEventListener('click', async () => {
      const btn = document.getElementById('btn-import-sheet');
      const year = document.getElementById('import-sheet-year').value;
      const progress = document.getElementById('import-sheet-progress');
      const result = document.getElementById('import-result');

      btn.disabled = true;
      btn.textContent = 'Importando...';
      progress.style.display = 'block';
      progress.innerHTML = '<div style="font-size:13px;color:#94a3b8;">Procesando pestañas del Sheet ' + year + '...</div>';
      result.style.display = 'none';

      try {
        const resp = await API.post('/polizas/importar-sheet', { year });
        btn.disabled = false;
        btn.innerHTML = `${Icons.importar(16, '#fff')} Importar Sheet`;
        progress.innerHTML = '<div style="font-size:13px;color:#10b981;font-weight:600;">Completado</div>';
        result.style.display = 'block';
        result.innerHTML = this._renderImportResult(resp, `Google Sheet ${year}`);
      } catch (err) {
        btn.disabled = false;
        btn.innerHTML = `${Icons.importar(16, '#fff')} Importar Sheet`;
        progress.innerHTML = `<div style="font-size:13px;color:#ef4444;">Error: ${this._esc(err.message)}</div>`;
      }
    });

    // Event: Importar Excel
    document.getElementById('btn-import-excel').addEventListener('click', async () => {
      const btn = document.getElementById('btn-import-excel');
      const fileInput = document.getElementById('import-excel-file');
      const year = document.getElementById('import-excel-year').value;
      const result = document.getElementById('import-result');

      if (!fileInput.files[0]) return alert('Selecciona un fichero Excel');
      if (!year) return alert('Selecciona el año');

      btn.disabled = true;
      btn.textContent = 'Subiendo...';
      result.style.display = 'none';

      try {
        const formData = new FormData();
        formData.append('archivo', fileInput.files[0]);
        formData.append('año', year);

        const token = Auth.getToken();
        const response = await fetch('/api/polizas/importar-excel', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        });
        const resp = await response.json();

        btn.disabled = false;
        btn.innerHTML = `${Icons.importar(16, '#fff')} Importar Excel`;

        if (!response.ok) throw new Error(resp.error || 'Error al importar');

        result.style.display = 'block';
        result.innerHTML = this._renderImportResult(resp, `Excel ${year}`);
      } catch (err) {
        btn.disabled = false;
        btn.innerHTML = `${Icons.importar(16, '#fff')} Importar Excel`;
        alert('Error: ' + err.message);
      }
    });
  },

  _renderImportResult(t, source) {
    const now = new Date().toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    return `
      <div style="border:1px solid #e2e8f0;border-radius:12px;padding:20px;border-top:3px solid #009DDD;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h3 style="font-size:16px;font-weight:700;margin:0;">Resultado: ${this._esc(source)}</h3>
          <span style="font-size:12px;color:#94a3b8;">${now}</span>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:20px;">
          ${this._importKpi('Procesadas', t.total_procesadas, '#009DDD')}
          ${this._importKpi('Nuevas', t.polizas_nuevas, '#10b981')}
          ${this._importKpi('Actualizadas', t.polizas_actualizadas, '#3b82f6')}
          ${this._importKpi('Bajas', t.bajas_detectadas, '#ef4444')}
        </div>

        <h4 style="font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;">Deduplicación</h4>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:16px;">
          ${this._importKpi('Por DNI', t.personas_vinculadas_por_dni || 0, '#8b5cf6')}
          ${this._importKpi('Por teléfono', t.personas_vinculadas_por_telefono || 0, '#f59e0b')}
          ${this._importKpi('Por email', t.personas_vinculadas_por_email || 0, '#06b6d4')}
          ${this._importKpi('Nuevas', t.personas_nuevas_creadas || 0, '#10b981')}
        </div>

        <h4 style="font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;">Agentes</h4>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:16px;">
          ${this._importKpi('Resueltos', t.agentes_resueltos || 0, '#10b981')}
          ${this._importKpi('Sin resolver', (t.agentes_no_encontrados || []).length, (t.agentes_no_encontrados || []).length > 0 ? '#ef4444' : '#94a3b8')}
        </div>
        ${(t.agentes_no_encontrados || []).length > 0 ? `
          <div style="background:#fef2f2;border-radius:8px;padding:8px 12px;font-size:12px;margin-bottom:12px;">
            <strong>No encontrados:</strong> ${t.agentes_no_encontrados.map(a => this._esc(a)).join(', ')}
          </div>
        ` : ''}

        ${(t.errores || []).length > 0 ? `
          <h4 style="font-size:12px;font-weight:700;color:#ef4444;margin-bottom:6px;">Errores (${t.errores.length})</h4>
          <div style="max-height:150px;overflow-y:auto;background:#fef2f2;border-radius:8px;padding:8px 12px;font-size:11px;font-family:monospace;">
            ${t.errores.slice(0, 30).map(e => `<div style="padding:2px 0;">${this._esc(e)}</div>`).join('')}
            ${t.errores.length > 30 ? `<div style="color:#94a3b8;">...y ${t.errores.length - 30} más</div>` : ''}
          </div>
        ` : ''}
      </div>
    `;
  },

  _importKpi(label, value, color) {
    return `
      <div style="text-align:center;background:#f4f6f9;border-radius:8px;padding:10px 6px;">
        <div style="font-size:20px;font-weight:800;color:${color};">${value}</div>
        <div style="font-size:10px;font-weight:600;color:#94a3b8;margin-top:2px;">${label}</div>
      </div>
    `;
  },
};
