/**
 * Pipedrive Sync — utilidades para importar personas y deals
 */
const pool = require('../config/db');

const API_TOKEN = process.env.PIPEDRIVE_API_KEY;
const BASE_URL = 'https://api.pipedrive.com/v1';

// Campos personalizados de Pipedrive (mapeados desde dealFields y personFields)
const DEAL_FIELDS = {
  dni:             'ac4b5a68dd8017ad4e272a277acfa3900083ec2c',
  nombre_titular:  '7be436a2ba6a9716faa8297f9217eb6a399fce7b',
  fecha_nac:       'b6e5e600603abc4ef5fa0adada3afbb8e87f2af0',
  sexo:            'f30ff90ede820fd3cbe38e0d3fabcd2b340a64ec',
  provincia:       '59254e99faba7f7363e90a38cfe9bda47e868e56',
  poblacion:       '6c12cd4518ba4bc5b39d8a537ad1a656c8f7fcb4',
  direccion:       '4174ce87fa81673775d04dc415ece3df77bcdba9',
  cod_postal:      '3df0724c19951d401cac42b4bc5b1b657eb36d50',
  freq_pago:       'bec5e85fc187a079508a772b11d07bb016f09365',
  iban:            '96989616deb0d45af2c7ca9b4f3cb8690f1e1e21',
  estado_civil:    '61f7204af03724e4c808716a449207cd13333983',
  nacionalidad:    'af52237fd40a2dc8c6a872d9a3189c67396560a4',
  tipo_poliza:     '3bbf1d7498851d89b0a1c8058bf63581284fd223',
  n_solicitud:     'e52a6275eab20be44e25ae4d0299c60d4d5f25b8',
  poliza:          '0becdaead32abfdda6eac11a73dc89b22760725f',
  n_asegurados:    'b9a7a346963c4c6ebe2ecfc9f06a6a11ed581d03',
  precio:          '5618371c04237f61f24ef097b1038d9eec00d3df',
  descuento:       '15a955b1555b507810cd34a9a22d4b03506ed1a7',
  efecto:          'ccc79ae1430a738779b1458fca6c92a048523c31',
  etiqueta:        '4363500d82f493e99534054e26dbebd7cd15d445',
  campana_fb:      'c8fbebd78f50513852c00ab3686edb8dfca3d536',
  comision:        'e40123ad99d0f954e88b43f3c90964a7f09462a5',
  nombre_anuncio:  'd53398324c87d5bcb636317791a39e9eb367ea98',
  plataforma:      '7ec3412d66ed7858fe73444f426c6c9cf18672f2',
  ad_id:           '75b0af7a051f49a2fee51f27a830fbc2484b5b06',
  observaciones:   '652b847100e1c92b57e7d4dc3c11373e9a23111e',
};

const PERSON_FIELDS = {
  dni:        '303a6637a70e700bd62969e13422e9b56a7a580f',
  dni_alt:    'fd6a652732bb68b2bfd6af0865f213cba5585d1a',
  fecha_nac:  '4998e149210abdb567698f83129f15f4e0fabfbd',
  sexo:       '196d1c1f08378911e979bb4f45b0568fbafab636',
  provincia:  'b752d1c165962221b241c19714c9a64247d618ea',
};

// Fetch paginado de Pipedrive
async function fetchAll(endpoint, params = {}) {
  const results = [];
  let start = 0;
  const limit = 100;

  while (true) {
    const url = new URL(`${BASE_URL}/${endpoint}`);
    url.searchParams.set('api_token', API_TOKEN);
    url.searchParams.set('start', start);
    url.searchParams.set('limit', limit);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }

    const res = await fetch(url.toString());
    const data = await res.json();

    if (!data.success || !data.data) break;

    results.push(...data.data);
    const pagination = data.additional_data?.pagination;
    if (!pagination?.more_items_in_collection) break;
    start = pagination.next_start;
  }

  return results;
}

