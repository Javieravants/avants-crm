-- Migracion: Resultados de llamadas post-call
-- Fecha: 2026-04-06

CREATE TABLE IF NOT EXISTS call_results (
  id                       SERIAL PRIMARY KEY,
  tenant_id                INTEGER NOT NULL DEFAULT 1,
  contact_id               INTEGER REFERENCES personas(id) ON DELETE SET NULL,
  agent_id                 INTEGER REFERENCES users(id) ON DELETE SET NULL,
  duracion_segundos        INTEGER,
  resultado                VARCHAR(50),
  accion_siguiente         VARCHAR(50),
  compania_derivacion_id   INTEGER REFERENCES companias(id) ON DELETE SET NULL,
  propuestas_enviadas      INTEGER[] DEFAULT '{}',
  notas                    TEXT,
  mensaje_whatsapp         TEXT,
  ia_sugerencia_resultado  VARCHAR(50),
  ia_sugerencia_accion     VARCHAR(50),
  ia_razonamiento          TEXT,
  created_at               TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_call_results_tenant ON call_results(tenant_id);
CREATE INDEX IF NOT EXISTS idx_call_results_contact ON call_results(contact_id);
CREATE INDEX IF NOT EXISTS idx_call_results_agent ON call_results(agent_id);
