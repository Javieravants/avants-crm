-- Migración: tabla documentos para adjuntos de personas
-- Fecha: 2026-03-22

CREATE TABLE IF NOT EXISTS persona_documentos (
  id SERIAL PRIMARY KEY,
  persona_id INTEGER REFERENCES personas(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  categoria VARCHAR(50) DEFAULT 'Otro',
  tipo_mime VARCHAR(100),
  tamano INTEGER,
  ruta VARCHAR(500) NOT NULL,
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_persona_docs_persona ON persona_documentos(persona_id);
