Gestiona migraciones de base de datos:

1. Muestra las migraciones existentes en backend/config/
2. Pregunta qué quiere hacer el usuario:
   a) Crear nueva migración
   b) Ejecutar migraciones pendientes en producción
   c) Ver estado actual del schema
3. Para ejecutar en producción, usa la DATABASE_URL pública de Railway
4. Siempre haz backup previo mostrando el estado actual de las tablas afectadas
