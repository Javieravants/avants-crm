---
name: avants-suite
description: Skill maestro de Avants Suite — design system, arquitectura, BD, roles, módulos, mockups y reglas
---

# Avants Suite — Skill Maestro

## Visión
CRM/ERP propio para correduría de seguros. Reemplazo progresivo de Pipedrive.
Objetivo final: SaaS vendible a otras corredurías.

## Stack técnico
- **Backend:** Node.js + Express
- **BD:** PostgreSQL (Railway producción)
- **Frontend:** HTML/CSS/JS vanilla — SIN frameworks (no React, no Vue, no Tailwind)
- **Auth:** JWT (8h expiry)
- **Hosting:** Railway (temporal) → Hetzner VPS CX23
- **Repo:** https://github.com/Javieravants/avants-crm
- **Producción:** https://avants-crm-production.up.railway.app

## Estructura de archivos
```
backend/
  server.js          — Express app, migraciones auto al arrancar
  config/db.js       — Pool PostgreSQL (DATABASE_URL o DB_HOST/PORT/NAME)
  config/init.sql    — Schema base
  config/migration-*.sql — Migraciones incrementales
  routes/
    auth.js          — Login, JWT, CRUD usuarios
    personas.js      — CRUD personas, familiares, notas
    tickets.js       — Trámites Kanban + comunicaciones
    pipeline.js      — Pipeline Kanban deals, sync Pipedrive
    settings.js      — Config tipos trámites, columnas
    webhooks.js      — Receptor webhooks Pipedrive (v1+v2)
    grabaciones.js   — Pólizas grabadas
  middleware/
    auth.js          — JWT verification
    roles.js         — requireRole('admin','supervisor')
  utils/
    pipedrive-sync.js — Field mapping Pipedrive
    notifications.js  — Sistema de notificaciones
frontend/
  index.html         — SPA shell (sidebar + main-content)
  shared/
    api.js           — Wrapper fetch con JWT (TODA llamada API pasa por aquí)
    app.js           — Router SPA, Auth, navegación
    styles.css       — Design system global
    icons.js         — SVG icons set
  modules/
    personas.js      — Ficha contacto, listado, búsqueda
    pipeline.js      — Kanban deals por embudo
    tickets.js       — Trámites Kanban + panel lateral
    settings.js      — Configuración admin
    grabaciones.js   — Módulo grabaciones pólizas
    calculadora.js   — Calculadora precios ADESLAS
    fichate.js       — Control horario
```

## Design System — INMUTABLE
```css
:root {
  --accent:    #009DDD;   /* Azul ADESLAS — NO #ff4a6e (solo logo) */
  --accent-d:  #0088c2;
  --accent-l:  #e6f5fc;
  --bg:        #f4f6f9;
  --white:     #ffffff;
  --txt:       #0f172a;
  --txt2:      #475569;
  --txt3:      #94a3b8;
  --border:    #e8edf2;
  --green:     #10b981;
  --amber:     #f59e0b;
  --red:       #ef4444;
  --blue:      #3b82f6;
  --purple:    #8b5cf6;
}
```
- Font: **Inter** (Google Fonts), sans-serif
- Border-radius: 12px cards, 8px inputs, 9px botones, 50% avatares
- Sidebar: 220px → 52px colapsable, blanco, border-right
- Iconos: **SVG propios** de avants_icons_v2.html (NUNCA emojis, NUNCA librerías externas)
- Tamaños iconos: 16px sidebar/tabs, 20px botones, 24px cards, 32px KPIs

## Iconos SVG disponibles (avants_icons_v2.html)
Volver, Llamada, WhatsApp, Email, Editar, Agendar, Grabar, Historial, Propuesta,
Pólizas, Trámites, Nota, Añadir, Guardar, Cierre, Seguimiento, Gestión, Agenda,
Dashboard, Contactos, Pipeline, Impagos, Fichate, Informes, Settings, Calculadora,
Buscar, Filtrar, Notificación, Colgar, Subir, Descargar, Arrastrar, Reunión

## Base de datos — Tablas principales

### personas
- id, pipedrive_person_id, nombre, dni, telefono, email
- fecha_nacimiento, direccion, nacionalidad, notas
- created_at, updated_at

