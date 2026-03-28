/**
 * Resincronización completa de deals Pipedrive → CRM
 * Compara stage_id, pipeline_id, status y agente_id
 * y corrige discrepancias sin borrar datos.
 */
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
}
const pool = require('../config/db');

const API_TOKEN = process.env.PIPEDRIVE_API_KEY;
const BASE_URL = 'https://api.pipedrive.com/v1';

async function fetchAllDeals(status = 'open') {
  let all = [];
  let start = 0;
  const limit = 500;

  while (true) {
    const url = `${BASE_URL}/deals?status=${status}&start=${start}&limit=${limit}&api_token=${API_TOKEN}`;
    const res = await fetch(url);
    const json = await res.json();

    if (!json.success || !json.data) break;
    all = all.concat(json.data);
    console.log(`  Leidos ${all.length} deals (${status})...`);

    if (!json.additional_data?.pagination?.more_items_in_collection) break;
    start = json.additional_data.pagination.next_start;
  }

  return all;
}

// Cache de users de Pipedrive → email
const userEmailCache = {};
async function getOwnerEmail(userId) {
  if (!userId) return null;
  if (userEmailCache[userId]) return userEmailCache[userId];
  try {
    const res = await fetch(`${BASE_URL}/users/${userId}?api_token=${API_TOKEN}`);
    const json = await res.json();
    const email = json.data?.email || null;
    userEmailCache[userId] = email;
    return email;
  } catch {
    return null;
  }
}

async function run() {
  console.log('=== Resincronizacion Pipeline Pipedrive → CRM ===\n');

  // Cargar mapeos locales
  const pipelines = await pool.query('SELECT id, pipedrive_id FROM pipelines');
  const pipelineMap = {};
  pipelines.rows.forEach(p => { pipelineMap[p.pipedrive_id] = p.id; });

  const stages = await pool.query('SELECT id, pipedrive_id, pipeline_id FROM pipeline_stages');
  const stageMap = {};
  stages.rows.forEach(s => { stageMap[s.pipedrive_id] = { id: s.id, pipeline_id: s.pipeline_id }; });

  const users = await pool.query('SELECT id, email FROM users WHERE activo = true');
  const userByEmail = {};
  users.rows.forEach(u => { userByEmail[u.email.toLowerCase()] = u.id; });

  // Leer todos los deals abiertos de Pipedrive
  console.log('Leyendo deals abiertos de Pipedrive...');
  const deals = await fetchAllDeals('open');
  console.log(`\nTotal deals abiertos en Pipedrive: ${deals.length}\n`);

  let updated = 0;
  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const deal of deals) {
    try {
      const pipedriveId = deal.id;
      const status = deal.status || 'open';
      const pipedriveStageId = deal.stage_id;
      const pipedrivePipelineId = deal.pipeline_id;

      const localStage = stageMap[pipedriveStageId];
      const localPipelineId = pipelineMap[pipedrivePipelineId] || localStage?.pipeline_id || null;
      const localStageId = localStage?.id || null;

      // Resolver agente por email del owner
      const ownerId = typeof deal.user_id === 'object' ? deal.user_id?.id : deal.user_id;
      const ownerEmail = await getOwnerEmail(ownerId);
      const agenteId = ownerEmail ? (userByEmail[ownerEmail.toLowerCase()] || null) : null;

      // Resolver persona
      const personPipedriveId = typeof deal.person_id === 'object' ? deal.person_id?.value : deal.person_id;
      let personaId = null;
      if (personPipedriveId) {
        const pRes = await pool.query('SELECT id FROM personas WHERE pipedrive_person_id = $1', [personPipedriveId]);
        personaId = pRes.rows[0]?.id || null;
      }

      // Stage name para referencia
      const stageName = deal.stage_name || '';
      const ownerName = deal.owner_name || '';

      // Mapear estado
      let estado = 'en_tramite';
      if (status === 'won') estado = 'poliza_activa';
      else if (status === 'lost') estado = 'perdido';

      // Upsert
      const result = await pool.query(
        `INSERT INTO deals (pipedrive_id, persona_id, producto, estado, fuente,
         pipedrive_stage, pipedrive_status, pipedrive_owner,
         pipeline_id, stage_id, agente_id)
         VALUES ($1, $2, $3, $4, 'pipedrive', $5, $6, $7, $8, $9, $10)
         ON CONFLICT (pipedrive_id) DO UPDATE SET
           stage_id = COALESCE(EXCLUDED.stage_id, deals.stage_id),
           pipeline_id = COALESCE(EXCLUDED.pipeline_id, deals.pipeline_id),
           pipedrive_status = EXCLUDED.pipedrive_status,
           pipedrive_stage = EXCLUDED.pipedrive_stage,
           estado = EXCLUDED.estado,
           agente_id = COALESCE(EXCLUDED.agente_id, deals.agente_id),
           persona_id = COALESCE(EXCLUDED.persona_id, deals.persona_id),
           updated_at = NOW()
         RETURNING (xmax = 0) AS inserted`,
        [pipedriveId, personaId, deal.title || '', estado,
         stageName, status, ownerName,
         localPipelineId, localStageId, agenteId]
      );

      if (result.rows[0]?.inserted) {
        created++;
      } else {
        updated++;
      }
    } catch (err) {
      errors++;
      if (errors <= 5) console.error(`Error deal #${deal.id}: ${err.message}`);
    }
  }

  console.log('\n=== RESUMEN ===');
  console.log(`Total deals procesados: ${deals.length}`);
  console.log(`Actualizados:           ${updated}`);
  console.log(`Nuevos creados:         ${created}`);
  console.log(`Saltados/errores:       ${errors}`);
  console.log('===============\n');

  process.exit(0);
}

run().catch(err => { console.error('Error fatal:', err); process.exit(1); });
