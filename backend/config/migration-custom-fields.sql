-- Migración: columnas dedicadas para campos custom de Pipedrive
-- Fecha: 2026-03-23

-- Deals: campos de póliza
ALTER TABLE deals ADD COLUMN IF NOT EXISTS num_solicitud VARCHAR(100);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS tipo_poliza VARCHAR(100);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS frecuencia_pago VARCHAR(50);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS descuento VARCHAR(50);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS num_asegurados INTEGER;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS iban VARCHAR(50);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS observaciones TEXT;

-- Personas: datos del asegurado titular
ALTER TABLE personas ADD COLUMN IF NOT EXISTS dni VARCHAR(20);
ALTER TABLE personas ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS sexo VARCHAR(10);
ALTER TABLE personas ADD COLUMN IF NOT EXISTS direccion TEXT;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS codigo_postal VARCHAR(10);
ALTER TABLE personas ADD COLUMN IF NOT EXISTS nacionalidad VARCHAR(100);
ALTER TABLE personas ADD COLUMN IF NOT EXISTS estado_civil VARCHAR(50);
ALTER TABLE personas ADD COLUMN IF NOT EXISTS tiene_seguro_salud BOOLEAN;
ALTER TABLE personas ADD COLUMN IF NOT EXISTS compania_actual VARCHAR(100);

-- Rellenar desde datos_extra existentes
UPDATE deals SET
  num_solicitud = COALESCE(num_solicitud, datos_extra->>'n_solicitud'),
  tipo_poliza = COALESCE(tipo_poliza, datos_extra->>'tipo_poliza'),
  frecuencia_pago = COALESCE(frecuencia_pago, datos_extra->>'frecuencia_pago'),
  descuento = COALESCE(descuento, datos_extra->>'descuento'),
  num_asegurados = COALESCE(num_asegurados, NULLIF(regexp_replace(datos_extra->>'n_asegurados', '[^0-9]', '', 'g'), '')::INTEGER),
  iban = COALESCE(iban, datos_extra->>'iban'),
  observaciones = COALESCE(observaciones, datos_extra->>'observaciones')
WHERE datos_extra IS NOT NULL AND datos_extra != '{}';

UPDATE personas SET
  direccion = COALESCE(direccion, sub.dir),
  codigo_postal = COALESCE(codigo_postal, sub.cp),
  nacionalidad = COALESCE(nacionalidad, sub.nac)
FROM (
  SELECT DISTINCT ON (persona_id) persona_id,
    datos_extra->>'direccion' as dir,
    datos_extra->>'cod_postal' as cp,
    datos_extra->>'nacionalidad' as nac
  FROM deals
  WHERE persona_id IS NOT NULL AND datos_extra IS NOT NULL AND datos_extra != '{}'
  ORDER BY persona_id, created_at DESC
) sub
WHERE personas.id = sub.persona_id;

-- Columnas adicionales para personas
ALTER TABLE personas ADD COLUMN IF NOT EXISTS localidad VARCHAR(100);
ALTER TABLE personas ADD COLUMN IF NOT EXISTS provincia VARCHAR(60);

-- Tabla asegurados vinculados a persona
CREATE TABLE IF NOT EXISTS asegurados (
  id              SERIAL PRIMARY KEY,
  persona_id      INTEGER NOT NULL REFERENCES personas(id),
  deal_id         INTEGER REFERENCES deals(id),
  nombre          VARCHAR(200) NOT NULL,
  dni             VARCHAR(20),
  fecha_nacimiento DATE,
  sexo            VARCHAR(10),
  parentesco      VARCHAR(40),
  orden           INTEGER DEFAULT 1,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aseg_persona ON asegurados(persona_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_aseg_persona_nombre ON asegurados(persona_id, nombre);

-- Unique en propuestas.deal_id para ON CONFLICT upsert
CREATE UNIQUE INDEX IF NOT EXISTS idx_propuestas_deal_id ON propuestas(deal_id) WHERE deal_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_propuestas_pd_deal ON propuestas(pipedrive_deal_id) WHERE pipedrive_deal_id IS NOT NULL;
