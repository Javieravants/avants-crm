-- Migración Fichate v2: Ampliar esquema para módulo completo

-- Columnas adicionales en users
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='pin') THEN
    ALTER TABLE users ADD COLUMN pin VARCHAR(10);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='position') THEN
    ALTER TABLE users ADD COLUMN position VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='department') THEN
    ALTER TABLE users ADD COLUMN department VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='start_date') THEN
    ALTER TABLE users ADD COLUMN start_date DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_login') THEN
    ALTER TABLE users ADD COLUMN last_login TIMESTAMP;
  END IF;
END $$;

-- Campos adicionales en absence_requests
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='absence_requests' AND column_name='partial') THEN
    ALTER TABLE absence_requests ADD COLUMN partial BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='absence_requests' AND column_name='time_from') THEN
    ALTER TABLE absence_requests ADD COLUMN time_from TIME;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='absence_requests' AND column_name='time_to') THEN
    ALTER TABLE absence_requests ADD COLUMN time_to TIME;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='absence_requests' AND column_name='attachment_path') THEN
    ALTER TABLE absence_requests ADD COLUMN attachment_path VARCHAR(500);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='absence_requests' AND column_name='attachment_name') THEN
    ALTER TABLE absence_requests ADD COLUMN attachment_name VARCHAR(255);
  END IF;
END $$;

-- Actualizar CHECK constraint de tipo en absence_requests para incluir tipos del original
-- (medical_full, medical_hours mapeados a 'medica' en el CRM)

-- Tabla de credenciales de apps
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'app_credentials') THEN
    CREATE TABLE app_credentials (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      app_name VARCHAR(200) NOT NULL,
      app_url VARCHAR(500),
      username VARCHAR(200),
      password_plain VARCHAR(200),
      notas TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX idx_app_creds_user ON app_credentials(user_id);
  END IF;
END $$;

-- Tabla de alertas de fichaje
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fichate_alerts') THEN
    CREATE TABLE fichate_alerts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      tipo VARCHAR(30) NOT NULL,
      fecha DATE NOT NULL,
      hora_programada TIME,
      hora_real TIME,
      minutos_diff INTEGER,
      leida BOOLEAN DEFAULT false,
      justificada BOOLEAN DEFAULT false,
      motivo_justificacion TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX idx_fichate_alerts_user ON fichate_alerts(user_id);
    CREATE INDEX idx_fichate_alerts_fecha ON fichate_alerts(fecha);
  END IF;
END $$;

-- Tabla de documentos de fichate (nóminas, contratos, etc.)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fichate_documents') THEN
    CREATE TABLE fichate_documents (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      categoria VARCHAR(50) DEFAULT 'otro',
      nombre VARCHAR(255) NOT NULL,
      descripcion TEXT,
      filepath VARCHAR(500) NOT NULL,
      filename VARCHAR(255),
      filesize INTEGER,
      fecha DATE,
      uploaded_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX idx_fichate_docs_user ON fichate_documents(user_id);
    CREATE INDEX idx_fichate_docs_cat ON fichate_documents(categoria);
  END IF;
END $$;
