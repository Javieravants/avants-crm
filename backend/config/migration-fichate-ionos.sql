-- Migración: Importar esquema completo de Fichate desde IONOS (MySQL → PostgreSQL)
-- Tablas con prefijo ft_ para no colisionar con tablas existentes del CRM

-- Empresa Fichate
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ft_companies') THEN
    CREATE TABLE ft_companies (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      cif VARCHAR(50),
      address TEXT,
      phone VARCHAR(50),
      email VARCHAR(255),
      vacation_days_default INTEGER DEFAULT 22,
      daily_hours DECIMAL(4,2) DEFAULT 7.50,
      schedule_default VARCHAR(100),
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  END IF;
END $$;

-- Usuarios Fichate (separados de users del CRM)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ft_users') THEN
    CREATE TABLE ft_users (
      id SERIAL PRIMARY KEY,
      company_id INTEGER REFERENCES ft_companies(id),
      email VARCHAR(255),
      password VARCHAR(255),
      password_plain VARCHAR(255),
      pin VARCHAR(10),
      name VARCHAR(255) NOT NULL,
      dni VARCHAR(20),
      role VARCHAR(20) DEFAULT 'agent',
      team VARCHAR(100),
      phone VARCHAR(50),
      position VARCHAR(100),
      department VARCHAR(100),
      schedule VARCHAR(100),
      daily_hours DECIMAL(4,2) DEFAULT 7.50,
      vacation_days INTEGER DEFAULT 22,
      used_vacation_days INTEGER DEFAULT 0,
      start_date DATE,
      avatar_url VARCHAR(500),
      cloudtalk_extension VARCHAR(20),
      cloudtalk_agent_id VARCHAR(50),
      status VARCHAR(20) DEFAULT 'offline',
      is_active SMALLINT DEFAULT 1,
      last_login TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX idx_ft_users_email ON ft_users(email);
    CREATE INDEX idx_ft_users_company ON ft_users(company_id);
  END IF;
END $$;

-- Sesiones Fichate
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ft_sessions') THEN
    CREATE TABLE ft_sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES ft_users(id) ON DELETE CASCADE,
      token VARCHAR(64) NOT NULL,
      ip_address VARCHAR(45),
      user_agent TEXT,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX idx_ft_sessions_token ON ft_sessions(token);
  END IF;
END $$;

-- Registros de fichaje
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ft_time_records') THEN
    CREATE TABLE ft_time_records (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES ft_users(id) ON DELETE CASCADE,
      company_id INTEGER REFERENCES ft_companies(id),
      date DATE NOT NULL,
      clock_in TIMESTAMP,
      clock_out TIMESTAMP,
      type VARCHAR(20) DEFAULT 'normal',
      notes TEXT,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX idx_ft_time_user ON ft_time_records(user_id);
    CREATE INDEX idx_ft_time_date ON ft_time_records(date);
  END IF;
END $$;

-- Solicitudes de ausencia
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ft_absence_requests') THEN
    CREATE TABLE ft_absence_requests (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES ft_users(id) ON DELETE CASCADE,
      company_id INTEGER REFERENCES ft_companies(id),
      type VARCHAR(30) NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE,
      partial SMALLINT DEFAULT 0,
      hours_requested DECIMAL(4,2),
      time_from TIME,
      time_to TIME,
      status VARCHAR(20) DEFAULT 'pending',
      notes TEXT,
      attachment_path VARCHAR(500),
      attachment_name VARCHAR(255),
      reject_reason TEXT,
      reviewed_by INTEGER,
      reviewed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX idx_ft_absence_user ON ft_absence_requests(user_id);
    CREATE INDEX idx_ft_absence_status ON ft_absence_requests(status);
  END IF;
END $$;

-- Documentos
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ft_documents') THEN
    CREATE TABLE ft_documents (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES ft_users(id) ON DELETE CASCADE,
      company_id INTEGER REFERENCES ft_companies(id),
      category VARCHAR(50),
      name VARCHAR(255),
      description TEXT,
      file_path VARCHAR(500),
      file_name VARCHAR(255),
      file_size INTEGER,
      date DATE,
      uploaded_by INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX idx_ft_docs_user ON ft_documents(user_id);
  END IF;
END $$;

-- Festivos
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ft_holidays') THEN
    CREATE TABLE ft_holidays (
      id SERIAL PRIMARY KEY,
      company_id INTEGER,
      date DATE NOT NULL,
      name VARCHAR(200) NOT NULL,
      type VARCHAR(30) DEFAULT 'national',
      year INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  END IF;
END $$;

-- Turnos
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ft_shifts') THEN
    CREATE TABLE ft_shifts (
      id SERIAL PRIMARY KEY,
      company_id INTEGER,
      name VARCHAR(100) NOT NULL,
      start_time TIME,
      end_time TIME,
      daily_hours DECIMAL(4,2) DEFAULT 7.50,
      break_time VARCHAR(50),
      color VARCHAR(20) DEFAULT '#ff4a6e',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  END IF;
END $$;

-- Credenciales de apps
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ft_app_credentials') THEN
    CREATE TABLE ft_app_credentials (
      id SERIAL PRIMARY KEY,
      company_id INTEGER,
      user_id INTEGER,
      app_name VARCHAR(200) NOT NULL,
      app_url VARCHAR(500),
      username VARCHAR(200),
      password_plain VARCHAR(200),
      notes TEXT,
      created_by INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  END IF;
END $$;

-- Alertas
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ft_alerts') THEN
    CREATE TABLE ft_alerts (
      id SERIAL PRIMARY KEY,
      company_id INTEGER,
      user_id INTEGER,
      type VARCHAR(30),
      alert_date DATE,
      scheduled_time TIME,
      actual_time TIME,
      minutes_diff INTEGER,
      is_read BOOLEAN DEFAULT false,
      is_justified BOOLEAN DEFAULT false,
      justify_reason TEXT,
      email_sent BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  END IF;
END $$;
