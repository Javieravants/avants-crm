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
