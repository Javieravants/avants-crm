const express = require('express');
const pool = require('../config/db');
const { DEAL_FIELDS, PERSON_FIELDS } = require('../utils/pipedrive-sync');
const { notifyUser } = require('../utils/notifications');
const { registrarEvento } = require('./history');

const router = express.Router();

// Pipedrive envía username:password en Basic Auth como verificación
// Configurar PIPEDRIVE_WEBHOOK_USER y PIPEDRIVE_WEBHOOK_PASS en .env
function verifyWebhook(req, res, next) {
  const authHeader = req.headers.authorization;
  const user = process.env.PIPEDRIVE_WEBHOOK_USER;
  const pass = process.env.PIPEDRIVE_WEBHOOK_PASS;

  // Si no hay credenciales configuradas, aceptar todo (dev)
  if (!user || !pass) return next();

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const decoded = Buffer.from(authHeader.split(' ')[1], 'base64').toString();
  const [u, p] = decoded.split(':');
  if (u === user && p === pass) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

router.use(verifyWebhook);

// POST /api/webhooks/pipedrive
router.post('/pipedrive', async (req, res) => {
  // Responder rápido a Pipedrive (evitar timeout)
  res.status(200).json({ ok: true });

  const body = req.body;
  try { require('fs').writeFileSync('/tmp/webhook-payload.json', JSON.stringify(body, null, 2)); } catch(e) {}

  // Pipedrive v1: { event: "updated.deal", current: {...}, previous: {...} }
  // Pipedrive v2: { event: "updated.deal", data: { current: {...}, previous: {...} } }
  // Pipedrive v2 alt: { meta: { action: "updated", object: "deal" }, data: {...} }
  let event = body.event;
  let current, previous;

  if (event) {
    // v1 o v2 con event
    current = body.current || body.data?.current || body.data;
    previous = body.previous || body.data?.previous || null;
  } else if (body.meta?.action && body.meta?.object) {
    // v2 sin event — construir desde meta
    event = `${body.meta.action}.${body.meta.object}`;
    current = body.data || {};
    previous = body.previous_data || body.previous || null;
  }

  if (!event || !current) {
    console.warn('[Webhook] Payload no reconocido:', JSON.stringify(body).substring(0, 500));
    return;
  }

  console.log(`[Webhook] Recibido: ${event} — id: ${current.id || 'N/A'}`);

  try {
    const [action, entity] = event.split('.');
    // v1: added/updated/deleted, v2: create/change/delete
    const normalizedAction = { create: 'added', change: 'updated', delete: 'deleted' }[action] || action;

    if (entity === 'deal') {
      await handleDeal(normalizedAction, current, previous);
    } else if (entity === 'person') {
      await handlePerson(normalizedAction, current);
    } else if (entity === 'activity') {
      await handleActivity(normalizedAction, current);
    }
  } catch (err) {
    console.error('[Webhook] Error procesando:', err.message, err.stack);
  }
});

// =============================================
// DEAL
// =============================================
async function handleDeal(action, data, previous) {
  const pipedriveId = data.id;
  if (!pipedriveId) return;

  const title = data.title || '';
  const status = data.status || 'open';
  const personPipedriveId = typeof data.person_id === 'object' ? data.person_id?.value : data.person_id;
  const value = data.value || 0;

  // Campos custom
  const poliza = getField(data, DEAL_FIELDS.poliza);
  const producto = getField(data, DEAL_FIELDS.etiqueta) || getField(data, DEAL_FIELDS.tipo_poliza) || title;
  const precioRaw = getField(data, DEAL_FIELDS.precio);
  const prima = precioRaw ? parseFloat(String(precioRaw).replace(',', '.').replace(/[^\d.]/g, '')) || value : value;
  const efectoRaw = getField(data, DEAL_FIELDS.efecto);
  let efecto = null;
  if (efectoRaw) {
    const parsed = new Date(efectoRaw);
    if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1900) efecto = efectoRaw;
  }

  // Mapear pipeline_id de Pipedrive → pipeline_id local
  let stageName = '';
  let localPipelineId = null;
  let localStageId = null;
  if (data.pipeline_id) {
    const pipeRes = await pool.query('SELECT id FROM pipelines WHERE pipedrive_id = $1', [data.pipeline_id]);
    if (pipeRes.rows.length > 0) localPipelineId = pipeRes.rows[0].id;
  }
  // Mapear stage_id de Pipedrive → id local en pipeline_stages
  if (data.stage_id) {
    const stageRes = await pool.query('SELECT id, name FROM pipeline_stages WHERE pipedrive_id = $1', [data.stage_id]);
    if (stageRes.rows.length > 0) {
      localStageId = stageRes.rows[0].id;
      stageName = stageRes.rows[0].name;
    } else {
      // Stage no existe — obtener de API y crear
      try {
        const apiRes = await fetch(`https://api.pipedrive.com/v1/stages/${data.stage_id}?api_token=${process.env.PIPEDRIVE_API_KEY}`);
        const apiData = await apiRes.json();
        if (apiData.data) {
          stageName = apiData.data.name || '';
          if (localPipelineId) {
            const ins = await pool.query(
              `INSERT INTO pipeline_stages (pipeline_id, pipedrive_id, name, orden)
               VALUES ($1, $2, $3, $4) ON CONFLICT (pipeline_id, name) DO UPDATE SET pipedrive_id = $2 RETURNING id`,
              [localPipelineId, data.stage_id, stageName, apiData.data.order_nr || 0]
            );
            localStageId = ins.rows[0]?.id || null;
          }
        }
      } catch {}
    }
  }

  // Owner name + agente_id mapping
  let ownerName = '';
  let agenteId = null;
  const ownerId = data.user_id?.id || data.user_id;
  if (ownerId) {
    try {
      const userRes = await fetch(
        `https://api.pipedrive.com/v1/users/${ownerId}?api_token=${process.env.PIPEDRIVE_API_KEY}`
      );
      const userData = await userRes.json();
      if (userData.data) {
        ownerName = userData.data.name || '';
        // Buscar agente CRM por email del owner de Pipedrive
        const ownerEmail = userData.data.email || '';
        if (ownerEmail) {
          const agR = await pool.query('SELECT id FROM users WHERE email = $1 AND activo = true', [ownerEmail]);
          if (agR.rows[0]) agenteId = agR.rows[0].id;
        }
      }
    } catch {}
  }

  // Mapear status
  let estado = 'en_tramite';
  if (status === 'won') estado = 'poliza_activa';
  else if (status === 'lost') estado = 'perdido';

  // Buscar persona
  let personaId = null;
  if (personPipedriveId) {
    const pRes = await pool.query('SELECT id FROM personas WHERE pipedrive_person_id = $1', [personPipedriveId]);
    if (pRes.rows.length > 0) personaId = pRes.rows[0].id;
  }

  // Campos dedicados de póliza
  const tipoPoliza = getField(data, DEAL_FIELDS.tipo_poliza);
  const numSolicitud = getField(data, DEAL_FIELDS.n_solicitud);
  const frecPago = getField(data, DEAL_FIELDS.freq_pago);
  const ibanVal = getField(data, DEAL_FIELDS.iban);
  const descuentoVal = getField(data, DEAL_FIELDS.descuento);
  const obsVal = getField(data, DEAL_FIELDS.observaciones);

  // Datos persona del deal
  const dniTitular = getField(data, DEAL_FIELDS.dni);
  const fechaNacRaw = getField(data, DEAL_FIELDS.fecha_nac);
  const direccionVal = getField(data, DEAL_FIELDS.direccion);
  const cpVal = getField(data, DEAL_FIELDS.cod_postal);
  const nacVal = getField(data, DEAL_FIELDS.nacionalidad);

  // Campos extra (JSONB completo)
  const datosExtra = {};
  for (const [nombre, key] of Object.entries(DEAL_FIELDS)) {
    const val = getField(data, key);
    if (val) datosExtra[nombre] = val;
  }

  // Sincronizar etiqueta (label) de Pipedrive
  const pipedriveLabel = data.label;

  if (action === 'added') {
    // Nuevo deal
    const existing = await pool.query('SELECT id FROM deals WHERE pipedrive_id = $1', [pipedriveId]);
    if (existing.rows.length > 0) return; // Ya existe

    const insResult = await pool.query(
      `INSERT INTO deals (pipedrive_id, persona_id, poliza, producto, prima, fecha_efecto,
       estado, fuente, pipedrive_stage, pipedrive_status, pipedrive_owner, datos_extra,
       pipeline_id, stage_id, agente_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING id`,
      [pipedriveId, personaId, poliza, producto, prima,
       efecto ? new Date(efecto) : null,
       estado, 'pipedrive', stageName, status, ownerName, JSON.stringify(datosExtra),
       localPipelineId, localStageId, agenteId]
    );

    // Vincular etiqueta al deal nuevo
    if (pipedriveLabel && insResult.rows[0]) {
      await syncDealLabel(insResult.rows[0].id, pipedriveLabel, personaId);
    }

    console.log(`[Webhook] Deal #${pipedriveId} creado → ${estado} (agente: ${agenteId})`);

  } else if (action === 'updated') {
    const existing = await pool.query('SELECT id, estado, stage_id AS prev_stage_id FROM deals WHERE pipedrive_id = $1', [pipedriveId]);

    if (existing.rows.length === 0) {
      // No existía, crear
      await pool.query(
        `INSERT INTO deals (pipedrive_id, persona_id, poliza, producto, prima, fecha_efecto,
         estado, fuente, pipedrive_stage, pipedrive_status, pipedrive_owner, datos_extra,
         pipeline_id, stage_id, agente_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [pipedriveId, personaId, poliza, producto, prima,
         efecto ? new Date(efecto) : null,
         estado, 'pipedrive', stageName, status, ownerName, JSON.stringify(datosExtra),
         localPipelineId, localStageId, agenteId]
      );
    } else {
      await pool.query(
        `UPDATE deals SET persona_id = COALESCE($1, persona_id), poliza = COALESCE($2, poliza),
         producto = $3, prima = $4, estado = $5, pipedrive_stage = $6, pipedrive_status = $7,
         pipedrive_owner = $8, datos_extra = $9, pipeline_id = COALESCE($10, pipeline_id),
         stage_id = COALESCE($11, stage_id), agente_id = COALESCE($12, agente_id),
         updated_at = CURRENT_TIMESTAMP
         WHERE pipedrive_id = $13`,
        [personaId, poliza, producto, prima, estado, stageName, status, ownerName,
         JSON.stringify(datosExtra), localPipelineId, localStageId, agenteId, pipedriveId]
      );

      // Si cambió a "won" → notificar admins
      const prevStatus = previous?.status;
      if (status === 'won' && prevStatus !== 'won') {
        console.log(`[Webhook] Deal #${pipedriveId} GANADO → póliza activa`);
        // Notificar a todos los admins
        const admins = await pool.query("SELECT id FROM users WHERE rol = 'admin' AND activo = true");
        for (const admin of admins.rows) {
          await notifyUser(admin.id, null, `Deal #${pipedriveId} "${title}" ganado — póliza: ${poliza || 'sin nº'}`);
        }
      }
    }

    // Sincronizar etiqueta del deal actualizado
    if (pipedriveLabel && existing.rows[0]) {
      await syncDealLabel(existing.rows[0].id, pipedriveLabel, personaId);
    }

    console.log(`[Webhook] Deal #${pipedriveId} actualizado → ${estado}`);

    // Registrar cambio de etapa en historial (solo si realmente cambió)
    if (personaId && stageName && localStageId) {
      const prevStageId = existing.rows[0]?.prev_stage_id || null;
      if (prevStageId !== localStageId) {
        const prevStage = previous?.stage_id ? (await pool.query('SELECT name FROM pipeline_stages WHERE pipedrive_id = $1', [previous.stage_id]).catch(() => ({rows:[]}))).rows[0]?.name : null;
        registrarEvento(personaId, 'etapa', {
          deal_id: existing.rows[0]?.id,
          titulo: prevStage ? `${prevStage} → ${stageName}` : `Movido a ${stageName}`,
          metadata: { etapa_origen: prevStage || '', etapa_destino: stageName, pipeline_nombre: ownerName },
          origen: 'pipedrive'
        });
      }
    }

    // Registrar deal ganado como póliza
    if (status === 'won' && personaId) {
      registrarEvento(personaId, 'poliza', {
        deal_id: existing.rows[0]?.id,
        titulo: `Póliza: ${producto || title}`,
        metadata: { tipo: producto, compania: datosExtra.etiqueta || '', precio_mensual: prima },
        origen: 'pipedrive'
      });
    }

    // Registrar deal perdido
    if (status === 'lost' && personaId) {
      const lostReason = data.lost_reason || '';
      registrarEvento(personaId, 'etapa', {
        deal_id: existing.rows[0]?.id,
        subtipo: 'lost',
        titulo: 'Deal marcado como perdido',
        descripcion: lostReason,
        metadata: { motivo: lostReason, pipeline_nombre: ownerName },
        origen: 'pipedrive'
      });
    }

    // Actualizar datos de persona desde campos del deal
    if (personaId && (dniTitular || fechaNacRaw || direccionVal)) {
      try {
        await pool.query(
          `UPDATE personas SET
            dni = COALESCE($1, dni),
            fecha_nacimiento = COALESCE($2::date, fecha_nacimiento),
            direccion = COALESCE($3, direccion),
            codigo_postal = COALESCE($4, codigo_postal),
            nacionalidad = COALESCE($5, nacionalidad)
          WHERE id = $6`,
          [dniTitular?.toUpperCase(), fechaNacRaw, direccionVal, cpVal ? cpVal.substring(0, 20) : null, nacVal, personaId]
        );
      } catch {}
    }

  } else if (action === 'deleted') {
    await pool.query(
      "UPDATE deals SET estado = 'eliminado', updated_at = CURRENT_TIMESTAMP WHERE pipedrive_id = $1",
      [pipedriveId]
    );
    console.log(`[Webhook] Deal #${pipedriveId} eliminado`);
  }
}

