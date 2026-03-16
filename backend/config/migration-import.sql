-- =============================================
-- Migración: Módulo de Importación Excel
-- =============================================

-- Personas/Clientes (para cruce por DNI)
CREATE TABLE IF NOT EXISTS personas (
  id SERIAL PRIMARY KEY,
  dni VARCHAR(20) UNIQUE,
  nombre VARCHAR(200),
  telefono VARCHAR(20),
  email VARCHAR(255),
  direccion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Deals/Ventas importadas
CREATE TABLE IF NOT EXISTS deals (
  id SERIAL PRIMARY KEY,
  persona_id INTEGER REFERENCES personas(id),
  agente_id INTEGER REFERENCES users(id),
  poliza VARCHAR(50),
  producto VARCHAR(200),
  compania VARCHAR(100),
  prima DECIMAL(10, 2),
  fecha_efecto DATE,
  estado VARCHAR(50) DEFAULT 'activo',
  fuente VARCHAR(100),
  hoja_origen VARCHAR(100),
  pipedrive_deal_id VARCHAR(50),
  datos_extra JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Historial de importaciones
CREATE TABLE IF NOT EXISTS import_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  filename VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) DEFAULT 'ventas',
  hojas_procesadas INTEGER DEFAULT 0,
  filas_procesadas INTEGER DEFAULT 0,
  personas_creadas INTEGER DEFAULT 0,
  deals_creados INTEGER DEFAULT 0,
  errores INTEGER DEFAULT 0,
  detalle_errores JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_personas_dni ON personas(dni);
CREATE INDEX IF NOT EXISTS idx_deals_persona ON deals(persona_id);
CREATE INDEX IF NOT EXISTS idx_deals_poliza ON deals(poliza);
CREATE INDEX IF NOT EXISTS idx_deals_agente ON deals(agente_id);
