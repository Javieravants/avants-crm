// Script para importar datos de Fichate IONOS (TSV) a PostgreSQL (tablas ft_)
require('dotenv').config();
const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

const EXPORT_DIR = '/tmp/fichate-export';

function parseTSV(filename) {
  const filepath = path.join(EXPORT_DIR, filename);
  const content = fs.readFileSync(filepath, 'utf8');
  const lines = content.trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split('\t');
  const rows = lines.slice(1).map(line => {
    const vals = line.split('\t');
    const obj = {};
    headers.forEach((h, i) => {
      let v = vals[i] || null;
      if (v === 'NULL' || v === '') v = null;
      obj[h] = v;
    });
    return obj;
  });
  return { headers, rows };
}

async function importTable(tsvFile, pgTable, columnMap) {
  const { rows } = parseTSV(tsvFile);
  if (rows.length === 0) { console.log(`  ${pgTable}: 0 filas (vacía)`); return; }

  const pgCols = Object.values(columnMap);
  const tsvCols = Object.keys(columnMap);

  let imported = 0;
  for (const row of rows) {
    const values = tsvCols.map(c => row[c]);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(',');
    try {
      await pool.query(
        `INSERT INTO ${pgTable} (${pgCols.join(',')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
        values
      );
      imported++;
    } catch (e) {
      console.error(`  Error insertando en ${pgTable}:`, e.message, 'Row:', JSON.stringify(row).substring(0, 200));
    }
  }
  console.log(`  ${pgTable}: ${imported}/${rows.length} filas importadas`);
}

async function run() {
  console.log('=== Importando datos Fichate IONOS → PostgreSQL ===\n');

  // 1. Companies
  await importTable('companies.tsv', 'ft_companies', {
    id: 'id', name: 'name', cif: 'cif', address: 'address', phone: 'phone',
    email: 'email', vacation_days_default: 'vacation_days_default',
    daily_hours: 'daily_hours', schedule_default: 'schedule_default',
    active: 'active', created_at: 'created_at', updated_at: 'updated_at'
  });

  // Reset sequence
  await pool.query("SELECT setval('ft_companies_id_seq', (SELECT COALESCE(MAX(id),0) FROM ft_companies))");

  // 2. Users
  await importTable('users.tsv', 'ft_users', {
    id: 'id', company_id: 'company_id', email: 'email', password: 'password',
    password_plain: 'password_plain', pin: 'pin', name: 'name', dni: 'dni',
    role: 'role', team: 'team', phone: 'phone', position: 'position',
    department: 'department', schedule: 'schedule', daily_hours: 'daily_hours',
    vacation_days: 'vacation_days', used_vacation_days: 'used_vacation_days',
    start_date: 'start_date', avatar_url: 'avatar_url',
    cloudtalk_extension: 'cloudtalk_extension', cloudtalk_agent_id: 'cloudtalk_agent_id',
    status: 'status', is_active: 'is_active', last_login: 'last_login',
    created_at: 'created_at', updated_at: 'updated_at'
  });
  await pool.query("SELECT setval('ft_users_id_seq', (SELECT COALESCE(MAX(id),0) FROM ft_users))");

  // 3. Time Records
  await importTable('time_records.tsv', 'ft_time_records', {
    id: 'id', user_id: 'user_id', company_id: 'company_id', date: 'date',
    clock_in: 'clock_in', clock_out: 'clock_out', type: 'type', notes: 'notes',
    ip_address: 'ip_address', user_agent: 'user_agent',
    created_at: 'created_at', updated_at: 'updated_at'
  });
  await pool.query("SELECT setval('ft_time_records_id_seq', (SELECT COALESCE(MAX(id),0) FROM ft_time_records))");

  // 4. Absence Requests
  await importTable('absence_requests.tsv', 'ft_absence_requests', {
    id: 'id', user_id: 'user_id', company_id: 'company_id', type: 'type',
    start_date: 'start_date', end_date: 'end_date', partial: 'partial',
    hours_requested: 'hours_requested', time_from: 'time_from', time_to: 'time_to',
    status: 'status', notes: 'notes', attachment_path: 'attachment_path',
    attachment_name: 'attachment_name', reject_reason: 'reject_reason',
    reviewed_by: 'reviewed_by', reviewed_at: 'reviewed_at',
    created_at: 'created_at', updated_at: 'updated_at'
  });
  await pool.query("SELECT setval('ft_absence_requests_id_seq', (SELECT COALESCE(MAX(id),0) FROM ft_absence_requests))");

  // 5. Documents
  await importTable('documents.tsv', 'ft_documents', {
    id: 'id', user_id: 'user_id', company_id: 'company_id', category: 'category',
    name: 'name', description: 'description', file_path: 'file_path',
    file_name: 'file_name', file_size: 'file_size', date: 'date',
    uploaded_by: 'uploaded_by', created_at: 'created_at'
  });
  await pool.query("SELECT setval('ft_documents_id_seq', (SELECT COALESCE(MAX(id),0) FROM ft_documents))");

  // 6. Holidays
  await importTable('holidays.tsv', 'ft_holidays', {
    id: 'id', company_id: 'company_id', date: 'date', name: 'name',
    type: 'type', year: 'year', created_at: 'created_at'
  });
  await pool.query("SELECT setval('ft_holidays_id_seq', (SELECT COALESCE(MAX(id),0) FROM ft_holidays))");

  // 7. Shifts
  await importTable('shifts.tsv', 'ft_shifts', {
    id: 'id', company_id: 'company_id', name: 'name',
    start_time: 'start_time', end_time: 'end_time', daily_hours: 'daily_hours',
    break_time: 'break_time', color: 'color', created_at: 'created_at'
  });
  await pool.query("SELECT setval('ft_shifts_id_seq', (SELECT COALESCE(MAX(id),0) FROM ft_shifts))");

  // 8. App Credentials
  await importTable('app_credentials.tsv', 'ft_app_credentials', {
    id: 'id', company_id: 'company_id', user_id: 'user_id',
    app_name: 'app_name', app_url: 'app_url', username: 'username',
    password_plain: 'password_plain', notes: 'notes',
    created_by: 'created_by', created_at: 'created_at', updated_at: 'updated_at'
  });
  await pool.query("SELECT setval('ft_app_credentials_id_seq', (SELECT COALESCE(MAX(id),0) FROM ft_app_credentials))");

  // Verificación final
  console.log('\n=== Verificación ===');
  const tables = ['ft_companies', 'ft_users', 'ft_time_records', 'ft_absence_requests',
                   'ft_documents', 'ft_holidays', 'ft_shifts', 'ft_app_credentials'];
  for (const t of tables) {
    const r = await pool.query(`SELECT COUNT(*) as c FROM ${t}`);
    console.log(`  ${t}: ${r.rows[0].c} filas`);
  }

  await pool.end();
  console.log('\n✅ Importación completada');
}

run().catch(e => { console.error('❌ Fatal:', e.message); process.exit(1); });
