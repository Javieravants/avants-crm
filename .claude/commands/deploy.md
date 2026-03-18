Despliega el CRM a Railway:

1. Ejecuta git status para ver cambios pendientes
2. Si hay cambios sin commitear, pregunta al usuario si quiere commitear primero
3. Haz git push origin main para desplegar (Railway auto-deploy desde main)
4. Espera 30 segundos y verifica el health check: https://avants-crm-production.up.railway.app/api/health
5. Muestra el resultado del deploy
