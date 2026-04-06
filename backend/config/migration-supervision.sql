-- Migracion: Panel de supervision en tiempo real
-- Fecha: 2026-04-06

CREATE TABLE IF NOT EXISTS agent_sessions (
  id                 SERIAL PRIMARY KEY,
  tenant_id          INTEGER NOT NULL DEFAULT 1,
  user_id            INTEGER REFERENCES users(id) ON DELETE CASCADE,
  estado             VARCHAR(30) NOT NULL DEFAULT 'activo',
  estado_desde       TIMESTAMP DEFAULT NOW(),
  ultima_actividad   TIMESTAMP DEFAULT NOW(),
  socket_id          VARCHAR(100),
  turno              VARCHAR(10),
  pausa_inicio       TIMESTAMP,
  pausa_tipo         VARCHAR(20),
  created_at         TIMESTAMP DEFAULT NOW(),
  updated_at         TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_sessions_tenant ON agent_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_user ON agent_sessions(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_sessions_unique ON agent_sessions(tenant_id, user_id);

CREATE TABLE IF NOT EXISTS supervisor_messages (
  id                 SERIAL PRIMARY KEY,
  tenant_id          INTEGER NOT NULL DEFAULT 1,
  from_user_id       INTEGER REFERENCES users(id),
  to_user_id         INTEGER REFERENCES users(id),
  mensaje            TEXT NOT NULL,
  tipo               VARCHAR(20) DEFAULT 'aviso',
  confirmado_at      TIMESTAMP,
  created_at         TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supervisor_messages_tenant ON supervisor_messages(tenant_id);
