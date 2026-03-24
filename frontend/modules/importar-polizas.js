// === Módulo Importar Pólizas desde Google Sheet ===

const ImportarPolizasModule = {
  SHEET_ID: '1XI3kWE45k8d-ZPrDpTYDzQf2ZS_GnsRXJPERPdyXswk',
  HOJAS: [
    'ENERO 2025', 'FEBRERO 2025', 'MARZO 2025', 'ABRIL 2025',
    'MAYO 2025', 'JUNIO 2025', 'JULIO 2025', 'AGOSTO 2025',
    'SEPTIEMBRE 2025', 'OCTUBRE 2025', 'NOVIEMBRE 2025', 'DICIEMBRE 2025',
    'ENERO 2026'
  ],

  async render() {
    const container = document.getElementById('main-content');
    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
        <h1 class="page-title" style="margin-bottom:0;">Importar Pólizas</h1>
      </div>

      <div class="card" style="margin-bottom:16px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
          <div style="width:44px;height:44px;border-radius:12px;background:#e6f6fd;display:flex;align-items:center;justify-content:center;">
            ${Icons.polizas(24, '#009DDD')}
          </div>
          <div>
            <div style="font-size:15px;font-weight:700;">Google Sheet: ADESLAS VENTAS 2025</div>
            <div style="font-size:12px;color:#94a3b8;">13 pestañas mensuales · La lectura se hace desde tu navegador (sesión de Google)</div>
          </div>
        </div>

        <button id="btn-importar-sheet" class="btn btn-primary" style="padding:10px 24px;font-size:14px;">
          ${Icons.importar(18, '#fff')} Importar desde Google Sheet
        </button>

        <div id="import-progress" style="margin-top:20px;display:none;"></div>
      </div>

      <div id="import-result" style="display:none;"></div>
    `;

    document.getElementById('btn-importar-sheet').addEventListener('click', () => this.ejecutarImportacion());
  },

  async ejecutarImportacion() {
    const btn = document.getElementById('btn-importar-sheet');
    const progress = document.getElementById('import-progress');
    const result = document.getElementById('import-result');

    btn.disabled = true;
    btn.style.opacity = '0.5';
    btn.textContent = 'Importando...';
    progress.style.display = 'block';
    result.style.display = 'none';

    const totales = {
      contactos_nuevos: 0, contactos_actualizados: 0,
      polizas_nuevas: 0, polizas_actualizadas: 0,
      bajas_detectadas: 0, dnis_extraidos_de_nombre: 0,
      errores: [], total_procesadas: 0,
      desglose: [],
    };

    for (let h = 0; h < this.HOJAS.length; h++) {
      const hoja = this.HOJAS[h];
      const stepId = `step-${h}`;

      // Añadir línea de progreso
      progress.innerHTML += `
        <div id="${stepId}" style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:13px;">
          <span class="step-icon" style="width:20px;height:20px;border-radius:50%;background:#e6f6fd;display:flex;align-items:center;justify-content:center;">
            <span style="width:8px;height:8px;border-radius:50%;background:#009DDD;animation:pulse 1s infinite;"></span>
          </span>
          <span class="step-text" style="font-weight:600;">Leyendo ${this._esc(hoja)}...</span>
        </div>
      `;
      progress.scrollTop = progress.scrollHeight;

      let filas = [];
      try {
        filas = await this.leerHoja(hoja);
      } catch (err) {
        this._updateStep(stepId, 'error', `${hoja}: error leyendo — ${err.message}`);
        totales.errores.push(`${hoja}: ${err.message}`);
        continue;
      }

      if (filas.length === 0) {
        this._updateStep(stepId, 'skip', `${hoja}: 0 filas con póliza`);
        totales.desglose.push({ mes: hoja, filas: 0, nuevas: 0, actualizadas: 0 });
        continue;
      }

      this._updateStep(stepId, 'loading', `Importando ${hoja}... ${filas.length} filas`);

      // Enviar en batches de 100
      let mesNuevas = 0, mesActualizadas = 0;
      for (let i = 0; i < filas.length; i += 100) {
        const batch = filas.slice(i, i + 100);
        try {
          const resp = await API.post('/polizas/importar-json', { mes: hoja, filas: batch });
          totales.contactos_nuevos += resp.contactos_nuevos;
          totales.contactos_actualizados += resp.contactos_actualizados;
          totales.polizas_nuevas += resp.polizas_nuevas;
          totales.polizas_actualizadas += resp.polizas_actualizadas;
          totales.bajas_detectadas += resp.bajas_detectadas;
          totales.dnis_extraidos_de_nombre += resp.dnis_extraidos_de_nombre;
          totales.total_procesadas += resp.total_procesadas;
          if (resp.errores?.length) totales.errores.push(...resp.errores);
          mesNuevas += resp.polizas_nuevas;
          mesActualizadas += resp.polizas_actualizadas;
        } catch (err) {
          totales.errores.push(`${hoja} batch ${Math.floor(i / 100) + 1}: ${err.message}`);
        }
      }

      this._updateStep(stepId, 'ok', `${hoja}: ${filas.length} filas — ${mesNuevas} nuevas, ${mesActualizadas} actualizadas`);
      totales.desglose.push({ mes: hoja, filas: filas.length, nuevas: mesNuevas, actualizadas: mesActualizadas });
    }

    // Mostrar resultado final
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.innerHTML = `${Icons.importar(18, '#fff')} Importar desde Google Sheet`;

    result.style.display = 'block';
    result.innerHTML = this._renderResultado(totales);
  },

  async leerHoja(hoja) {
    const url = `https://docs.google.com/spreadsheets/d/${this.SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(hoja)}`;
    const resp = await fetch(url, { credentials: 'include' });
    const text = await resp.text();

    // gviz devuelve JSONP: google.visualization.Query.setResponse({...})
    // o a veces con prefijo )]}'\n
    let jsonStr = text;
    if (jsonStr.startsWith(")]}'\n")) {
      jsonStr = jsonStr.substring(5);
    } else {
      jsonStr = jsonStr.replace(/^[^(]*\(/, '').replace(/\);?\s*$/, '');
    }

    const data = JSON.parse(jsonStr);
    if (!data.table?.rows) return [];

    const filas = [];
    for (const row of data.table.rows) {
      const c = row.c || [];
      // Saltar filas sin nº póliza (col 7)
      const numPoliza = this._cellVal(c[7]);
      if (!numPoliza) continue;

      filas.push({
        agente:          this._cellVal(c[0]),
        nombre:          this._cellVal(c[1]),
        dni:             this._cellVal(c[2]),
        fecha_grabacion: this._cellFmt(c[3]),
        fecha_efecto:    this._cellFmt(c[4]),
        producto:        this._cellVal(c[5]),
        num_solicitud:   this._cellStr(c[6]),
        num_poliza:      String(numPoliza),
        forma_pago:      this._cellVal(c[8]),
        descuento:       this._cellFmt(c[9]) || this._cellVal(c[9]),
        recibo_mensual:  this._cellFmt(c[10]),
        num_asegurados:  this._cellVal(c[11]),
        prima_anual:     this._cellFmt(c[12]),
        beneficio:       this._cellFmt(c[13]),
        origen_lead:     this._cellVal(c[14]),
        telefono:        this._cellStr(c[15]),
        email:           this._cellVal(c[16]),
        campana:         this._cellVal(c[17]),
        audio:           this._cellStr(c[18]),
        carencias:       this._cellVal(c[19]),
        enviada_ccpp:    this._cellVal(c[20]),
        notas:           this._cellVal(c[21]),
      });
    }

    return filas;
  },

  // Obtener valor formateado (.f) con fallback a .v
  _cellFmt(cell) {
    if (!cell) return null;
    if (cell.f !== undefined && cell.f !== null) return cell.f;
    return cell.v !== undefined ? cell.v : null;
  },

  // Obtener valor crudo (.v)
  _cellVal(cell) {
    if (!cell) return null;
    return cell.v !== undefined ? cell.v : null;
  },

  // Obtener valor como string (para campos que pueden ser numéricos pero son IDs)
  _cellStr(cell) {
    if (!cell) return null;
    const v = cell.v;
    if (v === null || v === undefined) return null;
    return String(v);
  },

  _updateStep(id, status, text) {
    const el = document.getElementById(id);
    if (!el) return;
    const colors = { ok: '#10b981', error: '#ef4444', skip: '#94a3b8', loading: '#009DDD' };
    const icons = { ok: '&#10003;', error: '&#10007;', skip: '—', loading: '&#8987;' };
    el.querySelector('.step-icon').innerHTML =
      `<span style="color:${colors[status]};font-size:12px;font-weight:700;">${icons[status]}</span>`;
    el.querySelector('.step-icon').style.background = status === 'ok' ? '#ecfdf5' : status === 'error' ? '#fef2f2' : '#f4f6f9';
    el.querySelector('.step-text').textContent = text;
    el.querySelector('.step-text').style.color = colors[status] || '#0f172a';
  },

  _renderResultado(t) {
    return `
      <div class="card" style="border-top:3px solid #009DDD;">
        <h3 style="font-size:16px;font-weight:700;margin-bottom:16px;">Resultado de importación</h3>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:20px;">
          ${this._kpi('Total procesadas', t.total_procesadas, '#009DDD')}
          ${this._kpi('Personas nuevas', t.contactos_nuevos, '#10b981')}
          ${this._kpi('Personas actualizadas', t.contactos_actualizados, '#3b82f6')}
          ${this._kpi('Pólizas nuevas', t.polizas_nuevas, '#10b981')}
          ${this._kpi('Pólizas actualizadas', t.polizas_actualizadas, '#3b82f6')}
          ${this._kpi('Bajas detectadas', t.bajas_detectadas, '#ef4444')}
          ${this._kpi('DNIs extraídos de nombre', t.dnis_extraidos_de_nombre, '#8b5cf6')}
        </div>

        <h4 style="font-size:13px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px;">Desglose por mes</h4>
        <div class="table-wrapper">
          <table style="font-size:12px;">
            <thead><tr><th>Mes</th><th style="text-align:right">Filas</th><th style="text-align:right">Nuevas</th><th style="text-align:right">Actualizadas</th></tr></thead>
            <tbody>
              ${(t.desglose || []).map(d => `
                <tr>
                  <td style="font-weight:600;">${this._esc(d.mes)}</td>
                  <td style="text-align:right">${d.filas}</td>
                  <td style="text-align:right;color:#10b981;font-weight:600;">${d.nuevas}</td>
                  <td style="text-align:right;color:#3b82f6;">${d.actualizadas}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        ${t.errores.length > 0 ? `
          <h4 style="font-size:13px;font-weight:700;color:#ef4444;margin-top:16px;margin-bottom:8px;">Errores (${t.errores.length})</h4>
          <div style="max-height:200px;overflow-y:auto;background:#fef2f2;border-radius:8px;padding:10px;font-size:11px;font-family:monospace;">
            ${t.errores.slice(0, 50).map(e => `<div style="padding:2px 0;">${this._esc(e)}</div>`).join('')}
            ${t.errores.length > 50 ? `<div style="color:#94a3b8;">...y ${t.errores.length - 50} más</div>` : ''}
          </div>
        ` : ''}
      </div>
    `;
  },

  _kpi(label, value, color) {
    return `
      <div style="text-align:center;background:#f4f6f9;border-radius:10px;padding:14px 8px;">
        <div style="font-size:24px;font-weight:800;color:${color};">${value}</div>
        <div style="font-size:11px;font-weight:600;color:#94a3b8;margin-top:2px;">${label}</div>
      </div>
    `;
  },

  _esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; },
};
