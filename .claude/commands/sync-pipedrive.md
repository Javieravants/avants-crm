Ejecuta una sincronización de Pipedrive contra la BD de producción:

1. Primero muestra el estado actual (conteo de personas y deals en producción)
2. Pregunta al usuario si quiere sync completo, solo personas, o solo deals
3. Ejecuta el sync con DATABASE_URL de producción:
   - Completo: DATABASE_URL="postgresql://postgres:JGKsbuxcrcbSPfqrtAPkpFBtIzMDwRBU@tramway.proxy.rlwy.net:21758/railway" node backend/scripts/sync-pipedrive.js
   - Personas: añade --persons
   - Deals: añade --deals
4. Monitorea el progreso y muestra el resultado final
