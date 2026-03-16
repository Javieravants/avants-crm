const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/roles');

const router = express.Router();
router.use(authMiddleware);
router.use(requireRole('admin', 'supervisor'));

// Configurar multer
const upload = multer({
  dest: path.join(__dirname, '../uploads/'),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls', '.csv'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls) o CSV'));
    }
  },
});

// Normalizar DNI
function normalizeDNI(dni) {
  if (!dni) return null;
  return String(dni).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// Intentar detectar columnas automáticamente
function detectColumns(headers) {
  const lower = headers.map((h) => (h || '').toString().toLowerCase().trim());
  const mapping = {};

  const patterns = {
    dni: ['dni', 'nif', 'documento', 'nie', 'cif', 'doc_identidad', 'n_documento'],
    nombre: ['nombre', 'name', 'cliente', 'asegurado', 'titular', 'nombre_completo', 'nombre y apellidos', 'nombre completo'],
    telefono: ['telefono', 'teléfono', 'tel', 'movil', 'móvil', 'phone'],
    email: ['email', 'correo', 'mail', 'e-mail'],
    poliza: ['poliza', 'póliza', 'n_poliza', 'num_poliza', 'npoliza', 'numero_poliza', 'nº póliza', 'nº poliza'],
    producto: ['producto', 'plan', 'tarifa', 'modalidad', 'cobertura'],
    compania: ['compañia', 'compañía', 'compania', 'aseguradora', 'entidad'],
    prima: ['prima', 'importe', 'precio', 'coste', 'cuota', 'prima mensual', 'prima anual'],
    fecha_efecto: ['fecha_efecto', 'fecha efecto', 'alta', 'fecha_alta', 'fecha alta', 'inicio', 'fecha_inicio', 'fecha'],
    estado: ['estado', 'status', 'situacion', 'situación'],
    agente: ['agente', 'comercial', 'vendedor', 'asesor', 'teleoperador'],
    direccion: ['direccion', 'dirección', 'domicilio', 'address'],
  };

  for (const [field, candidates] of Object.entries(patterns)) {
    for (let i = 0; i < lower.length; i++) {
      if (candidates.some((c) => lower[i].includes(c))) {
        mapping[field] = i;
        break;
      }
    }
  }

  return mapping;
}

// Parsear fecha flexible
function parseDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === 'number') {
    // Excel serial date
    const d = XLSX.SSF.parse_date_code(val);
    if (d) return new Date(d.y, d.m - 1, d.d);
  }
  const str = String(val).trim();
  // DD/MM/YYYY
  const dmy = str.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (dmy) {
    const year = dmy[3].length === 2 ? 2000 + parseInt(dmy[3]) : parseInt(dmy[3]);
    return new Date(year, parseInt(dmy[2]) - 1, parseInt(dmy[1]));
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

// Buscar agente por nombre (fuzzy)
async function findAgente(nombre) {
  if (!nombre) return null;
  const clean = String(nombre).trim();
  if (!clean) return null;
  const result = await pool.query(
    `SELECT id FROM users WHERE LOWER(nombre) LIKE $1 AND rol = 'agent' LIMIT 1`,
    [`%${clean.toLowerCase()}%`]
  );
  return result.rows[0]?.id || null;
}

// POST /api/import/upload — subir y procesar Excel
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se ha subido ningún archivo' });
  }

  const filePath = req.file.path;
  const tipo = req.body.tipo || 'ventas';

  try {
    const workbook = XLSX.readFile(filePath, { cellDates: true });
    const sheetNames = workbook.SheetNames;

    const results = {
      filename: req.file.originalname,
      tipo,
      hojas: [],
      totals: {
        hojas_procesadas: 0,
        filas_procesadas: 0,
        personas_creadas: 0,
        deals_creados: 0,
        leads_ignorados: 0,
        errores: 0,
      },
      errors: [],
    };

    for (const sheetName of sheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      if (rows.length < 2) continue; // Vacía o solo cabecera

      const headers = rows[0];
      const colMap = detectColumns(headers);
      results.totals.hojas_procesadas++;

      const sheetResult = { nombre: sheetName, filas: 0, personas: 0, deals: 0, errores: 0 };

      // Si no detectamos DNI, registrar error y saltar
      if (colMap.dni === undefined) {
        results.errors.push({
          hoja: sheetName,
          fila: 1,
          error: `No se encontró columna de DNI. Cabeceras: ${headers.join(', ')}`,
        });
        results.totals.errores++;
        sheetResult.errores++;
        results.hojas.push(sheetResult);
        continue;
      }

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 1;

        try {
          const dni = normalizeDNI(colMap.dni !== undefined ? row[colMap.dni] : null);
          if (!dni) {
            results.errors.push({ hoja: sheetName, fila: rowNum, error: 'DNI vacío o inválido', datos: row.slice(0, 5).join(' | ') });
            results.totals.errores++;
            sheetResult.errores++;
            continue;
          }

          const nombre = colMap.nombre !== undefined ? String(row[colMap.nombre] || '').trim() : '';
          const telefono = colMap.telefono !== undefined ? String(row[colMap.telefono] || '').trim() : null;
          const email = colMap.email !== undefined ? String(row[colMap.email] || '').trim() : null;
          const direccion = colMap.direccion !== undefined ? String(row[colMap.direccion] || '').trim() : null;
          const poliza = colMap.poliza !== undefined ? String(row[colMap.poliza] || '').trim() : null;

          // Solo importar filas con número de póliza válido
          const POLIZA_INVALIDAS = ['', 'rechazado', 'rechazada', 'pendiente', 'informe', 'petición informe', 'peticion informe', 'exclusión', 'exclusion', 'rechazo', 'n/a', 'na', '-'];
          if (!poliza || POLIZA_INVALIDAS.includes(poliza.toLowerCase())) {
            results.totals.leads_ignorados = (results.totals.leads_ignorados || 0) + 1;
            continue; // Lead no convertido, saltar silenciosamente
          }
          const producto = colMap.producto !== undefined ? String(row[colMap.producto] || '').trim() : null;
          const compania = colMap.compania !== undefined ? String(row[colMap.compania] || '').trim() : null;
          const primaRaw = colMap.prima !== undefined ? row[colMap.prima] : null;
          const prima = primaRaw ? parseFloat(String(primaRaw).replace(',', '.').replace(/[^\d.]/g, '')) || null : null;
          const fechaEfecto = colMap.fecha_efecto !== undefined ? parseDate(row[colMap.fecha_efecto]) : null;
          const estado = colMap.estado !== undefined ? String(row[colMap.estado] || '').trim() : 'activo';
          const agenteNombre = colMap.agente !== undefined ? String(row[colMap.agente] || '').trim() : null;

          results.totals.filas_procesadas++;
          sheetResult.filas++;

          // Buscar o crear persona
          let personaId;
          const existingPersona = await pool.query('SELECT id FROM personas WHERE dni = $1', [dni]);

          if (existingPersona.rows.length > 0) {
            personaId = existingPersona.rows[0].id;
            // Actualizar datos si vienen rellenos
            const updates = [];
            const vals = [];
            let idx = 1;
            if (nombre && nombre.length > 0) { updates.push(`nombre = $${idx++}`); vals.push(nombre); }
            if (telefono) { updates.push(`telefono = $${idx++}`); vals.push(telefono); }
            if (email) { updates.push(`email = $${idx++}`); vals.push(email); }
            if (direccion) { updates.push(`direccion = $${idx++}`); vals.push(direccion); }
            if (updates.length > 0) {
              updates.push('updated_at = CURRENT_TIMESTAMP');
              vals.push(personaId);
              await pool.query(`UPDATE personas SET ${updates.join(', ')} WHERE id = $${idx}`, vals);
            }
          } else {
            const insertResult = await pool.query(
              'INSERT INTO personas (dni, nombre, telefono, email, direccion) VALUES ($1, $2, $3, $4, $5) RETURNING id',
              [dni, nombre || dni, telefono, email, direccion]
            );
            personaId = insertResult.rows[0].id;
            results.totals.personas_creadas++;
            sheetResult.personas++;
          }

          // Buscar agente
          const agenteId = await findAgente(agenteNombre);

          // Verificar duplicado de deal (misma persona + misma póliza)
          if (poliza) {
            const existingDeal = await pool.query(
              'SELECT id FROM deals WHERE persona_id = $1 AND poliza = $2',
              [personaId, poliza]
            );
            if (existingDeal.rows.length > 0) {
              continue; // Saltar duplicado silenciosamente
            }
          }

          // Crear deal
          await pool.query(
            `INSERT INTO deals (persona_id, agente_id, poliza, producto, compania, prima, fecha_efecto, estado, fuente, hoja_origen)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [personaId, agenteId, poliza, producto, compania, prima, fechaEfecto, estado, req.file.originalname, sheetName]
          );
          results.totals.deals_creados++;
          sheetResult.deals++;

        } catch (err) {
          results.errors.push({ hoja: sheetName, fila: rowNum, error: err.message, datos: row.slice(0, 5).join(' | ') });
          results.totals.errores++;
          sheetResult.errores++;
        }
      }

      results.hojas.push(sheetResult);
    }

    // Guardar log de importación
    await pool.query(
      `INSERT INTO import_logs (user_id, filename, tipo, hojas_procesadas, filas_procesadas, personas_creadas, deals_creados, errores, detalle_errores)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [req.user.id, req.file.originalname, tipo,
       results.totals.hojas_procesadas, results.totals.filas_procesadas,
       results.totals.personas_creadas, results.totals.deals_creados,
       results.totals.errores, JSON.stringify(results.errors)]
    );

    res.json(results);
  } catch (err) {
    console.error('Error procesando Excel:', err);
    res.status(500).json({ error: `Error procesando archivo: ${err.message}` });
  } finally {
    // Limpiar archivo temporal
    fs.unlink(filePath, () => {});
  }
});

