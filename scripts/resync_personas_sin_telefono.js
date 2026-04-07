require('dotenv').config({ path: '/var/www/gestavly/.env' });
const https = require('https');
const pool = require('/var/www/gestavly/backend/config/db');

const PD_TOKEN = process.env.PIPEDRIVE_API_KEY;

function pdGet(path) {
  return new Promise((resolve, reject) => {
    https.request({
      hostname: 'api.pipedrive.com',
      path: path + (path.includes('?') ? '&' : '?') + 'api_token=' + PD_TOKEN
    }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject).end();
  });
}

function getPhone(arr) {
  if (!arr) return null;
  if (!Array.isArray(arr)) return arr?.value || (typeof arr === 'string' ? arr : null);
  const p = arr.find(e => e.primary) || arr[0];
  return p?.value || null;
}

function getEmail(arr) {
  if (!arr) return null;
  if (!Array.isArray(arr)) return arr?.value || (typeof arr === 'string' ? arr : null);
  const p = arr.find(e => e.primary) || arr[0];
  return p?.value || null;
}

async function main() {
  // Obtener personas sin teléfono creadas en los últimos 10 días
  const { rows } = await pool.query(`
    SELECT id, pipedrive_person_id, nombre, telefono, email
    FROM personas
    WHERE (telefono IS NULL OR email IS NULL)
    AND created_at > NOW() - INTERVAL '10 days'
    AND pipedrive_person_id IS NOT NULL
    ORDER BY created_at DESC
  `);

  console.log(`Personas a resincronizar: ${rows.length}`);
  let actualizadas = 0, errores = 0;

  for (const persona of rows) {
    try {
      const data = await pdGet(`/v1/persons/${persona.pipedrive_person_id}`);
      const p = data.data;
      if (!p) { errores++; continue; }

      const phone = getPhone(p.phone);
      const email = getEmail(p.email);

      await pool.query(`
        UPDATE personas SET
          telefono = COALESCE($1, telefono),
          email = COALESCE($2, email),
          updated_at = NOW()
        WHERE id = $3
      `, [phone, email, persona.id]);

      actualizadas++;
      if (actualizadas % 10 === 0) {
        console.log(`✅ ${actualizadas}/${rows.length} | ${p.name} | tel:${phone} | email:${email}`);
      }

      await new Promise(r => setTimeout(r, 200)); // Rate limit Pipedrive
    } catch(e) {
      console.log(`❌ ${persona.nombre}: ${e.message}`);
      errores++;
    }
  }

  console.log(`\nCompletado: ${actualizadas} actualizadas, ${errores} errores`);
  await pool.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
