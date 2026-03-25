-- Migración: corregir created_at de pólizas importadas usando fecha_grabacion real
UPDATE polizas
SET created_at = fecha_grabacion
WHERE fecha_grabacion IS NOT NULL
  AND fecha_grabacion > '2019-01-01'
  AND fecha_grabacion < now()
  AND created_at > '2026-03-20';
