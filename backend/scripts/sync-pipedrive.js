/**
 * Sincronización inicial Pipedrive → CRM
 *
 * USO:
 *   node backend/scripts/sync-pipedrive.js           # sync completo
 *   node backend/scripts/sync-pipedrive.js --persons  # solo personas
 *   node backend/scripts/sync-pipedrive.js --deals    # solo deals
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const pool = require('../config/db');
const { syncPersons, syncDeals, fullSync } = require('../utils/pipedrive-sync');

const args = process.argv.slice(2);

(async () => {
  try {
    if (args.includes('--persons')) {
      const result = await syncPersons();
      console.log('\n=== Resultado ===');
      console.log(`Total: ${result.total} | Nuevas: ${result.imported} | Actualizadas: ${result.updated} | Errores: ${result.errors}`);
    } else if (args.includes('--deals')) {
      const result = await syncDeals();
      console.log('\n=== Resultado ===');
      console.log(`Total: ${result.total} | Nuevos: ${result.imported} | Actualizados: ${result.updated} | Errores: ${result.errors}`);
    } else {
      const result = await fullSync();
      console.log('\n=== RESUMEN FINAL ===');
      console.log(`Personas: ${result.persons.total} total → ${result.persons.imported} nuevas, ${result.persons.updated} actualizadas`);
      console.log(`Deals:    ${result.deals.total} total → ${result.deals.imported} nuevos, ${result.deals.updated} actualizados`);
      console.log(`Errores:  ${result.persons.errors + result.deals.errors}`);
    }
    process.exit(0);
  } catch (err) {
    console.error('Error fatal:', err);
    process.exit(1);
  }
})();
