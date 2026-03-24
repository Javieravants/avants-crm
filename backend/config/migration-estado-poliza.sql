-- Migración: campos estado póliza en deals
ALTER TABLE deals ADD COLUMN IF NOT EXISTS num_poliza_definitivo VARCHAR(100);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS estado_poliza VARCHAR(30) DEFAULT 'pendiente';
