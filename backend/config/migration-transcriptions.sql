-- Migracion: Transcripciones de llamadas con Deepgram
-- Fecha: 2026-04-06

CREATE TABLE IF NOT EXISTS call_transcriptions (
  id                   SERIAL PRIMARY KEY,
  tenant_id            INTEGER NOT NULL DEFAULT 1,
  contact_id           INTEGER REFERENCES personas(id) ON DELETE SET NULL,
  cloudtalk_call_id    VARCHAR(255),
  recording_url        TEXT,
  duracion_segundos    INTEGER,
  transcripcion        TEXT,
  resumen_ia           TEXT,
  resultado_llamada    VARCHAR(50),
  direction            VARCHAR(20),
  agent_email          VARCHAR(255),
  deepgram_job_id      VARCHAR(255),
  estado               VARCHAR(20) DEFAULT 'pendiente',
  error_mensaje        TEXT,
  created_at           TIMESTAMP DEFAULT NOW(),
  updated_at           TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transcriptions_tenant ON call_transcriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_contact ON call_transcriptions(contact_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_estado ON call_transcriptions(estado);
CREATE INDEX IF NOT EXISTS idx_transcriptions_call ON call_transcriptions(cloudtalk_call_id);
