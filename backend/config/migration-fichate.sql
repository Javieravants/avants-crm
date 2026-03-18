-- Migración: Módulo Fichate (Control horario y RRHH)

-- Añadir columna DNI a users si no existe
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='dni') THEN
    ALTER TABLE users ADD COLUMN dni VARCHAR(20);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='daily_hours') THEN
    ALTER TABLE users ADD COLUMN daily_hours DECIMAL(4,2) DEFAULT 7.50;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='vacation_days') THEN
    ALTER TABLE users ADD COLUMN vacation_days INTEGER DEFAULT 22;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='used_vacation_days') THEN
    ALTER TABLE users ADD COLUMN used_vacation_days INTEGER DEFAULT 0;
  END IF;
END $$;

-- Registros de fichaje (reemplaza tabla fichajes básica)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'time_records') THEN
    CREATE TABLE time_records (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      fecha DATE NOT NULL DEFAULT CURRENT_DATE,
      clock_in TIMESTAMP,
      clock_out TIMESTAMP,
      notas TEXT,
      ip VARCHAR(45),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX idx_time_records_user ON time_records(user_id);
    CREATE INDEX idx_time_records_fecha ON time_records(fecha);
  END IF;
END $$;

-- Solicitudes de ausencia
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'absence_requests') THEN
    CREATE TABLE absence_requests (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      tipo VARCHAR(30) NOT NULL
        CHECK (tipo IN ('vacaciones','medica','personal','maternidad','formacion','compensacion','otro')),
      fecha_inicio DATE NOT NULL,
      fecha_fin DATE NOT NULL,
      dias_laborables INTEGER DEFAULT 1,
      horas DECIMAL(4,2),
      motivo TEXT,
      estado VARCHAR(20) DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente','aprobada','rechazada','cancelada')),
      aprobado_por INTEGER REFERENCES users(id),
      aprobado_at TIMESTAMP,
      motivo_rechazo TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX idx_absence_user ON absence_requests(user_id);
    CREATE INDEX idx_absence_estado ON absence_requests(estado);
  END IF;
END $$;

-- Festivos
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'holidays') THEN
    CREATE TABLE holidays (
      id SERIAL PRIMARY KEY,
      fecha DATE NOT NULL,
      nombre VARCHAR(200) NOT NULL,
      tipo VARCHAR(30) DEFAULT 'nacional',
      year INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(fecha)
    );
  END IF;
END $$;

-- Turnos
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shifts') THEN
    CREATE TABLE shifts (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(100) NOT NULL,
      hora_entrada TIME NOT NULL DEFAULT '09:00',
      hora_salida TIME NOT NULL DEFAULT '17:00',
      descanso_min INTEGER DEFAULT 30,
      color VARCHAR(20) DEFAULT '#3b82f6',
      activo BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  END IF;
END $$;

-- Asignación turno a usuario
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='shift_id') THEN
    ALTER TABLE users ADD COLUMN shift_id INTEGER REFERENCES shifts(id) ON DELETE SET NULL;
  END IF;
END $$;
