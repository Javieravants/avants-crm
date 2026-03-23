const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/roles');

const router = express.Router();
router.use(authMiddleware);

// POST /api/admin/tenants — crear nuevo tenant (solo superadmin)
router.post('/tenants', requireRole('superadmin'), async (req, res) => {
  const { nombre, slug, plan, pipedrive_token, cloudtalk_key, cloudtalk_secret,
    admin_nombre, admin_email, admin_password, color_primario, max_usuarios, max_contactos } = req.body;

  if (!nombre || !slug || !admin_nombre || !admin_email || !admin_password) {
    return res.status(400).json({ error: 'nombre, slug, admin_nombre, admin_email y admin_password son obligatorios' });
  }

  try {
    // Verificar slug único
    const slugCheck = await pool.query('SELECT id FROM tenants WHERE slug = $1', [slug]);
    if (slugCheck.rows.length > 0) {
      return res.status(409).json({ error: 'El slug ya existe' });
    }

    // Crear tenant
    const tenantR = await pool.query(
      `INSERT INTO tenants (nombre, slug, plan, pipedrive_token, cloudtalk_key, cloudtalk_secret, color_primario, max_usuarios, max_contactos)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [nombre, slug, plan || 'pro', pipedrive_token || null, cloudtalk_key || null,
       cloudtalk_secret || null, color_primario || '#009DDD', max_usuarios || 20, max_contactos || 200000]
    );
    const tenant = tenantR.rows[0];

    // Crear usuario admin del nuevo tenant
    const hash = await bcrypt.hash(admin_password, 10);
    const userR = await pool.query(
      `INSERT INTO users (nombre, email, password_hash, password_visible, rol, tenant_id, activo)
       VALUES ($1, $2, $3, $4, 'admin', $5, true) RETURNING id, nombre, email, rol, tenant_id`,
      [admin_nombre, admin_email, hash, admin_password, tenant.id]
    );

    res.status(201).json({
      tenant,
      admin: userR.rows[0],
      acceso: { url: `https://${slug}.avantssuite.com`, email: admin_email, password: admin_password }
    });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email o slug duplicado' });
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/tenants — listar todos (solo superadmin)
router.get('/tenants', requireRole('superadmin'), async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT t.*,
        (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id AND u.activo = true) as usuarios,
        (SELECT COUNT(*) FROM personas p WHERE p.tenant_id = t.id) as contactos,
        (SELECT COUNT(*) FROM deals d WHERE d.tenant_id = t.id AND d.pipedrive_status = 'open') as deals_open
      FROM tenants t ORDER BY t.id
    `);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/admin/tenants/:id — actualizar tenant (solo superadmin)
router.patch('/tenants/:id', requireRole('superadmin'), async (req, res) => {
  const { nombre, plan, activo, max_usuarios, max_contactos, pipedrive_token, cloudtalk_key, color_primario } = req.body;
  try {
    const fields = [];
    const vals = [];
    let idx = 1;
    if (nombre !== undefined) { fields.push(`nombre = $${idx}`); vals.push(nombre); idx++; }
    if (plan !== undefined) { fields.push(`plan = $${idx}`); vals.push(plan); idx++; }
    if (activo !== undefined) { fields.push(`activo = $${idx}`); vals.push(activo); idx++; }
    if (max_usuarios !== undefined) { fields.push(`max_usuarios = $${idx}`); vals.push(max_usuarios); idx++; }
    if (max_contactos !== undefined) { fields.push(`max_contactos = $${idx}`); vals.push(max_contactos); idx++; }
    if (pipedrive_token !== undefined) { fields.push(`pipedrive_token = $${idx}`); vals.push(pipedrive_token); idx++; }
    if (cloudtalk_key !== undefined) { fields.push(`cloudtalk_key = $${idx}`); vals.push(cloudtalk_key); idx++; }
    if (color_primario !== undefined) { fields.push(`color_primario = $${idx}`); vals.push(color_primario); idx++; }
    if (fields.length === 0) return res.status(400).json({ error: 'Nada que actualizar' });
    vals.push(req.params.id);
    const r = await pool.query(`UPDATE tenants SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, vals);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Tenant no encontrado' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
