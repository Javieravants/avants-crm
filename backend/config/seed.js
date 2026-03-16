if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
}
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function seed() {
  try {
    // Orden: base → tickets → importación (crea personas) → pipedrive (modifica personas)
    const migrations = [
      ['init.sql', 'Tablas base'],
      ['migration-tickets.sql', 'Tickets'],
      ['migration-import.sql', 'Importación'],
      ['migration-pipedrive.sql', 'Pipedrive'],
    ];

    for (const [file, label] of migrations) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        const sql = fs.readFileSync(filePath, 'utf8');
        await pool.query(sql);
        console.log(`Migración ${label} ejecutada correctamente.`);
      }
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
