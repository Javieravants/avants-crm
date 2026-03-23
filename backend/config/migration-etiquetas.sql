-- Migración: Sistema de etiquetas
-- Fecha: 23/03/2026

CREATE TABLE IF NOT EXISTS etiquetas (
  id         SERIAL PRIMARY KEY,
  tenant_id  INTEGER DEFAULT 1 REFERENCES tenants(id),
  nombre     VARCHAR(100) NOT NULL,
  color      VARCHAR(7) DEFAULT '#009DDD',
  origen     VARCHAR(20) DEFAULT 'manual',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS persona_etiquetas (
  persona_id  INTEGER REFERENCES personas(id) ON DELETE CASCADE,
  etiqueta_id INTEGER REFERENCES etiquetas(id) ON DELETE CASCADE,
  PRIMARY KEY (persona_id, etiqueta_id)
);

CREATE TABLE IF NOT EXISTS deal_etiquetas (
  deal_id     INTEGER REFERENCES deals(id) ON DELETE CASCADE,
  etiqueta_id INTEGER REFERENCES etiquetas(id) ON DELETE CASCADE,
  PRIMARY KEY (deal_id, etiqueta_id)
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_persona_etiquetas_persona ON persona_etiquetas(persona_id);
CREATE INDEX IF NOT EXISTS idx_persona_etiquetas_etiqueta ON persona_etiquetas(etiqueta_id);
CREATE INDEX IF NOT EXISTS idx_deal_etiquetas_deal ON deal_etiquetas(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_etiquetas_etiqueta ON deal_etiquetas(etiqueta_id);
CREATE INDEX IF NOT EXISTS idx_etiquetas_nombre ON etiquetas(nombre);

-- Unique constraint para evitar duplicados por nombre y tenant
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'etiquetas_tenant_nombre_unique') THEN
    ALTER TABLE etiquetas ADD CONSTRAINT etiquetas_tenant_nombre_unique UNIQUE (tenant_id, nombre);
  END IF;
END $$;
