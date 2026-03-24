const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const SHEET_ID = '1XI3kWE45k8d-ZPrDpTYDzQf2ZS_GnsRXJPERPdyXswk';

// Pestañas mensuales del sheet
const HOJAS = [
  'ENERO 2025', 'FEBRERO 2025', 'MARZO 2025', 'ABRIL 2025',
  'MAYO 2025', 'JUNIO 2025', 'JULIO 2025', 'AGOSTO 2025',
  'SEPTIEMBRE 2025', 'OCTUBRE 2025', 'NOVIEMBRE 2025', 'DICIEMBRE 2025',
  'ENERO 2026'
];

// Columnas esperadas (orden del sheet)
const COL = {
  AGENTE: 0, NOMBRE: 1, NIF: 2, FECHA_GRABACION: 3, FECHA_EFECTO: 4,
  PRODUCTO: 5, NUM_SOLICITUD: 6, NUM_POLIZA: 7, FORMA_PAGO: 8,
  DESCUENTO: 9, RECIBO: 10, ASEG: 11, PRIMA_ANUAL: 12,
  BENEFICIO: 13, BASE: 14, TELEFONO: 15, EMAIL: 16, CAMPANA: 17,
  AUDIO: 18, CARENCIAS: 19, ENVIADA_CCPP: 20, COMENTARIOS: 21
};

