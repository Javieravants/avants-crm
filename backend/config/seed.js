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
      ['migration-personas.sql', 'Personas'],
      ['migration-fichate-ionos.sql', 'Fichate (tablas ft_)'],
      ['migration-pipeline.sql', 'Pipeline Kanban'],
      ['migration-grabaciones.sql', 'Grabaciones y Pólizas'],
      ['migration-calculadora.sql', 'Calculadora y Propuestas'],
      ['migration-tramites-v2.sql', 'Trámites v2 — Kanban + Comunicaciones'],
      ['migration-custom-fields.sql', 'Campos custom Pipedrive'],
      ['migration-whatsapp.sql', 'WhatsApp Messages'],
    ];

    for (const [file, label] of migrations) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        const sql = fs.readFileSync(filePath, 'utf8');
        await pool.query(sql);
        console.log(`Migración ${label} ejecutada correctamente.`);
      }
    }

    // Crear usuarios si no existen
    const users = [
      { nombre: 'Admin', email: 'admin@avants.es', password: 'admin123', rol: 'admin' },
      { nombre: 'Javier Hernández', email: 'javier@segurosdesaludonline.es', password: 'Avants2026!', rol: 'admin' },
      { nombre: 'Jose Antonio Recio Martín', email: 'pilardiazdkv@gmail.com', password: '25095679B', rol: 'supervisor' },
      { nombre: 'Ana Frida Garín Figueroa', email: 'ana@segurosdesaludonline.es', password: '77652490M', rol: 'agent' },
      { nombre: 'Andrea del Carmen Stefani', email: 'andrea@segurosdesaludonline.es', password: 'Y9650013D', rol: 'agent' },
      { nombre: 'Beatriz Sánchez Parras', email: 'beatrizdkvhealth@gmail.com', password: '05655815T', rol: 'agent' },
      { nombre: 'Diego Ramírez Nogales', email: 'diego@segurosdesaludonline.es', password: 'X3895650W', rol: 'agent' },
      { nombre: 'Eva Mora Mancebo', email: 'evamora@segurosdesaludonline.es', password: '05911308D', rol: 'agent' },
      { nombre: 'Eva Polo Toribio', email: 'eva@segurosdesaludonline.es', password: '05660307F', rol: 'agent' },
      { nombre: 'Laura Carpintero Nieto', email: 'laura@segurosdesaludonline.es', password: '05709877N', rol: 'agent' },
      { nombre: 'María Luisa Cano Dorado', email: 'marisa@segurosdesaludonline.es', password: '43437897M', rol: 'agent' },
      { nombre: 'María Montserrat González González', email: 'montse@segurosdesaludonline.es', password: '05668501J', rol: 'agent' },
      { nombre: 'Mirtha Raquel Contreras Velázquez', email: 'raquel@segurosdesaludonline.es', password: 'Z0093678G', rol: 'agent' },
      { nombre: 'Patricia Cañas Rivas', email: 'patricia@segurosdesaludonline.es', password: '05719628B', rol: 'agent' },
      { nombre: 'Raúl Llerena Mozos', email: 'raultelegestion@gmail.com', password: '05907032B', rol: 'agent' },
      { nombre: 'Silvia Muñoz Jiménez', email: 'silvia@segurosdesaludonline.es', password: '05661384A', rol: 'agent' },
      { nombre: 'Yolanda Fernández García', email: 'elviratelegestioncalahorra@gmail.com', password: '70575222K', rol: 'agent' },
    ];

    for (const u of users) {
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [u.email]);
      if (existing.rows.length === 0) {
        const hash = await bcrypt.hash(u.password, 10);
        await pool.query(
          'INSERT INTO users (nombre, email, password_hash, rol, password_visible) VALUES ($1, $2, $3, $4, $5)',
          [u.nombre, u.email, hash, u.rol, u.password]
        );
      }
    }
    console.log(`Usuarios verificados: ${users.length}`);

    // Sincronizar usuarios CRM → ft_users (para que el mapeo por email funcione)
    try {
      const ftCompany = await pool.query('SELECT id FROM ft_companies LIMIT 1');
      let companyId = ftCompany.rows[0]?.id;
      if (!companyId) {
        const ins = await pool.query("INSERT INTO ft_companies (name, email) VALUES ('Avants SL', 'javier@segurosdesaludonline.es') RETURNING id");
        companyId = ins.rows[0].id;
        console.log('Fichate: empresa creada con id', companyId);
      }
      const crmUsers = await pool.query('SELECT nombre, email, rol FROM users');
      let synced = 0;
      for (const u of crmUsers.rows) {
        const exists = await pool.query('SELECT id FROM ft_users WHERE LOWER(email) = LOWER($1)', [u.email]);
        if (exists.rows.length === 0) {
          await pool.query('INSERT INTO ft_users (company_id, name, email, role, is_active) VALUES ($1,$2,$3,$4,1)',
            [companyId, u.nombre, u.email, u.rol]);
          synced++;
        }
      }
      if (synced > 0) console.log(`Fichate: ${synced} usuarios sincronizados desde CRM`);
    } catch (e) {
      console.warn('Fichate sync warning:', e.message);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error en seed:', err);
    process.exit(1);
  }
}

seed();
