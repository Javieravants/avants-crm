// Power Dialer — Avants Suite
// REGLA DE ORO: nunca hardcodear nombres de empresa/producto/pipeline.
// Todo se referencia por ID. Los nombres se leen de BD en runtime.
// REGLA CTI: nunca llamar directamente a CloudTalk — usar CTI service.
const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');
const requireRole = require('../middleware/roles');
const CTI = require('../services/cti');

const router = express.Router();
router.use(authMiddleware);
router.use(tenantMiddleware);

// ══════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════

function isAdmin(req) {
  return ['admin', 'superadmin'].includes(req.user.rol);
}

function normalizarTelefono(tel) {
  const digits = (tel || '').replace(/\D/g, '');
  if (digits.startsWith('34') && digits.length === 11) return '+' + digits;
  if (digits.length === 9) return '+34' + digits;
  return '+' + digits;
}

// Cola ordenada por prioridad para un agente
async function queryCola(userId, tenantId, limit = 1) {
  const { rows } = await pool.query(`
    SELECT cc.id, cc.campana_id, cc.persona_id, cc.deal_id, cc.prioridad,
           cc.intentos, cc.estado, cc.resultado_ultimo, cc.proximo_intento,
           c.nombre as campana_nombre, c.max_intentos, c.whatsapp_si_no_contesta,
           c.hora_inicio, c.hora_fin, c.dias_semana,
           p.nombre as persona_nombre, p.telefono, p.email as persona_email,
           p.dni, p.provincia,
           d.producto, d.compania, d.pipeline_id,
           d.pipedrive_id as deal_pipedrive_id,
           pl.name as pipeline_nombre, ps.name as stage_nombre
    FROM campana_contactos cc
    JOIN campanas c ON c.id = cc.campana_id AND c.estado = 'activa'
    JOIN personas p ON p.id = cc.persona_id
    LEFT JOIN deals d ON d.id = cc.deal_id
    LEFT JOIN pipelines pl ON pl.id = d.pipeline_id
    LEFT JOIN pipeline_stages ps ON ps.id = d.stage_id
    WHERE cc.user_id = $1
      AND cc.tenant_id = $2
      AND cc.estado IN ('pendiente', 'no_contesta', 'reagendado')
      AND (cc.proximo_intento IS NULL OR cc.proximo_intento <= NOW())
      AND cc.intentos < c.max_intentos
    ORDER BY cc.prioridad ASC, cc.proximo_intento ASC NULLS FIRST, cc.created_at ASC
    LIMIT $3
  `, [userId, tenantId, limit]);
  return rows;
}

async function ultimasInteracciones(personaId, limit = 3) {
  const { rows } = await pool.query(`
    SELECT tipo, subtipo, titulo, descripcion, agente_id, created_at,
           metadata->>'direction' as direction,
           metadata->>'duracion_seg' as duracion_seg
    FROM contact_history
    WHERE persona_id = $1
    ORDER BY created_at DESC LIMIT $2
  `, [personaId, limit]);
  return rows;
}

// ══════════════════════════════════════════════
// COLA DEL AGENTE
// ══════════════════════════════════════════════

