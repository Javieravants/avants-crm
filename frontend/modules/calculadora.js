// === Módulo Calculadora ADESLAS — Nativo CRM ===
// Usa funciones globales de tarifas.js (cargado antes)
// Lógica portada exacta de ~/Proyectos/Avants/calculadora/

const CalculadoraModule = {
  // Estado
  asegurados: [{ id: 1, nombre: '', fechaNac: '', sexo: '', dni: '', dniTutor: '' }],
  nextId: 2,
  provincia: 'Madrid',
  producto: '',
  dental: '',
  dtoOpcional: 0,
  dtoDentalMax: 0,
  clienteYaAsegurado: false,
  tomadorEsAsegurado: true,
  personaId: null,
  dealId: null,
  presupuesto: [], // Multi-opción
  activeTab: 'salud', // salud | dental | decesos | mascotas

  // Dental standalone
  dentalAsegurados: [{ id: 1, nombre: '', fechaNac: '' }],
  dentalNextId: 2,
  dentalDescuento: 0,

  // Mascotas
  mascotaTipo: 'basica',
  mascotaDescuento: 0,
  mascotaNombre: '',
  mascotaRaza: '',
  mascotaPropietario: '',

  esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; },
  _calcEdad(f) { const h=new Date(),n=new Date(f);let e=h.getFullYear()-n.getFullYear();const m=h.getMonth()-n.getMonth();if(m<0||(m===0&&h.getDate()<n.getDate()))e--;return e; },

  async render(target) {
    const c = target || document.getElementById('main-content');
    c.innerHTML = `
      <div style="display:flex;gap:20px;flex-wrap:wrap;">
        <div style="flex:1;min-width:480px;">
          <div class="card" style="margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
              <h2 style="font-size:18px;font-weight:800;">Calculadora ADESLAS</h2>
              <span style="background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:700;">MásProtección 2026</span>
            </div>
            <!-- Tabs: Salud | Dental | Decesos | Mascotas -->
            <div style="display:flex;gap:4px;margin-bottom:16px;border-bottom:2px solid var(--border);padding-bottom:0;">
              ${['salud','dental','decesos','mascotas'].map(t=>`<button onclick="CalculadoraModule.setTab('${t}')" style="padding:8px 16px;border:none;background:${this.activeTab===t?'var(--accent)':'transparent'};color:${this.activeTab===t?'#fff':'var(--txt3)'};font-size:12px;font-weight:700;border-radius:8px 8px 0 0;cursor:pointer;font-family:inherit;text-transform:uppercase">${t==='salud'?'🏥 Salud':t==='dental'?'🦷 Dental':t==='decesos'?'⚱️ Decesos':'🐾 Mascotas'}</button>`).join('')}
            </div>
            <div id="calc-tab-content"></div>
          </div>
          <!-- Presupuesto multi-opción -->
          <div class="card" id="calc-presupuesto-card" style="${this.presupuesto.length===0?'display:none':''}">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
              <h3 style="font-weight:700;font-size:15px;">Presupuesto (<span id="calc-pres-count">${this.presupuesto.length}</span>)</h3>
              <button class="btn btn-primary btn-sm" onclick="CalculadoraModule.guardarPresupuesto()" ${this.presupuesto.length===0?'disabled':''}>💾 Guardar en CRM</button>
            </div>
            <div id="calc-presupuesto-list"></div>
            <div id="calc-puntos-resumen"></div>
          </div>
        </div>
        <!-- Panel derecho: Resumen -->
        <div style="width:340px;flex-shrink:0;">
          <div class="card" style="position:sticky;top:24px;">
            <h3 style="font-weight:700;font-size:15px;margin-bottom:16px;">Resumen</h3>
            <div id="calc-resumen"><p class="text-light" style="font-size:13px;">Selecciona producto y añade asegurados</p></div>
            <div style="margin-top:16px;">
              <button class="btn btn-primary" style="width:100%;" onclick="CalculadoraModule.addToPresupuesto()">+ Añadir al presupuesto</button>
            </div>
            <div id="calc-status" style="display:none;margin-top:8px;"></div>
          </div>
        </div>
      </div>`;
    this.renderTab();
    this.renderPresupuesto();
  },

  setTab(tab) {
    this.activeTab = tab;
    // Actualizar botones de tab
    document.querySelectorAll('[onclick^="CalculadoraModule.setTab"]').forEach(b => {
      const t = b.textContent.trim();
      const isActive = b.getAttribute('onclick').includes(`'${tab}'`);
      b.style.background = isActive ? 'var(--accent)' : 'transparent';
      b.style.color = isActive ? '#fff' : 'var(--txt3)';
    });
    this.renderTab();
  },

  renderTab() {
    const el = document.getElementById('calc-tab-content');
    if (!el) return;
    switch(this.activeTab) {
      case 'salud': el.innerHTML = this._renderSalud(); this._attachSaludEvents(); break;
      case 'dental': el.innerHTML = this._renderDental(); break;
      case 'decesos': el.innerHTML = this._renderDecesos(); break;
      case 'mascotas': el.innerHTML = this._renderMascotas(); break;
    }
  },

  // ══════════════════════════════════════
  // TAB SALUD (particulares + empresa)
  // ══════════════════════════════════════
  _renderSalud() {
    const esEmpresa = PRODUCTOS_EMPRESA.includes(this.producto);
    const esSinDto = PRODUCTOS_SIN_DESCUENTOS?.includes(this.producto);
    const config = CONFIG_DESCUENTOS[this.producto];
    const maxDto = config ? config.maxOpcional : 10;

    return `
      <!-- Opciones globales -->
      <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;">
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;background:#fff7ed;padding:8px 12px;border-radius:10px;border:1px solid #fbbf24;cursor:pointer;">
          <input type="checkbox" id="calc-ya-asegurado" ${this.clienteYaAsegurado?'checked':''} onchange="CalculadoraModule.onConfigChange()">
          <span style="font-weight:600;color:#c2410c;">Cliente YA asegurado</span>
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;background:#eff6ff;padding:8px 12px;border-radius:10px;border:1px solid #93c5fd;cursor:pointer;">
          <input type="checkbox" id="calc-tomador-aseg" ${this.tomadorEsAsegurado?'checked':''} onchange="CalculadoraModule.toggleTomador()">
          <span style="font-weight:600;color:#1d4ed8;">Tomador = Asegurado</span>
        </label>
      </div>
      <!-- Producto + Provincia -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
        <div>
          <label style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--txt3);">Producto</label>
          <select id="calc-producto" class="form-control" onchange="CalculadoraModule.onConfigChange()" style="margin-top:4px;">
            <option value="">Seleccionar...</option>
            <optgroup label="Gama Anual">
              <option value="PLENA VITAL" ${this.producto==='PLENA VITAL'?'selected':''}>Plena Vital</option>
              <option value="PLENA" ${this.producto==='PLENA'?'selected':''}>Plena</option>
              <option value="PLENA PLUS" ${this.producto==='PLENA PLUS'?'selected':''}>Plena Plus</option>
              <option value="EXTRA 150" ${this.producto==='EXTRA 150'?'selected':''}>Extra 150.000</option>
              <option value="EXTRA 240" ${this.producto==='EXTRA 240'?'selected':''}>Extra 240.000</option>
              <option value="EXTRA 1M" ${this.producto==='EXTRA 1M'?'selected':''}>Extra 1.000.000</option>
              <option value="ADESLAS GO" ${this.producto==='ADESLAS GO'?'selected':''}>Adeslas GO</option>
              <option value="SENIORS" ${this.producto==='SENIORS'?'selected':''}>Seniors (55-84)</option>
            </optgroup>
            <optgroup label="Gama Total (Dental incluido)">
              <option value="PLENA TOTAL" ${this.producto==='PLENA TOTAL'?'selected':''}>Plena Total</option>
              <option value="PLENA VITAL TOTAL" ${this.producto==='PLENA VITAL TOTAL'?'selected':''}>Plena Vital Total</option>
              <option value="SENIORS TOTAL" ${this.producto==='SENIORS TOTAL'?'selected':''}>Seniors Total (63-84)</option>
            </optgroup>
            <optgroup label="Autónomos">
              <option value="AUTONOMOS NIF" ${this.producto==='AUTONOMOS NIF'?'selected':''}>Autónomos NIF</option>
              <option value="AUTONOMOS EXTRA" ${this.producto==='AUTONOMOS EXTRA'?'selected':''}>Autónomos Extra</option>
            </optgroup>
            <optgroup label="Empresa">
              <option value="NEGOCIO CIF 1-4" ${this.producto==='NEGOCIO CIF 1-4'?'selected':''}>Negocio CIF 1-4</option>
              <option value="NEGOCIO CIF 1-4 EXTRA" ${this.producto==='NEGOCIO CIF 1-4 EXTRA'?'selected':''}>Negocio CIF 1-4 Extra</option>
              <option value="EMPRESA +5" ${this.producto==='EMPRESA +5'?'selected':''}>Empresa +5</option>
              <option value="EMPRESA +5 EXTRA" ${this.producto==='EMPRESA +5 EXTRA'?'selected':''}>Empresa +5 Extra</option>
              <option value="PYME TOTAL" ${this.producto==='PYME TOTAL'?'selected':''}>PYME Total</option>
            </optgroup>
            <optgroup label="Colectivos">
              <option value="FAMILIAR FUNCIONARIOS" ${this.producto==='FAMILIAR FUNCIONARIOS'?'selected':''}>Familiar Funcionarios</option>
              <option value="COLECTIVO EXTRANJEROS" ${this.producto==='COLECTIVO EXTRANJEROS'?'selected':''}>Colectivo Extranjeros</option>
            </optgroup>
          </select>
        </div>
        <div>
          <label style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--txt3);">Provincia</label>
          <select id="calc-provincia" class="form-control" onchange="CalculadoraModule.onConfigChange()" style="margin-top:4px;">
            ${PROVINCIAS_ORDENADAS.map(p=>`<option value="${p}" ${p===this.provincia?'selected':''}>${p.replace(/_/g,' ')}</option>`).join('')}
          </select>
        </div>
      </div>
      <!-- Dental + Descuento -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
        <div>
          <label style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--txt3);">Dental</label>
          <select id="calc-dental" class="form-control" onchange="CalculadoraModule.onConfigChange()" style="margin-top:4px;"
            ${PRODUCTOS_DENTAL_INCLUIDO.includes(this.producto)?'disabled':''}>
            ${PRODUCTOS_DENTAL_INCLUIDO.includes(this.producto)?'<option value="">Dental incluido</option>'
              :esEmpresa&&this.producto!=='PYME TOTAL'?'<option value="">Sin dental</option><option value="SI" '+(this.dental==='SI'?'selected':'')+'>Con dental</option>'
              :`<option value="">Sin dental</option><option value="FAMILIA" ${this.dental==='FAMILIA'?'selected':''}>Dental Familia</option><option value="MAX" ${this.dental==='MAX'?'selected':''}>Dental MAX</option>`}
          </select>
        </div>
        <div ${esSinDto?'style="display:none"':''}>
          <label style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--txt3);">Dto. Opcional</label>
          <select id="calc-dto" class="form-control" onchange="CalculadoraModule.onConfigChange()" style="margin-top:4px;"
            ${this.clienteYaAsegurado||this.producto==='ADESLAS GO'?'disabled':''}>
            ${Array.from({length:(maxDto||10)+1},(_,i)=>i).map(n=>`<option value="${n}" ${n===this.dtoOpcional?'selected':''}>${n}%</option>`).join('')}
          </select>
          ${config&&config.reparto>0?`<div style="font-size:10px;color:#ef4444;margin-top:2px;">${Math.round(config.reparto*100)}% contra comisión</div>`:''}
        </div>
      </div>
      ${this.dental==='MAX'?`<div style="margin-bottom:16px;"><label style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--txt3);">Dto. Dental MAX</label><select id="calc-dto-dental" class="form-control" onchange="CalculadoraModule.onConfigChange()" style="margin-top:4px;width:100px;">${[0,5,10,15,20].map(n=>`<option value="${n}" ${n===this.dtoDentalMax?'selected':''}>${n}%</option>`).join('')}</select><div style="font-size:10px;color:#ef4444;margin-top:2px;">100% contra comisión</div></div>`:''}
      <!-- Asegurados -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h3 style="font-weight:700;font-size:15px;">Asegurados</h3>
        <button class="btn btn-primary btn-sm" onclick="CalculadoraModule.addAsegurado()">+ Añadir</button>
      </div>
      ${!this.tomadorEsAsegurado?'<div style="background:#fff7ed;padding:8px 12px;border-radius:8px;border:1px solid #fbbf24;font-size:12px;color:#c2410c;margin-bottom:8px;">👤 El tomador NO es asegurado (solo paga)</div>':''}
      <div id="calc-asegurados"></div>`;
  },

  _attachSaludEvents() {
    this.renderAsegurados();
  },

  renderAsegurados() {
    const el = document.getElementById('calc-asegurados');
    if (!el) return;
    el.innerHTML = this.asegurados.map((a,i) => {
      const hidden = !this.tomadorEsAsegurado && i === 0;
      return `<div style="background:${i===0?'#eff6ff':'var(--bg)'};border:1px solid ${i===0?'#93c5fd':'var(--border)'};border-radius:12px;padding:12px;margin-bottom:8px;${i===0?'border-left:4px solid #3b82f6;':''}${hidden?'display:none;':''}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-size:12px;font-weight:700;color:${i===0?'#1d4ed8':'var(--txt3)'};">${i===0?'TITULAR':`ASEGURADO ${i+1}`}</span>
          <div style="display:flex;align-items:center;gap:8px;">
            <span id="calc-precio-${a.id}" style="font-size:13px;font-weight:700;color:var(--accent);">—</span>
            ${i>0?`<button onclick="CalculadoraModule.removeAsegurado(${a.id})" style="background:#ef4444;color:#fff;border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:12px;">✕</button>`:''}
          </div>
        </div>
        <div style="display:grid;grid-template-columns:2fr 120px 60px 120px;gap:8px;">
          <input type="text" placeholder="Nombre" value="${this.esc(a.nombre)}" class="form-control" style="font-size:12px;padding:8px;" oninput="CalculadoraModule.updateAseg(${a.id},'nombre',this.value)">
          <input type="date" value="${a.fechaNac}" class="form-control" style="font-size:12px;padding:8px;" onchange="CalculadoraModule.updateAseg(${a.id},'fechaNac',this.value);CalculadoraModule.calcular()">
          <select class="form-control" style="font-size:12px;padding:8px;" onchange="CalculadoraModule.updateAseg(${a.id},'sexo',this.value)">
            <option value="">-</option><option value="H" ${a.sexo==='H'?'selected':''}>H</option><option value="M" ${a.sexo==='M'?'selected':''}>M</option>
          </select>
          <input type="text" placeholder="DNI/NIE" value="${this.esc(a.dni||'')}" class="form-control" style="font-size:12px;padding:8px;text-transform:uppercase" oninput="this.value=this.value.toUpperCase();CalculadoraModule.updateAseg(${a.id},'dni',this.value)">
        </div>
      </div>`}).join('');
    this.calcular();
  },

  addAsegurado() { this.asegurados.push({id:this.nextId++,nombre:'',fechaNac:'',sexo:'',dni:'',dniTutor:''}); this.renderAsegurados(); },
  removeAsegurado(id) { this.asegurados=this.asegurados.filter(a=>a.id!==id); this.renderAsegurados(); },
  updateAseg(id,f,v) { const a=this.asegurados.find(x=>x.id===id); if(a)a[f]=v; },

  toggleTomador() {
    this.tomadorEsAsegurado = document.getElementById('calc-tomador-aseg')?.checked ?? true;
    this.renderAsegurados();
  },

  onConfigChange() {
    this.producto = document.getElementById('calc-producto')?.value || '';
    this.provincia = document.getElementById('calc-provincia')?.value || 'Madrid';
    this.dental = document.getElementById('calc-dental')?.value || '';
    this.dtoOpcional = parseInt(document.getElementById('calc-dto')?.value || 0);
    this.dtoDentalMax = parseInt(document.getElementById('calc-dto-dental')?.value || 0);
    this.clienteYaAsegurado = document.getElementById('calc-ya-asegurado')?.checked || false;
    if (this.clienteYaAsegurado) this.dtoOpcional = 0;
    // Re-render tab to update dental/dto selectors for new product
    this.renderTab();
  },

  // ══════════════════════════════════════
  // MOTOR DE CÁLCULO SALUD
  // ══════════════════════════════════════
  calcular() {
    const resumen = document.getElementById('calc-resumen');
    if (!resumen || this.activeTab !== 'salud') return;
    const zona = obtenerZonaDesdeProvincia(this.provincia);
    const producto = this.producto;
    if (!producto) { resumen.innerHTML = '<p class="text-light" style="font-size:13px;">Selecciona un producto</p>'; return; }

    const esEmpresa = !!TARIFAS_EMPRESA[producto];
    const conDental = esEmpresa && this.dental === 'SI';
    let primaBase = 0, numAseg = 0;
    const edades = [], desglose = [];

    this.asegurados.forEach((a,i) => {
      if (!this.tomadorEsAsegurado && i === 0) return;
      const precioEl = document.getElementById('calc-precio-'+a.id);
      if (!a.fechaNac) { if(precioEl) precioEl.textContent='—'; return; }
      const edad = this._calcEdad(a.fechaNac);
      edades.push(edad);
      const precio = obtenerPrecio(producto, zona, edad, conDental);
      if (precio !== null) {
        primaBase += precio; numAseg++;
        if (precioEl) precioEl.textContent = precio.toFixed(2)+' €';
        desglose.push({nombre:a.nombre||`Asegurado ${numAseg}`,edad,precio});
      } else { if(precioEl) precioEl.textContent='Fuera rango'; }
    });

    if (numAseg === 0) { resumen.innerHTML='<p class="text-light" style="font-size:13px;">Añade asegurados con fecha de nacimiento</p>'; return; }

    // Validar edades
    const val = validarEdades(producto, edades);
    if (!val.valido) { resumen.innerHTML='<div style="background:#fef2f2;color:#991b1b;padding:12px;border-radius:8px;font-size:13px;">⚠️ Edades fuera de rango para este producto</div>'; return; }

    // Descuentos
    const esSinDto = PRODUCTOS_SIN_DESCUENTOS?.includes(producto);
    const dtoCompania = esSinDto ? {pct:0,texto:'-'} : (this.clienteYaAsegurado && esEmpresa) ? {pct:0,texto:'-'} : calcularDescuentoCompania(producto, numAseg);
    const dtoOpc = this.clienteYaAsegurado ? 0 : this.dtoOpcional;
    const dtoTotal = dtoCompania.pct + dtoOpc;

    // Dental
    let primaConDental = primaBase, dentalTexto = 'Sin dental', dentalPrecio = 0;
    if (PRODUCTOS_DENTAL_INCLUIDO.includes(producto)) { dentalTexto='Dental incluido'; }
    else if (!esEmpresa && this.dental==='FAMILIA' && numAseg>0) {
      dentalPrecio = DENTAL_FAMILIA[Math.min(zona,6)]||0; primaConDental+=dentalPrecio; dentalTexto=`Dental Familia (${dentalPrecio.toFixed(2)} €)`;
    } else if (conDental) { dentalTexto='Dental incluido en tarifa'; }

    // Prima con descuentos
    const primaSinDto = primaConDental;
    let primaFinal = primaConDental * (1-dtoCompania.pct/100) * (1-dtoOpc/100);

    // Dental MAX se aplica DESPUÉS de descuentos
    if (!esEmpresa && this.dental==='MAX' && numAseg>0 && !PRODUCTOS_DENTAL_INCLUIDO.includes(producto)) {
      dentalPrecio = precioDentalMax(numAseg);
      primaFinal = primaBase * (1-dtoCompania.pct/100) * (1-dtoOpc/100) + dentalPrecio * (1-this.dtoDentalMax/100);
      dentalTexto = `Dental MAX (${dentalPrecio.toFixed(2)} €)`;
    }

    // Campaña meses gratis
    const esSoloAnual = PRODUCTOS_SOLO_ANUAL?.includes(producto);
    const campana = this.clienteYaAsegurado ? {meses:0,mesesTexto:'',tieneBonus:false} : calcularMesesGratis(producto, numAseg, this.dental);
    const mesesAPagar = esSoloAnual ? 1 : 12-campana.meses;
    const primaAnual = esSoloAnual ? primaFinal : primaFinal * mesesAPagar;
    const ahorroCampana = primaFinal * campana.meses;

    // Comisión
    const comision = calcularComision(producto, primaFinal*12, dtoOpc, this.dtoDentalMax);

    // Puntos campaña (1000 pts/asegurado)
    const puntos = numAseg * 1000;

    // Guardar último resultado para addToPresupuesto
    this._lastResult = {producto, zona, dental:this.dental, dentalTexto, dtoCompania, dtoOpc, primaFinal, primaAnual, ahorroCampana, campana, puntos, numAseg, desglose, comision, esEmpresa, conDental, primaSinDto, esSoloAnual, dtoDentalMax:this.dtoDentalMax, clienteYaAsegurado:this.clienteYaAsegurado, tomadorEsAsegurado:this.tomadorEsAsegurado};

    resumen.innerHTML = `
      <div style="margin-bottom:16px;">
        ${desglose.map(d=>`<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border);font-size:12px;"><span>${this.esc(d.nombre)} <span style="color:var(--txt3);">(${d.edad}a)</span></span><span style="font-weight:600;">${d.precio.toFixed(2)} €</span></div>`).join('')}
        ${dentalPrecio>0?`<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border);font-size:12px;"><span>${dentalTexto}</span><span style="font-weight:600;">${dentalPrecio.toFixed(2)} €</span></div>`:''}
      </div>
      ${dtoTotal>0?`<div style="font-size:11px;color:var(--txt3);margin-bottom:4px;">${dtoCompania.pct>0?`Dto. Cía: ${dtoCompania.texto}`:''}${dtoOpc>0?` | Dto. Opc: ${dtoOpc}%`:''}</div><div style="font-size:11px;text-decoration:line-through;color:var(--txt3);">Antes: ${primaSinDto.toFixed(2)} €/mes</div>`:''}
      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:3px solid var(--accent);margin-top:8px;">
        <span style="font-size:15px;font-weight:800;">${esSoloAnual?'TOTAL ANUAL':'TOTAL MENSUAL'}</span>
        <span style="font-size:22px;font-weight:800;color:var(--accent);">${esSoloAnual?primaAnual.toFixed(2):primaFinal.toFixed(2)} €</span>
      </div>
      ${!esSoloAnual?`<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--txt3);margin-top:4px;"><span>Prima anual</span><span style="font-weight:600;">${primaAnual.toFixed(2)} €</span></div>`:''}
      ${campana.meses>0?`<div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:10px;padding:10px;margin-top:12px;"><div style="font-size:12px;font-weight:700;color:#92400e;">🎁 ${campana.meses} ${campana.meses===1?'mes':'meses'} gratis (${campana.mesesTexto})</div><div style="font-size:11px;color:#92400e;">Ahorro: ${ahorroCampana.toFixed(2)} €${campana.tieneBonus?' (incluye bonus dental)':''}</div></div>`:''}
      <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--txt3);margin-top:8px;padding-top:8px;border-top:1px solid var(--border);">
        <span>Comisión</span><span style="font-weight:600;">${comision.toFixed(2)} €/año</span>
      </div>
      <div style="font-size:10px;color:var(--txt3);margin-top:8px;">${producto} | Zona ${zona} (${this.provincia.replace(/_/g,' ')}) | ${dentalTexto}</div>`;
  },

  // ══════════════════════════════════════
  // TAB DENTAL MAX (standalone)
  // ══════════════════════════════════════
  _renderDental() {
    this._calcDental();
    return `
      <div style="margin-bottom:12px;"><label style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--txt3);">Descuento</label>
        <select id="calc-dental-dto" class="form-control" style="margin-top:4px;width:100px;" onchange="CalculadoraModule.dentalDescuento=parseInt(this.value);CalculadoraModule._calcDental()">
          ${[0,5,10,15,20].map(n=>`<option value="${n}" ${n===this.dentalDescuento?'selected':''}>${n}%</option>`).join('')}
        </select>
        <span style="font-size:10px;color:#ef4444;margin-left:8px;">100% contra comisión</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h3 style="font-weight:700;font-size:15px;">Asegurados Dental MAX</h3>
        <button class="btn btn-primary btn-sm" onclick="CalculadoraModule.addDentalAseg()">+ Añadir</button>
      </div>
      <div id="calc-dental-aseg">${this.dentalAsegurados.map((a,i)=>`
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:10px;margin-bottom:6px;display:flex;align-items:center;gap:8px;">
          <input type="text" placeholder="Nombre" value="${this.esc(a.nombre)}" class="form-control" style="flex:1;font-size:12px;padding:8px;" oninput="CalculadoraModule.dentalAsegurados[${i}].nombre=this.value">
          <input type="date" value="${a.fechaNac}" class="form-control" style="width:130px;font-size:12px;padding:8px;">
          <span style="font-size:13px;font-weight:700;color:#1976d2;min-width:60px;text-align:right">${i<2?'10,00':'5,00'} €</span>
          ${i>0?`<button onclick="CalculadoraModule.removeDentalAseg(${a.id})" style="background:#ef4444;color:#fff;border:none;border-radius:50%;width:20px;height:20px;cursor:pointer;font-size:10px;">✕</button>`:''}
        </div>`).join('')}
      </div>
      <div id="calc-dental-resumen"></div>`;
  },

  addDentalAseg() { this.dentalAsegurados.push({id:this.dentalNextId++,nombre:'',fechaNac:''}); this.renderTab(); },
  removeDentalAseg(id) { this.dentalAsegurados=this.dentalAsegurados.filter(a=>a.id!==id); this.renderTab(); },

  _calcDental() {
    const n = this.dentalAsegurados.length;
    if (n===0) { this._lastDentalResult=null; return; }
    let total = Math.min(n,2)*10 + Math.max(n-2,0)*5;
    total = total * (1-this.dentalDescuento/100);
    // Campaña: 1 mes gratis (1 aseg), 2 meses (2+)
    const mesesGratis = n>=2 ? 2 : 1;
    const anual = total*(12-mesesGratis);
    this._lastDentalResult = {producto:'DENTAL MAX',tipo:'dental',primaMensual:total,primaAnual:anual,numAseg:n,mesesGratis,descuento:this.dentalDescuento,puntos:n*1000,
      asegurados:this.dentalAsegurados.map((a,i)=>({nombre:a.nombre,fechaNac:a.fechaNac,precio:i<2?10:5}))};
    setTimeout(()=>{
      const el=document.getElementById('calc-dental-resumen');
      if(el) el.innerHTML=`<div style="background:#e3f2fd;border-radius:10px;padding:12px;margin-top:12px;"><div style="display:flex;justify-content:space-between;font-size:15px;font-weight:800;"><span>Total mensual</span><span style="color:#1976d2">${total.toFixed(2)} €</span></div><div style="display:flex;justify-content:space-between;font-size:12px;color:var(--txt3);margin-top:4px;"><span>Anual (${12-mesesGratis} meses)</span><span>${anual.toFixed(2)} €</span></div><div style="font-size:11px;color:#92400e;margin-top:4px;">🎁 ${mesesGratis} mes(es) gratis</div></div>`;
      const res=document.getElementById('calc-resumen');
      if(res) res.innerHTML=`<div style="font-size:13px;font-weight:700;margin-bottom:8px;">🦷 Dental MAX</div><div style="font-size:22px;font-weight:800;color:var(--accent);">${total.toFixed(2)} €/mes</div><div style="font-size:12px;color:var(--txt3);">${n} asegurado${n>1?'s':''} | ${mesesGratis} mes(es) gratis</div>`;
    },0);
  },

  // ══════════════════════════════════════
  // TAB DECESOS (API externa)
  // ══════════════════════════════════════
  _renderDecesos() {
    setTimeout(()=>{const r=document.getElementById('calc-resumen');if(r)r.innerHTML='<p class="text-light" style="font-size:13px;">Decesos se calcula vía API externa. Selecciona producto y asegurados.</p>';},0);
    return `<div style="background:#f5f3ff;border:1px solid #c4b5fd;border-radius:10px;padding:16px;text-align:center;"><div style="font-size:16px;margin-bottom:8px;">⚱️</div><div style="font-size:14px;font-weight:700;color:#6d28d9;">Módulo Decesos</div><div style="font-size:12px;color:#7c3aed;margin-top:4px;">Calcula decesos vía API externa (Google Apps Script).<br>Esta funcionalidad se integrará en la próxima fase.</div></div>`;
  },

  // ══════════════════════════════════════
  // TAB MASCOTAS
  // ══════════════════════════════════════
  _renderMascotas() {
    const precio = this.mascotaTipo==='completa' ? MASCOTAS_PRECIOS.completa : MASCOTAS_PRECIOS.basica;
    const precioFinal = precio*(1-this.mascotaDescuento/100);
    const anual = precioFinal*12;
    this._lastMascotaResult = {producto:'MASCOTAS ADESLAS',tipo:'mascotas',tipoPoliza:this.mascotaTipo,primaMensual:precioFinal,primaAnual:anual,descuento:this.mascotaDescuento,puntos:1000,
      propietario:{nombre:this.mascotaPropietario},mascota:{nombre:this.mascotaNombre,raza:this.mascotaRaza}};
    setTimeout(()=>{const r=document.getElementById('calc-resumen');if(r)r.innerHTML=`<div style="font-size:13px;font-weight:700;margin-bottom:8px;">🐾 Mascotas ${this.mascotaTipo}</div><div style="font-size:22px;font-weight:800;color:var(--accent);">${precioFinal.toFixed(2)} €/mes</div><div style="font-size:12px;color:var(--txt3);">Anual: ${anual.toFixed(2)} €</div>`;},0);
    return `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
        <div><label style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--txt3);">Tipo de póliza</label>
          <select class="form-control" style="margin-top:4px" onchange="CalculadoraModule.mascotaTipo=this.value;CalculadoraModule.renderTab()">
            <option value="basica" ${this.mascotaTipo==='basica'?'selected':''}>Básica (${MASCOTAS_PRECIOS.basica} €/mes)</option>
            <option value="completa" ${this.mascotaTipo==='completa'?'selected':''}>Completa (${MASCOTAS_PRECIOS.completa} €/mes)</option>
          </select></div>
        <div><label style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--txt3);">Descuento</label>
          <select class="form-control" style="margin-top:4px;width:100px" onchange="CalculadoraModule.mascotaDescuento=parseInt(this.value);CalculadoraModule.renderTab()">
            ${[0,5,10,15,20].map(n=>`<option value="${n}" ${n===this.mascotaDescuento?'selected':''}>${n}%</option>`).join('')}
          </select></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
        <div><label style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--txt3);">Nombre mascota</label>
          <input class="form-control" style="margin-top:4px" value="${this.esc(this.mascotaNombre)}" oninput="CalculadoraModule.mascotaNombre=this.value" placeholder="Ej: Luna"></div>
        <div><label style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--txt3);">Raza</label>
          <input class="form-control" style="margin-top:4px" value="${this.esc(this.mascotaRaza)}" oninput="CalculadoraModule.mascotaRaza=this.value" placeholder="Ej: Labrador"></div>
      </div>
      <div><label style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--txt3);">Propietario</label>
        <input class="form-control" style="margin-top:4px" value="${this.esc(this.mascotaPropietario)}" oninput="CalculadoraModule.mascotaPropietario=this.value" placeholder="Nombre del propietario"></div>
      <div style="background:#ecfdf5;border-radius:10px;padding:12px;margin-top:16px;">
        <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:800;"><span>Total mensual</span><span style="color:#10b981">${precioFinal.toFixed(2)} €</span></div>
        <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--txt3);margin-top:4px;"><span>Prima anual</span><span>${anual.toFixed(2)} €</span></div>
      </div>`;
  },

  // ══════════════════════════════════════
  // PRESUPUESTO MULTI-OPCIÓN
  // ══════════════════════════════════════
  addToPresupuesto() {
    const status = document.getElementById('calc-status');
    let item = null;

    if (this.activeTab === 'salud') {
      if (!this._lastResult) { this._showStatus('Selecciona producto y asegurados','error'); return; }
      const r = this._lastResult;
      item = {
        id: Date.now(), tipo: 'salud', producto: r.producto, zona: r.zona, dental: r.dentalTexto,
        dtoCompania: r.dtoCompania.texto, dtoOpcional: r.dtoOpc, dtoDentalMax: r.dtoDentalMax,
        clienteYaAsegurado: r.clienteYaAsegurado, tomadorEsAsegurado: r.tomadorEsAsegurado,
        primaMensual: r.esSoloAnual ? '-' : r.primaFinal.toFixed(2)+' €',
        primaAnual: r.primaAnual.toFixed(2)+' €',
        comision: r.comision, puntos: r.puntos, campana: r.campana,
        asegurados: this.asegurados.filter((a,i)=>a.fechaNac&&(this.tomadorEsAsegurado||i>0)).map(a=>({
          nombre:a.nombre, fechaNac:a.fechaNac, sexo:a.sexo, dni:a.dni, edad:this._calcEdad(a.fechaNac)
        }))
      };
    } else if (this.activeTab === 'dental') {
      if (!this._lastDentalResult) { this._showStatus('Añade asegurados de dental','error'); return; }
      item = { id: Date.now(), ...this._lastDentalResult, primaMensual: this._lastDentalResult.primaMensual.toFixed(2)+' €', primaAnual: this._lastDentalResult.primaAnual.toFixed(2)+' €' };
    } else if (this.activeTab === 'mascotas') {
      if (!this._lastMascotaResult) return;
      item = { id: Date.now(), ...this._lastMascotaResult, primaMensual: this._lastMascotaResult.primaMensual.toFixed(2)+' €', primaAnual: this._lastMascotaResult.primaAnual.toFixed(2)+' €' };
    } else {
      this._showStatus('Funcionalidad pendiente','error'); return;
    }

    this.presupuesto.push(item);
    this.renderPresupuesto();
    this._showStatus('✅ Añadido al presupuesto','success');
  },

  removeFromPresupuesto(id) {
    this.presupuesto = this.presupuesto.filter(p=>p.id!==id);
    this.renderPresupuesto();
  },

  renderPresupuesto() {
    const card = document.getElementById('calc-presupuesto-card');
    const list = document.getElementById('calc-presupuesto-list');
    const count = document.getElementById('calc-pres-count');
    const puntosEl = document.getElementById('calc-puntos-resumen');
    if (!card) return;

    card.style.display = this.presupuesto.length > 0 ? '' : 'none';
    if (count) count.textContent = this.presupuesto.length;

    if (list) list.innerHTML = this.presupuesto.map((p,i) => `
      <div style="display:flex;align-items:center;gap:12px;padding:10px;border:1px solid var(--border);border-radius:10px;margin-bottom:6px;background:var(--bg);">
        <div style="flex:1;">
          <div style="font-size:13px;font-weight:700;">Opción ${i+1}: ${this.esc(p.producto)}</div>
          <div style="font-size:11px;color:var(--txt3);">${p.tipo==='salud'?`Zona ${p.zona} | ${p.dental}${p.dtoOpcional>0?' | Dto: '+p.dtoOpcional+'%':''}`:p.tipo==='dental'?`${p.numAseg} asegurado(s)${p.descuento>0?' | Dto: '+p.descuento+'%':''}`:p.tipoPoliza||''}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:14px;font-weight:800;color:var(--accent);">${p.primaMensual!='-'?p.primaMensual+'/mes':p.primaAnual}</div>
        </div>
        <button onclick="CalculadoraModule.removeFromPresupuesto(${p.id})" style="background:#ef4444;color:#fff;border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:12px;">✕</button>
      </div>
    `).join('');

    // Puntos campaña con multirramo
    if (puntosEl && this.presupuesto.length > 0) {
      const totalPuntosBase = this.presupuesto.reduce((s,p)=>s+(p.puntos||0),0);
      const tipos = new Set(this.presupuesto.map(p=>p.tipo||'salud'));
      const hayMultirramo = tipos.size >= 2;
      const totalPuntos = hayMultirramo ? totalPuntosBase * 2 : totalPuntosBase;
      puntosEl.innerHTML = totalPuntos > 0 ? `
        <div style="background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border-radius:10px;padding:12px;margin-top:12px;">
          <div style="font-size:11px;opacity:.8;">PUNTOS CAMPAÑA MÁSPROTECCIÓN</div>
          <div style="font-size:24px;font-weight:800;">${totalPuntos.toLocaleString('es-ES')} pts</div>
          ${hayMultirramo?'<div style="font-size:10px;background:rgba(255,255,255,.2);border-radius:6px;padding:3px 8px;margin-top:4px;display:inline-block">⚡ Bonus ×2 Multirramo</div>':''}
        </div>` : '';
    }
  },

  // ══════════════════════════════════════
  // GUARDAR EN CRM + PIPEDRIVE
  // ══════════════════════════════════════
  async guardarPresupuesto() {
    if (this.presupuesto.length === 0) { this._showStatus('Añade opciones al presupuesto','error'); return; }

    try {
      for (const item of this.presupuesto) {
        const primaM = parseFloat((item.primaMensual||'').replace(/[^0-9.,]/g,'').replace(',','.'))||0;
        const primaA = parseFloat((item.primaAnual||'').replace(/[^0-9.,]/g,'').replace(',','.'))||0;
        await API.post('/calculadora/propuestas', {
          persona_id: this.personaId || null,
          deal_id: this.dealId || null,
          compania: 'ADESLAS',
          producto: item.producto,
          modalidad: item.tipo,
          zona: item.zona || null,
          provincia: this.provincia,
          num_asegurados: item.asegurados?.length || item.numAseg || 1,
          prima_mensual: primaM,
          prima_anual: primaA,
          descuento: item.dtoCompania ? parseFloat(item.dtoCompania) || 0 : 0,
          descuento_contra: item.dtoOpcional || item.descuento || 0,
          campana_puntos: item.puntos || 0,
          forma_pago: 'mensual',
          asegurados_data: item.asegurados || [],
          desglose: item
        });
      }
      this._showStatus(`✅ ${this.presupuesto.length} propuesta(s) guardada(s)`,'success');
      this.presupuesto = [];
      this.renderPresupuesto();
    } catch(err) {
      this._showStatus('Error: '+err.message,'error');
    }
  },

  _showStatus(msg,type) {
    const el = document.getElementById('calc-status');
    if (!el) return;
    el.style.display='block';
    el.innerHTML=`<div style="background:${type==='error'?'#fef2f2;color:#991b1b':'#f0fdf4;color:#166534'};padding:10px;border-radius:8px;font-size:13px;">${msg}</div>`;
    if (type==='success') setTimeout(()=>{el.style.display='none';},4000);
  }
};
