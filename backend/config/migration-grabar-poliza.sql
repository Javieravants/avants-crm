-- Migración: tabla asegurados + columnas faltantes en personas
-- Fecha: 24/03/2026

-- Columnas faltantes en personas
ALTER TABLE personas ADD COLUMN IF NOT EXISTS provincia VARCHAR(100);
ALTER TABLE personas ADD COLUMN IF NOT EXISTS localidad VARCHAR(100);
ALTER TABLE personas ADD COLUMN IF NOT EXISTS iban VARCHAR(34);

-- Tabla asegurados
CREATE TABLE IF NOT EXISTS asegurados (
  id           SERIAL PRIMARY KEY,
  persona_id   INTEGER REFERENCES personas(id) ON DELETE CASCADE,
  deal_id      INTEGER REFERENCES deals(id) ON DELETE SET NULL,
  tenant_id    INTEGER DEFAULT 1,
  nombre       VARCHAR(255) NOT NULL,
  dni          VARCHAR(20),
  fecha_nac    DATE,
  sexo         VARCHAR(10),
  parentesco   VARCHAR(50),
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asegurados_persona ON asegurados(persona_id);
CREATE INDEX IF NOT EXISTS idx_asegurados_deal ON asegurados(deal_id);
