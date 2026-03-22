// === Pipeline Kanban — Módulo nativo CRM ===

const PipelineModule = {
  pipelines: [],
  currentPipeline: null,
  stages: [],
  agents: [],
  agentFilter: null,
  editMode: false,
  ddOpen: false,
  dragged: null,

  // Helpers
  ini(n) { return (n||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase(); },
  hu(id) { return (id*47)%360; },
  esc(s) { const d=document.createElement('div');d.textContent=s||'';return d.innerHTML; },
  ago(days) {
    if (days===null||days===undefined) return '';
    if (days<=0) return 'Hoy';
    if (days===1) return 'Ayer';
    if (days<=7) return days+'d';
    if (days<=30) return Math.ceil(days/7)+'sem';
    return Math.floor(days/30)+'m';
  },

  async render() {
    const c = document.getElementById('main-content');
    c.style.padding = '0';
    c.style.overflow = 'hidden';

    // Inyectar CSS
    if (!document.getElementById('pl-css')) {
      const st = document.createElement('style'); st.id = 'pl-css';
      st.textContent = `
        .pl-wrap{display:flex;flex-direction:column;height:calc(100vh - 60px);overflow:hidden;background:#f4f6f9;min-width:0;}
        .pl-toolbar{background:#fff;border-bottom:1px solid #e8edf2;padding:0 20px;display:flex;align-items:center;gap:10px;height:50px;flex-shrink:0}
        .pl-emb-wrap{position:relative}
        .pl-emb-btn{display:flex;align-items:center;gap:8px;padding:7px 12px;border-radius:8px;border:1px solid #e8edf2;background:#fff;cursor:pointer;font-size:13px;font-weight:700;color:#0f172a;font-family:inherit}
        .pl-emb-btn:hover{border-color:#d1d9e0}
        .pl-emb-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
        .pl-emb-count{font-size:11px;color:#94a3b8;font-weight:400}
        .pl-emb-dd{position:absolute;top:calc(100% + 6px);left:0;background:#fff;border:1px solid #e8edf2;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,.08);width:280px;z-index:500;display:none;overflow:hidden}
        .pl-emb-dd.open{display:block}
        .pl-dd-item{display:flex;align-items:center;gap:10px;padding:9px 14px;cursor:pointer;font-size:13px;font-weight:500;color:#475569}
        .pl-dd-item:hover{background:#f4f6f9}
        .pl-dd-item.active{color:#009DDD;font-weight:600}
        .pl-sep{width:1px;height:22px;background:#e8edf2}
        .pl-agents{display:flex;gap:5px;overflow-x:auto;flex-shrink:1}
        .pl-chip{display:flex;align-items:center;gap:5px;padding:5px 10px;border-radius:20px;border:1px solid #e8edf2;background:#fff;cursor:pointer;font-size:11px;font-weight:600;color:#475569;white-space:nowrap;font-family:inherit}
        .pl-chip:hover{border-color:#d1d9e0}
        .pl-chip.on{border-color:#009DDD;background:#e6f5fc;color:#009DDD}
        .pl-chip-av{width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:6px;font-weight:700;color:#fff}
        .pl-btn-new{display:flex;align-items:center;gap:5px;padding:7px 12px;border-radius:8px;border:none;background:#009DDD;color:#fff;cursor:pointer;font-size:12px;font-weight:700;margin-left:auto;font-family:inherit}
        .pl-btn-new:hover{background:#e0334f}
        .pl-edit-btn{width:30px;height:30px;border-radius:7px;border:1px solid #e8edf2;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;color:#475569}
        .pl-edit-btn:hover{background:#f4f6f9}
        .pl-stats{background:#fff;border-bottom:1px solid #e8edf2;padding:7px 20px;display:flex;align-items:center;gap:16px;flex-shrink:0;font-size:12px;color:#475569}
        .pl-stat-val{font-weight:700;color:#0f172a}
        .pl-board{flex:1;overflow-x:auto;overflow-y:hidden;padding:16px 20px 8px;-webkit-overflow-scrolling:touch;}
        .pl-board-inner{display:table;min-width:max-content;border-spacing:6px 0;}
        .pl-col{display:table-cell;width:240px;min-width:240px;vertical-align:top;background:#fafbfc;border-radius:10px;}
        .pl-col.pl-col-empty{width:100px;min-width:100px;}
        .pl-col.pl-col-top{background:#f6f7f9}
        .pl-col-hd{padding:16px 14px 12px;border-bottom:1px solid #e8edf2}
        .pl-col-hd-r1{display:flex;align-items:baseline;gap:10px}
        .pl-col-name{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1.2px;color:#475569;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .pl-col-count{font-size:20px;font-weight:800;color:#475569;line-height:1;flex-shrink:0}
        .pl-col-top .pl-col-count{color:#0f172a}
        .pl-col-cards{overflow-y:auto;max-height:calc(100vh - 220px);padding:8px;display:flex;flex-direction:column;gap:6px;min-height:60px}
        .pl-col-cards.drag-over{background:rgba(255,74,110,.04);border:2px dashed #009DDD;border-radius:0 0 12px 12px}
        .pl-col-add{margin:0 8px 8px;padding:6px;border-radius:7px;border:1px dashed #d1d9e0;background:none;cursor:pointer;font-size:11px;font-weight:600;color:#94a3b8;display:flex;align-items:center;justify-content:center;gap:4px;font-family:inherit}
        .pl-col-add:hover{border-color:#009DDD;color:#009DDD}
        .pl-card{background:#fff;border:1px solid #e8edf2;border-left:3px solid #94a3b8;border-radius:0 8px 8px 0;cursor:pointer;transition:all .15s;user-select:none;overflow:hidden;}
        .pl-card:hover{box-shadow:0 4px 12px rgba(0,0,0,.08);transform:translateY(-1px);}
        .pl-card.dragging{opacity:.4;transform:rotate(2deg);}
        .pl-card.act-red{border-left-color:#ef4444;}
        .pl-card.act-green{border-left-color:#10b981;}
        .pl-card.act-amber{border-left-color:#f59e0b;}
        .pl-card.act-gray{border-left-color:#94a3b8;}
        .pl-card-body{padding:10px 12px 8px;}
        .pl-card-row1{display:flex;align-items:center;gap:6px;}
        .pl-card-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
        .pl-card-dot.tri{width:0;height:0;border-radius:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:8px solid #f59e0b;}
        .pl-card-name{font-size:13px;font-weight:700;color:#0f172a;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .pl-card-id{font-size:10px;color:#94a3b8;flex-shrink:0;}
        .pl-card-sub{font-size:11px;color:#009DDD;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;padding-left:14px;}
        .pl-card-foot{display:flex;align-items:center;gap:6px;padding:6px 10px;border-top:1px solid #f0f2f5;}
        .pl-card-ag{width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:700;color:#fff;flex-shrink:0;}
        .pl-card-agname{font-size:11px;color:#475569;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .pl-card-act{font-size:11px;font-weight:600;flex-shrink:0;display:flex;align-items:center;gap:4px;}
        .pl-card-act.vencida{color:#ef4444;}
        .pl-card-act.hoy{color:#475569;}
        .pl-card-act.prox{color:#10b981;}
        .pl-card-act.lejos{color:#94a3b8;}
        .pl-modal-ov{position:fixed;inset:0;background:rgba(15,23,42,.5);display:flex;align-items:center;justify-content:center;z-index:400}
        .pl-modal{background:#fff;border-radius:14px;width:460px;box-shadow:0 20px 60px rgba(0,0,0,.2);overflow:hidden;max-height:90vh;overflow-y:auto}
        .pl-modal-hd{padding:18px 20px;border-bottom:1px solid #e8edf2;display:flex;align-items:center;gap:12px}
        .pl-modal-av{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800;color:#fff;flex-shrink:0}
        .pl-modal-name{font-size:16px;font-weight:800;flex:1}
        .pl-modal-close{background:none;border:none;cursor:pointer;color:#94a3b8;font-size:18px;padding:4px}
        .pl-modal-body{padding:16px 20px;display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .pl-mf{display:flex;flex-direction:column;gap:2px}
        .pl-mf-l{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#94a3b8}
        .pl-mf-v{font-size:13px;font-weight:500}
        .pl-modal-ft{padding:14px 20px;border-top:1px solid #e8edf2;display:flex;gap:8px}
        .pl-modal-ft button{padding:9px 14px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:700;font-family:inherit}
        .pl-btn-ver{flex:1;border:none;background:#009DDD;color:#fff}
        .pl-btn-mover{border:1px solid #e8edf2;background:#fff;color:#475569}
        .pl-col-new{width:160px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:none;border:2px dashed #d1d9e0;border-radius:12px;cursor:pointer;font-size:12px;font-weight:600;color:#94a3b8;gap:6px;font-family:inherit}
        .pl-col-new:hover{border-color:#009DDD;color:#009DDD}
        .pl-edit-hd{background:#fff;border-bottom:2px solid #009DDD;padding:0 20px;display:flex;align-items:center;gap:12px;height:50px;flex-shrink:0}
        .pl-edit-input{padding:6px 12px;border:1px solid #e8edf2;border-radius:8px;font-size:14px;font-weight:700;color:#0f172a;outline:none;width:180px;font-family:inherit}
        .pl-edit-input:focus{border-color:#009DDD}
        .pl-empty{text-align:center;padding:40px;color:#94a3b8;font-size:14px}
      `;
      document.head.appendChild(st);
    }

    // Cargar datos iniciales
    try {
      const [plR, agR] = await Promise.all([
        API.get('/pipeline'),
        API.get('/pipeline/agents/list')
      ]);
      this.pipelines = plR.pipelines || [];
      this.agents = agR.agents || [];
    } catch(e) { console.error('Error cargando pipelines:', e); c.innerHTML = `<p style="color:red;padding:20px;">Error cargando pipelines: ${e.message}</p>`; return; }

    console.log('[Pipeline] Pipelines cargados:', this.pipelines.length, '| Agentes:', this.agents.length);

    if (!this.currentPipeline && this.pipelines.length > 0) {
      this.currentPipeline = this.pipelines[0];
    }

    if (!this.currentPipeline) { c.innerHTML = '<p style="padding:20px;color:#94a3b8;">No hay pipelines disponibles.</p>'; return; }

    console.log('[Pipeline] Pipeline seleccionado:', this.currentPipeline.name, '| ID:', this.currentPipeline.id);
    this.renderShell(c);
    this.loadBoard();
  },

  renderShell(c) {
    const pl = this.currentPipeline;
    const adm = Auth.hasRole('admin', 'supervisor');
    const selAgent = this.agentFilter ? this.agents.find(a=>a.id===this.agentFilter) : null;
    const agentBtnLabel = selAgent ? `<div class="pl-chip-av" style="background:hsl(${this.hu(selAgent.id)},55%,55%)">${this.ini(selAgent.nombre)}</div> ${selAgent.nombre.split(' ')[0]}` : 'Todos los agentes';

    c.innerHTML = `<div class="pl-wrap">
      <div class="pl-toolbar" id="pl-toolbar">
        <div class="pl-emb-wrap" id="pl-emb-wrap">
          <button class="pl-emb-btn" onclick="PipelineModule.toggleDD()">
            <div class="pl-emb-dot" style="background:${pl?.color||'#009DDD'}"></div>
            <span id="pl-emb-name">${pl?.name||'Seleccionar'}</span>
            <span class="pl-emb-count" id="pl-emb-count">· ${pl?.deal_count||0} deals</span>
            <span style="font-size:10px;color:#94a3b8">▼</span>
          </button>
          <div class="pl-emb-dd" id="pl-emb-dd">
            ${this.pipelines.map(p=>`<div class="pl-dd-item ${p.id===pl?.id?'active':''}" onclick="PipelineModule.selectPipeline(${p.id})">
              <div class="pl-emb-dot" style="background:${p.color}"></div>
              <span style="flex:1">${this.esc(p.name)}</span>
              <span style="font-size:11px;color:#94a3b8">${p.deal_count||0}</span>
              ${p.id===pl?.id?'<span style="color:#009DDD">✓</span>':''}
            </div>`).join('')}
            ${adm?'<div style="height:1px;background:#e8edf2;margin:4px 0"></div><div class="pl-dd-item" onclick="PipelineModule.newPipelinePrompt()" style="color:#009DDD;font-weight:700">+ Nuevo embudo</div>':''}
          </div>
        </div>
        ${adm?'<button class="pl-edit-btn" onclick="PipelineModule.toggleEdit()" title="Editar pipeline">✏️</button>':''}
        <div class="pl-sep"></div>
        <div style="flex:1"></div>
        <div class="pl-emb-wrap" id="pl-ag-wrap">
          <button class="pl-emb-btn" onclick="PipelineModule.toggleAgDD()" style="font-weight:500;font-size:12px">
            ${agentBtnLabel}
            <span style="font-size:10px;color:#94a3b8">▼</span>
          </button>
          <div class="pl-emb-dd" id="pl-ag-dd" style="right:0;left:auto">
            <div class="pl-dd-item ${!this.agentFilter?'active':''}" onclick="PipelineModule.filterAgent(null)">
              <span style="flex:1">Todos los agentes</span>
              ${!this.agentFilter?'<span style="color:#009DDD">✓</span>':''}
            </div>
            <div style="height:1px;background:#e8edf2;margin:4px 0"></div>
            ${this.agents.map(a=>`<div class="pl-dd-item ${this.agentFilter===a.id?'active':''}" onclick="PipelineModule.filterAgent(${a.id})">
              <div class="pl-chip-av" style="background:hsl(${this.hu(a.id)},55%,55%)">${this.ini(a.nombre)}</div>
              <span style="flex:1">${this.esc(a.nombre)}</span>
              ${this.agentFilter===a.id?'<span style="color:#009DDD">✓</span>':''}
            </div>`).join('')}
          </div>
        </div>
      </div>
      ${this.editMode?`<div class="pl-edit-hd" id="pl-edit-hd">
        <span style="font-size:12px;font-weight:600;color:#94a3b8">Editando:</span>
        <input class="pl-edit-input" id="pl-edit-name" value="${this.esc(pl?.name||'')}" onchange="PipelineModule.renamePipeline(this.value)">
        <div style="flex:1"></div>
        <button class="pl-emb-btn" style="font-size:12px" onclick="PipelineModule.toggleEdit()">Cancelar</button>
        <button style="padding:8px 16px;border-radius:8px;border:none;background:#009DDD;color:#fff;cursor:pointer;font-size:12px;font-weight:700;font-family:inherit" onclick="PipelineModule.toggleEdit()">Listo</button>
      </div>`:''}
      <div class="pl-stats" id="pl-stats"></div>
      <div class="pl-board" id="pl-board"><div class="pl-empty">Cargando pipeline...</div></div>
    </div>`;

    // Cerrar dropdowns al hacer click fuera
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#pl-emb-wrap')) document.getElementById('pl-emb-dd')?.classList.remove('open');
      if (!e.target.closest('#pl-ag-wrap')) document.getElementById('pl-ag-dd')?.classList.remove('open');
    });
  },

  toggleAgDD() {
    document.getElementById('pl-ag-dd')?.classList.toggle('open');
    document.getElementById('pl-emb-dd')?.classList.remove('open');
  },

  async newPipelinePrompt() {
    document.getElementById('pl-emb-dd')?.classList.remove('open');
    const name = prompt('Nombre del nuevo embudo:');
    if (!name) return;
    try {
      const r = await API.post('/pipeline', { name });
      await this.render();
    } catch(e) { alert('Error: ' + e.message); }
  },

  async renamePipeline(name) {
    if (!name || !this.currentPipeline) return;
    try {
      await API.patch(`/pipeline/${this.currentPipeline.id}`, { name });
      this.currentPipeline.name = name;
    } catch(e) { alert('Error: ' + e.message); }
  },

  toggleDD() {
    document.getElementById('pl-emb-dd')?.classList.toggle('open');
  },

  async selectPipeline(id) {
    this.currentPipeline = this.pipelines.find(p=>p.id===id);
    document.getElementById('pl-emb-dd')?.classList.remove('open');
    document.getElementById('pl-emb-name').textContent = this.currentPipeline?.name||'';
    document.getElementById('pl-emb-count').textContent = '· ' + (this.currentPipeline?.deal_count||0) + ' deals';
    this.agentFilter = null;
    this.loadBoard();
  },

  async loadBoard() {
    const board = document.getElementById('pl-board');
    if (!board || !this.currentPipeline) return;
    board.innerHTML = '<div class="pl-empty">Cargando...</div>';

    try {
      const params = this.agentFilter ? `?agente_id=${this.agentFilter}` : '';
      const [data, stats] = await Promise.all([
        API.get(`/pipeline/${this.currentPipeline.id}/board${params}`),
        API.get(`/pipeline/${this.currentPipeline.id}/stats`)
      ]);
      this.stages = data.stages || [];
      this.renderStats(stats);
      this.renderBoard();
    } catch(e) {
      console.error('Pipeline loadBoard error:', e);
      board.innerHTML = `<div class="pl-empty" style="color:#ef4444;">Error cargando pipeline: ${e.message}<br><br><button onclick="PipelineModule.loadBoard()" style="padding:8px 16px;border-radius:8px;border:1px solid #e8edf2;background:#fff;cursor:pointer;font-family:inherit;">Reintentar</button></div>`;
    }
  },

  renderStats(stats) {
    const el = document.getElementById('pl-stats');
    if (!el) return;
    el.innerHTML = `<div><span class="pl-stat-val">${stats.total}</span> contactos en este embudo</div>`;
  },

  renderBoard() {
    const board = document.getElementById('pl-board');
    if (!board) return;

    if (this.stages.length === 0) {
      board.innerHTML = '<div class="pl-empty">Este pipeline no tiene etapas. Usa el botón de editar para añadir etapas.</div>';
      return;
    }

    try {
      // Encontrar la columna con más deals para destacarla
      const maxDeals = Math.max(...this.stages.map(s => s.deals.length), 0);

      const cols = this.stages.map((s,i) => {
        const isTop = s.deals.length === maxDeals && maxDeals > 0;
        const isEmpty = s.deals.length === 0;
        return `
        <div class="pl-col ${isTop ? 'pl-col-top' : ''} ${isEmpty ? 'pl-col-empty' : ''}" data-stage-id="${s.id}">
          ${this.editMode ? `<div style="padding:10px;background:#fff;border-bottom:1px solid #e8edf2">
            <input class="pl-edit-input" value="${this.esc(s.name)}" style="width:100%;margin-bottom:6px" onchange="PipelineModule.renameStage(${s.id},this.value)">
            <div style="display:flex;gap:4px">
              <button style="flex:1;padding:4px;border-radius:6px;border:1px solid #ef4444;background:#fef2f2;color:#ef4444;cursor:pointer;font-size:10px;font-weight:600;font-family:inherit" onclick="PipelineModule.deleteStage(${s.id})">Eliminar</button>
            </div>
          </div>` : `<div class="pl-col-hd">
            <div class="pl-col-hd-r1">
              <div class="pl-col-name">${this.esc(s.name)}</div>
              <div class="pl-col-count">${s.total_deals || s.deals.length}</div>
            </div>
          </div>`}
          <div class="pl-col-cards" data-stage-id="${s.id}">
            ${s.deals.map(d => { try { return this.renderCard(d); } catch(e) { console.error('Card render error deal #'+d.id, e); return ''; } }).join('')}
          </div>
          ${s.has_more ? `<div style="text-align:center;padding:6px;font-size:11px;font-weight:600;color:#009DDD;cursor:pointer;border-top:1px solid #e8edf2;" onclick="PipelineModule.loadMore(${s.id})">Ver ${s.total_deals - s.deals.length} más</div>` : ''}
          <button class="pl-col-add" onclick="PipelineModule.showNewDeal(${s.id})">+ Añadir</button>
        </div>`;
      }).join('');
      board.innerHTML = `<div class="pl-board-inner">${cols}${this.editMode ? '<div class="pl-col-new" style="display:table-cell;width:160px;vertical-align:top;" onclick="PipelineModule.addStagePrompt()">+ Nueva etapa</div>' : ''}</div>`;

      this.initDragDrop();
    } catch(e) {
      console.error('Pipeline renderBoard error:', e);
      board.innerHTML = `<div class="pl-empty" style="color:#ef4444;">Error renderizando: ${e.message}</div>`;
    }
  },

  renderCard(d) {
    // Nombre: persona siempre como título principal
    const name = d.persona_nombre || d.producto || 'Sin contacto';
    const displayId = d.pipedrive_id || d.id;

    // Subtítulo: email o teléfono si existe
    const sub = d.persona_email || d.persona_telefono || '';

    // Indicador de actividad
    const nextAct = d.next_activity_date ? new Date(d.next_activity_date) : null;
    const now = new Date();
    let actClass, dotClass, isTri = false, actLabel = '';
    if (!nextAct) {
      actClass = 'act-amber'; dotClass = 'tri'; isTri = true; actLabel = '';
    } else {
      const diffH = (nextAct - now) / 3600000;
      if (diffH < 0) {
        actClass = 'act-red'; dotClass = '';
        actLabel = '<span class="pl-card-act vencida">Vencida</span>';
      } else if (diffH <= 2) {
        actClass = 'act-green'; dotClass = '';
        const h = nextAct.getHours().toString().padStart(2,'0');
        const m = nextAct.getMinutes().toString().padStart(2,'0');
        actLabel = `<span class="pl-card-act prox">${h}:${m}</span>`;
      } else {
        const isToday = nextAct.toDateString() === now.toDateString();
        actClass = 'act-gray'; dotClass = '';
        if (isToday) {
          const h = nextAct.getHours().toString().padStart(2,'0');
          const m = nextAct.getMinutes().toString().padStart(2,'0');
          actLabel = `<span class="pl-card-act hoy">Hoy ${h}:${m}</span>`;
        } else {
          const d2 = Math.ceil(diffH / 24);
          actLabel = `<span class="pl-card-act lejos">${d2}d</span>`;
        }
      }
    }
    const dotColor = {'act-red':'#ef4444','act-green':'#10b981','act-amber':'#f59e0b','act-gray':'#94a3b8'}[actClass];

    // Triángulo sin llamada para el footer
    const triSvg = isTri ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="#f59e0b" stroke="none"><path d="M12 2L2 22h20L12 2z"/></svg>' : '';

    // Click
    const onclick = d.persona_id
      ? `App.navigate('personas');setTimeout(()=>PersonasModule.showFicha(${d.persona_id}),300)`
      : `PipelineModule.showDealModal(${d.id})`;

    return `<div class="pl-card ${actClass}" draggable="true" data-deal-id="${d.id}" onclick="${onclick}" data-agent-id="${d.agente_id||''}">
      <div class="pl-card-body">
        <div class="pl-card-row1">
          <div class="pl-card-dot ${isTri?'tri':''}" ${!isTri?`style="background:${dotColor}"`:''} title="${isTri?'Sin llamada agendada':''}"></div>
          <div class="pl-card-name">${this.esc(name)}</div>
          <div class="pl-card-id">#${displayId}</div>
        </div>
        ${sub ? `<div class="pl-card-sub">${this.esc(sub)}</div>` : ''}
      </div>
      <div class="pl-card-foot">
        <div class="pl-card-ag" style="background:hsl(${this.hu(d.agente_id||d.id)},55%,55%)">${d.agente_nombre ? this.ini(d.agente_nombre) : '—'}</div>
        <div class="pl-card-agname">${d.agente_nombre ? d.agente_nombre.split(' ')[0] : 'Sin agente'}</div>
        ${triSvg}${actLabel}
      </div>
    </div>`;
  },

  // ══════════════════════════════════════
  // DRAG & DROP
  // ══════════════════════════════════════
  initDragDrop() {
    const cards = document.querySelectorAll('.pl-card');
    const cols = document.querySelectorAll('.pl-col-cards');

    cards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        e.stopPropagation();
        this.dragged = card;
        setTimeout(() => card.classList.add('dragging'), 0);
        e.dataTransfer.effectAllowed = 'move';
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        cols.forEach(c => c.classList.remove('drag-over'));
      });
    });

    cols.forEach(col => {
      col.addEventListener('dragover', (e) => { e.preventDefault(); col.classList.add('drag-over'); });
      col.addEventListener('dragleave', () => { col.classList.remove('drag-over'); });
      col.addEventListener('drop', (e) => {
        e.preventDefault();
        col.classList.remove('drag-over');
        if (!this.dragged) return;
        const dealId = this.dragged.dataset.dealId;
        const newStageId = col.dataset.stageId;
        // Mover visualmente
        col.appendChild(this.dragged);
        // Actualizar contadores
        document.querySelectorAll('.pl-col').forEach(c => {
          const cnt = c.querySelector('.pl-col-count');
          const cards = c.querySelector('.pl-col-cards');
          if (cnt && cards) cnt.textContent = cards.querySelectorAll('.pl-card').length;
        });
        // API call
        this.moveDeal(dealId, newStageId);
        this.dragged = null;
      });
    });
  },

  async moveDeal(dealId, stageId) {
    try {
      await API.patch(`/pipeline/deals/${dealId}/move`, { stage_id: parseInt(stageId) });
    } catch(e) {
      alert('Error moviendo deal: ' + e.message);
      this.loadBoard(); // Revert
    }
  },

  // ══════════════════════════════════════
  // FILTRO POR AGENTE
  // ══════════════════════════════════════
  filterAgent(id) {
    this.agentFilter = id;
    document.getElementById('pl-ag-dd')?.classList.remove('open');
    // Re-render shell para actualizar botón del agente, luego recargar board
    this.renderShell(document.getElementById('main-content'));
    if (this.currentPipeline) this.loadBoard();
  },

  // ══════════════════════════════════════
  // MODAL DEAL
  // ══════════════════════════════════════
  async showDealModal(dealId) {
    try {
      const d = await API.get(`/pipeline/deals/${dealId}`);
      const name = d.persona_nombre || 'Sin contacto';
      const color = `hsl(${this.hu(d.persona_id||d.id)},55%,55%)`;
      const modal = document.createElement('div');
      modal.className = 'pl-modal-ov';
      modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
      modal.innerHTML = `<div class="pl-modal">
        <div class="pl-modal-hd">
          <div class="pl-modal-av" style="background:${color}">${this.ini(name)}</div>
          <div style="flex:1">
            <div class="pl-modal-name">${this.esc(name)}</div>
            ${d.producto?`<div style="display:inline-flex;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;margin-top:3px;background:#eff6ff;color:#3b82f6">${this.esc(d.producto)}</div>`:''}
          </div>
          <button class="pl-modal-close" onclick="this.closest('.pl-modal-ov').remove()">✕</button>
        </div>
        <div class="pl-modal-body">
          <div class="pl-mf"><div class="pl-mf-l">Teléfono</div><div class="pl-mf-v">${d.persona_telefono||'—'}</div></div>
          <div class="pl-mf"><div class="pl-mf-l">Email</div><div class="pl-mf-v">${d.persona_email||'—'}</div></div>
          <div class="pl-mf"><div class="pl-mf-l">Agente</div><div class="pl-mf-v">${d.agente_nombre||'—'}</div></div>
          <div class="pl-mf"><div class="pl-mf-l">Etapa</div><div class="pl-mf-v">${d.stage_name||d.pipedrive_stage||'—'}</div></div>
          <div class="pl-mf"><div class="pl-mf-l">Pipeline</div><div class="pl-mf-v">${d.pipeline_name||'—'}</div></div>
          <div class="pl-mf"><div class="pl-mf-l">Compañía</div><div class="pl-mf-v">${d.compania||'—'}</div></div>
          <div class="pl-mf"><div class="pl-mf-l">Prima</div><div class="pl-mf-v">${d.prima?d.prima+'€':'—'}</div></div>
          <div class="pl-mf"><div class="pl-mf-l">Estado</div><div class="pl-mf-v">${d.pipedrive_status||d.estado||'—'}</div></div>
        </div>
        <div class="pl-modal-ft">
          <button class="pl-btn-mover" onclick="this.closest('.pl-modal-ov').remove()">Cerrar</button>
          <button style="padding:9px 14px;border-radius:8px;border:none;background:#10b981;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit" onclick="PipelineModule.markDealWon(${d.id},'${this.esc(name)}','${this.esc(d.producto||'')}');this.closest('.pl-modal-ov').remove()">Ganado</button>
          <button style="padding:9px 14px;border-radius:8px;border:1px solid #ef4444;background:#fff;color:#ef4444;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit" onclick="PipelineModule.markDealLost(${d.id});this.closest('.pl-modal-ov').remove()">Perdido</button>
          ${d.persona_id?`<button class="pl-btn-ver" onclick="this.closest('.pl-modal-ov').remove();App.navigate('personas');setTimeout(()=>PersonasModule.showFicha(${d.persona_id}),200)">Ver ficha</button>`:''}
        </div>
      </div>`;
      document.body.appendChild(modal);
    } catch(e) { alert('Error: ' + e.message); }
  },

  // ══════════════════════════════════════
  // MARCAR GANADO / PERDIDO
  // ══════════════════════════════════════
  async markDealWon(dealId, nombre, producto) {
    try {
      await API.patch(`/pipeline/deals/${dealId}/move`, { stage_id: null, status: 'won' });
      if (window.dispararCelebracion) {
        window.dispararCelebracion(
          'VENTA CERRADA',
          (producto ? producto + ' · ' : '') + (nombre || 'Deal #' + dealId)
        );
      }
      this.loadBoard();
    } catch (e) { alert('Error: ' + e.message); }
  },

  async markDealLost(dealId) {
    const reason = prompt('Motivo de pérdida (opcional):');
    try {
      await API.patch(`/pipeline/deals/${dealId}/move`, { stage_id: null, status: 'lost', lost_reason: reason || null });
      this.loadBoard();
    } catch (e) { alert('Error: ' + e.message); }
  },

  // ══════════════════════════════════════
  // NUEVO DEAL
  // ══════════════════════════════════════
  showNewDeal(stageId) {
    const stages = this.stages;
    const modal = document.createElement('div');
    modal.className = 'pl-modal-ov';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    modal.innerHTML = `<div class="pl-modal">
      <div class="pl-modal-hd">
        <div class="pl-modal-av" style="background:#009DDD">+</div>
        <div class="pl-modal-name">Nuevo Deal</div>
        <button class="pl-modal-close" onclick="this.closest('.pl-modal-ov').remove()">✕</button>
      </div>
      <div style="padding:16px 20px;display:flex;flex-direction:column;gap:10px">
        <div><label style="font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8;letter-spacing:.6px">Etapa</label>
          <select id="pl-nd-stage" style="width:100%;padding:8px;border:1px solid #e8edf2;border-radius:8px;font-family:inherit">
            ${stages.map(s=>`<option value="${s.id}" ${s.id==stageId?'selected':''}>${this.esc(s.name)}</option>`).join('')}
          </select></div>
        <div><label style="font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8;letter-spacing:.6px">Buscar contacto</label>
          <input id="pl-nd-search" style="width:100%;padding:8px;border:1px solid #e8edf2;border-radius:8px;font-family:inherit" placeholder="Nombre, DNI o teléfono..." oninput="PipelineModule.searchPersona(this.value)"></div>
        <div id="pl-nd-results" style="max-height:150px;overflow-y:auto"></div>
        <input type="hidden" id="pl-nd-persona">
        <div><label style="font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8;letter-spacing:.6px">Producto</label>
          <input id="pl-nd-prod" style="width:100%;padding:8px;border:1px solid #e8edf2;border-radius:8px;font-family:inherit" placeholder="Ej: Plena Plus"></div>
        <div><label style="font-size:10px;font-weight:700;text-transform:uppercase;color:#94a3b8;letter-spacing:.6px">Compañía</label>
          <input id="pl-nd-comp" style="width:100%;padding:8px;border:1px solid #e8edf2;border-radius:8px;font-family:inherit" value="${this.currentPipeline?.name||''}"></div>
        <button style="padding:10px;border-radius:8px;border:none;background:#009DDD;color:#fff;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit" onclick="PipelineModule.createDeal()">Crear Deal</button>
      </div>
    </div>`;
    document.body.appendChild(modal);
  },

  async searchPersona(q) {
    const el = document.getElementById('pl-nd-results');
    if (!el || q.length < 2) { if(el) el.innerHTML = ''; return; }
    try {
      const data = await API.get(`/personas?q=${encodeURIComponent(q)}&limit=5`);
      const items = data.personas || data.items || [];
      el.innerHTML = items.map(p => `<div style="padding:6px 8px;cursor:pointer;border-radius:6px;font-size:12px;display:flex;align-items:center;gap:8px;border-bottom:1px solid #f4f6f9" onclick="document.getElementById('pl-nd-persona').value='${p.id}';document.getElementById('pl-nd-search').value='${this.esc(p.nombre)}';document.getElementById('pl-nd-results').innerHTML=''">
        <div style="width:24px;height:24px;border-radius:50%;background:hsl(${this.hu(p.id)},55%,55%);color:#fff;font-size:8px;font-weight:700;display:flex;align-items:center;justify-content:center">${this.ini(p.nombre)}</div>
        <span style="font-weight:600">${this.esc(p.nombre)}</span>
        <span style="color:#94a3b8;font-size:10px">${p.telefono||p.email||''}</span>
      </div>`).join('') || '<div style="padding:8px;color:#94a3b8;font-size:12px">Sin resultados</div>';
    } catch(e) { el.innerHTML = ''; }
  },

  async createDeal() {
    const stageId = document.getElementById('pl-nd-stage')?.value;
    const personaId = document.getElementById('pl-nd-persona')?.value;
    const producto = document.getElementById('pl-nd-prod')?.value;
    const compania = document.getElementById('pl-nd-comp')?.value;
    if (!stageId) return alert('Selecciona una etapa');
    try {
      await API.post('/pipeline/deals', {
        pipeline_id: this.currentPipeline.id,
        stage_id: parseInt(stageId),
        persona_id: personaId ? parseInt(personaId) : null,
        producto: producto || null,
        compania: compania || null
      });
      document.querySelector('.pl-modal-ov')?.remove();
      this.loadBoard();
    } catch(e) { alert('Error: ' + e.message); }
  },

  // ══════════════════════════════════════
  // EDIT MODE
  // ══════════════════════════════════════
  toggleEdit() {
    this.editMode = !this.editMode;
    // Re-render completo para mostrar/ocultar toolbar de edición
    this.renderShell(document.getElementById('main-content'));
    if (this.currentPipeline) this.loadBoard();
  },

  addStagePrompt() {
    const name = prompt('Nombre de la nueva etapa:');
    if (!name) return;
    this.addStage(name);
  },

  async addStage(name) {
    try {
      await API.post(`/pipeline/${this.currentPipeline.id}/stages`, { name });
      this.loadBoard();
    } catch(e) { alert('Error: ' + e.message); }
  },

  async renameStage(stageId, name) {
    if (!name) return;
    try {
      await API.patch(`/pipeline/stages/${stageId}`, { name });
    } catch(e) { alert('Error: ' + e.message); }
  },

  async deleteStage(stageId) {
    if (!confirm('¿Eliminar esta etapa? Los deals deben estar vacíos.')) return;
    try {
      await API.delete(`/pipeline/stages/${stageId}`);
      this.loadBoard();
    } catch(e) { alert(e.message); }
  },
};
