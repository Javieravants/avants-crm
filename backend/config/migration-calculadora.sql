-- Migración: Módulo Calculadora / Propuestas
-- Tabla para guardar cotizaciones generadas por la calculadora

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'propuestas') THEN
    CREATE TABLE propuestas (
      id SERIAL PRIMARY KEY,
      persona_id INTEGER REFERENCES personas(id) ON DELETE SET NULL,
      deal_id INTEGER REFERENCES deals(id) ON DELETE SET NULL,
      agente_id INTEGER REFERENCES users(id),
      compania VARCHAR(100) NOT NULL DEFAULT 'ADESLAS',
      producto VARCHAR(200) NOT NULL,
      modalidad VARCHAR(200),
      zona INTEGER,
      provincia VARCHAR(100),
      num_asegurados INTEGER DEFAULT 1,
      prima_mensual DECIMAL(10,2),
      prima_anual DECIMAL(10,2),
      descuento DECIMAL(5,2) DEFAULT 0,
      descuento_contra DECIMAL(5,2) DEFAULT 0,
      campana_puntos INTEGER DEFAULT 0,
      fecha_efecto DATE,
      forma_pago VARCHAR(30) DEFAULT 'mensual',
      asegurados_data JSONB DEFAULT '[]',
      desglose JSONB DEFAULT '{}',
      nota_contenido TEXT,
      pdf_url VARCHAR(500),
      pipedrive_deal_id INTEGER,
      pipedrive_synced BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX idx_propuestas_persona ON propuestas(persona_id);
    CREATE INDEX idx_propuestas_deal ON propuestas(deal_id);
    CREATE INDEX idx_propuestas_agente ON propuestas(agente_id);
  END IF;
END $$;
