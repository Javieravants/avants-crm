// === Avants Suite — PDF Propuesta ADESLAS ===
// Diseño corporativo minimalista: blanco, gris, #009DDD solo para acentos

const PDFPropuesta = {

  // jsPDF con helvetica no soporta UTF-8 completo.
  // Reemplazamos caracteres problemáticos por equivalentes ASCII seguros.
  _safe(text) {
    if (!text) return '';
    return String(text)
      .replace(/€/g, 'EUR')
      .replace(/·/g, '-')
      .replace(/ñ/g, 'n').replace(/Ñ/g, 'N')
      .replace(/á/g, 'a').replace(/Á/g, 'A')
      .replace(/é/g, 'e').replace(/É/g, 'E')
      .replace(/í/g, 'i').replace(/Í/g, 'I')
      .replace(/ó/g, 'o').replace(/Ó/g, 'O')
      .replace(/ú/g, 'u').replace(/Ú/g, 'U')
      .replace(/ü/g, 'u').replace(/Ü/g, 'U')
      .replace(/¡/g, '!').replace(/¿/g, '?')
      .replace(/º/g, 'o').replace(/ª/g, 'a');
  },

  generate(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const W = 210, ML = 18, MR = 18, CW = W - ML - MR;
    let y = 0;
    const s = this._safe.bind(this); // Shorthand

    const accent = [0, 157, 221];
    const black = [15, 23, 42];
    const gray = [120, 130, 145];
    const lightGray = [200, 205, 212];
    const lineColor = [220, 225, 232];

    // Helpers
    const line = (yy) => { doc.setDrawColor(...lineColor); doc.setLineWidth(0.3); doc.line(ML, yy, ML + CW, yy); };
    const label = (text, x, yy) => { doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...gray); doc.text(s(text).toUpperCase(), x, yy); };
    const val = (text, x, yy, bold) => { doc.setFontSize(10); doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setTextColor(...black); doc.text(s(text) || '-', x, yy); };
    const sectionTitle = (text, yy) => { doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...gray); doc.text(s(text).toUpperCase(), ML, yy); return yy + 5; };

    // ═══ HEADER ═══
    // Línea fina accent arriba
    doc.setFillColor(...accent);
    doc.rect(0, 0, W, 2, 'F');

    y = 14;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...black);
    doc.text('Avants Suite', ML, y);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text('Correduria de Seguros', ML, y + 5); // ASCII safe - no tildes

    // Derecha: título + ref + fecha
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...accent);
    doc.text('PRESUPUESTO ADESLAS', ML + CW, y, { align: 'right' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    const ref = data.referencia || `PRE-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
    doc.text(s(`Ref: ${ref}  -  ${data.fecha || new Date().toLocaleDateString('es-ES')}`), ML + CW, y + 5, { align: 'right' });

    y = 28;
    line(y);
    y += 7;

    // ═══ DATOS DEL SOLICITANTE ═══
    y = sectionTitle('Datos del solicitante', y);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...black);
    doc.text(s(data.clienteNombre || 'Sin nombre'), ML, y);
    y += 5;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    const datos = [
      data.clienteDNI,
      data.clienteTelefono,
      data.clienteEmail
    ].filter(Boolean).join('  -  ');
    if (datos) { doc.text(s(datos), ML, y); y += 4; }
    if (data.clienteDireccion) { doc.text(s(data.clienteDireccion), ML, y); y += 4; }
    if (data.agente) {
      doc.text(s(`Agente: ${data.agente}`), ML, y);
      y += 4;
    }

    y += 3;
    line(y);
    y += 7;

    // ═══ ASEGURADOS ═══
    if (data.asegurados && data.asegurados.length > 0) {
      y = sectionTitle(`Asegurados (${data.asegurados.length})`, y);

      // Cabecera tabla
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...gray);
      doc.text('#', ML, y);
      doc.text('NOMBRE', ML + 8, y);
      doc.text('EDAD', ML + 90, y);
      doc.text('SEXO', ML + 108, y);
      doc.text('ZONA', ML + 125, y);
      doc.text('PRECIO', ML + CW, y, { align: 'right' });
      y += 2;
      line(y);
      y += 4;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...black);
      data.asegurados.forEach((a, i) => {
        doc.setFontSize(8.5);
        doc.text(`${i + 1}`, ML, y);
        doc.text(s((a.nombre || '-').substring(0, 35)), ML + 8, y);
        doc.text(a.edad !== undefined ? `${a.edad} a.` : '-', ML + 90, y);
        doc.text(a.sexo || '-', ML + 108, y);
        doc.text(a.zona ? `Z${a.zona}` : '-', ML + 125, y);
        if (a.precio) {
          doc.setTextColor(...black);
          doc.text(s(`${a.precio} EUR`), ML + CW, y, { align: 'right' });
        }
        doc.setTextColor(...black);
        y += 5;
      });

      y += 2;
      line(y);
      y += 7;
    }

    // ═══ PRODUCTOS ═══
    y = sectionTitle('Productos', y);

    (data.productos || []).forEach(p => {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...black);
      doc.text(s(p.nombre || 'Producto'), ML, y);

      // Linea punteada hasta el precio
      const nameWidth = doc.getTextWidth(s(p.nombre || 'Producto'));
      const priceStr = `${p.precioMensual || '0,00'} EUR/mes`;
      const priceWidth = doc.getTextWidth(priceStr);
      const dotsStart = ML + nameWidth + 3;
      const dotsEnd = ML + CW - priceWidth - 3;
      doc.setTextColor(...lightGray);
      doc.setFontSize(9);
      let dotX = dotsStart;
      while (dotX < dotsEnd) { doc.text('.', dotX, y); dotX += 1.5; }

      doc.setTextColor(...black);
      doc.setFont('helvetica', 'bold');
      doc.text(priceStr, ML + CW, y, { align: 'right' });

      if (p.detalle) {
        y += 4;
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...gray);
        doc.text(s(p.detalle), ML + 3, y);
      }

      y += 6;
    });

    // Línea separadora antes del total
    y += 1;
    doc.setDrawColor(...accent);
    doc.setLineWidth(0.5);
    doc.line(ML, y, ML + CW, y);
    y += 6;

    // TOTAL
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...black);
    doc.text('TOTAL MENSUAL', ML, y);

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...accent);
    doc.text(`${data.totalMensual || '0,00'} EUR`, ML + CW, y, { align: 'right' });
    y += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text('TOTAL ANUAL', ML, y);
    doc.setTextColor(...black);
    doc.setFont('helvetica', 'bold');
    doc.text(`${data.totalAnual || '0,00'} EUR`, ML + CW, y, { align: 'right' });

    y += 4;
    if (data.descuentos) {
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...gray);
      const descLine = [
        data.descuentos.compania ? `Dto. compania: ${data.descuentos.compania}` : '',
        data.descuentos.opcional ? `Dto. opcional: ${data.descuentos.opcional}` : '',
        data.descuentos.campana || ''
      ].filter(Boolean).join('  -  ');
      if (descLine) { doc.text(s(descLine), ML, y); y += 4; }
    }

    y += 3;
    line(y);
    y += 7;

    // ═══ CAMPANA MASPROTECCION ═══
    if (data.puntos > 0) {
      y = sectionTitle('Campana MasProteccion 2026', y);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...black);
      doc.text(s(`Puntos acumulados: ${data.puntos.toLocaleString('es-ES')} pts`), ML, y);
      y += 5;

      if (data.regalo) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...accent);
        doc.text(s(`Premio disponible: ${data.regalo}`), ML, y);
        y += 5;
      }

      y += 2;
      line(y);
      y += 7;
    }

    // ═══ COBERTURAS + CARENCIAS (2 columnas) ═══
    const halfW = CW / 2 - 3;

    y = sectionTitle('Coberturas', y);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text('Informacion de coberturas pendiente', ML, y);
    doc.text('de completar. Consulte las condiciones', ML, y + 4);
    doc.text('generales en adeslas.es', ML, y + 8);

    // Carencias a la derecha
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...gray);
    doc.text('CARENCIAS', ML + halfW + 6, y - 5);
    doc.setFont('helvetica', 'normal');
    doc.text('Las carencias varian segun el producto.', ML + halfW + 6, y);
    doc.text('Consulte las condiciones particulares', ML + halfW + 6, y + 4);
    doc.text('de su poliza.', ML + halfW + 6, y + 8);

    y += 16;
    line(y);

    // ═══ FOOTER ═══
    const footerY = 280;
    doc.setDrawColor(...lineColor);
    doc.setLineWidth(0.2);
    doc.line(ML, footerY, ML + CW, footerY);

    doc.setFontSize(7);
    doc.setTextColor(...gray);
    doc.setFont('helvetica', 'normal');
    doc.text('Telegestion de Seguros y Soluciones Avants SL  -  CIF: B88350875  -  Tel: 911 989 456', ML, footerY + 4);
    doc.text('Mediador de seguros inscrito en la DGSFP  -  www.segurosdesaludonline.es', ML, footerY + 8);

    doc.setTextColor(...accent);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(`Ref: ${ref}`, ML + CW, footerY + 4, { align: 'right' });
    doc.setTextColor(...gray);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, ML + CW, footerY + 8, { align: 'right' });

    // Numero de pagina si hay mas de 1
    const totalPages = doc.internal.getNumberOfPages();
    if (totalPages > 1) {
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(...gray);
        doc.text(`Pagina ${i} de ${totalPages}`, W / 2, 290, { align: 'center' });
      }
    }

    return doc;
  },

  download(data, filename) {
    const doc = this.generate(data);
    const ref = data.referencia || `PRE-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
    doc.save(filename || `${ref}_${(data.clienteNombre||'').replace(/\s/g,'_')}.pdf`);
  },

  preview(data) {
    const doc = this.generate(data);
    window.open(URL.createObjectURL(doc.output('blob')), '_blank');
  }
};
