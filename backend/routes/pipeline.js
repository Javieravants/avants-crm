const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

router.use(auth);

function isAdmin(req) { return req.user.rol === 'admin' || req.user.rol === 'supervisor'; }

// ══════════════════════════════════════════════
// PIPELINES
// ══════════════════════════════════════════════

// Listar todos los pipelines activos con conteo de deals abiertos
router.get('/', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT p.*,
        (SELECT COUNT(*) FROM deals d WHERE d.pipeline_id = p.id AND d.pipedrive_status = 'open') as deal_count
      FROM pipelines p WHERE p.active = true ORDER BY p.orden`);
    res.json({ pipelines: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Crear pipeline
router.post('/', async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ error: 'Sin permisos' });
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ error: 'Nombre obligatorio' });
    const maxOrden = await pool.query('SELECT COALESCE(MAX(orden), 0) + 1 as next FROM pipelines');
    const r = await pool.query('INSERT INTO pipelines (name, color, orden) VALUES ($1, $2, $3) RETURNING *',
      [name, color || '#ff4a6e', maxOrden.rows[0].next]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Actualizar pipeline
router.patch('/:id', async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ error: 'Sin permisos' });
    const { name, color, active } = req.body;
    const fields = []; const vals = []; let idx = 1;
    if (name !== undefined) { fields.push(`name = $${idx}`); vals.push(name); idx++; }
    if (color !== undefined) { fields.push(`color = $${idx}`); vals.push(color); idx++; }
    if (active !== undefined) { fields.push(`active = $${idx}`); vals.push(active); idx++; }
    if (!fields.length) return res.status(400).json({ error: 'Nada que actualizar' });
    fields.push(`updated_at = NOW()`);
    vals.push(req.params.id);
    const r = await pool.query(`UPDATE pipelines SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, vals);
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════
// STAGES
// ══════════════════════════════════════════════

