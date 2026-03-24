const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();
router.use(authMiddleware);

const upload = multer({
  dest: path.join(__dirname, '../../uploads/imports'),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const SHEET_ID = '1XI3kWE45k8d-ZPrDpTYDzQf2ZS_GnsRXJPERPdyXswk';

const HOJAS = [
  'ENERO 2025', 'FEBRERO 2025', 'MARZO 2025', 'ABRIL 2025',
  'MAYO 2025', 'JUNIO 2025', 'JULIO 2025', 'AGOSTO 2025',
  'SEPTIEMBRE 2025', 'OCTUBRE 2025', 'NOVIEMBRE 2025', 'DICIEMBRE 2025',
  'ENERO 2026'
];

// =============================================
// HELPERS
// =============================================

// Cache de agentes
let agentesCache = null;
async function getAgenteId(nombreAgente) {
  if (!nombreAgente) return null;
  if (!agentesCache) {
    const res = await pool.query('SELECT id, nombre FROM users WHERE activo = true');
    agentesCache = res.rows;
  }
  const clean = nombreAgente.trim().toUpperCase();
  const exact = agentesCache.find(a => a.nombre.toUpperCase() === clean);
  if (exact) return exact.id;
  const match = agentesCache.find(a => {
    const parts = a.nombre.toUpperCase().split(' ');
    return parts.some(p => p.length > 2 && clean.includes(p));
  });
  return match?.id || null;
}

// Extraer DNI incrustado en nombre
function limpiarNombreDNI(raw) {
  if (!raw) return { nombre: null, dni: null };
  const s = String(raw).trim();
  const dniRegex = /\b([0-9]{8}[A-Za-z]|[XYZxyz][0-9]{7}[A-Za-z])\b/;
  const match = s.match(dniRegex);
  let dni = match ? match[1].toUpperCase() : null;
  let nombre = match ? s.replace(match[0], '').trim() : s;
  nombre = nombre.replace(/\s+/g, ' ').replace(/[,;]+$/, '').trim();
  return { nombre, dni };
}

// Parsear fecha DD/MM/YYYY, Date obj, ISO
function parseFecha(v) {
  if (!v) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  const s = String(v).trim();
  const m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (m) {
    const d = new Date(+m[3], +m[2] - 1, +m[1]);
    return isNaN(d.getTime()) ? null : d;
  }
  const d2 = new Date(s);
  return isNaN(d2.getTime()) ? null : d2;
}

// Parsear euros: "1.236,00 €" → 1236.00
function parseEuros(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return v;
  let s = String(v).trim().replace(/€/g, '').trim();
  if (!s) return null;
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  }
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

// Parsear descuento: "5%" → 5
function parseDescuento(v) {
  if (v === null || v === undefined || v === '') return null;
  const cleaned = String(v).replace(/[%€\s]/g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

// Detectar estado por comentarios
function detectarEstado(comentarios, numSolicitud) {
  const text = ((comentarios || '') + ' ' + (numSolicitud || '')).toUpperCase();
  if (/PTE\s*BAJA|NO\s*LO\s*QUIERE|\bBAJA\b|ANULAD|CANCELAD/.test(text)) {
    return 'baja_pendiente';
  }
  return 'activa';
}

// String limpio
function str(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s || null;
}

// =============================================
// LÓGICA COMPARTIDA: procesar una fila
// =============================================
async function procesarFila(fila, mesAlta, informe) {
  // fila es un objeto con las claves normalizadas:
  // agente, nombre, dni, fecha_grabacion, fecha_efecto, producto,
  // num_solicitud, num_poliza, forma_pago, descuento, recibo_mensual,
  // num_asegurados, prima_anual, beneficio, origen_lead, telefono,
  // email, campana, audio, carencias, enviada_ccpp, notas

  const numPoliza = str(fila.num_poliza);
  if (!numPoliza) return; // Sin nº póliza → saltar

  informe.total_procesadas++;

  // --- Persona ---
  const rawNIF = fila.dni ? String(fila.dni).toUpperCase().trim() : null;
  const { nombre, dni: dniFromName } = limpiarNombreDNI(fila.nombre);
  const dniFromNIF = rawNIF && /^[0-9XYZ]/i.test(rawNIF) ? rawNIF : null;
  const dni = dniFromNIF || dniFromName;
  if (dniFromName && !dniFromNIF) informe.dnis_extraidos_de_nombre++;

  const telefono = fila.telefono ? String(fila.telefono).replace(/\s/g, '').trim() : null;
  const email = fila.email ? String(fila.email).trim().toLowerCase() : null;
  const agenteNombre = str(fila.agente);
  const agenteId = await getAgenteId(agenteNombre);

  if (!nombre && !dni && !telefono) {
    informe.errores.push(`${mesAlta}: póliza ${numPoliza} sin nombre, DNI ni teléfono`);
    return;
  }

  let personaId = null;

  if (dni) {
    const existing = await pool.query('SELECT id FROM personas WHERE dni = $1', [dni]);
    if (existing.rows.length > 0) {
      personaId = existing.rows[0].id;
      await pool.query(
        `UPDATE personas SET
           nombre = COALESCE(NULLIF($1, ''), nombre),
           telefono = COALESCE(NULLIF($2, ''), telefono),
           email = COALESCE(NULLIF($3, ''), email),
           agente_id = COALESCE($4, agente_id),
           updated_at = now()
         WHERE id = $5`,
        [nombre, telefono, email, agenteId, personaId]
      );
      informe.contactos_actualizados++;
    } else {
      const ins = await pool.query(
        `INSERT INTO personas (dni, nombre, telefono, email, agente_id)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [dni, nombre || 'Sin nombre', telefono, email, agenteId]
      );
      personaId = ins.rows[0].id;
      informe.contactos_nuevos++;
    }
  } else if (telefono) {
    const existing = await pool.query('SELECT id FROM personas WHERE telefono = $1', [telefono]);
    if (existing.rows.length > 0) {
      personaId = existing.rows[0].id;
      informe.contactos_actualizados++;
    } else {
      const ins = await pool.query(
        `INSERT INTO personas (nombre, telefono, email, agente_id)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [nombre || 'Sin nombre', telefono, email, agenteId]
      );
      personaId = ins.rows[0].id;
      informe.contactos_nuevos++;
    }
  }

  // --- Póliza ---
  const comentarios = str(fila.notas);
  const numSolicitud = str(fila.num_solicitud);
  const estado = detectarEstado(comentarios, numSolicitud);
  if (estado === 'baja_pendiente') informe.bajas_detectadas++;

  const producto = str(fila.producto) || 'Sin producto';
  const primaAnual = parseEuros(fila.prima_anual);
  const reciboMensual = parseEuros(fila.recibo_mensual);
  const primaMensual = reciboMensual || (primaAnual ? +(primaAnual / 12).toFixed(2) : null);
  const beneficio = parseEuros(fila.beneficio);
  const descuento = parseDescuento(fila.descuento);
  const nAsegurados = fila.num_asegurados ? parseInt(fila.num_asegurados) || null : null;
  const formaPago = str(fila.forma_pago);
  const campana = str(fila.campana);
  const audio = str(fila.audio);
  const carencias = str(fila.carencias);
  const origenLead = str(fila.origen_lead);
  const enviadaCCPP = fila.enviada_ccpp ? /s[ií]|yes|1|true/i.test(String(fila.enviada_ccpp)) : null;

  const existingPoliza = await pool.query('SELECT id FROM polizas WHERE n_poliza = $1', [numPoliza]);

  if (existingPoliza.rows.length > 0) {
    await pool.query(
      `UPDATE polizas SET
         persona_id = COALESCE($1, persona_id),
         agente_id = COALESCE($2, agente_id),
         agente_nombre = COALESCE(NULLIF($3, ''), agente_nombre),
         producto = COALESCE(NULLIF($4, ''), producto),
         fecha_grabacion = COALESCE($5, fecha_grabacion),
         fecha_efecto = COALESCE($6, fecha_efecto),
         forma_pago = COALESCE(NULLIF($7, ''), forma_pago),
         n_solicitud = COALESCE(NULLIF($8, ''), n_solicitud),
         n_asegurados = COALESCE($9, n_asegurados),
         prima_anual = COALESCE($10, prima_anual),
         prima_mensual = COALESCE($11, prima_mensual),
         recibo_mensual = COALESCE($12, recibo_mensual),
         beneficio_base = COALESCE($13, beneficio_base),
         descuento = COALESCE($14, descuento),
         campana = COALESCE(NULLIF($15, ''), campana),
         n_grabacion = COALESCE(NULLIF($16, ''), n_grabacion),
         carencias = COALESCE(NULLIF($17, ''), carencias),
         comentarios = COALESCE(NULLIF($18, ''), comentarios),
         origen_lead = COALESCE(NULLIF($19, ''), origen_lead),
         mes_alta = COALESCE(NULLIF($20, ''), mes_alta),
         estado = $21,
         enviada_ccpp = COALESCE($22, enviada_ccpp),
         updated_at = now()
       WHERE n_poliza = $23`,
      [
        personaId, agenteId, agenteNombre, producto,
        parseFecha(fila.fecha_grabacion), parseFecha(fila.fecha_efecto),
        formaPago, numSolicitud, nAsegurados,
        primaAnual, primaMensual, reciboMensual, beneficio,
        descuento, campana, audio, carencias, comentarios,
        origenLead, mesAlta, estado, enviadaCCPP,
        numPoliza
      ]
    );
    informe.polizas_actualizadas++;
  } else {
    await pool.query(
      `INSERT INTO polizas (
         n_poliza, persona_id, agente_id, agente_nombre, compania, producto,
         fecha_grabacion, fecha_efecto, forma_pago, n_solicitud,
         n_asegurados, prima_anual, prima_mensual, recibo_mensual,
         beneficio_base, descuento, campana, n_grabacion,
         carencias, comentarios, origen_lead, mes_alta,
         estado, enviada_ccpp
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)`,
      [
        numPoliza, personaId, agenteId, agenteNombre, 'ADESLAS', producto,
        parseFecha(fila.fecha_grabacion), parseFecha(fila.fecha_efecto),
        formaPago, numSolicitud, nAsegurados,
        primaAnual, primaMensual, reciboMensual,
        beneficio, descuento, campana, audio,
        carencias, comentarios, origenLead, mesAlta,
        estado, enviadaCCPP
      ]
    );
    informe.polizas_nuevas++;
  }
}

// =============================================
// POST /api/polizas/importar-json
// =============================================
router.post('/importar-json', async (req, res) => {
  agentesCache = null;
  const { mes, filas } = req.body;

  if (!filas || !Array.isArray(filas) || filas.length === 0) {
    return res.status(400).json({ error: 'Se requiere un array "filas" con al menos un elemento' });
  }

  const mesAlta = mes || 'SIN MES';
  const informe = {
    contactos_nuevos: 0, contactos_actualizados: 0,
    polizas_nuevas: 0, polizas_actualizadas: 0,
    bajas_detectadas: 0, dnis_extraidos_de_nombre: 0,
    errores: [], total_procesadas: 0,
  };

  try {
    for (let i = 0; i < filas.length; i++) {
      const f = filas[i];
      try {
        await procesarFila({
          agente: f.agente,
          nombre: f.nombre,
          dni: f.dni,
          fecha_grabacion: f.fecha_grabacion,
          fecha_efecto: f.fecha_efecto,
          producto: f.producto,
          num_solicitud: f.num_solicitud,
          num_poliza: f.num_poliza,
          forma_pago: f.forma_pago,
          descuento: f.descuento,
          recibo_mensual: f.recibo_mensual,
          num_asegurados: f.num_asegurados,
          prima_anual: f.prima_anual,
          beneficio: f.beneficio,
          origen_lead: f.origen_lead,
          telefono: f.telefono,
          email: f.email,
          campana: f.campana,
          audio: f.audio,
          carencias: f.carencias,
          enviada_ccpp: f.enviada_ccpp,
          notas: f.notas,
        }, mesAlta, informe);
      } catch (err) {
        informe.errores.push(`Fila ${i + 1}: ${err.message}`);
      }
    }

    console.log(`[Pólizas JSON] ${mesAlta}: ${informe.total_procesadas} procesadas`);
    res.json(informe);
  } catch (err) {
    console.error('[Pólizas JSON] Error:', err);
    res.status(500).json({ error: err.message, informe });
  }
});

// =============================================
// POST /api/polizas/importar-csv
// =============================================
router.post('/importar-csv', upload.single('archivo'), async (req, res) => {
  agentesCache = null;

  if (!req.file) return res.status(400).json({ error: 'Se requiere un archivo CSV (campo "archivo")' });

  const mesAlta = req.body.mes || 'SIN MES';
  const informe = {
    contactos_nuevos: 0, contactos_actualizados: 0,
    polizas_nuevas: 0, polizas_actualizadas: 0,
    bajas_detectadas: 0, dnis_extraidos_de_nombre: 0,
    errores: [], total_procesadas: 0,
  };

  try {
    const content = fs.readFileSync(req.file.path, 'utf8');
    const lines = content.trim().split('\n').filter(l => l.trim());

    if (lines.length < 2) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'El CSV debe tener al menos cabecera + 1 fila de datos' });
    }

    // Detectar separador
    const sep = lines[0].includes('\t') ? '\t' : (lines[0].includes(';') ? ';' : ',');

    // Parsear cabecera → normalizar a claves del importador
    const rawHeaders = lines[0].split(sep).map(h => h.replace(/["'\uFEFF]/g, '').trim());

    // Mapeo flexible de cabeceras del Sheet a claves internas
    function mapHeader(h) {
      const u = h.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑº\s]/g, '').trim();
      if (/^AGENTE$/.test(u)) return 'agente';
      if (/^NOMBRE$/.test(u)) return 'nombre';
      if (/NIF|CIF|DNI/.test(u)) return 'dni';
      if (/FECHA\s*GRABA/.test(u)) return 'fecha_grabacion';
      if (/FECHA\s*EFECTO/.test(u)) return 'fecha_efecto';
      if (/^PRODUCTO$/.test(u)) return 'producto';
      if (/NUM.*SOLICITUD|SOLICITUD/.test(u)) return 'num_solicitud';
      if (/NUM.*POLIZA|POLIZA|Nº\s*POLIZA/.test(u)) return 'num_poliza';
      if (/FORMA\s*PAGO/.test(u)) return 'forma_pago';
      if (/^DESCUENTO$/.test(u)) return 'descuento';
      if (/RECIBO|EMITIDO/.test(u)) return 'recibo_mensual';
      if (/^ASEG/.test(u)) return 'num_asegurados';
      if (/PRIMA\s*ANUAL/.test(u)) return 'prima_anual';
      if (/^BENEFICIO$/.test(u)) return 'beneficio';
      if (/^BASE$/.test(u)) return 'origen_lead';
      if (/TELEFONO|TEL/.test(u)) return 'telefono';
      if (/^EMAIL|CORREO/.test(u)) return 'email';
      if (/CAMPA/.test(u)) return 'campana';
      if (/^AUDIO$/.test(u)) return 'audio';
      if (/CARENCIA/.test(u)) return 'carencias';
      if (/CCPP|ENVIADA/.test(u)) return 'enviada_ccpp';
      if (/COMENTARIO|NOTAS/.test(u)) return 'notas';
      return null;
    }

    const headerMap = rawHeaders.map(mapHeader);
    console.log(`[Pólizas CSV] Cabeceras mapeadas:`, rawHeaders.map((h, i) => `${h} → ${headerMap[i] || '(ignorada)'}`).join(', '));

    // Parsear filas
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(sep).map(c => c.replace(/^["']|["']$/g, '').trim());
      const fila = {};
      headerMap.forEach((key, idx) => {
        if (key && cols[idx] !== undefined) fila[key] = cols[idx];
      });

      try {
        await procesarFila(fila, mesAlta, informe);
      } catch (err) {
        informe.errores.push(`Fila ${i + 1}: ${err.message}`);
      }
    }

    fs.unlinkSync(req.file.path);
    console.log(`[Pólizas CSV] ${mesAlta}: ${informe.total_procesadas} procesadas`);
    res.json(informe);
  } catch (err) {
    if (req.file?.path) try { fs.unlinkSync(req.file.path); } catch {}
    console.error('[Pólizas CSV] Error:', err);
    res.status(500).json({ error: err.message, informe });
  }
});

// =============================================
// POST /api/polizas/importar-sheet (mantener para cuando el Sheet sea público)
// =============================================
router.post('/importar-sheet', async (req, res) => {
  agentesCache = null;

  const informe = {
    contactos_nuevos: 0, contactos_actualizados: 0,
    polizas_nuevas: 0, polizas_actualizadas: 0,
    bajas_detectadas: 0, dnis_extraidos_de_nombre: 0,
    errores: [], total_procesadas: 0,
  };

  try {
    for (const hoja of HOJAS) {
      let rows;
      try {
        rows = await fetchSheet(hoja);
      } catch (err) {
        informe.errores.push(`Error leyendo ${hoja}: ${err.message}`);
        continue;
      }

      console.log(`[Pólizas] ${hoja}: ${rows.length} filas`);

      // Columnas por posición
      const COL = {
        AGENTE: 0, NOMBRE: 1, NIF: 2, FECHA_GRABACION: 3, FECHA_EFECTO: 4,
        PRODUCTO: 5, NUM_SOLICITUD: 6, NUM_POLIZA: 7, FORMA_PAGO: 8,
        DESCUENTO: 9, RECIBO: 10, ASEG: 11, PRIMA_ANUAL: 12,
        BENEFICIO: 13, BASE: 14, TELEFONO: 15, EMAIL: 16, CAMPANA: 17,
        AUDIO: 18, CARENCIAS: 19, ENVIADA_CCPP: 20, COMENTARIOS: 21
      };

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        try {
          await procesarFila({
            agente: r[COL.AGENTE], nombre: r[COL.NOMBRE], dni: r[COL.NIF],
            fecha_grabacion: r[COL.FECHA_GRABACION], fecha_efecto: r[COL.FECHA_EFECTO],
            producto: r[COL.PRODUCTO], num_solicitud: r[COL.NUM_SOLICITUD],
            num_poliza: r[COL.NUM_POLIZA], forma_pago: r[COL.FORMA_PAGO],
            descuento: r[COL.DESCUENTO], recibo_mensual: r[COL.RECIBO],
            num_asegurados: r[COL.ASEG], prima_anual: r[COL.PRIMA_ANUAL],
            beneficio: r[COL.BENEFICIO], origen_lead: r[COL.BASE],
            telefono: r[COL.TELEFONO], email: r[COL.EMAIL],
            campana: r[COL.CAMPANA], audio: r[COL.AUDIO],
            carencias: r[COL.CARENCIAS], enviada_ccpp: r[COL.ENVIADA_CCPP],
            notas: r[COL.COMENTARIOS],
          }, hoja, informe);
        } catch (err) {
          informe.errores.push(`${hoja} fila ${i + 1}: ${err.message}`);
        }
      }
    }

    console.log(`[Pólizas] Importación completada`);
    res.json(informe);
  } catch (err) {
    console.error('[Pólizas] Error:', err);
    res.status(500).json({ error: err.message, informe });
  }
});

// Leer pestaña Google Sheet via gviz (solo funciona si el Sheet es público)
async function fetchSheet(hoja) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(hoja)}`;
  const res = await fetch(url);
  const text = await res.text();
  const jsonStr = text.replace(/^[^(]*\(/, '').replace(/\);?\s*$/, '');
  const data = JSON.parse(jsonStr);
  if (!data.table?.rows) return [];
  return data.table.rows.map(row => {
    return (row.c || []).map(cell => {
      if (!cell) return null;
      if (cell.v && typeof cell.v === 'string' && cell.v.startsWith('Date(')) {
        const m = cell.v.match(/Date\((\d+),(\d+),(\d+)\)/);
        if (m) return new Date(+m[1], +m[2], +m[3]);
      }
      return cell.v;
    });
  });
}

// =============================================
// GET /api/polizas/stats
// =============================================
router.get('/stats', async (req, res) => {
  try {
    const [totalQ, bajaQ, porAgenteQ, porProductoQ] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS total FROM polizas WHERE estado = 'activa'`),
      pool.query(`SELECT COUNT(*) AS total FROM polizas WHERE estado = 'baja_pendiente'`),
      pool.query(
        `SELECT u.nombre AS agente, COUNT(*) AS total,
                SUM(CASE WHEN p.estado = 'activa' THEN 1 ELSE 0 END) AS activas,
                SUM(CASE WHEN p.estado = 'baja_pendiente' THEN 1 ELSE 0 END) AS bajas,
                COALESCE(SUM(p.prima_anual) FILTER (WHERE p.estado = 'activa'), 0) AS prima_total
         FROM polizas p
         LEFT JOIN users u ON u.id = p.agente_id
         WHERE p.agente_id IS NOT NULL
         GROUP BY u.nombre ORDER BY total DESC`
      ),
      pool.query(
        `SELECT producto, COUNT(*) AS total,
                SUM(CASE WHEN estado = 'activa' THEN 1 ELSE 0 END) AS activas,
                COALESCE(SUM(prima_anual) FILTER (WHERE estado = 'activa'), 0) AS prima_total
         FROM polizas WHERE producto IS NOT NULL
         GROUP BY producto ORDER BY total DESC`
      ),
    ]);

    res.json({
      total_activas: parseInt(totalQ.rows[0].total),
      total_baja_pendiente: parseInt(bajaQ.rows[0].total),
      por_agente: porAgenteQ.rows,
      por_producto: porProductoQ.rows,
    });
  } catch (err) {
    console.error('[Pólizas] Error stats:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
