-- Migración: asignar agente_id a deals cruzando pipedrive_owner (nombre) con users
-- Fecha: 2026-03-23

-- Mapeo directo por nombre parcial
UPDATE deals SET agente_id = 6 WHERE pipedrive_owner = 'Beatriz' AND agente_id IS NULL;
UPDATE deals SET agente_id = 11 WHERE pipedrive_owner = 'Marisa Cano' AND agente_id IS NULL;
UPDATE deals SET agente_id = 5 WHERE pipedrive_owner = 'ANDREA STEFANI' AND agente_id IS NULL;
UPDATE deals SET agente_id = 4 WHERE pipedrive_owner = 'Ana Frida' AND agente_id IS NULL;
UPDATE deals SET agente_id = 15 WHERE pipedrive_owner = 'Raúl Llerena' AND agente_id IS NULL;
UPDATE deals SET agente_id = 14 WHERE pipedrive_owner = 'Patricia Cañas' AND agente_id IS NULL;
UPDATE deals SET agente_id = 8 WHERE pipedrive_owner = 'Eva Mora' AND agente_id IS NULL;
UPDATE deals SET agente_id = 3 WHERE pipedrive_owner = 'José Antonio' AND agente_id IS NULL;
UPDATE deals SET agente_id = 9 WHERE pipedrive_owner = 'eva polo' AND agente_id IS NULL;
UPDATE deals SET agente_id = 16 WHERE pipedrive_owner = 'Silvia' AND agente_id IS NULL;
UPDATE deals SET agente_id = 12 WHERE pipedrive_owner = 'Montse Gonzalez' AND agente_id IS NULL;
UPDATE deals SET agente_id = 2 WHERE pipedrive_owner = 'Javier Hernández' AND agente_id IS NULL;
UPDATE deals SET agente_id = 7 WHERE pipedrive_owner = 'Diego Ramirez' AND agente_id IS NULL;

-- Asignar agente_id a personas desde el deal más reciente
ALTER TABLE personas ADD COLUMN IF NOT EXISTS agente_id INTEGER REFERENCES users(id);

UPDATE personas p
SET agente_id = sub.agente_id
FROM (
  SELECT DISTINCT ON (persona_id) persona_id, agente_id
  FROM deals
  WHERE agente_id IS NOT NULL AND persona_id IS NOT NULL
  ORDER BY persona_id, created_at DESC
) sub
WHERE p.id = sub.persona_id AND p.agente_id IS NULL;
