-- Migración: columnas adicionales para importación de pólizas desde Sheet
-- Fecha: 24/03/2026

-- Columnas nuevas necesarias para la importación
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS recibo_mensual NUMERIC(12,2);
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS origen_lead TEXT;
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS mes_alta VARCHAR(50);
ALTER TABLE polizas ADD COLUMN IF NOT EXISTS agente_nombre VARCHAR(255);

-- Índices
CREATE INDEX IF NOT EXISTS idx_polizas_n_poliza ON polizas(n_poliza);
CREATE INDEX IF NOT EXISTS idx_polizas_estado ON polizas(estado);
CREATE INDEX IF NOT EXISTS idx_polizas_agente ON polizas(agente_id);
CREATE INDEX IF NOT EXISTS idx_polizas_persona ON polizas(persona_id);
