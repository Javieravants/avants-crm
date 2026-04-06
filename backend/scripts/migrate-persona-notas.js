/**
 * Migrar persona_notas → contact_history
 *
 * 1. Crea índices de deduplicación
 * 2. Migra todas las notas de persona_notas a contact_history
 * 3. Confirma que todas están migradas
 * 4. Con --purge, vacía persona_notas (sin DROP)
 *
 * USO:
 *   node backend/scripts/migrate-persona-notas.js           # migrar (dry-run: no borra)
 *   node backend/scripts/migrate-persona-notas.js --purge   # migrar + vaciar persona_notas
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : { host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASS }
);

const doPurge = process.argv.includes('--purge');

async function main() {
  const t0 = Date.now();
  console.log('=== Migración persona_notas → contact_history ===\n');

  // Paso 1: Crear índices
  console.log('[1/4] Creando índices de deduplicación...');
  const migrationSql = fs.readFileSync(
    path.join(__dirname, '../config/migration-notas-history.sql'), 'utf-8'
  );
  await pool.query(migrationSql);
  console.log('  Índices creados.\n');

  // Paso 2: Contar notas origen
  const countResult = await pool.query('SELECT COUNT(*) AS total FROM persona_notas');
  const totalOrigen = parseInt(countResult.rows[0].total);
  console.log(`[2/4] Notas en persona_notas: ${totalOrigen}`);
  if (totalOrigen === 0) {
    console.log('  No hay notas que migrar.');
    await pool.end();
    return;
  }

  // Paso 3: Migrar en lotes de 500
  console.log('[3/4] Migrando notas...');
  let migrated = 0, skipped = 0, errors = 0;
  const batchSize = 500;
  let offset = 0;

  while (true) {
    const batch = await pool.query(
      'SELECT id, persona_id, user_id, texto, created_at FROM persona_notas ORDER BY id LIMIT $1 OFFSET $2',
      [batchSize, offset]
    );
    if (batch.rows.length === 0) break;

    for (const nota of batch.rows) {
      try {
        // Verificar si ya fue migrada por su ID de persona_notas
        const exists = await pool.query(
          "SELECT id FROM contact_history WHERE metadata->>'persona_nota_id' = $1",
          [String(nota.id)]
        );
        if (exists.rows.length > 0) { skipped++; continue; }

        // Verificar duplicado por texto similar + persona + tipo nota
        const textoCheck = (nota.texto || '').substring(0, 100);
        if (textoCheck.length > 10) {
          const dupCheck = await pool.query(
            `SELECT id FROM contact_history
             WHERE persona_id = $1 AND tipo = 'nota' AND descripcion IS NOT NULL
               AND LEFT(descripcion, 100) = $2
             LIMIT 1`,
            [nota.persona_id, textoCheck]
          );
          if (dupCheck.rows.length > 0) { skipped++; continue; }
        }

        // Insertar en contact_history
        const titulo = (nota.texto || '').substring(0, 255).split('\n')[0];
        await pool.query(
          `INSERT INTO contact_history (persona_id, tipo, titulo, descripcion, metadata, agente_id, origen, created_at)
           VALUES ($1, 'nota', $2, $3, $4, $5, 'pipedrive', $6)`,
          [
            nota.persona_id,
            titulo,
            nota.texto || '',
            JSON.stringify({ migrated_from: 'persona_notas', persona_nota_id: nota.id }),
            nota.user_id,
            nota.created_at || new Date()
          ]
        );
        migrated++;
      } catch (e) {
        errors++;
        if (errors <= 5) console.error(`  Error nota #${nota.id}: ${e.message}`);
      }
    }

    offset += batchSize;
    console.log(`  procesadas ${offset}/${totalOrigen} — migradas=${migrated} skip=${skipped} err=${errors}`);
  }

  console.log(`\n  Resultado: ${migrated} migradas, ${skipped} duplicados, ${errors} errores\n`);

  // Paso 4: Verificar y opcionalmente vaciar
  const migratedCount = await pool.query(
    "SELECT COUNT(*) AS total FROM contact_history WHERE metadata->>'migrated_from' = 'persona_notas'"
  );
  const totalMigrated = parseInt(migratedCount.rows[0].total);
  const expectedMin = totalOrigen - skipped - errors;

  console.log(`[4/4] Verificación:`);
  console.log(`  persona_notas original: ${totalOrigen}`);
  console.log(`  contact_history migradas: ${totalMigrated}`);
  console.log(`  skipped (duplicados): ${skipped}`);
  console.log(`  errores: ${errors}`);

  if (doPurge) {
    if (errors > 0) {
      console.log(`\n  AVISO: Hay ${errors} errores. No se vacía persona_notas por seguridad.`);
      console.log('  Corrige los errores y vuelve a ejecutar con --purge.');
    } else if (totalMigrated + skipped < totalOrigen) {
      console.log(`\n  AVISO: Faltan notas (migradas+skip=${totalMigrated + skipped} < origen=${totalOrigen}).`);
      console.log('  No se vacía persona_notas por seguridad.');
    } else {
      console.log(`\n  Todo OK. Vaciando persona_notas...`);
      await pool.query('DELETE FROM persona_notas');
      console.log('  persona_notas vaciada (tabla conservada).');
    }
  } else {
    console.log(`\n  Modo dry-run: persona_notas NO se ha vaciado.`);
    console.log('  Ejecuta con --purge para vaciarla tras verificar.');
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\nCompletado en ${elapsed}s`);
  await pool.end();
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
