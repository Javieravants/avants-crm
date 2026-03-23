const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/roles');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  try {
    const result = await pool.query(
      'SELECT id, nombre, email, password_hash, rol, activo FROM users WHERE email = $1',
      [email]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }
    if (!user.activo) {
      return res.status(403).json({ error: 'Usuario desactivado' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
      { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, empresa: user.empresa, tenant_id: user.tenant_id || 1 },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '8h' }
    );

    res.json({
      token,
      user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, empresa: user.empresa, tenant_id: user.tenant_id || 1 },
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/auth/me — info del usuario autenticado
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nombre, email, rol, telefono, activo, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error en /me:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST /api/auth/users — crear usuario (solo admin)
router.post('/users', authMiddleware, requireRole('admin'), async (req, res) => {
  const { nombre, email, password, rol, telefono, empresa } = req.body;
  if (!nombre || !email || !password || !rol) {
    return res.status(400).json({ error: 'Nombre, email, contraseña y rol son obligatorios' });
  }
  if (!['admin', 'supervisor', 'agent'].includes(rol)) {
    return res.status(400).json({ error: 'Rol inválido' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (nombre, email, password_hash, rol, telefono, password_visible, empresa)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, nombre, email, rol, telefono, password_visible, empresa, activo, created_at`,
      [nombre, email, hash, rol, telefono || null, password, empresa || 'ADESLAS']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }
    console.error('Error creando usuario:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/auth/users — listar usuarios (admin y supervisor)
router.get('/users', authMiddleware, requireRole('admin', 'supervisor'), async (req, res) => {
  try {
    // Solo admin ve password_visible
    const fields = req.user.rol === 'admin'
      ? 'id, nombre, email, rol, telefono, password_visible, empresa, activo, created_at'
      : 'id, nombre, email, rol, telefono, empresa, activo, created_at';
    const result = await pool.query(`SELECT ${fields} FROM users ORDER BY created_at DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error listando usuarios:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PATCH /api/auth/users/:id — actualizar usuario (solo admin)
router.patch('/users/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const { nombre, email, rol, activo, password, telefono, empresa } = req.body;

  try {
    const fields = [];
    const values = [];
    let idx = 1;

    if (nombre !== undefined) { fields.push(`nombre = $${idx++}`); values.push(nombre); }
    if (email !== undefined) { fields.push(`email = $${idx++}`); values.push(email); }
    if (rol !== undefined) {
      if (!['admin', 'supervisor', 'agent'].includes(rol)) {
        return res.status(400).json({ error: 'Rol inválido' });
      }
      fields.push(`rol = $${idx++}`); values.push(rol);
    }
    if (telefono !== undefined) { fields.push(`telefono = $${idx++}`); values.push(telefono || null); }
    if (activo !== undefined) { fields.push(`activo = $${idx++}`); values.push(activo); }
    if (empresa !== undefined) { fields.push(`empresa = $${idx++}`); values.push(empresa || null); }
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      fields.push(`password_hash = $${idx++}`); values.push(hash);
      fields.push(`password_visible = $${idx++}`); values.push(password);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}
       RETURNING id, nombre, email, rol, telefono, empresa, activo, created_at`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }
    console.error('Error actualizando usuario:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /api/auth/users/:id — eliminar usuario (solo admin)
router.delete('/users/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  const { id } = req.params;

  // No permitir eliminarse a sí mismo
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
  }

  try {
    // Verificar que existe
    const existing = await pool.query('SELECT id, nombre FROM users WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar que no tiene tickets asignados abiertos
    const openTickets = await pool.query(
      `SELECT COUNT(*) AS count FROM tickets
       WHERE (created_by = $1 OR assigned_to = $1 OR agente_id = $1)
       AND estado NOT IN ('resuelto', 'cerrado')`,
      [id]
    );
    if (parseInt(openTickets.rows[0].count) > 0) {
      return res.status(409).json({
        error: `No se puede eliminar: tiene ${openTickets.rows[0].count} ticket(s) abierto(s). Ciérralos o reasígnalos primero.`,
      });
    }

    // Eliminar notificaciones, comentarios relacionados, y luego el usuario
    await pool.query('DELETE FROM notifications WHERE user_id = $1', [id]);
    await pool.query('DELETE FROM ticket_comments WHERE user_id = $1', [id]);
    await pool.query('DELETE FROM activity_logs WHERE user_id = $1', [id]);
    await pool.query('DELETE FROM fichajes WHERE user_id = $1', [id]);
    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    res.json({ ok: true, nombre: existing.rows[0].nombre });
  } catch (err) {
    console.error('Error eliminando usuario:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
