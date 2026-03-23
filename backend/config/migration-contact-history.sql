-- Migración: tabla contact_history para historial unificado de contactos
-- Fecha: 2026-03-23

CREATE TABLE IF NOT EXISTS contact_history (
  id           SERIAL PRIMARY KEY,
  persona_id   INTEGER NOT NULL REFERENCES personas(id),
  deal_id      INTEGER REFERENCES deals(id),
  tipo         VARCHAR(30) NOT NULL,
  subtipo      VARCHAR(30),
  titulo       VARCHAR(255),
  descripcion  TEXT,
  metadata     JSONB DEFAULT '{}',
  agente_id    INTEGER REFERENCES users(id),
  origen       VARCHAR(30) DEFAULT 'manual',
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_history_persona ON contact_history(persona_id);
CREATE INDEX IF NOT EXISTS idx_history_tipo ON contact_history(tipo);
CREATE INDEX IF NOT EXISTS idx_history_created ON contact_history(created_at DESC);
