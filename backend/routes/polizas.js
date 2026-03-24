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

// Columnas del sheet (por posición)
const COL = {
  AGENTE: 0, NOMBRE: 1, NIF: 2, FECHA_GRABACION: 3, FECHA_EFECTO: 4,
  PRODUCTO: 5, NUM_SOLICITUD: 6, NUM_POLIZA: 7, FORMA_PAGO: 8,
  DESCUENTO: 9, RECIBO: 10, ASEG: 11, PRIMA_ANUAL: 12,
  BENEFICIO: 13, BASE: 14, TELEFONO: 15, EMAIL: 16, CAMPANA: 17,
  AUDIO: 18, CARENCIAS: 19, ENVIADA_CCPP: 20, COMENTARIOS: 21
};

// Cache de agentes (nombre → id)
let agentesCache = null;
async function getAgenteId(nombreAgente) {
  if (!nombreAgente) return null;
  if (!agentesCache) {
    const res = await pool.query('SELECT id, nombre FROM users WHERE activo = true');
    agentesCache = res.rows;
  }
  const clean = nombreAgente.trim().toUpperCase();
  // Buscar por coincidencia parcial (primer nombre o apellido)
  const match = agentesCache.find(a => {
    const parts = a.nombre.toUpperCase().split(' ');
    return parts.some(p => p.length > 2 && clean.includes(p)) || clean === a.nombre.toUpperCase();
  });
  return match?.id || null;
}

// Leer una pestaña del Google Sheet via gviz
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
      // gviz pone fechas como "Date(2025,0,15)"
      if (cell.v && typeof cell.v === 'string' && cell.v.startsWith('Date(')) {
        const m = cell.v.match(/Date\((\d+),(\d+),(\d+)\)/);
        if (m) return new Date(+m[1], +m[2], +m[3]);
      }
      return cell.v;
    });
  });
}

// Extraer DNI del nombre si está incrustado
function limpiarNombreDNI(raw) {
  if (!raw) return { nombre: null, dni: null };
  const str = String(raw).trim();
  const dniRegex = /\b([0-9]{8}[A-Za-z]|[XYZxyz][0-9]{7}[A-Za-z])\b/;
  const match = str.match(dniRegex);
  let dni = match ? match[1].toUpperCase() : null;
  let nombre = match ? str.replace(match[0], '').trim() : str;
  nombre = nombre.replace(/\s+/g, ' ').replace(/[,;]+$/, '').trim();
  return { nombre, dni };
}

// Parsear fecha
function parseFecha(v) {
  if (!v) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  const str = String(v).trim();
  const m = str.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (m) {
    const d = new Date(+m[3], +m[2] - 1, +m[1]);
    return isNaN(d.getTime()) ? null : d;
  }
  const d2 = new Date(str);
  return isNaN(d2.getTime()) ? null : d2;
}

