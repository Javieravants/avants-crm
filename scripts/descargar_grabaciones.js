require('dotenv').config({ path: '/var/www/gestavly/.env' });
const https = require('https');
const fs = require('fs');
const path = require('path');
const { uploadFile } = require('/var/www/gestavly/backend/utils/storage');
const pool = require('/var/www/gestavly/backend/config/db');

const API_KEY = process.env.CLOUDTALK_API_KEY;
const API_SECRET = process.env.CLOUDTALK_API_SECRET;
const AUTH = Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64');
const MIN_DURACION = 60;

const stats = { total: 0, filtradas: 0, descargadas: 0, errores: 0, ya_existia: 0 };

function ctGet(p) {
  return new Promise((resolve, reject) => {
    https.request({ hostname: 'my.cloudtalk.io', path: p, headers: { 'Authorization': `Basic ${AUTH}` } }, res => {
      let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject).end();
  });
}

function downloadAudio(callId, dest) {
  return new Promise((resolve, reject) => {
    const url = `/api/calls/recording/${callId}.json`;
    const req = https.request({ hostname: 'my.cloudtalk.io', path: url, headers: { 'Authorization': `Basic ${AUTH}` } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Redirect — descargar desde la URL real
        const loc = res.headers.location;
        const proto = loc.startsWith('https') ? https : require('http');
        proto.get(loc, res2 => {
          const file = fs.createWriteStream(dest);
          res2.pipe(file);
          file.on('finish', () => file.close(resolve));
        }).on('error', reject);
      } else {
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
      }
    });
    req.on('error', reject);
    req.end();
  });
}

async function procesarLlamada(call) {
  const cdr = call.Cdr;
  stats.total++;

  const duracion = parseInt(cdr.billsec || 0);
  if (duracion < MIN_DURACION || !cdr.recorded || cdr.is_voicemail) {
    stats.filtradas++; return;
  }

  const callId = cdr.id;
  const { rows } = await pool.query('SELECT id FROM call_recordings WHERE cloudtalk_id=$1', [callId]);
  if (rows.length > 0) { stats.ya_existia++; return; }

  try {
    const tmpPath = `/tmp/ct_${callId}.mp3`;
    await downloadAudio(callId, tmpPath);

    if (!fs.existsSync(tmpPath) || fs.statSync(tmpPath).size < 5000) {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      stats.errores++; return;
    }

    const fecha = cdr.started_at.substring(0, 10);
    const s3Key = `grabaciones/cloudtalk/${fecha}/${callId}.mp3`;
    const audioUrl = await uploadFile(tmpPath, s3Key);
    fs.unlinkSync(tmpPath);

    const phones = call.Contact?.contact_numbers || [];
    const phone = phones[0] || '';
    const personaRes = await pool.query(
      "SELECT id FROM personas WHERE telefono=$1 OR telefono=$2 LIMIT 1",
      [phone, phone.replace('+34', '')]
    );
    const personaId = personaRes.rows[0]?.id || null;

    await pool.query(`
      INSERT INTO call_recordings (cloudtalk_id, persona_id, persona_telefono, agente_nombre, agente_email, duracion_segundos, fecha_llamada, tipo_llamada, audio_url, numero_interno, numero_externo)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (cloudtalk_id) DO NOTHING
    `, [callId, personaId, phone, call.Agent?.fullname||'', call.Agent?.email||'', duracion, cdr.started_at, cdr.type||'outgoing', audioUrl, cdr.public_internal||'', cdr.public_external||'']);

    if (personaId) {
      await pool.query(`
        INSERT INTO contact_history (persona_id, tipo, titulo, descripcion, origen)
        VALUES ($1,'llamada',$2,$3,'cloudtalk_import')
      `, [personaId,
        `Llamada ${cdr.type==='outgoing'?'saliente':'entrante'} — ${Math.floor(duracion/60)}m ${duracion%60}s — ${call.Agent?.fullname||''}`,
        audioUrl
      ]);
    }

    stats.descargadas++;
    if (stats.descargadas % 10 === 0) {
      console.log(`✅ ${stats.descargadas} descargadas | ${callId} | ${duracion}s | ${call.Agent?.fullname}`);
    }

    await new Promise(r => setTimeout(r, 700));
  } catch(e) {
    console.log(`❌ ${callId}: ${e.message}`);
    stats.errores++;
  }
}

async function main() {
  console.log(`🚀 Descarga masiva CloudTalk → Gestavly`);
  console.log(`   Filtro: >${MIN_DURACION}s, grabado, sin buzón`);
  console.log(`   Inicio: ${new Date().toISOString()}\n`);

  let page = 1;
  while (true) {
    const data = await ctGet(`/api/calls/index.json?page=${page}&limit=100`);
    const calls = data?.responseData?.data || [];
    if (calls.length === 0) break;

    for (const call of calls) await procesarLlamada(call);

    if (page % 10 === 0) {
      console.log(`📄 Pág ${page} | Stats: total=${stats.total} ✅=${stats.descargadas} 🔕=${stats.filtradas} ⚠️=${stats.errores}`);
    }

    if (calls.length < 100) break;
    page++;
    await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n✅ COMPLETADO: ${new Date().toISOString()}`);
  console.log(JSON.stringify(stats, null, 2));
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
