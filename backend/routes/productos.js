// Catalogo de productos — companias, categorias, productos, documentos
// REGLA 17: todo por ID dinamico, nunca nombres hardcodeados
const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');
const requireRole = require('../middleware/roles');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();
router.use(authMiddleware);
router.use(tenantMiddleware);

// Upload temporal → luego a Hetzner S3
const UPLOAD_DIR = path.join(__dirname, '../../uploads/productos');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const upload = multer({ dest: UPLOAD_DIR, limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB

async function uploadToS3(filePath, originalName) {
  try {
    const { uploadFile } = require('../utils/storage');
    const ext = path.extname(originalName);
    const key = `productos/${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
    const url = await uploadFile(filePath, key);
    fs.unlink(filePath, () => {}); // limpiar tmp
    return url;
  } catch {
    // Fallback: servir desde local
    return `/uploads/productos/${path.basename(filePath)}`;
  }
}

function isAdmin(req) {
  return ['admin', 'superadmin'].includes(req.user.rol);
}

// ══════════════════════════════════════════════
// COMPANIAS
// ══════════════════════════════════════════════

// GET /api/companias
router.get('/companias', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*,
        (SELECT COUNT(*) FROM categorias_producto WHERE compania_id = c.id AND activa = true) as num_categorias,
        (SELECT COUNT(*) FROM productos WHERE compania_id = c.id AND activo = true) as num_productos,
        (SELECT COUNT(*) FROM compania_agentes WHERE compania_id = c.id AND activa = true) as num_agentes
      FROM companias c
      WHERE c.tenant_id = $1 AND c.activa = true
      ORDER BY c.nombre
    `, [req.tenantId]);
    res.json({ companias: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/companias
router.post('/companias', requireRole('admin', 'supervisor'), async (req, res) => {
  try {
    const { nombre, nombre_corto, logo_url, color } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Nombre obligatorio' });
    const r = await pool.query(
      `INSERT INTO companias (tenant_id, nombre, nombre_corto, logo_url, color)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.tenantId, nombre, nombre_corto || null, logo_url || null, color || '#009DDD']);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/companias/:id
router.put('/companias/:id', requireRole('admin', 'supervisor'), async (req, res) => {
  try {
    const fields = []; const vals = []; let idx = 1;
    for (const key of ['nombre', 'nombre_corto', 'logo_url', 'color', 'activa']) {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = $${idx}`); vals.push(req.body[key]); idx++;
      }
    }
    if (!fields.length) return res.status(400).json({ error: 'Nada que actualizar' });
    vals.push(req.params.id, req.tenantId);
    const r = await pool.query(
      `UPDATE companias SET ${fields.join(', ')} WHERE id = $${idx} AND tenant_id = $${idx + 1} RETURNING *`, vals);
    if (!r.rows.length) return res.status(404).json({ error: 'No encontrada' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/companias/:id — soft delete
router.delete('/companias/:id', requireRole('admin'), async (req, res) => {
  try {
    await pool.query('UPDATE companias SET activa = false WHERE id = $1 AND tenant_id = $2',
      [req.params.id, req.tenantId]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════
// CATEGORIAS
// ══════════════════════════════════════════════

// GET /api/companias/:id/categorias
router.get('/companias/:id/categorias', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT cp.*,
        (SELECT COUNT(*) FROM productos WHERE categoria_id = cp.id AND activo = true) as num_productos,
        (SELECT COUNT(*) FROM categoria_documentos WHERE categoria_id = cp.id) as num_documentos
      FROM categorias_producto cp
      WHERE cp.compania_id = $1 AND cp.activa = true
      ORDER BY cp.orden, cp.nombre
    `, [req.params.id]);
    res.json({ categorias: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/companias/:id/categorias
router.post('/companias/:id/categorias', requireRole('admin', 'supervisor'), async (req, res) => {
  try {
    const { nombre, descripcion, icono } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Nombre obligatorio' });
    const maxOrden = await pool.query(
      'SELECT COALESCE(MAX(orden), 0) + 1 as next FROM categorias_producto WHERE compania_id = $1',
      [req.params.id]);
    const r = await pool.query(
      `INSERT INTO categorias_producto (compania_id, nombre, descripcion, icono, orden)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.params.id, nombre, descripcion || null, icono || null, maxOrden.rows[0].next]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/categorias/:id
router.put('/categorias/:id', requireRole('admin', 'supervisor'), async (req, res) => {
  try {
    const fields = []; const vals = []; let idx = 1;
    for (const key of ['nombre', 'descripcion', 'icono', 'activa', 'orden']) {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = $${idx}`); vals.push(req.body[key]); idx++;
      }
    }
    if (!fields.length) return res.status(400).json({ error: 'Nada que actualizar' });
    vals.push(req.params.id);
    const r = await pool.query(
      `UPDATE categorias_producto SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, vals);
    if (!r.rows.length) return res.status(404).json({ error: 'No encontrada' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════
// PRODUCTOS
// ══════════════════════════════════════════════

// GET /api/productos — todos, con filtro opcional por compania
router.get('/productos', async (req, res) => {
  try {
    let sql = `
      SELECT p.*, c.nombre as compania_nombre, c.color as compania_color,
             cp.nombre as categoria_nombre
      FROM productos p
      JOIN companias c ON c.id = p.compania_id
      LEFT JOIN categorias_producto cp ON cp.id = p.categoria_id
      WHERE p.tenant_id = $1 AND p.activo = true`;
    const params = [req.tenantId];
    let idx = 2;

    if (req.query.compania_id) {
      sql += ` AND p.compania_id = $${idx}`;
      params.push(req.query.compania_id); idx++;
    }
    if (req.query.categoria_id) {
      sql += ` AND p.categoria_id = $${idx}`;
      params.push(req.query.categoria_id); idx++;
    }
    sql += ' ORDER BY c.nombre, cp.orden, p.orden, p.nombre';

    const { rows } = await pool.query(sql, params);
    res.json({ productos: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/categorias/:id/productos
router.get('/categorias/:id/productos', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.*, c.nombre as compania_nombre
      FROM productos p
      JOIN companias c ON c.id = p.compania_id
      WHERE p.categoria_id = $1 AND p.activo = true
      ORDER BY p.orden, p.nombre
    `, [req.params.id]);
    res.json({ productos: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/productos
router.post('/productos', requireRole('admin', 'supervisor'), async (req, res) => {
  try {
    const { compania_id, categoria_id, nombre, descripcion, resumen_coberturas,
            comision_tipo, comision_valor, puntos_base, precio_base } = req.body;
    if (!compania_id || !nombre) return res.status(400).json({ error: 'compania_id y nombre obligatorios' });

    const maxOrden = await pool.query(
      'SELECT COALESCE(MAX(orden), 0) + 1 as next FROM productos WHERE categoria_id = $1',
      [categoria_id]);
    const r = await pool.query(
      `INSERT INTO productos
        (tenant_id, compania_id, categoria_id, nombre, descripcion, resumen_coberturas,
         comision_tipo, comision_valor, puntos_base, precio_base, orden)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [req.tenantId, compania_id, categoria_id || null, nombre, descripcion || null,
       resumen_coberturas || null, comision_tipo || null, comision_valor || null,
       puntos_base || 0, precio_base || null, maxOrden.rows[0].next]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/productos/:id
router.put('/productos/:id', requireRole('admin', 'supervisor'), async (req, res) => {
  try {
    const fields = []; const vals = []; let idx = 1;
    const editables = ['nombre', 'descripcion', 'resumen_coberturas', 'categoria_id',
      'comision_tipo', 'comision_valor', 'puntos_base', 'precio_base', 'precio_tipo', 'activo', 'orden'];
    for (const key of editables) {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = $${idx}`); vals.push(req.body[key]); idx++;
      }
    }
    if (!fields.length) return res.status(400).json({ error: 'Nada que actualizar' });
    vals.push(req.params.id, req.tenantId);
    const r = await pool.query(
      `UPDATE productos SET ${fields.join(', ')} WHERE id = $${idx} AND tenant_id = $${idx + 1} RETURNING *`, vals);
    if (!r.rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════
// DOCUMENTOS
// ══════════════════════════════════════════════

// POST /api/categorias/:id/documentos — subir doc a categoria
router.post('/categorias/:id/documentos', requireRole('admin', 'supervisor'),
  upload.single('archivo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Archivo obligatorio' });
    const url = await uploadToS3(req.file.path, req.file.originalname);
    const { nombre, descripcion, tipo, vigente_desde, vigente_hasta } = req.body;
    const r = await pool.query(
      `INSERT INTO categoria_documentos
        (categoria_id, nombre, descripcion, archivo_url, tipo, vigente_desde, vigente_hasta, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.params.id, nombre || req.file.originalname, descripcion || null,
       url, tipo || 'otro', vigente_desde || null, vigente_hasta || null, req.user.id]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/productos/:id/documentos — docs del producto + heredados de categoria
router.get('/productos/:id/documentos', async (req, res) => {
  try {
    // Docs propios del producto
    const propios = await pool.query(
      `SELECT *, 'producto' as fuente FROM producto_documentos WHERE producto_id = $1 ORDER BY created_at DESC`,
      [req.params.id]);

    // Docs heredados de la categoria
    const prodR = await pool.query('SELECT categoria_id FROM productos WHERE id = $1', [req.params.id]);
    const catId = prodR.rows[0]?.categoria_id;
    let heredados = [];
    if (catId) {
      const catDocs = await pool.query(
        `SELECT *, 'categoria' as fuente FROM categoria_documentos WHERE categoria_id = $1 ORDER BY created_at DESC`,
        [catId]);
      heredados = catDocs.rows;
    }

    res.json({ propios: propios.rows, heredados });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/productos/:id/documentos — subir doc a producto
router.post('/productos/:id/documentos', requireRole('admin', 'supervisor'),
  upload.single('archivo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Archivo obligatorio' });
    const url = await uploadToS3(req.file.path, req.file.originalname);
    const { nombre, descripcion, tipo, vigente_desde, vigente_hasta } = req.body;
    const r = await pool.query(
      `INSERT INTO producto_documentos
        (producto_id, nombre, descripcion, archivo_url, tipo, vigente_desde, vigente_hasta, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.params.id, nombre || req.file.originalname, descripcion || null,
       url, tipo || 'otro', vigente_desde || null, vigente_hasta || null, req.user.id]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/documentos/:tipo/:id — eliminar documento
router.delete('/documentos/:tipo/:id', requireRole('admin', 'supervisor'), async (req, res) => {
  try {
    const table = req.params.tipo === 'categoria' ? 'categoria_documentos' : 'producto_documentos';
    // Obtener URL para borrar de S3
    const docR = await pool.query(`SELECT archivo_url FROM ${table} WHERE id = $1`, [req.params.id]);
    if (docR.rows.length && docR.rows[0].archivo_url?.includes(process.env.HETZNER_PUBLIC_URL || '__none__')) {
      try {
        const { deleteFile } = require('../utils/storage');
        const key = docR.rows[0].archivo_url.split('/').slice(-2).join('/');
        await deleteFile(key);
      } catch {}
    }
    await pool.query(`DELETE FROM ${table} WHERE id = $1`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════
// GENERAR RESUMEN COBERTURAS CON IA
// ══════════════════════════════════════════════

// POST /api/productos/:id/generar-resumen
router.post('/productos/:id/generar-resumen', requireRole('admin', 'supervisor'), async (req, res) => {
  try {
    const prodId = req.params.id;

    // Obtener producto
    const prodR = await pool.query('SELECT * FROM productos WHERE id = $1', [prodId]);
    if (!prodR.rows.length) return res.status(404).json({ error: 'Producto no encontrado' });
    const prod = prodR.rows[0];

    // Buscar PDF: primero docs del producto, luego de la categoria
    let pdfUrl = null;
    const propDocs = await pool.query(
      `SELECT archivo_url FROM producto_documentos WHERE producto_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [prodId]);
    if (propDocs.rows.length) {
      pdfUrl = propDocs.rows[0].archivo_url;
    } else if (prod.categoria_id) {
      const catDocs = await pool.query(
        `SELECT archivo_url FROM categoria_documentos WHERE categoria_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [prod.categoria_id]);
      if (catDocs.rows.length) pdfUrl = catDocs.rows[0].archivo_url;
    }

    if (!pdfUrl) {
      return res.status(400).json({ error: 'No hay documentos PDF para este producto. Sube un PDF primero.' });
    }

    // Descargar PDF
    let pdfBuffer;
    if (pdfUrl.startsWith('http')) {
      const r = await fetch(pdfUrl);
      if (!r.ok) return res.status(502).json({ error: 'No se pudo descargar el PDF' });
      pdfBuffer = Buffer.from(await r.arrayBuffer());
    } else {
      // Archivo local
      const localPath = path.join(__dirname, '../..', pdfUrl);
      if (!fs.existsSync(localPath)) return res.status(404).json({ error: 'PDF no encontrado en disco' });
      pdfBuffer = fs.readFileSync(localPath);
    }

    // Extraer texto del PDF
    const pdfParse = require('pdf-parse');
    const pdfData = await pdfParse(pdfBuffer);
    const textoCompleto = pdfData.text || '';

    if (textoCompleto.length < 50) {
      return res.status(400).json({ error: 'El PDF no contiene texto legible (puede ser imagen/escaneado)' });
    }

    // Truncar a 8000 chars para no exceder limites del modelo
    const textoTruncado = textoCompleto.substring(0, 8000);

    // Enviar a Claude Haiku
    let Anthropic;
    try { Anthropic = require('@anthropic-ai/sdk'); } catch {}
    if (!Anthropic || !process.env.ANTHROPIC_API_KEY) {
      return res.status(400).json({ error: 'ANTHROPIC_API_KEY no configurada' });
    }
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `Eres un experto en seguros. Lee estas condiciones generales del producto "${prod.nombre}" y genera un resumen de coberturas en maximo 150 palabras, en espanol, en formato claro y directo para que un agente de ventas pueda explicarselo rapidamente a un cliente.

Incluye: que cubre, que NO cubre (exclusiones principales), y el diferencial principal frente a otros seguros.

TEXTO DEL DOCUMENTO:
${textoTruncado}

Responde SOLO con el resumen, sin titulo ni encabezado.`
      }],
    });

    const resumen = response.content[0]?.text?.trim() || '';

    // Guardar en BD
    await pool.query('UPDATE productos SET resumen_coberturas = $1 WHERE id = $2', [resumen, prodId]);

    res.json({ resumen, generado_por: 'ia' });
  } catch (e) {
    console.error('[IA] Generar resumen error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ══════════════════════════════════════════════
// AGENTES POR COMPANIA
// ══════════════════════════════════════════════

// GET /api/companias/:id/agentes
router.get('/companias/:id/agentes', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT ca.*, u.nombre as agente_nombre, u.email as agente_email, u.rol
      FROM compania_agentes ca
      JOIN users u ON u.id = ca.user_id AND u.activo = true
      WHERE ca.compania_id = $1 AND ca.activa = true
      ORDER BY u.nombre
    `, [req.params.id]);
    res.json({ agentes: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/companias/:id/agentes
router.post('/companias/:id/agentes', requireRole('admin', 'supervisor'), async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id obligatorio' });
    await pool.query(`
      INSERT INTO compania_agentes (compania_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT (compania_id, user_id) DO UPDATE SET activa = true
    `, [req.params.id, user_id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/companias/:id/agentes/:userId
router.delete('/companias/:id/agentes/:userId', requireRole('admin', 'supervisor'), async (req, res) => {
  try {
    await pool.query(
      'UPDATE compania_agentes SET activa = false WHERE compania_id = $1 AND user_id = $2',
      [req.params.id, req.params.userId]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════
// IA — PRODUCTOS FALTANTES
// ══════════════════════════════════════════════

// GET /api/ia/productos-faltantes/:personaId
// Compara polizas/deals del contacto con catalogo disponible
router.get('/ia/productos-faltantes/:personaId', async (req, res) => {
  try {
    const personaId = req.params.personaId;

    // Productos que ya tiene (de polizas + deals won)
    const [polizasR, dealsR] = await Promise.all([
      pool.query(`SELECT LOWER(producto) as producto, LOWER(compania) as compania
                  FROM polizas WHERE persona_id = $1 AND estado NOT IN ('baja','rechazado')`, [personaId]),
      pool.query(`SELECT LOWER(d.producto) as producto, LOWER(COALESCE(d.compania, pl.name)) as compania
                  FROM deals d LEFT JOIN pipelines pl ON pl.id = d.pipeline_id
                  WHERE d.persona_id = $1 AND (d.pipedrive_status = 'won' OR d.estado = 'poliza_activa')`, [personaId]),
    ]);

    const tieneSet = new Set();
    [...polizasR.rows, ...dealsR.rows].forEach(r => {
      if (r.producto) tieneSet.add(r.producto);
    });

    // Catalogo completo de productos activos del tenant
    const catalogoR = await pool.query(`
      SELECT p.id, p.nombre, p.resumen_coberturas, p.precio_base,
             c.nombre as compania_nombre, cp.nombre as categoria_nombre
      FROM productos p
      JOIN companias c ON c.id = p.compania_id AND c.activa = true
      LEFT JOIN categorias_producto cp ON cp.id = p.categoria_id
      WHERE p.tenant_id = $1 AND p.activo = true
      ORDER BY c.nombre, cp.orden, p.orden
    `, [req.tenantId]);

    // Filtrar los que no tiene
    const faltantes = catalogoR.rows.filter(p => !tieneSet.has(p.nombre.toLowerCase()));

    res.json({
      tiene: [...tieneSet],
      faltantes,
      total_catalogo: catalogoR.rows.length,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════
// RAPELES
// ══════════════════════════════════════════════

// GET /api/companias/:id/rapeles
router.get('/companias/:id/rapeles', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT * FROM rapeles
      WHERE compania_id = $1 AND activo = true
      ORDER BY created_at DESC
    `, [req.params.id]);
    res.json({ rapeles: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/companias/:id/rapeles
router.post('/companias/:id/rapeles', requireRole('admin', 'supervisor'), async (req, res) => {
  try {
    const { nombre, descripcion, tipo, periodicidad, fecha_inicio, fecha_fin, tramos } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Nombre obligatorio' });
    const r = await pool.query(
      `INSERT INTO rapeles (compania_id, nombre, descripcion, tipo, periodicidad, fecha_inicio, fecha_fin, tramos)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.params.id, nombre, descripcion || null, tipo || 'produccion',
       periodicidad || 'trimestral', fecha_inicio || null, fecha_fin || null,
       JSON.stringify(tramos || [])]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/rapeles/:id
router.put('/rapeles/:id', requireRole('admin', 'supervisor'), async (req, res) => {
  try {
    const fields = []; const vals = []; let idx = 1;
    for (const key of ['nombre', 'descripcion', 'tipo', 'periodicidad', 'fecha_inicio', 'fecha_fin', 'activo']) {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = $${idx}`); vals.push(req.body[key]); idx++;
      }
    }
    if (req.body.tramos !== undefined) {
      fields.push(`tramos = $${idx}`); vals.push(JSON.stringify(req.body.tramos)); idx++;
    }
    if (!fields.length) return res.status(400).json({ error: 'Nada que actualizar' });
    vals.push(req.params.id);
    const r = await pool.query(
      `UPDATE rapeles SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, vals);
    if (!r.rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/rapeles/:id — soft delete
router.delete('/rapeles/:id', requireRole('admin', 'supervisor'), async (req, res) => {
  try {
    await pool.query('UPDATE rapeles SET activo = false WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
