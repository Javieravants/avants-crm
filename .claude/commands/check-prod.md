Verifica el estado de producción del CRM:

1. Haz una petición al health check: https://avants-crm-production.up.railway.app/api/health
2. Conecta a la BD de producción (DATABASE_URL en las variables de Railway) y muestra:
   - Conteo de personas, deals, tickets, users
   - Últimas 5 personas creadas/actualizadas
   - Últimos 5 deals creados/actualizados
   - Estado de los webhooks de Pipedrive (ejecuta: node backend/scripts/register-webhooks.js --list)
3. Muestra un resumen claro del estado
