/**
 * Sincronizar status de deals won/lost desde Pipedrive
 * USO: node backend/scripts/sync-deals-status.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { Pool } = require('pg');
const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : { host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASS }
);
const PD_KEY = process.env.PIPEDRIVE_API_KEY;

async function syncStatus(pdStatus, crmEstado) {
  let start = 0, total = 0, updated = 0;
  while (true) {
    const r = await fetch(`https://api.pipedrive.com/v1/deals?status=${pdStatus}&start=${start}&limit=500&api_token=${PD_KEY}`);
    const data = await r.json();
    if (!data.success || !data.data) break;

    for (const d of data.data) {
      const upd = await pool.query(
        `UPDATE deals SET pipedrive_status = $1, estado = $2, updated_at = NOW()
         WHERE pipedrive_id = $3 AND pipedrive_status != $1`,
        [pdStatus, crmEstado, d.id]
      );
      if (upd.rowCount > 0) updated++;
      total++;
    }

    console.log(`  [${pdStatus}] offset=${start} processed=${total} updated=${updated}`);
    if (!data.additional_data?.pagination?.more_items_in_collection) break;
    start = data.additional_data.pagination.next_start;
    await new Promise(r => setTimeout(r, 200));
  }
  return { total, updated };
}

async function main() {
  console.log('Sincronizando status de deals desde Pipedrive...');
  const won = await syncStatus('won', 'poliza_activa');
  console.log(`WON: ${won.total} procesados, ${won.updated} actualizados`);
  const lost = await syncStatus('lost', 'perdido');
  console.log(`LOST: ${lost.total} procesados, ${lost.updated} actualizados`);
  console.log('Completado.');
  await pool.end();
}

main().catch(e => { console.error('Error:', e); process.exit(1); });
