/**
 * Generador de PDFs — Propuestas y Grabaciones
 */
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const UPLOADS = path.join(__dirname, '../../uploads');
const BLUE = '#009DDD';
const GRAY = '#475569';
const LIGHT = '#94a3b8';

// =============================================
// PDF PROPUESTA
// =============================================
async function generarPDFPropuesta(propuesta) {
  const dir = path.join(UPLOADS, 'propuestas');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filename = `propuesta_${propuesta.id}.pdf`;
  const filepath = path.join(dir, filename);
  const pdfUrl = `/uploads/propuestas/${filename}`;

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const stream = fs.createWriteStream(filepath);
  doc.pipe(stream);

  // Cabecera
  doc.fontSize(20).fillColor(BLUE).text('PROPUESTA ADESLAS', { align: 'center' });
  doc.fontSize(11).fillColor(LIGHT).text('Campaña MásProtección', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor(GRAY).text(`Fecha: ${new Date(propuesta.created_at || Date.now()).toLocaleDateString('es-ES')}`, { align: 'right' });
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e8edf2').stroke();
  doc.moveDown(0.8);

  // Datos contacto
  doc.fontSize(12).fillColor(BLUE).text('DATOS DEL CONTACTO');
  doc.moveDown(0.3);
  const persona = propuesta._persona || {};
  const fields = [
    ['Nombre', persona.nombre],
    ['Fecha nacimiento', persona.fecha_nacimiento ? new Date(persona.fecha_nacimiento).toLocaleDateString('es-ES') : null],
    ['Provincia', propuesta.provincia || persona.provincia],
    ['Localidad', persona.localidad],
    ['Teléfono', persona.telefono],
    ['Email', persona.email],
  ].filter(([, v]) => v);

  fields.forEach(([label, val]) => {
    doc.fontSize(9).fillColor(LIGHT).text(label + ': ', { continued: true });
    doc.fillColor(GRAY).text(String(val));
  });
  doc.moveDown(0.8);

  // Tabla de productos
  doc.fontSize(12).fillColor(BLUE).text('PRODUCTOS SELECCIONADOS');
  doc.moveDown(0.5);

  const desglose = propuesta.desglose || {};
  const productos = Object.entries(desglose);

  if (productos.length > 0) {
    // Header tabla
    const tableTop = doc.y;
    doc.fontSize(9).fillColor('#fff');
    doc.rect(50, tableTop, 495, 20).fill(BLUE);
    doc.text('Producto', 60, tableTop + 5, { width: 200 });
    doc.text('Aseg.', 270, tableTop + 5, { width: 60, align: 'center' });
    doc.text('Prima/mes', 340, tableTop + 5, { width: 100, align: 'right' });
    doc.text('Prima/año', 440, tableTop + 5, { width: 100, align: 'right' });

    let y = tableTop + 22;
    productos.forEach(([nombre, data], i) => {
      const bg = i % 2 === 0 ? '#f4f6f9' : '#fff';
      doc.rect(50, y, 495, 18).fill(bg);
      doc.fontSize(9).fillColor(GRAY);
      doc.text(nombre, 60, y + 4, { width: 200 });
      doc.text(String(propuesta.num_asegurados || 1), 270, y + 4, { width: 60, align: 'center' });
      const mensual = typeof data === 'object' ? data.mensual || data.prima : data;
      const anual = typeof data === 'object' ? data.anual || (mensual * 12) : (data * 12);
      doc.text(mensual ? mensual.toFixed(2) + ' €' : '-', 340, y + 4, { width: 100, align: 'right' });
      doc.text(anual ? anual.toFixed(2) + ' €' : '-', 440, y + 4, { width: 100, align: 'right' });
      y += 18;
    });
    doc.y = y + 5;
  }

  doc.moveDown(0.5);

  // Totales
  doc.rect(50, doc.y, 495, 36).fill('#e6f6fd');
  const totY = doc.y + 6;
  doc.fontSize(14).fillColor(BLUE);
  doc.text(`TOTAL MENSUAL: ${parseFloat(propuesta.prima_mensual || 0).toFixed(2)} €`, 60, totY);
  doc.text(`TOTAL ANUAL: ${parseFloat(propuesta.prima_anual || 0).toFixed(2)} €`, 300, totY, { width: 240, align: 'right' });
  doc.y = totY + 30;
  doc.moveDown(0.5);

  // Puntos campaña
  if (propuesta.campana_puntos > 0) {
    doc.fontSize(10).fillColor('#8b5cf6').text(`Puntos Campaña: ${propuesta.campana_puntos} pts`);

    const pts = propuesta.campana_puntos;
    let regalo = '';
    if (pts >= 6000) regalo = 'Aspirador Dyson V8';
    else if (pts >= 4000) regalo = 'Apple Watch SE';
    else if (pts >= 3000) regalo = 'AirPods Pro';
    else if (pts >= 2000) regalo = 'Tarjeta Amazon 50€';
    else if (pts >= 1000) regalo = 'Tarjeta Amazon 25€';
    if (regalo) doc.fillColor('#10b981').text(`Regalo disponible: ${regalo}`);
    doc.moveDown(0.5);
  }

  // Asegurados
  const asegurados = propuesta.asegurados_data || [];
  if (asegurados.length > 0) {
    doc.fontSize(11).fillColor(BLUE).text('ASEGURADOS');
    doc.moveDown(0.3);
    asegurados.forEach((a, i) => {
      doc.fontSize(9).fillColor(GRAY);
      doc.text(`${i + 1}. ${a.nombre || 'Sin nombre'}${a.fechaNac ? ' — ' + a.fechaNac : ''}${a.sexo ? ' — ' + a.sexo : ''}`);
    });
    doc.moveDown(0.5);
  }

  // Pie
  doc.moveDown(1);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e8edf2').stroke();
  doc.moveDown(0.5);
  const validoHasta = new Date();
  validoHasta.setDate(validoHasta.getDate() + 30);
  doc.fontSize(8).fillColor(LIGHT).text(`Válido hasta: ${validoHasta.toLocaleDateString('es-ES')}`, { align: 'center' });
  doc.text('Avants Suite — CRM de Seguros', { align: 'center' });

  doc.end();
  await new Promise(resolve => stream.on('finish', resolve));

  return pdfUrl;
}

// =============================================
// PDF GRABACIÓN
// =============================================
async function generarPDFGrabacion(data) {
  const dir = path.join(UPLOADS, 'grabaciones');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filename = `grabacion_${data.deal_id}.pdf`;
  const filepath = path.join(dir, filename);
  const pdfUrl = `/uploads/grabaciones/${filename}`;

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const stream = fs.createWriteStream(filepath);
  doc.pipe(stream);

  const line = (label, value) => {
    if (!value) return;
    doc.fontSize(10).fillColor(LIGHT).text(label + ': ', { continued: true });
    doc.fillColor(GRAY).text(String(value));
  };

  const section = (title) => {
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor(BLUE).text(`── ${title} ──`);
    doc.moveDown(0.3);
  };

  // Cabecera
  doc.rect(50, 50, 495, 40).fill(BLUE);
  doc.fontSize(16).fillColor('#fff').text('GRABACIÓN PÓLIZA ADESLAS', 60, 60, { width: 475, align: 'center' });
  doc.y = 100;
  doc.moveDown(0.5);

  // Datos póliza
  line('TIPO', data.tipo_poliza);
  line('FECHA', new Date().toLocaleDateString('es-ES'));
  line('PRECIO', data.prima ? data.prima + '€/MENSUAL' : '-');
  line('EFECTO', data.fecha_efecto ? new Date(data.fecha_efecto).toLocaleDateString('es-ES') : '-');
  line('SOLICITUD', data.num_solicitud || '-');
  line('NÚM PÓLIZA', data.poliza || '-');
  line('COMPAÑÍA', data.compania || 'ADESLAS');
  line('AGENTE', data.agente_nombre || '-');
  if (data.campana) line('CAMPAÑA', data.campana);

  // Tomador
  section('TOMADOR');
  line('NOMBRE', data.nombre);
  line('DNI', data.dni);
  line('FECHA NAC', data.fecha_nacimiento ? new Date(data.fecha_nacimiento).toLocaleDateString('es-ES') : '-');
  line('SEXO', data.sexo);
  line('TELÉFONO', data.telefono);
  line('EMAIL', data.email);
  line('DIRECCIÓN', data.direccion);
  line('CP', data.codigo_postal);
  line('LOCALIDAD', data.localidad);
  line('PROVINCIA', data.provincia);
  line('IBAN', data.iban);

  // Mascotas
  const mascotas = data.datos_especificos?.mascotas || [];
  if (mascotas.length > 0) {
    mascotas.forEach((m, i) => {
      section(`MASCOTA ${i + 1}`);
      line('NOMBRE', m.nombre);
      line('TIPO', m.tipo);
      line('RAZA', m.raza);
      line('FECHA NAC', m.fecha_nac);
      line('CHIP', m.chip);
    });
  }

  // Asegurados
  const asegurados = data.asegurados || [];
  if (asegurados.length > 0 && mascotas.length === 0) {
    asegurados.forEach((a, i) => {
      section(`ASEGURADO ${i + 1}`);
      line('NOMBRE', a.nombre);
      line('DNI', a.dni);
      line('FECHA NAC', a.fecha_nac);
      line('SEXO', a.sexo);
      line('PARENTESCO', a.parentesco);
    });
  }

  // Pie
  doc.moveDown(1);
  doc.rect(50, doc.y, 495, 30).fill('#f4f6f9');
  doc.fontSize(10).fillColor(BLUE).text('══ FIN GRABACIÓN ══', 60, doc.y + 8, { width: 475, align: 'center' });

  doc.end();
  await new Promise(resolve => stream.on('finish', resolve));

  return pdfUrl;
}

module.exports = { generarPDFPropuesta, generarPDFGrabacion };
