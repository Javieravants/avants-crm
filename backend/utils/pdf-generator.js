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

// Tabla de regalos MásProtección
const REGALOS = [
  { pts: 500, premio: 'Baliza emergencia / Suscripción 3 meses', monedero: 50 },
  { pts: 1000, premio: 'Suscripción 6 meses plataforma', monedero: 100 },
  { pts: 1500, premio: 'Suscripción 1 año / Galaxy Buds3', monedero: 150 },
  { pts: 2000, premio: 'AirPods 4', monedero: 200 },
  { pts: 3000, premio: 'Apple Watch SE 3 / Tablet Samsung A11', monedero: 300 },
  { pts: 5000, premio: 'iPad WiFi 256GB', monedero: 500 },
  { pts: 7000, premio: 'Galaxy Watch Ultra', monedero: 700 },
  { pts: 10000, premio: 'iPhone 17 / Samsung Galaxy Z Flip7', monedero: 1000 },
];

// =============================================
// PDF PROPUESTA — Diseño aprobado
// =============================================
async function generarPDFPropuesta(propuesta) {
  const dir = path.join(UPLOADS, 'propuestas');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filename = `propuesta_${propuesta.id}.pdf`;
  const filepath = path.join(dir, filename);
  const pdfUrl = `/uploads/propuestas/${filename}`;

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const stream = fs.createWriteStream(filepath);
  doc.pipe(stream);

  const W = 515; // ancho útil
  const L = 40;  // margen izquierdo
  const R = L + W;
  const DARK = '#0088c4';
  const persona = propuesta._persona || {};
  const pts = propuesta.campana_puntos || 0;
  const fecha = new Date(propuesta.created_at || Date.now());

  // ── CABECERA ──
  doc.rect(L, 40, W, 50).fill(BLUE);
  doc.fontSize(24).fillColor('#fff').text('ADESLAS', L + 12, 48, { width: 300 });
  doc.fontSize(9).text('TGSSA, SL', L + 12, 72, { width: 200 });
  // Badge fecha
  doc.rect(R - 150, 48, 140, 20).fill('#fff');
  doc.fontSize(8).fillColor(BLUE).text(`Presupuesto / ${fecha.toLocaleDateString('es-ES')}`, R - 145, 53, { width: 130, align: 'center' });
  doc.y = 95;
  doc.fontSize(10).fillColor(BLUE).text('PRESUPUESTO — CAMPAÑA MÁSPROTECCIÓN · MARZO-JUNIO 2026', L, 95, { width: W, align: 'center' });
  doc.moveDown(0.8);

  // ── FRANJA CLIENTE ──
  const cy = doc.y;
  doc.rect(L, cy, W, 28).fill(DARK);
  doc.fontSize(9).fillColor('#fff');
  doc.text(`Cliente: ${persona.nombre || '—'}`, L + 10, cy + 6, { width: 180 });
  doc.text(`Tel: ${persona.telefono || '—'}`, L + 200, cy + 6, { width: 140 });
  doc.text(`Agente: ${propuesta._agente_nombre || '—'}`, L + 350, cy + 6, { width: 160 });
  doc.y = cy + 34;

  // ── TABLA PRODUCTOS ──
  doc.moveDown(0.3);
  const desglose = propuesta.desglose || {};
  const productos = Object.entries(desglose);

  if (productos.length > 0) {
    const th = doc.y;
    doc.rect(L, th, W, 18).fill(BLUE);
    doc.fontSize(8).fillColor('#fff');
    doc.text('Producto', L + 8, th + 4, { width: 220 });
    doc.text('Prima/mes', L + 280, th + 4, { width: 100, align: 'right' });
    doc.text('Puntos', L + 400, th + 4, { width: 80, align: 'right' });

    let y = th + 20;
    let totalPts = 0;
    productos.forEach(([nombre, data], i) => {
      const bg = i % 2 === 0 ? '#f4f6f9' : '#fff';
      doc.rect(L, y, W, 16).fill(bg);
      doc.fontSize(8).fillColor(GRAY);
      doc.text(nombre, L + 8, y + 3, { width: 260 });
      const mensual = typeof data === 'object' ? (data.mensual || data.prima || 0) : (data || 0);
      const prodPts = typeof data === 'object' ? (data.puntos || 0) : 0;
      totalPts += prodPts;
      doc.text(mensual ? mensual.toFixed(2) + ' €' : '-', L + 280, y + 3, { width: 100, align: 'right' });
      doc.text(prodPts ? prodPts + ' pts' : '-', L + 400, y + 3, { width: 80, align: 'right' });
      y += 16;
    });

    // Fila total
    doc.rect(L, y, W, 20).fill('#e6f6fd');
    doc.fontSize(9).fillColor(BLUE);
    doc.text('TOTAL', L + 8, y + 5);
    doc.text(parseFloat(propuesta.prima_mensual || 0).toFixed(2) + ' €/mes', L + 280, y + 5, { width: 100, align: 'right' });
    doc.text((pts || totalPts) + ' pts', L + 400, y + 5, { width: 80, align: 'right' });
    doc.y = y + 26;
  }

  // ── REGALOS ──
  if (pts > 0) {
    doc.moveDown(0.3);

    // Badge puntos
    doc.rect(L, doc.y, 120, 18).fill('#f59e0b');
    doc.fontSize(9).fillColor('#fff').text(pts + ' pts acumulados', L + 8, doc.y + 4, { width: 110 });
    doc.y += 22;

    // Mensaje motivacional
    const conseguido = REGALOS.filter(r => pts >= r.pts).pop();
    const siguiente = REGALOS.find(r => pts < r.pts);
    if (conseguido || siguiente) {
      doc.rect(L, doc.y, W, 36).fill('#fffbeb');
      const msgY = doc.y + 5;
      doc.fontSize(8).fillColor('#92400e');
      if (conseguido) doc.text(`Con tus seguros ya tienes: ${conseguido.premio}.`, L + 8, msgY, { width: W - 16 });
      if (siguiente) doc.text(`Con solo ${siguiente.pts - pts} pts mas consigues: ${siguiente.premio}. Anade Hogar, Auto u otro seguro.`, L + 8, msgY + (conseguido ? 12 : 0), { width: W - 16 });
      doc.y = msgY + 34;
    }

    // Tabla regalos
    doc.moveDown(0.3);
    const rth = doc.y;
    doc.rect(L, rth, W, 16).fill(BLUE);
    doc.fontSize(7).fillColor('#fff');
    doc.text('Premio (a elegir uno)', L + 8, rth + 3, { width: 230 });
    doc.text('Pts', L + 250, rth + 3, { width: 50, align: 'center' });
    doc.text('o Tarjeta monedero', L + 310, rth + 3, { width: 100, align: 'center' });
    doc.text('Estado', L + 420, rth + 3, { width: 90, align: 'center' });

    let ry = rth + 18;
    REGALOS.forEach((r, i) => {
      const achieved = pts >= r.pts;
      const close = !achieved && (r.pts - pts) <= 3000;
      const bg = achieved ? '#ecfdf5' : (i % 2 === 0 ? '#f9fafb' : '#fff');
      doc.rect(L, ry, W, 14).fill(bg);
      doc.fontSize(7).fillColor(achieved ? '#065f46' : close ? '#92400e' : LIGHT);
      doc.text(r.premio, L + 8, ry + 3, { width: 230 });
      doc.text(r.pts.toLocaleString('es-ES'), L + 250, ry + 3, { width: 50, align: 'center' });
      doc.text(r.monedero + ' €', L + 310, ry + 3, { width: 100, align: 'center' });
      doc.text(achieved ? 'Conseguido!' : close ? `Faltan ${r.pts - pts} pts` : '-', L + 420, ry + 3, { width: 90, align: 'center' });
      ry += 14;
    });
    doc.y = ry + 5;
  }

  // ── ASEGURADOS ──
  const asegurados = propuesta.asegurados_data || [];
  if (asegurados.length > 0) {
    doc.moveDown(0.3);
    doc.fontSize(9).fillColor(BLUE).text('ASEGURADOS');
    doc.moveDown(0.2);
    asegurados.forEach((a, i) => {
      doc.fontSize(8).fillColor(GRAY).text(`${i + 1}. ${a.nombre || ''}${a.fechaNac ? ' — ' + a.fechaNac : ''}${a.sexo ? ' (' + a.sexo + ')' : ''}`);
    });
  }

  // ── PIE ──
  doc.moveDown(1);
  doc.moveTo(L, doc.y).lineTo(R, doc.y).strokeColor(BLUE).lineWidth(0.5).stroke();
  doc.moveDown(0.4);
  doc.fontSize(7).fillColor(LIGHT).text('Hasta el 30/06/2026  ·  Sujeto a aceptacion por la compania', { align: 'center' });
  doc.fontSize(8).fillColor(GRAY).text(`TGSSA, SL · segurosdesaludonline.es · Agente: ${propuesta._agente_nombre || ''}`, { align: 'center' });
  doc.fontSize(7).fillColor(LIGHT).text('Los puntos se acumulan al contratar los seguros indicados. Tarjeta monedero: 10 EUR por cada 100 pts.', { align: 'center' });

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
