Backup de la base de datos de producción:

1. Verifica que pg_dump está disponible en el sistema
2. Crea un directorio de backups si no existe: mkdir -p backups/
3. Genera el nombre del archivo con fecha: avants_backup_YYYY-MM-DD.sql
4. Ejecuta el dump usando las credenciales de Railway:
   - Host: tramway.proxy.rlwy.net
   - Puerto: 21758
   - Base de datos: railway
   - Usuario: postgres
   - Pide la contraseña al usuario o búscala en .env (DB_PASS de Railway)
5. Comprime el archivo: gzip backups/avants_backup_*.sql
6. Muestra el tamaño del backup y confirma que se completó
7. Lista los backups existentes con sus tamaños

IMPORTANTE: No subir el backup a git. Verificar que backups/ está en .gitignore.
