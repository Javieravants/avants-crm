const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();
router.use(authMiddleware);

// Directorio de uploads
const UPLOAD_DIR = path.join(__dirname, '../../uploads/documentos');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.random().toString(36).substring(7) + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB max

// GET /api/documentos/:personaId — listar documentos de una persona
router.get('/:personaId', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT d.*, u.nombre as user_nombre FROM persona_documentos d
       LEFT JOIN users u ON d.user_id = u.id
       WHERE d.persona_id = $1 ORDER BY d.created_at DESC`,
      [req.params.personaId]
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/documentos/:personaId — subir documento
router.post('/:personaId', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Archivo obligatorio' });

  const categoria = req.body.categoria || 'Otro';
  try {
    const r = await pool.query(
      `INSERT INTO persona_documentos (persona_id, nombre, categoria, tipo_mime, tamano, ruta, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.params.personaId, req.file.originalname, categoria, req.file.mimetype,
       req.file.size, '/uploads/documentos/' + req.file.filename, req.user.id]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/documentos/:id — eliminar documento
router.delete('/:id', async (req, res) => {
  try {
    const doc = await pool.query('SELECT ruta FROM persona_documentos WHERE id = $1', [req.params.id]);
    if (doc.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });

    // Eliminar archivo del disco
    const filePath = path.join(__dirname, '../../', doc.rows[0].ruta);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await pool.query('DELETE FROM persona_documentos WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
