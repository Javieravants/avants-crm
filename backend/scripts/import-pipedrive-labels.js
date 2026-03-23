/**
 * Importar labels (etiquetas) de Pipedrive → tabla etiquetas + deal_etiquetas
 *
 * Uso: node backend/scripts/import-pipedrive-labels.js
 *
 * Lee el campo "label" de todos los deals en Pipedrive,
 * crea las etiquetas únicas y las vincula a los deals en el CRM.
 */
require('dotenv').config();
const pool = require('../config/db');

const API_TOKEN = process.env.PIPEDRIVE_API_KEY;
const BASE_URL = 'https://api.pipedrive.com/v1';

async function fetchPaginated(endpoint, params = {}) {
  const results = [];
  let start = 0;
  while (true) {
    const url = new URL(`${BASE_URL}/${endpoint}`);
    url.searchParams.set('api_token', API_TOKEN);
    url.searchParams.set('start', start);
    url.searchParams.set('limit', 500);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

    const res = await fetch(url.toString());
    const data = await res.json();
    if (!data.success || !data.data) break;
    results.push(...data.data);
    if (!data.additional_data?.pagination?.more_items_in_collection) break;
    start = data.additional_data.pagination.next_start;
  }
  return results;
}

async function importLabels() {
  console.log('=== Importando labels de Pipedrive ===\n');

  // 1. Obtener dealFields para encontrar el campo "label"
  const fieldsUrl = `${BASE_URL}/dealFields?api_token=${API_TOKEN}`;
  const fieldsRes = await fetch(fieldsUrl);
  const fieldsData = await fieldsRes.json();

  // El campo label en Pipedrive es especial — tiene opciones predefinidas
  const labelField = fieldsData.data?.find(f => f.key === 'label');
  const labelOptions = {};
  if (labelField?.options) {
    labelField.options.forEach(opt => {
      labelOptions[opt.id] = { name: opt.label, color: opt.color || '#009DDD' };
    });
    console.log(`Labels encontradas en Pipedrive: ${Object.keys(labelOptions).length}`);
    Object.entries(labelOptions).forEach(([id, l]) => console.log(`  [${id}] ${l.name} (${l.color})`));
  } else {
    console.log('No se encontró campo "label" con opciones en dealFields.');
  }

  // 2. Colores de Pipedrive → hex
  const colorMap = {
    green: '#10b981', blue: '#009DDD', red: '#ef4444', yellow: '#f59e0b',
    purple: '#8b5cf6', gray: '#94a3b8', orange: '#f97316', pink: '#ec4899',
    cyan: '#06b6d4', white: '#e8edf2'
  };

  // 3. Crear etiquetas en BD
  const etiquetaMap = {}; // pipedrive_label_id → etiqueta.id
  for (const [pdId, label] of Object.entries(labelOptions)) {
    const hexColor = colorMap[label.color] || label.color || '#009DDD';
    const { rows } = await pool.query(
      `INSERT INTO etiquetas (nombre, color, origen)
       VALUES ($1, $2, 'pipedrive')
       ON CONFLICT (tenant_id, nombre) DO UPDATE SET color = $2
       RETURNING id`,
      [label.name, hexColor]
    );
    etiquetaMap[pdId] = rows[0].id;
    console.log(`  Etiqueta "${label.name}" → id=${rows[0].id}`);
  }

  // 4. Leer todos los deals y vincular etiquetas
  console.log('\nLeyendo deals de Pipedrive...');
  let linked = 0, notFound = 0;

  for (const status of ['open', 'won', 'lost']) {
    const deals = await fetchPaginated('deals', { status });
    console.log(`  ${status}: ${deals.length} deals`);

    for (const d of deals) {
      const labelId = d.label;
      if (!labelId || !etiquetaMap[labelId]) continue;

      // Buscar deal en CRM
      const dealRes = await pool.query('SELECT id FROM deals WHERE pipedrive_id = $1', [d.id]);
      if (dealRes.rows.length === 0) { notFound++; continue; }

      await pool.query(
        'INSERT INTO deal_etiquetas (deal_id, etiqueta_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [dealRes.rows[0].id, etiquetaMap[labelId]]
      );

      // También vincular a persona si existe
      if (dealRes.rows[0]) {
        const dealData = await pool.query('SELECT persona_id FROM deals WHERE id = $1', [dealRes.rows[0].id]);
        if (dealData.rows[0]?.persona_id) {
          await pool.query(
            'INSERT INTO persona_etiquetas (persona_id, etiqueta_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [dealData.rows[0].persona_id, etiquetaMap[labelId]]
          );
        }
      }
      linked++;
    }
  }

  console.log(`\n✓ ${Object.keys(etiquetaMap).length} etiquetas creadas`);
  console.log(`✓ ${linked} deals vinculados a etiquetas`);
  console.log(`✗ ${notFound} deals no encontrados en CRM`);
  process.exit(0);
}

importLabels().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