// GET /api/dialer/cola/:userId
router.get('/cola/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (!isAdmin(req) && req.user.id !== userId) {
      return res.status(403).json({ error: 'Sin permisos' });
    }

    const rows = await queryCola(userId, req.tenantId, 50);
    for (const row of rows) {
      row.historial = await ultimasInteracciones(row.persona_id);
    }

    const statsR = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE cc.estado IN ('pendiente','no_contesta','reagendado')
          AND cc.intentos < c.max_intentos) as pendientes,
        COUNT(*) FILTER (WHERE cc.estado = 'reagendado'
          AND cc.proximo_intento <= NOW()) as reagendadas_hoy,
        COUNT(*) FILTER (WHERE cc.prioridad = 1) as urgentes,
        COUNT(*) FILTER (WHERE cc.estado IN ('completado','interesado','descartado')) as completados
      FROM campana_contactos cc
      JOIN campanas c ON c.id = cc.campana_id AND c.estado = 'activa'
      WHERE cc.user_id = $1 AND cc.tenant_id = $2
    `, [userId, req.tenantId]);

    res.json({
      cola: rows,
      stats: statsR.rows[0] || { pendientes: 0, reagendadas_hoy: 0, urgentes: 0, completados: 0 }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/dialer/siguiente/:userId
router.get('/siguiente/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (!isAdmin(req) && req.user.id !== userId) {
      return res.status(403).json({ error: 'Sin permisos' });
    }
    const rows = await queryCola(userId, req.tenantId, 1);
    if (!rows.length) return res.json({ siguiente: null });
    rows[0].historial = await ultimasInteracciones(rows[0].persona_id);
    res.json({ siguiente: rows[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ══════════════════════════════════════════════
// SESIONES
// ══════════════════════════════════════════════

// POST /api/dialer/sesion/iniciar
router.post('/sesion/iniciar', async (req, res) => {
  try {
    const userId = req.user.id;

    // Cerrar sesion anterior si quedo abierta
    await pool.query(
      `UPDATE dialer_sesiones SET fin = NOW()
       WHERE user_id = $1 AND fin IS NULL`, [userId]);

    const sesion = await pool.query(
      `INSERT INTO dialer_sesiones (user_id, tenant_id)
       VALUES ($1, $2) RETURNING *`,
      [userId, req.tenantId]);

    const cola = await queryCola(userId, req.tenantId, 1);
    let siguiente = null;
    if (cola.length) {
      cola[0].historial = await ultimasInteracciones(cola[0].persona_id);
      siguiente = cola[0];
    }

    const statsR = await pool.query(`
      SELECT COUNT(*) as total
      FROM campana_contactos cc
      JOIN campanas c ON c.id = cc.campana_id AND c.estado = 'activa'
      WHERE cc.user_id = $1 AND cc.tenant_id = $2
        AND cc.estado IN ('pendiente','no_contesta','reagendado')
        AND cc.intentos < c.max_intentos
    `, [userId, req.tenantId]);

    res.json({
      sesion: sesion.rows[0],
      siguiente,
      total_pendientes: parseInt(statsR.rows[0]?.total || 0)
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/dialer/sesion/finalizar
router.post('/sesion/finalizar', async (req, res) => {
  try {
    const sesion = await pool.query(
      `UPDATE dialer_sesiones SET fin = NOW()
       WHERE user_id = $1 AND fin IS NULL
       RETURNING *`, [req.user.id]);
    res.json({ ok: true, sesion: sesion.rows[0] || null });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ══════════════════════════════════════════════
// LLAMADAS
// ══════════════════════════════════════════════

// POST /api/dialer/llamar/:campanaContactoId
router.post('/llamar/:campanaContactoId', async (req, res) => {
  try {
    const ccId = parseInt(req.params.campanaContactoId);
    const userId = req.user.id;

    const ccR = await pool.query(`
      SELECT cc.*, p.telefono, p.nombre as persona_nombre
      FROM campana_contactos cc
      JOIN personas p ON p.id = cc.persona_id
      WHERE cc.id = $1 AND cc.user_id = $2
    `, [ccId, userId]);

    if (!ccR.rows.length) {
      return res.status(404).json({ error: 'Contacto no encontrado en tu cola' });
    }
    const cc = ccR.rows[0];
    const phone = normalizarTelefono(cc.telefono);

    // Marcar como llamando + incrementar intentos
    await pool.query(
      `UPDATE campana_contactos
       SET estado = 'llamando', intentos = intentos + 1,
           ultimo_intento = NOW(), updated_at = NOW()
       WHERE id = $1`, [ccId]);

    // Iniciar llamada via CTI abstraction layer
    const callResult = await CTI.call(req.user.email, phone);

    // Actualizar stats sesion
    await pool.query(
      `UPDATE dialer_sesiones SET llamadas_realizadas = llamadas_realizadas + 1
       WHERE user_id = $1 AND fin IS NULL`, [userId]);

    res.json({ ok: true, call: callResult, contacto: cc });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/dialer/llamada/resultado
router.post('/llamada/resultado', async (req, res) => {
  try {
    const { campana_contacto_id, resultado, nota, proximo_intento } = req.body;
    const userId = req.user.id;

    if (!campana_contacto_id || !resultado) {
      return res.status(400).json({ error: 'campana_contacto_id y resultado son obligatorios' });
    }

    const validResultados = ['no_contesta', 'interesado', 'descartado', 'reagendado', 'completado'];
    if (!validResultados.includes(resultado)) {
      return res.status(400).json({ error: 'Resultado invalido: ' + resultado });
    }

    const ccR = await pool.query(`
      SELECT cc.*, c.whatsapp_si_no_contesta, p.telefono, p.nombre as persona_nombre
      FROM campana_contactos cc
      JOIN campanas c ON c.id = cc.campana_id
      JOIN personas p ON p.id = cc.persona_id
      WHERE cc.id = $1 AND cc.user_id = $2
    `, [campana_contacto_id, userId]);

    if (!ccR.rows.length) {
      return res.status(404).json({ error: 'Contacto no encontrado' });
    }
    const cc = ccR.rows[0];

    // Actualizar estado
    const nuevoEstado = resultado === 'reagendado' ? 'reagendado' : resultado;
    const proximoTs = resultado === 'reagendado' && proximo_intento
      ? new Date(proximo_intento) : null;

    await pool.query(
      `UPDATE campana_contactos
       SET estado = $1, resultado_ultimo = $2, proximo_intento = $3, updated_at = NOW()
       WHERE id = $4`,
      [nuevoEstado, nota || resultado, proximoTs, campana_contacto_id]);

    // WhatsApp automatico si no contesta
    if (resultado === 'no_contesta' && cc.whatsapp_si_no_contesta && cc.telefono) {
      try {
        const waToken = process.env.WHATSAPP_TOKEN;
        const waPhoneId = process.env.WHATSAPP_PHONE_ID;
        if (waToken && waPhoneId) {
          const waTel = (cc.telefono || '').replace(/\D/g, '');
          const waNum = waTel.startsWith('34') ? waTel : '34' + waTel;
          const mensaje = `Hola ${cc.persona_nombre || ''}, hemos intentado contactarte. Si te va bien, devuelvenos la llamada o dinos un buen horario para llamarte. Gracias.`;

          await fetch(`https://graph.facebook.com/v19.0/${waPhoneId}/messages`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${waToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messaging_product: 'whatsapp', to: waNum,
              type: 'text', text: { body: mensaje }
            }),
          });

          await pool.query(
            `INSERT INTO whatsapp_messages (persona_id, agente_id, direccion, tipo, contenido)
             VALUES ($1, $2, 'saliente', 'texto', $3)`,
            [cc.persona_id, userId, mensaje]);

          console.log(`[Dialer] WA auto enviado a persona #${cc.persona_id}`);
        }
      } catch (waErr) {
        console.error('[Dialer] WhatsApp auto error:', waErr.message);
      }
    }

    // Stats sesion
    if (['interesado', 'completado'].includes(resultado)) {
      await pool.query(
        `UPDATE dialer_sesiones SET llamadas_contestadas = llamadas_contestadas + 1
         WHERE user_id = $1 AND fin IS NULL`, [userId]);
    }

    // Registrar en contact_history
    const { registrarEvento } = require('./history');
    registrarEvento(cc.persona_id, 'llamada', {
      subtipo: resultado === 'no_contesta' ? 'no_contestada' : 'contestada',
      titulo: `Dialer: ${resultado}`,
      descripcion: nota || `Resultado: ${resultado}`,
      agente_id: userId,
      origen: 'sistema',
      metadata: { dialer: true, campana_id: cc.campana_id, resultado }
    });

    // Siguiente contacto
    const cola = await queryCola(userId, req.tenantId, 1);
    let siguiente = null;
    if (cola.length) {
      cola[0].historial = await ultimasInteracciones(cola[0].persona_id);
      siguiente = cola[0];
    }

    res.json({ ok: true, siguiente });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ══════════════════════════════════════════════
