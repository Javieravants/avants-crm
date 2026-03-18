-- Migración: tablas para CloudTalk y Facebook Lead Ads
-- 2026-03-17

-- Historial de llamadas (CloudTalk)
CREATE TABLE IF NOT EXISTS call_history (
  id SERIAL PRIMARY KEY,
  persona_id INTEGER REFERENCES personas(id),
  telefono VARCHAR(50),
  direccion VARCHAR(20) DEFAULT 'outbound', -- inbound/outbound
  duracion INTEGER DEFAULT 0, -- segundos
  estado VARCHAR(50), -- answered, no_answer, busy, voicemail, failed
  agente_nombre VARCHAR(255),
  agente_email VARCHAR(255),
  recording_url TEXT,
  cloudtalk_call_id VARCHAR(100) UNIQUE,
  cloudtalk_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_call_history_persona ON call_history(persona_id);
CREATE INDEX IF NOT EXISTS idx_call_history_telefono ON call_history(telefono);
CREATE INDEX IF NOT EXISTS idx_call_history_cloudtalk ON call_history(cloudtalk_call_id);

-- Facebook Lead Ads: mapeo form → pipeline
CREATE TABLE IF NOT EXISTS fb_form_mappings (
  id SERIAL PRIMARY KEY,
  form_id VARCHAR(100) UNIQUE NOT NULL,
  form_name VARCHAR(255),
  pipeline VARCHAR(100), -- ADESLAS, DKV, MASCOTAS, etc.
  etapa VARCHAR(100) DEFAULT 'Intentando Contactar',
  agente_id INTEGER REFERENCES users(id),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Facebook leads recibidos (log)
CREATE TABLE IF NOT EXISTS fb_leads (
  id SERIAL PRIMARY KEY,
  leadgen_id VARCHAR(100) UNIQUE NOT NULL,
  form_id VARCHAR(100),
  ad_id VARCHAR(100),
  campaign_id VARCHAR(100),
  persona_id INTEGER REFERENCES personas(id),
  deal_id INTEGER REFERENCES deals(id),
  raw_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fb_leads_persona ON fb_leads(persona_id);
CREATE INDEX IF NOT EXISTS idx_fb_leads_leadgen ON fb_leads(leadgen_id);