### deals
- id, pipedrive_id, persona_id, pipeline_id, stage_id, agente_id
- poliza, producto, compania, prima, fecha_efecto
- estado (en_tramite/poliza_activa/perdido/eliminado)
- pipedrive_status (open/won/lost), pipedrive_stage, pipedrive_owner
- pipeline_id → pipelines, stage_id → pipeline_stages
- datos_extra (JSONB), stage_entered_at, estado_grabacion

### tickets (trámites)
- id, tipo_id → ticket_types, column_id → ticket_columns
- estado (nuevo/en_gestion/esperando/resuelto/cerrado)
- descripcion, urgencia (normal/alta/urgente)
- created_by, assigned_to, agente_id → users
- compania (auto-asignada por empresa del usuario)
- contacto_id → personas
- num_poliza, num_solicitud, pipedrive_deal_id

### users
- id, nombre, email, password_hash, password_visible
- rol (admin/supervisor/agent)
- empresa (ADESLAS/DKV/NULL para admin)
- telefono, activo, created_at

### pipelines / pipeline_stages
- pipelines: id, name, pipedrive_id, color, orden, active
- pipeline_stages: id, pipeline_id, pipedrive_id, name, orden, color, active

### Otras tablas
- ticket_types, ticket_columns, ticket_comments
- tramite_comunicaciones (email/whatsapp/nota/sistema)
- notifications, activity_logs
- persona_familiares, persona_notas
- grabaciones_polizas

## Roles y permisos

| Rol | Acceso |
|---|---|
| **admin** (Javier) | Todo. empresa=NULL, ve todos los trámites/deals. Config sistema |
| **supervisor** (Laura=ADESLAS, José Antonio=DKV) | Solo trámites/deals de su empresa |
| **agent** | Solo sus propios tickets + deals de su empresa |

### Empresa por usuario
- DKV: Beatriz Sánchez, Raúl Llerena, José Antonio Recio
- ADESLAS: Todos los demás
- Admin: empresa=NULL (ve todo)
- Empresa se auto-asigna al crear trámites (no se elige manualmente)

## Módulos y estado actual

### Personas (ficha contacto)
- Tabs: **Historial** (default) | Propuestas | Pólizas | Trámites | Notas
- Historial: timeline unificada (notas + propuestas + trámites + actividades)
- Panel izquierdo: datos personales, familiares, seguros, oportunidades
- Botones header: Llamar, WhatsApp, Email, Editar, Actividad, Grabar
- Actividad: popup con calendario 09:00-20:00, tipos: Llamada/Cierre/Seguimiento/Gestión
- Grabar: se abre inline en la ficha (iframe), no navega fuera
- ID visible: #pipedrive_person_id junto al nombre

### Pipeline (Kanban deals)
- Grid responsive (auto-fit columns, sin scroll horizontal)
- Cards con: nombre (14px bold), producto, agente, días en stage, #ID
- Indicador actividad: verde (< 2h), gris (> 2h), triángulo amarillo (sin llamada), rojo (vencida)
- Filtro por agente y pipeline (dropdown)
- Drag & drop entre stages
- Click card → abre ficha del contacto

### Trámites (Kanban tickets)
- 5 columnas: Abierto → En gestión → Esperando → Resuelto → Cerrado
- Panel lateral para ver/crear trámites (slide-in derecha, 520px)
- Compañía auto-asignada por empresa del usuario
- Permisos: admin ve todo con filtro, supervisor solo su empresa, agent solo sus tickets
- Comunicaciones: email compañía, email cliente, WA cliente, nota interna
- Desde ficha contacto: botón "+ Nuevo trámite" precarga contacto_id

### Settings
- Tab Tipos de trámites: CRUD con nombre, orden, activo
- Tab Columnas/Bandejas: visibilidad por roles y usuarios específicos
- Tab Usuarios: nombre, email, rol, empresa (ADESLAS/DKV), teléfono, activo

## Sincronización Pipedrive

### Webhooks activos (v1 con Basic Auth)
- deal.added, deal.updated, deal.deleted
- person.added, person.updated
- Auth: Basic avants:crm2026webhook
- URL: https://avants-crm-production.up.railway.app/api/webhooks/pipedrive
- Soporta payload v1 ({event, current, previous}) y v2 ({event, data})

