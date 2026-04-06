/**
 * Sincronizar notas de Pipedrive → contact_history
 *
 * Pagina la API global GET /notes y las inserta en contact_history
 * con deduplicación por pipedrive_note_id en metadata JSONB.
 *
 * USO: node backend/scripts/sync-pipedrive-notes.js
 *
 * Requisitos:
 *   - Ejecutar migration-notas-history.sql antes (índice idx_history_pd_note)
 *   - PIPEDRIVE_API_KEY en .env
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { Pool } = require('pg');
const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : { host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASS }
);

const PD_KEY = process.env.PIPEDRIVE_API_KEY;
const PD_BASE = 'https://api.pipedrive.com/v1';

// Caches para evitar queries repetidas
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

async function getDealPersonaId(pdDealId) {
  if (!pdDealId) return { dealId: null, personaId: null };
  if (dealCache[pdDealId] !== undefined) return dealCache[pdDealId];
  const r = await pool.query('SELECT id, persona_id FROM deals WHERE pipedrive_id = $1', [pdDealId]);
  const result = { dealId: r.rows[0]?.id || null, personaId: r.rows[0]?.persona_id || null };
  dealCache[pdDealId] = result;
  return result;
}

async function getAgenteId(pdUserId) {
  if (!pdUserId) return null;
  if (userCache[pdUserId] !== undefined) return userCache[pdUserId];
  try {
    const r = await fetch(`${PD_BASE}/users/${pdUserId}?api_token=${PD_KEY}`);
    const d = await r.json();
    if (d.data?.email) {
      const u = await pool.query('SELECT id FROM users WHERE email = $1', [d.data.email]);
      userCache[pdUserId] = u.rows[0]?.id || null;
      return userCache[pdUserId];
    }
  } catch { /* ignorar */ }
  userCache[pdUserId] = null;
  return null;
}

// Limpiar HTML básico de las notas de Pipedrive
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function main() {
  const t0 = Date.now();
  console.log('=== Sincronización notas Pipedrive → contact_history ===\n');

  if (!PD_KEY) {
    console.error('Error: PIPEDRIVE_API_KEY no configurada en .env');
    process.exit(1);
  }

  let start = 0;
  let total = 0, inserted = 0, duplicates = 0, noPersona = 0, errors = 0;

  while (true) {
    const url = `${PD_BASE}/notes?start=${start}&limit=100&api_token=${PD_KEY}`;
    const response = await fetch(url);

    if (response.status === 429) {
      console.log('  Rate limit — esperando 2s...');
      await new Promise(r => setTimeout(r, 2000));
      continue;
    }

    const data = await response.json();
    if (!data.success || !data.data) {
      if (total === 0) console.log('  No se encontraron notas o error en API.');
      break;
    }

    for (let i = 0; i < data.data.length; i++) {
      const note = data.data[i];
      total++;

      // Deduplicar por pipedrive_note_id
      const exists = await pool.query(
        "SELECT id FROM contact_history WHERE metadata->>'pipedrive_note_id' = $1",
        [String(note.id)]
      );
      if (exists.rows.length > 0) { duplicates++; continue; }

      // Resolver persona_id: primero por person_id, luego por deal_id
      let personaId = await getPersonaId(note.person_id);
      let dealId = null;

      if (note.deal_id) {
        const dealInfo = await getDealPersonaId(note.deal_id);
        dealId = dealInfo.dealId;
        if (!personaId) personaId = dealInfo.personaId;
      }

      if (!personaId) { noPersona++; continue; }

      // Resolver agente
      const agenteId = await getAgenteId(note.user_id);

      // Limpiar contenido
      const contenido = stripHtml(note.content);
      const titulo = contenido.substring(0, 255).split('\n')[0];

      try {
        await pool.query(
          `INSERT INTO contact_history
           (persona_id, deal_id, tipo, subtipo, titulo, descripcion, metadata, agente_id, origen, created_at)
           VALUES ($1, $2, 'nota', NULL, $3, $4, $5, $6, 'pipedrive', $7)`,
          [
            personaId,
            dealId,
            titulo,
            contenido,
            JSON.stringify({
              pipedrive_note_id: note.id,
              deal_id: note.deal_id,
              org_id: note.org_id,
              pinned: note.pinned_to_deal_flag || note.pinned_to_person_flag || false
            }),
            agenteId,
            note.add_time || new Date()
          ]
        );
        inserted++;
      } catch (e) {
        errors++;
        if (errors <= 10) console.error(`  Error nota PD#${note.id}: ${e.message}`);
      }

      // Rate limit: 200ms cada 8 requests
      if ((total) % 8 === 0) await new Promise(r => setTimeout(r, 200));
    }

    console.log(`  offset=${start} | total=${total} | insertadas=${inserted} | dup=${duplicates} | sin_persona=${noPersona} | err=${errors}`);

    if (!data.additional_data?.pagination?.more_items_in_collection) break;
    start = data.additional_data.pagination.next_start;
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  console.log('\n=== RESULTADO FINAL ===');
  console.log(`  Total notas Pipedrive: ${total}`);
  console.log(`  Insertadas:            ${inserted}`);
  console.log(`  Duplicados:            ${duplicates}`);
  console.log(`  Sin persona asociada:  ${noPersona}`);
  console.log(`  Errores:               ${errors}`);
  console.log(`  Tiempo:                ${elapsed}s`);
  console.log(`  Cache: ${Object.keys(personaCache).length} personas, ${Object.keys(dealCache).length} deals, ${Object.keys(userCache).length} users`);

  await pool.end();
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
