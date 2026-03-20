// === Avants Suite — Generador PDF Propuesta ADESLAS ===
// Usa jsPDF (cargado via CDN en calculadora/index.html y grabaciones/index.html)

const PDFPropuesta = {

  // Colores del CRM
  COLORS: {
    accent: [0, 157, 221],    // #009DDD
    accentDark: [0, 136, 194], // #0088c2
    dark: [15, 23, 42],       // #0f172a
    gray: [71, 85, 105],      // #475569
    light: [148, 163, 184],   // #94a3b8
    border: [232, 237, 242],  // #e8edf2
    bg: [244, 246, 249],      // #f4f6f9
    white: [255, 255, 255],
    green: [16, 185, 129],    // #10b981
    red: [239, 68, 68],       // #ef4444
    purple1: [102, 126, 234], // #667eea
    purple2: [118, 75, 162],  // #764ba2
    amber: [245, 158, 11],    // #f59e0b
  },

  // Generar PDF de propuesta
  generate(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    const W = 210, H = 297;
    const ML = 15, MR = 15;
    const CW = W - ML - MR;
    let y = 0;

    // === HEADER ===
    // Barra superior accent
    doc.setFillColor(...this.COLORS.accent);
    doc.rect(0, 0, W, 38, 'F');

    // Logo text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Avants Suite', ML, 16);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Correduría de Seguros', ML, 22);

    // Badge MásProtección
    doc.setFillColor(255, 255, 255, 0.2);
    doc.roundedRect(W - MR - 58, 8, 58, 16, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('ADESLAS MásProtección 2026', W - MR - 55, 18);

    // Fecha
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(data.fecha || new Date().toLocaleDateString('es-ES'), W - MR - 55, 26);

    y = 45;

    // === DATOS DEL CLIENTE ===
    doc.setFillColor(...this.COLORS.bg);
    doc.roundedRect(ML, y, CW, 30, 3, 3, 'F');
    doc.setDrawColor(...this.COLORS.border);
    doc.roundedRect(ML, y, CW, 30, 3, 3, 'S');

    doc.setTextColor(...this.COLORS.dark);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(data.clienteNombre || 'Cliente', ML + 5, y + 8);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...this.COLORS.gray);
    const clienteInfo = [
      data.clienteDNI ? `DNI: ${data.clienteDNI}` : '',
      data.clienteTelefono ? `Tel: ${data.clienteTelefono}` : '',
      data.clienteEmail || ''
    ].filter(Boolean).join('  ·  ');
    doc.text(clienteInfo, ML + 5, y + 14);

    if (data.clienteDireccion) {
      doc.text(data.clienteDireccion, ML + 5, y + 20);
    }

    // Agente
    doc.setTextColor(...this.COLORS.accent);
    doc.setFont('helvetica', 'bold');
    doc.text(`Agente: ${data.agente || '-'}`, ML + 5, y + 26);

    y += 36;

    // === ASEGURADOS ===
    if (data.asegurados && data.asegurados.length > 0) {
      doc.setTextColor(...this.COLORS.dark);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`ASEGURADOS (${data.asegurados.length})`, ML, y);
      y += 5;

      // Tabla de asegurados
      doc.setFillColor(...this.COLORS.accent);
      doc.rect(ML, y, CW, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      const cols = [0, 8, 68, 98, 128, 155];
      ['#', 'NOMBRE', 'DNI', 'F.NAC', 'SEXO', 'EDAD'].forEach((h, i) => {
        doc.text(h, ML + cols[i] + 2, y + 5);
      });
      y += 7;

      doc.setTextColor(...this.COLORS.dark);
      doc.setFont('helvetica', 'normal');
      data.asegurados.forEach((a, i) => {
        const bgColor = i % 2 === 0 ? this.COLORS.white : this.COLORS.bg;
        doc.setFillColor(...bgColor);
        doc.rect(ML, y, CW, 6, 'F');
        doc.setFontSize(7);
        const vals = [
          `${i + 1}`,
          (a.nombre || '').substring(0, 30),
          a.dni || '-',
          a.fechaNac || '-',
          a.sexo || '-',
          a.edad !== undefined ? `${a.edad} años` : '-'
        ];
        vals.forEach((v, j) => doc.text(v, ML + cols[j] + 2, y + 4));
        y += 6;
      });

      doc.setDrawColor(...this.COLORS.border);
      doc.line(ML, y, ML + CW, y);
      y += 6;
    }

    // === PRODUCTOS CONTRATADOS ===
    doc.setTextColor(...this.COLORS.dark);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('PRODUCTOS CONTRATADOS', ML, y);
    y += 6;

    (data.productos || []).forEach(p => {
      doc.setFillColor(...this.COLORS.bg);
      doc.roundedRect(ML, y, CW, 18, 2, 2, 'F');

      // Icono producto
      doc.setFillColor(...this.COLORS.accent);
      doc.roundedRect(ML + 3, y + 3, 12, 12, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text(p.icono || '🏥', ML + 5, y + 11);

      // Nombre producto
      doc.setTextColor(...this.COLORS.dark);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(p.nombre || 'Producto', ML + 18, y + 8);

      // Detalles
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...this.COLORS.gray);
      doc.text(p.detalle || '', ML + 18, y + 13);

      // Precio
      doc.setTextColor(...this.COLORS.accent);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${p.precioMensual || '0,00'} €/mes`, ML + CW - 35, y + 8);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...this.COLORS.gray);
      doc.text(`${p.precioAnual || '0,00'} €/año`, ML + CW - 35, y + 13);

      y += 22;
    });

    // === TOTAL ===
    doc.setFillColor(...this.COLORS.dark);
    doc.roundedRect(ML, y, CW, 16, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL MENSUAL', ML + 5, y + 7);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(`Prima anual: ${data.totalAnual || '0,00'} €`, ML + 5, y + 12);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`${data.totalMensual || '0,00'} €`, ML + CW - 40, y + 11);
    y += 22;

    // === DESCUENTOS ===
    if (data.descuentos) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...this.COLORS.gray);
      doc.text(`Descuento compañía: ${data.descuentos.compania || '-'}  |  Descuento opcional: ${data.descuentos.opcional || '-'}`, ML, y);
      y += 5;
      if (data.descuentos.campana) {
        doc.text(`Campaña: ${data.descuentos.campana}`, ML, y);
        y += 5;
      }
    }

    y += 3;

    // === PUNTOS CAMPAÑA ===
    if (data.puntos > 0) {
      // Gradient simulado (violeta)
      doc.setFillColor(...this.COLORS.purple1);
      doc.roundedRect(ML, y, CW / 2 - 2, 22, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.text('PUNTOS CAMPAÑA MÁSPROTECCIÓN', ML + 5, y + 6);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(`${data.puntos.toLocaleString('es-ES')} pts`, ML + 5, y + 17);

      // Regalo
      if (data.regalo) {
        doc.setFillColor(...this.COLORS.green);
        doc.roundedRect(ML + CW / 2 + 2, y, CW / 2 - 2, 22, 3, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text('REGALO DISPONIBLE', ML + CW / 2 + 7, y + 6);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(data.regalo, ML + CW / 2 + 7, y + 15);
      }
      y += 28;
    }

    // === COBERTURAS (placeholder) ===
    doc.setFillColor(...this.COLORS.bg);
    doc.roundedRect(ML, y, CW, 20, 2, 2, 'F');
    doc.setDrawColor(...this.COLORS.border);
    doc.roundedRect(ML, y, CW, 20, 2, 2, 'S');
    doc.setTextColor(...this.COLORS.dark);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('COBERTURAS', ML + 5, y + 7);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...this.COLORS.light);
    doc.text('Información de coberturas pendiente de completar.', ML + 5, y + 13);
    doc.text('Consulte las condiciones generales del producto contratado en adeslas.es', ML + 5, y + 17);
    y += 25;

    // === CARENCIAS (placeholder) ===
    doc.setFillColor(...this.COLORS.bg);
    doc.roundedRect(ML, y, CW, 16, 2, 2, 'F');
    doc.setDrawColor(...this.COLORS.border);
    doc.roundedRect(ML, y, CW, 16, 2, 2, 'S');
    doc.setTextColor(...this.COLORS.dark);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('CARENCIAS', ML + 5, y + 7);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...this.COLORS.light);
    doc.text('Las carencias varían según el producto. Consulte las condiciones particulares.', ML + 5, y + 13);
    y += 22;

    // === FOOTER ===
    const footerY = H - 25;
    doc.setDrawColor(...this.COLORS.border);
    doc.line(ML, footerY, ML + CW, footerY);

    doc.setFontSize(7);
    doc.setTextColor(...this.COLORS.light);
    doc.setFont('helvetica', 'normal');
    doc.text('Telegestion de Seguros y Soluciones Avants SL · CIF: B87654321', ML, footerY + 5);
    doc.text('C/ Ejemplo 123, 28001 Madrid · Tel: 900 000 000 · info@segurosdesaludonline.es', ML, footerY + 9);
    doc.text('Mediador de seguros inscrito en la DGSFP · Nº J-3456', ML, footerY + 13);

    doc.setTextColor(...this.COLORS.accent);
    doc.setFont('helvetica', 'bold');
    doc.text('www.segurosdesaludonline.es', ML + CW - 35, footerY + 5);

    doc.setTextColor(...this.COLORS.light);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generado con Avants Suite · ${new Date().toLocaleDateString('es-ES')}`, ML + CW - 50, footerY + 13);

    return doc;
  },

  // Descargar PDF
  download(data, filename) {
    const doc = this.generate(data);
    doc.save(filename || `Propuesta_ADESLAS_${(data.clienteNombre||'').replace(/\s/g,'_')}_${new Date().toISOString().slice(0,10)}.pdf`);
  },

  // Abrir en nueva pestaña
  preview(data) {
    const doc = this.generate(data);
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }
};
