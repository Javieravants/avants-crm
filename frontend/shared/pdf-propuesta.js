// === Gestavly — PDF Propuesta ADESLAS ===
// Usa html2canvas + jsPDF para renderizar UTF-8 perfecto

const PDFPropuesta = {

  _buildHTML(data) {
    const ref = data.referencia || `PRE-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
    const fecha = data.fecha || new Date().toLocaleDateString('es-ES');

    const asegRows = (data.asegurados || []).map((a, i) =>
      `<tr style="${i%2===0?'':'background:#f8f9fb'}">
        <td style="padding:5px 8px;font-size:9px;color:#788291">${i+1}</td>
        <td style="padding:5px 8px;font-size:9px;font-weight:600">${a.nombre||'-'}</td>
        <td style="padding:5px 8px;font-size:9px">${a.edad!==undefined?a.edad+' años':'-'}</td>
        <td style="padding:5px 8px;font-size:9px">${a.sexo||'-'}</td>
        <td style="padding:5px 8px;font-size:9px">${a.zona?'Z'+a.zona:'-'}</td>
        <td style="padding:5px 8px;font-size:9px;text-align:right;font-weight:600">${a.precio?a.precio+' €':''}</td>
      </tr>`
    ).join('');

    const prodRows = (data.productos || []).map(p =>
      `<div style="display:flex;justify-content:space-between;align-items:baseline;padding:4px 0;border-bottom:1px dotted #dce1e8">
        <div>
          <span style="font-size:10px">${p.nombre||'Producto'}</span>
          ${p.detalle?`<div style="font-size:7.5px;color:#788291;margin-top:1px;padding-left:3px">${p.detalle}</div>`:''}
        </div>
        <span style="font-size:10px;font-weight:700;white-space:nowrap;margin-left:12px">${p.precioMensual||'0,00'} €/mes</span>
      </div>`
    ).join('');

    const descLine = [
      data.descuentos?.compania ? `Dto. compañía: ${data.descuentos.compania}` : '',
      data.descuentos?.opcional ? `Dto. opcional: ${data.descuentos.opcional}` : '',
      data.descuentos?.campana || ''
    ].filter(Boolean).join('  ·  ');

    let regalo = '';
    if (data.puntos >= 6000) regalo = 'Aspirador Dyson V8';
    else if (data.puntos >= 4000) regalo = 'Apple Watch SE';
    else if (data.puntos >= 3000) regalo = 'AirPods Pro';
    else if (data.puntos >= 2000) regalo = 'Tarjeta Amazon 50€';
    else if (data.puntos >= 1000) regalo = 'Tarjeta Amazon 25€';
    if (data.regalo) regalo = data.regalo;

    return `
    <div id="pdf-root" style="width:794px;padding:0;margin:0;font-family:'Inter','Helvetica Neue',Arial,sans-serif;color:#0f172a;background:#fff;line-height:1.4">

      <!-- Accent bar -->
      <div style="height:6px;background:#009DDD"></div>

      <!-- Header -->
      <div style="padding:20px 32px 16px;display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <div style="font-size:18px;font-weight:800;letter-spacing:-0.3px">Gestavly</div>
          <div style="font-size:9px;color:#788291">Correduría de Seguros</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:16px;font-weight:800;color:#009DDD">PRESUPUESTO ADESLAS</div>
          <div style="font-size:8.5px;color:#788291">Ref: ${ref}  ·  ${fecha}</div>
        </div>
      </div>

      <div style="height:1px;background:#dce1e8;margin:0 32px"></div>

      <!-- Cliente -->
      <div style="padding:14px 32px">
        <div style="font-size:8px;font-weight:700;color:#788291;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px">Datos del solicitante</div>
        <div style="font-size:12px;font-weight:700">${data.clienteNombre||'Sin nombre'}</div>
        <div style="font-size:9px;color:#788291;margin-top:2px">${[data.clienteDNI,data.clienteTelefono,data.clienteEmail].filter(Boolean).join('  ·  ')}</div>
        ${data.clienteDireccion?`<div style="font-size:9px;color:#788291">${data.clienteDireccion}</div>`:''}
        ${data.agente?`<div style="font-size:9px;color:#009DDD;font-weight:600;margin-top:3px">Agente: ${data.agente}</div>`:''}
      </div>

      <div style="height:1px;background:#dce1e8;margin:0 32px"></div>

      <!-- Asegurados -->
      ${(data.asegurados&&data.asegurados.length>0)?`
      <div style="padding:14px 32px">
        <div style="font-size:8px;font-weight:700;color:#788291;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px">Asegurados (${data.asegurados.length})</div>
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="border-bottom:1px solid #dce1e8">
              <th style="padding:5px 8px;font-size:7.5px;font-weight:700;color:#788291;text-align:left">#</th>
              <th style="padding:5px 8px;font-size:7.5px;font-weight:700;color:#788291;text-align:left">NOMBRE</th>
              <th style="padding:5px 8px;font-size:7.5px;font-weight:700;color:#788291;text-align:left">EDAD</th>
              <th style="padding:5px 8px;font-size:7.5px;font-weight:700;color:#788291;text-align:left">SEXO</th>
              <th style="padding:5px 8px;font-size:7.5px;font-weight:700;color:#788291;text-align:left">ZONA</th>
              <th style="padding:5px 8px;font-size:7.5px;font-weight:700;color:#788291;text-align:right">PRECIO</th>
            </tr>
          </thead>
          <tbody>${asegRows}</tbody>
        </table>
      </div>
      <div style="height:1px;background:#dce1e8;margin:0 32px"></div>
      `:''}

      <!-- Productos -->
      <div style="padding:14px 32px">
        <div style="font-size:8px;font-weight:700;color:#788291;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px">Productos</div>
        ${prodRows}
      </div>

      <!-- Total -->
      <div style="margin:4px 32px;padding:12px 16px;background:#0f172a;border-radius:6px;display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-size:11px;font-weight:700;color:#fff">TOTAL MENSUAL</div>
          <div style="font-size:8px;color:#94a3b8">Total anual: ${data.totalAnual||'0,00'} €</div>
        </div>
        <div style="font-size:22px;font-weight:800;color:#009DDD">${data.totalMensual||'0,00'} €</div>
      </div>

      ${descLine?`<div style="padding:6px 32px;font-size:7.5px;color:#788291">${descLine}</div>`:''}

      <div style="height:1px;background:#dce1e8;margin:8px 32px"></div>

      <!-- Campaña -->
      ${data.puntos>0?`
      <div style="padding:14px 32px;display:flex;gap:12px">
        <div style="flex:1;padding:10px 14px;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:6px;color:#fff">
          <div style="font-size:7.5px;opacity:0.85;text-transform:uppercase;letter-spacing:0.5px">Campaña MásProtección 2026</div>
          <div style="font-size:20px;font-weight:800;margin-top:4px">${data.puntos.toLocaleString('es-ES')} pts</div>
        </div>
        ${regalo?`
        <div style="flex:1;padding:10px 14px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:6px">
          <div style="font-size:7.5px;color:#059669;text-transform:uppercase;letter-spacing:0.5px;font-weight:700">Premio disponible</div>
          <div style="font-size:14px;font-weight:800;color:#059669;margin-top:4px">${regalo}</div>
        </div>`:''}
      </div>
      <div style="height:1px;background:#dce1e8;margin:0 32px"></div>
      `:''}

      <!-- Coberturas + Carencias -->
      <div style="padding:14px 32px;display:flex;gap:24px">
        <div style="flex:1">
          <div style="font-size:8px;font-weight:700;color:#788291;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px">Coberturas</div>
          <div style="font-size:8px;color:#94a3b8;line-height:1.5">Información de coberturas pendiente de completar. Consulte las condiciones generales del producto contratado en adeslas.es</div>
        </div>
        <div style="flex:1">
          <div style="font-size:8px;font-weight:700;color:#788291;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px">Carencias</div>
          <div style="font-size:8px;color:#94a3b8;line-height:1.5">Las carencias varían según el producto. Consulte las condiciones particulares de su póliza.</div>
        </div>
      </div>

      <div style="height:1px;background:#dce1e8;margin:0 32px"></div>

      <!-- Footer -->
      <div style="padding:12px 32px;display:flex;justify-content:space-between">
        <div style="font-size:7px;color:#94a3b8;line-height:1.6">
          Telegestion de Seguros y Soluciones Avants SL  ·  CIF: B88350875  ·  Tel: 911 989 456<br>
          Mediador de seguros inscrito en la DGSFP  ·  www.segurosdesaludonline.es
        </div>
        <div style="text-align:right;font-size:7px;color:#94a3b8;line-height:1.6">
          <span style="color:#009DDD;font-weight:700">Ref: ${ref}</span><br>
          Generado: ${new Date().toLocaleDateString('es-ES')}
        </div>
      </div>

    </div>`;
  },

  async generate(data) {
    // Crear contenedor temporal oculto
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1';
    container.innerHTML = this._buildHTML(data);
    document.body.appendChild(container);

    const root = container.querySelector('#pdf-root');

    // Renderizar con html2canvas
    const canvas = await html2canvas(root, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: 794,
      windowWidth: 794
    });

    document.body.removeChild(container);

    // Convertir a PDF con jsPDF
    const { jsPDF } = window.jspdf;
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const imgW = 210; // A4 width mm
    const imgH = (canvas.height * imgW) / canvas.width;

    const doc = new jsPDF('p', 'mm', 'a4');
    let yOffset = 0;
    const pageH = 297;

    // Si cabe en 1 página
    if (imgH <= pageH) {
      doc.addImage(imgData, 'JPEG', 0, 0, imgW, imgH);
    } else {
      // Multi-página
      let remainH = imgH;
      let page = 0;
      while (remainH > 0) {
        if (page > 0) doc.addPage();
        // Crop del canvas para esta página
        const srcY = (page * pageH / imgH) * canvas.height;
        const srcH = Math.min((pageH / imgH) * canvas.height, canvas.height - srcY);
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = canvas.width;
        cropCanvas.height = srcH;
        cropCanvas.getContext('2d').drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
        const cropData = cropCanvas.toDataURL('image/jpeg', 0.95);
        const cropH = (srcH * imgW) / canvas.width;
        doc.addImage(cropData, 'JPEG', 0, 0, imgW, cropH);
        remainH -= pageH;
        page++;
      }
      // Números de página
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(`Pagina ${i} de ${totalPages}`, 105, 292, { align: 'center' });
      }
    }

    return doc;
  },

  async download(data, filename) {
    const doc = await this.generate(data);
    const ref = data.referencia || `PRE-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
    doc.save(filename || `${ref}_${(data.clienteNombre||'').replace(/\s/g,'_')}.pdf`);
  },

  async preview(data) {
    const doc = await this.generate(data);
    window.open(URL.createObjectURL(doc.output('blob')), '_blank');
  }
};
