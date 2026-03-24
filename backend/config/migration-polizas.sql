-- Migración: índices adicionales para pólizas (tabla ya existente)
-- Fecha: 24/03/2026
-- No se crean tablas nuevas: se usan personas + polizas existentes

CREATE INDEX IF NOT EXISTS idx_polizas_n_poliza ON polizas(n_poliza);
CREATE INDEX IF NOT EXISTS idx_polizas_estado ON polizas(estado);
CREATE INDEX IF NOT EXISTS idx_polizas_agente ON polizas(agente_id);
CREATE INDEX IF NOT EXISTS idx_polizas_persona ON polizas(persona_id);
