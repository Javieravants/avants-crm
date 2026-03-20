/**
 * Sincronizar pipeline_id y stage_id para deals open sin pipeline
 * También actualiza pipedrive_status si cambió en Pipedrive
 *
 * USO: node backend/scripts/sync-open-deals-pipeline.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const API_TOKEN = process.env.PIPEDRIVE_API_KEY;
const { Pool } = require('pg');

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : { host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASS }
);

async function fetchDeal(pipedriveId) {
  const res = await fetch(`https://api.pipedrive.com/v1/deals/${pipedriveId}?api_token=${API_TOKEN}`);
  if (!res.ok) return null;
  const json = await res.json();
  return json.success ? json.data : null;
}

async function main() {
  // Obtener deals open sin pipeline_id que tienen pipedrive_id
  const result = await pool.query(
    `SELECT id, pipedrive_id FROM deals
     WHERE pipedrive_status = 'open' AND pipeline_id IS NULL AND pipedrive_id IS NOT NULL`
  );

  const deals = result.rows;
  console.log(`Deals open sin pipeline: ${deals.length}`);

  let synced = 0, skipped = 0, errors = 0, statusChanged = 0;

  for (let i = 0; i < deals.length; i++) {
    const deal = deals[i];
    try {
      // Rate limit: 80 req/2s max en Pipedrive
      if (i > 0 && i % 8 === 0) await new Promise(r => setTimeout(r, 300));

      const pd = await fetchDeal(deal.pipedrive_id);
      if (!pd) {
        console.log(`  [${i+1}/${deals.length}] Deal #${deal.pipedrive_id} — no encontrado en Pipedrive`);
        skipped++;
        continue;
      }

      // Mapear pipeline_id de Pipedrive → local
      let localPipelineId = null;
      if (pd.pipeline_id) {
        const pipeRes = await pool.query('SELECT id FROM pipelines WHERE pipedrive_id = $1', [pd.pipeline_id]);
        if (pipeRes.rows.length > 0) localPipelineId = pipeRes.rows[0].id;
      }

      // Mapear stage_id de Pipedrive → id local en pipeline_stages
      let localStageId = null;
      let stageName = '';
      if (pd.stage_id) {
        const stageRes = await pool.query('SELECT id, name FROM pipeline_stages WHERE pipedrive_id = $1', [pd.stage_id]);
        if (stageRes.rows.length > 0) {
          localStageId = stageRes.rows[0].id;
          stageName = stageRes.rows[0].name;
        } else {
          // Stage no existe en CRM — obtener nombre de Pipedrive y crearlo
          try {
            const apiRes = await fetch(`https://api.pipedrive.com/v1/stages/${pd.stage_id}?api_token=${API_TOKEN}`);
            const apiData = await apiRes.json();
            if (apiData.data) {
              stageName = apiData.data.name || '';
              // Insertar stage en pipeline_stages
              if (localPipelineId) {
                const ins = await pool.query(
                  `INSERT INTO pipeline_stages (pipeline_id, pipedrive_id, name, orden)
                   VALUES ($1, $2, $3, $4)
                   ON CONFLICT (pipeline_id, name) DO UPDATE SET pipedrive_id = $2
                   RETURNING id`,
                  [localPipelineId, pd.stage_id, stageName, apiData.data.order_nr || 0]
                );
                localStageId = ins.rows[0]?.id || null;
              }
            }
          } catch {}
        }
      }

      // Mapear status
      let estado = 'en_tramite';
      if (pd.status === 'won') estado = 'poliza_activa';
      else if (pd.status === 'lost') estado = 'perdido';

      await pool.query(
        `UPDATE deals SET pipeline_id = $1, stage_id = $2, pipedrive_status = $3,
         pipedrive_stage = $4, estado = $5, updated_at = CURRENT_TIMESTAMP
         WHERE id = $6`,
        [localPipelineId, localStageId, pd.status, stageName, estado, deal.id]
      );

      if (pd.status !== 'open') statusChanged++;
      synced++;

      if ((i+1) % 25 === 0 || i === deals.length - 1) {
        console.log(`  [${i+1}/${deals.length}] synced=${synced} changed=${statusChanged} skipped=${skipped} errors=${errors}`);
      }
    } catch (err) {
      console.error(`  Error deal #${deal.pipedrive_id}:`, err.message);
      errors++;
    }
  }

  console.log(`\n=== RESULTADO ===`);
  console.log(`Total procesados: ${deals.length}`);
  console.log(`Sincronizados OK: ${synced}`);
  console.log(`Status cambiado (ya no open): ${statusChanged}`);
  console.log(`No encontrados: ${skipped}`);
  console.log(`Errores: ${errors}`);

  await pool.end();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
