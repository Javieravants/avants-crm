-- Migración: WhatsApp Messages
-- Historial de mensajes WhatsApp vinculados a personas

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id              SERIAL PRIMARY KEY,
  persona_id      INTEGER NOT NULL REFERENCES personas(id),
  agente_id       INTEGER REFERENCES users(id),
  direccion       VARCHAR(10) NOT NULL CHECK (direccion IN ('saliente','entrante')),
  tipo            VARCHAR(20) NOT NULL CHECK (tipo IN ('texto','plantilla','documento','imagen')),
  plantilla       VARCHAR(100),
  contenido       TEXT,
  media_url       TEXT,
  whatsapp_msg_id VARCHAR(100),
  estado          VARCHAR(20) DEFAULT 'enviado' CHECK (estado IN ('enviado','entregado','leido','error')),
  error_detalle   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wamsg_persona ON whatsapp_messages(persona_id);
CREATE INDEX IF NOT EXISTS idx_wamsg_created ON whatsapp_messages(created_at DESC);
