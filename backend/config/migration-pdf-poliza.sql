-- Migración: campos PDF en deals y tickets
ALTER TABLE deals ADD COLUMN IF NOT EXISTS grabacion_pdf_url VARCHAR(500);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS grabacion_pdf_url VARCHAR(500);