// =============================================
// PERSON
// =============================================
async function handlePerson(action, data) {
  const pipedriveId = data.id;
  if (!pipedriveId) return;

  const name = data.name || '';
  const email = getEmail(data.email);
  const phone = getPhone(data.phone);
  const dni = getField(data, PERSON_FIELDS.dni) || getField(data, PERSON_FIELDS.dni_alt) || null;

  if (action === 'added') {
    const existing = await pool.query('SELECT id FROM personas WHERE pipedrive_person_id = $1', [pipedriveId]);
    if (existing.rows.length > 0) return;

    await pool.query(
      `INSERT INTO personas (pipedrive_person_id, nombre, email, telefono, dni)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (pipedrive_person_id) DO NOTHING`,
      [pipedriveId, name, email, phone, dni ? dni.toUpperCase() : null]
    );
    console.log(`[Webhook] Persona #${pipedriveId} creada`);

  } else if (action === 'updated') {
    const existing = await pool.query('SELECT id FROM personas WHERE pipedrive_person_id = $1', [pipedriveId]);
    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE personas SET nombre = $1, email = COALESCE($2, email), telefono = COALESCE($3, telefono),
         dni = COALESCE($4, dni), updated_at = CURRENT_TIMESTAMP
         WHERE pipedrive_person_id = $5`,
        [name, email, phone, dni ? dni.toUpperCase() : null, pipedriveId]
      );
    } else {
      await pool.query(
        `INSERT INTO personas (pipedrive_person_id, nombre, email, telefono, dni)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (pipedrive_person_id) DO NOTHING`,
        [pipedriveId, name, email, phone, dni ? dni.toUpperCase() : null]
      );
    }
    console.log(`[Webhook] Persona #${pipedriveId} actualizada`);

  } else if (action === 'deleted') {
    // No borrar, solo log
    console.log(`[Webhook] Persona #${pipedriveId} eliminada en Pipedrive (mantenida en CRM)`);
  }
}

