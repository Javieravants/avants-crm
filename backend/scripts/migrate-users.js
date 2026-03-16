/**
 * Migración de usuarios: Fichate (MySQL/IONOS) → Avants CRM (PostgreSQL)
 *
 * USO:
 *   node backend/scripts/migrate-users.js          # migración desde Fichate MySQL
 *   node backend/scripts/migrate-users.js --manual  # insertar usuarios manualmente
 *   node backend/scripts/migrate-users.js --dry-run # solo mostrar qué haría, sin escribir
 *
 * REQUISITOS:
 *   Rellenar en .env: FICHATE_DB_HOST, FICHATE_DB_PORT, FICHATE_DB_NAME, FICHATE_DB_USER, FICHATE_DB_PASS
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const pgPool = require('../config/db');

// =============================================
// CONFIGURACIÓN
// =============================================

// Mapeo de roles Fichate → CRM
const ROLE_MAP = {
  admin: 'admin',
  administrador: 'admin',
  supervisor: 'supervisor',
  coordinador: 'supervisor',
  agente: 'agent',
  agent: 'agent',
  usuario: 'agent',
  user: 'agent',
};

// Password temporal para usuarios migrados (deben cambiarla al primer login)
const DEFAULT_PASSWORD = 'Avants2026!';

// =============================================
// USUARIOS MANUALES (alternativa sin MySQL)
// Edita esta lista con los usuarios reales de Fichate
// =============================================
const MANUAL_USERS = [
  { nombre: 'Javier Hernández',                    email: 'javier@segurosdesaludonline.es',            rol: 'admin',      password: 'Avants2026!' },
  { nombre: 'Jose Antonio Recio Martín',            email: 'pilardiazdkv@gmail.com',                    rol: 'supervisor', password: '25095679B' },
  { nombre: 'Ana Frida Garín Figueroa',             email: 'ana@segurosdesaludonline.es',               rol: 'agent',      password: '77652490M' },
  { nombre: 'Andrea del Carmen Stefani',            email: 'andrea@segurosdesaludonline.es',            rol: 'agent',      password: 'Y9650013D' },
  { nombre: 'Beatriz Sánchez Parras',               email: 'beatrizdkvhealth@gmail.com',                rol: 'agent',      password: '05655815T' },
  { nombre: 'Diego Ramírez Nogales',                email: 'diego@segurosdesaludonline.es',             rol: 'agent',      password: 'X3895650W' },
  { nombre: 'Eva Mora Mancebo',                     email: 'evamora@segurosdesaludonline.es',           rol: 'agent',      password: '05911308D' },
  { nombre: 'Eva Polo Toribio',                     email: 'eva@segurosdesaludonline.es',               rol: 'agent',      password: '05660307F' },
  { nombre: 'Laura Carpintero Nieto',               email: 'laura@segurosdesaludonline.es',             rol: 'agent',      password: '05709877N' },
  { nombre: 'María Luisa Cano Dorado',              email: 'marisa@segurosdesaludonline.es',            rol: 'agent',      password: '43437897M' },
  { nombre: 'María Montserrat González González',   email: 'montse@segurosdesaludonline.es',            rol: 'agent',      password: '05668501J' },
  { nombre: 'Mirtha Raquel Contreras Velázquez',    email: 'raquel@segurosdesaludonline.es',            rol: 'agent',      password: 'Z0093678G' },
  { nombre: 'Patricia Cañas Rivas',                 email: 'patricia@segurosdesaludonline.es',          rol: 'agent',      password: '05719628B' },
  { nombre: 'Raúl Llerena Mozos',                   email: 'raultelegestion@gmail.com',                 rol: 'agent',      password: '05907032B' },
  { nombre: 'Silvia Muñoz Jiménez',                 email: 'silvia@segurosdesaludonline.es',            rol: 'agent',      password: '05661384A' },
  { nombre: 'Yolanda Fernández García',             email: 'elviratelegestioncalahorra@gmail.com',      rol: 'agent',      password: '70575222K' },
];

// =============================================
// Posibles nombres de tabla y columnas en Fichate
// El script intenta detectar automáticamente la estructura
// =============================================
const POSSIBLE_TABLES = ['users', 'usuarios', 'empleados', 'trabajadores', 'fichate_users'];
const POSSIBLE_COLUMNS = {
  nombre: ['nombre', 'name', 'nombre_completo', 'full_name', 'usuario'],
  email: ['email', 'correo', 'mail', 'email_address'],
  password: ['password', 'password_hash', 'clave', 'pass', 'contrasena'],
  rol: ['rol', 'role', 'tipo', 'type', 'perfil', 'profile', 'nivel'],
  activo: ['activo', 'active', 'estado', 'status', 'enabled'],
};

// =============================================
// FUNCIONES
// =============================================

async function connectMySQL() {
  const mysql = require('mysql2/promise');

  const config = {
    host: process.env.FICHATE_DB_HOST,
    port: parseInt(process.env.FICHATE_DB_PORT || '3306', 10),
    database: process.env.FICHATE_DB_NAME,
    user: process.env.FICHATE_DB_USER,
    password: process.env.FICHATE_DB_PASS,
    connectTimeout: 10000,
  };

  // Validar que hay datos de conexión
  if (!config.host || !config.database || !config.user) {
    console.error('\n❌ Faltan datos de conexión MySQL en .env:');
    console.error('   FICHATE_DB_HOST, FICHATE_DB_NAME, FICHATE_DB_USER, FICHATE_DB_PASS');
    console.error('\n   Usa --manual para insertar usuarios sin conexión MySQL.\n');
    process.exit(1);
  }

  console.log(`\nConectando a MySQL: ${config.host}:${config.port}/${config.database}...`);
  const connection = await mysql.createConnection(config);
  console.log('✅ Conexión MySQL establecida.');
  return connection;
}

async function detectTable(mysql) {
  const [tables] = await mysql.query('SHOW TABLES');
  const tableNames = tables.map((row) => Object.values(row)[0].toLowerCase());
  console.log(`\nTablas encontradas: ${tableNames.join(', ')}`);

  for (const candidate of POSSIBLE_TABLES) {
    if (tableNames.includes(candidate)) {
      console.log(`✅ Tabla de usuarios detectada: ${candidate}`);
      return candidate;
    }
  }

  // Si no encontramos una conocida, buscar tabla con columna 'email'
  for (const table of tableNames) {
    const [cols] = await mysql.query(`SHOW COLUMNS FROM \`${table}\``);
    const colNames = cols.map((c) => c.Field.toLowerCase());
    if (colNames.includes('email') || colNames.includes('correo')) {
      console.log(`✅ Tabla de usuarios detectada (por columna email): ${table}`);
      return table;
    }
  }

  console.error('❌ No se encontró tabla de usuarios. Tablas disponibles:', tableNames.join(', '));
  process.exit(1);
}

async function detectColumns(mysql, tableName) {
  const [cols] = await mysql.query(`SHOW COLUMNS FROM \`${tableName}\``);
  const colNames = cols.map((c) => c.Field);
  console.log(`Columnas en ${tableName}: ${colNames.join(', ')}`);

  const mapping = {};

  for (const [field, candidates] of Object.entries(POSSIBLE_COLUMNS)) {
    for (const candidate of candidates) {
      const match = colNames.find((c) => c.toLowerCase() === candidate);
      if (match) {
        mapping[field] = match;
        break;
      }
    }
  }

  console.log('\nMapeo de columnas detectado:');
  for (const [field, col] of Object.entries(mapping)) {
    console.log(`  ${field} → ${col}`);
  }

  if (!mapping.email) {
    console.error('❌ No se encontró columna de email. No se puede migrar.');
    process.exit(1);
  }

  return mapping;
}

function mapRole(fichateRole) {
  if (!fichateRole) return 'agent';
  const normalized = String(fichateRole).toLowerCase().trim();
  return ROLE_MAP[normalized] || 'agent';
}

async function readFichateUsers(mysql, tableName, columns) {
  const selectCols = [];
  if (columns.nombre) selectCols.push(`\`${columns.nombre}\` AS nombre`);
  if (columns.email) selectCols.push(`\`${columns.email}\` AS email`);
  if (columns.password) selectCols.push(`\`${columns.password}\` AS password_original`);
  if (columns.rol) selectCols.push(`\`${columns.rol}\` AS rol_original`);
  if (columns.activo) selectCols.push(`\`${columns.activo}\` AS activo_original`);

  const query = `SELECT ${selectCols.join(', ')} FROM \`${tableName}\``;
  console.log(`\nQuery: ${query}`);

  const [rows] = await mysql.query(query);
  console.log(`✅ ${rows.length} usuarios encontrados en Fichate.\n`);
  return rows;
}

async function insertUserCRM(user, dryRun) {
  const { nombre, email, rol, password } = user;

  // Verificar si ya existe
  const existing = await pgPool.query('SELECT id, email FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    console.log(`  ⏭️  ${email} — ya existe en el CRM (ID ${existing.rows[0].id}), saltando.`);
    return { action: 'skipped', email };
  }

  if (dryRun) {
    console.log(`  🔍 ${nombre} <${email}> — rol: ${rol} (dry-run, no se inserta)`);
    return { action: 'dry-run', email };
  }

  // Hash del password
  const hash = await bcrypt.hash(password || DEFAULT_PASSWORD, 10);

  const result = await pgPool.query(
    'INSERT INTO users (nombre, email, password_hash, rol) VALUES ($1, $2, $3, $4) RETURNING id',
    [nombre, email, hash, rol]
  );

  console.log(`  ✅ ${nombre} <${email}> — rol: ${rol} — ID: ${result.rows[0].id}`);
  return { action: 'inserted', email, id: result.rows[0].id };
}

// =============================================
// MIGRACIÓN DESDE MYSQL
// =============================================

async function migrateFromMySQL(dryRun) {
  const mysql = await connectMySQL();

  try {
    const tableName = await detectTable(mysql);
    const columns = await detectColumns(mysql, tableName);
    const fichateUsers = await readFichateUsers(mysql, tableName, columns);

    console.log('Migrando usuarios al CRM...\n');

    const results = { inserted: 0, skipped: 0, errors: 0 };

    for (const row of fichateUsers) {
      try {
        const user = {
          nombre: row.nombre || row.email.split('@')[0],
          email: row.email,
          rol: mapRole(row.rol_original),
          password: DEFAULT_PASSWORD, // Siempre password temporal, no migramos hashes MySQL→bcrypt
        };

        const result = await insertUserCRM(user, dryRun);
        if (result.action === 'inserted' || result.action === 'dry-run') results.inserted++;
        else results.skipped++;
      } catch (err) {
        console.error(`  ❌ Error migrando ${row.email}: ${err.message}`);
        results.errors++;
      }
    }

    console.log('\n========================================');
    console.log(`Migración ${dryRun ? '(dry-run) ' : ''}completada:`);
    console.log(`  ${dryRun ? 'Por insertar' : 'Insertados'}: ${results.inserted}`);
    console.log(`  Saltados (ya existían): ${results.skipped}`);
    console.log(`  Errores: ${results.errors}`);
    if (!dryRun && results.inserted > 0) {
      console.log(`\n⚠️  Password temporal para todos: ${DEFAULT_PASSWORD}`);
      console.log('   Los usuarios deben cambiarla tras el primer login.');
    }
    console.log('========================================\n');
  } finally {
    await mysql.end();
    await pgPool.end();
  }
}

// =============================================
// INSERCIÓN MANUAL
// =============================================

async function migrateManual(dryRun) {
  if (MANUAL_USERS.length === 0) {
    console.error('\n❌ No hay usuarios en la lista MANUAL_USERS.');
    console.error('   Edita backend/scripts/migrate-users.js y añade los usuarios.\n');
    process.exit(1);
  }

  console.log(`\nInsertando ${MANUAL_USERS.length} usuarios manualmente...\n`);

  const results = { inserted: 0, skipped: 0, errors: 0 };

  for (const user of MANUAL_USERS) {
    try {
      const result = await insertUserCRM({
        ...user,
        password: user.password || DEFAULT_PASSWORD,
      }, dryRun);
      if (result.action === 'inserted' || result.action === 'dry-run') results.inserted++;
      else results.skipped++;
    } catch (err) {
      console.error(`  ❌ Error insertando ${user.email}: ${err.message}`);
      results.errors++;
    }
  }

  console.log('\n========================================');
  console.log(`Inserción manual ${dryRun ? '(dry-run) ' : ''}completada:`);
  console.log(`  ${dryRun ? 'Por insertar' : 'Insertados'}: ${results.inserted}`);
  console.log(`  Saltados (ya existían): ${results.skipped}`);
  console.log(`  Errores: ${results.errors}`);
  if (!dryRun && results.inserted > 0) {
    console.log(`\n⚠️  Password temporal para todos: ${DEFAULT_PASSWORD}`);
    console.log('   Los usuarios deben cambiarla tras el primer login.');
  }
  console.log('========================================\n');

  await pgPool.end();
}

// =============================================
// MAIN
// =============================================

const args = process.argv.slice(2);
const isManual = args.includes('--manual');
const isDryRun = args.includes('--dry-run');

if (isDryRun) {
  console.log('🔍 Modo dry-run: no se modificará ninguna base de datos.\n');
}

(isManual ? migrateManual(isDryRun) : migrateFromMySQL(isDryRun)).catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
