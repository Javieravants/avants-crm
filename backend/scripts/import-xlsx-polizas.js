/**
 * Importar pólizas desde archivo XLSX local → POST /api/polizas/importar-json
 * Uso: node backend/scripts/import-xlsx-polizas.js [ruta_al_xlsx]
 */
require('dotenv').config();
const XLSX = require('xlsx');
const path = require('path');

const FILE = process.argv[2] || path.join(process.env.HOME, 'Downloads', 'ADESLAS VENTAS 2025.xlsx');
const BASE_URL = process.env.API_URL || 'https://avants-crm-production.up.railway.app';

// Columnas del Sheet (por posición, 0-indexed)
const COL_MAP = [
  'agente', 'nombre', 'dni', 'fecha_grabacion', 'fecha_efecto',
  'producto', 'num_solicitud', 'num_poliza', 'forma_pago',
  'descuento', 'recibo_mensual', 'num_asegurados', 'prima_anual',
  'beneficio', 'origen_lead', 'telefono', 'email', 'campana',
  'audio', 'carencias', 'enviada_ccpp', 'notas'
];

async function login() {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'javier@segurosdesaludonline.es',
      password: process.env.ADMIN_PASSWORD || 'Avants2026!',
    }),
  });
  const data = await res.json();
  if (!data.token) throw new Error('Login falló: ' + JSON.stringify(data));
  return data.token;
}

async function importBatch(token, mes, filas) {
  const res = await fetch(`${BASE_URL}/api/polizas/importar-json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ mes, filas }),
  });
  return res.json();
}

function excelDateToStr(v) {
  if (!v) return null;
  if (typeof v === 'number') {
    // Excel serial date → JS Date
    const d = new Date((v - 25569) * 86400000);
    if (!isNaN(d.getTime())) {
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    }
  }
  return String(v);
}

function cellValue(v) {
  if (v === undefined || v === null) return null;
  return String(v).trim() || null;
}

async function main() {
  console.log(`\n📂 Leyendo: ${FILE}\n`);
  const wb = XLSX.readFile(FILE);

  console.log(`📋 Pestañas encontradas: ${wb.SheetNames.join(', ')}\n`);

  const token = await login();
  console.log('🔐 Login OK\n');

  const totales = {
    contactos_nuevos: 0, contactos_actualizados: 0,
    polizas_nuevas: 0, polizas_actualizadas: 0,
    bajas_detectadas: 0, dnis_extraidos_de_nombre: 0,
    errores: [], total_procesadas: 0,
  };

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });

    // Saltar cabecera (primera fila)
    const dataRows = rawRows.slice(1).filter(r => r.some(c => c !== null && c !== ''));

    // Convertir a objetos con claves normalizadas
    const filas = [];
    for (const row of dataRows) {
      const obj = {};
      COL_MAP.forEach((key, i) => {
        let val = row[i];
        // Convertir fechas Excel
        if ((key === 'fecha_grabacion' || key === 'fecha_efecto') && typeof val === 'number') {
          val = excelDateToStr(val);
        }
        // Números de póliza y solicitud como string
        if ((key === 'num_poliza' || key === 'num_solicitud' || key === 'telefono' || key === 'audio') && val !== null) {
          val = String(val);
        }
        obj[key] = cellValue(val);
      });

      // Solo procesar filas con nº póliza
      if (obj.num_poliza) filas.push(obj);
    }

    if (filas.length === 0) {
      console.log(`  ${sheetName}: 0 filas con póliza — saltando`);
      continue;
    }

    console.log(`  ${sheetName}: ${filas.length} filas con póliza`);

    // Enviar en batches de 100
    for (let i = 0; i < filas.length; i += 100) {
      const batch = filas.slice(i, i + 100);
      try {
        const resp = await importBatch(token, sheetName, batch);
        totales.contactos_nuevos += resp.contactos_nuevos || 0;
        totales.contactos_actualizados += resp.contactos_actualizados || 0;
        totales.polizas_nuevas += resp.polizas_nuevas || 0;
        totales.polizas_actualizadas += resp.polizas_actualizadas || 0;
        totales.bajas_detectadas += resp.bajas_detectadas || 0;
        totales.dnis_extraidos_de_nombre += resp.dnis_extraidos_de_nombre || 0;
        totales.total_procesadas += resp.total_procesadas || 0;
        if (resp.errores?.length) totales.errores.push(...resp.errores);
        process.stdout.write(`    batch ${Math.floor(i / 100) + 1}/${Math.ceil(filas.length / 100)} ✓  `);
      } catch (err) {
        console.error(`    batch error: ${err.message}`);
        totales.errores.push(`${sheetName} batch: ${err.message}`);
      }
    }
    console.log('');
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 INFORME DE IMPORTACIÓN');
  console.log('='.repeat(50));
  console.log(`  Total procesadas:          ${totales.total_procesadas}`);
  console.log(`  Personas nuevas:           ${totales.contactos_nuevos}`);
  console.log(`  Personas actualizadas:     ${totales.contactos_actualizados}`);
  console.log(`  Pólizas nuevas:            ${totales.polizas_nuevas}`);
  console.log(`  Pólizas actualizadas:      ${totales.polizas_actualizadas}`);
  console.log(`  Bajas detectadas:          ${totales.bajas_detectadas}`);
  console.log(`  DNIs extraídos de nombre:  ${totales.dnis_extraidos_de_nombre}`);
  console.log(`  Errores:                   ${totales.errores.length}`);
  if (totales.errores.length > 0) {
    console.log('\n  Primeros 20 errores:');
    totales.errores.slice(0, 20).forEach(e => console.log(`    - ${e}`));
  }
  console.log('='.repeat(50));
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
