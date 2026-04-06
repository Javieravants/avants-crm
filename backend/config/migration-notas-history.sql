-- Migración: índice de deduplicación para notas de Pipedrive en contact_history
-- Fecha: 2026-04-06

-- Índice para deduplicar notas de Pipedrive por su ID nativo
CREATE INDEX IF NOT EXISTS idx_history_pd_note
  ON contact_history ((metadata->>'pipedrive_note_id'));

-- Índice para deduplicar notas migradas desde persona_notas
CREATE INDEX IF NOT EXISTS idx_history_migrated_nota
  ON contact_history ((metadata->>'persona_nota_id'));
