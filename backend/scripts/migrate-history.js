/**
 * Migrar notas existentes de persona_notas → contact_history
 * USO: node backend/scripts/migrate-history.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { Pool } = require('pg');
const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : { host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASS }
);

async function main() {
  // Verificar que la tabla existe
  const tableCheck = await pool.query("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contact_history')");
  if (!tableCheck.rows[0].exists) {
    console.log('Tabla contact_history no existe. Ejecuta la migración primero.');
    process.exit(1);
  }

  // Verificar si notas ya se migraron (más de 100 registros = ya se ejecutó)
  const existing = await pool.query('SELECT COUNT(*) as c FROM contact_history');
  if (parseInt(existing.rows[0].c) > 100) {
    console.log(`Ya hay ${existing.rows[0].c} registros. Migración ya ejecutada.`);
    await pool.end();
    return;
  }
  console.log(`${existing.rows[0].c} registros existentes (webhook). Procediendo con migración...`);

  console.log('Migrando persona_notas → contact_history...');

  const notas = await pool.query('SELECT * FROM persona_notas ORDER BY created_at');
  let llamadas = 0, notas_count = 0, propuestas = 0, actividades = 0, sistema = 0;

  for (const n of notas.rows) {
    const txt = n.texto || '';
    let tipo = 'nota', subtipo = null, titulo = null, metadata = {};

    if (txt.startsWith('[call]') || txt.startsWith('Llamada iniciada a') || txt.includes('CloudTalk number')) {
      tipo = 'llamada';
      subtipo = txt.includes('unanswered') || txt.includes('no_contestada') ? 'no_contestada' : 'contestada';
      titulo = 'Llamada';
      llamadas++;
    } else if (txt.includes('PRESUPUESTO ADESLAS') || txt.includes('GRABACIÓN PÓLIZA')) {
      tipo = 'propuesta';
      titulo = txt.includes('GRABACIÓN') ? 'Grabación de Póliza' : 'Presupuesto ADESLAS';
      propuestas++;
    } else if (txt.startsWith('📅') || txt.startsWith('[task]') || txt.startsWith('[meeting]') || txt.startsWith('[email]')) {
      tipo = txt.startsWith('[email]') ? 'email' : 'nota';
      subtipo = 'actividad';
      actividades++;
    } else if (txt.includes('LEAD DUPLICADO')) {
      tipo = 'facebook';
      titulo = 'Lead duplicado';
      sistema++;
    } else {
      notas_count++;
    }

    await pool.query(
      `INSERT INTO contact_history (persona_id, tipo, subtipo, titulo, descripcion, metadata, agente_id, origen, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [n.persona_id, tipo, subtipo, titulo, txt, JSON.stringify(metadata), n.user_id, 'pipedrive', n.created_at]
    );
  }

  console.log(`Migración completada: ${notas.rows.length} registros`);
  console.log(`  Llamadas: ${llamadas}`);
  console.log(`  Notas: ${notas_count}`);
  console.log(`  Propuestas: ${propuestas}`);
  console.log(`  Actividades: ${actividades}`);
  console.log(`  Sistema: ${sistema}`);

  await pool.end();
}

main().catch(e => { console.error('Error:', e); process.exit(1); });
