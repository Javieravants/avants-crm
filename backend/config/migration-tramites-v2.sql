-- =============================================
-- Migración: Trámites v2 — Kanban + Comunicaciones
-- =============================================

-- Tabla de comunicaciones (historial email/whatsapp/notas)
CREATE TABLE IF NOT EXISTS tramite_comunicaciones (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('email','whatsapp','nota','sistema')),
  direccion VARCHAR(10) DEFAULT 'salida' CHECK (direccion IN ('entrada','salida')),
  destinatario VARCHAR(255),
  asunto VARCHAR(255),
  mensaje TEXT,
  agente_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tramite_comm_ticket ON tramite_comunicaciones(ticket_id);

-- Campos adicionales en tickets
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='contacto_id') THEN
    ALTER TABLE tickets ADD COLUMN contacto_id INTEGER REFERENCES personas(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='compania') THEN
    ALTER TABLE tickets ADD COLUMN compania VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='num_solicitud') THEN
    ALTER TABLE tickets ADD COLUMN num_solicitud VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='num_poliza') THEN
    ALTER TABLE tickets ADD COLUMN num_poliza VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='urgencia') THEN
    ALTER TABLE tickets ADD COLUMN urgencia VARCHAR(20) DEFAULT 'normal';
  END IF;
END $$;