// GET /api/import/logs — historial de importaciones
router.get('/logs', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT il.*, u.nombre AS user_nombre
      FROM import_logs il
      JOIN users u ON il.user_id = u.id
      ORDER BY il.created_at DESC
      LIMIT 50
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error listando importaciones:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/import/logs/:id/errors — descargar errores como Excel
router.get('/logs/:id/errors', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM import_logs WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Importación no encontrada' });
    }

    const log = result.rows[0];
    const errors = log.detalle_errores || [];

    if (errors.length === 0) {
      return res.status(404).json({ error: 'No hay errores en esta importación' });
    }

    // Crear Excel con errores
    const wsData = [['Hoja', 'Fila', 'Error', 'Datos']];
    errors.forEach((e) => {
      wsData.push([e.hoja || '', e.fila || '', e.error || '', e.datos || '']);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [{ wch: 20 }, { wch: 8 }, { wch: 50 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Errores');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="errores_${log.filename}.xlsx"`);
    res.send(buffer);
  } catch (err) {
    console.error('Error descargando errores:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/import/stats — estadísticas generales
router.get('/stats', async (req, res) => {
  try {
    const [personas, deals, imports] = await Promise.all([
      pool.query('SELECT COUNT(*) AS count FROM personas'),
      pool.query('SELECT COUNT(*) AS count FROM deals'),
      pool.query('SELECT COUNT(*) AS count FROM import_logs'),
    ]);
    res.json({
      personas: parseInt(personas.rows[0].count),
      deals: parseInt(deals.rows[0].count),
      importaciones: parseInt(imports.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
