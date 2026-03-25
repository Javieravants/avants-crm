/**
 * Generador de PDFs — Propuestas y Grabaciones
 */
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const UPLOADS = path.join(__dirname, '../../uploads');

// Colores
const BLUE = '#009DDD';
const DARK_BLUE = '#0088C4';
const GRAY = '#475569';
const LIGHT = '#94a3b8';
const ORANGE = '#ff9800';
const GREEN = '#2e7d32';
const GREEN_BG = '#f0fff4';

// Tabla de regalos MásProtección
const REGALOS = [
  { pts: 500, premio: 'Baliza emergencia / Suscripción 3 meses' },
  { pts: 1000, premio: 'Suscripción 6 meses plataforma' },
  { pts: 1500, premio: 'Suscripción 1 año / Galaxy Buds3' },
  { pts: 2000, premio: 'AirPods 4' },
  { pts: 3000, premio: 'Apple Watch SE 3 / Tablet Samsung A11' },
  { pts: 5000, premio: 'iPad WiFi 256GB' },
  { pts: 7000, premio: 'Galaxy Watch Ultra' },
  { pts: 10000, premio: 'iPhone 17 / Samsung Galaxy Z Flip7' },
];

// Colores de badges por tipo de producto
const TIPO_COLORS = {
  SALUD: { bg: '#e6f4fb', text: '#0077aa' },
  DENTAL: { bg: '#e8f5e9', text: '#2e7d32' },
  MASCOTAS: { bg: '#fff3e0', text: '#b36000' },
  DECESOS: { bg: '#f0f0f0', text: '#555555' },
};

