// === Módulo Tickets/Trámites ===

const TicketsModule = {
  columns: [],
  types: [],
  users: [],
  currentColumnId: null,
  currentFilter: { estado: '', tipo_id: '' },

  async render() {
    const container = document.getElementById('main-content');
    container.innerHTML = '<p class="text-light">Cargando tickets...</p>';

    try {
      const [columns, types] = await Promise.all([
        API.get('/tickets/columns'),
        API.get('/tickets/types'),
      ]);
      this.columns = columns;
      this.types = types;

      // Cargar usuarios si admin/supervisor
      if (Auth.hasRole('admin', 'supervisor')) {
        this.users = await API.get('/auth/users');
      }

      if (columns.length > 0) {
        this.currentColumnId = columns[0].id;
      }

      this.renderLayout();
      this.loadTickets();
    } catch (err) {
      container.innerHTML = `<p style="color:#c62828">${err.message}</p>`;
    }
  },

  renderLayout() {
    const container = document.getElementById('main-content');
    const tabsHtml = this.columns.map((col) => `
      <button class="tab-btn ${col.id === this.currentColumnId ? 'active' : ''}" data-column="${col.id}">
        ${col.nombre}
        <span class="tab-count" id="tab-count-${col.id}"></span>
      </button>
    `).join('');

    const typeOpts = this.types.map((t) => `<option value="${t.id}">${t.nombre}</option>`).join('');

    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
        <h1 class="page-title" style="margin-bottom:0;">Tickets / Trámites</h1>
        <button class="btn btn-primary" id="btn-new-ticket">+ Nuevo ticket</button>
      </div>

      <div class="tabs" id="column-tabs">${tabsHtml}</div>

      <div class="card" style="margin-top:16px;">
        <div class="ticket-filters">
          <select class="form-control filter-select" id="filter-estado">
            <option value="">Todos los estados</option>
            <option value="nuevo">Nuevo</option>
            <option value="en_gestion">En gestión</option>
            <option value="esperando">Esperando</option>
            <option value="resuelto">Resuelto</option>
            <option value="cerrado">Cerrado</option>
          </select>
          <select class="form-control filter-select" id="filter-tipo">
            <option value="">Todos los tipos</option>
            ${typeOpts}
          </select>
        </div>

        <div class="table-wrapper" style="margin-top:16px;">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Tipo</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th>Creado por</th>
                <th>Asignado a</th>
                <th>Prioridad</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody id="tickets-tbody">
              <tr><td colspan="8" class="text-center text-light">Cargando...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Event listeners
    document.getElementById('column-tabs').addEventListener('click', (e) => {
      const btn = e.target.closest('.tab-btn');
      if (!btn) return;
      this.currentColumnId = parseInt(btn.dataset.column);
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      this.loadTickets();
    });

    document.getElementById('filter-estado').addEventListener('change', (e) => {
      this.currentFilter.estado = e.target.value;
      this.loadTickets();
    });

    document.getElementById('filter-tipo').addEventListener('change', (e) => {
      this.currentFilter.tipo_id = e.target.value;
      this.loadTickets();
    });

    document.getElementById('btn-new-ticket').addEventListener('click', () => {
      this.showNewTicketModal();
    });
  },

  async loadTickets() {
    const tbody = document.getElementById('tickets-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-light">Cargando...</td></tr>';

    try {
      let query = `?column_id=${this.currentColumnId}`;
      if (this.currentFilter.estado) query += `&estado=${this.currentFilter.estado}`;
      if (this.currentFilter.tipo_id) query += `&tipo_id=${this.currentFilter.tipo_id}`;

      const tickets = await API.get(`/tickets${query}`);

      // Update tab count
      const countEl = document.getElementById(`tab-count-${this.currentColumnId}`);
      if (countEl) countEl.textContent = tickets.length > 0 ? `(${tickets.length})` : '';

      if (tickets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-light">No hay tickets</td></tr>';
        return;
      }

      tbody.innerHTML = tickets.map((t) => `
        <tr class="ticket-row" data-id="${t.id}" style="cursor:pointer;">
          <td><strong>${t.id}</strong></td>
          <td>${t.tipo_nombre || '-'}</td>
          <td class="ticket-desc">${this.truncate(t.descripcion, 60)}</td>
          <td>${this.estadoBadge(t.estado)}</td>
          <td>${t.created_by_nombre || t.agente_nombre || '-'}</td>
          <td>${t.assigned_to_nombre || '-'}</td>
          <td>${this.prioridadBadge(t.prioridad)}</td>
          <td class="text-light">${new Date(t.created_at).toLocaleDateString('es-ES')}</td>
        </tr>
      `).join('');

      // Click para abrir detalle
      tbody.querySelectorAll('.ticket-row').forEach((row) => {
        row.addEventListener('click', () => {
          this.showTicketDetail(parseInt(row.dataset.id));
        });
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="8" style="color:#c62828">${err.message}</td></tr>`;
    }
  },

  showNewTicketModal() {
    const prev = document.getElementById('modal-ticket');
    if (prev) prev.remove();

    const typeOpts = this.types.map((t) => `<option value="${t.id}">${t.nombre}</option>`).join('');
    const colOpts = this.columns.map((c) => `<option value="${c.id}" ${c.id === this.currentColumnId ? 'selected' : ''}>${c.nombre}</option>`).join('');

    let assignHtml = '';
    if (Auth.hasRole('admin', 'supervisor')) {
      const userOpts = this.users.filter((u) => u.activo).map((u) =>
        `<option value="${u.id}">${u.nombre} (${u.rol})</option>`
      ).join('');
      assignHtml = `
        <div class="form-group">
          <label>Asignar a (opcional)</label>
          <select class="form-control" name="assigned_to">
            <option value="">Sin asignar</option>
            ${userOpts}
          </select>
        </div>
      `;
    }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-ticket';
    overlay.innerHTML = `
      <div class="modal" style="max-width:560px;">
        <h2 class="modal-title">Nuevo ticket</h2>
        <div id="ticket-modal-error" class="login-error"></div>
        <form id="form-new-ticket">
          <div class="form-group">
            <label>Tipo de trámite</label>
            <select class="form-control" name="tipo_id" required>${typeOpts}</select>
          </div>
          <div class="form-group">
            <label>Bandeja</label>
            <select class="form-control" name="column_id" required>${colOpts}</select>
          </div>
          <div class="form-group">
            <label>Descripción</label>
            <textarea class="form-control" name="descripcion" rows="4" required placeholder="Describe el trámite..."></textarea>
          </div>
          <div class="form-group">
            <label>ID Deal Pipedrive (opcional)</label>
            <input type="text" class="form-control" name="pipedrive_deal_id" placeholder="Ej: 12345">
          </div>
          <div class="form-group">
            <label>Prioridad</label>
            <select class="form-control" name="prioridad">
              <option value="normal">Normal</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>
          ${assignHtml}
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" id="btn-cancel-ticket">Cancelar</button>
            <button type="submit" class="btn btn-primary">Crear ticket</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('btn-cancel-ticket').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    document.getElementById('form-new-ticket').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const errEl = document.getElementById('ticket-modal-error');
      errEl.style.display = 'none';

      const body = {
        tipo_id: parseInt(form.tipo_id.value),
        column_id: parseInt(form.column_id.value),
        descripcion: form.descripcion.value,
        pipedrive_deal_id: form.pipedrive_deal_id.value || null,
        prioridad: form.prioridad.value,
      };
      if (form.assigned_to && form.assigned_to.value) {
        body.assigned_to = parseInt(form.assigned_to.value);
      }

      try {
        await API.post('/tickets', body);
        overlay.remove();
        this.loadTickets();
      } catch (err) {
        errEl.textContent = err.message;
        errEl.style.display = 'block';
      }
    });
  },

  async showTicketDetail(ticketId) {
    const prev = document.getElementById('modal-ticket-detail');
    if (prev) prev.remove();

    let ticket;
    try {
      ticket = await API.get(`/tickets/${ticketId}`);
    } catch (err) {
      alert(err.message);
      return;
    }

    const estados = ['nuevo', 'en_gestion', 'esperando', 'resuelto', 'cerrado'];
    const estadoOpts = estados.map((e) =>
      `<option value="${e}" ${e === ticket.estado ? 'selected' : ''}>${e.replace('_', ' ')}</option>`
    ).join('');

    let assignHtml = '';
    if (Auth.hasRole('admin', 'supervisor')) {
      const userOpts = this.users.filter((u) => u.activo).map((u) =>
        `<option value="${u.id}" ${u.id === ticket.assigned_to ? 'selected' : ''}>${u.nombre} (${u.rol})</option>`
      ).join('');
      assignHtml = `
        <div class="form-group">
          <label>Asignado a</label>
          <select class="form-control" id="detail-assigned">
            <option value="">Sin asignar</option>
            ${userOpts}
          </select>
        </div>
      `;
    }

    const commentsHtml = (ticket.comments || []).map((c) => `
      <div class="comment">
        <div class="comment-header">
          <strong>${c.user_nombre}</strong>
          <span class="badge badge-${c.user_rol}">${c.user_rol}</span>
          <span class="text-light">${new Date(c.created_at).toLocaleString('es-ES')}</span>
        </div>
        <div class="comment-body">${this.escapeHtml(c.mensaje)}</div>
      </div>
    `).join('') || '<p class="text-light">Sin comentarios aún</p>';

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-ticket-detail';
    overlay.innerHTML = `
      <div class="modal" style="max-width:680px;max-height:90vh;overflow-y:auto;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <h2 class="modal-title" style="margin-bottom:0;">Ticket #${ticket.id}</h2>
          ${this.estadoBadge(ticket.estado)}
        </div>

        <div style="margin:16px 0;padding:16px;background:var(--bg);border-radius:12px;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:14px;">
            <div><span class="text-light">Tipo:</span> <strong>${ticket.tipo_nombre || '-'}</strong></div>
            <div><span class="text-light">Bandeja:</span> <strong>${ticket.column_nombre || '-'}</strong></div>
            <div><span class="text-light">Creado por:</span> <strong>${ticket.created_by_nombre || '-'}</strong></div>
            <div><span class="text-light">Asignado a:</span> <strong>${ticket.assigned_to_nombre || 'Sin asignar'}</strong></div>
            <div><span class="text-light">Prioridad:</span> ${this.prioridadBadge(ticket.prioridad)}</div>
            <div><span class="text-light">Pipedrive:</span> ${ticket.pipedrive_deal_id || 'N/A'}</div>
          </div>
          <div style="margin-top:12px;">
            <span class="text-light">Descripción:</span>
            <p style="margin-top:4px;">${this.escapeHtml(ticket.descripcion || '')}</p>
          </div>
        </div>

        ${Auth.hasRole('admin', 'supervisor') ? `
        <div style="display:flex;gap:12px;margin-bottom:16px;">
          <div class="form-group" style="flex:1;margin-bottom:0;">
            <label>Cambiar estado</label>
            <select class="form-control" id="detail-estado">${estadoOpts}</select>
          </div>
          ${assignHtml ? `<div style="flex:1;">${assignHtml}</div>` : ''}
        </div>
        <button class="btn btn-primary" id="btn-update-ticket" style="margin-bottom:20px;">Guardar cambios</button>
        ` : ''}

        <h3 style="font-size:16px;margin-bottom:12px;">Comentarios</h3>
        <div class="comments-list" id="comments-list">${commentsHtml}</div>

        <div style="margin-top:16px;">
          <textarea class="form-control" id="new-comment" rows="3" placeholder="Escribe un comentario..."></textarea>
          <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:8px;">
            <button class="btn btn-secondary" id="btn-close-detail">Cerrar</button>
            <button class="btn btn-primary" id="btn-add-comment">Enviar comentario</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Cerrar
    document.getElementById('btn-close-detail').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    // Actualizar ticket
    const btnUpdate = document.getElementById('btn-update-ticket');
    if (btnUpdate) {
      btnUpdate.addEventListener('click', async () => {
        const body = {};
        const newEstado = document.getElementById('detail-estado').value;
        if (newEstado !== ticket.estado) body.estado = newEstado;
        const assignEl = document.getElementById('detail-assigned');
        if (assignEl) {
          const newAssigned = assignEl.value ? parseInt(assignEl.value) : null;
          if (newAssigned !== ticket.assigned_to) body.assigned_to = newAssigned;
        }
        if (Object.keys(body).length === 0) return;
        try {
          await API.patch(`/tickets/${ticket.id}`, body);
          overlay.remove();
          this.loadTickets();
        } catch (err) {
          alert(err.message);
        }
      });
    }

    // Añadir comentario
    document.getElementById('btn-add-comment').addEventListener('click', async () => {
      const input = document.getElementById('new-comment');
      const mensaje = input.value.trim();
      if (!mensaje) return;
      try {
        const comment = await API.post(`/tickets/${ticket.id}/comments`, { mensaje });
        input.value = '';
        const list = document.getElementById('comments-list');
        if (list.querySelector('.text-light')) list.innerHTML = '';
        list.innerHTML += `
          <div class="comment">
            <div class="comment-header">
              <strong>${comment.user_nombre}</strong>
              <span class="badge badge-${comment.user_rol}">${comment.user_rol}</span>
              <span class="text-light">${new Date(comment.created_at).toLocaleString('es-ES')}</span>
            </div>
            <div class="comment-body">${this.escapeHtml(comment.mensaje)}</div>
          </div>
        `;
        list.scrollTop = list.scrollHeight;
      } catch (err) {
        alert(err.message);
      }
    });
  },

  // Helpers
  truncate(str, max) {
    if (!str) return '-';
    return str.length > max ? str.substring(0, max) + '...' : str;
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  estadoBadge(estado) {
    const colors = {
      nuevo: '#1565c0', en_gestion: '#e65100', esperando: '#f9a825',
      resuelto: '#2e7d32', cerrado: '#6b7280',
    };
    const color = colors[estado] || '#6b7280';
    return `<span class="badge" style="background:${color}20;color:${color};">${(estado || '').replace('_', ' ')}</span>`;
  },

  prioridadBadge(p) {
    if (p === 'urgente') return '<span class="badge" style="background:#c6282820;color:#c62828;">urgente</span>';
    if (p === 'alta') return '<span class="badge" style="background:#e6510020;color:#e65100;">alta</span>';
    return '<span class="badge" style="background:#e8f5e9;color:#2e7d32;">normal</span>';
  },
};
