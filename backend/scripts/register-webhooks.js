/**
 * Registrar webhooks en Pipedrive
 *
 * USO:
 *   node backend/scripts/register-webhooks.js https://tu-dominio.com
 *   node backend/scripts/register-webhooks.js --list     # ver webhooks activos
 *   node backend/scripts/register-webhooks.js --clean    # eliminar duplicados, conservar el más reciente por evento
 *   node backend/scripts/register-webhooks.js --delete   # eliminar todos los webhooks
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const API_TOKEN = process.env.PIPEDRIVE_API_KEY;
const BASE_URL = 'https://api.pipedrive.com/v1';

async function listWebhooks() {
  const res = await fetch(`${BASE_URL}/webhooks?api_token=${API_TOKEN}`);
  const data = await res.json();
  if (!data.data || data.data.length === 0) {
    console.log('No hay webhooks registrados.');
    return [];
  }
  console.log(`${data.data.length} webhook(s) registrado(s):\n`);
  data.data.forEach((w) => {
    console.log(`  ID: ${w.id}`);
    console.log(`  URL: ${w.subscription_url}`);
    console.log(`  Evento: ${w.event_action}.${w.event_object}`);
    console.log(`  Activo: ${w.is_active}`);
    console.log('');
  });
  return data.data;
}

async function deleteAllWebhooks() {
  const webhooks = await listWebhooks();
  for (const w of webhooks) {
    const res = await fetch(`${BASE_URL}/webhooks/${w.id}?api_token=${API_TOKEN}`, { method: 'DELETE' });
    const data = await res.json();
    console.log(`Eliminado webhook ${w.id}: ${data.success ? 'OK' : 'ERROR'}`);
  }
}

async function cleanDuplicates() {
  const webhooks = await listWebhooks();
  if (webhooks.length === 0) return;

  // Agrupar por evento (action.object)
  const groups = {};
  for (const w of webhooks) {
    const key = `${w.event_action}.${w.event_object}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(w);
  }

  let kept = 0, removed = 0;
  console.log('=== Limpieza de duplicados ===\n');

  for (const [event, items] of Object.entries(groups)) {
    // Ordenar por ID desc — el más alto es el más reciente
    items.sort((a, b) => b.id - a.id);
    const keep = items[0];
    const dupes = items.slice(1);

    console.log(`${event}: ${items.length} webhook(s)`);
    console.log(`  ✅ Conservar ID ${keep.id} (${keep.subscription_url})`);
    kept++;

    for (const d of dupes) {
      const res = await fetch(`${BASE_URL}/webhooks/${d.id}?api_token=${API_TOKEN}`, { method: 'DELETE' });
      const data = await res.json();
      console.log(`  🗑  Eliminar ID ${d.id} → ${data.success ? 'OK' : 'ERROR'}`);
      if (data.success) removed++;
    }
  }

  console.log(`\nResultado: ${kept} conservados, ${removed} eliminados, ${kept} eventos únicos`);
}

async function registerWebhooks(baseUrl) {
  const webhookUrl = `${baseUrl}/api/webhooks/pipedrive`;

  const events = [
    { action: 'create', object: 'deal' },
    { action: 'change', object: 'deal' },
    { action: 'delete', object: 'deal' },
    { action: 'create', object: 'person' },
    { action: 'change', object: 'person' },
    { action: 'create', object: 'activity' },
    { action: 'change', object: 'activity' },
    { action: 'delete', object: 'activity' },
    { action: 'create', object: 'note' },
    { action: 'change', object: 'note' },
  ];

  console.log(`Registrando webhooks en: ${webhookUrl}\n`);

  for (const { action, object } of events) {
    const res = await fetch(`${BASE_URL}/webhooks?api_token=${API_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription_url: webhookUrl,
        event_action: action,
        event_object: object,
        http_auth_user: process.env.PIPEDRIVE_WEBHOOK_USER || undefined,
        http_auth_password: process.env.PIPEDRIVE_WEBHOOK_PASS || undefined,
      }),
    });

    const data = await res.json();
    if (data.success) {
      console.log(`  ✅ ${action}.${object} → ID: ${data.data.id}`);
    } else {
      console.log(`  ❌ ${action}.${object} → ${data.error || 'Error desconocido'}`);
    }
  }

  console.log('\nWebhooks registrados. Pipedrive enviará eventos a tu servidor.');
}

// Main
const args = process.argv.slice(2);

(async () => {
  try {
    if (args.includes('--list')) {
      await listWebhooks();
    } else if (args.includes('--clean')) {
      await cleanDuplicates();
    } else if (args.includes('--delete')) {
      await deleteAllWebhooks();
    } else if (args[0] && args[0].startsWith('http')) {
      await registerWebhooks(args[0]);
    } else {
      console.log('Uso:');
      console.log('  node backend/scripts/register-webhooks.js https://tu-dominio.com');
      console.log('  node backend/scripts/register-webhooks.js --list');
      console.log('  node backend/scripts/register-webhooks.js --clean    # eliminar duplicados');
      console.log('  node backend/scripts/register-webhooks.js --delete   # eliminar TODOS');
      console.log('\nNota: necesitas una URL pública. Para desarrollo usa ngrok:');
      console.log('  npx ngrok http 3000');
      console.log('  → copia la URL https://xxxx.ngrok-free.app');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
