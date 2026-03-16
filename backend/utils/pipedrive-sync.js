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

module.exports = { fetchAll, syncPersons, syncDeals, fullSync, DEAL_FIELDS, PERSON_FIELDS };
