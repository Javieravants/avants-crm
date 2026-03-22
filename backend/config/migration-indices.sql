-- Índices de rendimiento para queries frecuentes
-- Fecha: 2026-03-22

CREATE INDEX IF NOT EXISTS idx_tickets_estado ON tickets(estado);
CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tickets_compania ON tickets(compania);
CREATE INDEX IF NOT EXISTS idx_persona_notas_created ON persona_notas(persona_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deals_status_pipeline ON deals(pipedrive_status, pipeline_id) WHERE pipedrive_status = 'open';
CREATE INDEX IF NOT EXISTS idx_personas_nombre_trgm ON personas USING gin(nombre gin_trgm_ops);
