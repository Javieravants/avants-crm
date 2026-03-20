Muestra métricas rápidas de la base de datos de producción:

Ejecuta estas queries via el MCP de postgres y muestra los resultados en una tabla:

1. SELECT COUNT(*) FROM personas — Total contactos
2. SELECT COUNT(*) FROM deals — Total deals
3. SELECT COUNT(*) FROM deals WHERE pipedrive_status = 'open' — Deals abiertos
4. SELECT COUNT(*) FROM deals WHERE pipeline_id IS NOT NULL — Deals en pipeline
5. SELECT COUNT(*) FROM polizas — Total pólizas
6. SELECT COUNT(*) FROM pipelines — Pipelines activos
7. SELECT COUNT(*) FROM pipeline_stages — Etapas totales
8. SELECT COUNT(*) FROM ft_users — Usuarios Fichate
9. SELECT COUNT(*) FROM ft_time_records — Fichajes totales
10. SELECT COUNT(*) FROM propuestas — Propuestas calculadora
11. SELECT COUNT(*) FROM tickets — Tickets/Trámites

Muestra también:
- Top 5 pipelines por número de deals abiertos
- Última sincronización Pipedrive (si existe pipedrive_sync_logs)
- Estado del servidor: curl health check
