const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const ExcelJS = require('exceljs');

const router = express.Router();
router.use(authMiddleware);

// Filtro prima: excluir valores corruptos del parser de Pipedrive
const PRIMA_FILTER = 'd.prima > 0 AND d.prima <= 1000';

// Construir WHERE dinámico con filtros
function buildFilters(query) {
  const where = [];
  const values = [];
  let idx = 1;
  let joins = `LEFT JOIN personas p ON p.id = d.persona_id
               LEFT JOIN users u ON u.id = d.agente_id
               LEFT JOIN pipelines pi ON pi.id = d.pipeline_id
               LEFT JOIN deal_etiquetas de ON de.deal_id = d.id
               LEFT JOIN etiquetas e ON e.id = de.etiqueta_id`;

  if (query.desde) { where.push(`d.created_at::date >= $${idx++}`); values.push(query.desde); }
  if (query.hasta) { where.push(`d.created_at::date <= $${idx++}`); values.push(query.hasta); }
  if (query.agente_id) { where.push(`d.agente_id = $${idx++}`); values.push(parseInt(query.agente_id)); }
  if (query.pipeline_id) { where.push(`d.pipeline_id = $${idx++}`); values.push(parseInt(query.pipeline_id)); }
  if (query.etiqueta_id) { where.push(`de.etiqueta_id = $${idx++}`); values.push(parseInt(query.etiqueta_id)); }
  if (query.status && query.status !== 'all') {
    if (query.status === 'open') {
      where.push(`d.pipedrive_status = 'open'`);
    } else {
      where.push(`d.pipedrive_status = $${idx++}`);
      values.push(query.status);
    }
  }

  return { where: where.length ? where.join(' AND ') : '1=1', values, idx, joins };
}

