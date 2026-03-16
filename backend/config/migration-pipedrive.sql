-- =============================================
-- Migración: Integración Pipedrive
-- =============================================

-- Añadir pipedrive_id a personas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='personas' AND column_name='pipedrive_person_id') THEN
    ALTER TABLE personas ADD COLUMN pipedrive_person_id INTEGER UNIQUE;
  END IF;
END $$;

-- Añadir campos Pipedrive a deals
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='pipedrive_id') THEN
    ALTER TABLE deals ADD COLUMN pipedrive_id INTEGER UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='pipedrive_stage') THEN
    ALTER TABLE deals ADD COLUMN pipedrive_stage VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='pipedrive_status') THEN
    ALTER TABLE deals ADD COLUMN pipedrive_status VARCHAR(20);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='pipedrive_owner') THEN
    ALTER TABLE deals ADD COLUMN pipedrive_owner VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='updated_at') THEN
    ALTER TABLE deals ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Log de sincronizaciones Pipedrive
CREATE TABLE IF NOT EXISTS pipedrive_sync_logs (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL,
  personas_importadas INTEGER DEFAULT 0,
  personas_actualizadas INTEGER DEFAULT 0,
  deals_importados INTEGER DEFAULT 0,
  deals_actualizados INTEGER DEFAULT 0,
  errores INTEGER DEFAULT 0,
  detalle TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_personas_pipedrive ON personas(pipedrive_person_id);
CREATE INDEX IF NOT EXISTS idx_deals_pipedrive ON deals(pipedrive_id);