// Helpers
function getField(obj, key) {
  const val = obj[key];
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'object') return null;
  return String(val).trim();
}

function getEmail(arr) {
  if (!arr || !Array.isArray(arr)) return null;
  const p = arr.find((e) => e.primary) || arr[0];
  return p?.value || null;
}

function getPhone(arr) {
  if (!arr || !Array.isArray(arr)) return null;
  const p = arr.find((e) => e.primary) || arr[0];
  return p?.value || null;
}

// =============================================
// ACTIVITY
// =============================================
async function handleActivity(action, data) {
  if (!data.id) return;

  const tipoMap = { call: 'llamada', note: 'nota', task: 'nota', meeting: 'nota', email: 'email' };
  const tipo = tipoMap[data.type] || 'nota';
  const isDone = data.done || false;

  // Buscar persona y deal en CRM
  const pdPersonId = data.person_id;
  const pdDealId = data.deal_id;
  let personaId = null, dealId = null, agenteId = null;

  if (pdPersonId) {
    const pR = await pool.query('SELECT id FROM personas WHERE pipedrive_person_id = $1', [pdPersonId]);
    if (pR.rows[0]) personaId = pR.rows[0].id;
  }
  if (pdDealId) {
    const dR = await pool.query('SELECT id FROM deals WHERE pipedrive_id = $1', [pdDealId]);
    if (dR.rows[0]) dealId = dR.rows[0].id;
  }

  // Buscar agente por email del user de Pipedrive
  const pdUserId = data.user_id;
  if (pdUserId) {
    try {
      const uR = await fetch(`https://api.pipedrive.com/v1/users/${pdUserId}?api_token=${process.env.PIPEDRIVE_API_KEY}`);
      const uD = await uR.json();
      if (uD.data?.email) {
        const agR = await pool.query('SELECT id FROM users WHERE email = $1 AND activo = true', [uD.data.email]);
        if (agR.rows[0]) agenteId = agR.rows[0].id;
      }
    } catch {}
  }

  if (!personaId) return; // Sin persona, no registrar

  // Registrar en contact_history
  const subtipo = tipo === 'llamada' ? (isDone ? 'contestada' : 'no_contestada') : null;
  registrarEvento(personaId, tipo, {
    deal_id: dealId,
    subtipo,
    titulo: (data.subject || data.type || '').substring(0, 255),
    descripcion: data.note || data.public_description || '',
    metadata: {
      pipedrive_activity_id: data.id,
      done: isDone,
      due_date: data.due_date,
      due_time: data.due_time,
      duracion_seg: data.duration
    },
    agente_id: agenteId,
    origen: 'pipedrive'
  });

  // Gestionar tabla tareas
  if (action === 'added' && !isDone) {
    // Nueva tarea pendiente
    const exists = await pool.query('SELECT id FROM tareas WHERE pipedrive_activity_id = $1', [data.id]);
    if (exists.rows.length === 0) {
      await pool.query(
        `INSERT INTO tareas (persona_id, deal_id, agente_id, tipo, titulo, descripcion, fecha_venc, hora_venc, estado, pipedrive_activity_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pendiente', $9)`,
        [personaId, dealId, agenteId, data.type || 'task', data.subject || '',
         data.note || '', data.due_date || null, data.due_time || null, data.id]
      );
    }
  } else if (action === 'updated' && isDone) {
    // Marcar como hecha
    await pool.query(
      "UPDATE tareas SET estado = 'hecha' WHERE pipedrive_activity_id = $1",
      [data.id]
    );
  }

  console.log(`[Webhook] Activity #${data.id} (${tipo}) → persona: ${personaId}`);
}