// =============================================
// GET /api/informes/kpis
// =============================================
router.get('/kpis', async (req, res) => {
  try {
    const { where, values, joins } = buildFilters(req.query);

    const q = await pool.query(
      `SELECT
         COUNT(DISTINCT d.id) AS leads,
         COUNT(CASE WHEN d.pipedrive_status = 'won' THEN 1 END) AS ganados,
         COUNT(CASE WHEN d.pipedrive_status = 'lost' THEN 1 END) AS perdidos,
         ROUND(
           COUNT(CASE WHEN d.pipedrive_status = 'won' THEN 1 END)::numeric /
           NULLIF(COUNT(CASE WHEN d.pipedrive_status IN ('won','lost') THEN 1 END), 0) * 100, 1
         ) AS conversion,
         COALESCE(SUM(CASE WHEN d.pipedrive_status = 'won' AND ${PRIMA_FILTER} THEN d.prima ELSE 0 END), 0) AS prima_total
       FROM deals d ${joins}
       WHERE ${where}`,
      values
    );

    const r = q.rows[0];
    res.json({
      leads: parseInt(r.leads),
      ganados: parseInt(r.ganados),
      perdidos: parseInt(r.perdidos),
      conversion: parseFloat(r.conversion) || 0,
      prima_total: parseFloat(r.prima_total),
    });
  } catch (err) {
    console.error('Error KPIs:', err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// GET /api/informes/leads — tabla paginada
// =============================================
router.get('/leads', async (req, res) => {
  try {
    const { page = 1, limit = 50, tab } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const filters = { ...req.query };

    // Tab override
    if (tab === 'ganados') filters.status = 'won';
    else if (tab === 'perdidos') filters.status = 'lost';
    else if (tab === 'activos') filters.status = 'open';

    const { where, values, idx: nextIdx, joins } = buildFilters(filters);

    // Tab "agentes" — grupo especial
    if (tab === 'agentes') {
      const q = await pool.query(
        `SELECT u.id, u.nombre,
           COUNT(d.id) AS total_deals,
           COUNT(CASE WHEN d.pipedrive_status = 'won' THEN 1 END) AS ganados,
           COUNT(CASE WHEN d.pipedrive_status = 'lost' THEN 1 END) AS perdidos,
           COUNT(CASE WHEN d.pipedrive_status = 'open' THEN 1 END) AS activos,
           COALESCE(SUM(CASE WHEN d.pipedrive_status = 'won' AND ${PRIMA_FILTER} THEN d.prima ELSE 0 END), 0) AS prima_ganada
         FROM deals d ${joins}
         WHERE ${where}
         GROUP BY u.id, u.nombre
         HAVING u.nombre IS NOT NULL
         ORDER BY ganados DESC, total_deals DESC`,
        values
      );
      return res.json({ type: 'agentes', rows: q.rows });
    }

    // Tab "mrr" — grupo por pipeline
    if (tab === 'mrr') {
      const q = await pool.query(
        `SELECT pi.name AS pipeline, pi.color,
           COUNT(d.id) AS total,
           COALESCE(SUM(CASE WHEN ${PRIMA_FILTER} THEN d.prima ELSE 0 END), 0) AS prima_total,
           ROUND(AVG(CASE WHEN ${PRIMA_FILTER} THEN d.prima ELSE NULL END)::numeric, 2) AS prima_media
         FROM deals d ${joins}
         WHERE ${where} AND d.pipedrive_status = 'won'
         GROUP BY pi.name, pi.color
         ORDER BY prima_total DESC`,
        values
      );
      return res.json({ type: 'mrr', rows: q.rows });
    }

    // Conteo total
    const countQ = await pool.query(
      `SELECT COUNT(DISTINCT d.id) AS total FROM deals d ${joins} WHERE ${where}`, values
    );
    const total = parseInt(countQ.rows[0].total);

    // Totales de la selección (para fila de pie)
    const totalsQ = await pool.query(
      `SELECT
         COUNT(CASE WHEN d.pipedrive_status = 'won' THEN 1 END) AS ganados,
         COUNT(CASE WHEN d.pipedrive_status = 'lost' THEN 1 END) AS perdidos,
         COALESCE(SUM(CASE WHEN d.pipedrive_status = 'won' AND ${PRIMA_FILTER} THEN d.prima ELSE 0 END), 0) AS prima_ganada
       FROM deals d ${joins} WHERE ${where}`,
      values
    );

    // Datos paginados
    const dataValues = [...values, parseInt(limit), offset];
    const dataQ = await pool.query(
      `SELECT DISTINCT ON (d.id)
         d.id AS deal_id, d.pipedrive_status AS status,
         d.producto, d.tipo_poliza, d.poliza, d.num_solicitud,
         d.prima, d.created_at, d.updated_at,
         p.nombre AS contacto, p.telefono, p.email, p.dni, p.direccion, p.codigo_postal,
         p.id AS persona_id,
         u.nombre AS agente_nombre,
         pi.name AS pipeline_nombre, pi.color AS pipeline_color,
         e.nombre AS etiqueta_nombre, e.color AS etiqueta_color
       FROM deals d ${joins}
       WHERE ${where}
       ORDER BY d.id, d.created_at DESC
       LIMIT $${nextIdx} OFFSET $${nextIdx + 1}`,
      dataValues
    );

    res.json({
      type: 'leads',
      rows: dataQ.rows,
      totals: totalsQ.rows[0],
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    console.error('Error leads:', err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// GET /api/informes/exportar — CSV o Excel sin paginación
// =============================================
router.get('/exportar', async (req, res) => {
  try {
    const { formato, tab } = req.query;
    const filters = { ...req.query };
    if (tab === 'ganados') filters.status = 'won';
    else if (tab === 'perdidos') filters.status = 'lost';
    else if (tab === 'activos') filters.status = 'open';

    const { where, values, joins } = buildFilters(filters);

    const q = await pool.query(
      `SELECT DISTINCT ON (d.id)
         p.nombre, p.telefono, p.email, p.dni, p.direccion, p.codigo_postal,
         u.nombre AS agente,
         pi.name AS pipeline,
         e.nombre AS etiqueta,
         d.pipedrive_status AS estado,
         d.tipo_poliza, d.prima AS prima_mensual,
         d.poliza AS n_poliza, d.num_solicitud,
         d.fecha_efecto AS fecha_alta,
         d.created_at AS fecha_creacion
       FROM deals d ${joins}
       WHERE ${where}
       ORDER BY d.id, d.created_at DESC`,
      values
    );

    if (q.rows.length === 0) return res.status(404).json({ error: 'Sin datos' });

    const cols = [
      { header: 'Nombre', key: 'nombre' },
      { header: 'Teléfono', key: 'telefono' },
      { header: 'Email', key: 'email' },
      { header: 'DNI', key: 'dni' },
      { header: 'Dirección', key: 'direccion' },
      { header: 'CP', key: 'codigo_postal' },
      { header: 'Agente', key: 'agente' },
      { header: 'Pipeline', key: 'pipeline' },
      { header: 'Etiqueta', key: 'etiqueta' },
      { header: 'Estado', key: 'estado' },
      { header: 'Tipo póliza', key: 'tipo_poliza' },
      { header: 'Prima mensual', key: 'prima_mensual' },
      { header: 'Nº póliza', key: 'n_poliza' },
      { header: 'Nº solicitud', key: 'num_solicitud' },
      { header: 'Fecha alta', key: 'fecha_alta' },
      { header: 'Fecha creación', key: 'fecha_creacion' },
    ];

    if (formato === 'xlsx') {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Informes');
      ws.columns = cols.map(c => ({ header: c.header, key: c.key, width: 18 }));

      // Cabecera en negrita
      ws.getRow(1).font = { bold: true };

      for (const row of q.rows) {
        ws.addRow({
          ...row,
          prima_mensual: row.prima_mensual ? parseFloat(row.prima_mensual) : null,
          fecha_alta: row.fecha_alta ? new Date(row.fecha_alta).toLocaleDateString('es-ES') : '',
          fecha_creacion: row.fecha_creacion ? new Date(row.fecha_creacion).toLocaleDateString('es-ES') : '',
        });
      }

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="informes_export.xlsx"`);
      await wb.xlsx.write(res);
      return res.end();
    }

    // CSV con ; para Excel español
    const BOM = '\ufeff';
    const csvLines = [cols.map(c => c.header).join(';')];
    for (const row of q.rows) {
      csvLines.push(cols.map(c => {
        let v = row[c.key];
        if (v instanceof Date) v = v.toLocaleDateString('es-ES');
        if (v === null || v === undefined) v = '';
        return `"${String(v).replace(/"/g, '""')}"`;
      }).join(';'));
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="informes_export.csv"`);
    res.send(BOM + csvLines.join('\r\n'));
  } catch (err) {
    console.error('Error exportar:', err);
    res.status(500).json({ error: err.message });
  }
});

// =============================================
// GET /api/informes/filtros — opciones para dropdowns
// =============================================
router.get('/filtros', async (req, res) => {
  try {
    const [agentes, pipelines, etiquetas] = await Promise.all([
      pool.query('SELECT id, nombre FROM users WHERE activo = true ORDER BY nombre'),
      pool.query('SELECT id, name, color FROM pipelines WHERE active = true ORDER BY orden'),
      pool.query('SELECT id, nombre, color FROM etiquetas ORDER BY nombre'),
    ]);
    res.json({
      agentes: agentes.rows,
      pipelines: pipelines.rows,
      etiquetas: etiquetas.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
