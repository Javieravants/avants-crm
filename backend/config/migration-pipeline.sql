-- Migración: Pipeline Kanban nativo
-- Tablas para embudos, etapas y posicionamiento de deals

-- Pipelines (embudos)
CREATE TABLE IF NOT EXISTS pipelines (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  color VARCHAR(20) DEFAULT '#ff4a6e',
  orden INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  pipedrive_id INTEGER UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Etapas dentro de cada pipeline
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id SERIAL PRIMARY KEY,
  pipeline_id INTEGER REFERENCES pipelines(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  orden INTEGER DEFAULT 0,
  color VARCHAR(20),
  active BOOLEAN DEFAULT true,
  pipedrive_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(pipeline_id, name)
);

CREATE INDEX IF NOT EXISTS idx_stages_pipeline ON pipeline_stages(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_stages_orden ON pipeline_stages(pipeline_id, orden);

-- Extender deals con pipeline_id, stage_id, stage_entered_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='pipeline_id') THEN
    ALTER TABLE deals ADD COLUMN pipeline_id INTEGER REFERENCES pipelines(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='stage_id') THEN
    ALTER TABLE deals ADD COLUMN stage_id INTEGER REFERENCES pipeline_stages(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='stage_entered_at') THEN
    ALTER TABLE deals ADD COLUMN stage_entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_deals_pipeline_id ON deals(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage_id ON deals(stage_id);
CREATE INDEX IF NOT EXISTS idx_deals_pipeline_stage ON deals(pipeline_id, stage_id);

-- Seed pipelines desde Pipedrive (16 pipelines reales)
INSERT INTO pipelines (name, color, orden, pipedrive_id) VALUES
  ('ADESLAS', '#ff4a6e', 0, 1),
  ('DKV', '#3b82f6', 1, 2),
  ('SALUD', '#10b981', 2, 10),
  ('DENTAL', '#f59e0b', 3, 11),
  ('DECESOS', '#8b5cf6', 4, 12),
  ('MASCOTAS', '#06b6d4', 5, 13),
  ('MASCOTAS (legacy)', '#06b6d4', 6, 3),
  ('VIDA CALAHORRA', '#64748b', 7, 5),
  ('PRUEBA VIDA', '#64748b', 8, 7),
  ('AAPEX', '#64748b', 9, 8),
  ('PRUEBAS', '#64748b', 10, 9),
  ('HOGAR', '#f59e0b', 11, 14),
  ('AUTO', '#ef4444', 12, 15),
  ('NEGOCIOS', '#3b82f6', 13, 16),
  ('ELECTRODOMESTICOS', '#8b5cf6', 14, 17),
  ('ACCIDENTES', '#ef4444', 15, 18)
ON CONFLICT (pipedrive_id) DO NOTHING;
