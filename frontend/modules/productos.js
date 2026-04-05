// === Catalogo de Productos — Settings tab ===
// Arbol: Compania → Categoria → Producto
// Panel lateral para edicion + docs + agentes

const ProductosSettings = {
  companias: [],
  agentes: [],
  expanded: {},    // compania_id → true/false
  expandedCat: {}, // categoria_id → true/false
  selected: null,  // { type: 'producto'|'categoria'|'compania', id, data }

  esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; },

  async render(container) {
    container.innerHTML = '<p style="color:#94a3b8;">Cargando catalogo...</p>';

    try {
      const [compR, usersR] = await Promise.all([
        API.get('/companias'),
        API.get('/auth/users'),
      ]);
      this.companias = compR.companias || [];
      this.agentes = (usersR || []).filter(u => u.activo);

      // Cargar categorias y productos para cada compania
      for (const c of this.companias) {
        const catR = await API.get(`/companias/${c.id}/categorias`);
        c._categorias = catR.categorias || [];
        for (const cat of c._categorias) {
          const prodR = await API.get(`/categorias/${cat.id}/productos`);
          cat._productos = prodR.productos || [];
        }
      }

      this._renderTree(container);
    } catch (e) {
      container.innerHTML = `<p style="color:#ef4444;">${e.message}</p>`;
    }
  },

  // ══════════════════════════════════════════
  // ARBOL
  // ══════════════════════════════════════════

  _renderTree(container) {
    container.innerHTML = `
      <style>${this._getCSS()}</style>
      <div class="pt-layout">
        <div class="pt-tree" id="pt-tree">
          ${this.companias.map(c => this._renderCompania(c)).join('')}
          <button class="pt-add-root" onclick="ProductosSettings._addCompania()">+ Anadir compania</button>
        </div>
        <div class="pt-panel" id="pt-panel">
          <div class="pt-panel-empty">Selecciona un elemento del arbol</div>
        </div>
      </div>
    `;
  },

  _renderCompania(c) {
    const open = this.expanded[c.id];
    return `
      <div class="pt-node">
        <div class="pt-node-head pt-comp" onclick="ProductosSettings._toggleCompania(${c.id})" style="border-left:3px solid ${c.color || '#009DDD'};">
          <span class="pt-arrow">${open ? '▾' : '▸'}</span>
          <span class="pt-node-color" style="background:${c.color || '#009DDD'};"></span>
          <span class="pt-node-name">${this.esc(c.nombre)}</span>
          <span class="pt-node-count">${c.num_productos || 0} prod.</span>
          <button class="pt-node-btn" onclick="event.stopPropagation();ProductosSettings._selectCompania(${c.id})" title="Editar">
            ${Icons.editar(12, '#94a3b8')}
          </button>
        </div>
        ${open ? `
          <div class="pt-children">
            ${(c._categorias || []).map(cat => this._renderCategoria(cat, c)).join('')}
            <button class="pt-add-child" onclick="ProductosSettings._addCategoria(${c.id})">+ Anadir categoria</button>
          </div>
        ` : ''}
      </div>
    `;
  },

  _renderCategoria(cat, comp) {
    const open = this.expandedCat[cat.id];
    return `
      <div class="pt-node">
        <div class="pt-node-head pt-cat" onclick="ProductosSettings._toggleCategoria(${cat.id}, ${comp.id})">
          <span class="pt-arrow">${open ? '▾' : '▸'}</span>
          <span class="pt-node-name">${this.esc(cat.nombre)}</span>
          <span class="pt-node-count">${cat.num_productos || (cat._productos||[]).length} prod.</span>
          <button class="pt-node-btn" onclick="event.stopPropagation();ProductosSettings._selectCategoria(${cat.id}, ${comp.id})" title="Editar">
            ${Icons.editar(12, '#94a3b8')}
          </button>
        </div>
        ${open ? `
          <div class="pt-children">
            ${(cat._productos || []).map(p => this._renderProducto(p)).join('')}
            <button class="pt-add-child" onclick="ProductosSettings._addProducto(${comp.id}, ${cat.id})">+ Anadir producto</button>
          </div>
        ` : ''}
      </div>
    `;
  },

  _renderProducto(p) {
    const sel = this.selected?.type === 'producto' && this.selected.id === p.id;
    return `
      <div class="pt-node-head pt-prod ${sel ? 'pt-selected' : ''}" onclick="ProductosSettings._selectProducto(${p.id})">
        <span class="pt-prod-dot"></span>
        <span class="pt-node-name">${this.esc(p.nombre)}</span>
        ${p.precio_base ? `<span class="pt-node-price">${p.precio_base}€</span>` : ''}
        ${p.comision_valor ? `<span class="pt-node-comm">${p.comision_valor}${p.comision_tipo === 'porcentaje' ? '%' : '€'}</span>` : ''}
        ${p.puntos_base ? `<span class="pt-node-pts">${p.puntos_base} pts</span>` : ''}
      </div>
    `;
  },

  // ══════════════════════════════════════════
  // TOGGLE
  // ══════════════════════════════════════════

  _toggleCompania(id) {
    this.expanded[id] = !this.expanded[id];
    this._refreshTree();
  },

  _toggleCategoria(catId, compId) {
    this.expandedCat[catId] = !this.expandedCat[catId];
    if (!this.expanded[compId]) this.expanded[compId] = true;
    this._refreshTree();
  },

  _refreshTree() {
    const tree = document.getElementById('pt-tree');
    if (!tree) return;
    tree.innerHTML = `
      ${this.companias.map(c => this._renderCompania(c)).join('')}
      <button class="pt-add-root" onclick="ProductosSettings._addCompania()">+ Anadir compania</button>
    `;
  },

  // ══════════════════════════════════════════
  // SELECCION → PANEL LATERAL
  // ══════════════════════════════════════════

  async _selectProducto(id) {
    const panel = document.getElementById('pt-panel');
    if (!panel) return;
    panel.innerHTML = '<p style="color:#94a3b8;padding:20px;">Cargando...</p>';

    // Buscar en datos locales
    let prod = null;
    for (const c of this.companias) {
      for (const cat of c._categorias || []) {
        const found = (cat._productos || []).find(p => p.id === id);
        if (found) { prod = found; prod._compania = c; prod._categoria = cat; break; }
      }
      if (prod) break;
    }
    if (!prod) { panel.innerHTML = '<p style="color:#ef4444;padding:20px;">No encontrado</p>'; return; }

    this.selected = { type: 'producto', id, data: prod };
    this._refreshTree();

    // Cargar documentos
    let docs = { propios: [], heredados: [] };
    try { docs = await API.get(`/productos/${id}/documentos`); } catch {}

    panel.innerHTML = `
      <div class="pt-panel-head">
        <div class="pt-panel-title">${this.esc(prod.nombre)}</div>
        <div class="pt-panel-sub">${this.esc(prod._compania?.nombre || '')} → ${this.esc(prod._categoria?.nombre || '')}</div>
      </div>
      <div class="pt-panel-body">
        <div class="pt-field">
          <label class="pt-label">Nombre</label>
          <input class="pt-input" id="pt-ed-nombre" value="${this.esc(prod.nombre)}">
        </div>
        <div class="pt-field">
          <label class="pt-label">Descripcion</label>
          <textarea class="pt-input" id="pt-ed-desc" rows="2">${this.esc(prod.descripcion || '')}</textarea>
        </div>
        <div class="pt-field">
          <label class="pt-label">Resumen coberturas (lo lee la IA)</label>
          <textarea class="pt-input" id="pt-ed-coberturas" rows="3" placeholder="Cobertura hospitalaria, dental incluido, urgencias 24h...">${this.esc(prod.resumen_coberturas || '')}</textarea>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
          <div class="pt-field">
            <label class="pt-label">Precio base</label>
            <input class="pt-input" id="pt-ed-precio" type="number" step="0.01" value="${prod.precio_base || ''}">
          </div>
          <div class="pt-field">
            <label class="pt-label">Comision (${prod.comision_tipo === 'porcentaje' ? '%' : '€'})</label>
            <input class="pt-input" id="pt-ed-comision" type="number" step="0.01" value="${prod.comision_valor || ''}">
          </div>
          <div class="pt-field">
            <label class="pt-label">Puntos base</label>
            <input class="pt-input" id="pt-ed-puntos" type="number" value="${prod.puntos_base || 0}">
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-top:8px;">
          <select class="pt-input" id="pt-ed-comision-tipo" style="width:auto;">
            <option value="porcentaje" ${prod.comision_tipo === 'porcentaje' ? 'selected' : ''}>% porcentaje</option>
            <option value="fijo" ${prod.comision_tipo === 'fijo' ? 'selected' : ''}>€ fijo</option>
          </select>
          <button class="pt-btn-primary" onclick="ProductosSettings._saveProducto(${id})">Guardar cambios</button>
        </div>

        <div class="pt-section-title">Documentos del producto</div>
        ${(docs.propios || []).map(d => `
          <div class="pt-doc-item">
            <a href="${this.esc(d.archivo_url)}" target="_blank" class="pt-doc-link">${Icons.descargar(14, '#009DDD')} ${this.esc(d.nombre)}</a>
            <span class="pt-doc-tipo">${d.tipo || ''}</span>
            <button class="pt-doc-del" onclick="ProductosSettings._deleteDoc('producto',${d.id},${id})" title="Eliminar">&times;</button>
          </div>
        `).join('') || '<div class="pt-empty-docs">Sin documentos propios</div>'}
        <form class="pt-upload-form" onsubmit="ProductosSettings._uploadDoc(event,'producto',${id})">
          <input type="file" name="archivo" required>
          <input type="text" name="nombre" class="pt-input" placeholder="Nombre del documento" style="margin-top:4px;">
          <select name="tipo" class="pt-input" style="margin-top:4px;">
            <option value="condiciones_particulares">Condiciones particulares</option>
            <option value="tarifa">Tarifa</option>
            <option value="otro">Otro</option>
          </select>
          <button type="submit" class="pt-btn-sm" style="margin-top:4px;">Subir documento</button>
        </form>

        ${(docs.heredados || []).length ? `
          <div class="pt-section-title">Documentos de categoria (heredados)</div>
          ${docs.heredados.map(d => `
            <div class="pt-doc-item pt-doc-inherited">
              <a href="${this.esc(d.archivo_url)}" target="_blank" class="pt-doc-link">${Icons.descargar(14, '#94a3b8')} ${this.esc(d.nombre)}</a>
              <span class="pt-doc-tipo">${d.tipo || ''}</span>
            </div>
          `).join('')}
        ` : ''}
      </div>
    `;
  },

  async _selectCategoria(catId, compId) {
    const panel = document.getElementById('pt-panel');
    if (!panel) return;

    const comp = this.companias.find(c => c.id === compId);
    const cat = (comp?._categorias || []).find(c => c.id === catId);
    if (!cat) return;

    this.selected = { type: 'categoria', id: catId, data: cat };

    // Cargar docs de categoria
    let catDocs = [];
    try {
      const r = await pool?.query ? [] : await API.get(`/productos/0/documentos`); // placeholder
    } catch {}
    // Obtener docs directamente
    try {
      const prodsR = await API.get(`/categorias/${catId}/productos`);
      // Para docs de categoria, usamos el primer producto como proxy
      if (prodsR.productos?.length) {
        const docsR = await API.get(`/productos/${prodsR.productos[0].id}/documentos`);
        catDocs = docsR.heredados || [];
      }
    } catch {}

    panel.innerHTML = `
      <div class="pt-panel-head">
        <div class="pt-panel-title">${this.esc(cat.nombre)}</div>
        <div class="pt-panel-sub">${this.esc(comp?.nombre || '')} → Categoria</div>
      </div>
      <div class="pt-panel-body">
        <div class="pt-field">
          <label class="pt-label">Nombre</label>
          <input class="pt-input" id="pt-ed-cat-nombre" value="${this.esc(cat.nombre)}">
        </div>
        <div class="pt-field">
          <label class="pt-label">Descripcion</label>
          <textarea class="pt-input" id="pt-ed-cat-desc" rows="2">${this.esc(cat.descripcion || '')}</textarea>
        </div>
        <button class="pt-btn-primary" onclick="ProductosSettings._saveCategoria(${catId})">Guardar</button>

        <div class="pt-section-title">Documentos de categoria (aplican a todos los productos)</div>
        ${catDocs.map(d => `
          <div class="pt-doc-item">
            <a href="${this.esc(d.archivo_url)}" target="_blank" class="pt-doc-link">${Icons.descargar(14, '#009DDD')} ${this.esc(d.nombre)}</a>
            <span class="pt-doc-tipo">${d.tipo || ''}</span>
            <button class="pt-doc-del" onclick="ProductosSettings._deleteDoc('categoria',${d.id})" title="Eliminar">&times;</button>
          </div>
        `).join('') || '<div class="pt-empty-docs">Sin documentos</div>'}
        <form class="pt-upload-form" onsubmit="ProductosSettings._uploadDoc(event,'categoria',${catId})">
          <input type="file" name="archivo" required>
          <input type="text" name="nombre" class="pt-input" placeholder="Nombre" style="margin-top:4px;">
          <select name="tipo" class="pt-input" style="margin-top:4px;">
            <option value="condiciones_generales">Condiciones generales</option>
            <option value="tarifa">Tarifa</option>
            <option value="campana">Campana</option>
            <option value="otro">Otro</option>
          </select>
          <button type="submit" class="pt-btn-sm" style="margin-top:4px;">Subir documento</button>
        </form>
      </div>
    `;
  },

  async _selectCompania(compId) {
    const panel = document.getElementById('pt-panel');
    if (!panel) return;

    const comp = this.companias.find(c => c.id === compId);
    if (!comp) return;
    this.selected = { type: 'compania', id: compId, data: comp };

    // Cargar agentes asignados
    let agentesAsignados = [];
    try {
      const r = await API.get(`/companias/${compId}/agentes`);
      agentesAsignados = r.agentes || [];
    } catch {}
    const asignadosSet = new Set(agentesAsignados.map(a => a.user_id));

    panel.innerHTML = `
      <div class="pt-panel-head">
        <div class="pt-panel-title">${this.esc(comp.nombre)}</div>
        <div class="pt-panel-sub">Compania aseguradora</div>
      </div>
      <div class="pt-panel-body">
        <div class="pt-field">
          <label class="pt-label">Nombre</label>
          <input class="pt-input" id="pt-ed-comp-nombre" value="${this.esc(comp.nombre)}">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <div class="pt-field">
            <label class="pt-label">Nombre corto</label>
            <input class="pt-input" id="pt-ed-comp-corto" value="${this.esc(comp.nombre_corto || '')}">
          </div>
          <div class="pt-field">
            <label class="pt-label">Color</label>
            <input class="pt-input" id="pt-ed-comp-color" type="color" value="${comp.color || '#009DDD'}">
          </div>
        </div>
        <button class="pt-btn-primary" onclick="ProductosSettings._saveCompania(${compId})">Guardar</button>

        <div class="pt-section-title">Agentes asignados</div>
        <div class="pt-agentes-list">
          ${this.agentes.map(a => `
            <label class="pt-agent-row">
              <input type="checkbox" class="pt-agent-cb" data-user-id="${a.id}" data-comp-id="${compId}"
                ${asignadosSet.has(a.id) ? 'checked' : ''}
                onchange="ProductosSettings._toggleAgente(${compId}, ${a.id}, this.checked)">
              <span class="pt-agent-name">${this.esc(a.nombre)}</span>
              <span class="pt-agent-role">${a.rol}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `;
  },

  // ══════════════════════════════════════════
  // CREAR
  // ══════════════════════════════════════════

  async _addCompania() {
    const nombre = prompt('Nombre de la compania:');
    if (!nombre) return;
    await API.post('/companias', { nombre });
    await this.render(document.getElementById('settings-content'));
  },

  async _addCategoria(companiaId) {
    const nombre = prompt('Nombre de la categoria:');
    if (!nombre) return;
    await API.post(`/companias/${companiaId}/categorias`, { nombre });
    this.expanded[companiaId] = true;
    await this.render(document.getElementById('settings-content'));
  },

  async _addProducto(companiaId, categoriaId) {
    const nombre = prompt('Nombre del producto:');
    if (!nombre) return;
    await API.post('/productos', { compania_id: companiaId, categoria_id: categoriaId, nombre });
    this.expanded[companiaId] = true;
    this.expandedCat[categoriaId] = true;
    await this.render(document.getElementById('settings-content'));
  },

  // ══════════════════════════════════════════
  // GUARDAR
  // ══════════════════════════════════════════

  async _saveProducto(id) {
    await API.put(`/productos/${id}`, {
      nombre: document.getElementById('pt-ed-nombre')?.value,
      descripcion: document.getElementById('pt-ed-desc')?.value || null,
      resumen_coberturas: document.getElementById('pt-ed-coberturas')?.value || null,
      precio_base: parseFloat(document.getElementById('pt-ed-precio')?.value) || null,
      comision_valor: parseFloat(document.getElementById('pt-ed-comision')?.value) || null,
      comision_tipo: document.getElementById('pt-ed-comision-tipo')?.value,
      puntos_base: parseInt(document.getElementById('pt-ed-puntos')?.value) || 0,
    });
    await this.render(document.getElementById('settings-content'));
  },

  async _saveCategoria(id) {
    await API.put(`/categorias/${id}`, {
      nombre: document.getElementById('pt-ed-cat-nombre')?.value,
      descripcion: document.getElementById('pt-ed-cat-desc')?.value || null,
    });
    await this.render(document.getElementById('settings-content'));
  },

  async _saveCompania(id) {
    await API.put(`/companias/${id}`, {
      nombre: document.getElementById('pt-ed-comp-nombre')?.value,
      nombre_corto: document.getElementById('pt-ed-comp-corto')?.value || null,
      color: document.getElementById('pt-ed-comp-color')?.value,
    });
    await this.render(document.getElementById('settings-content'));
  },

  // ══════════════════════════════════════════
  // AGENTES
  // ══════════════════════════════════════════

  async _toggleAgente(companiaId, userId, checked) {
    if (checked) {
      await API.post(`/companias/${companiaId}/agentes`, { user_id: userId });
    } else {
      await API.delete(`/companias/${companiaId}/agentes/${userId}`);
    }
  },

  // ══════════════════════════════════════════
  // DOCUMENTOS
  // ══════════════════════════════════════════

  async _uploadDoc(event, tipo, entityId) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    const url = tipo === 'categoria'
      ? `/categorias/${entityId}/documentos`
      : `/productos/${entityId}/documentos`;

    const token = Auth.getToken();
    const res = await fetch('/api' + url, {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token },
      body: formData,
    });
    if (!res.ok) { const e = await res.json(); alert(e.error); return; }

    // Re-render panel
    if (tipo === 'producto') this._selectProducto(entityId);
    else if (this.selected) this._selectCategoria(this.selected.id, this.selected.data?.compania_id);
  },

  async _deleteDoc(tipo, docId, entityId) {
    if (!confirm('Eliminar documento?')) return;
    await API.delete(`/documentos/${tipo}/${docId}`);
    if (entityId) this._selectProducto(entityId);
  },

  // ══════════════════════════════════════════
  // CSS
  // ══════════════════════════════════════════

  _getCSS() {
    return `
      .pt-layout{display:flex;gap:16px;min-height:400px;}
      .pt-tree{flex:1;min-width:0;}
      .pt-panel{width:380px;flex-shrink:0;background:#f8fafc;border:1px solid #e8edf2;border-radius:12px;overflow:hidden;}

      .pt-node{margin-bottom:2px;}
      .pt-node-head{display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;cursor:pointer;transition:background .1s;font-size:13px;}
      .pt-node-head:hover{background:#f4f6f9;}
      .pt-selected{background:#e6f6fd!important;}
      .pt-arrow{width:14px;font-size:10px;color:#94a3b8;flex-shrink:0;text-align:center;}
      .pt-node-color{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
      .pt-node-name{font-weight:600;color:#0f172a;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
      .pt-node-count{font-size:11px;color:#94a3b8;flex-shrink:0;}
      .pt-node-price{font-size:11px;font-weight:700;color:#009DDD;flex-shrink:0;}
      .pt-node-comm{font-size:10px;color:#10b981;flex-shrink:0;}
      .pt-node-pts{font-size:10px;color:#f59e0b;flex-shrink:0;}
      .pt-node-btn{background:none;border:none;cursor:pointer;padding:2px 4px;border-radius:4px;opacity:.5;transition:opacity .15s;}
      .pt-node-btn:hover{opacity:1;background:#e8edf2;}

      .pt-comp{font-weight:700;}
      .pt-cat{padding-left:28px;}
      .pt-prod{padding-left:48px;}
      .pt-prod-dot{width:6px;height:6px;border-radius:50%;background:#d1d9e0;flex-shrink:0;}
      .pt-children{margin-left:0;}

      .pt-add-root,.pt-add-child{display:block;width:100%;padding:8px 12px;border:1px dashed #d1d9e0;border-radius:8px;background:none;color:#94a3b8;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;margin-top:4px;text-align:left;}
      .pt-add-root:hover,.pt-add-child:hover{border-color:#009DDD;color:#009DDD;background:#f0f9ff;}
      .pt-add-child{margin-left:28px;width:calc(100% - 28px);}

      /* Panel */
      .pt-panel-empty{padding:40px;text-align:center;color:#94a3b8;font-size:13px;}
      .pt-panel-head{padding:16px;border-bottom:1px solid #e8edf2;}
      .pt-panel-title{font-size:15px;font-weight:700;color:#0f172a;}
      .pt-panel-sub{font-size:11px;color:#94a3b8;margin-top:2px;}
      .pt-panel-body{padding:16px;overflow-y:auto;max-height:calc(100vh - 300px);}
      .pt-field{margin-bottom:10px;}
      .pt-label{font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.3px;display:block;margin-bottom:3px;}
      .pt-input{width:100%;padding:7px 10px;border:1px solid #e8edf2;border-radius:8px;font-size:13px;font-family:inherit;color:#0f172a;box-sizing:border-box;}
      .pt-input:focus{outline:none;border-color:#009DDD;box-shadow:0 0 0 3px rgba(0,157,221,.1);}
      .pt-btn-primary{padding:7px 16px;border-radius:8px;border:none;background:#009DDD;color:#fff;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;}
      .pt-btn-primary:hover{background:#0088c2;}
      .pt-btn-sm{padding:5px 12px;border-radius:6px;border:1px solid #e8edf2;background:#fff;color:#475569;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;}

      /* Docs */
      .pt-section-title{font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;margin:16px 0 8px;padding-top:12px;border-top:1px solid #e8edf2;}
      .pt-doc-item{display:flex;align-items:center;gap:6px;padding:6px 0;border-bottom:1px solid #f0f2f5;font-size:12px;}
      .pt-doc-inherited{opacity:.6;}
      .pt-doc-link{color:#009DDD;text-decoration:none;font-weight:600;display:flex;align-items:center;gap:4px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
      .pt-doc-link:hover{text-decoration:underline;}
      .pt-doc-tipo{font-size:10px;color:#94a3b8;flex-shrink:0;}
      .pt-doc-del{background:none;border:none;color:#ef4444;cursor:pointer;font-size:16px;padding:0 4px;opacity:.5;}
      .pt-doc-del:hover{opacity:1;}
      .pt-empty-docs{font-size:12px;color:#94a3b8;padding:4px 0;}
      .pt-upload-form{margin-top:8px;padding:10px;background:#f4f6f9;border-radius:8px;}
      .pt-upload-form input[type=file]{font-size:12px;font-family:inherit;}

      /* Agentes */
      .pt-agentes-list{display:flex;flex-direction:column;gap:2px;}
      .pt-agent-row{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:6px;cursor:pointer;font-size:12px;}
      .pt-agent-row:hover{background:#f4f6f9;}
      .pt-agent-name{font-weight:600;color:#0f172a;flex:1;}
      .pt-agent-role{font-size:10px;color:#94a3b8;}

      @media(max-width:768px){
        .pt-layout{flex-direction:column;}
        .pt-panel{width:100%;}
      }
    `;
  },
};
