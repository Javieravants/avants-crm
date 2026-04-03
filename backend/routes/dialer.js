const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');
const requireRole = require('../middleware/roles');

const router = express.Router();
router.use(authMiddleware);
router.use(tenantMiddleware);

// ══════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════

function isAdmin(req) {
  return ['admin', 'superadmin'].includes(req.user.rol);
}

// Normalizar telefono a +34XXXXXXXXX
function normalizarTelefono(tel) {
  const digits = (tel || '').replace(/\D/g, '');
  if (digits.startsWith('34') && digits.length === 11) return '+' + digits;
  if (digits.length === 9) return '+34' + digits;
  return '+' + digits;
}

// CloudTalk API auth
function ctAuth() {
  const key = process.env.CLOUDTALK_API_KEY;
  const secret = process.env.CLOUDTALK_API_SECRET;
  if (!key || !secret) return null;
  return 'Basic ' + Buffer.from(key + ':' + secret).toString('base64');
}

// Query cola ordenada por prioridad para un agente
async function queryCola(userId, tenantId, limit = 1) {
  const { rows } = await pool.query(`
    SELECT cc.id, cc.campana_id, cc.persona_id, cc.deal_id, cc.prioridad,
           cc.intentos, cc.estado, cc.resultado_ultimo, cc.proximo_intento,
           c.nombre as campana_nombre, c.max_intentos, c.whatsapp_si_no_contesta,
           c.hora_inicio, c.hora_fin, c.dias_semana,
           p.nombre as persona_nombre, p.telefono, p.email as persona_email,
           p.dni, p.provincia,
           d.producto, d.compania, d.pipedrive_id as deal_pipedrive_id
    FROM campana_contactos cc
    JOIN campanas c ON c.id = cc.campana_id AND c.estado = 'activa'
    JOIN personas p ON p.id = cc.persona_id
    LEFT JOIN deals d ON d.id = cc.deal_id
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

// Obtener ultimas interacciones de un contacto
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

// GET /api/dialer/cola/:userId — cola de contactos para un agente
router.get('/cola/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    // Agentes solo pueden ver su propia cola, admins cualquiera
    if (!isAdmin(req) && req.user.id !== userId) {
      return res.status(403).json({ error: 'Sin permisos' });
    }

    const rows = await queryCola(userId, req.tenantId, 50);

    // Enriquecer con ultimas interacciones
    for (const row of rows) {
      row.historial = await ultimasInteracciones(row.persona_id);
    }

    // Stats rapidas
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

// GET /api/dialer/siguiente/:userId — siguiente contacto sin marcarlo
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

    // Cerrar sesion anterior si quedó abierta
    await pool.query(
      `UPDATE dialer_sesiones SET fin = NOW()
       WHERE user_id = $1 AND fin IS NULL`, [userId]);

    // Crear nueva sesion
    const sesion = await pool.query(
      `INSERT INTO dialer_sesiones (user_id, tenant_id)
       VALUES ($1, $2) RETURNING *`,
      [userId, req.tenantId]);

    // Obtener primera llamada de la cola
    const cola = await queryCola(userId, req.tenantId, 1);
    let siguiente = null;
    if (cola.length) {
      cola[0].historial = await ultimasInteracciones(cola[0].persona_id);
      siguiente = cola[0];
    }

    // Stats de la cola
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
    const userId = req.user.id;
    const sesion = await pool.query(
      `UPDATE dialer_sesiones SET fin = NOW()
       WHERE user_id = $1 AND fin IS NULL
       RETURNING *`, [userId]);

    if (!sesion.rows.length) {
      return res.json({ ok: true, sesion: null });
    }
    res.json({ ok: true, sesion: sesion.rows[0] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ══════════════════════════════════════════════
// LLAMADAS
// ══════════════════════════════════════════════

// POST /api/dialer/llamar/:campanaContactoId — iniciar llamada
router.post('/llamar/:campanaContactoId', async (req, res) => {
  try {
    const ccId = parseInt(req.params.campanaContactoId);
    const userId = req.user.id;

    // Obtener contacto + persona
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

    // Iniciar llamada real via CloudTalk POST /v1/calls
    let callResult = null;
    const auth = ctAuth();
    if (auth) {
      try {
        // Buscar agente en CloudTalk por email
        const agentsR = await fetch('https://api.cloudtalk.io/api/agents.json', {
          headers: { Authorization: auth }
        });
        const agentsData = await agentsR.json();
        const agents = agentsData.data || agentsData.responseData || [];
        const ctAgent = agents.find(a => a.email === req.user.email);

        if (ctAgent) {
          const callR = await fetch('https://api.cloudtalk.io/v1/calls', {
            method: 'POST',
            headers: { Authorization: auth, 'Content-Type': 'application/json' },
            body: JSON.stringify({ agent_id: ctAgent.id, external_number: phone }),
          });
          callResult = await callR.json();
          if (!callR.ok) {
            console.error('[Dialer] CloudTalk call error:', callResult);
            callResult = { fallback: true, phone };
          }
        } else {
          callResult = { fallback: true, phone, reason: 'agent_not_found' };
        }
      } catch (ctErr) {
        console.error('[Dialer] CloudTalk error:', ctErr.message);
        callResult = { fallback: true, phone };
      }
    } else {
      callResult = { fallback: true, phone, reason: 'cloudtalk_not_configured' };
    }

    // Actualizar stats sesion
    await pool.query(
      `UPDATE dialer_sesiones SET llamadas_realizadas = llamadas_realizadas + 1
       WHERE user_id = $1 AND fin IS NULL`, [userId]);

    res.json({ ok: true, call: callResult, contacto: cc });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/dialer/llamada/resultado — registrar resultado y obtener siguiente
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

    // Obtener contacto actual con datos de campana
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

    // Actualizar estado del contacto
    const nuevoEstado = resultado === 'reagendado' ? 'reagendado' : resultado;
    const proximoIntentoTs = resultado === 'reagendado' && proximo_intento
      ? new Date(proximo_intento) : null;

    await pool.query(
      `UPDATE campana_contactos
       SET estado = $1, resultado_ultimo = $2, proximo_intento = $3, updated_at = NOW()
       WHERE id = $4`,
      [nuevoEstado, nota || resultado, proximoIntentoTs, campana_contacto_id]);

    // Si no_contesta y la campana tiene WA automatico → enviar WhatsApp
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

          // Registrar en whatsapp_messages
          await pool.query(
            `INSERT INTO whatsapp_messages (persona_id, agente_id, direccion, tipo, contenido)
             VALUES ($1, $2, 'saliente', 'texto', $3)`,
            [cc.persona_id, userId, mensaje]);

          console.log(`[Dialer] WA auto enviado a ${cc.persona_nombre} (${waNum})`);
        }
      } catch (waErr) {
        console.error('[Dialer] WhatsApp auto error:', waErr.message);
      }
    }

    // Actualizar stats de sesion si fue contestada
    if (['interesado', 'completado'].includes(resultado)) {
      await pool.query(
        `UPDATE dialer_sesiones SET llamadas_contestadas = llamadas_contestadas + 1
         WHERE user_id = $1 AND fin IS NULL`, [userId]);
    }

    // Registrar en contact_history
    const { registrarEvento } = require('./history');
    const tipoHistorial = resultado === 'no_contesta' ? 'no_contestada' : 'contestada';
    registrarEvento(cc.persona_id, 'llamada', {
      subtipo: tipoHistorial,
      titulo: `Dialer: ${resultado}`,
      descripcion: nota || `Resultado: ${resultado}`,
      agente_id: userId,
      origen: 'sistema',
      metadata: { dialer: true, campana_id: cc.campana_id, resultado }
    });

    // Obtener siguiente contacto
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

    // Calcular tasa de contacto
    rows.forEach(r => {
      const total = parseInt(r.total_contactos) || 0;
      const contactados = parseInt(r.completados) + parseInt(r.descartados);
      r.tasa_contacto = total > 0 ? Math.round((contactados / total) * 100) : 0;
    });

    res.json({ campanas: rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/campanas — crear campana
router.post('/', requireRole('admin', 'supervisor'), async (req, res) => {
  try {
    const {
      nombre, descripcion, tipo, pipeline_id, stage_id, prioridad,
      hora_inicio, hora_fin, dias_semana, max_intentos,
      minutos_entre_intentos, whatsapp_si_no_contesta, whatsapp_template_id
    } = req.body;

    if (!nombre) return res.status(400).json({ error: 'Nombre obligatorio' });

    const r = await pool.query(`
      INSERT INTO campanas
        (tenant_id, nombre, descripcion, tipo, pipeline_id, stage_id, prioridad,
         hora_inicio, hora_fin, dias_semana, max_intentos,
         minutos_entre_intentos, whatsapp_si_no_contesta, whatsapp_template_id, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *`,
      [req.tenantId, nombre, descripcion || null, tipo || 'manual',
       pipeline_id || null, stage_id || null, prioridad || 3,
       hora_inicio || '09:00', hora_fin || '21:00', dias_semana || '1,2,3,4,5',
       max_intentos || 3, minutos_entre_intentos || 60,
       whatsapp_si_no_contesta !== false, whatsapp_template_id || null,
       req.user.id]);

    res.status(201).json(r.rows[0]);
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
      'nombre', 'descripcion', 'tipo', 'estado', 'pipeline_id', 'stage_id',
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
    if (!fields.length) return res.status(400).json({ error: 'Nada que actualizar' });

    vals.push(req.params.id, req.tenantId);
    const r = await pool.query(
      `UPDATE campanas SET ${fields.join(', ')} WHERE id = $${idx} AND tenant_id = $${idx + 1} RETURNING *`,
      vals);

    if (!r.rows.length) return res.status(404).json({ error: 'Campana no encontrada' });
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/campanas/:id/agentes — asignar agentes
router.post('/:id/agentes', requireRole('admin', 'supervisor'), async (req, res) => {
  try {
    const campanaId = parseInt(req.params.id);
    const { agentes } = req.body; // Array de { user_id, max_llamadas_dia? }

    if (!Array.isArray(agentes)) {
      return res.status(400).json({ error: 'Se espera array de agentes' });
    }

    for (const ag of agentes) {
      await pool.query(`
        INSERT INTO campana_agentes (campana_id, user_id, max_llamadas_dia)
        VALUES ($1, $2, $3)
        ON CONFLICT (campana_id, user_id) DO UPDATE SET
          activa = true, max_llamadas_dia = EXCLUDED.max_llamadas_dia
      `, [campanaId, ag.user_id, ag.max_llamadas_dia || 100]);
    }

    // Devolver lista actualizada
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

// DELETE /api/campanas/:id/agentes/:userId — quitar agente
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

// POST /api/campanas/:id/contactos/importar — importar desde pipeline/stage
router.post('/:id/contactos/importar', requireRole('admin', 'supervisor'), async (req, res) => {
  try {
    const campanaId = parseInt(req.params.id);
    const { pipeline_id, stage_id } = req.body;

    // Verificar campana existe
    const campR = await pool.query(
      'SELECT * FROM campanas WHERE id = $1 AND tenant_id = $2',
      [campanaId, req.tenantId]);
    if (!campR.rows.length) return res.status(404).json({ error: 'Campana no encontrada' });

    // Obtener agentes activos de la campana
    const agentesR = await pool.query(
      `SELECT user_id FROM campana_agentes
       WHERE campana_id = $1 AND activa = true`, [campanaId]);
    const agentes = agentesR.rows.map(a => a.user_id);
    if (!agentes.length) {
      return res.status(400).json({ error: 'Asigna agentes a la campana antes de importar' });
    }

    // Obtener deals del pipeline/stage
    let dealsSql = `
      SELECT d.id as deal_id, d.persona_id, d.agente_id
      FROM deals d
      WHERE d.pipedrive_status = 'open' AND d.persona_id IS NOT NULL`;
    const params = [];
    let idx = 1;

    if (pipeline_id) {
      dealsSql += ` AND d.pipeline_id = $${idx}`;
      params.push(pipeline_id);
      idx++;
    }
    if (stage_id) {
      dealsSql += ` AND d.stage_id = $${idx}`;
      params.push(stage_id);
      idx++;
    }

    const dealsR = await pool.query(dealsSql, params);

    // Filtrar contactos ya en esta campana
    const existR = await pool.query(
      'SELECT persona_id FROM campana_contactos WHERE campana_id = $1',
      [campanaId]);
    const existentes = new Set(existR.rows.map(r => r.persona_id));
    const nuevos = dealsR.rows.filter(d => !existentes.has(d.persona_id));

    if (!nuevos.length) {
      return res.json({ importados: 0, mensaje: 'Todos los contactos ya estan en la campana' });
    }

    // Calcular prioridad para cada contacto
    let importados = 0;
    let agIdx = 0;

    for (const deal of nuevos) {
      // Verificar si tiene inbound perdido en ultimas 48h → prioridad 1
      const inboundR = await pool.query(`
        SELECT id FROM contact_history
        WHERE persona_id = $1 AND subtipo = 'devolver_llamada'
          AND created_at > NOW() - INTERVAL '48 hours'
        LIMIT 1
      `, [deal.persona_id]);

      let prioridad = campR.rows[0].prioridad || 3;
      if (inboundR.rows.length) prioridad = 1;

      // Reparto round-robin equitativo entre agentes
      // Si el deal tiene agente y ese agente esta en la campana, asignarselo
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

    res.json({ importados, total_deals: dealsR.rows.length, ya_existentes: existentes.size });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/dialer/reparto/automatico — redistribuir leads
router.post('/reparto/automatico', requireRole('admin'), async (req, res) => {
  try {
    // Obtener contactos sin agente o con agente inactivo
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
    // Agrupar por campana
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

// GET /api/campanas/:id/agentes — listar agentes de campana
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

module.exports = router;
