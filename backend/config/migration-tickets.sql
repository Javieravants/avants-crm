-- =============================================
-- Migración: Módulo de Tickets/Trámites
-- =============================================

-- Tipos de trámites (configurables desde Settings)
CREATE TABLE IF NOT EXISTS ticket_types (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  activo BOOLEAN DEFAULT true,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Columnas/Bandejas (configurables desde Settings)
CREATE TABLE IF NOT EXISTS ticket_columns (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  visible_roles TEXT[] DEFAULT '{}',
  visible_user_ids INTEGER[] DEFAULT '{}',
  activo BOOLEAN DEFAULT true,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Añadir campos extra a usuarios
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='telefono') THEN
    ALTER TABLE users ADD COLUMN telefono VARCHAR(20);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='password_visible') THEN
    ALTER TABLE users ADD COLUMN password_visible VARCHAR(255);
  END IF;
END $$;

-- Hacer nullable el campo tipo original (ahora usamos tipo_id)
ALTER TABLE tickets ALTER COLUMN tipo DROP NOT NULL;

-- Añadir columnas nuevas a tickets
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='column_id') THEN
    ALTER TABLE tickets ADD COLUMN column_id INTEGER REFERENCES ticket_columns(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='tipo_id') THEN
    ALTER TABLE tickets ADD COLUMN tipo_id INTEGER REFERENCES ticket_types(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='assigned_to') THEN
    ALTER TABLE tickets ADD COLUMN assigned_to INTEGER REFERENCES users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='created_by') THEN
    ALTER TABLE tickets ADD COLUMN created_by INTEGER REFERENCES users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='prioridad') THEN
    ALTER TABLE tickets ADD COLUMN prioridad VARCHAR(20) DEFAULT 'normal';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='pipedrive_note_sent') THEN
    ALTER TABLE tickets ADD COLUMN pipedrive_note_sent BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Comentarios en tickets (hilo de conversación)
CREATE TABLE IF NOT EXISTS ticket_comments (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  mensaje TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notificaciones
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
  mensaje VARCHAR(255) NOT NULL,
  leida BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Restricción unique para evitar duplicados en seed
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ticket_types_nombre_key') THEN
    ALTER TABLE ticket_types ADD CONSTRAINT ticket_types_nombre_key UNIQUE (nombre);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ticket_columns_nombre_key') THEN
    ALTER TABLE ticket_columns ADD CONSTRAINT ticket_columns_nombre_key UNIQUE (nombre);
  END IF;
END $$;

-- Seed: tipos de trámites por defecto
INSERT INTO ticket_types (nombre, orden) VALUES
  ('Cambio de datos en póliza', 1),
  ('Sustitución tarjeta médica', 2),
  ('Incidencia médica / autorización', 3),
  ('Problema de cobro / facturación', 4),
  ('Baja de póliza', 5),
  ('Solicitud de documentación', 6),
  ('Impago de recibo', 7)
ON CONFLICT (nombre) DO NOTHING;

-- Seed: columnas/bandejas por defecto
-- Tickets generales: visible para todos los roles
INSERT INTO ticket_columns (nombre, descripcion, visible_roles, visible_user_ids, orden) VALUES
  ('Tickets generales', 'Todos los agentes crean aquí sus tickets', ARRAY['admin','supervisor','agent'], ARRAY[]::INTEGER[], 1)
ON CONFLICT (nombre) DO NOTHING;

-- Grabaciones: visible para supervisor y admin
INSERT INTO ticket_columns (nombre, descripcion, visible_roles, visible_user_ids, orden) VALUES
  ('Grabaciones', 'Cuando se graba una póliza llega aquí con resumen', ARRAY['admin','supervisor'], ARRAY[]::INTEGER[], 2)
ON CONFLICT (nombre) DO NOTHING;

-- Bandeja de Javier: solo para admin (Javier)
INSERT INTO ticket_columns (nombre, descripcion, visible_roles, visible_user_ids, orden) VALUES
  ('Bandeja de Javier', 'Trámites pendientes con la compañía', ARRAY['admin'], ARRAY[]::INTEGER[], 3)
ON CONFLICT (nombre) DO NOTHING;
