/**
 * Normalizar teléfonos existentes en la BD
 * Uso: node backend/scripts/normalize-phones.js [--execute]
 * Sin --execute → solo preview (no modifica nada)
 */
require('dotenv').config();
const pool = require('../config/db');

function formatTelefono(tel) {
  if (!tel) return null;
  const digits = tel.replace(/\D/g, '');
  if (digits.length === 9 && /^[6789]/.test(digits)) return '+34' + digits;
  if (digits.length === 11 && digits.startsWith('34') && /^[6789]/.test(digits.slice(2))) return '+' + digits;
  return tel;
}

async function main() {
  const execute = process.argv.includes('--execute');

  console.log(`\n📱 Normalización de teléfonos — ${execute ? 'MODO EJECUCIÓN' : 'MODO PREVIEW (añadir --execute para aplicar)'}\n`);

  const { rows } = await pool.query(
    `SELECT id, telefono FROM personas WHERE telefono IS NOT NULL AND telefono != ''`
  );

  console.log(`Total personas con teléfono: ${rows.length}\n`);

  let normalizados = 0;
  let sinCambios = 0;
  let extranjeros = 0;
  const cambios = [];

  for (const row of rows) {
    const original = row.telefono;
    const normalizado = formatTelefono(original);

    if (normalizado === original) {
      sinCambios++;
    } else {
      const digits = original.replace(/\D/g, '');
      const isEspanol = (digits.length === 9 && /^[6789]/.test(digits)) ||
                         (digits.length === 11 && digits.startsWith('34') && /^[6789]/.test(digits.slice(2)));
      if (isEspanol) {
        normalizados++;
        cambios.push({ id: row.id, original, normalizado });
      } else {
        extranjeros++;
      }
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Teléfonos a normalizar:  ${normalizados}`);
  console.log(`  Ya están bien:           ${sinCambios}`);
  console.log(`  Extranjeros (sin tocar): ${extranjeros}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (cambios.length > 0) {
    console.log('Ejemplos de normalización (primeros 10):');
    cambios.slice(0, 10).forEach(c => {
      console.log(`  id=${c.id}  "${c.original}" → "${c.normalizado}"`);
    });
    console.log('');
  }

  if (!execute) {
    console.log('⚠️  Modo preview — no se ha modificado nada.');
    console.log('    Ejecuta con --execute para aplicar los cambios.\n');
    process.exit(0);
  }

  // Ejecutar updates
  console.log(`Aplicando ${cambios.length} actualizaciones...`);
  let updated = 0;
  for (const c of cambios) {
    try {
      await pool.query('UPDATE personas SET telefono = $1 WHERE id = $2', [c.normalizado, c.id]);
      updated++;
    } catch (e) {
      console.warn(`  Error id=${c.id}: ${e.message}`);
    }
  }

  console.log(`\n✅ ${updated} teléfonos normalizados correctamente.\n`);
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
