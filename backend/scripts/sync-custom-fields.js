/**
 * Sincronizar campos custom de deals desde Pipedrive API
 * Para deals que no tienen datos en datos_extra
 * USO: node backend/scripts/sync-custom-fields.js [--status open|won|lost|all]
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { Pool } = require('pg');
const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : { host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASS }
);
const PD_KEY = process.env.PIPEDRIVE_API_KEY;

// Mapeo de keys Pipedrive → nombres de columna CRM
const DEAL_FIELD_MAP = {
  '3bbf1d7498851d89b0a1c8058bf63581284fd223': 'tipo_poliza',
  'e52a6275eab20be44e25ae4d0299c60d4d5f25b8': 'num_solicitud',
  '0becdaead32abfdda6eac11a73dc89b22760725f': 'poliza',
  '5618371c04237f61f24ef097b1038d9eec00d3df': 'precio_raw',
  'ccc79ae1430a738779b1458fca6c92a048523c31': 'fecha_efecto_raw',
  'bec5e85fc187a079508a772b11d07bb016f09365': 'frecuencia_pago',
  '96989616deb0d45af2c7ca9b4f3cb8690f1e1e21': 'iban',
  '15a955b1555b507810cd34a9a22d4b03506ed1a7': 'descuento',
  'b9a7a346963c4c6ebe2ecfc9f06a6a11ed581d03': 'num_asegurados_raw',
  '652b847100e1c92b57e7d4dc3c11373e9a23111e': 'observaciones',
};

const PERSONA_FIELD_MAP = {
  'ac4b5a68dd8017ad4e272a277acfa3900083ec2c': 'dni',
  '7be436a2ba6a9716faa8297f9217eb6a399fce7b': 'nombre_titular',
  'b6e5e600603abc4ef5fa0adada3afbb8e87f2af0': 'fecha_nacimiento',
  'f30ff90ede820fd3cbe38e0d3fabcd2b340a64ec': 'sexo',
  '4174ce87fa81673775d04dc415ece3df77bcdba9': 'direccion',
  '3df0724c19951d401cac42b4bc5b1b657eb36d50': 'codigo_postal',
  'af52237fd40a2dc8c6a872d9a3189c67396560a4': 'nacionalidad',
  '61f7204af03724e4c808716a449207cd13333983': 'estado_civil',
  '07d7e907e88f51d34f2bb8473e5400696df86399': 'tiene_seguro_salud',
  'e46bf986c93eb461393250899857b79896e0eb62': 'compania_actual',
  '59254e99faba7f7363e90a38cfe9bda47e868e56': 'provincia',
  '6c12cd4518ba4bc5b39d8a537ad1a656c8f7fcb4': 'poblacion',
};

function getVal(deal, key) {
  const v = deal[key];
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'object') return null;
  return String(v).trim();
}

async function main() {
  const statusArg = process.argv.find(a => a.startsWith('--status='))?.split('=')[1] || 'open';
  console.log(`Sincronizando campos custom para deals ${statusArg}...`);

  let start = 0, total = 0, dealsUpdated = 0, personasUpdated = 0, errors = 0;

  while (true) {
    const url = statusArg === 'all'
      ? `https://api.pipedrive.com/v1/deals?start=${start}&limit=500&api_token=${PD_KEY}`
      : `https://api.pipedrive.com/v1/deals?status=${statusArg}&start=${start}&limit=500&api_token=${PD_KEY}`;
    const r = await fetch(url);
    const data = await r.json();
    if (!data.success || !data.data) break;

    for (const d of data.data) {
      total++;
      try {
        // Extraer campos del deal
        const tipo_poliza = getVal(d, '3bbf1d7498851d89b0a1c8058bf63581284fd223');
        const num_solicitud = getVal(d, 'e52a6275eab20be44e25ae4d0299c60d4d5f25b8');
        const poliza = getVal(d, '0becdaead32abfdda6eac11a73dc89b22760725f');
        const precio = getVal(d, '5618371c04237f61f24ef097b1038d9eec00d3df');
        const efecto = getVal(d, 'ccc79ae1430a738779b1458fca6c92a048523c31');
        const freq = getVal(d, 'bec5e85fc187a079508a772b11d07bb016f09365');
        const iban = getVal(d, '96989616deb0d45af2c7ca9b4f3cb8690f1e1e21');
        const desc = getVal(d, '15a955b1555b507810cd34a9a22d4b03506ed1a7');
        const obs = getVal(d, '652b847100e1c92b57e7d4dc3c11373e9a23111e');

        if (tipo_poliza || num_solicitud || poliza || precio || iban) {
          const prima = precio ? parseFloat(String(precio).replace(',', '.').replace(/[^\d.]/g, '')) || null : null;
          await pool.query(
            `UPDATE deals SET
              tipo_poliza = COALESCE($1, tipo_poliza),
              num_solicitud = COALESCE($2, num_solicitud),
              poliza = COALESCE($3, poliza),
              prima = COALESCE($4, prima),
              frecuencia_pago = COALESCE($5, frecuencia_pago),
              iban = COALESCE($6, iban),
              descuento = COALESCE($7, descuento),
              observaciones = COALESCE($8, observaciones)
            WHERE pipedrive_id = $9`,
            [tipo_poliza, num_solicitud, poliza, prima, freq, iban, desc, obs, d.id]
          );
          dealsUpdated++;
        }

        // Extraer datos de persona
        const personPdId = typeof d.person_id === 'object' ? d.person_id?.value : d.person_id;
        if (personPdId) {
          const dni = getVal(d, 'ac4b5a68dd8017ad4e272a277acfa3900083ec2c');
          const fechaNac = getVal(d, 'b6e5e600603abc4ef5fa0adada3afbb8e87f2af0');
          const dir = getVal(d, '4174ce87fa81673775d04dc415ece3df77bcdba9');
          const cp = getVal(d, '3df0724c19951d401cac42b4bc5b1b657eb36d50');
          const nac = getVal(d, 'af52237fd40a2dc8c6a872d9a3189c67396560a4');

          if (dni || fechaNac || dir) {
            await pool.query(
              `UPDATE personas SET
                dni = COALESCE($1, dni),
                fecha_nacimiento = COALESCE($2::date, fecha_nacimiento),
                direccion = COALESCE($3, direccion),
                codigo_postal = COALESCE($4, codigo_postal),
                nacionalidad = COALESCE($5, nacionalidad)
              WHERE pipedrive_person_id = $6`,
              [dni?.toUpperCase(), fechaNac, dir, cp ? cp.substring(0, 20) : null, nac, personPdId]
            );
            personasUpdated++;
          }
        }
      } catch (e) { errors++; }
    }

    console.log(`  offset=${start} total=${total} deals=${dealsUpdated} personas=${personasUpdated} err=${errors}`);
    if (!data.additional_data?.pagination?.more_items_in_collection) break;
    start = data.additional_data.pagination.next_start;
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\nCompletado: ${total} deals, ${dealsUpdated} actualizados, ${personasUpdated} personas, ${errors} errores`);
  await pool.end();
}

main().catch(e => { console.error('Error:', e); process.exit(1); });