// Fetch stages para mapear nombres
async function fetchStages() {
  const url = `${BASE_URL}/stages?api_token=${API_TOKEN}`;
  const res = await fetch(url);
  const data = await res.json();
  const map = {};
  if (data.data) {
    data.data.forEach((s) => { map[s.id] = s.name; });
  }
  return map;
}

// Fetch users de Pipedrive para mapear owners
async function fetchPipedriveUsers() {
  const url = `${BASE_URL}/users?api_token=${API_TOKEN}`;
  const res = await fetch(url);
  const data = await res.json();
  const map = {};
  if (data.data) {
    data.data.forEach((u) => { map[u.id] = u.name; });
  }
  return map;
}

// Extraer valor de campo Pipedrive
function getField(obj, key) {
  const val = obj[key];
  if (val === null || val === undefined || val === '') return null;
  // Enum fields devuelven el ID numérico, pero a veces el label
  if (typeof val === 'object' && val !== null) return null;
  return String(val).trim();
}

function getEmail(emailArr) {
  if (!emailArr || !Array.isArray(emailArr)) return null;
  const primary = emailArr.find((e) => e.primary) || emailArr[0];
  return primary?.value || null;
}

function getPhone(phoneArr) {
  if (!phoneArr || !Array.isArray(phoneArr)) return null;
  const primary = phoneArr.find((p) => p.primary) || phoneArr[0];
  return primary?.value || null;
}

// =============================================
// SYNC PERSONAS
// =============================================
async function syncPersons() {
  console.log('Importando personas de Pipedrive...');
  const persons = await fetchAll('persons');
  console.log(`${persons.length} personas encontradas.`);

  let imported = 0, updated = 0, errors = 0;

  for (const p of persons) {
    try {
      const pipedriveId = p.id;
      const name = p.name || '';
      const email = getEmail(p.email) || null;
      const phone = getPhone(p.phone) || null;
      const dni = getField(p, PERSON_FIELDS.dni) || getField(p, PERSON_FIELDS.dni_alt) || null;

      // Buscar si ya existe por pipedrive_id
      const existing = await pool.query(
        'SELECT id FROM personas WHERE pipedrive_person_id = $1',
        [pipedriveId]
      );

      if (existing.rows.length > 0) {
        // Actualizar
        await pool.query(
          `UPDATE personas SET nombre = $1, email = $2, telefono = $3, dni = COALESCE($4, dni), updated_at = CURRENT_TIMESTAMP
           WHERE pipedrive_person_id = $5`,
          [name, email, phone, dni, pipedriveId]
        );
        updated++;
      } else {
        // Intentar match por DNI si lo tiene
        let matchId = null;
        if (dni) {
          const dniMatch = await pool.query('SELECT id FROM personas WHERE dni = $1', [dni.toUpperCase()]);
          if (dniMatch.rows.length > 0) {
            matchId = dniMatch.rows[0].id;
            await pool.query(
              `UPDATE personas SET pipedrive_person_id = $1, nombre = $2, email = COALESCE($3, email), telefono = COALESCE($4, telefono), updated_at = CURRENT_TIMESTAMP
               WHERE id = $5`,
              [pipedriveId, name, email, phone, matchId]
            );
            updated++;
            continue;
          }
        }

        // Insertar nuevo
        await pool.query(
          `INSERT INTO personas (pipedrive_person_id, nombre, email, telefono, dni)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (pipedrive_person_id) DO NOTHING`,
          [pipedriveId, name, email, phone, dni ? dni.toUpperCase() : null]
        );
        imported++;
      }
    } catch (err) {
      console.error(`  Error persona ${p.id}: ${err.message}`);
      errors++;
    }
  }

  return { total: persons.length, imported, updated, errors };
}