// Listar etapas de un pipeline
router.get('/:id/stages', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT ps.*,
        (SELECT COUNT(*) FROM deals d WHERE d.stage_id = ps.id AND d.pipedrive_status = 'open') as deal_count
      FROM pipeline_stages ps WHERE ps.pipeline_id = $1 AND ps.active = true ORDER BY ps.orden`, [req.params.id]);
    res.json({ stages: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Crear etapa
router.post('/:id/stages', async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ error: 'Sin permisos' });
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ error: 'Nombre obligatorio' });
    const maxOrden = await pool.query('SELECT COALESCE(MAX(orden), 0) + 1 as next FROM pipeline_stages WHERE pipeline_id = $1', [req.params.id]);
    const r = await pool.query('INSERT INTO pipeline_stages (pipeline_id, name, orden, color) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.params.id, name, maxOrden.rows[0].next, color || null]);
    res.status(201).json(r.rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Ya existe una etapa con ese nombre' });
    res.status(500).json({ error: e.message });
  }
});

// Actualizar etapa
router.patch('/stages/:stageId', async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ error: 'Sin permisos' });
    const { name, color, orden } = req.body;
    const fields = []; const vals = []; let idx = 1;
    if (name !== undefined) { fields.push(`name = $${idx}`); vals.push(name); idx++; }
    if (color !== undefined) { fields.push(`color = $${idx}`); vals.push(color); idx++; }
    if (orden !== undefined) { fields.push(`orden = $${idx}`); vals.push(orden); idx++; }
    if (!fields.length) return res.status(400).json({ error: 'Nada que actualizar' });
    vals.push(req.params.stageId);
    const r = await pool.query(`UPDATE pipeline_stages SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, vals);
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Eliminar etapa (solo si vacía)
router.delete('/stages/:stageId', async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ error: 'Sin permisos' });
    const count = await pool.query("SELECT COUNT(*) as c FROM deals WHERE stage_id = $1 AND pipedrive_status = 'open'", [req.params.stageId]);
    if (parseInt(count.rows[0].c) > 0) return res.status(400).json({ error: `Hay ${count.rows[0].c} deals en esta etapa. Muévelos antes de eliminar.` });
    await pool.query('DELETE FROM pipeline_stages WHERE id = $1', [req.params.stageId]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Reordenar etapas
router.patch('/:id/reorder', async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ error: 'Sin permisos' });
    const { order } = req.body; // Array de stage IDs en el orden nuevo
    if (!Array.isArray(order)) return res.status(400).json({ error: 'Se espera array de IDs' });
    for (let i = 0; i < order.length; i++) {
      await pool.query('UPDATE pipeline_stages SET orden = $1 WHERE id = $2 AND pipeline_id = $3', [i, order[i], req.params.id]);
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════
// BOARD (Kanban data)
// ══════════════════════════════════════════════

router.get('/:id/board', async (req, res) => {
  try {
    const pipelineId = req.params.id;
    const agenteId = req.query.agente_id;
    const search = req.query.q;

    // Obtener etapas
    const stagesR = await pool.query(
      'SELECT * FROM pipeline_stages WHERE pipeline_id = $1 AND active = true ORDER BY orden', [pipelineId]);

    // Construir query de deals
    let sql = `
      SELECT d.id, d.persona_id, d.pipeline_id, d.stage_id, d.agente_id,
        d.producto, d.compania, d.prima, d.pipedrive_status, d.stage_entered_at,
        d.created_at, d.datos_extra,
        p.nombre as persona_nombre, p.telefono as persona_telefono, p.email as persona_email,
        u.nombre as agente_nombre,
        EXTRACT(DAY FROM NOW() - COALESCE(d.stage_entered_at, d.created_at))::int as days_in_stage
      FROM deals d
      LEFT JOIN personas p ON d.persona_id = p.id
      LEFT JOIN users u ON d.agente_id = u.id
      WHERE d.pipeline_id = $1 AND d.pipedrive_status = 'open'`;
    const params = [pipelineId];
    let idx = 2;

    // Filtro por agente (agentes solo ven los suyos)
    if (!isAdmin(req)) {
      sql += ` AND d.agente_id = $${idx}`;
      params.push(req.user.id);
      idx++;
    } else if (agenteId && agenteId !== 'all') {
      sql += ` AND d.agente_id = $${idx}`;
      params.push(agenteId);
      idx++;
    }

    // Búsqueda
    if (search) {
      sql += ` AND (p.nombre ILIKE $${idx} OR d.producto ILIKE $${idx} OR d.compania ILIKE $${idx})`;
      params.push('%' + search + '%');
      idx++;
    }

    sql += ' ORDER BY COALESCE(d.stage_entered_at, d.created_at) DESC';
    const dealsR = await pool.query(sql, params);

    // Agrupar deals por stage_id
    const dealsByStage = {};
    dealsR.rows.forEach(d => {
      if (!dealsByStage[d.stage_id]) dealsByStage[d.stage_id] = [];
      dealsByStage[d.stage_id].push(d);
    });

    // Construir respuesta con stages + deals
    const stages = stagesR.rows.map(s => ({
      ...s,
      deals: dealsByStage[s.id] || []
    }));

    res.json({ stages, total: dealsR.rows.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Stats del pipeline
router.get('/:id/stats', async (req, res) => {
  try {
    const pid = req.params.id;
    const [total, stale, stages] = await Promise.all([
      pool.query("SELECT COUNT(*) as c FROM deals WHERE pipeline_id = $1 AND pipedrive_status = 'open'", [pid]),
      pool.query("SELECT COUNT(*) as c FROM deals WHERE pipeline_id = $1 AND pipedrive_status = 'open' AND stage_entered_at < NOW() - INTERVAL '7 days'", [pid]),
      pool.query(`SELECT ps.name, COUNT(d.id) as c FROM pipeline_stages ps
        LEFT JOIN deals d ON d.stage_id = ps.id AND d.pipedrive_status = 'open'
        WHERE ps.pipeline_id = $1 AND ps.active = true GROUP BY ps.id, ps.name, ps.orden ORDER BY ps.orden`, [pid])
    ]);
    res.json({
      total: parseInt(total.rows[0].c),
      stale: parseInt(stale.rows[0].c),
      by_stage: stages.rows
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════
// DEALS
// ══════════════════════════════════════════════

// Mover deal a otra etapa
router.patch('/deals/:dealId/move', async (req, res) => {
  try {
    const { stage_id, pipeline_id } = req.body;
    if (!stage_id) return res.status(400).json({ error: 'stage_id obligatorio' });
    const fields = ['stage_id = $1', 'stage_entered_at = NOW()'];
    const vals = [stage_id];
    let idx = 2;
    if (pipeline_id) { fields.push(`pipeline_id = $${idx}`); vals.push(pipeline_id); idx++; }
    vals.push(req.params.dealId);
    await pool.query(`UPDATE deals SET ${fields.join(', ')} WHERE id = $${idx}`, vals);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Detalle de un deal
router.get('/deals/:dealId', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT d.*, p.nombre as persona_nombre, p.telefono as persona_telefono,
        p.email as persona_email, p.dni as persona_dni,
        u.nombre as agente_nombre, ps.name as stage_name, pl.name as pipeline_name
      FROM deals d
      LEFT JOIN personas p ON d.persona_id = p.id
      LEFT JOIN users u ON d.agente_id = u.id
      LEFT JOIN pipeline_stages ps ON d.stage_id = ps.id
      LEFT JOIN pipelines pl ON d.pipeline_id = pl.id
      WHERE d.id = $1`, [req.params.dealId]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Deal no encontrado' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Crear deal
router.post('/deals', async (req, res) => {
  try {
    const { persona_id, pipeline_id, stage_id, producto, compania, prima, agente_id } = req.body;
    if (!pipeline_id || !stage_id) return res.status(400).json({ error: 'Pipeline y etapa obligatorios' });
    const agent = agente_id || req.user.id;
    const r = await pool.query(`
      INSERT INTO deals (persona_id, pipeline_id, stage_id, producto, compania, prima, agente_id,
        pipedrive_status, stage_entered_at, estado)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'open', NOW(), 'activo') RETURNING id`,
      [persona_id || null, pipeline_id, stage_id, producto || null, compania || null, prima || null, agent]);
    res.status(201).json({ id: r.rows[0].id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Agentes para filtro
router.get('/agents/list', async (req, res) => {
  try {
    const r = await pool.query("SELECT id, nombre, email, rol FROM users WHERE activo != false ORDER BY nombre");
    res.json({ agents: r.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