// CAMPANAS (admin)
// ══════════════════════════════════════════════

// GET /api/campanas — listar campanas con stats
router.get('/', requireRole('admin', 'supervisor'), async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*,
        u.nombre as creador_nombre,
        (SELECT COUNT(*) FROM campana_contactos WHERE campana_id = c.id) as total_contactos,
        (SELECT COUNT(*) FROM campana_contactos WHERE campana_id = c.id
          AND estado IN ('pendiente','no_contesta','reagendado')) as pendientes,
        (SELECT COUNT(*) FROM campana_contactos WHERE campana_id = c.id
          AND estado IN ('completado','interesado')) as completados,
        (SELECT COUNT(*) FROM campana_contactos WHERE campana_id = c.id
          AND estado = 'descartado') as descartados,
        (SELECT COUNT(*) FROM campana_agentes WHERE campana_id = c.id AND activa = true) as num_agentes
      FROM campanas c
      LEFT JOIN users u ON u.id = c.created_by
      WHERE c.tenant_id = $1
      ORDER BY c.created_at DESC
    `, [req.tenantId]);

    // Enriquecer con pipelines origen
    for (const r of rows) {
      const plR = await pool.query(`
        SELECT cpo.pipeline_id, cpo.stage_ids, pl.name as pipeline_nombre, pl.color
        FROM campana_pipelines_origen cpo
        JOIN pipelines pl ON pl.id = cpo.pipeline_id
        WHERE cpo.campana_id = $1
      `, [r.id]);
      r.pipelines_origen = plR.rows;

      const total = parseInt(r.total_contactos) || 0;
      const contactados = parseInt(r.completados) + parseInt(r.descartados);
      r.tasa_contacto = total > 0 ? Math.round((contactados / total) * 100) : 0;
    }

    res.json({ campanas: rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/campanas — crear campana
router.post('/', requireRole('admin', 'supervisor'), async (req, res) => {
  try {
    const {
      nombre, descripcion, tipo, prioridad,
      hora_inicio, hora_fin, dias_semana, max_intentos,
      minutos_entre_intentos, whatsapp_si_no_contesta, whatsapp_template_id,
      pipelines_origen // Array de { pipeline_id, stage_ids? }
    } = req.body;

    if (!nombre) return res.status(400).json({ error: 'Nombre obligatorio' });

    const r = await pool.query(`
      INSERT INTO campanas
        (tenant_id, nombre, descripcion, tipo, prioridad,
         hora_inicio, hora_fin, dias_semana, max_intentos,
         minutos_entre_intentos, whatsapp_si_no_contesta, whatsapp_template_id, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *`,
      [req.tenantId, nombre, descripcion || null, tipo || 'manual',
       prioridad || 3,
       hora_inicio || '09:00', hora_fin || '21:00', dias_semana || '1,2,3,4,5',
       max_intentos || 3, minutos_entre_intentos || 60,
       whatsapp_si_no_contesta !== false, whatsapp_template_id || null,
       req.user.id]);

    const campana = r.rows[0];

    // Insertar pipelines origen si se proporcionan
    if (Array.isArray(pipelines_origen)) {
      for (const po of pipelines_origen) {
        await pool.query(`
          INSERT INTO campana_pipelines_origen (campana_id, pipeline_id, stage_ids)
          VALUES ($1, $2, $3)
          ON CONFLICT (campana_id, pipeline_id) DO UPDATE SET stage_ids = $3
        `, [campana.id, po.pipeline_id, po.stage_ids || []]);
      }
    }

    res.status(201).json(campana);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/campanas/:id — editar campana
router.put('/:id', requireRole('admin', 'supervisor'), async (req, res) => {
  try {
    const fields = [];
    const vals = [];
    let idx = 1;

    const editables = [
      'nombre', 'descripcion', 'tipo', 'estado',
      'prioridad', 'hora_inicio', 'hora_fin', 'dias_semana', 'max_intentos',
      'minutos_entre_intentos', 'whatsapp_si_no_contesta', 'whatsapp_template_id'
    ];

    for (const key of editables) {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = $${idx}`);
        vals.push(req.body[key]);
        idx++;
      }
    }
    if (!fields.length && !req.body.pipelines_origen) {
      return res.status(400).json({ error: 'Nada que actualizar' });
    }

    if (fields.length) {
      vals.push(req.params.id, req.tenantId);
      await pool.query(
        `UPDATE campanas SET ${fields.join(', ')} WHERE id = $${idx} AND tenant_id = $${idx + 1}`,
        vals);
    }

    // Actualizar pipelines origen si se proporcionan
    if (Array.isArray(req.body.pipelines_origen)) {
      // Borrar los que no estan en la nueva lista
      const newPipelineIds = req.body.pipelines_origen.map(p => p.pipeline_id);
      if (newPipelineIds.length) {
        await pool.query(
          `DELETE FROM campana_pipelines_origen
           WHERE campana_id = $1 AND pipeline_id != ALL($2)`,
          [req.params.id, newPipelineIds]);
      } else {
        await pool.query(
          'DELETE FROM campana_pipelines_origen WHERE campana_id = $1',
          [req.params.id]);
      }
      // Upsert los nuevos
      for (const po of req.body.pipelines_origen) {
        await pool.query(`
          INSERT INTO campana_pipelines_origen (campana_id, pipeline_id, stage_ids)
          VALUES ($1, $2, $3)
          ON CONFLICT (campana_id, pipeline_id) DO UPDATE SET stage_ids = $3
        `, [req.params.id, po.pipeline_id, po.stage_ids || []]);
      }
    }

    const campana = await pool.query(
      'SELECT * FROM campanas WHERE id = $1', [req.params.id]);
    if (!campana.rows.length) return res.status(404).json({ error: 'Campana no encontrada' });
    res.json(campana.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ══════════════════════════════════════════════
// PIPELINES ORIGEN
// ══════════════════════════════════════════════

// GET /api/campanas/:id/pipelines — listar pipelines origen de campana
router.get('/:id/pipelines', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT cpo.*, pl.name as pipeline_nombre, pl.color as pipeline_color
      FROM campana_pipelines_origen cpo
      JOIN pipelines pl ON pl.id = cpo.pipeline_id
      WHERE cpo.campana_id = $1
    `, [req.params.id]);
    res.json({ pipelines: rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/campanas/:id/pipelines — reemplazar pipelines origen
router.put('/:id/pipelines', requireRole('admin', 'supervisor'), async (req, res) => {
  try {
    const { pipelines } = req.body; // Array de { pipeline_id, stage_ids? }
    if (!Array.isArray(pipelines)) {
      return res.status(400).json({ error: 'Se espera array de pipelines' });
    }

    await pool.query('DELETE FROM campana_pipelines_origen WHERE campana_id = $1', [req.params.id]);

    for (const po of pipelines) {
      await pool.query(`
        INSERT INTO campana_pipelines_origen (campana_id, pipeline_id, stage_ids)
        VALUES ($1, $2, $3)
      `, [req.params.id, po.pipeline_id, po.stage_ids || []]);
    }

    const { rows } = await pool.query(`
      SELECT cpo.*, pl.name as pipeline_nombre, pl.color as pipeline_color
      FROM campana_pipelines_origen cpo
      JOIN pipelines pl ON pl.id = cpo.pipeline_id
      WHERE cpo.campana_id = $1
    `, [req.params.id]);

    res.json({ pipelines: rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ══════════════════════════════════════════════
// AGENTES
// ══════════════════════════════════════════════

// POST /api/campanas/:id/agentes — asignar agentes
router.post('/:id/agentes', requireRole('admin', 'supervisor'), async (req, res) => {
  try {
    const campanaId = parseInt(req.params.id);
    const { agentes } = req.body; // Array de { user_id, max_llamadas_dia?, pipelines_permitidos?, orden_pipelines? }

    if (!Array.isArray(agentes)) {
      return res.status(400).json({ error: 'Se espera array de agentes' });
    }

    // Obtener pipelines de la campana para herencia por defecto
    const poR = await pool.query(
      'SELECT pipeline_id FROM campana_pipelines_origen WHERE campana_id = $1',
      [campanaId]);
    const defaultPipelines = poR.rows.map(r => r.pipeline_id);

    for (const ag of agentes) {
      const pipPermitidos = ag.pipelines_permitidos || defaultPipelines;
      const pipOrden = ag.orden_pipelines || pipPermitidos;

      await pool.query(`
        INSERT INTO campana_agentes
          (campana_id, user_id, max_llamadas_dia, pipelines_permitidos, orden_pipelines)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (campana_id, user_id) DO UPDATE SET
          activa = true,
          max_llamadas_dia = EXCLUDED.max_llamadas_dia,
          pipelines_permitidos = EXCLUDED.pipelines_permitidos,
          orden_pipelines = EXCLUDED.orden_pipelines
      `, [campanaId, ag.user_id, ag.max_llamadas_dia || 100, pipPermitidos, pipOrden]);
    }

    const { rows } = await pool.query(`
      SELECT ca.*, u.nombre as agente_nombre, u.email as agente_email
      FROM campana_agentes ca
      JOIN users u ON u.id = ca.user_id
      WHERE ca.campana_id = $1 AND ca.activa = true
    `, [campanaId]);

    res.json({ agentes: rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/campanas/:id/agentes/:userId — actualizar config de agente
router.put('/:id/agentes/:userId', requireRole('admin', 'supervisor'), async (req, res) => {
  try {
    const { max_llamadas_dia, pipelines_permitidos, orden_pipelines } = req.body;
    const fields = [];
    const vals = [];
    let idx = 1;

    if (max_llamadas_dia !== undefined) {
      fields.push(`max_llamadas_dia = $${idx}`); vals.push(max_llamadas_dia); idx++;
    }
    if (pipelines_permitidos !== undefined) {
      fields.push(`pipelines_permitidos = $${idx}`); vals.push(pipelines_permitidos); idx++;
    }
    if (orden_pipelines !== undefined) {
      fields.push(`orden_pipelines = $${idx}`); vals.push(orden_pipelines); idx++;
    }
    if (!fields.length) return res.status(400).json({ error: 'Nada que actualizar' });

    vals.push(req.params.id, req.params.userId);
    await pool.query(
      `UPDATE campana_agentes SET ${fields.join(', ')}
       WHERE campana_id = $${idx} AND user_id = $${idx + 1}`,
      vals);

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/campanas/:id/agentes/:userId — quitar agente (soft)
router.delete('/:id/agentes/:userId', requireRole('admin', 'supervisor'), async (req, res) => {
  try {
    await pool.query(
      `UPDATE campana_agentes SET activa = false
       WHERE campana_id = $1 AND user_id = $2`,
      [req.params.id, req.params.userId]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/campanas/:id/agentes — listar agentes de campana con stats
router.get('/:id/agentes', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT ca.*, u.nombre as agente_nombre, u.email as agente_email,
        (SELECT COUNT(*) FROM campana_contactos
         WHERE campana_id = ca.campana_id AND user_id = ca.user_id
           AND estado IN ('pendiente','no_contesta','reagendado')) as pendientes,
        (SELECT COUNT(*) FROM campana_contactos
         WHERE campana_id = ca.campana_id AND user_id = ca.user_id
           AND estado IN ('completado','interesado')) as completados
      FROM campana_agentes ca
      JOIN users u ON u.id = ca.user_id
      WHERE ca.campana_id = $1 AND ca.activa = true
    `, [req.params.id]);
    res.json({ agentes: rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ══════════════════════════════════════════════
// IMPORTAR CONTACTOS
// ══════════════════════════════════════════════

// POST /api/campanas/:id/contactos/importar
// Importa desde los pipelines/stages configurados en campana_pipelines_origen
// O desde pipeline_id/stage_id del body (override manual)
router.post('/:id/contactos/importar', requireRole('admin', 'supervisor'), async (req, res) => {
  try {
    const campanaId = parseInt(req.params.id);

    const campR = await pool.query(
      'SELECT * FROM campanas WHERE id = $1 AND tenant_id = $2',
      [campanaId, req.tenantId]);
    if (!campR.rows.length) return res.status(404).json({ error: 'Campana no encontrada' });

    const agentesR = await pool.query(
      `SELECT user_id FROM campana_agentes
       WHERE campana_id = $1 AND activa = true`, [campanaId]);
    const agentes = agentesR.rows.map(a => a.user_id);
    if (!agentes.length) {
      return res.status(400).json({ error: 'Asigna agentes a la campana antes de importar' });
    }

    // Determinar pipelines origen: body override o campana_pipelines_origen
    let pipelineFilters = [];
    if (req.body.pipeline_id) {
      // Override manual desde UI
      pipelineFilters = [{ pipeline_id: req.body.pipeline_id, stage_ids: req.body.stage_id ? [req.body.stage_id] : [] }];
    } else {
      // Leer de la configuracion de la campana
      const poR = await pool.query(
        'SELECT pipeline_id, stage_ids FROM campana_pipelines_origen WHERE campana_id = $1',
        [campanaId]);
      pipelineFilters = poR.rows;
    }

    if (!pipelineFilters.length) {
      return res.status(400).json({ error: 'Configura pipelines origen en la campana antes de importar' });
    }

    // Construir query dinamica para obtener deals de todos los pipelines origen
    let allDeals = [];
    for (const pf of pipelineFilters) {
      let sql = `
        SELECT d.id as deal_id, d.persona_id, d.agente_id
        FROM deals d
        WHERE d.pipedrive_status = 'open'
          AND d.persona_id IS NOT NULL
          AND d.pipeline_id = $1`;
      const params = [pf.pipeline_id];

      // Filtrar por stages si se especificaron
      const stageIds = pf.stage_ids || [];
      if (stageIds.length > 0) {
        sql += ` AND d.stage_id = ANY($2)`;
        params.push(stageIds);
      }

      const dealsR = await pool.query(sql, params);
      allDeals = allDeals.concat(dealsR.rows);
    }

    // Dedup por persona_id (un contacto puede estar en multiples pipelines)
    const seenPersonas = new Set();
    const uniqueDeals = [];
    for (const d of allDeals) {
      if (!seenPersonas.has(d.persona_id)) {
        seenPersonas.add(d.persona_id);
        uniqueDeals.push(d);
      }
    }

    // Filtrar contactos ya en esta campana
    const existR = await pool.query(
      'SELECT persona_id FROM campana_contactos WHERE campana_id = $1',
      [campanaId]);
    const existentes = new Set(existR.rows.map(r => r.persona_id));
    const nuevos = uniqueDeals.filter(d => !existentes.has(d.persona_id));

    if (!nuevos.length) {
      return res.json({ importados: 0, mensaje: 'Todos los contactos ya estan en la campana' });
    }

    // Importar con calculo de prioridad y reparto round-robin
    let importados = 0;
    let agIdx = 0;

    for (const deal of nuevos) {
      // Prioridad 1 si tiene inbound perdido reciente
      const inboundR = await pool.query(`
        SELECT id FROM contact_history
        WHERE persona_id = $1 AND subtipo = 'devolver_llamada'
          AND created_at > NOW() - INTERVAL '48 hours'
        LIMIT 1
      `, [deal.persona_id]);

      let prioridad = campR.rows[0].prioridad || 3;
      if (inboundR.rows.length) prioridad = 1;

      // Reparto: respetar agente del deal si esta en la campana
      let assignedAgent = agentes[agIdx % agentes.length];
      if (deal.agente_id && agentes.includes(deal.agente_id)) {
        assignedAgent = deal.agente_id;
      } else {
        agIdx++;
      }

      await pool.query(`
        INSERT INTO campana_contactos
          (tenant_id, campana_id, persona_id, deal_id, user_id, prioridad)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
      `, [req.tenantId, campanaId, deal.persona_id, deal.deal_id, assignedAgent, prioridad]);

      importados++;
    }

    res.json({
      importados,
      total_encontrados: uniqueDeals.length,
      ya_existentes: existentes.size,
      pipelines_consultados: pipelineFilters.length
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ══════════════════════════════════════════════
// REPARTO AUTOMATICO
// ══════════════════════════════════════════════

// POST /api/dialer/reparto/automatico
router.post('/reparto/automatico', requireRole('admin'), async (req, res) => {
  try {
    const sinAgente = await pool.query(`
      SELECT cc.id, cc.campana_id
      FROM campana_contactos cc
      JOIN campanas c ON c.id = cc.campana_id AND c.estado = 'activa'
      LEFT JOIN users u ON u.id = cc.user_id AND u.activo = true
      WHERE cc.tenant_id = $1
        AND cc.estado IN ('pendiente', 'no_contesta', 'reagendado')
        AND (cc.user_id IS NULL OR u.id IS NULL)
    `, [req.tenantId]);

    let reasignados = 0;
    const porCampana = {};
    sinAgente.rows.forEach(r => {
      if (!porCampana[r.campana_id]) porCampana[r.campana_id] = [];
      porCampana[r.campana_id].push(r.id);
    });

    for (const [campanaId, contactoIds] of Object.entries(porCampana)) {
      const agentesR = await pool.query(
        `SELECT user_id FROM campana_agentes
         WHERE campana_id = $1 AND activa = true`, [campanaId]);
      const agentes = agentesR.rows.map(a => a.user_id);
      if (!agentes.length) continue;

      let idx = 0;
      for (const ccId of contactoIds) {
        await pool.query(
          'UPDATE campana_contactos SET user_id = $1, updated_at = NOW() WHERE id = $2',
          [agentes[idx % agentes.length], ccId]);
        idx++;
        reasignados++;
      }
    }

    res.json({ ok: true, reasignados });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ══════════════════════════════════════════════
// ENDPOINT UNIFICADO CTI
// Todo boton de llamar en el CRM usa este endpoint.
// ══════════════════════════════════════════════

// POST /api/cti/llamar — llamada desde cualquier parte del CRM
router.post('/cti/llamar', async (req, res) => {
  try {
    const { phoneNumber, personaId } = req.body;
    if (!phoneNumber) return res.status(400).json({ error: 'phoneNumber obligatorio' });

    const phone = normalizarTelefono(phoneNumber);
    const result = await CTI.call(req.user.email, phone);

    // Registrar en contact_history
    if (personaId) {
      const { registrarEvento } = require('./history');
      registrarEvento(personaId, 'llamada', {
        subtipo: 'saliente',
        titulo: 'Llamada iniciada',
        descripcion: `${req.user.nombre || 'Agente'} → ${phone}`,
        agente_id: req.user.id,
        origen: 'sistema',
        metadata: {
          cti_provider: CTI.getProvider(),
          manual: result.manual || false,
          callId: result.callId || null,
        }
      });
    }

    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/cti/colgar — colgar llamada activa
router.post('/cti/colgar', async (req, res) => {
  try {
    const { callId } = req.body;
    const result = await CTI.hangup(callId);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ══════════════════════════════════════════════
// IA BRIEFING & ANALISIS
// ══════════════════════════════════════════════

// GET /api/ia/briefing/:personaId — briefing IA pre-llamada
router.get('/ia/briefing/:personaId', async (req, res) => {
  try {
    const { generarBriefing } = require('../services/ia-briefing');
    const briefing = await generarBriefing(req.params.personaId);
    res.json({ briefing });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/ia/analizar-llamada/:callHistoryId — analisis post-llamada
router.post('/ia/analizar-llamada/:callHistoryId', async (req, res) => {
  try {
    const { analizarLlamada } = require('../services/ia-briefing');
    const analisis = await analizarLlamada(req.params.callHistoryId);
    res.json({ analisis });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/ia/chat-llamada — chat IA en tiempo real durante llamada
router.post('/ia/chat-llamada', async (req, res) => {
  try {
    const { personaId, mensaje, historial } = req.body;
    if (!mensaje) return res.status(400).json({ error: 'mensaje obligatorio' });

    let Anthropic;
    try { Anthropic = require('@anthropic-ai/sdk'); } catch {}
    if (!Anthropic || !process.env.ANTHROPIC_API_KEY) {
      return res.status(400).json({ error: 'ANTHROPIC_API_KEY no configurada' });
    }

    // Construir contexto del cliente
    let contexto = '';
    let conocimiento = '';
    const tenantId = req.tenantId || 1;
    if (personaId) {
      const [personaR, segurosR, histR, productosR] = await Promise.all([
        pool.query('SELECT nombre, provincia FROM personas WHERE id = $1', [personaId]),
        pool.query(`SELECT compania, producto, prima_mensual FROM polizas
                    WHERE persona_id = $1 AND estado NOT IN ('baja','rechazado') LIMIT 5`, [personaId]),
        pool.query(`SELECT tipo, subtipo, titulo, created_at FROM contact_history
                    WHERE persona_id = $1 ORDER BY created_at DESC LIMIT 5`, [personaId]),
        pool.query(`SELECT p.nombre, p.resumen_coberturas, p.argumentario_venta, c.nombre as compania
                    FROM productos p JOIN companias c ON c.id = p.compania_id
                    WHERE p.activo = true AND p.resumen_coberturas IS NOT NULL LIMIT 10`),
      ]);

      const persona = personaR.rows[0];
      if (persona) {
        contexto += `\nCLIENTE: ${persona.nombre}${persona.provincia ? ', ' + persona.provincia : ''}`;
      }
      if (segurosR.rows.length) {
        contexto += `\nSEGUROS QUE TIENE: ${segurosR.rows.map(s => `${s.compania} ${s.producto} (${s.prima_mensual || '?'} EUR/mes)`).join(', ')}`;
      } else {
        contexto += '\nSEGUROS: Ninguno contratado';
      }
      if (histR.rows.length) {
        contexto += `\nULTIMAS INTERACCIONES: ${histR.rows.map(h => `${h.tipo} ${h.subtipo || ''} (${new Date(h.created_at).toLocaleDateString('es-ES')})`).join(', ')}`;
      }
      if (productosR.rows.length) {
        contexto += '\nPRODUCTOS DISPONIBLES:';
        productosR.rows.forEach(p => {
          contexto += `\n- ${p.compania} ${p.nombre}: ${(p.resumen_coberturas || '').substring(0, 80)}`;
        });
      }

      // Conocimiento interno del Centro de Conocimiento
      try {
        // Conocimiento general (sin compania)
        const kbGenR = await pool.query(
          `SELECT tipo, titulo, contenido, visibilidad FROM knowledge_base
           WHERE tenant_id = $1 AND compania_id IS NULL
             AND visibilidad IN ('agentes', 'todos')
             AND (vigente_hasta IS NULL OR vigente_hasta >= CURRENT_DATE)
           ORDER BY updated_at DESC LIMIT 15`,
          [tenantId]);

        // Detectar companias del contacto (seguros + deals open)
        const companias = new Set(segurosR.rows.map(s => s.compania).filter(Boolean));
        const dealsOpenR = await pool.query(
          `SELECT compania FROM deals WHERE persona_id = $1 AND pipedrive_status = 'open'`, [personaId]);
        dealsOpenR.rows.forEach(d => { if (d.compania) companias.add(d.compania); });

        // Conocimiento de cada compania vinculada al contacto
        let kbComp = [];
        for (const compNombre of companias) {
          const kbCompR = await pool.query(
            `SELECT kb.tipo, kb.titulo, kb.contenido, kb.visibilidad, c.nombre as compania
             FROM knowledge_base kb
             JOIN companias c ON c.id = kb.compania_id
             WHERE kb.tenant_id = $1 AND c.nombre ILIKE $2
               AND kb.visibilidad IN ('agentes', 'todos')
               AND (kb.vigente_hasta IS NULL OR kb.vigente_hasta >= CURRENT_DATE)
             ORDER BY kb.updated_at DESC LIMIT 10`,
            [tenantId, '%' + String(compNombre).substring(0, 50) + '%']);
          kbComp = kbComp.concat(kbCompR.rows);
        }

        const allKb = [...kbGenR.rows, ...kbComp];
        if (allKb.length) {
          conocimiento = '\n\nCONOCIMIENTO INTERNO DEL EQUIPO (usalo para responder preguntas):';
          allKb.forEach(k => {
            const tag = k.visibilidad === 'todos' ? 'PUBLICO' : 'SOLO EQUIPO';
            const comp = k.compania ? k.compania + ' - ' : '';
            conocimiento += `\n[${k.tipo.toUpperCase()} - ${tag}] ${comp}${k.titulo}: ${k.contenido.substring(0, 200)}`;
          });
          conocimiento += '\n\nPrioriza SIEMPRE el conocimiento interno sobre tu conocimiento general. Si el conocimiento interno contradice algo que crees saber, usa el interno.';
        }
      } catch (e) {
        console.error('[IA Chat] Error obteniendo knowledge:', e.message);
      }
    }

    // Construir mensajes con historial
    const messages = [];
    if (Array.isArray(historial)) {
      historial.forEach(h => {
        messages.push({ role: h.role || 'user', content: h.content || h.mensaje || '' });
      });
    }
    messages.push({ role: 'user', content: mensaje });

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: `Eres un asistente de ventas experto en seguros, ayudando a un agente durante una llamada en tiempo real. Responde de forma MUY concisa (maximo 3-4 lineas) y practica. El agente esta hablando con el cliente ahora mismo, no tiene tiempo para leer textos largos.${contexto}${conocimiento}`,
      messages,
    });

    const respuesta = response.content[0]?.text?.trim() || '';
    res.json({ respuesta });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
