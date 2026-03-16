const express = require('express');
const pool = require('../config/db');
const { DEAL_FIELDS, PERSON_FIELDS } = require('../utils/pipedrive-sync');
const { notifyUser } = require('../utils/notifications');

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

  const { event, current, previous } = req.body;
  if (!event || !current) return;

  try {
    const [action, entity] = event.split('.');
    // action: added, updated, merged, deleted
    // entity: deal, person, note, activity...

    if (entity === 'deal') {
      await handleDeal(action, current, previous);
    } else if (entity === 'person') {
      await handlePerson(action, current);
    }
  } catch (err) {
    console.error('Error procesando webhook Pipedrive:', err.message);
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

  // Stage name
  let stageName = '';
  if (data.stage_id) {
    try {
      const stageRes = await fetch(
        `https://api.pipedrive.com/v1/stages/${data.stage_id}?api_token=${process.env.PIPEDRIVE_API_KEY}`
      );
      const stageData = await stageRes.json();
      if (stageData.data) stageName = stageData.data.name || '';
    } catch {}
  }

  // Owner name
  let ownerName = '';
  const ownerId = data.user_id?.id || data.user_id;
  if (ownerId) {
    try {
      const userRes = await fetch(
        `https://api.pipedrive.com/v1/users/${ownerId}?api_token=${process.env.PIPEDRIVE_API_KEY}`
      );
      const userData = await userRes.json();
      if (userData.data) ownerName = userData.data.name || '';
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

  // Campos extra
  const datosExtra = {};
  for (const [nombre, key] of Object.entries(DEAL_FIELDS)) {
    const val = getField(data, key);
    if (val) datosExtra[nombre] = val;
  }

  if (action === 'added') {
    // Nuevo deal
    const existing = await pool.query('SELECT id FROM deals WHERE pipedrive_id = $1', [pipedriveId]);
    if (existing.rows.length > 0) return; // Ya existe

    await pool.query(
      `INSERT INTO deals (pipedrive_id, persona_id, poliza, producto, prima, fecha_efecto,
       estado, fuente, pipedrive_stage, pipedrive_status, pipedrive_owner, datos_extra)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [pipedriveId, personaId, poliza, producto, prima,
       efecto ? new Date(efecto) : null,
       estado, 'pipedrive', stageName, status, ownerName, JSON.stringify(datosExtra)]
    );

    console.log(`[Webhook] Deal #${pipedriveId} creado → ${estado}`);

  } else if (action === 'updated') {
    const existing = await pool.query('SELECT id, estado FROM deals WHERE pipedrive_id = $1', [pipedriveId]);

    if (existing.rows.length === 0) {
      // No existía, crear
      await pool.query(
        `INSERT INTO deals (pipedrive_id, persona_id, poliza, producto, prima, fecha_efecto,
         estado, fuente, pipedrive_stage, pipedrive_status, pipedrive_owner, datos_extra)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [pipedriveId, personaId, poliza, producto, prima,
         efecto ? new Date(efecto) : null,
         estado, 'pipedrive', stageName, status, ownerName, JSON.stringify(datosExtra)]
      );
    } else {
      await pool.query(
        `UPDATE deals SET persona_id = COALESCE($1, persona_id), poliza = COALESCE($2, poliza),
         producto = $3, prima = $4, estado = $5, pipedrive_stage = $6, pipedrive_status = $7,
         pipedrive_owner = $8, datos_extra = $9, updated_at = CURRENT_TIMESTAMP
         WHERE pipedrive_id = $10`,
        [personaId, poliza, producto, prima, estado, stageName, status, ownerName,
         JSON.stringify(datosExtra), pipedriveId]
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

    console.log(`[Webhook] Deal #${pipedriveId} actualizado → ${estado}`);

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

module.exports = router;
