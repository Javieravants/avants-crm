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
        ${p.precio_base && (!p.precio_tipo || p.precio_tipo === 'fijo') ? `<span class="pt-node-price">${p.precio_base}€</span>` : ''}
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
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px;">
            <label class="pt-label" style="margin-bottom:0;">Resumen coberturas (lo lee la IA)</label>
            <button class="pt-btn-ia" onclick="ProductosSettings._generarResumen(${prod.id})" id="pt-btn-generar-ia" title="Generar resumen a partir del PDF subido">
              ${Icons.settings(12, '#7c3aed')} Generar con IA
            </button>
          </div>
          <textarea class="pt-input" id="pt-ed-coberturas" rows="3" placeholder="Cobertura hospitalaria, dental incluido, urgencias 24h...">${this.esc(prod.resumen_coberturas || '')}</textarea>
          ${prod.resumen_coberturas ? '<div style="font-size:10px;color:#7c3aed;margin-top:2px;" id="pt-ia-badge">Generado por IA — editable manualmente</div>' : ''}
        </div>
        <div class="pt-field">
          <label class="pt-label">Precio</label>
          <div style="display:flex;gap:6px;align-items:center;">
            <select class="pt-input" id="pt-ed-precio-tipo" style="width:auto;" onchange="ProductosSettings._togglePrecio()">
              <option value="fijo" ${(prod.precio_tipo || 'fijo') === 'fijo' ? 'selected' : ''}>Precio fijo</option>
              <option value="tabla" ${prod.precio_tipo === 'tabla' ? 'selected' : ''}>Tabla de precios</option>
              <option value="calculadora" ${prod.precio_tipo === 'calculadora' ? 'selected' : ''}>Calculadora CRM</option>
              <option value="externo" ${prod.precio_tipo === 'externo' ? 'selected' : ''}>Externo</option>
            </select>
            <input class="pt-input" id="pt-ed-precio" type="number" step="0.01" value="${prod.precio_base || ''}" placeholder="€/mes" style="width:100px;${(prod.precio_tipo && prod.precio_tipo !== 'fijo') ? 'display:none;' : ''}">
            <span id="pt-precio-info" style="font-size:11px;color:#94a3b8;${(!prod.precio_tipo || prod.precio_tipo === 'fijo') ? 'display:none;' : ''}">${
              prod.precio_tipo === 'tabla' ? 'Ver tabla de precios en documentos' :
              prod.precio_tipo === 'calculadora' ? 'Calculado por la calculadora del CRM' :
              prod.precio_tipo === 'externo' ? 'Precio calculado externamente' : ''
            }</span>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <div class="pt-field">
            <label class="pt-label">Comision</label>
            <div style="display:flex;gap:4px;">
              <input class="pt-input" id="pt-ed-comision" type="number" step="0.01" value="${prod.comision_valor || ''}" style="flex:1;">
              <select class="pt-input" id="pt-ed-comision-tipo" style="width:auto;" title="Tipo de comision">
                <option value="porcentaje" ${prod.comision_tipo === 'porcentaje' ? 'selected' : ''}>%</option>
                <option value="fijo" ${prod.comision_tipo === 'fijo' ? 'selected' : ''}>€</option>
              </select>
            </div>
          </div>
          <div class="pt-field">
            <label class="pt-label">Puntos base</label>
            <input class="pt-input" id="pt-ed-puntos" type="number" value="${prod.puntos_base || 0}">
          </div>
        </div>
        <div style="margin-top:8px;">
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

    // Cargar agentes y rapeles en paralelo
    let agentesAsignados = [], rapeles = [];
    try {
      const [agR, rapR] = await Promise.all([
        API.get(`/companias/${compId}/agentes`),
        API.get(`/companias/${compId}/rapeles`),
      ]);
      agentesAsignados = agR.agentes || [];
      rapeles = rapR.rapeles || [];
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

        <div class="pt-section-title">Rapeles</div>
        ${rapeles.map(r => {
          const tramos = r.tramos || [];
          return `<div class="pt-rapel-item" onclick="ProductosSettings._editRapel(${r.id}, ${compId})">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:13px;font-weight:600;color:#0f172a;flex:1;">${this.esc(r.nombre)}</span>
              <span style="font-size:10px;padding:2px 6px;border-radius:4px;background:#e6f6fd;color:#009DDD;font-weight:600;">${r.periodicidad}</span>
              <span style="font-size:10px;color:#94a3b8;">${r.tipo}</span>
            </div>
            ${tramos.length ? `<div style="font-size:11px;color:#475569;margin-top:4px;">${tramos.map(t => `${t.desde || 0}-${t.hasta || '∞'}€ → ${t.porcentaje}%`).join(' · ')}</div>` : ''}
            ${r.fecha_inicio ? `<div style="font-size:10px;color:#94a3b8;margin-top:2px;">${new Date(r.fecha_inicio).toLocaleDateString('es-ES')}${r.fecha_fin ? ' — ' + new Date(r.fecha_fin).toLocaleDateString('es-ES') : ''}</div>` : ''}
          </div>`;
        }).join('') || '<div class="pt-empty-docs">Sin rapeles configurados</div>'}
        <button class="pt-add-child" onclick="ProductosSettings._addRapel(${compId})" style="margin-left:0;width:100%;">+ Anadir rapel</button>
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

  _togglePrecio() {
    const tipo = document.getElementById('pt-ed-precio-tipo')?.value;
    const input = document.getElementById('pt-ed-precio');
    const info = document.getElementById('pt-precio-info');
    if (!input || !info) return;
    const infoTexts = { tabla: 'Ver tabla de precios en documentos', calculadora: 'Calculado por la calculadora del CRM', externo: 'Precio calculado externamente' };
    if (tipo === 'fijo') {
      input.style.display = ''; info.style.display = 'none';
    } else {
      input.style.display = 'none'; info.style.display = '';
      info.textContent = infoTexts[tipo] || '';
    }
  },

  async _generarResumen(prodId) {
    const btn = document.getElementById('pt-btn-generar-ia');
    if (btn) { btn.disabled = true; btn.textContent = 'Generando...'; }
    try {
      const r = await API.post(`/productos/${prodId}/generar-resumen`, {});
      const textarea = document.getElementById('pt-ed-coberturas');
      if (textarea) textarea.value = r.resumen;
      // Mostrar badge
      let badge = document.getElementById('pt-ia-badge');
      if (!badge) {
        badge = document.createElement('div');
        badge.id = 'pt-ia-badge';
        badge.style.cssText = 'font-size:10px;color:#7c3aed;margin-top:2px;';
        textarea?.parentElement?.appendChild(badge);
      }
      badge.textContent = 'Generado por IA — editable manualmente';
    } catch (e) {
      alert(e.message || 'Error al generar resumen');
    }
    if (btn) { btn.disabled = false; btn.innerHTML = `${Icons.settings(12, '#7c3aed')} Generar con IA`; }
  },

  async _saveProducto(id) {
    const precioTipo = document.getElementById('pt-ed-precio-tipo')?.value || 'fijo';
    await API.put(`/productos/${id}`, {
      nombre: document.getElementById('pt-ed-nombre')?.value,
      descripcion: document.getElementById('pt-ed-desc')?.value || null,
      resumen_coberturas: document.getElementById('pt-ed-coberturas')?.value || null,
      precio_tipo: precioTipo,
      precio_base: precioTipo === 'fijo' ? (parseFloat(document.getElementById('pt-ed-precio')?.value) || null) : null,
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
  // RAPELES
  // ══════════════════════════════════════════

  _addRapel(compId) {
    this._showRapelModal(null, compId);
  },

  async _editRapel(rapelId, compId) {
    // Buscar en los datos cargados o hacer fetch
    let rapeles = [];
    try { const r = await API.get(`/companias/${compId}/rapeles`); rapeles = r.rapeles || []; } catch {}
    const rapel = rapeles.find(r => r.id === rapelId);
    this._showRapelModal(rapel, compId);
  },

  _showRapelModal(rapel, compId) {
    const isEdit = !!rapel;
    const tramos = (rapel?.tramos || []).length ? rapel.tramos : [{ desde: 0, hasta: 10000, porcentaje: 2 }];

    // Crear overlay
    let overlay = document.getElementById('pt-rapel-overlay');
    if (overlay) overlay.remove();
    overlay = document.createElement('div');
    overlay.id = 'pt-rapel-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,.5);z-index:900;display:flex;align-items:center;justify-content:center;padding:20px;';
    overlay.innerHTML = `
      <div style="background:#fff;border-radius:12px;width:480px;max-width:100%;max-height:80vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.2);">
        <div style="padding:16px 20px;border-bottom:1px solid #e8edf2;display:flex;align-items:center;justify-content:space-between;">
          <span style="font-size:15px;font-weight:700;color:#0f172a;">${isEdit ? 'Editar' : 'Nuevo'} rapel</span>
          <button onclick="document.getElementById('pt-rapel-overlay').remove()" style="background:none;border:none;font-size:20px;color:#94a3b8;cursor:pointer;">&times;</button>
        </div>
        <div style="padding:20px;">
          <div class="pt-field">
            <label class="pt-label">Nombre</label>
            <input class="pt-input" id="pt-rap-nombre" value="${this.esc(rapel?.nombre || '')}">
          </div>
          <div class="pt-field">
            <label class="pt-label">Descripcion</label>
            <textarea class="pt-input" id="pt-rap-desc" rows="2">${this.esc(rapel?.descripcion || '')}</textarea>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <div class="pt-field">
              <label class="pt-label">Tipo</label>
              <select class="pt-input" id="pt-rap-tipo">
                <option value="produccion" ${rapel?.tipo === 'produccion' ? 'selected' : ''}>Produccion</option>
                <option value="cartera" ${rapel?.tipo === 'cartera' ? 'selected' : ''}>Cartera</option>
                <option value="calidad" ${rapel?.tipo === 'calidad' ? 'selected' : ''}>Calidad</option>
              </select>
            </div>
            <div class="pt-field">
              <label class="pt-label">Periodicidad</label>
              <select class="pt-input" id="pt-rap-periodo">
                <option value="mensual" ${rapel?.periodicidad === 'mensual' ? 'selected' : ''}>Mensual</option>
                <option value="trimestral" ${rapel?.periodicidad === 'trimestral' ? 'selected' : ''}>Trimestral</option>
                <option value="semestral" ${rapel?.periodicidad === 'semestral' ? 'selected' : ''}>Semestral</option>
                <option value="anual" ${rapel?.periodicidad === 'anual' ? 'selected' : ''}>Anual</option>
              </select>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <div class="pt-field">
              <label class="pt-label">Fecha inicio</label>
              <input class="pt-input" id="pt-rap-inicio" type="date" value="${rapel?.fecha_inicio ? rapel.fecha_inicio.substring(0, 10) : ''}">
            </div>
            <div class="pt-field">
              <label class="pt-label">Fecha fin</label>
              <input class="pt-input" id="pt-rap-fin" type="date" value="${rapel?.fecha_fin ? rapel.fecha_fin.substring(0, 10) : ''}">
            </div>
          </div>

          <div class="pt-section-title">Tramos</div>
          <table style="width:100%;font-size:12px;border-collapse:collapse;" id="pt-rap-tramos">
            <thead>
              <tr style="color:#94a3b8;font-weight:700;text-transform:uppercase;font-size:10px;letter-spacing:.3px;">
                <td style="padding:4px 6px;">Desde</td>
                <td style="padding:4px 6px;">Hasta</td>
                <td style="padding:4px 6px;">%</td>
                <td style="width:30px;"></td>
              </tr>
            </thead>
            <tbody>
              ${tramos.map((t, i) => `
                <tr class="pt-tramo-row">
                  <td style="padding:3px 2px;"><input type="number" class="pt-input pt-tramo-desde" value="${t.desde || 0}" style="padding:5px 6px;font-size:12px;"></td>
                  <td style="padding:3px 2px;"><input type="number" class="pt-tramo-hasta pt-input" value="${t.hasta || ''}" placeholder="∞" style="padding:5px 6px;font-size:12px;"></td>
                  <td style="padding:3px 2px;"><input type="number" step="0.1" class="pt-tramo-pct pt-input" value="${t.porcentaje || 0}" style="padding:5px 6px;font-size:12px;"></td>
                  <td><button onclick="this.closest('tr').remove()" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:14px;">&times;</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <button onclick="ProductosSettings._addTramoRow()" class="pt-btn-sm" style="margin-top:6px;">+ Anadir tramo</button>

          <div style="display:flex;gap:8px;margin-top:16px;justify-content:flex-end;">
            <button onclick="document.getElementById('pt-rapel-overlay').remove()" class="pt-btn-sm">Cancelar</button>
            <button class="pt-btn-primary" onclick="ProductosSettings._saveRapel(${rapel?.id || 'null'}, ${compId})">Guardar</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  },

  _addTramoRow() {
    const tbody = document.querySelector('#pt-rap-tramos tbody');
    if (!tbody) return;
    const tr = document.createElement('tr');
    tr.className = 'pt-tramo-row';
    tr.innerHTML = `
      <td style="padding:3px 2px;"><input type="number" class="pt-input pt-tramo-desde" value="0" style="padding:5px 6px;font-size:12px;"></td>
      <td style="padding:3px 2px;"><input type="number" class="pt-tramo-hasta pt-input" placeholder="∞" style="padding:5px 6px;font-size:12px;"></td>
      <td style="padding:3px 2px;"><input type="number" step="0.1" class="pt-tramo-pct pt-input" value="0" style="padding:5px 6px;font-size:12px;"></td>
      <td><button onclick="this.closest('tr').remove()" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:14px;">&times;</button></td>
    `;
    tbody.appendChild(tr);
  },

  async _saveRapel(rapelId, compId) {
    // Leer tramos de la tabla
    const tramos = [];
    document.querySelectorAll('.pt-tramo-row').forEach(row => {
      tramos.push({
        desde: parseFloat(row.querySelector('.pt-tramo-desde')?.value) || 0,
        hasta: row.querySelector('.pt-tramo-hasta')?.value ? parseFloat(row.querySelector('.pt-tramo-hasta').value) : null,
        porcentaje: parseFloat(row.querySelector('.pt-tramo-pct')?.value) || 0,
      });
    });

    const data = {
      nombre: document.getElementById('pt-rap-nombre')?.value,
      descripcion: document.getElementById('pt-rap-desc')?.value || null,
      tipo: document.getElementById('pt-rap-tipo')?.value,
      periodicidad: document.getElementById('pt-rap-periodo')?.value,
      fecha_inicio: document.getElementById('pt-rap-inicio')?.value || null,
      fecha_fin: document.getElementById('pt-rap-fin')?.value || null,
      tramos,
    };

    if (rapelId) {
      await API.put(`/rapeles/${rapelId}`, data);
    } else {
      await API.post(`/companias/${compId}/rapeles`, data);
    }

    document.getElementById('pt-rapel-overlay')?.remove();
    this._selectCompania(compId); // refresh panel
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
      .pt-rapel-item{padding:8px 10px;border:1px solid #e8edf2;border-radius:8px;margin-bottom:6px;cursor:pointer;transition:background .1s;}
      .pt-rapel-item:hover{background:#f4f6f9;}
      .pt-btn-ia{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:6px;border:1px solid #c4b5fd;background:#f5f3ff;color:#7c3aed;font-size:10px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;}
      .pt-btn-ia:hover{background:#ede9fe;border-color:#7c3aed;}
      .pt-btn-ia:disabled{opacity:.5;cursor:wait;}

      @media(max-width:768px){
        .pt-layout{flex-direction:column;}
        .pt-panel{width:100%;}
      }
    `;
  },
};
