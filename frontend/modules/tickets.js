// === Módulo Trámites — Kanban ===

const TicketsModule = {
  types: [],
  users: [],
  columns: [],
  kanbanData: null,
  currentView: 'kanban',
  filters: { agente_id: '', tipo_id: '', compania: '' },
  draggedCard: null,

  async render() {
    const container = document.getElementById('main-content');
    container.innerHTML = '<p class="text-light">Cargando trámites...</p>';

    try {
      const loads = [
        API.get('/tickets/types'),
        API.get('/tickets/columns'),
      ];
      if (Auth.hasRole('admin', 'supervisor')) {
        loads.push(API.get('/auth/users'));
      }
      const [types, columns, users] = await Promise.all(loads);
      this.types = types;
      this.columns = columns;
      this.users = users || [];

      this.renderLayout();
      await this.loadKanban();
    } catch (err) {
      container.innerHTML = `<p style="color:#c62828">${err.message}</p>`;
    }
  },

  renderLayout() {
    const container = document.getElementById('main-content');

    const typeOpts = this.types.map(t => `<option value="${t.id}">${t.nombre}</option>`).join('');
    const agenteOpts = this.users.filter(u => u.activo).map(u =>
      `<option value="${u.id}">${u.nombre}</option>`
    ).join('');

    container.innerHTML = `
      <style>${this.getStyles()}</style>
      <div class="tramites-toolbar">
        <div class="tramites-toolbar-left">
          <h1 class="page-title" style="margin-bottom:0;">Trámites</h1>
          <span class="tramites-badge" id="tramites-total-badge">0</span>
          <div class="tramites-view-tabs">
            <button class="tramites-view-tab active" data-view="kanban">Kanban</button>
            <button class="tramites-view-tab" data-view="lista">Lista</button>
          </div>
        </div>
        <div class="tramites-toolbar-right">
          <select class="form-control tramites-filter" id="filter-agente">
            <option value="">Todos los agentes</option>
            ${agenteOpts}
          </select>
          <select class="form-control tramites-filter" id="filter-tipo">
            <option value="">Todos los tipos</option>
            ${typeOpts}
          </select>
          <select class="form-control tramites-filter" id="filter-compania">
            <option value="">Todas las compañías</option>
            <option value="ADESLAS">ADESLAS</option>
            <option value="DKV">DKV</option>
          </select>
          <button class="btn btn-primary" id="btn-new-tramite">+ Nuevo trámite</button>
        </div>
      </div>

      <div id="tramites-kanban" class="tramites-kanban"></div>
      <div id="tramites-lista" class="tramites-lista" style="display:none;"></div>

      <div class="tramites-stats" id="tramites-stats"></div>
    `;

    // Listeners
    container.querySelectorAll('.tramites-view-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.tramites-view-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentView = btn.dataset.view;
        document.getElementById('tramites-kanban').style.display = this.currentView === 'kanban' ? 'flex' : 'none';
        document.getElementById('tramites-lista').style.display = this.currentView === 'lista' ? 'block' : 'none';
        if (this.currentView === 'lista') this.renderListView();
      });
    });

    ['filter-agente', 'filter-tipo', 'filter-compania'].forEach(id => {
      document.getElementById(id).addEventListener('change', (e) => {
        const key = id.replace('filter-', '') === 'agente' ? 'agente_id' : id.replace('filter-', '');
        this.filters[key] = e.target.value;
        this.loadKanban();
      });
    });

    document.getElementById('btn-new-tramite').addEventListener('click', () => this.showNewModal());
  },

  async loadKanban() {
    try {
      const params = new URLSearchParams();
      if (this.filters.agente_id) params.set('agente_id', this.filters.agente_id);
      if (this.filters.tipo_id) params.set('tipo_id', this.filters.tipo_id);
      if (this.filters.compania) params.set('compania', this.filters.compania);
      const qs = params.toString();

      this.kanbanData = await API.get(`/tickets/kanban${qs ? '?' + qs : ''}`);
      this.renderKanban();
      this.renderStats();
    } catch (err) {
      document.getElementById('tramites-kanban').innerHTML = `<p style="color:#c62828">${err.message}</p>`;
    }
  },

  renderKanban() {
    const wrap = document.getElementById('tramites-kanban');
    if (!this.kanbanData) return;

    wrap.innerHTML = this.kanbanData.columns.map(col => `
      <div class="kanban-column" data-estado="${col.estado}">
        <div class="kanban-column-header">
          <div class="kanban-column-dot" style="background:${col.color};"></div>
          <span class="kanban-column-title">${col.nombre}</span>
          <span class="kanban-column-count">${col.count}</span>
        </div>
        <div class="kanban-column-body" data-estado="${col.estado}">
          ${col.tickets.map(t => this.renderCard(t, col.color)).join('')}
          ${col.tickets.length === 0 ? '<div class="kanban-empty">Sin trámites</div>' : ''}
        </div>
      </div>
    `).join('');

    // Badge total
    const total = this.kanbanData.columns.reduce((s, c) => s + c.count, 0);
    const badge = document.getElementById('tramites-total-badge');
    if (badge) badge.textContent = total;

    // Drag & drop
    this.initDragDrop();

    // Click para abrir panel
    wrap.querySelectorAll('.kanban-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.kanban-card-drag')) return;
        this.openPanel(parseInt(card.dataset.id));
      });
    });
  },

  renderCard(t, color) {
    const initials = (t.contacto_nombre || t.agente_nombre || '?').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
    const days = t.days_open || 0;
    const daysLabel = days === 0 ? 'Hoy' : days === 1 ? '1 día' : `${days} días`;
    const urgenciaClass = t.urgencia === 'urgente' ? 'urgente' : t.urgencia === 'alta' ? 'alta' : '';

    return `
      <div class="kanban-card ${urgenciaClass}" data-id="${t.id}" draggable="true">
        <div class="kanban-card-topbar" style="background:${color};"></div>
        <div class="kanban-card-content">
          <div class="kanban-card-header">
            <span class="kanban-card-type">${t.tipo_nombre || 'Trámite'}</span>
            <span class="kanban-card-ref">#${t.id}</span>
          </div>
          <div class="kanban-card-client">
            <div class="kanban-card-avatar">${initials}</div>
            <div>
              <div class="kanban-card-name">${t.contacto_nombre || 'Sin contacto'}</div>
              ${t.contacto_telefono ? `<div class="kanban-card-phone">${t.contacto_telefono}</div>` : ''}
            </div>
          </div>
          <div class="kanban-card-desc">${this.truncate(t.descripcion, 70)}</div>
          <div class="kanban-card-pills">
            ${t.compania ? `<span class="kanban-pill">${t.compania}</span>` : ''}
            ${t.num_poliza ? `<span class="kanban-pill">Póliza: ${t.num_poliza}</span>` : ''}
            ${t.num_solicitud ? `<span class="kanban-pill">Sol: ${t.num_solicitud}</span>` : ''}
          </div>
          <div class="kanban-card-footer">
            <span class="kanban-card-agent">${t.agente_nombre || '-'}</span>
            <span class="kanban-card-days ${days > 3 ? 'old' : ''}">${daysLabel}</span>
          </div>
        </div>
      </div>
    `;
  },

  renderStats() {
    const el = document.getElementById('tramites-stats');
    if (!el || !this.kanbanData) return;

    const cols = this.kanbanData.columns;
    const activos = cols.filter(c => !['cerrado'].includes(c.estado)).reduce((s, c) => s + c.count, 0);
    const allTickets = cols.flatMap(c => c.tickets);
    const stale = allTickets.filter(t => t.days_open > 3 && !['resuelto', 'cerrado'].includes(t.estado)).length;
    const esperando = cols.find(c => c.estado === 'esperando')?.count || 0;
    const resueltos = cols.find(c => c.estado === 'resuelto')?.count || 0;

    el.innerHTML = `
      <div class="stat-item"><strong>${activos}</strong> activos</div>
      <div class="stat-item ${stale > 0 ? 'warning' : ''}"><strong>${stale}</strong> >3 días sin mover</div>
      <div class="stat-item"><strong>${esperando}</strong> esperando compañía</div>
      <div class="stat-item"><strong>${resueltos}</strong> resueltos</div>
    `;
  },

  renderListView() {
    const el = document.getElementById('tramites-lista');
    if (!el || !this.kanbanData) return;
    const allTickets = this.kanbanData.columns.flatMap(c => c.tickets);

    el.innerHTML = `
      <div class="card">
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th><th>Tipo</th><th>Cliente</th><th>Descripción</th><th>Estado</th>
                <th>Compañía</th><th>Agente</th><th>Días</th><th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              ${allTickets.length === 0 ? '<tr><td colspan="9" class="text-center text-light">No hay trámites</td></tr>' :
                allTickets.map(t => `
                  <tr class="ticket-row" data-id="${t.id}" style="cursor:pointer;">
                    <td><strong>${t.id}</strong></td>
                    <td>${t.tipo_nombre || '-'}</td>
                    <td>${t.contacto_nombre || '-'}</td>
                    <td class="ticket-desc">${this.truncate(t.descripcion, 50)}</td>
                    <td>${this.estadoBadge(t.estado)}</td>
                    <td>${t.compania || '-'}</td>
                    <td>${t.agente_nombre || '-'}</td>
                    <td>${t.days_open || 0}</td>
                    <td class="text-light">${new Date(t.created_at).toLocaleDateString('es-ES')}</td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    el.querySelectorAll('.ticket-row').forEach(row => {
      row.addEventListener('click', () => this.openPanel(parseInt(row.dataset.id)));
    });
  },

  // === Drag & Drop ===
  initDragDrop() {
    const cards = document.querySelectorAll('.kanban-card');
    const columns = document.querySelectorAll('.kanban-column-body');

    cards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        this.draggedCard = card;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        this.draggedCard = null;
        columns.forEach(col => col.classList.remove('drag-over'));
      });
    });

    columns.forEach(col => {
      col.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        col.classList.add('drag-over');
      });
      col.addEventListener('dragleave', () => {
        col.classList.remove('drag-over');
      });
      col.addEventListener('drop', async (e) => {
        e.preventDefault();
        col.classList.remove('drag-over');
        if (!this.draggedCard) return;

        const ticketId = parseInt(this.draggedCard.dataset.id);
        const newEstado = col.dataset.estado;

        try {
          await API.patch(`/tickets/${ticketId}/move`, { estado: newEstado });
          await this.loadKanban();
        } catch (err) {
          alert(err.message);
        }
      });
    });
  },

  // === Panel lateral ===
  async openPanel(ticketId) {
    // Cerrar panel previo
    const prev = document.querySelector('.tramite-panel-overlay');
    if (prev) prev.remove();

    let ticket, comunicaciones;
    try {
      [ticket, comunicaciones] = await Promise.all([
        API.get(`/tickets/${ticketId}`),
        API.get(`/tickets/${ticketId}/comunicaciones`),
      ]);
    } catch (err) {
      alert(err.message);
      return;
    }

    const estados = ['nuevo', 'en_gestion', 'esperando', 'resuelto', 'cerrado'];
    const estadoLabels = { nuevo: 'Abierto', en_gestion: 'En gestión', esperando: 'Esperando', resuelto: 'Resuelto', cerrado: 'Cerrado' };
    const estadoIdx = estados.indexOf(ticket.estado);

    const stepsHtml = estados.map((e, i) => {
      let cls = 'pending';
      if (i < estadoIdx) cls = 'done';
      if (i === estadoIdx) cls = 'active';
      return `<div class="step-dot ${cls}" title="${estadoLabels[e]}"><span>${i < estadoIdx ? '✓' : (i + 1)}</span></div>`;
    }).join('<div class="step-line"></div>');

    const commHtml = comunicaciones.length > 0
      ? comunicaciones.map(c => this.renderCommunication(c)).join('')
      : '<p class="text-light" style="text-align:center;padding:16px;">Sin comunicaciones aún</p>';

    const isAdminSup = Auth.hasRole('admin', 'supervisor');
    let assignOpts = '';
    if (isAdminSup) {
      assignOpts = this.users.filter(u => u.activo).map(u =>
        `<option value="${u.id}" ${u.id === ticket.assigned_to ? 'selected' : ''}>${u.nombre}</option>`
      ).join('');
    }

    const overlay = document.createElement('div');
    overlay.className = 'tramite-panel-overlay';
    overlay.innerHTML = `
      <div class="tramite-panel-backdrop"></div>
      <div class="tramite-panel">
        <div class="panel-header">
          <div>
            <span class="kanban-card-type">${ticket.tipo_nombre || 'Trámite'}</span>
            <h2 class="panel-title">#${ticket.id} — ${ticket.contacto_nombre || ticket.created_by_nombre || 'Sin contacto'}</h2>
            ${ticket.contacto_telefono ? `<span class="panel-phone">${ticket.contacto_telefono}</span>` : ''}
          </div>
          <button class="panel-close" id="panel-close">&times;</button>
        </div>

        <div class="panel-steps">${stepsHtml}</div>

        <div class="panel-info-grid">
          <div class="panel-info-item">
            <span class="panel-info-label">Compañía</span>
            <span class="panel-info-value">${ticket.compania || '-'}</span>
          </div>
          <div class="panel-info-item">
            <span class="panel-info-label">Agente</span>
            <span class="panel-info-value">${ticket.agente_nombre || ticket.created_by_nombre || '-'}</span>
          </div>
          <div class="panel-info-item">
            <span class="panel-info-label">Fecha</span>
            <span class="panel-info-value">${new Date(ticket.created_at).toLocaleDateString('es-ES')}</span>
          </div>
          <div class="panel-info-item">
            <span class="panel-info-label">Urgencia</span>
            <span class="panel-info-value">${this.urgenciaBadge(ticket.urgencia)}</span>
          </div>
          <div class="panel-info-item">
            <span class="panel-info-label">Nº Póliza</span>
            <span class="panel-info-value">${ticket.num_poliza || '-'}</span>
          </div>
          <div class="panel-info-item">
            <span class="panel-info-label">Tipo</span>
            <span class="panel-info-value">${ticket.tipo_nombre || '-'}</span>
          </div>
        </div>

        <div class="panel-desc-box">
          <strong>Descripción</strong>
          <p>${this.escapeHtml(ticket.descripcion || 'Sin descripción')}</p>
        </div>

        <div class="panel-section-title">Historial de comunicaciones</div>
        <div class="panel-comm-list" id="panel-comm-list">${commHtml}</div>

        ${isAdminSup ? `
        <div class="panel-new-message">
          <div class="panel-msg-tabs">
            <button class="panel-msg-tab active" data-tipo="email" data-dest="compania">Email compañía</button>
            <button class="panel-msg-tab" data-tipo="email" data-dest="cliente">Email cliente</button>
            <button class="panel-msg-tab" data-tipo="whatsapp" data-dest="cliente">WA cliente</button>
            <button class="panel-msg-tab" data-tipo="nota" data-dest="">Nota interna</button>
          </div>
          <input type="text" class="form-control" id="panel-msg-dest" placeholder="Destinatario" style="margin-bottom:8px;">
          <input type="text" class="form-control" id="panel-msg-asunto" placeholder="Asunto" style="margin-bottom:8px;">
          <textarea class="form-control" id="panel-msg-texto" rows="3" placeholder="Escribe tu mensaje..."></textarea>
          <div style="display:flex;justify-content:flex-end;margin-top:8px;">
            <button class="btn btn-primary" id="btn-send-comm">Enviar</button>
          </div>
        </div>
        ` : ''}

        <div class="panel-footer">
          ${isAdminSup ? `
          <select class="form-control" id="panel-reasignar" style="width:auto;">
            <option value="">Reasignar a...</option>
            ${assignOpts}
          </select>
          <button class="btn btn-success" id="btn-panel-resolver">Marcar resuelto</button>
          ` : ''}
          <button class="btn btn-secondary" id="btn-panel-cerrar">Cerrar panel</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Animar entrada
    requestAnimationFrame(() => overlay.classList.add('open'));

    // Cerrar
    const closePanel = () => {
      overlay.classList.remove('open');
      setTimeout(() => overlay.remove(), 300);
    };
    document.getElementById('panel-close').addEventListener('click', closePanel);
    document.getElementById('btn-panel-cerrar').addEventListener('click', closePanel);
    overlay.querySelector('.tramite-panel-backdrop').addEventListener('click', closePanel);

    // Tabs de mensaje
    let msgTipo = 'email', msgDest = 'compania';
    overlay.querySelectorAll('.panel-msg-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        overlay.querySelectorAll('.panel-msg-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        msgTipo = tab.dataset.tipo;
        msgDest = tab.dataset.dest;
        const destInput = document.getElementById('panel-msg-dest');
        const asuntoInput = document.getElementById('panel-msg-asunto');
        if (msgTipo === 'nota') {
          destInput.style.display = 'none';
          asuntoInput.style.display = 'none';
        } else {
          destInput.style.display = '';
          asuntoInput.style.display = msgTipo === 'whatsapp' ? 'none' : '';
          destInput.placeholder = msgDest === 'compania' ? 'Email compañía' : (msgTipo === 'whatsapp' ? 'Teléfono cliente' : 'Email cliente');
        }
      });
    });

    // Enviar comunicación
    const btnSend = document.getElementById('btn-send-comm');
    if (btnSend) {
      btnSend.addEventListener('click', async () => {
        const mensaje = document.getElementById('panel-msg-texto').value.trim();
        if (!mensaje) return;
        try {
          const comm = await API.post(`/tickets/${ticketId}/comunicaciones`, {
            tipo: msgTipo,
            direccion: 'salida',
            destinatario: document.getElementById('panel-msg-dest')?.value || null,
            asunto: document.getElementById('panel-msg-asunto')?.value || null,
            mensaje,
          });
          document.getElementById('panel-msg-texto').value = '';
          const list = document.getElementById('panel-comm-list');
          const emptyMsg = list.querySelector('.text-light');
          if (emptyMsg) emptyMsg.remove();
          list.insertAdjacentHTML('beforeend', this.renderCommunication(comm));
          list.scrollTop = list.scrollHeight;
        } catch (err) {
          alert(err.message);
        }
      });
    }

    // Reasignar
    const reasignar = document.getElementById('panel-reasignar');
    if (reasignar) {
      reasignar.addEventListener('change', async () => {
        const val = reasignar.value;
        if (!val) return;
        try {
          await API.patch(`/tickets/${ticketId}`, { assigned_to: parseInt(val) });
          await this.loadKanban();
        } catch (err) {
          alert(err.message);
        }
      });
    }

    // Marcar resuelto
    const btnResolver = document.getElementById('btn-panel-resolver');
    if (btnResolver) {
      btnResolver.addEventListener('click', async () => {
        try {
          await API.patch(`/tickets/${ticketId}/move`, { estado: 'resuelto' });
          closePanel();
          await this.loadKanban();
        } catch (err) {
          alert(err.message);
        }
      });
    }
  },

  renderCommunication(c) {
    const icons = { email: '✉', whatsapp: '💬', nota: '📝', sistema: '⚙' };
    const colors = { email: '#009DDD', whatsapp: '#25d366', nota: '#f59e0b', sistema: '#94a3b8' };
    const dirLabel = c.direccion === 'entrada' ? '← Recibido' : '→ Enviado';
    const date = new Date(c.created_at).toLocaleString('es-ES');
    const isSystem = c.tipo === 'sistema';

    if (isSystem) {
      return `
        <div class="comm-bubble comm-sistema">
          <span class="comm-icon" style="color:${colors.sistema}">⚙</span>
          <span class="comm-text">${this.escapeHtml(c.mensaje)}</span>
          <span class="comm-date">${date}</span>
        </div>
      `;
    }

    return `
      <div class="comm-bubble comm-${c.tipo}">
        <div class="comm-header">
          <span class="comm-icon" style="background:${colors[c.tipo]}20;color:${colors[c.tipo]}">${icons[c.tipo] || '📌'}</span>
          <strong>${c.agente_nombre || 'Sistema'}</strong>
          <span class="comm-dir">${dirLabel}</span>
          <span class="comm-date">${date}</span>
        </div>
        ${c.destinatario ? `<div class="comm-dest">Para: ${this.escapeHtml(c.destinatario)}</div>` : ''}
        ${c.asunto ? `<div class="comm-subject">${this.escapeHtml(c.asunto)}</div>` : ''}
        <div class="comm-body">${this.escapeHtml(c.mensaje)}</div>
      </div>
    `;
  },

  // === Modal nuevo trámite ===
  showNewModal() {
    const prev = document.getElementById('modal-ticket');
    if (prev) prev.remove();

    const typeOpts = this.types.map(t => `<option value="${t.id}">${t.nombre}</option>`).join('');
    const colOpts = this.columns.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');

    let assignHtml = '';
    if (Auth.hasRole('admin', 'supervisor')) {
      const userOpts = this.users.filter(u => u.activo).map(u =>
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
        <h2 class="modal-title">Nuevo trámite</h2>
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
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Compañía</label>
              <select class="form-control" name="compania">
                <option value="">Sin compañía</option>
                <option value="ADESLAS">ADESLAS</option>
                <option value="DKV">DKV</option>
              </select>
            </div>
            <div class="form-group">
              <label>Urgencia</label>
              <select class="form-control" name="urgencia">
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div class="form-group">
              <label>Nº Póliza (opcional)</label>
              <input type="text" class="form-control" name="num_poliza" placeholder="Ej: 12345">
            </div>
            <div class="form-group">
              <label>Nº Solicitud (opcional)</label>
              <input type="text" class="form-control" name="num_solicitud" placeholder="Ej: SOL-001">
            </div>
          </div>
          <div class="form-group">
            <label>ID Deal Pipedrive (opcional)</label>
            <input type="text" class="form-control" name="pipedrive_deal_id" placeholder="Ej: 12345">
          </div>
          ${assignHtml}
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" id="btn-cancel-ticket">Cancelar</button>
            <button type="submit" class="btn btn-primary">Crear trámite</button>
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
        prioridad: form.urgencia.value,
      };
      if (form.assigned_to && form.assigned_to.value) body.assigned_to = parseInt(form.assigned_to.value);

      try {
        const ticket = await API.post('/tickets', body);
        // Actualizar campos nuevos via PATCH
        const extra = {};
        if (form.compania.value) extra.compania = form.compania.value;
        if (form.num_poliza.value) extra.num_poliza = form.num_poliza.value;
        if (form.num_solicitud.value) extra.num_solicitud = form.num_solicitud.value;
        if (form.urgencia.value !== 'normal') extra.urgencia = form.urgencia.value;
        if (Object.keys(extra).length > 0) {
          await API.patch(`/tickets/${ticket.id}`, extra);
        }
        overlay.remove();
        await this.loadKanban();
      } catch (err) {
        errEl.textContent = err.message;
        errEl.style.display = 'block';
      }
    });
  },

  // === Helpers ===
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
      nuevo: '#94a3b8', en_gestion: '#009DDD', esperando: '#f59e0b',
      resuelto: '#22c55e', cerrado: '#6b7280',
    };
    const labels = {
      nuevo: 'Abierto', en_gestion: 'En gestión', esperando: 'Esperando',
      resuelto: 'Resuelto', cerrado: 'Cerrado',
    };
    const color = colors[estado] || '#6b7280';
    return `<span class="badge" style="background:${color}20;color:${color};">${labels[estado] || estado}</span>`;
  },

  urgenciaBadge(u) {
    if (u === 'urgente') return '<span class="badge" style="background:#c6282820;color:#c62828;">Urgente</span>';
    if (u === 'alta') return '<span class="badge" style="background:#e6510020;color:#e65100;">Alta</span>';
    return '<span class="badge" style="background:#e8f5e9;color:#2e7d32;">Normal</span>';
  },

  prioridadBadge(p) {
    return this.urgenciaBadge(p);
  },

  // === Styles (inyectados en el módulo) ===
  getStyles() {
    return `
      .tramites-toolbar {
        display: flex; align-items: center; justify-content: space-between;
        margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
      }
      .tramites-toolbar-left {
        display: flex; align-items: center; gap: 12px;
      }
      .tramites-toolbar-right {
        display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
      }
      .tramites-badge {
        background: var(--accent); color: #fff; font-size: 13px; font-weight: 700;
        padding: 2px 10px; border-radius: 20px;
      }
      .tramites-view-tabs {
        display: flex; background: #fff; border-radius: 10px; border: 1px solid var(--border);
        overflow: hidden;
      }
      .tramites-view-tab {
        padding: 6px 16px; border: none; background: none; cursor: pointer;
        font-size: 13px; font-weight: 600; color: var(--text-light); transition: all 0.15s;
      }
      .tramites-view-tab.active {
        background: var(--accent); color: #fff;
      }
      .tramites-filter {
        min-width: 150px; font-size: 13px; padding: 8px 12px;
      }

      /* Kanban */
      .tramites-kanban {
        display: flex; gap: 16px; overflow-x: auto; padding-bottom: 16px;
        min-height: 400px;
      }
      .kanban-column {
        min-width: 260px; max-width: 300px; flex: 1;
        background: #fff; border-radius: 16px; display: flex; flex-direction: column;
        box-shadow: var(--shadow);
      }
      .kanban-column-header {
        display: flex; align-items: center; gap: 8px; padding: 16px 16px 12px;
        border-bottom: 1px solid var(--border);
      }
      .kanban-column-dot {
        width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
      }
      .kanban-column-title {
        font-size: 14px; font-weight: 600; flex: 1;
      }
      .kanban-column-count {
        background: var(--bg); font-size: 12px; font-weight: 700; padding: 2px 8px;
        border-radius: 10px; color: var(--text-light);
      }
      .kanban-column-body {
        flex: 1; padding: 12px; display: flex; flex-direction: column; gap: 10px;
        overflow-y: auto; max-height: calc(100vh - 300px);
        transition: background 0.15s;
      }
      .kanban-column-body.drag-over {
        background: var(--accent)08;
      }
      .kanban-empty {
        text-align: center; color: var(--text-light); font-size: 13px;
        padding: 24px 8px; font-style: italic;
      }

      /* Cards */
      .kanban-card {
        background: #fff; border-radius: 12px; overflow: hidden; cursor: pointer;
        border: 1px solid var(--border); transition: transform 0.1s, box-shadow 0.15s;
      }
      .kanban-card:hover {
        transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.1);
      }
      .kanban-card.dragging {
        opacity: 0.5; transform: rotate(2deg);
      }
      .kanban-card.urgente { border-left: 3px solid #c62828; }
      .kanban-card.alta { border-left: 3px solid #e65100; }
      .kanban-card-topbar {
        height: 4px;
      }
      .kanban-card-content {
        padding: 12px;
      }
      .kanban-card-header {
        display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;
      }
      .kanban-card-type {
        font-size: 11px; font-weight: 600; background: var(--accent)15;
        color: var(--accent); padding: 2px 8px; border-radius: 6px;
      }
      .kanban-card-ref {
        font-size: 11px; color: var(--text-light); font-weight: 600;
      }
      .kanban-card-client {
        display: flex; align-items: center; gap: 8px; margin-bottom: 6px;
      }
      .kanban-card-avatar {
        width: 28px; height: 28px; border-radius: 50%; background: var(--accent);
        color: #fff; font-size: 11px; font-weight: 700;
        display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      }
      .kanban-card-name {
        font-size: 13px; font-weight: 600;
      }
      .kanban-card-phone {
        font-size: 11px; color: var(--text-light);
      }
      .kanban-card-desc {
        font-size: 12px; color: var(--text-light); margin-bottom: 8px;
        line-height: 1.4;
      }
      .kanban-card-pills {
        display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px;
      }
      .kanban-pill {
        font-size: 10px; background: var(--bg); padding: 2px 6px; border-radius: 4px;
        color: var(--text-light); font-weight: 500;
      }
      .kanban-card-footer {
        display: flex; justify-content: space-between; align-items: center;
        font-size: 11px; color: var(--text-light); border-top: 1px solid var(--border);
        padding-top: 8px;
      }
      .kanban-card-agent { font-weight: 500; }
      .kanban-card-days.old { color: #c62828; font-weight: 600; }

      /* Stats bar */
      .tramites-stats {
        display: flex; gap: 24px; padding: 16px 0; font-size: 14px;
        color: var(--text-light);
      }
      .tramites-stats .stat-item strong {
        color: var(--text); margin-right: 4px;
      }
      .tramites-stats .stat-item.warning strong {
        color: #c62828;
      }

      /* Panel lateral */
      .tramite-panel-overlay {
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        z-index: 1000; display: flex; justify-content: flex-end;
      }
      .tramite-panel-backdrop {
        position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.3); opacity: 0; transition: opacity 0.3s;
      }
      .tramite-panel-overlay.open .tramite-panel-backdrop { opacity: 1; }
      .tramite-panel {
        width: 520px; max-width: 100vw; background: #fff; height: 100vh;
        overflow-y: auto; position: relative; z-index: 1;
        box-shadow: -4px 0 24px rgba(0,0,0,0.15);
        transform: translateX(100%); transition: transform 0.3s ease;
        display: flex; flex-direction: column;
      }
      .tramite-panel-overlay.open .tramite-panel {
        transform: translateX(0);
      }
      .panel-header {
        display: flex; justify-content: space-between; align-items: flex-start;
        padding: 24px 24px 16px; border-bottom: 1px solid var(--border);
      }
      .panel-title {
        font-size: 18px; font-weight: 700; margin-top: 4px;
      }
      .panel-phone {
        font-size: 13px; color: var(--text-light);
      }
      .panel-close {
        background: none; border: none; font-size: 28px; cursor: pointer;
        color: var(--text-light); line-height: 1; padding: 0 4px;
      }
      .panel-close:hover { color: var(--text); }

      /* Status steps */
      .panel-steps {
        display: flex; align-items: center; justify-content: center; gap: 0;
        padding: 20px 24px;
      }
      .step-dot {
        width: 28px; height: 28px; border-radius: 50%; display: flex;
        align-items: center; justify-content: center; font-size: 11px;
        font-weight: 700; flex-shrink: 0;
      }
      .step-dot.done { background: #22c55e; color: #fff; }
      .step-dot.active { background: var(--accent); color: #fff; }
      .step-dot.pending { background: var(--bg); color: var(--text-light); }
      .step-line {
        width: 24px; height: 2px; background: var(--border); flex-shrink: 0;
      }

      /* Info grid */
      .panel-info-grid {
        display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
        padding: 0 24px 16px;
      }
      .panel-info-label {
        display: block; font-size: 11px; color: var(--text-light); margin-bottom: 2px;
        text-transform: uppercase; letter-spacing: 0.5px;
      }
      .panel-info-value {
        font-size: 14px; font-weight: 500;
      }

      /* Description */
      .panel-desc-box {
        margin: 0 24px 16px; padding: 12px 16px; background: var(--bg);
        border-radius: 12px; font-size: 14px;
      }
      .panel-desc-box strong { display: block; margin-bottom: 4px; font-size: 12px; }
      .panel-desc-box p { margin: 0; line-height: 1.5; }

      .panel-section-title {
        font-size: 14px; font-weight: 700; padding: 0 24px; margin-bottom: 8px;
      }

      /* Communication list */
      .panel-comm-list {
        padding: 0 24px 16px; max-height: 300px; overflow-y: auto;
        display: flex; flex-direction: column; gap: 8px;
      }
      .comm-bubble {
        padding: 12px; border-radius: 12px; background: var(--bg);
        font-size: 13px; line-height: 1.5;
      }
      .comm-bubble.comm-sistema {
        display: flex; align-items: center; gap: 8px;
        background: transparent; padding: 6px 0; font-size: 12px;
        color: var(--text-light); font-style: italic;
      }
      .comm-header {
        display: flex; align-items: center; gap: 8px; margin-bottom: 6px;
        flex-wrap: wrap;
      }
      .comm-icon {
        width: 24px; height: 24px; border-radius: 6px; display: inline-flex;
        align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0;
      }
      .comm-dir { font-size: 11px; color: var(--text-light); }
      .comm-date { font-size: 11px; color: var(--text-light); margin-left: auto; }
      .comm-dest, .comm-subject { font-size: 12px; color: var(--text-light); margin-bottom: 4px; }
      .comm-subject { font-weight: 600; color: var(--text); }
      .comm-body { white-space: pre-wrap; }

      /* New message section */
      .panel-new-message {
        padding: 16px 24px; border-top: 1px solid var(--border);
      }
      .panel-msg-tabs {
        display: flex; gap: 0; margin-bottom: 12px; border-radius: 10px;
        border: 1px solid var(--border); overflow: hidden;
      }
      .panel-msg-tab {
        flex: 1; padding: 6px 8px; border: none; background: none; cursor: pointer;
        font-size: 11px; font-weight: 600; color: var(--text-light); transition: all 0.15s;
        white-space: nowrap;
      }
      .panel-msg-tab.active {
        background: var(--accent); color: #fff;
      }

      /* Panel footer */
      .panel-footer {
        display: flex; gap: 8px; padding: 16px 24px; border-top: 1px solid var(--border);
        margin-top: auto; align-items: center;
      }
      .btn-success {
        background: #22c55e; color: #fff;
      }
      .btn-success:hover { background: #16a34a; }
    `;
  },
};
