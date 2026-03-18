-- Migración: Módulo Grabaciones / Pólizas
-- Tabla permanente de pólizas vinculadas a personas

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'polizas') THEN
    CREATE TABLE polizas (
      id SERIAL PRIMARY KEY,
      persona_id INTEGER REFERENCES personas(id) ON DELETE CASCADE,
      deal_id INTEGER REFERENCES deals(id) ON DELETE SET NULL,
      agente_id INTEGER REFERENCES users(id),
      compania VARCHAR(100) NOT NULL DEFAULT 'ADESLAS',
      producto VARCHAR(200) NOT NULL,
      tipo_producto VARCHAR(30) DEFAULT 'SALUD',
      n_solicitud VARCHAR(100),
      n_poliza VARCHAR(100),
      n_grabacion VARCHAR(100),
      fecha_grabacion DATE,
      fecha_efecto DATE,
      forma_pago VARCHAR(30) DEFAULT 'MENSUAL',
      descuento DECIMAL(5,2) DEFAULT 0,
      descuento_contra DECIMAL(5,2) DEFAULT 0,
      prima_mensual DECIMAL(10,2),
      prima_anual DECIMAL(10,2),
      beneficio_base DECIMAL(10,2),
      n_asegurados INTEGER DEFAULT 1,
      campana VARCHAR(200),
      campana_puntos INTEGER DEFAULT 0,
      dental VARCHAR(100),
      carencias TEXT,
      enviada_ccpp BOOLEAN DEFAULT false,
      estado VARCHAR(30) DEFAULT 'grabado'
        CHECK (estado IN ('grabado','solicitud_enviada','aceptado','poliza_emitida','rechazado','baja','impago')),
      -- Datos del tomador (JSONB para flexibilidad persona/empresa)
      datos_titular JSONB DEFAULT '{}',
      -- Asegurados
      asegurados_data JSONB DEFAULT '[]',
      -- Cuestionario de salud
      cuestionario_salud JSONB DEFAULT '{}',
      -- Datos de mascota (si aplica)
      datos_mascota JSONB DEFAULT '{}',
      -- Script de grabación generado
      script_grabacion TEXT,
      nota_estructurada TEXT,
      comentarios TEXT,
      -- Pipedrive sync
      pipedrive_deal_id INTEGER,
      pipedrive_synced BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX idx_polizas_persona ON polizas(persona_id);
    CREATE INDEX idx_polizas_deal ON polizas(deal_id);
    CREATE INDEX idx_polizas_estado ON polizas(estado);
    CREATE INDEX idx_polizas_n_poliza ON polizas(n_poliza);
    CREATE INDEX idx_polizas_agente ON polizas(agente_id);
  END IF;
END $$;

-- Documentos vinculados a pólizas
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'poliza_documentos') THEN
    CREATE TABLE poliza_documentos (
      id SERIAL PRIMARY KEY,
      poliza_id INTEGER REFERENCES polizas(id) ON DELETE CASCADE,
      nombre VARCHAR(255) NOT NULL,
      tipo VARCHAR(50),
      filepath VARCHAR(500) NOT NULL,
      uploaded_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX idx_poliza_docs_poliza ON poliza_documentos(poliza_id);
  END IF;
END $$;

-- Añadir estado 'grabado' a deals si no existe el check
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deals' AND column_name = 'estado_grabacion'
  ) THEN
    ALTER TABLE deals ADD COLUMN estado_grabacion VARCHAR(30) DEFAULT NULL;
  END IF;
END $$;
