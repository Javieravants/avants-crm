/**
 * Sincronizar actividades históricas de Pipedrive → contact_history + tareas
 * USO: node backend/scripts/sync-activities.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { Pool } = require('pg');
const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : { host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASS }
);
const PD_KEY = process.env.PIPEDRIVE_API_KEY;

const TIPO_MAP = { call: 'llamada', note: 'nota', task: 'nota', meeting: 'nota', email: 'email' };

// Cache de mapeos para no repetir queries
const personaCache = {};
const dealCache = {};
const userCache = {};

async function getPersonaId(pdPersonId) {
  if (!pdPersonId) return null;
  if (personaCache[pdPersonId] !== undefined) return personaCache[pdPersonId];
  const r = await pool.query('SELECT id FROM personas WHERE pipedrive_person_id = $1', [pdPersonId]);
  personaCache[pdPersonId] = r.rows[0]?.id || null;
  return personaCache[pdPersonId];
}

async function getDealId(pdDealId) {
  if (!pdDealId) return null;
  if (dealCache[pdDealId] !== undefined) return dealCache[pdDealId];
  const r = await pool.query('SELECT id FROM deals WHERE pipedrive_id = $1', [pdDealId]);
  dealCache[pdDealId] = r.rows[0]?.id || null;
  return dealCache[pdDealId];
}

async function getAgenteId(pdUserId) {
  if (!pdUserId) return null;
  if (userCache[pdUserId] !== undefined) return userCache[pdUserId];
  // Primero intentar por email via API
  try {
    const r = await fetch(`https://api.pipedrive.com/v1/users/${pdUserId}?api_token=${PD_KEY}`);
    const d = await r.json();
    if (d.data?.email) {
      const u = await pool.query('SELECT id FROM users WHERE email = $1', [d.data.email]);
      userCache[pdUserId] = u.rows[0]?.id || null;
      return userCache[pdUserId];
    }
  } catch {}
  userCache[pdUserId] = null;
  return null;
}

async function main() {
  console.log('Sincronizando actividades de Pipedrive → contact_history...');

  let start = 0, total = 0, inserted = 0, skipped = 0, errors = 0, tareas = 0;

  while (true) {
    const r = await fetch(`https://api.pipedrive.com/v1/activities?start=${start}&limit=100&api_token=${PD_KEY}`);
    const data = await r.json();
    if (!data.success || !data.data) break;

    for (const act of data.data) {
      total++;
      const personaId = await getPersonaId(act.person_id);
      if (!personaId) { skipped++; continue; }

      // Verificar duplicado
      const exists = await pool.query(
        "SELECT id FROM contact_history WHERE metadata->>'pipedrive_activity_id' = $1",
        [String(act.id)]
      );
      if (exists.rows.length > 0) { skipped++; continue; }

      const dealId = await getDealId(act.deal_id);
      const agenteId = await getAgenteId(act.user_id);
      const tipo = TIPO_MAP[act.type] || 'nota';
      const isDone = act.done || false;

      try {
        await pool.query(
          `INSERT INTO contact_history (persona_id, deal_id, tipo, subtipo, titulo, descripcion, metadata, agente_id, origen, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pipedrive', $9)`,
          [personaId, dealId, tipo,
           tipo === 'llamada' ? (isDone ? 'contestada' : 'no_contestada') : null,
           (act.subject || act.type || '').substring(0, 255),
           act.note || act.public_description || '',
           JSON.stringify({ pipedrive_activity_id: act.id, done: isDone, due_date: act.due_date, due_time: act.due_time }),
           agenteId, act.add_time || new Date()]
        );
        inserted++;

        // Si no está hecha → insertar como tarea pendiente
        if (!isDone && act.due_date) {
          const texists = await pool.query('SELECT id FROM tareas WHERE pipedrive_activity_id = $1', [act.id]);
          if (texists.rows.length === 0) {
            await pool.query(
              `INSERT INTO tareas (persona_id, deal_id, agente_id, tipo, titulo, descripcion, fecha_venc, hora_venc, estado, pipedrive_activity_id)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pendiente', $9)`,
              [personaId, dealId, agenteId, act.type || 'task', act.subject || '',
               act.note || '', act.due_date || null, act.due_time || null, act.id]
            );
            tareas++;
          }
        }
      } catch (e) { errors++; }
    }

    console.log(`  offset=${start} total=${total} inserted=${inserted} skipped=${skipped} tareas=${tareas} errors=${errors}`);
    if (!data.additional_data?.pagination?.more_items_in_collection) break;
    start = data.additional_data.pagination.next_start;
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\nCompletado: ${total} actividades, ${inserted} insertadas, ${skipped} saltadas, ${tareas} tareas, ${errors} errores`);
  await pool.end();
}

main().catch(e => { console.error('Error:', e); process.exit(1); });
