-- Migración: asignar agente_id a pólizas con alias no resueltos en importación 2024

UPDATE polizas SET agente_id = (
  SELECT id FROM users WHERE email = 'javier@segurosdesaludonline.es'
) WHERE agente_nombre IN ('JA','JAV','JH') AND agente_id IS NULL;

UPDATE polizas SET agente_id = (
  SELECT id FROM users WHERE email = 'silvia@segurosdesaludonline.es'
) WHERE agente_nombre = 'SI' AND agente_id IS NULL;

UPDATE polizas SET agente_id = (
  SELECT id FROM users WHERE email = 'patricia@segurosdesaludonline.es'
) WHERE agente_nombre IN ('P') AND agente_id IS NULL;

UPDATE polizas SET agente_id = (
  SELECT id FROM users WHERE email = 'cristina.historico@avants.internal'
) WHERE agente_nombre IN ('CA','GRACI') AND agente_id IS NULL;

UPDATE polizas SET agente_id = (
  SELECT id FROM users WHERE email = 'eva@segurosdesaludonline.es'
) WHERE agente_nombre = 'CR-EP' AND agente_id IS NULL;

-- Pólizas con nombres largos que quedaron sin agente_id
UPDATE polizas SET agente_id = (
  SELECT id FROM users WHERE email = 'nani.historico@avants.internal'
) WHERE UPPER(agente_nombre) = 'NANI' AND agente_id IS NULL;

UPDATE polizas SET agente_id = (
  SELECT id FROM users WHERE email = 'montse@segurosdesaludonline.es'
) WHERE UPPER(agente_nombre) = 'MONTSE' AND agente_id IS NULL;

UPDATE polizas SET agente_id = (
  SELECT id FROM users WHERE email = 'cristina.historico@avants.internal'
) WHERE UPPER(agente_nombre) = 'CRISTINA' AND agente_id IS NULL;

UPDATE polizas SET agente_id = (
  SELECT id FROM users WHERE email = 'marisa@segurosdesaludonline.es'
) WHERE UPPER(agente_nombre) = 'MARISA' AND agente_id IS NULL;

UPDATE polizas SET agente_id = (
  SELECT id FROM users WHERE email = 'sol.historico@avants.internal'
) WHERE UPPER(agente_nombre) = 'SOL' AND agente_id IS NULL;

UPDATE polizas SET agente_id = (
  SELECT id FROM users WHERE email = 'raultelegestioncalahorra@gmail.com'
) WHERE UPPER(agente_nombre) = 'RAUL' AND agente_id IS NULL;
