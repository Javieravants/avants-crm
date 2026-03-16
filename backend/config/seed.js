require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function seed() {
  try {
    // Ejecutar init.sql
    const sql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
    await pool.query(sql);
    console.log('Tablas base creadas correctamente.');

    // Ejecutar migración de tickets
    const migrationPath = path.join(__dirname, 'migration-tickets.sql');
    if (fs.existsSync(migrationPath)) {
      const migration = fs.readFileSync(migrationPath, 'utf8');
      await pool.query(migration);
      console.log('Migración de tickets ejecutada correctamente.');
    }

    // Ejecutar migración de Pipedrive
    const pipedriveMigrationPath = path.join(__dirname, 'migration-pipedrive.sql');
    if (fs.existsSync(pipedriveMigrationPath)) {
      const pipedriveMigration = fs.readFileSync(pipedriveMigrationPath, 'utf8');
      await pool.query(pipedriveMigration);
      console.log('Migración de Pipedrive ejecutada correctamente.');
    }

    // Ejecutar migración de importación
    const importMigrationPath = path.join(__dirname, 'migration-import.sql');
    if (fs.existsSync(importMigrationPath)) {
      const importMigration = fs.readFileSync(importMigrationPath, 'utf8');
      await pool.query(importMigration);
      console.log('Migración de importación ejecutada correctamente.');
    }

    // Crear admin por defecto si no existe
    const existing = await pool.query("SELECT id FROM users WHERE email = 'admin@avants.es'");
    if (existing.rows.length === 0) {
      const hash = await bcrypt.hash('admin123', 10);
      await pool.query(
        "INSERT INTO users (nombre, email, password_hash, rol) VALUES ('Admin', 'admin@avants.es', $1, 'admin')",
        [hash]
      );
      console.log('Usuario admin creado: admin@avants.es / admin123');
    } else {
      console.log('Usuario admin ya existe.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error en seed:', err);
    process.exit(1);
  }
}

seed();
