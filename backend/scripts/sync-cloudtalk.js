/**
 * Sincronizar contactos CRM → CloudTalk (bulk)
 * USO: node backend/scripts/sync-cloudtalk.js
 * Rate limit: 60 req/min, max 10 contactos por request
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { Pool } = require('pg');
const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : { host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASS }
);

const CT_KEY = process.env.CLOUDTALK_API_KEY;
const CT_SECRET = process.env.CLOUDTALK_API_SECRET;

if (!CT_KEY || !CT_SECRET) {
  console.error('CLOUDTALK_API_KEY y CLOUDTALK_API_SECRET son obligatorias');
  process.exit(1);
}

const CT_AUTH = 'Basic ' + Buffer.from(CT_KEY + ':' + CT_SECRET).toString('base64');

const formatPhone = (tel) => {
  if (!tel) return null;
  tel = tel.replace(/\s/g, '').replace(/[^\d+]/g, '');
  if (tel.startsWith('+')) return tel;
  if (tel.startsWith('34')) return '+' + tel;
  if (tel.length >= 9) return '+34' + tel;
  return null;
};

async function sendBatch(contacts) {
  // CloudTalk bulk contacts endpoint
  const r = await fetch('https://api.cloudtalk.io/api/contacts/bulk.json', {
    method: 'POST',
    headers: { Authorization: CT_AUTH, 'Content-Type': 'application/json' },
    body: JSON.stringify({ contacts })
  });
  return r.json();
}

async function main() {
  console.log('Sincronizando contactos CRM → CloudTalk...');

  // Leer contactos con teléfono válido
  const result = await pool.query(
    `SELECT id, nombre, telefono, email FROM personas
     WHERE telefono IS NOT NULL AND telefono != ''
     ORDER BY id`
  );

  const personas = result.rows;
  console.log(`Total contactos con teléfono: ${personas.length}`);

  let sent = 0, errors = 0, skipped = 0;
  const BATCH = 10;

  for (let i = 0; i < personas.length; i += BATCH) {
    const batch = personas.slice(i, i + BATCH);
    const contacts = batch.map(p => {
      const phone = formatPhone(p.telefono);
      if (!phone) return null;
      return {
        name: (p.nombre || '').trim() || 'Sin nombre',
        phone,
        email: p.email || undefined,
        custom_fields: { crm_id: String(p.id) }
      };
    }).filter(Boolean);

    if (contacts.length === 0) { skipped += batch.length; continue; }

    try {
      const res = await sendBatch(contacts);
      if (res.responseData?.status === 200 || res.success) {
        sent += contacts.length;
      } else {
        console.warn(`  Batch ${i}: error:`, JSON.stringify(res).substring(0, 200));
        errors += contacts.length;
      }
    } catch (e) {
      errors += contacts.length;
    }

    if ((i / BATCH) % 50 === 0 && i > 0) {
      console.log(`  Progreso: ${i}/${personas.length} | enviados=${sent} errores=${errors} saltados=${skipped}`);
    }

    // Rate limit: 1 req/segundo (60/min)
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\nCompletado: ${sent} enviados, ${errors} errores, ${skipped} saltados`);
  await pool.end();
}

main().catch(e => { console.error('Error:', e); process.exit(1); });