// Parsear número
function parseNum(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return v;
  const cleaned = String(v).replace(/[€\s]/g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

// Parsear descuento a numeric (ej: "5%", "10", "5,5%" → 5, 10, 5.5)
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

// =============================================
// POST /api/polizas/importar-sheet
// =============================================
router.post('/importar-sheet', async (req, res) => {
  agentesCache = null; // Refrescar cache

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
        if (!numPoliza) continue;

        informe.total_procesadas++;

        try {
          // --- Persona (tabla personas) ---
          const rawNombre = r[COL.NOMBRE];
          const rawNIF = r[COL.NIF] ? String(r[COL.NIF]).toUpperCase().trim() : null;
          const { nombre, dni: dniFromName } = limpiarNombreDNI(rawNombre);
          const dni = rawNIF || dniFromName;
          const telefono = r[COL.TELEFONO] ? String(r[COL.TELEFONO]).replace(/\s/g, '').trim() : null;
          const email = r[COL.EMAIL] ? String(r[COL.EMAIL]).trim().toLowerCase() : null;
          const agenteNombre = r[COL.AGENTE] ? String(r[COL.AGENTE]).trim() : null;
          const agenteId = await getAgenteId(agenteNombre);

          if (!nombre && !dni && !telefono) {
            informe.errores.push(`${hoja} fila ${i + 1}: sin nombre, DNI ni teléfono`);
            continue;
          }

          let personaId = null;

          // Upsert en personas por DNI
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
          }
          // Fallback por teléfono
          else if (telefono) {
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

          // --- Póliza (tabla polizas existente) ---
          const comentarios = r[COL.COMENTARIOS] ? String(r[COL.COMENTARIOS]).trim() : null;
          const numSolicitud = r[COL.NUM_SOLICITUD] ? String(r[COL.NUM_SOLICITUD]).trim() : null;
          const estado = detectarEstado(comentarios, numSolicitud);
          const producto = r[COL.PRODUCTO] ? String(r[COL.PRODUCTO]).trim() : 'Sin producto';
          const primaAnual = parseNum(r[COL.PRIMA_ANUAL]);
          const primaMensual = primaAnual ? +(primaAnual / 12).toFixed(2) : null;
          const enviadaCCPP = r[COL.ENVIADA_CCPP] ? /s[ií]|yes|1|true/i.test(String(r[COL.ENVIADA_CCPP])) : null;

          const existingPoliza = await pool.query('SELECT id FROM polizas WHERE n_poliza = $1', [numPoliza]);

          if (existingPoliza.rows.length > 0) {
            await pool.query(
              `UPDATE polizas SET
                 persona_id = COALESCE($1, persona_id),
                 agente_id = COALESCE($2, agente_id),
                 producto = COALESCE(NULLIF($3, ''), producto),
                 fecha_grabacion = COALESCE($4, fecha_grabacion),
                 fecha_efecto = COALESCE($5, fecha_efecto),
                 forma_pago = COALESCE(NULLIF($6, ''), forma_pago),
                 n_solicitud = COALESCE(NULLIF($7, ''), n_solicitud),
                 n_asegurados = COALESCE($8, n_asegurados),
                 prima_anual = COALESCE($9, prima_anual),
                 prima_mensual = COALESCE($10, prima_mensual),
                 beneficio_base = COALESCE($11, beneficio_base),
                 descuento = COALESCE($12, descuento),
                 campana = COALESCE(NULLIF($13, ''), campana),
                 carencias = COALESCE(NULLIF($14, ''), carencias),
                 comentarios = COALESCE(NULLIF($15, ''), comentarios),
                 estado = $16,
                 enviada_ccpp = COALESCE($17, enviada_ccpp),
                 updated_at = now()
               WHERE n_poliza = $18`,
              [
                personaId, agenteId, producto,
                parseFecha(r[COL.FECHA_GRABACION]), parseFecha(r[COL.FECHA_EFECTO]),
                r[COL.FORMA_PAGO] ? String(r[COL.FORMA_PAGO]).trim() : null,
                numSolicitud,
                r[COL.ASEG] ? parseInt(r[COL.ASEG]) || null : null,
                primaAnual, primaMensual,
                parseNum(r[COL.BENEFICIO]),
                parseDescuento(r[COL.DESCUENTO]),
                r[COL.CAMPANA] ? String(r[COL.CAMPANA]).trim() : null,
                r[COL.CARENCIAS] ? String(r[COL.CARENCIAS]).trim() : null,
                comentarios, estado, enviadaCCPP,
                numPoliza
              ]
            );
            informe.polizas_actualizadas++;
          } else {
            await pool.query(
              `INSERT INTO polizas (
                 n_poliza, persona_id, agente_id, compania, producto,
                 fecha_grabacion, fecha_efecto, forma_pago, n_solicitud,
                 n_asegurados, prima_anual, prima_mensual, beneficio_base,
                 descuento, campana, carencias, comentarios,
                 estado, enviada_ccpp
               ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
              [
                numPoliza, personaId, agenteId, 'ADESLAS', producto,
                parseFecha(r[COL.FECHA_GRABACION]), parseFecha(r[COL.FECHA_EFECTO]),
                r[COL.FORMA_PAGO] ? String(r[COL.FORMA_PAGO]).trim() : null,
                numSolicitud,
                r[COL.ASEG] ? parseInt(r[COL.ASEG]) || null : null,
                primaAnual, primaMensual,
                parseNum(r[COL.BENEFICIO]),
                parseDescuento(r[COL.DESCUENTO]),
                r[COL.CAMPANA] ? String(r[COL.CAMPANA]).trim() : null,
                r[COL.CARENCIAS] ? String(r[COL.CARENCIAS]).trim() : null,
                comentarios, estado, enviadaCCPP
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
