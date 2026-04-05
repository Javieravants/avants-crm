-- Migracion: Centro de Conocimiento — base de conocimiento + chat IA
-- Fecha: 2026-04-05

CREATE TABLE IF NOT EXISTS knowledge_base (
  id             SERIAL PRIMARY KEY,
  tenant_id      INTEGER NOT NULL DEFAULT 1,
  tipo           VARCHAR(50) NOT NULL,
  titulo         VARCHAR(255) NOT NULL,
  contenido      TEXT NOT NULL,
  compania_id    INTEGER REFERENCES companias(id) ON DELETE SET NULL,
  vigente_hasta  DATE,
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kb_tenant ON knowledge_base(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kb_tipo ON knowledge_base(tipo);
CREATE INDEX IF NOT EXISTS idx_kb_compania ON knowledge_base(compania_id);

CREATE TABLE IF NOT EXISTS knowledge_chat (
  id                     SERIAL PRIMARY KEY,
  tenant_id              INTEGER NOT NULL DEFAULT 1,
  user_id                INTEGER REFERENCES users(id),
  mensaje_usuario        TEXT NOT NULL,
  respuesta_ia           TEXT NOT NULL,
  conocimiento_extraido  TEXT,
  created_at             TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kc_tenant ON knowledge_chat(tenant_id);

-- Visibilidad: 3 niveles (admin, agentes, todos)
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS visibilidad VARCHAR(20) NOT NULL DEFAULT 'agentes';

-- Migrar valores legacy si existen
UPDATE knowledge_base SET visibilidad = 'admin' WHERE visibilidad = 'interno';
UPDATE knowledge_base SET visibilidad = 'todos' WHERE visibilidad = 'externo';
