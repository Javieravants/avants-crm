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
  num_asegurados = COALESCE(num_asegurados, (datos_extra->>'n_asegurados')::INTEGER),
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
