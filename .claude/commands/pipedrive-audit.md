Auditoría de sincronización Pipedrive ↔ CRM:

1. Cuenta deals en CRM vs Pipedrive:
   - CRM: SELECT COUNT(*) FROM deals WHERE pipedrive_id IS NOT NULL
   - Pipedrive: usa mcp__pipedrive__deals_list con status=open para contar

2. Verifica mapeo de pipelines:
   - SELECT p.name, COUNT(d.id) FROM pipelines p LEFT JOIN deals d ON d.pipeline_id=p.id AND d.pipedrive_status='open' GROUP BY p.name ORDER BY count DESC

3. Detecta deals huérfanos:
   - SELECT COUNT(*) FROM deals WHERE pipedrive_status='open' AND pipeline_id IS NULL — deals sin pipeline
   - SELECT COUNT(*) FROM deals WHERE pipedrive_status='open' AND stage_id IS NULL — deals sin etapa

4. Detecta personas sin pipedrive_person_id:
   - SELECT COUNT(*) FROM personas WHERE pipedrive_person_id IS NULL

5. Última sync:
   - SELECT * FROM pipedrive_sync_logs ORDER BY created_at DESC LIMIT 1

6. Muestra resumen con recomendaciones:
   - Si hay deals huérfanos → sugerir /sync-pipedrive
   - Si hay personas sin pipedrive_id → normal si son del CRM
   - Si la última sync fue hace más de 24h → sugerir re-sync