// Sincronizar label de Pipedrive → etiquetas CRM
async function syncDealLabel(dealId, labelId, personaId) {
  try {
    // Obtener nombre del label desde Pipedrive dealFields (cache en memoria)
    if (!syncDealLabel._labelCache) {
      const API_TOKEN = process.env.PIPEDRIVE_API_KEY;
      const res = await fetch(`https://api.pipedrive.com/v1/dealFields?api_token=${API_TOKEN}`);
      const data = await res.json();
      const labelField = data.data?.find(f => f.key === 'label');
      syncDealLabel._labelCache = {};
      if (labelField?.options) {
        const colorMap = { green:'#10b981', blue:'#009DDD', red:'#ef4444', yellow:'#f59e0b', purple:'#8b5cf6', gray:'#94a3b8', orange:'#f97316', pink:'#ec4899' };
        labelField.options.forEach(opt => {
          syncDealLabel._labelCache[opt.id] = { name: opt.label, color: colorMap[opt.color] || '#009DDD' };
        });
      }
    }

    const labelInfo = syncDealLabel._labelCache[labelId];
    if (!labelInfo) return;

    // Crear o obtener etiqueta
    const { rows } = await pool.query(
      `INSERT INTO etiquetas (nombre, color, origen) VALUES ($1, $2, 'pipedrive')
       ON CONFLICT (tenant_id, nombre) DO UPDATE SET color = $2 RETURNING id`,
      [labelInfo.name, labelInfo.color]
    );
    const etiquetaId = rows[0].id;

    // Vincular al deal
    await pool.query(
      'INSERT INTO deal_etiquetas (deal_id, etiqueta_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [dealId, etiquetaId]
    );

    // Vincular a persona también
    if (personaId) {
      await pool.query(
        'INSERT INTO persona_etiquetas (persona_id, etiqueta_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [personaId, etiquetaId]
      );
    }
  } catch (err) {
    console.error('[Webhook] Error sync label:', err.message);
  }
}

module.exports = router;