### Handler de webhooks
- Responde 200 inmediatamente, procesa async
- Mapea pipeline_id y stage_id de Pipedrive → IDs locales
- Auto-crea stages faltantes en pipeline_stages
- Al resolver: status won → poliza_activa, lost → perdido
- Notifica admins cuando deal se marca como won

### Sync manual (POST /api/pipeline/sync-pipedrive)
- Recorre todos los deals open de Pipedrive (paginado, 500/batch)
- Crea stages faltantes automáticamente
- Crea deals que no existen en CRM
- Actualiza pipeline_id, stage_id, status de deals existentes
- Restaura deals wrongly marked lost/won back to open

### Cleanup (POST /api/pipeline/cleanup-stale-deals)
- Limpia deals open en CRM pero lost/won en Pipedrive
- Consulta la API de Pipedrive deal por deal
- Actualiza status y pipeline/stage correctamente

## Emails de contacto por empresa

### ADESLAS (trámites y gestiones)
- GarciaNi@segurcaixaadeslas.es
- hernandezjja@agente.segurcaixaadeslas.es
- avants@agente.segurcaixaadeslas.es

### DKV
- Agentes DKV: Beatriz Sánchez, Raúl Llerena, José Antonio Recio
- Al crear trámites, la empresa DKV se asigna automáticamente a estos usuarios
- José Antonio Recio es supervisor DKV (ve todos los trámites DKV)

## Reglas de desarrollo — CRÍTICAS

1. **Fixes quirúrgicos** — nunca reescribir lo que funciona
2. **Design system intocable** — colores, fuente, radios, iconos SVG
3. **Iconos SOLO SVG** de avants_icons_v2.html — NUNCA emojis, NUNCA librerías externas
4. **Comentarios en español, código en inglés**
5. **Fechas DD/MM/YYYY** en interfaces
6. **API keys en .env** — nunca hardcodeadas
7. **Toda llamada API pasa por shared/api.js** — nunca fetch directo en módulos
8. **Cada módulo es independiente** — cargado dinámicamente
9. **Settings** es el panel de configuración — sin tocar código
10. **Vanilla JS/CSS** — sin frameworks, sin librerías UI

### Prohibiciones absolutas
- **NUNCA usar emojis como iconos en UI** — solo SVGs de avants_icons_v2.html
- **NUNCA cambiar CSS de Fichate** — usa #ff4a6e como accent propio, no tocar
- **NUNCA tocar lógica JS de calculadora/grabaciones** — módulos estables, no refactorizar
- **NUNCA borrar datos** — usar estados (activo/inactivo, abierto/cerrado) en vez de DELETE
- **SIEMPRE consultar mockups antes de construir** — ../mockups/ es la fuente de verdad visual

## Pendientes prioritarios (semana 21-28 marzo 2026)
1. CloudTalk widget click-to-call desde ficha contacto
2. Dashboard agente (en diseño — KPIs, llamadas, ventas)
3. Verificar ficha contacto completa en producción
4. Módulo Impagos (nuevo)
5. Email tracker en trámites (envío real desde CRM)
6. Notificaciones tiempo real (Socket.IO)
7. PWA móvil responsive

## Mockups aprobados
- `../mockups/mockup_ficha_contacto.html` — Ficha de contacto 2 columnas
- `../mockups/mockup_popup_postllamada.html` — Popup post-llamada con calendario
- `../mockups/avants_icons_v2.html` — Set completo de iconos SVG

## Datos de producción (marzo 2026)
- 154.895 personas importadas de Pipedrive
- ~108.000 deals (2.874 open con pipeline asignado)
- 17 usuarios (2 admin, 3 DKV, resto ADESLAS)
- 16 pipelines, 54 stages
- Webhooks activos: 5 (deal CRUD + person CR)

## Slash commands disponibles
- `/deploy` — Desplegar a Railway
- `/check-prod` — Verificar producción
- `/db-stats` — Métricas de BD
- `/sync-pipedrive` — Sincronización manual
- `/pipedrive-audit` — Auditoría de sincronización
- `/migrate` — Gestionar migraciones
- `/deal-won` — Flujo deal ganado
- `/backup-db` — Backup de BD