// =============================================
// SYNC DEALS
// =============================================
async function syncDeals() {
  console.log('Importando deals de Pipedrive...');
  const [deals, stageMap, userMap] = await Promise.all([
    fetchAll('deals'),
    fetchStages(),
    fetchPipedriveUsers(),
  ]);
  console.log(`${deals.length} deals encontrados.`);

  let imported = 0, updated = 0, errors = 0;

  for (const d of deals) {
    try {
      const pipedriveId = d.id;
      const title = d.title || '';
      const status = d.status || 'open';
      const stageName = stageMap[d.stage_id] || '';
      const ownerName = userMap[d.user_id?.id || d.user_id] || '';
      const personPipedriveId = typeof d.person_id === 'object' ? d.person_id?.value : d.person_id;
      const value = d.value || 0;
      const addTime = d.add_time || null;

      // Campos personalizados del deal
      const poliza = getField(d, DEAL_FIELDS.poliza);
      const producto = getField(d, DEAL_FIELDS.etiqueta) || getField(d, DEAL_FIELDS.tipo_poliza) || title;
      const precio = getField(d, DEAL_FIELDS.precio);
      const prima = precio ? parseFloat(String(precio).replace(',', '.').replace(/[^\d.]/g, '')) || value : value;
      const efectoRaw = getField(d, DEAL_FIELDS.efecto);
      let efecto = null;
      if (efectoRaw) {
        const parsed = new Date(efectoRaw);
        if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1900) efecto = efectoRaw;
      }
      const dniDeal = getField(d, DEAL_FIELDS.dni);

      // Buscar persona en nuestro CRM
      let personaId = null;
      if (personPipedriveId) {
        const pRes = await pool.query('SELECT id FROM personas WHERE pipedrive_person_id = $1', [personPipedriveId]);
        if (pRes.rows.length > 0) personaId = pRes.rows[0].id;
      }

      // Mapear status Pipedrive → estado CRM
      let estado = 'activo';
      if (status === 'won') estado = 'poliza_activa';
      else if (status === 'lost') estado = 'perdido';
      else if (status === 'open') estado = 'en_tramite';

      // Guardar todos los campos custom como JSON
      const datosExtra = {};
      for (const [nombre, key] of Object.entries(DEAL_FIELDS)) {
        const val = getField(d, key);
        if (val) datosExtra[nombre] = val;
      }

      // Buscar si ya existe
      const existing = await pool.query('SELECT id FROM deals WHERE pipedrive_id = $1', [pipedriveId]);

      if (existing.rows.length > 0) {
        await pool.query(
          `UPDATE deals SET persona_id = COALESCE($1, persona_id), poliza = COALESCE($2, poliza),
           producto = $3, prima = $4, estado = $5, pipedrive_stage = $6, pipedrive_status = $7,
           pipedrive_owner = $8, datos_extra = $9, updated_at = CURRENT_TIMESTAMP
           WHERE pipedrive_id = $10`,
          [personaId, poliza, producto, prima, estado, stageName, status, ownerName,
           JSON.stringify(datosExtra), pipedriveId]
        );
        updated++;
      } else {
        await pool.query(
          `INSERT INTO deals (pipedrive_id, persona_id, poliza, producto, prima, fecha_efecto,
           estado, fuente, pipedrive_stage, pipedrive_status, pipedrive_owner, datos_extra)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [pipedriveId, personaId, poliza, producto, prima,
           efecto ? new Date(efecto) : (addTime ? new Date(addTime) : null),
           estado, 'pipedrive', stageName, status, ownerName, JSON.stringify(datosExtra)]
        );
        imported++;
      }
    } catch (err) {
      console.error(`  Error deal ${d.id}: ${err.message}`);
      errors++;
    }
  }

  return { total: deals.length, imported, updated, errors };
}

// =============================================
// SYNC COMPLETO
// =============================================
async function fullSync() {
  console.log('=== Sincronización completa con Pipedrive ===\n');
  const personResult = await syncPersons();
  console.log(`\nPersonas: ${personResult.imported} nuevas, ${personResult.updated} actualizadas, ${personResult.errors} errores\n`);

  const dealResult = await syncDeals();
  console.log(`\nDeals: ${dealResult.imported} nuevos, ${dealResult.updated} actualizados, ${dealResult.errors} errores\n`);

  // Guardar log
  await pool.query(
    `INSERT INTO pipedrive_sync_logs (tipo, personas_importadas, personas_actualizadas, deals_importados, deals_actualizados, errores, detalle)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    ['full_sync', personResult.imported, personResult.updated,
     dealResult.imported, dealResult.updated,
     personResult.errors + dealResult.errors,
     JSON.stringify({ persons: personResult, deals: dealResult })]
  );

  return { persons: personResult, deals: dealResult };
}

// Enum maps de Pipedrive
const PROVINCIA_MAP = {147:'Álava',148:'Albacete',149:'Alicante',150:'Almería',151:'Asturias',152:'Ávila',153:'Badajoz',154:'Baleares',155:'Barcelona',156:'Burgos',157:'Cáceres',158:'Cádiz',159:'Cantabria',160:'Castellón',161:'Ceuta',162:'Ciudad Real',163:'Córdoba',164:'Cuenca',165:'Girona',166:'Granada',167:'Guadalajara',168:'Guipúzcoa',169:'Huelva',170:'Huesca',171:'Jaén',172:'La Coruña',173:'La Rioja',174:'Las Palmas',175:'León',176:'Lleida',177:'Lugo',178:'Madrid',179:'Málaga',180:'Melilla',181:'Murcia',182:'Navarra',183:'Ourense',184:'Palencia',185:'Pontevedra',186:'Salamanca',187:'Santa Cruz de Tenerife',188:'Segovia',189:'Sevilla',190:'Soria',191:'Tarragona',192:'Teruel',193:'Toledo',194:'Valencia',195:'Valladolid',196:'Vizcaya',197:'Zamora',198:'Zaragoza'};
const SEXO_MAP = {114:'H',115:'M',116:'Otro'};
const SEXO_ASEG_MAP = {275:'H',276:'M'};
const PARENTESCO_MAP = {110:'Titular',111:'Cónyuge',112:'Hijo/a',113:'Otro',306:'Cónyuge',307:'Hijo/a',308:'Hermano/a',309:'Abuelo/a',310:'Otra familia',311:'Otra'};
const FREQ_PAGO_MAP = {297:'MENSUAL',298:'TRIMESTRAL',299:'SEMESTRAL',300:'ANUAL'};

// Keys de asegurados 2-12
const ASEG_KEYS = [
  { n: 2, nombre: '2e833616277d6c808d7ed3603bd3f04afd3609d8', fecha: '5b539de7f25c08c9417808f0a733dcb04a707c2b', dni: 'a52d24d9c6544caddbb21654f8c8ce590257cbab', parentesco: '701dc45d154ab9c8a3c08169b6a0c2fe5b5da9cc', sexo: '2aa3a827d0f43414e25d304143f1e22024a71cf5' },
  { n: 3, nombre: 'f88ec3af15607b52a5bdf445fc9bd8d97cef67b8', fecha: '4c3e7be32af9c49f65115ac32458f020f87abe95', dni: '4df61a56d4d899081602208a2ee672ff1c352f94', parentesco: 'a17389a87869a3fda1f0823912c559958df58859', sexo: '443faf06fdcba03275f07684fcd4d50347ed8bca' },
  { n: 4, nombre: '280d8343abffec7ca1e6aafb940f61a2b46ef80a', fecha: '4faca26aa6ce50bbb0e7a018d1465f40db7348ec', dni: '0bb2899158279832e32f98cb21da2093ab3230d4', parentesco: '51c134224255000caf5abde7d72696527831006c', sexo: '9608f329edbbad01da633e5ffca2715e75a6d3d3' },
  { n: 5, nombre: '168af5c31afff939aa5314d28b02264189318bda', fecha: 'cb7bf6cda9ce92d58dab81362e140dc88e7adee6', dni: '3b44f3516911d8f62879da920477eb9105ce5101', parentesco: '104e08246e9356d4a5f1d693992e8b9146585e48', sexo: '9eb820b9a9eeb39e7eee7731d03f436c82eb342e' },
  { n: 6, nombre: '8864a8cd8dd30c1dd6a9b5094f865edd309ee971', fecha: 'd8e0cff68f0a054ef94518d06670786ae89b259b', dni: '584fd4a1af91998cab077ba221b695a0bc44cfdf', parentesco: 'c177bb9b600f3489ad846dd5c95552dea68c24a7', sexo: '1f6d1e3f505172c97797bb71ce54bc7b75b6a250' },
  { n: 7, nombre: 'b962fa7a0f550efca6efb95f4b2df071491855b1', fecha: 'cd7a3694b77a3d98edfbed9cfca6d29f1470a68f', dni: 'd15181a25f5fe0d022cb758ddf0bb0dce75bcbf4', parentesco: 'c1dcd253b93c5cae2b188d0858418c53a1548081', sexo: '007b3e4dc7377091d101cd0ba7566e51d4c268ec' },
  { n: 8, nombre: 'a269807d90f3390282e8c684728d8914fb0b5c76', fecha: 'ce5ba7401dc24812d1c06337b4223d79883b9b5a', dni: '4c2d05767cac56e3e7a36495634fa99bf317cd77', parentesco: '7ad405d0033f87e54ab06c0ed33be992badd9edf', sexo: '0c0f8813822d10e48da49bc0dbd48ed025e3d355' },
  { n: 9, nombre: '7aec7960abb01d016e5285d23a3cff69d1fd5834', fecha: '91d398b8fc89aa9a469f962ac3730617b898d2d7', dni: '82a07af17b1a2032e969ca8945c7419e3f3ad54b', parentesco: 'afcacd4f2691279fae88c765f51bb7d0eada54a9', sexo: '40bd14d2bf21def6ff1a0adcbfa8b7ba0eebfa1f' },
  { n: 10, nombre: '8ab7bbf3d22e06d1bff14b63f41da94f71f0f3e3', fecha: 'cfceacc4062b165c62bf3b804f14664264970168', dni: '95b35c31f6266c137bdefdadab44887d439fb06b', parentesco: '8ee8ce964b517a0df49084db8d2336e54a32c37b', sexo: '4ef7fb408d1198b9413e91c73d27b2c04cf14c32' },
  { n: 11, nombre: 'ea4d8a1a66c36b4b1f7b9f672ac79538c9f4da5c', fecha: 'f380f6df390a61967082945115412498acbb63f9', dni: 'af5ca2305d55f7272635ee75c4b2297cc718e092', parentesco: '3e45007376d178607e6ca8c243675723d78a249b', sexo: 'fad4e3ef898234b70fffcdd696572604545a051b' },
  { n: 12, nombre: '01a376237efefb65a127835e7958ee97227d2770', fecha: 'e24472feb836b489962831d00738b1c7534363db', dni: 'aef301a8c911c9f55365369688d6b16f9cbe16a5', parentesco: 'ac52dcfaa87c961e2dd997e2fb94bd3bf83c0f22', sexo: '9f9f2b7d67e9d6ed70bdddf43159427ed58478dd' },
];

module.exports = {
  fetchAll, syncPersons, syncDeals, fullSync,
  DEAL_FIELDS, PERSON_FIELDS,
  PROVINCIA_MAP, SEXO_MAP, SEXO_ASEG_MAP, PARENTESCO_MAP, FREQ_PAGO_MAP, ASEG_KEYS,
  getField, getEmail, getPhone,
};
