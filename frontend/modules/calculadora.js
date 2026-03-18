// === Módulo Calculadora ADESLAS — Nativo CRM ===
// Usa tarifas.js (cargado antes que este archivo)

const CalculadoraModule = {
  asegurados: [{ id: 1, nombre: '', fechaNac: '', sexo: 'H' }],
  nextId: 2,
  provincia: 'Madrid',
  producto: '',
  dental: '',
  dtoOpcional: 0,
  clienteYaAsegurado: false,
  personaId: null,

  // Config descuentos (portada del original)
  CONFIG_DESCUENTOS: {
    'PLENA VITAL': { tipo: 'plena', max: 10, reparto: 0.5 },
    'PLENA': { tipo: 'plena', max: 10, reparto: 0.5 },
    'PLENA PLUS': { tipo: 'plena', max: 10, reparto: 0.5 },
    'EXTRA 150': { tipo: 'plena', max: 10, reparto: 0.5 },
    'EXTRA 240': { tipo: 'plena', max: 10, reparto: 0.5 },
    'EXTRA 1M': { tipo: 'plena', max: 10, reparto: 0.5 },
    'PLENA TOTAL': { tipo: 'total', max: 10, reparto: 0.5 },
    'PLENA VITAL TOTAL': { tipo: 'total', max: 10, reparto: 0.5 },
    'ADESLAS GO': { tipo: 'go', max: 0, reparto: 0 },
    'AUTONOMOS NIF': { tipo: 'ninguno', max: 10, reparto: 0.5 },
    'SENIORS': { tipo: 'plena', max: 10, reparto: 0.5 },
    'SENIORS TOTAL': { tipo: 'total', max: 10, reparto: 0.5 }
  },

  PRODUCTOS_PLURIANUALES: ['PLENA TOTAL', 'PLENA VITAL TOTAL', 'SENIORS TOTAL'],
  PRODUCTOS_ANUALES_CAMPANA: ['PLENA VITAL', 'PLENA', 'PLENA PLUS', 'EXTRA 150', 'EXTRA 240', 'EXTRA 1M', 'SENIORS', 'AUTONOMOS NIF'],
  PRODUCTOS_SIN_CAMPANA: ['ADESLAS GO'],

  esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; },

  async render(target) {
    const c = target || document.getElementById('main-content');
    c.innerHTML = `
      <div style="display:flex;gap:20px;flex-wrap:wrap;">
        <!-- Panel izquierdo -->
        <div style="flex:1;min-width:500px;">
          <div class="card" style="margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
              <h2 style="font-size:18px;font-weight:800;">Calculadora ADESLAS</h2>
              <span style="background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:700;">MásProtección 2026</span>
            </div>

            <!-- Opciones globales -->
            <div style="display:flex;gap:16px;margin-bottom:20px;flex-wrap:wrap;">
              <label style="display:flex;align-items:center;gap:6px;font-size:13px;background:#fff7ed;padding:8px 12px;border-radius:10px;border:2px solid #f59e0b;cursor:pointer;">
                <input type="checkbox" id="calc-ya-asegurado" onchange="CalculadoraModule.onConfigChange()">
                <span style="font-weight:600;color:#c2410c;">Cliente YA asegurado en ADESLAS</span>
              </label>
            </div>

            <!-- Producto + Provincia -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
              <div>
                <label style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--txt3);">Producto</label>
                <select id="calc-producto" class="form-control" onchange="CalculadoraModule.onConfigChange()" style="margin-top:4px;">
                  <option value="">Seleccionar...</option>
                  <optgroup label="Gama Anual">
                    <option value="PLENA VITAL">Plena Vital</option>
                    <option value="PLENA">Plena</option>
                    <option value="PLENA PLUS">Plena Plus</option>
                    <option value="EXTRA 150">Extra 150.000</option>
                    <option value="EXTRA 240">Extra 240.000</option>
                    <option value="EXTRA 1M">Extra 1.000.000</option>
                    <option value="ADESLAS GO">Adeslas GO</option>
                    <option value="SENIORS">Seniors (55-84)</option>
                  </optgroup>
                  <optgroup label="Gama Total (Dental incluido)">
                    <option value="PLENA TOTAL">Plena Total</option>
                    <option value="PLENA VITAL TOTAL">Plena Vital Total</option>
                    <option value="SENIORS TOTAL">Seniors Total (63-84)</option>
                  </optgroup>
                  <optgroup label="Autónomos">
                    <option value="AUTONOMOS NIF">Autónomos NIF</option>
                  </optgroup>
                </select>
              </div>
              <div>
                <label style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--txt3);">Provincia</label>
                <select id="calc-provincia" class="form-control" onchange="CalculadoraModule.onConfigChange()" style="margin-top:4px;">
                  ${PROVINCIAS_ORDENADAS.map(p => `<option value="${p}" ${p === 'Madrid' ? 'selected' : ''}>${p.replace(/_/g, ' ')}</option>`).join('')}
                </select>
              </div>
            </div>

            <!-- Dental + Descuento -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
              <div id="calc-dental-group">
                <label style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--txt3);">Dental</label>
                <select id="calc-dental" class="form-control" onchange="CalculadoraModule.onConfigChange()" style="margin-top:4px;">
                  <option value="">Sin dental</option>
                  <option value="FAMILIA">Dental Familia</option>
                  <option value="MAX">Dental MAX</option>
                </select>
              </div>
              <div>
                <label style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--txt3);">Dto. Opcional</label>
                <select id="calc-dto" class="form-control" onchange="CalculadoraModule.onConfigChange()" style="margin-top:4px;">
                  ${[0,1,2,3,4,5,6,7,8,9,10].map(n => `<option value="${n}">${n}%</option>`).join('')}
                </select>
              </div>
            </div>
          </div>

          <!-- Asegurados -->
          <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
              <h3 style="font-weight:700;font-size:15px;">Asegurados</h3>
              <button class="btn btn-primary btn-sm" onclick="CalculadoraModule.addAsegurado()">+ Añadir</button>
            </div>
            <div id="calc-asegurados"></div>
          </div>
        </div>

        <!-- Panel derecho: Resumen -->
        <div style="width:340px;flex-shrink:0;">
          <div class="card" style="position:sticky;top:24px;">
            <h3 style="font-weight:700;font-size:15px;margin-bottom:16px;">Resumen</h3>
            <div id="calc-resumen">
              <p class="text-light" style="font-size:13px;">Selecciona producto y añade asegurados</p>
            </div>
            <div style="margin-top:16px;">
              <button class="btn btn-primary" style="width:100%;margin-bottom:8px;" onclick="CalculadoraModule.guardarPropuesta()">
                💾 Guardar propuesta en CRM
              </button>
            </div>
            <div id="calc-status" style="display:none;"></div>
          </div>
        </div>
      </div>
    `;

    this.renderAsegurados();
  },

  renderAsegurados() {
    const el = document.getElementById('calc-asegurados');
    if (!el) return;

    el.innerHTML = this.asegurados.map((a, i) => `
      <div style="background:${i === 0 ? '#eff6ff' : 'var(--bg)'};border:1px solid ${i === 0 ? '#93c5fd' : 'var(--border)'};border-radius:12px;padding:12px;margin-bottom:8px;${i === 0 ? 'border-left:4px solid #3b82f6;' : ''}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-size:12px;font-weight:700;color:${i === 0 ? '#1d4ed8' : 'var(--txt3)'};">
            ${i === 0 ? 'TITULAR' : `ASEGURADO ${i + 1}`}
          </span>
          <div style="display:flex;align-items:center;gap:8px;">
            <span id="calc-precio-${a.id}" style="font-size:13px;font-weight:700;color:var(--accent);">—</span>
            ${i > 0 ? `<button onclick="CalculadoraModule.removeAsegurado(${a.id})" style="background:#ef4444;color:#fff;border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:12px;">✕</button>` : ''}
          </div>
        </div>
        <div style="display:grid;grid-template-columns:2fr 130px 80px;gap:8px;">
          <input type="text" placeholder="Nombre" value="${this.esc(a.nombre)}"
            class="form-control" style="font-size:13px;padding:8px;"
            oninput="CalculadoraModule.updateAseg(${a.id},'nombre',this.value)">
          <input type="date" value="${a.fechaNac}"
            class="form-control" style="font-size:13px;padding:8px;"
            onchange="CalculadoraModule.updateAseg(${a.id},'fechaNac',this.value);CalculadoraModule.calcular()">
          <select class="form-control" style="font-size:13px;padding:8px;"
            onchange="CalculadoraModule.updateAseg(${a.id},'sexo',this.value)">
            <option value="H" ${a.sexo === 'H' ? 'selected' : ''}>H</option>
            <option value="M" ${a.sexo === 'M' ? 'selected' : ''}>M</option>
          </select>
        </div>
      </div>
    `).join('');

    this.calcular();
  },

  addAsegurado() {
    this.asegurados.push({ id: this.nextId++, nombre: '', fechaNac: '', sexo: 'H' });
    this.renderAsegurados();
  },

  removeAsegurado(id) {
    this.asegurados = this.asegurados.filter(a => a.id !== id);
    this.renderAsegurados();
  },

  updateAseg(id, field, value) {
    const a = this.asegurados.find(x => x.id === id);
    if (a) a[field] = value;
  },

  onConfigChange() {
    this.producto = document.getElementById('calc-producto')?.value || '';
    this.provincia = document.getElementById('calc-provincia')?.value || 'Madrid';
    this.dental = document.getElementById('calc-dental')?.value || '';
    this.dtoOpcional = parseInt(document.getElementById('calc-dto')?.value || 0);
    this.clienteYaAsegurado = document.getElementById('calc-ya-asegurado')?.checked || false;

    // Deshabilitar dental si producto tiene dental incluido
    const dentalSel = document.getElementById('calc-dental');
    if (PRODUCTOS_DENTAL_INCLUIDO.includes(this.producto)) {
      dentalSel.value = '';
      dentalSel.disabled = true;
      this.dental = '';
    } else {
      dentalSel.disabled = false;
    }

    // Deshabilitar dto si es GO
    const dtoSel = document.getElementById('calc-dto');
    if (this.producto === 'ADESLAS GO') {
      dtoSel.value = '0';
      dtoSel.disabled = true;
      this.dtoOpcional = 0;
    } else {
      dtoSel.disabled = false;
    }

    // Si cliente ya asegurado, forzar dto = 0
    if (this.clienteYaAsegurado) {
      dtoSel.value = '0';
      dtoSel.disabled = true;
      this.dtoOpcional = 0;
    }

    this.calcular();
  },

  // === MOTOR DE CÁLCULO ===
  calcular() {
    const resumen = document.getElementById('calc-resumen');
    if (!resumen) return;

    const zona = obtenerZonaDesdeProvincia(this.provincia);
    const producto = this.producto;

    if (!producto) {
      resumen.innerHTML = '<p class="text-light" style="font-size:13px;">Selecciona un producto</p>';
      return;
    }

    let primaBase = 0;
    let numAseg = 0;
    const edades = [];
    const desglose = [];

    this.asegurados.forEach(a => {
      const precioEl = document.getElementById('calc-precio-' + a.id);
      if (!a.fechaNac) {
        if (precioEl) precioEl.textContent = '—';
        return;
      }

      const edad = this._calcEdad(a.fechaNac);
      edades.push(edad);
      const precio = obtenerPrecioEdad(producto, zona, edad);

      if (precio !== null) {
        primaBase += precio;
        numAseg++;
        if (precioEl) precioEl.textContent = precio.toFixed(2) + ' €';
        desglose.push({ nombre: a.nombre || `Asegurado ${numAseg}`, edad, precio });
      } else {
        if (precioEl) precioEl.textContent = 'Fuera rango';
      }
    });

    if (numAseg === 0) {
      resumen.innerHTML = '<p class="text-light" style="font-size:13px;">Añade asegurados con fecha de nacimiento</p>';
      return;
    }

    // Descuento compañía
    const dtoCompania = this._calcDtoCompania(producto, numAseg);
    const dtoOpc = this.clienteYaAsegurado ? 0 : this.dtoOpcional;
    const dtoTotal = dtoCompania.pct + dtoOpc;

    // Dental
    let primaConDental = primaBase;
    let dentalTexto = 'Sin dental';
    let dentalPrecio = 0;

    if (PRODUCTOS_DENTAL_INCLUIDO.includes(producto)) {
      dentalTexto = 'Dental incluido';
    } else if (this.dental === 'FAMILIA' && numAseg > 0) {
      dentalPrecio = DENTAL_FAMILIA[Math.min(zona, 6)] || 0;
      primaConDental += dentalPrecio;
      dentalTexto = `Dental Familia (${dentalPrecio.toFixed(2)} €)`;
    } else if (this.dental === 'MAX' && numAseg > 0) {
      // Dental MAX: 10€ primer y segundo, 5€ resto
      dentalPrecio = Math.min(numAseg, 2) * 10 + Math.max(numAseg - 2, 0) * 5;
      dentalTexto = `Dental MAX (${dentalPrecio.toFixed(2)} €)`;
    }

    // Prima con descuentos
    const primaSinDto = primaConDental;
    let primaFinal = primaConDental * (1 - dtoCompania.pct / 100) * (1 - dtoOpc / 100);

    // Si dental MAX, se añade después de los descuentos (solo la parte de salud se descuenta)
    if (this.dental === 'MAX' && numAseg > 0 && !PRODUCTOS_DENTAL_INCLUIDO.includes(producto)) {
      primaFinal = primaBase * (1 - dtoCompania.pct / 100) * (1 - dtoOpc / 100) + dentalPrecio;
    }

    // Campaña: meses gratis
    const campana = this.clienteYaAsegurado ? { meses: 0 } : this._calcMesesGratis(producto, numAseg, this.dental);
    const mesesAPagar = 12 - campana.meses;
    const primaAnual = primaFinal * mesesAPagar;
    const ahorroCampana = primaFinal * campana.meses;

    // Puntos campaña (1000 pts/asegurado para salud)
    const puntos = numAseg * 1000;

    // Renderizar resumen
    resumen.innerHTML = `
      <div style="margin-bottom:16px;">
        ${desglose.map(d => `
          <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px;">
            <span>${this.esc(d.nombre)} <span style="color:var(--txt3);">(${d.edad} años)</span></span>
            <span style="font-weight:600;">${d.precio.toFixed(2)} €</span>
          </div>
        `).join('')}
        ${dentalPrecio > 0 ? `
          <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px;">
            <span>${dentalTexto}</span>
            <span style="font-weight:600;">${dentalPrecio.toFixed(2)} €</span>
          </div>
        ` : ''}
      </div>

      ${dtoTotal > 0 ? `
        <div style="font-size:12px;color:var(--txt3);margin-bottom:4px;">
          ${dtoCompania.pct > 0 ? `Dto. Compañía: ${dtoCompania.texto}` : ''}
          ${dtoOpc > 0 ? ` | Dto. Opcional: ${dtoOpc}%` : ''}
        </div>
        <div style="font-size:12px;text-decoration:line-through;color:var(--txt3);margin-bottom:4px;">
          Antes: ${primaSinDto.toFixed(2)} €/mes
        </div>
      ` : ''}

      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:3px solid var(--accent);">
        <span style="font-size:16px;font-weight:800;">TOTAL MENSUAL</span>
        <span style="font-size:24px;font-weight:800;color:var(--accent);">${primaFinal.toFixed(2)} €</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:13px;color:var(--txt3);margin-top:4px;">
        <span>Prima anual</span>
        <span style="font-weight:600;">${primaAnual.toFixed(2)} €</span>
      </div>

      ${campana.meses > 0 ? `
        <div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:10px;padding:12px;margin-top:12px;">
          <div style="font-size:13px;font-weight:700;color:#92400e;">🎁 ${campana.meses} ${campana.meses === 1 ? 'mes' : 'meses'} gratis</div>
          <div style="font-size:12px;color:#92400e;">Ahorro campaña: ${ahorroCampana.toFixed(2)} €</div>
        </div>
      ` : ''}

      ${puntos > 0 ? `
        <div style="background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border-radius:10px;padding:12px;margin-top:12px;">
          <div style="font-size:12px;opacity:.8;">PUNTOS CAMPAÑA</div>
          <div style="font-size:28px;font-weight:800;">${puntos.toLocaleString('es-ES')}</div>
          <div style="font-size:11px;opacity:.7;">${numAseg} asegurado${numAseg > 1 ? 's' : ''} × 1.000 pts</div>
        </div>
      ` : ''}

      <div style="font-size:11px;color:var(--txt3);margin-top:12px;">
        Producto: ${producto} | Zona ${zona} (${this.provincia.replace(/_/g, ' ')}) | ${dentalTexto}
      </div>
    `;
  },

  // === GUARDAR EN CRM ===
  async guardarPropuesta() {
    const statusEl = document.getElementById('calc-status');
    if (!this.producto) {
      statusEl.style.display = 'block';
      statusEl.innerHTML = '<div style="background:#fef2f2;color:#991b1b;padding:10px;border-radius:8px;font-size:13px;">Selecciona un producto</div>';
      return;
    }

    const zona = obtenerZonaDesdeProvincia(this.provincia);
    const aseguradosConFecha = this.asegurados.filter(a => a.fechaNac);
    if (aseguradosConFecha.length === 0) {
      statusEl.style.display = 'block';
      statusEl.innerHTML = '<div style="background:#fef2f2;color:#991b1b;padding:10px;border-radius:8px;font-size:13px;">Añade al menos un asegurado con fecha de nacimiento</div>';
      return;
    }

    // Calcular prima final
    let prima = 0;
    aseguradosConFecha.forEach(a => {
      const precio = obtenerPrecioEdad(this.producto, zona, this._calcEdad(a.fechaNac));
      if (precio) prima += precio;
    });

    const dtoCompania = this._calcDtoCompania(this.producto, aseguradosConFecha.length);
    const dtoOpc = this.clienteYaAsegurado ? 0 : this.dtoOpcional;
    prima = prima * (1 - dtoCompania.pct / 100) * (1 - dtoOpc / 100);

    try {
      const result = await API.post('/calculadora/propuestas', {
        persona_id: this.personaId || null,
        compania: 'ADESLAS',
        producto: this.producto,
        zona,
        provincia: this.provincia,
        num_asegurados: aseguradosConFecha.length,
        prima_mensual: parseFloat(prima.toFixed(2)),
        prima_anual: parseFloat((prima * 12).toFixed(2)),
        descuento: dtoCompania.pct,
        descuento_contra: dtoOpc,
        campana_puntos: aseguradosConFecha.length * 1000,
        forma_pago: 'mensual',
        asegurados_data: aseguradosConFecha.map(a => ({
          nombre: a.nombre, fechaNac: a.fechaNac, sexo: a.sexo,
          edad: this._calcEdad(a.fechaNac)
        }))
      });

      statusEl.style.display = 'block';
      statusEl.innerHTML = `<div style="background:#f0fdf4;color:#166534;padding:10px;border-radius:8px;font-size:13px;">✅ Propuesta guardada (ID: ${result.id})</div>`;
      setTimeout(() => { statusEl.style.display = 'none'; }, 5000);
    } catch (err) {
      statusEl.style.display = 'block';
      statusEl.innerHTML = `<div style="background:#fef2f2;color:#991b1b;padding:10px;border-radius:8px;font-size:13px;">Error: ${err.message}</div>`;
    }
  },

  // === UTILIDADES DE CÁLCULO ===
  _calcEdad(fechaNac) {
    const hoy = new Date();
    const nac = new Date(fechaNac);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  },

  _calcDtoCompania(producto, numAseg) {
    const config = this.CONFIG_DESCUENTOS[producto];
    if (!config) return { pct: 0, texto: '-' };

    switch (config.tipo) {
      case 'plena':
        return numAseg >= 4 ? { pct: 10, texto: '10% (4+ aseg)' } : { pct: 0, texto: '-' };
      case 'total':
        if (numAseg >= 5) return { pct: 15, texto: '15% (5+ aseg)' };
        if (numAseg === 4) return { pct: 10, texto: '10% (4 aseg)' };
        if (numAseg === 3) return { pct: 5, texto: '5% (3 aseg)' };
        return { pct: 0, texto: '-' };
      case 'go':
        return numAseg >= 2 ? { pct: 10, texto: '10% (2+ aseg)' } : { pct: 0, texto: '-' };
      default:
        return { pct: 0, texto: '-' };
    }
  },

  _calcMesesGratis(producto, numAseg, dental) {
    if (numAseg === 0 || this.PRODUCTOS_SIN_CAMPANA.includes(producto)) return { meses: 0 };

    let meses = 0;
    if (this.PRODUCTOS_PLURIANUALES.includes(producto)) {
      meses = numAseg >= 2 ? 3 : 2;
    } else if (this.PRODUCTOS_ANUALES_CAMPANA.includes(producto)) {
      meses = numAseg >= 2 ? 2 : 1;
      if (dental === 'FAMILIA' || dental === 'MAX') meses += 1;
    }
    return { meses };
  }
};
