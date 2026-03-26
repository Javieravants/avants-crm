if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
}
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');
const { uploadFile } = require('../utils/storage');

async function migrate() {
  console.log('Migrando PDFs existentes a Hetzner...');

  // Propuestas
  const propuestas = await pool.query(
    `SELECT id, pdf_url FROM propuestas
     WHERE pdf_url IS NOT NULL AND pdf_url NOT LIKE 'https://%'`
  );
  console.log(`Propuestas a migrar: ${propuestas.rows.length}`);

  for (const row of propuestas.rows) {
    const localPath = path.join(__dirname, '../..', row.pdf_url);
    if (!fs.existsSync(localPath)) {
      console.warn(`No existe: ${localPath}`);
      continue;
    }
    const remoteKey = `propuestas/propuesta_${row.id}.pdf`;
    const publicUrl = await uploadFile(localPath, remoteKey);
    await pool.query('UPDATE propuestas SET pdf_url = $1 WHERE id = $2', [publicUrl, row.id]);
    console.log(`propuesta ${row.id} -> ${publicUrl}`);
  }

  // TODO: migrar grabaciones cuando la tabla exista en producción

  console.log('Migracion completa');
  process.exit(0);
}

migrate().catch(err => { console.error(err); process.exit(1); });
