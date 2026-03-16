-- =============================================
-- Migración: Módulo Personas completo
-- =============================================

-- Campos extra en personas
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='personas' AND column_name='fecha_nacimiento') THEN
    ALTER TABLE personas ADD COLUMN fecha_nacimiento DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='personas' AND column_name='nacionalidad') THEN
    ALTER TABLE personas ADD COLUMN nacionalidad VARCHAR(100);
  END IF;
END $$;

-- Familiares / Asegurados vinculados
CREATE TABLE IF NOT EXISTS familiares (
  id SERIAL PRIMARY KEY,
  persona_id INTEGER REFERENCES personas(id) ON DELETE CASCADE,
  nombre VARCHAR(200) NOT NULL,
  dni VARCHAR(50),
  fecha_nacimiento DATE,
  parentesco VARCHAR(50),
  telefono VARCHAR(50),
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notas de persona
CREATE TABLE IF NOT EXISTS persona_notas (
  id SERIAL PRIMARY KEY,
  persona_id INTEGER REFERENCES personas(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  texto TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_familiares_persona ON familiares(persona_id);
CREATE INDEX IF NOT EXISTS idx_persona_notas_persona ON persona_notas(persona_id);
