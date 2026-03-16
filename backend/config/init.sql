-- Crear base de datos (ejecutar manualmente si no existe)
-- CREATE DATABASE avants_crm;

-- Usuarios del sistema
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('admin', 'supervisor', 'agent')),
  telefono VARCHAR(20),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sesiones/fichajes
CREATE TABLE IF NOT EXISTS fichajes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  tipo VARCHAR(20) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tickets/trámites
CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  agente_id INTEGER REFERENCES users(id),
  supervisor_id INTEGER REFERENCES users(id),
  tipo VARCHAR(50) NOT NULL,
  estado VARCHAR(30) NOT NULL DEFAULT 'nuevo'
    CHECK (estado IN ('nuevo', 'en_gestion', 'esperando', 'resuelto', 'cerrado')),
  descripcion TEXT,
  pipedrive_deal_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);

-- Leads
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  agente_id INTEGER REFERENCES users(id),
  nombre VARCHAR(100),
  telefono VARCHAR(20),
  email VARCHAR(255),
  producto VARCHAR(100),
  estado VARCHAR(30) DEFAULT 'nuevo',
  pipedrive_id VARCHAR(50),
  fuente VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Impagos
CREATE TABLE IF NOT EXISTS impagos (
  id SERIAL PRIMARY KEY,
  poliza VARCHAR(50),
  titular VARCHAR(100),
  agente_id INTEGER REFERENCES users(id),
  importe DECIMAL(10, 2),
  fecha_vencimiento DATE,
  estado VARCHAR(30) DEFAULT 'pendiente',
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Logs de actividad
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  accion VARCHAR(100) NOT NULL,
  detalle TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear usuario admin por defecto (password: admin123)
-- El hash se genera con bcryptjs, rounds=10
-- Ejecutar desde la app con el seed, no manualmente