// =============================================
// Leer una pestaña del Google Sheet via gviz
// =============================================
async function fetchSheet(hoja) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(hoja)}`;
  const res = await fetch(url);
  const text = await res.text();

  // gviz devuelve JSONP: google.visualization.Query.setResponse({...})
  const jsonStr = text.replace(/^[^(]*\(/, '').replace(/\);?\s*$/, '');
  const data = JSON.parse(jsonStr);

  if (!data.table?.rows) return [];

  return data.table.rows.map(row => {
    return (row.c || []).map(cell => {
      if (!cell) return null;
      // gviz pone fechas como "Date(2025,0,15)" — parsear
      if (cell.v && typeof cell.v === 'string' && cell.v.startsWith('Date(')) {
        const m = cell.v.match(/Date\((\d+),(\d+),(\d+)\)/);
        if (m) return new Date(+m[1], +m[2], +m[3]);
      }
      return cell.v;
    });
  });
}

// =============================================
// Limpiar nombre — extraer DNI si está incrustado
// =============================================
function limpiarNombreDNI(raw) {
  if (!raw) return { nombre: null, dni: null };
  const str = String(raw).trim();

  // Buscar patrón de DNI/NIE: 8 dígitos + letra, o X/Y/Z + 7 dígitos + letra
  const dniRegex = /\b([0-9]{8}[A-Za-z]|[XYZxyz][0-9]{7}[A-Za-z])\b/;
  const match = str.match(dniRegex);

  let dni = match ? match[1].toUpperCase() : null;
  let nombre = match ? str.replace(match[0], '').trim() : str;

  // Limpiar espacios múltiples y caracteres raros
  nombre = nombre.replace(/\s+/g, ' ').replace(/[,;]+$/, '').trim();

  return { nombre, dni };
}

// =============================================
// Parsear fecha (DD/MM/YYYY, Date object, string)
// =============================================
function parseFecha(v) {
  if (!v) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;

  const str = String(v).trim();
  // DD/MM/YYYY
  const m = str.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (m) {
    const d = new Date(+m[3], +m[2] - 1, +m[1]);
    return isNaN(d.getTime()) ? null : d;
  }
  // ISO
  const d2 = new Date(str);
  return isNaN(d2.getTime()) ? null : d2;
}

// =============================================
// Parsear número (manejar comas y texto)
// =============================================
function parseNum(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return v;
  const cleaned = String(v).replace(/[€\s]/g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

// =============================================
// Detectar estado por comentarios
// =============================================
function detectarEstado(comentarios, numSolicitud) {
  const text = ((comentarios || '') + ' ' + (numSolicitud || '')).toUpperCase();
  if (/PTE\s*BAJA|NO\s*LO\s*QUIERE|^BAJA\b|ANULAD|CANCELAD/.test(text)) {
    return 'baja_pendiente';
  }
  return 'activa';
}

// =============================================
// POST /api/polizas/importar-sheet
// =============================================
router.post('/importar-sheet', async (req, res) => {
  const informe = {
    contactos_nuevos: 0,
    contactos_actualizados: 0,
    polizas_nuevas: 0,
    polizas_actualizadas: 0,
    errores: [],
    total_procesadas: 0,
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

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const numPoliza = r[COL.NUM_POLIZA] ? String(r[COL.NUM_POLIZA]).trim() : null;
        if (!numPoliza) continue; // Sin nº póliza → saltar

        informe.total_procesadas++;

        try {
          // --- Contacto ---
          const rawNombre = r[COL.NOMBRE];
          const rawNIF = r[COL.NIF] ? String(r[COL.NIF]).toUpperCase().trim() : null;
          const { nombre, dni: dniFromName } = limpiarNombreDNI(rawNombre);
          const dni = rawNIF || dniFromName;
          const telefono = r[COL.TELEFONO] ? String(r[COL.TELEFONO]).replace(/\s/g, '').trim() : null;
          const email = r[COL.EMAIL] ? String(r[COL.EMAIL]).trim().toLowerCase() : null;
          const agente = r[COL.AGENTE] ? String(r[COL.AGENTE]).trim() : null;

          if (!nombre && !dni && !telefono) {
            informe.errores.push(`${hoja} fila ${i + 1}: sin nombre, DNI ni teléfono`);
            continue;
          }

          let contactoId = null;

          // Upsert por DNI
          if (dni) {
            const existing = await pool.query('SELECT id FROM contactos WHERE dni = $1', [dni]);
            if (existing.rows.length > 0) {
              contactoId = existing.rows[0].id;
              await pool.query(
                `UPDATE contactos SET nombre = COALESCE($1, nombre), telefono = COALESCE($2, telefono),
                 email = COALESCE($3, email), agente_nombre = COALESCE($4, agente_nombre),
                 actualizado_en = now() WHERE id = $5`,
                [nombre, telefono, email, agente, contactoId]
              );
              informe.contactos_actualizados++;
            } else {
              const ins = await pool.query(
                `INSERT INTO contactos (dni, nombre, telefono, email, agente_nombre, origen_lead)
                 VALUES ($1, $2, $3, $4, $5, 'sheet_adeslas') RETURNING id`,
                [dni, nombre, telefono, email, agente]
              );
              contactoId = ins.rows[0].id;
              informe.contactos_nuevos++;
            }
          }
          // Fallback por teléfono
          else if (telefono) {
            const existing = await pool.query('SELECT id FROM contactos WHERE telefono = $1', [telefono]);
            if (existing.rows.length > 0) {
              contactoId = existing.rows[0].id;
              informe.contactos_actualizados++;
            } else {
              const ins = await pool.query(
                `INSERT INTO contactos (nombre, telefono, email, agente_nombre, origen_lead)
                 VALUES ($1, $2, $3, $4, 'sheet_adeslas') RETURNING id`,
                [nombre, telefono, email, agente]
              );
              contactoId = ins.rows[0].id;
              informe.contactos_nuevos++;
            }
          }

          // --- Póliza ---
          const comentarios = r[COL.COMENTARIOS] ? String(r[COL.COMENTARIOS]).trim() : null;
          const numSolicitud = r[COL.NUM_SOLICITUD] ? String(r[COL.NUM_SOLICITUD]).trim() : null;
          const estado = detectarEstado(comentarios, numSolicitud);

          const polizaData = {
            numero: numPoliza,
            contacto_id: contactoId,
            agente_nombre: agente,
            producto: r[COL.PRODUCTO] ? String(r[COL.PRODUCTO]).trim() : null,
            fecha_grabacion: parseFecha(r[COL.FECHA_GRABACION]),
            fecha_efecto: parseFecha(r[COL.FECHA_EFECTO]),
            forma_pago: r[COL.FORMA_PAGO] ? String(r[COL.FORMA_PAGO]).trim() : null,
            num_solicitud: numSolicitud,
            num_asegurados: r[COL.ASEG] ? parseInt(r[COL.ASEG]) || null : null,
            prima_anual: parseNum(r[COL.PRIMA_ANUAL]),
            beneficio: parseNum(r[COL.BENEFICIO]),
            recibo_emitido: parseNum(r[COL.RECIBO]),
            descuento: r[COL.DESCUENTO] ? String(r[COL.DESCUENTO]).trim() : null,
            campana: r[COL.CAMPANA] ? String(r[COL.CAMPANA]).trim() : null,
            carencias: r[COL.CARENCIAS] ? String(r[COL.CARENCIAS]).trim() : null,
            notas: comentarios,
            origen_lead: r[COL.AUDIO] ? String(r[COL.AUDIO]).trim() : null,
            mes_alta: hoja,
            estado,
            activa: estado === 'activa',
          };

          const existingPoliza = await pool.query('SELECT id FROM polizas WHERE numero = $1', [numPoliza]);

          if (existingPoliza.rows.length > 0) {
            await pool.query(
              `UPDATE polizas SET contacto_id = COALESCE($1, contacto_id), agente_nombre = COALESCE($2, agente_nombre),
               producto = COALESCE($3, producto), fecha_grabacion = COALESCE($4, fecha_grabacion),
               fecha_efecto = COALESCE($5, fecha_efecto), forma_pago = COALESCE($6, forma_pago),
               num_solicitud = COALESCE($7, num_solicitud), num_asegurados = COALESCE($8, num_asegurados),
               prima_anual = COALESCE($9, prima_anual), beneficio = COALESCE($10, beneficio),
               recibo_emitido = COALESCE($11, recibo_emitido), descuento = COALESCE($12, descuento),
               campana = COALESCE($13, campana), carencias = COALESCE($14, carencias),
               notas = COALESCE($15, notas), estado = $16, activa = $17
               WHERE numero = $18`,
              [
                polizaData.contacto_id, polizaData.agente_nombre, polizaData.producto,
                polizaData.fecha_grabacion, polizaData.fecha_efecto, polizaData.forma_pago,
                polizaData.num_solicitud, polizaData.num_asegurados, polizaData.prima_anual,
                polizaData.beneficio, polizaData.recibo_emitido, polizaData.descuento,
                polizaData.campana, polizaData.carencias, polizaData.notas,
                polizaData.estado, polizaData.activa, numPoliza
              ]
            );
            informe.polizas_actualizadas++;
          } else {
            await pool.query(
              `INSERT INTO polizas (numero, contacto_id, agente_nombre, producto, fecha_grabacion,
               fecha_efecto, forma_pago, num_solicitud, num_asegurados, prima_anual,
               beneficio, recibo_emitido, descuento, campana, carencias, notas,
               origen_lead, mes_alta, estado, activa)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
              [
                numPoliza, polizaData.contacto_id, polizaData.agente_nombre, polizaData.producto,
                polizaData.fecha_grabacion, polizaData.fecha_efecto, polizaData.forma_pago,
                polizaData.num_solicitud, polizaData.num_asegurados, polizaData.prima_anual,
                polizaData.beneficio, polizaData.recibo_emitido, polizaData.descuento,
                polizaData.campana, polizaData.carencias, polizaData.notas,
                polizaData.origen_lead, polizaData.mes_alta, polizaData.estado, polizaData.activa
              ]
            );
            informe.polizas_nuevas++;
          }
        } catch (err) {
          informe.errores.push(`${hoja} fila ${i + 1}: ${err.message}`);
        }
      }
    }

    console.log(`[Pólizas] Importación completada:`, JSON.stringify(informe, null, 2));
    res.json(informe);
  } catch (err) {
    console.error('[Pólizas] Error importación:', err);
    res.status(500).json({ error: err.message, informe });
  }
});

// =============================================
// GET /api/polizas/stats
// =============================================
router.get('/stats', async (req, res) => {
  try {
    const [totalQ, bajaQ, porAgenteQ, porProductoQ] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS total FROM polizas WHERE activa = true`),
      pool.query(`SELECT COUNT(*) AS total FROM polizas WHERE estado = 'baja_pendiente'`),
      pool.query(
        `SELECT agente_nombre AS agente, COUNT(*) AS total,
                SUM(CASE WHEN activa THEN 1 ELSE 0 END) AS activas,
                SUM(CASE WHEN estado = 'baja_pendiente' THEN 1 ELSE 0 END) AS bajas,
                COALESCE(SUM(prima_anual) FILTER (WHERE activa), 0) AS prima_total
         FROM polizas WHERE agente_nombre IS NOT NULL
         GROUP BY agente_nombre ORDER BY total DESC`
      ),
      pool.query(
        `SELECT producto, COUNT(*) AS total,
                SUM(CASE WHEN activa THEN 1 ELSE 0 END) AS activas,
                COALESCE(SUM(prima_anual) FILTER (WHERE activa), 0) AS prima_total
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
