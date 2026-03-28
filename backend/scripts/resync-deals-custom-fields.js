/**
 * Resincronización de campos custom Pipedrive → CRM
 * Actualiza: personas (titular), propuestas, asegurados, deals
 */
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
}
const pool = require('../config/db');
const { DEAL_FIELDS } = require('../utils/pipedrive-sync');

const API_TOKEN = process.env.PIPEDRIVE_API_KEY;
const BASE_URL = 'https://api.pipedrive.com/v1';

// Enum maps de Pipedrive (obtenidos de dealFields API)
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

function getVal(obj, key) {
  const v = obj[key];
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'object') return null;
  return String(v).trim();
}

function parsePrecio(raw) {
  if (!raw) return null;
  const n = parseFloat(String(raw).replace(',', '.').replace(/[^\d.]/g, ''));
  return isNaN(n) ? null : n;
}

function parsePuntos(raw) {
  if (!raw) return null;
  const m = String(raw).match(/(\d+)/);
  return m ? parseInt(m[1]) : null;
}

function parseDate(raw) {
  if (!raw) return null;
  // Solo aceptar formato ISO (YYYY-MM-DD) o similar — rechazar texto libre
  if (!/^\d{4}-\d{2}-\d{2}/.test(String(raw))) return null;
  const d = new Date(raw);
  return (!isNaN(d.getTime()) && d.getFullYear() > 1900) ? raw : null;
}

