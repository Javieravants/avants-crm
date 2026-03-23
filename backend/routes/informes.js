const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();
router.use(authMiddleware);

// Upload para importar
const upload = multer({
  dest: path.join(__dirname, '../../uploads/imports'),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// =============================================
// TAB 1 — Resumen general (KPIs)
// =============================================
router.get('/resumen', async (req, res) => {
  const { desde, hasta, agente_id, pipeline_id, etiqueta_id } = req.query;
  const desdeDate = desde || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const hastaDate = hasta || new Date().toISOString().split('T')[0];

  try {
    let etqJoin = '';
    let etqWhere = '';
    const baseValues = [desdeDate, hastaDate];
    let idx = 3;

    if (agente_id) {
      etqWhere += ` AND d.agente_id = $${idx++}`;
      baseValues.push(parseInt(agente_id));
    }
    if (pipeline_id) {
      etqWhere += ` AND d.pipeline_id = $${idx++}`;
      baseValues.push(parseInt(pipeline_id));
    }
    if (etiqueta_id) {
      etqJoin = ' JOIN deal_etiquetas de2 ON de2.deal_id = d.id';
      etqWhere += ` AND de2.etiqueta_id = $${idx++}`;
      baseValues.push(parseInt(etiqueta_id));
    }

    // Total leads (deals creados en periodo)
    const leadsQ = await pool.query(
      `SELECT COUNT(*) AS total FROM deals d ${etqJoin} WHERE d.created_at::date >= $1 AND d.created_at::date <= $2 ${etqWhere}`,
      baseValues
    );

    // Deals ganados + importe
    const wonQ = await pool.query(
      `SELECT COUNT(*) AS total, COALESCE(SUM(d.prima), 0) AS importe
       FROM deals d ${etqJoin}
       WHERE d.pipedrive_status = 'won' AND d.updated_at::date >= $1 AND d.updated_at::date <= $2 ${etqWhere}`,
      baseValues
    );

    // Deals perdidos
    const lostQ = await pool.query(
      `SELECT COUNT(*) AS total FROM deals d ${etqJoin}
       WHERE d.pipedrive_status = 'lost' AND d.updated_at::date >= $1 AND d.updated_at::date <= $2 ${etqWhere}`,
      baseValues
    );

    // MRR (prima mensual activa — todos los deals won, sin filtro de fecha)
    let mrrWhere = "d.pipedrive_status = 'won'";
    const mrrVals = [];
    let mrrIdx = 1;
    if (agente_id) { mrrWhere += ` AND d.agente_id = $${mrrIdx++}`; mrrVals.push(parseInt(agente_id)); }
    if (pipeline_id) { mrrWhere += ` AND d.pipeline_id = $${mrrIdx++}`; mrrVals.push(parseInt(pipeline_id)); }
    if (etiqueta_id) { mrrWhere += ` AND de2.etiqueta_id = $${mrrIdx++}`; mrrVals.push(parseInt(etiqueta_id)); }
    const mrrQ = await pool.query(
      `SELECT COALESCE(SUM(d.prima), 0) AS mrr FROM deals d ${etqJoin} WHERE ${mrrWhere}`,
      mrrVals
    );

    // Llamadas en periodo
    const callsQ = await pool.query(
      `SELECT COUNT(*) AS total FROM contact_history
       WHERE tipo = 'llamada' AND created_at::date >= $1 AND created_at::date <= $2`,
      [desdeDate, hastaDate]
    );

    const won = parseInt(wonQ.rows[0].total);
    const lost = parseInt(lostQ.rows[0].total);
    const totalClosed = won + lost;

    res.json({
      leads: parseInt(leadsQ.rows[0].total),
      ganados: won,
      importe_ganado: parseFloat(wonQ.rows[0].importe),
      perdidos: lost,
      tasa_conversion: totalClosed > 0 ? Math.round((won / totalClosed) * 100) : 0,
      mrr: parseFloat(mrrQ.rows[0].mrr),
      llamadas: parseInt(callsQ.rows[0].total),
      periodo: { desde: desdeDate, hasta: hastaDate },
    });
  } catch (err) {
    console.error('Error resumen informes:', err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// TAB 2 — Ganados / Perdidos
// =============================================
router.get('/deals', async (req, res) => {
  const { status, desde, hasta, agente_id, pipeline_id, etiqueta_id, page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const desdeDate = desde || '2020-01-01';
  const hastaDate = hasta || new Date().toISOString().split('T')[0];

  try {
    let where = [`d.updated_at::date >= $1`, `d.updated_at::date <= $2`];
    const values = [desdeDate, hastaDate];
    let idx = 3;
    let joins = `LEFT JOIN personas p ON p.id = d.persona_id
                 LEFT JOIN users u ON u.id = d.agente_id
                 LEFT JOIN pipelines pl ON pl.id = d.pipeline_id`;

    if (status) {
      where.push(`d.pipedrive_status = $${idx++}`);
      values.push(status);
    }
    if (agente_id) {
      where.push(`d.agente_id = $${idx++}`);
      values.push(parseInt(agente_id));
    }
    if (pipeline_id) {
      where.push(`d.pipeline_id = $${idx++}`);
      values.push(parseInt(pipeline_id));
    }
    if (etiqueta_id) {
      joins += ' JOIN deal_etiquetas de2 ON de2.deal_id = d.id';
      where.push(`de2.etiqueta_id = $${idx++}`);
      values.push(parseInt(etiqueta_id));
    }

    const countQ = await pool.query(
      `SELECT COUNT(*) AS total FROM deals d ${joins} WHERE ${where.join(' AND ')}`, values
    );

    values.push(parseInt(limit));
    values.push(offset);
    const dataQ = await pool.query(
      `SELECT d.id, d.pipedrive_id, d.producto, d.prima, d.pipedrive_status, d.estado,
              d.updated_at, d.created_at,
              p.nombre AS contacto, p.id AS persona_id,
              u.nombre AS agente,
              pl.name AS pipeline
       FROM deals d ${joins}
       WHERE ${where.join(' AND ')}
       ORDER BY d.updated_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      values
    );

    res.json({
      deals: dataQ.rows,
      pagination: {
        total: parseInt(countQ.rows[0].total),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(parseInt(countQ.rows[0].total) / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('Error deals informes:', err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// TAB 3 — MRR (Primas activas por mes)
// =============================================
router.get('/mrr', async (req, res) => {
  try {
    // MRR total actual
    const totalQ = await pool.query(
      `SELECT COALESCE(SUM(prima), 0) AS total FROM deals WHERE pipedrive_status = 'won'`
    );

    // Desglose por pipeline
    const byPipelineQ = await pool.query(
      `SELECT pl.name AS pipeline, COALESCE(SUM(d.prima), 0) AS total
       FROM deals d
       LEFT JOIN pipelines pl ON pl.id = d.pipeline_id
       WHERE d.pipedrive_status = 'won'
       GROUP BY pl.name
       ORDER BY total DESC`
    );

    // Últimos 12 meses — deals ganados por mes
    const monthlyQ = await pool.query(
      `SELECT TO_CHAR(d.updated_at, 'YYYY-MM') AS mes,
              COALESCE(SUM(d.prima), 0) AS total,
              COUNT(*) AS cantidad
       FROM deals d
       WHERE d.pipedrive_status = 'won'
         AND d.updated_at >= NOW() - INTERVAL '12 months'
       GROUP BY mes
       ORDER BY mes`
    );

    res.json({
      mrr_total: parseFloat(totalQ.rows[0].total),
      por_pipeline: byPipelineQ.rows,
      mensual: monthlyQ.rows,
    });
  } catch (err) {
    console.error('Error MRR informes:', err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// TAB 4 — Actividad agentes
// =============================================
router.get('/agentes', async (req, res) => {
  const { desde, hasta } = req.query;
  const desdeDate = desde || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const hastaDate = hasta || new Date().toISOString().split('T')[0];

  try {
    const agentesQ = await pool.query(
      `SELECT u.id, u.nombre, u.avatar_color,
        (SELECT COUNT(*) FROM contact_history ch WHERE ch.agente_id = u.id AND ch.tipo = 'llamada' AND ch.created_at::date >= $1 AND ch.created_at::date <= $2) AS llamadas,
        (SELECT COUNT(*) FROM contact_history ch WHERE ch.agente_id = u.id AND ch.tipo = 'nota' AND ch.created_at::date >= $1 AND ch.created_at::date <= $2) AS notas,
        (SELECT COUNT(*) FROM propuestas pr WHERE pr.deal_id IN (SELECT id FROM deals WHERE agente_id = u.id) AND pr.created_at::date >= $1 AND pr.created_at::date <= $2) AS propuestas,
        (SELECT COUNT(*) FROM deals d WHERE d.agente_id = u.id AND d.pipedrive_status = 'won' AND d.updated_at::date >= $1 AND d.updated_at::date <= $2) AS ganados,
        (SELECT COALESCE(SUM(pr2.puntos), 0) FROM propuestas pr2 WHERE pr2.deal_id IN (SELECT id FROM deals WHERE agente_id = u.id) AND pr2.created_at::date >= $1 AND pr2.created_at::date <= $2) AS puntos
       FROM users u
       WHERE u.activo = true
       ORDER BY ganados DESC, llamadas DESC`,
      [desdeDate, hastaDate]
    );

    res.json({ agentes: agentesQ.rows, periodo: { desde: desdeDate, hasta: hastaDate } });
  } catch (err) {
    console.error('Error agentes informes:', err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// TAB 5 — Exportar
// =============================================
router.get('/exportar', async (req, res) => {
  const { tipo, formato, desde, hasta, agente_id, pipeline_id, etiqueta_id } = req.query;
  const desdeDate = desde || '2020-01-01';
  const hastaDate = hasta || new Date().toISOString().split('T')[0];

  try {
    let rows = [];
    let filename = 'export';

    if (tipo === 'contactos') {
      const q = await pool.query(
        `SELECT p.nombre, p.dni, p.telefono, p.email, p.provincia, p.localidad, p.created_at
         FROM personas p ORDER BY p.nombre LIMIT 10000`
      );
      rows = q.rows;
      filename = 'contactos';
    } else if (tipo === 'ganados') {
      let where = [`d.pipedrive_status = 'won'`, `d.updated_at::date >= $1`, `d.updated_at::date <= $2`];
      const vals = [desdeDate, hastaDate];
      let i = 3;
      if (agente_id) { where.push(`d.agente_id = $${i++}`); vals.push(parseInt(agente_id)); }
      if (pipeline_id) { where.push(`d.pipeline_id = $${i++}`); vals.push(parseInt(pipeline_id)); }

      const q = await pool.query(
        `SELECT p.nombre AS contacto, p.dni, p.telefono, p.email,
                d.producto, d.prima, d.poliza, d.pipedrive_stage AS etapa,
                pl.name AS pipeline, u.nombre AS agente, d.updated_at AS fecha
         FROM deals d
         LEFT JOIN personas p ON p.id = d.persona_id
         LEFT JOIN users u ON u.id = d.agente_id
         LEFT JOIN pipelines pl ON pl.id = d.pipeline_id
         WHERE ${where.join(' AND ')}
         ORDER BY d.updated_at DESC LIMIT 10000`,
        vals
      );
      rows = q.rows;
      filename = 'deals_ganados';
    } else if (tipo === 'perdidos') {
      let where = [`d.pipedrive_status = 'lost'`, `d.updated_at::date >= $1`, `d.updated_at::date <= $2`];
      const vals = [desdeDate, hastaDate];
      let i = 3;
      if (agente_id) { where.push(`d.agente_id = $${i++}`); vals.push(parseInt(agente_id)); }

      const q = await pool.query(
        `SELECT p.nombre AS contacto, p.dni, p.telefono, p.email,
                d.producto, d.prima, pl.name AS pipeline, u.nombre AS agente, d.updated_at AS fecha
         FROM deals d
         LEFT JOIN personas p ON p.id = d.persona_id
         LEFT JOIN users u ON u.id = d.agente_id
         LEFT JOIN pipelines pl ON pl.id = d.pipeline_id
         WHERE ${where.join(' AND ')}
         ORDER BY d.updated_at DESC LIMIT 10000`,
        vals
      );
      rows = q.rows;
      filename = 'deals_perdidos';
    } else {
      // Todos los deals
      const q = await pool.query(
        `SELECT p.nombre AS contacto, d.producto, d.prima, d.pipedrive_status AS estado,
                d.poliza, pl.name AS pipeline, u.nombre AS agente, d.updated_at AS fecha
         FROM deals d
         LEFT JOIN personas p ON p.id = d.persona_id
         LEFT JOIN users u ON u.id = d.agente_id
         LEFT JOIN pipelines pl ON pl.id = d.pipeline_id
         WHERE d.updated_at::date >= $1 AND d.updated_at::date <= $2
         ORDER BY d.updated_at DESC LIMIT 10000`,
        [desdeDate, hastaDate]
      );
      rows = q.rows;
      filename = 'deals_todos';
    }

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Sin datos para exportar' });
    }

    if (formato === 'xlsx') {
      // Generar CSV con BOM para Excel
      const BOM = '\ufeff';
      const headers = Object.keys(rows[0]);
      const csvLines = [headers.join(';')];
      for (const row of rows) {
        csvLines.push(headers.map(h => {
          let val = row[h];
          if (val instanceof Date) val = val.toLocaleDateString('es-ES');
          if (val === null || val === undefined) val = '';
          return `"${String(val).replace(/"/g, '""')}"`;
        }).join(';'));
      }
      const csv = BOM + csvLines.join('\r\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}_${desdeDate}_${hastaDate}.csv"`);
      return res.send(csv);
    }

    // CSV estándar
    const headers = Object.keys(rows[0]);
    const csvLines = [headers.join(',')];
    for (const row of rows) {
      csvLines.push(headers.map(h => {
        let val = row[h];
        if (val instanceof Date) val = val.toISOString().split('T')[0];
        if (val === null || val === undefined) val = '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(','));
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}_${desdeDate}_${hastaDate}.csv"`);
    res.send(csvLines.join('\r\n'));
  } catch (err) {
    console.error('Error exportar informes:', err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// TAB 5 — Importar
// =============================================
router.post('/importar', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Archivo requerido' });

  try {
    const content = fs.readFileSync(req.file.path, 'utf8');
    const lines = content.trim().split('\n').filter(l => l.trim());
    if (lines.length < 2) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'El archivo debe tener al menos 2 filas (cabecera + datos)' });
    }

    // Parsear cabecera y datos
    const sep = lines[0].includes(';') ? ';' : ',';
    const headers = lines[0].split(sep).map(h => h.replace(/["']/g, '').trim().toLowerCase());

    // Mapeo de columnas (automático por nombre de cabecera)
    const colMap = JSON.parse(req.body.column_map || '{}');
    const nameCol = colMap.nombre || headers.findIndex(h => /nombre|name|contacto/i.test(h));
    const phoneCol = colMap.telefono || headers.findIndex(h => /telefono|phone|tel|móvil/i.test(h));
    const emailCol = colMap.email || headers.findIndex(h => /email|correo|mail/i.test(h));
    const dniCol = colMap.dni || headers.findIndex(h => /dni|nif|cif|documento/i.test(h));

    let imported = 0, duplicates = 0, errors = 0;
    const preview = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(sep).map(c => c.replace(/["']/g, '').trim());

      const nombre = nameCol >= 0 ? cols[nameCol] : null;
      const telefono = phoneCol >= 0 ? cols[phoneCol] : null;
      const email = emailCol >= 0 ? cols[emailCol] : null;
      const dni = dniCol >= 0 ? cols[dniCol] : null;

      if (i <= 5) preview.push({ nombre, telefono, email, dni });

      if (!nombre && !telefono && !email) { errors++; continue; }

      try {
        // Check duplicados por teléfono o email
        if (telefono) {
          const ex = await pool.query('SELECT id FROM personas WHERE telefono = $1', [telefono]);
          if (ex.rows.length > 0) { duplicates++; continue; }
        }
        if (email) {
          const ex = await pool.query('SELECT id FROM personas WHERE email = $1', [email]);
          if (ex.rows.length > 0) { duplicates++; continue; }
        }

        await pool.query(
          `INSERT INTO personas (nombre, telefono, email, dni, tenant_id)
           VALUES ($1, $2, $3, $4, 1)`,
          [nombre, telefono, email, dni ? dni.toUpperCase() : null]
        );
        imported++;
      } catch {
        errors++;
      }
    }

    // Limpiar archivo temporal
    fs.unlinkSync(req.file.path);

    res.json({
      imported,
      duplicates,
      errors,
      total: lines.length - 1,
      preview,
    });
  } catch (err) {
    if (req.file?.path) try { fs.unlinkSync(req.file.path); } catch {}
    console.error('Error importar:', err);
    res.status(500).json({ error: err.message });
  }
});

// Previsualización de archivo antes de importar
router.post('/importar/preview', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Archivo requerido' });

  try {
    const content = fs.readFileSync(req.file.path, 'utf8');
    const lines = content.trim().split('\n').filter(l => l.trim());
    const sep = lines[0].includes(';') ? ';' : ',';
    const headers = lines[0].split(sep).map(h => h.replace(/["']/g, '').trim());
    const rows = [];
    for (let i = 1; i <= Math.min(5, lines.length - 1); i++) {
      rows.push(lines[i].split(sep).map(c => c.replace(/["']/g, '').trim()));
    }

    fs.unlinkSync(req.file.path);
    res.json({ headers, rows, total: lines.length - 1 });
  } catch (err) {
    if (req.file?.path) try { fs.unlinkSync(req.file.path); } catch {}
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
