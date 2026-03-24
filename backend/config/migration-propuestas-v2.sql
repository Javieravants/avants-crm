-- Migración: campos nuevos en propuestas
ALTER TABLE propuestas ADD COLUMN IF NOT EXISTS tipo_poliza VARCHAR(50);
ALTER TABLE propuestas ADD COLUMN IF NOT EXISTS fecha_validez DATE;
