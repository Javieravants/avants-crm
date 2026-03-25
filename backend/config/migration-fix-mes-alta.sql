-- Migración: normalizar mes_alta para incluir siempre el año
-- Usa fecha_grabacion para deducir el año correcto
UPDATE polizas
SET mes_alta = CONCAT(
  SPLIT_PART(mes_alta, ' ', 1),
  ' ',
  EXTRACT(YEAR FROM fecha_grabacion)::integer::text
)
WHERE mes_alta IS NOT NULL
  AND mes_alta NOT LIKE '% 20%'
  AND mes_alta != 'TEST'
  AND fecha_grabacion IS NOT NULL
  AND EXTRACT(YEAR FROM fecha_grabacion) >= 2019;