// =============================================
// PDF PROPUESTA — Diseño aprobado completo
// =============================================
async function generarPDFPropuesta(propuesta) {
  const dir = path.join(UPLOADS, 'propuestas');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filename = `propuesta_${propuesta.id}.pdf`;
  const filepath = path.join(dir, filename);
  const pdfUrl = `/uploads/propuestas/${filename}`;

  const doc = new PDFDocument({ size: 'A4', margins: { top: 30, bottom: 30, left: 40, right: 40 } });
  const stream = fs.createWriteStream(filepath);
  doc.pipe(stream);

  const L = 40;
  const W = 515;
  const R = L + W;
  const persona = propuesta._persona || {};
  const agente = propuesta._agente_nombre || '';
  const pts = parseInt(propuesta.campana_puntos) || 0;
  const fecha = new Date(propuesta.created_at || Date.now());
  const fechaStr = fecha.toLocaleDateString('es-ES');
  const totalMensual = parseFloat(propuesta.prima_mensual) || 0;

  // ═══════════════════════════════════════
  // SECCIÓN 1 — CABECERA
  // ═══════════════════════════════════════
  doc.rect(L, 30, W, 100).fill(BLUE);

  // ADESLAS logo text
  doc.fontSize(28).fillColor('#fff').text('ADESLAS', L + 16, 40);
  doc.fontSize(11).fillColor('rgba(255,255,255,0.8)').text('TGSSA, SL', L + 16, 72);

  // Badge fecha (rectángulo blanco semitransparente)
  doc.rect(R - 145, 40, 135, 38).fill('rgba(255,255,255,0.15)');
  doc.rect(R - 145, 40, 135, 38).strokeColor('rgba(255,255,255,0.3)').lineWidth(0.5).stroke();
  doc.fontSize(9).fillColor('rgba(255,255,255,0.7)').text('PRESUPUESTO', R - 140, 46, { width: 125, align: 'center' });
  doc.fontSize(13).fillColor('#fff').text(fechaStr, R - 140, 58, { width: 125, align: 'center' });

  // Título campaña
  doc.fontSize(10).fillColor('#fff').text(
    'PRESUPUESTO — CAMPAÑA MÁSPROTECCIÓN · MARZO-JUNIO 2026',
    L + 16, 100, { width: W - 32, align: 'center' }
  );

  doc.y = 138;

  // ═══════════════════════════════════════
  // SECCIÓN 2 — FRANJA CLIENTE
  // ═══════════════════════════════════════
  const fy = doc.y;
  doc.rect(L, fy, W, 45).fill(DARK_BLUE);

  const colW = W / 3;
  const labelStyle = { fillColor: 'rgba(255,255,255,0.6)' };

  // Cliente
  doc.fontSize(8).fillColor('rgba(255,255,255,0.6)').text('CLIENTE', L + 12, fy + 8);
  doc.fontSize(12).fillColor('#fff').text(persona.nombre || '—', L + 12, fy + 20, { width: colW - 20 });

  // Teléfono
  doc.fontSize(8).fillColor('rgba(255,255,255,0.6)').text('TELÉFONO', L + colW + 12, fy + 8);
  doc.fontSize(12).fillColor('#fff').text(persona.telefono || '—', L + colW + 12, fy + 20, { width: colW - 20 });

  // Agente
  doc.fontSize(8).fillColor('rgba(255,255,255,0.6)').text('AGENTE', L + colW * 2 + 12, fy + 8);
  doc.fontSize(12).fillColor('#fff').text(agente || '—', L + colW * 2 + 12, fy + 20, { width: colW - 20 });

  doc.y = fy + 55;

  // ═══════════════════════════════════════
  // SECCIÓN 3 — TABLA DE PRODUCTOS
  // ═══════════════════════════════════════
  doc.fontSize(10).fillColor(BLUE).text('PRODUCTOS PRESUPUESTADOS', L, doc.y);
  doc.moveTo(L, doc.y + 2).lineTo(R, doc.y + 2).strokeColor(BLUE).lineWidth(1).stroke();
  doc.moveDown(0.6);

  const desglose = propuesta.desglose || {};
  const productos = Object.entries(desglose);

  if (productos.length > 0) {
    // Cabecera tabla
    const th = doc.y;
    doc.rect(L, th, W, 22).fill('#f8f9fa');
    doc.moveTo(L, th + 22).lineTo(R, th + 22).strokeColor('#e0e0e0').lineWidth(0.5).stroke();
    doc.fontSize(8).fillColor(LIGHT);
    doc.text('Producto', L + 10, th + 6, { width: 200 });
    doc.text('Modalidad', L + 220, th + 6, { width: 100, align: 'center' });
    doc.text('Prima/mes', L + 330, th + 6, { width: 80, align: 'right' });
    doc.text('Puntos', L + 430, th + 6, { width: 75, align: 'right' });

    let y = th + 24;
    let totalPts = 0;

    productos.forEach(([nombre, data], i) => {
      const rowH = 28;
      const bg = i % 2 === 0 ? '#ffffff' : '#fafafa';
      doc.rect(L, y, W, rowH).fill(bg);
      doc.moveTo(L, y + rowH).lineTo(R, y + rowH).strokeColor('#f0f0f0').lineWidth(0.3).stroke();

      const mensual = typeof data === 'object' ? (data.mensual || data.prima || 0) : (data || 0);
      const prodPts = typeof data === 'object' ? (data.puntos || 0) : 0;
      totalPts += prodPts;

      // Producto nombre
      doc.fontSize(10).fillColor('#0f172a').text(nombre, L + 10, y + 5, { width: 195 });

      // Badge modalidad
      const tipo = nombre.toUpperCase().includes('SALUD') ? 'SALUD' :
                   nombre.toUpperCase().includes('DENTAL') ? 'DENTAL' :
                   nombre.toUpperCase().includes('MASCOTA') ? 'MASCOTAS' :
                   nombre.toUpperCase().includes('DECESO') ? 'DECESOS' : 'SALUD';
      const tc = TIPO_COLORS[tipo] || TIPO_COLORS.SALUD;
      const badgeW = 70;
      doc.rect(L + 225, y + 6, badgeW, 16).fill(tc.bg);
      doc.fontSize(7).fillColor(tc.text).text(tipo, L + 225, y + 10, { width: badgeW, align: 'center' });

      // Prima
      doc.fontSize(11).fillColor(BLUE).text(
        mensual ? mensual.toFixed(2) + ' €' : '—',
        L + 330, y + 7, { width: 80, align: 'right' }
      );

      // Puntos
      doc.fontSize(10).fillColor(ORANGE).text(
        prodPts ? prodPts + ' pts' : '—',
        L + 430, y + 7, { width: 75, align: 'right' }
      );

      y += rowH;
    });

    // Fila TOTAL
    doc.moveTo(L, y).lineTo(R, y).strokeColor(BLUE).lineWidth(1).stroke();
    doc.rect(L, y + 1, W, 28).fill('#f0f9ff');
    doc.fontSize(11).fillColor('#0f172a').text('Total mensual', L + 10, y + 8);
    doc.fontSize(16).fillColor(BLUE).text(
      totalMensual.toFixed(2) + ' €',
      L + 330, y + 5, { width: 80, align: 'right' }
    );
    doc.fontSize(11).fillColor(ORANGE).text(
      (pts || totalPts) + ' pts',
      L + 430, y + 8, { width: 75, align: 'right' }
    );
    doc.y = y + 35;
  }

  // ═══════════════════════════════════════
  // SECCIÓN 4 — PUNTOS Y REGALOS
  // ═══════════════════════════════════════
  if (pts > 0) {
    doc.moveDown(0.4);
    doc.fontSize(10).fillColor(BLUE).text(`REGALOS CAMPAÑA — CON TUS ${pts} PUNTOS`, L, doc.y);
    doc.moveTo(L, doc.y + 2).lineTo(R, doc.y + 2).strokeColor(BLUE).lineWidth(0.5).stroke();
    doc.moveDown(0.5);

    // Badge naranja pill
    const badgeY = doc.y;
    doc.roundedRect(L, badgeY, 130, 20, 10).fill(ORANGE);
    doc.fontSize(10).fillColor('#fff').text(pts + ' pts acumulados', L + 10, badgeY + 4, { width: 115 });
    doc.y = badgeY + 26;

    // Caja motivacional amarilla
    const conseguido = REGALOS.filter(r => pts >= r.pts).pop();
    const siguiente = REGALOS.find(r => pts < r.pts);
    if (conseguido || siguiente) {
      const boxY = doc.y;
      doc.rect(L, boxY, W, 42).fill('#fff8e1');
      doc.rect(L, boxY, W, 42).strokeColor('#ffe082').lineWidth(0.8).stroke();
      let ty = boxY + 6;
      doc.fontSize(9).fillColor('#5d4037');
      if (conseguido) {
        doc.text(`Con tus seguros actuales ya tienes: ${conseguido.premio}.`, L + 10, ty, { width: W - 20 });
        ty += 13;
      }
      if (siguiente) {
        const monedero = Math.round(siguiente.pts / 100 * 10);
        doc.text(`¡Con solo ${siguiente.pts - pts} pts más consigues: ${siguiente.premio} (o tarjeta ${monedero}€)!`, L + 10, ty, { width: W - 20 });
        ty += 13;
      }
      doc.text('Añadiendo Hogar, Auto u otro seguro llegas al siguiente nivel.', L + 10, ty, { width: W - 20 });
      doc.y = boxY + 48;
    }

    // Tabla regalos
    doc.moveDown(0.3);
    const rth = doc.y;
    doc.rect(L, rth, W, 18).fill('#f8f9fa');
    doc.moveTo(L, rth + 18).lineTo(R, rth + 18).strokeColor('#e0e0e0').lineWidth(0.5).stroke();
    doc.fontSize(7).fillColor(LIGHT);
    doc.text('Premio (a elegir uno)', L + 22, rth + 5, { width: 215 });
    doc.text('Puntos', L + 245, rth + 5, { width: 55, align: 'center' });
    doc.text('o Tarjeta monedero', L + 310, rth + 5, { width: 100, align: 'center' });
    doc.text('Estado', L + 420, rth + 5, { width: 90, align: 'center' });

    let ry = rth + 20;
    REGALOS.forEach((r) => {
      const achieved = pts >= r.pts;
      const close = !achieved && (r.pts - pts) <= 3000;
      const rowH = 18;
      const monedero = Math.round(r.pts / 100 * 10);

      // Fondo
      doc.rect(L, ry, W, rowH).fill(achieved ? GREEN_BG : '#fff');
      doc.moveTo(L, ry + rowH).lineTo(R, ry + rowH).strokeColor('#f0f0f0').lineWidth(0.3).stroke();

      // Indicador circular
      const cx = L + 10;
      const cy2 = ry + rowH / 2;
      if (achieved) {
        doc.circle(cx, cy2, 5).fill(GREEN);
        doc.fontSize(7).fillColor('#fff').text('✓', cx - 3, cy2 - 4, { width: 6 });
      } else if (close) {
        doc.circle(cx, cy2, 5).strokeColor(ORANGE).lineWidth(1).stroke();
        // Barra progreso naranja
        const pct = Math.min(pts / r.pts, 1);
        doc.rect(L + 22, ry + rowH - 3, (W - 100) * pct, 2).fill(ORANGE);
      } else {
        doc.circle(cx, cy2, 5).strokeColor('#ddd').lineWidth(0.8).stroke();
      }

      // Texto
      const txtColor = achieved ? GREEN : close ? '#b36000' : LIGHT;
      doc.fontSize(8).fillColor(txtColor);
      doc.text(r.premio, L + 22, ry + 4, { width: 215 });
      doc.text(r.pts.toLocaleString('es-ES'), L + 245, ry + 4, { width: 55, align: 'center' });
      doc.text(monedero + ' €', L + 310, ry + 4, { width: 100, align: 'center' });

      // Estado
      if (achieved) {
        doc.fillColor(GREEN).text('¡Conseguido!', L + 420, ry + 4, { width: 90, align: 'center' });
      } else {
        const faltan = r.pts - pts;
        doc.fillColor(close ? '#b36000' : LIGHT).text(`Faltan ${faltan} pts`, L + 420, ry + 4, { width: 90, align: 'center' });
      }

      ry += rowH;
    });
    doc.y = ry + 8;
  }

  // ═══════════════════════════════════════
  // SECCIÓN 5 — VALIDEZ
  // ═══════════════════════════════════════
  doc.moveDown(0.3);
  const vy = doc.y;
  doc.rect(L, vy, W, 36).fill('#f8f9fa');

  doc.fontSize(9).fillColor(LIGHT).text('Validez del presupuesto', L + 12, vy + 5);
  doc.fontSize(11).fillColor('#0f172a').text('Hasta el 30/06/2026', L + 12, vy + 18);

  doc.fontSize(9).fillColor(LIGHT).text('ADESLAS · Campaña Marzo-Junio 2026', L + 280, vy + 5, { width: 220, align: 'right' });
  doc.text('Sujeto a aceptación por la compañía', L + 280, vy + 18, { width: 220, align: 'right' });

  doc.y = vy + 42;

  // ═══════════════════════════════════════
  // SECCIÓN 6 — PIE
  // ═══════════════════════════════════════
  doc.moveTo(L, doc.y).lineTo(R, doc.y).strokeColor('#e0e0e0').lineWidth(0.5).stroke();
  doc.moveDown(0.3);

  const py = doc.y;
  doc.rect(L, py, W, 36).fill('#fafafa');

  doc.fontSize(10).fillColor('#0f172a').text('TGSSA, SL', L + 12, py + 5);
  doc.fontSize(9).fillColor(LIGHT).text(`segurosdesaludonline.es · Agente: ${agente}`, L + 12, py + 18);

  doc.fontSize(8).fillColor(LIGHT).text(
    'Los puntos se acumulan al contratar los seguros indicados. Premio sujeto a disponibilidad de la campaña ADESLAS.',
    L + 260, py + 8, { width: 240, align: 'right' }
  );

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

  line('TIPO', data.tipo_poliza);
  line('FECHA', new Date().toLocaleDateString('es-ES'));
  line('PRECIO', data.prima ? data.prima + '€/MENSUAL' : '-');
  line('EFECTO', data.fecha_efecto ? new Date(data.fecha_efecto).toLocaleDateString('es-ES') : '-');
  line('SOLICITUD', data.num_solicitud || '-');
  line('NÚM PÓLIZA', data.poliza || '-');
  line('COMPAÑÍA', data.compania || 'ADESLAS');
  line('AGENTE', data.agente_nombre || '-');
  if (data.campana) line('CAMPAÑA', data.campana);

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

  doc.moveDown(1);
  doc.rect(50, doc.y, 495, 30).fill('#f4f6f9');
  doc.fontSize(10).fillColor(BLUE).text('══ FIN GRABACIÓN ══', 60, doc.y + 8, { width: 475, align: 'center' });

  doc.end();
  await new Promise(resolve => stream.on('finish', resolve));
  return pdfUrl;
}

module.exports = { generarPDFPropuesta, generarPDFGrabacion };
