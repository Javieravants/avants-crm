-- Migración: añadir rol 'historico' y usuarios históricos para importador de pólizas
-- Los usuarios históricos son agentes que ya no trabajan pero vendieron pólizas en el pasado

-- 1. Ampliar CHECK de roles para incluir 'historico'
DO $$
BEGIN
  ALTER TABLE users DROP CONSTRAINT IF EXISTS users_rol_check;
  ALTER TABLE users ADD CONSTRAINT users_rol_check
    CHECK (rol IN ('superadmin', 'admin', 'supervisor', 'agent', 'historico'));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'users_rol_check ya actualizado: %', SQLERRM;
END $$;

-- 2. Insertar usuarios históricos (solo si no existen por email)
INSERT INTO users (nombre, email, password_hash, rol, activo, empresa)
VALUES ('Cristina (histórico)', 'cristina.historico@avants.internal', '', 'historico', false, 'ADESLAS')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (nombre, email, password_hash, rol, activo, empresa)
VALUES ('Nani (histórico)', 'nani.historico@avants.internal', '', 'historico', false, 'ADESLAS')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (nombre, email, password_hash, rol, activo, empresa)
VALUES ('Sol (histórico)', 'sol.historico@avants.internal', '', 'historico', false, 'ADESLAS')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (nombre, email, password_hash, rol, activo, empresa)
VALUES ('Victoria (histórico)', 'victoria.historico@avants.internal', '', 'historico', false, 'ADESLAS')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (nombre, email, password_hash, rol, activo, empresa)
VALUES ('David (histórico)', 'david.historico@avants.internal', '', 'historico', false, 'ADESLAS')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (nombre, email, password_hash, rol, activo, empresa)
VALUES ('Patricia Leria (histórico)', 'patricialeria.historico@avants.internal', '', 'historico', false, 'ADESLAS')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (nombre, email, password_hash, rol, activo, empresa)
VALUES ('Elvira (histórico)', 'elvira.historico@avants.internal', '', 'historico', false, 'ADESLAS')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (nombre, email, password_hash, rol, activo, empresa)
VALUES ('Alejandra (histórico)', 'alejandra.historico@avants.internal', '', 'historico', false, 'ADESLAS')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (nombre, email, password_hash, rol, activo, empresa)
VALUES ('Mari Paz (histórico)', 'maripaz.historico@avants.internal', '', 'historico', false, 'ADESLAS')
ON CONFLICT (email) DO NOTHING;
