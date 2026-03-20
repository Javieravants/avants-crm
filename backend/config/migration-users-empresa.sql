-- Migración: campo empresa en users
-- Fecha: 2026-03-20

-- Añadir campo empresa (ADESLAS por defecto para la mayoría)
ALTER TABLE users ADD COLUMN IF NOT EXISTS empresa VARCHAR(20) DEFAULT 'ADESLAS';

-- Asignar DKV a los agentes/supervisores DKV conocidos
UPDATE users SET empresa = 'DKV' WHERE email IN (
  'beatrizdkvhealth@gmail.com',   -- Beatriz Sánchez Parras (agent)
  'raultelegestion@gmail.com',    -- Raúl Llerena Mozos (agent)
  'pilardiazdkv@gmail.com'        -- Jose Antonio Recio Martín (supervisor)
);

-- Admin (Javier) no tiene empresa fija — ve todo
UPDATE users SET empresa = NULL WHERE rol = 'admin';