async function fetchAllDeals(status = 'open') {
  let all = [];
  let start = 0;
  while (true) {
    const url = `${BASE_URL}/deals?status=${status}&start=${start}&limit=500&api_token=${API_TOKEN}`;
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

async function processDeal(deal) {
  const stats = { persona: 0, propuesta: 0, asegurados: 0, deal: 0 };

  const personPdId = typeof deal.person_id === 'object' ? deal.person_id?.value : deal.person_id;
  if (!personPdId) return stats;

  const pRes = await pool.query('SELECT id FROM personas WHERE pipedrive_person_id = $1', [personPdId]);
  if (!pRes.rows.length) return stats;
  const personaId = pRes.rows[0].id;

  // Buscar deal local
  const dRes = await pool.query('SELECT id FROM deals WHERE pipedrive_id = $1', [deal.id]);
  const dealLocalId = dRes.rows[0]?.id || null;

  // --- A) Actualizar persona con datos del titular ---
  const nombre = getVal(deal, DEAL_FIELDS.nombre_titular);
  const fechaNac = parseDate(getVal(deal, DEAL_FIELDS.fecha_nac));
  const sexoId = getVal(deal, DEAL_FIELDS.sexo);
  const sexo = sexoId ? (SEXO_MAP[sexoId] || null) : null;
  const nacionalidad = getVal(deal, DEAL_FIELDS.nacionalidad);
  const direccion = getVal(deal, DEAL_FIELDS.direccion);
  const localidad = getVal(deal, DEAL_FIELDS.poblacion);
  const provId = getVal(deal, DEAL_FIELDS.provincia);
  const provincia = provId ? (PROVINCIA_MAP[provId] || null) : null;
  const cp = getVal(deal, DEAL_FIELDS.cod_postal);
  const dni = getVal(deal, DEAL_FIELDS.dni);

  if (nombre || fechaNac || dni || direccion || provincia) {
    await pool.query(
      `UPDATE personas SET
        nombre = COALESCE($1, nombre),
        fecha_nacimiento = COALESCE($2::date, fecha_nacimiento),
        sexo = COALESCE($3, sexo),
        nacionalidad = COALESCE($4, nacionalidad),
        direccion = COALESCE($5, direccion),
        localidad = COALESCE($6, localidad),
        provincia = COALESCE($7, provincia),
        codigo_postal = COALESCE($8, codigo_postal),
        dni = COALESCE($9, dni),
        updated_at = NOW()
      WHERE id = $10`,
      [nombre, fechaNac, sexo, nacionalidad, direccion, localidad, provincia, cp, dni?.toUpperCase(), personaId]
    );
    stats.persona = 1;
  }

  // --- B) Guardar/actualizar propuesta ---
  const tipoPoliza = getVal(deal, DEAL_FIELDS.tipo_poliza);
  const precio = parsePrecio(getVal(deal, DEAL_FIELDS.precio));
  const iban = getVal(deal, DEAL_FIELDS.iban);
  const numPoliza = getVal(deal, DEAL_FIELDS.poliza);
  const numSolicitud = getVal(deal, DEAL_FIELDS.n_solicitud);
  const fechaEfecto = parseDate(getVal(deal, DEAL_FIELDS.efecto));
  const puntos = parsePuntos(getVal(deal, DEAL_FIELDS.descuento));
  const nAseg = parseInt(getVal(deal, DEAL_FIELDS.n_asegurados)) || null;
  const freqId = getVal(deal, DEAL_FIELDS.freq_pago);
  const formaPago = freqId ? (FREQ_PAGO_MAP[freqId] || null) : null;

  if (dealLocalId && (tipoPoliza || precio)) {
    await pool.query(
      `INSERT INTO propuestas (persona_id, deal_id, pipedrive_deal_id, producto, prima_mensual, fecha_efecto, campana_puntos, num_asegurados, forma_pago)
       VALUES ($1, $2, $3, COALESCE($4, 'Sin especificar'), $5, $6::date, $7, $8, $9)
       ON CONFLICT (deal_id) WHERE deal_id IS NOT NULL DO UPDATE SET
         producto = COALESCE(EXCLUDED.producto, propuestas.producto),
         prima_mensual = COALESCE(EXCLUDED.prima_mensual, propuestas.prima_mensual),
         fecha_efecto = COALESCE(EXCLUDED.fecha_efecto, propuestas.fecha_efecto),
         campana_puntos = COALESCE(EXCLUDED.campana_puntos, propuestas.campana_puntos),
         num_asegurados = COALESCE(EXCLUDED.num_asegurados, propuestas.num_asegurados),
         forma_pago = COALESCE(EXCLUDED.forma_pago, propuestas.forma_pago)`,
      [personaId, dealLocalId, deal.id, tipoPoliza, precio, fechaEfecto, puntos, nAseg, formaPago]
    );
    stats.propuesta = 1;
  }

  // --- C) Guardar asegurados ---
  // Titular como asegurado 1
  if (nombre && personaId) {
    await pool.query(
      `INSERT INTO asegurados (persona_id, deal_id, nombre, dni, fecha_nacimiento, sexo, parentesco, orden)
       VALUES ($1, $2, $3, $4, $5::date, $6, 'Titular', 1)
       ON CONFLICT (persona_id, nombre) DO UPDATE SET
         dni = COALESCE(EXCLUDED.dni, asegurados.dni),
         fecha_nacimiento = COALESCE(EXCLUDED.fecha_nacimiento, asegurados.fecha_nacimiento),
         sexo = COALESCE(EXCLUDED.sexo, asegurados.sexo)`,
      [personaId, dealLocalId, nombre, dni?.toUpperCase(), fechaNac, sexo]
    );
    stats.asegurados++;
  }

  // Asegurados 2-12
  for (const ak of ASEG_KEYS) {
    const aNombre = getVal(deal, ak.nombre);
    if (!aNombre) continue;
    const aFecha = parseDate(getVal(deal, ak.fecha));
    const aDni = getVal(deal, ak.dni);
    const aSexoId = getVal(deal, ak.sexo);
    const aSexo = aSexoId ? (SEXO_ASEG_MAP[aSexoId] || SEXO_MAP[aSexoId] || null) : null;
    const aParId = getVal(deal, ak.parentesco);
    const aParentesco = aParId ? (PARENTESCO_MAP[aParId] || null) : null;

    await pool.query(
      `INSERT INTO asegurados (persona_id, deal_id, nombre, dni, fecha_nacimiento, sexo, parentesco, orden)
       VALUES ($1, $2, $3, $4, $5::date, $6, $7, $8)
       ON CONFLICT (persona_id, nombre) DO UPDATE SET
         dni = COALESCE(EXCLUDED.dni, asegurados.dni),
         fecha_nacimiento = COALESCE(EXCLUDED.fecha_nacimiento, asegurados.fecha_nacimiento),
         sexo = COALESCE(EXCLUDED.sexo, asegurados.sexo),
         parentesco = COALESCE(EXCLUDED.parentesco, asegurados.parentesco)`,
      [personaId, dealLocalId, aNombre, aDni?.toUpperCase(), aFecha, aSexo, aParentesco, ak.n]
    );
    stats.asegurados++;
  }

  // --- D) Actualizar deal con datos de póliza ---
  if (dealLocalId && (precio || tipoPoliza)) {
    await pool.query(
      `UPDATE deals SET
        prima = COALESCE($1, prima),
        tipo_poliza = COALESCE($2, tipo_poliza),
        iban = COALESCE($3, iban),
        num_solicitud = COALESCE($4, num_solicitud),
        fecha_efecto = COALESCE($5::date, fecha_efecto),
        num_asegurados = COALESCE($6, num_asegurados),
        frecuencia_pago = COALESCE($7, frecuencia_pago),
        updated_at = NOW()
      WHERE id = $8`,
      [precio, tipoPoliza, iban, numSolicitud, fechaEfecto, nAseg, formaPago, dealLocalId]
    );
    stats.deal = 1;
  }

  return stats;
}

async function run() {
  console.log('=== Resync campos custom Pipedrive → CRM ===\n');

  console.log('Leyendo deals abiertos...');
  const openDeals = await fetchAllDeals('open');
  console.log('Leyendo deals ganados...');
  const wonDeals = await fetchAllDeals('won');
  const allDeals = [...openDeals, ...wonDeals];
  console.log(`\nTotal deals a procesar: ${allDeals.length}\n`);

  let personas = 0, propuestas = 0, asegurados = 0, deals = 0, errors = 0;

  for (let i = 0; i < allDeals.length; i++) {
    try {
      const s = await processDeal(allDeals[i]);
      personas += s.persona;
      propuestas += s.propuesta;
      asegurados += s.asegurados;
      deals += s.deal;
      if ((i + 1) % 500 === 0) console.log(`  Procesados ${i + 1}/${allDeals.length}...`);
    } catch (err) {
      errors++;
      if (errors <= 10) console.error(`Error deal #${allDeals[i].id}: ${err.message}`);
    }
  }

  console.log('\n=== RESUMEN ===');
  console.log(`Total deals procesados:    ${allDeals.length}`);
  console.log(`Personas actualizadas:     ${personas}`);
  console.log(`Propuestas creadas/upd:    ${propuestas}`);
  console.log(`Asegurados guardados:      ${asegurados}`);
  console.log(`Deals actualizados:        ${deals}`);
  console.log(`Errores:                   ${errors}`);
  console.log('===============\n');

  process.exit(0);
}

run().catch(err => { console.error('Error fatal:', err); process.exit(1); });
