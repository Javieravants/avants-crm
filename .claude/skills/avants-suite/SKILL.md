---
name: avants-suite
description: Skill maestro de Avants Suite — estado real del proyecto, integraciones, BD, módulos, arquitectura y reglas. Fuente de verdad absoluta. Actualizado 03/04/2026.
---

# Avants Suite — Skill Maestro
> Actualizado: 03/04/2026

## Visión
CRM/ERP propio para correduría de seguros. Reemplazo progresivo de Pipedrive.
Objetivo final: SaaS vendible a otras corredurías.

## Stack técnico
- **Backend:** Node.js + Express
- **BD:** PostgreSQL (Railway producción)
- **Frontend:** HTML/CSS/JS vanilla — SIN frameworks (no React, no Vue, no Tailwind)
- **Auth:** JWT (8h expiry)
- **Storage:** Hetzner Object Storage (S3-compatible)
- **Hosting:** Railway (temporal) → Hetzner VPS CX23
- **Repo:** https://github.com/Javieravants/avants-crm
- **Producción:** https://app.gestavly.com

---

## Estructura de archivos
```
backend/
  server.js              — Express app + webhooks CloudTalk/WhatsApp
  config/db.js           — Pool PostgreSQL (DATABASE_URL o DB_HOST/PORT/NAME)
  config/init.sql        — Schema base
  config/migration-*.sql — Migraciones incrementales (17+ archivos)
  routes/
    auth.js              — Login, JWT, CRUD usuarios
    personas.js          — CRUD personas, familiares, notas, documentos
    tickets.js           — Tramites Kanban + comunicaciones
    pipeline.js          — Pipeline Kanban deals, sync Pipedrive
    settings.js          — Config tipos tramites, columnas
    webhooks.js          — Receptor webhooks Pipedrive (v1+v2+v2-meta)
    grabaciones.js       — Polizas grabadas
    cloudtalk.js         — Click-to-call, status, historial llamadas
    whatsapp.js          — Envio WA texto + propuesta PDF
    calculadora.js       — Propuestas, PDFs, asegurados, sync Pipedrive
    history.js           — Timeline contacto, registrarEvento()
    tareas.js            — Tareas pendientes agentes
    fichate.js           — Control horario (IONOS MySQL)
    search.js            — Busqueda global personas/deals/tickets
    documentos.js        — Gestion documentos personas
    dashboard.js         — Metricas y KPIs
    informes.js          — Reportes Excel
    polizas.js           — Import Google Sheets
    etiquetas.js         — Tags personas/deals
    admin.js             — Multi-tenant, gestion usuarios
    assistant.js         — Chat IA con Claude
  middleware/
    auth.js              — JWT verification
    roles.js             — requireRole('admin','supervisor')
    tenant.js            — Multi-tenant middleware
  utils/
    pipedrive-sync.js    — Field mapping + enum maps Pipedrive
    notifications.js     — Sistema notificaciones
    storage.js           — S3 client Hetzner (upload, delete)
  scripts/
    register-webhooks.js       — Registrar/listar/borrar webhooks Pipedrive
    sync-pipeline-stages.js    — Resync deals con pipeline/stage
    resync-deals-custom-fields.js — Resync campos personalizados
    sync-custom-fields.js      — Sync solo custom fields
    sync-deals-status.js       — Sync deals won/lost historicos
    sync-activities.js         — Migrar actividades historicas
    sync-cloudtalk.js          — Bulk upload contactos a CloudTalk
    migrate-pdfs-to-hetzner.js — Migrar PDFs locales a S3
    import-pipedrive-labels.js — Import etiquetas Pipedrive
frontend/
  index.html             — SPA shell (sidebar + CloudTalk widget + WhatsApp btn)
  shared/
    api.js               — Wrapper fetch con JWT (TODA llamada pasa por aqui)
    app.js               — Router SPA, Auth, navegacion
    styles.css           — Design system global
    icons.js             — SVG icons set (avants_icons_v2)
  modules/
    dashboard.js         — Home con KPIs y metricas
    personas.js          — Ficha contacto completa + timeline
    pipeline.js          — Kanban deals por embudo
    tickets.js           — Tramites Kanban + panel lateral
    llamada.js           — Pantalla llamada activa + scripts
    calculadora.js       — Calculadora precios ADESLAS/DKV
    grabaciones.js       — Modulo grabaciones polizas
    fichate.js           — Control horario empleados
    informes.js          — Reportes con export Excel
    importar-polizas.js  — Import desde Google Sheets
    import.js            — Import Excel/CSV masivo
    settings.js          — Configuracion admin
    assistant.js         — Chat IA admin
    tarifas.js           — Tablas tarifas ADESLAS 2026 (utility)
```

---

## Design System — INMUTABLE
```css
:root {
  --accent:    #009DDD;   /* Azul ADESLAS — NO #ff4a6e (solo logo Fichate) */
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
- Iconos: **SVG propios** de avants_icons_v2.html (NUNCA emojis, NUNCA librerias externas)
- Tamanos iconos: 16px sidebar/tabs, 20px botones, 24px cards, 32px KPIs

### Iconos SVG disponibles
Volver, Llamada, WhatsApp, Email, Editar, Agendar, Grabar, Historial, Propuesta,
Polizas, Tramites, Nota, Anadir, Guardar, Cierre, Seguimiento, Gestion, Agenda,
Dashboard, Contactos, Pipeline, Impagos, Fichate, Informes, Settings, Calculadora,
Buscar, Filtrar, Notificacion, Colgar, Subir, Descargar, Arrastrar, Reunion

---

## INTEGRACIONES — Estado real (03/04/2026)

### 1. CloudTalk (VoIP) — FUNCIONAL

| Componente | Estado | Archivo |
|---|---|---|
| Widget telefono flotante | ✅ | `index.html` (iframe CloudTalk Phone) |
| Click-to-call via API | ✅ | `POST /api/cloudtalk/call` → `POST /v1/calls` |
| Verificar conexion | ✅ | `GET /api/cloudtalk/status` |
| Historial llamadas por telefono | ✅ | `GET /api/cloudtalk/calls` |
| Webhook call_ended | ✅ | `POST /webhook/cloudtalk` (sin auth) |
| Sync contactos bulk | ✅ | `scripts/sync-cloudtalk.js` |
| Llamadas en timeline contacto | ✅ | Badges: contestada/no contesto/buzon/devolver llamada |
| Badge "Devolver llamada" en pipeline | ✅ | Cards kanban con alerta roja (ultimas 48h) |

**Formato webhook:** `event.properties.*` (ticket #495931)

**Clasificacion de llamadas:**
| direction | talking_time | subtipo | prioridad |
|---|---|---|---|
| outbound | > 0 | contestada | normal |
| outbound | = 0 | no_contestada | media |
| inbound | = 0 | devolver_llamada | ALTA |
| inbound | > 0 | contestada | normal |

**Dedup:** Por `cloudtalk_call_id` en metadata JSONB.
**Agente:** Busca por email (fiable), fallback nombre.
**Env:** `CLOUDTALK_API_KEY`, `CLOUDTALK_API_SECRET`

### 2. WhatsApp Business API (Meta) — FUNCIONAL

| Componente | Estado | Archivo |
|---|---|---|
| Enviar texto | ✅ | `POST /api/whatsapp/send/texto` |
| Enviar propuesta PDF | ✅ | `POST /api/whatsapp/send/propuesta` |
| Historial mensajes | ✅ | `GET /api/whatsapp/history/:persona_id` |
| Webhook verificacion Meta | ✅ | `GET /webhook/whatsapp` |
| Webhook mensajes entrantes | ✅ | `POST /webhook/whatsapp` |
| Actualizacion estado (entregado/leido) | ✅ | Via webhook |
| Error 401 token caducado | ✅ | Mensaje claro al agente |

**API:** `graph.facebook.com/v19.0/{PHONE_ID}/messages`
**Token:** Temporal — cuando caduca, error 401 con mensaje "Token de WhatsApp caducado. Regenerar en Meta Developers."
**Tabla:** `whatsapp_messages` (persona_id, direccion, tipo, contenido, estado)
**Env:** `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_VERIFY_TOKEN`

**Pendiente:**
- Envio de plantillas (endpoints no implementados)
- Envio de imagenes/documentos (tipos definidos, sin endpoint)
- Validacion firma webhook (X-Hub-Signature)

### 3. Pipedrive (Sync bidireccional) — FUNCIONAL

| Componente | Estado | Archivo |
|---|---|---|
| Webhook deal.added/updated/deleted | ✅ | `POST /api/webhooks/pipedrive` |
| Webhook person.added/updated | ✅ | `POST /api/webhooks/pipedrive` |
| Webhook activity.added/updated | ✅ | Desde 23/03/2026 |
| Auth Basic | ✅ | `avants:crm2026webhook` |
| Sync deals manual | ✅ | `sync-pipeline-stages.js` |
| Sync campos personalizados | ✅ | `resync-deals-custom-fields.js` |
| Sync deals won/lost | ✅ | `sync-deals-status.js` |
| Sync actividades historicas | ✅ | `sync-activities.js` |
| Auto-crear stages faltantes | ✅ | En webhook handler |
| Cruce agentes por email | ✅ | 106.771 deals asignados |
| Sync propuesta → Pipedrive | ✅ | `POST /api/calculadora/propuestas/:id/pipedrive-sync` |

**URL webhook:** `https://app.gestavly.com/api/webhooks/pipedrive`
**Formatos soportados:** v1 (`{event, current, previous}`), v2 (`{event, data}`), v2-meta (`{meta, data, previous}`)
**Paginacion:** `limit=500` siempre (excepto actividades: `limit=100`)
**Env:** `PIPEDRIVE_API_KEY`, `PIPEDRIVE_WEBHOOK_USER`, `PIPEDRIVE_WEBHOOK_PASS`

**Pendiente:**
- Bidireccional CRM→Pipedrive limitado (solo sync propuestas manual)
- Sync actividades solo por script, no real-time retroactivo

### 4. Facebook Lead Ads — SOLO TABLAS (sin implementar)

| Componente | Estado |
|---|---|
| Tablas BD (fb_form_mappings, fb_leads) | ✅ Creadas |
| Webhook `/webhook/facebook` | ❌ No existe |
| Routes `/api/facebook/*` | ❌ No existen |
| Lead → persona + deal | ❌ No implementado |

**Pendiente:** Implementacion completa del flujo webhook → persona → deal.

### 5. Hetzner Object Storage (S3) — FUNCIONAL

| Componente | Estado | Archivo |
|---|---|---|
| Upload archivo desde disco | ✅ | `storage.js → uploadFile()` |
| Upload buffer desde memoria | ✅ | `storage.js → uploadBuffer()` |
| Delete archivo remoto | ✅ | `storage.js → deleteFile()` |
| PDFs propuestas en S3 | ✅ | `propuestas/propuesta_{id}.pdf` |
| PDFs grabaciones en S3 | ✅ | Via `calculadora.js` |
| Proxy con Content-Disposition | ✅ | Descarga con nombre correcto |
| Migracion PDFs locales → S3 | ✅ | `migrate-pdfs-to-hetzner.js` |

**Bucket:** `gestavly-uploads`
**URL publica:** `https://gestavly-uploads.hel1.your-objectstorage.com/`
**Env:** `HETZNER_REGION`, `HETZNER_ACCESS_KEY`, `HETZNER_SECRET_KEY`, `HETZNER_BUCKET`, `HETZNER_PUBLIC_URL`

### 6. Fichate (Control horario) — FUNCIONAL (BD separada)

| Componente | Estado |
|---|---|
| Clock in/out | ✅ |
| Ausencias | ✅ |
| Documentos | ✅ |
| Auto-crear usuario desde CRM | ✅ |
| Sync roles CRM → Fichate | ✅ |

**BD:** MySQL en IONOS (separada de PostgreSQL principal)
**Tablas:** `ft_companies`, `ft_users`, `ft_time_records`, `ft_absence_requests`, `ft_documents`, `ft_holidays`, `ft_shifts`, `ft_app_credentials`, `ft_alerts`, `ft_sessions`
**Env:** `FICHATE_DB_HOST`, `FICHATE_DB_PORT`, `FICHATE_DB_NAME`, `FICHATE_DB_USER`, `FICHATE_DB_PASS`

### 7. Google Sheets (Import polizas) — FUNCIONAL
- Import desde hojas mensuales (Ene 2025 - Ene 2026)
- Modulo `importar-polizas.js` en frontend

### 8. Claude AI (Asistente) — FUNCIONAL
- Chat con Claude desde panel admin
- `POST /api/assistant/chat`
- **Env:** `ANTHROPIC_API_KEY`

---

## MODULOS — Estado real

| Modulo | Backend | Frontend | Estado |
|---|---|---|---|
| Auth / Login | ✅ `auth.js` | ✅ `app.js` | ✅ Completo |
| Dashboard | ✅ `dashboard.js` | ✅ `dashboard.js` | ✅ Completo |
| Personas (ficha contacto) | ✅ `personas.js` | ✅ `personas.js` | ✅ Completo |
| Pipeline (Kanban deals) | ✅ `pipeline.js` | ✅ `pipeline.js` | ✅ Completo |
| Tramites (Kanban tickets) | ✅ `tickets.js` | ✅ `tickets.js` | ✅ Completo |
| Llamada activa | — | ✅ `llamada.js` | ✅ Completo |
| Calculadora + Propuestas | ✅ `calculadora.js` | ✅ `calculadora.js` | ✅ Completo |
| Grabaciones (polizas) | ✅ `grabaciones.js` | ✅ `grabaciones.js` | ✅ Completo |
| Fichate (control horario) | ✅ `fichate.js` | ✅ `fichate.js` | ✅ Completo |
| Informes | ✅ `informes.js` | ✅ `informes.js` | ✅ Completo |
| Import Excel/CSV | ✅ `import.js` | ✅ `import.js` | ✅ Completo |
| Import Polizas (Sheets) | ✅ `polizas.js` | ✅ `importar-polizas.js` | ✅ Completo |
| Settings (admin) | ✅ `settings.js` | ✅ `settings.js` | ✅ Completo |
| Asistente IA | ✅ `assistant.js` | ✅ `assistant.js` | ✅ Completo |
| CloudTalk (telefonia) | ✅ `cloudtalk.js` | ✅ Widget en `index.html` | ✅ Completo |
| WhatsApp | ✅ `whatsapp.js` | ✅ Botones en ficha | ✅ Funcional |
| Busqueda global | ✅ `search.js` | ✅ Cmd+K en `index.html` | ✅ Completo |
| Documentos | ✅ `documentos.js` | ✅ Tab en ficha | ✅ Completo |
| Historial/Timeline | ✅ `history.js` | ✅ Tab en ficha | ✅ Completo |
| Tareas | ✅ `tareas.js` | — (dentro de ficha) | ✅ Completo |
| Etiquetas | ✅ `etiquetas.js` | ✅ En ficha + pipeline | ✅ Completo |
| Multi-tenant | ✅ `admin.js` + middleware | — | ✅ Base |
| Polizas (CRUD) | ✅ `polizas.js` | ✅ Tab en ficha | ✅ Completo |
| Impagos | — | — | ❌ No implementado (sidebar existe) |
| Usuarios (admin) | — | — | ❌ No implementado (sidebar existe) |

---

## BASE DE DATOS — Todas las tablas (51 total)

### Nucleo (2)
| Tabla | Columnas clave |
|---|---|
| **users** | id, nombre, email, password_hash, rol (superadmin/admin/supervisor/agent/historico), empresa (ADESLAS/DKV/NULL), telefono, activo, tenant_id, pin, shift_id, daily_hours, vacation_days |
| **tenants** | id, nombre, slug, plan, activo, max_usuarios, max_contactos, pipedrive_token, cloudtalk_key, color_primario |

### Personas y contactos (6)
| Tabla | Columnas clave |
|---|---|
| **personas** | id, pipedrive_person_id (UNIQUE), nombre, dni (UNIQUE), telefono, email, direccion, fecha_nacimiento, nacionalidad, provincia, localidad, codigo_postal, iban, sexo, estado_civil, agente_id, tenant_id |
| **familiares** | id, persona_id (FK), nombre, dni, fecha_nacimiento, parentesco, telefono, email |
| **persona_notas** | id, persona_id (FK), user_id (FK), texto, tenant_id |
| **persona_documentos** | id, persona_id (FK), nombre, categoria, tipo_mime, tamano, ruta, user_id, tenant_id |
| **persona_etiquetas** | persona_id + etiqueta_id (PK compuesta) |
| **asegurados** | id, persona_id (FK), deal_id (FK), nombre, dni, fecha_nacimiento, sexo, parentesco, orden, tenant_id |

### Deals y pipeline (5)
| Tabla | Columnas clave |
|---|---|
| **deals** | id, pipedrive_id (UNIQUE), persona_id, pipeline_id, stage_id, agente_id, poliza, producto, compania, prima, fecha_efecto, estado, pipedrive_status (open/won/lost), datos_extra (JSONB), stage_entered_at, estado_grabacion, grabacion_pdf_url, num_solicitud, tipo_poliza, frecuencia_pago, descuento, num_asegurados, iban, observaciones, num_poliza_definitivo, estado_poliza, tenant_id |
| **deal_etiquetas** | deal_id + etiqueta_id (PK compuesta) |
| **pipelines** | id, name, pipedrive_id (UNIQUE), color, orden, active, tenant_id |
| **pipeline_stages** | id, pipeline_id (FK), pipedrive_id, name, orden, color, active, UNIQUE(pipeline_id, name), tenant_id |
| **etiquetas** | id, tenant_id, nombre, color, origen, UNIQUE(tenant_id, nombre) |

### Polizas y propuestas (3)
| Tabla | Columnas clave |
|---|---|
| **polizas** | id, persona_id, deal_id, agente_id, compania, producto, tipo_producto, n_solicitud, n_poliza, n_grabacion, fecha_efecto, forma_pago, prima_mensual, prima_anual, descuento, n_asegurados, estado (grabado/solicitud_enviada/aceptado/poliza_emitida/rechazado/baja/impago), datos_titular (JSONB), asegurados_data (JSONB), script_grabacion, recibo_mensual, origen_lead |
| **poliza_documentos** | id, poliza_id (FK), nombre, tipo, filepath |
| **propuestas** | id, persona_id, deal_id, agente_id, compania, producto, modalidad, zona, num_asegurados, prima_mensual, prima_anual, descuento, asegurados_data (JSONB), desglose (JSONB), pdf_url, pipedrive_synced, tipo_poliza, fecha_validez |

### Tickets/tramites (6)
| Tabla | Columnas clave |
|---|---|
| **tickets** | id, tipo_id, column_id, estado (nuevo/en_gestion/esperando/resuelto/cerrado), descripcion, urgencia, created_by, assigned_to, agente_id, contacto_id, compania, num_poliza, num_solicitud, prioridad, tenant_id, grabacion_pdf_url |
| **ticket_types** | id, nombre (UNIQUE), activo, orden |
| **ticket_columns** | id, nombre (UNIQUE), visible_roles (TEXT[]), visible_user_ids (INTEGER[]), activo, orden |
| **ticket_comments** | id, ticket_id (FK), user_id, mensaje |
| **notifications** | id, user_id, ticket_id, mensaje, leida |
| **tramite_comunicaciones** | id, ticket_id (FK), tipo (email/whatsapp/nota/sistema), direccion, destinatario, asunto, mensaje, agente_id |

### Comunicaciones e historial (3)
| Tabla | Columnas clave |
|---|---|
| **contact_history** | id, persona_id (FK), deal_id (FK), tipo (llamada/nota/etapa/email/tramite/propuesta/poliza/facebook), subtipo (contestada/no_contestada/buzon/devolver_llamada/...), titulo, descripcion, metadata (JSONB), agente_id, origen (manual/pipedrive/cloudtalk/facebook/sistema), tenant_id |
| **whatsapp_messages** | id, persona_id (FK), agente_id, direccion (saliente/entrante), tipo (texto/plantilla/documento/imagen), contenido, media_url, whatsapp_msg_id, estado (enviado/entregado/leido/error), error_detalle |
| **call_history** | id, persona_id, telefono, direccion, duracion, estado, agente_nombre, agente_email, recording_url, cloudtalk_call_id (UNIQUE), cloudtalk_data (JSONB) |

### Facebook Lead Ads (2)
| Tabla | Columnas clave |
|---|---|
| **fb_form_mappings** | id, form_id (UNIQUE), form_name, pipeline, etapa, agente_id, activo |
| **fb_leads** | id, leadgen_id (UNIQUE), form_id, ad_id, campaign_id, persona_id, deal_id, raw_data (JSONB) |

### Tareas (1)
| Tabla | Columnas clave |
|---|---|
| **tareas** | id, persona_id, deal_id, agente_id, tipo, titulo, descripcion, fecha_venc, hora_venc, estado (pendiente/hecha/cancelada), pipedrive_activity_id, tenant_id |

### Fichate — IONOS MySQL (10 tablas con prefijo ft_)
| Tabla | Proposito |
|---|---|
| **ft_companies** | Empresas |
| **ft_users** | Empleados con role, PIN, schedule, cloudtalk_extension |
| **ft_sessions** | Sesiones activas |
| **ft_time_records** | Fichajes (clock_in/clock_out) |
| **ft_absence_requests** | Solicitudes ausencia |
| **ft_documents** | Documentos empleados |
| **ft_holidays** | Festivos |
| **ft_shifts** | Turnos/horarios |
| **ft_app_credentials** | Credenciales apps |
| **ft_alerts** | Alertas (retraso, ausencia) |

### Otras (5)
| Tabla | Proposito |
|---|---|
| **import_logs** | Log de importaciones Excel |
| **pipedrive_sync_logs** | Log de sincronizaciones Pipedrive |
| **activity_logs** | Log de acciones de usuario |
| **leads** | Leads simples (legacy) |
| **impagos** | Impagos de polizas (tabla creada, modulo pendiente) |

---

## Pipelines de Pipedrive (16)

| ID local | Pipeline | Pipedrive ID | Color |
|---|---|---|---|
| 1 | ADESLAS | — | #009DDD |
| 2 | DKV | — | #3b82f6 |
| 10 | SALUD | — | #10b981 |
| 11 | DENTAL | — | #f59e0b |
| 12 | DECESOS | — | #8b5cf6 |
| 13 | MASCOTAS | — | #06b6d4 |
| 3 | MASCOTAS (legacy) | — | #06b6d4 |
| 5 | VIDA CALAHORRA | — | #64748b |
| 7 | PRUEBA VIDA | — | #64748b |
| 8 | AAPEX | — | #64748b |
| 9 | PRUEBAS | — | #64748b |
| 14 | HOGAR | — | #f59e0b |
| 15 | AUTO | — | #ef4444 |
| 16 | NEGOCIOS | — | #3b82f6 |
| 17 | ELECTRODOMESTICOS | — | #8b5cf6 |
| 18 | ACCIDENTES | — | #ef4444 |

---

## Roles y permisos

| Rol | Acceso |
|---|---|
| **superadmin** | Todo + multi-tenant |
| **admin** (Javier) | Todo. empresa=NULL, ve todos los tramites/deals |
| **supervisor** (Laura=ADESLAS, Jose Antonio=DKV) | Solo tramites/deals de su empresa |
| **agent** | Solo sus propios tickets + deals de su empresa |

### Empresa por usuario
- DKV: Beatriz Sanchez, Raul Llerena, Jose Antonio Recio
- ADESLAS: Todos los demas
- Admin: empresa=NULL (ve todo)

---

## Variables de entorno (Railway produccion)

### Base de datos
```
DATABASE_URL=postgresql://...   # Railway auto-provisioned
```

### Autenticacion
```
JWT_SECRET=...
```

### Pipedrive
```
PIPEDRIVE_API_KEY=70b5bb90941472cb81856a0d9c2dabdb209552e2
PIPEDRIVE_WEBHOOK_USER=avants
PIPEDRIVE_WEBHOOK_PASS=crm2026webhook
```

### CloudTalk
```
CLOUDTALK_API_KEY=QSCWFZZPEL4MAKOB1MXQ8L6
CLOUDTALK_API_SECRET=nHqaFm18?VdgN5owUs7LIfKlrk93OTPMi-GJSjph
```

### WhatsApp (Meta)
```
WHATSAPP_TOKEN=[temporal — caduca, regenerar en Meta Developers]
WHATSAPP_PHONE_ID=[Business Account Phone ID]
WHATSAPP_VERIFY_TOKEN=[token verificacion webhook]
```

### Hetzner Object Storage
```
HETZNER_REGION=hel1
HETZNER_ACCESS_KEY=4N7A23DVNBC36C5HHXR8
HETZNER_SECRET_KEY=hKDuINK8cHxfK4WdiOtuO4NIvcPru4terYAml3oY
HETZNER_BUCKET=gestavly-uploads
HETZNER_PUBLIC_URL=https://gestavly-uploads.hel1.your-objectstorage.com
```

### Fichate (IONOS MySQL)
```
FICHATE_DB_HOST=db5019447558.hosting-data.io
FICHATE_DB_PORT=3306
FICHATE_DB_NAME=dbs15215794
FICHATE_DB_USER=dbu1786147
FICHATE_DB_PASS=...
```

### IA
```
ANTHROPIC_API_KEY=...
```

---

## Datos de produccion (abril 2026)
- ~155.000 personas importadas de Pipedrive
- ~108.000 deals (2.800+ open con pipeline asignado)
- 17 usuarios (2 admin, 3 DKV, resto ADESLAS)
- 16 pipelines, 54+ stages
- 7 webhooks Pipedrive activos
- Webhook CloudTalk activo
- Webhook WhatsApp activo

---

## Emails de contacto por empresa

### ADESLAS
- GarciaNi@segurcaixaadeslas.es
- hernandezjja@agente.segurcaixaadeslas.es
- avants@agente.segurcaixaadeslas.es

### DKV
- Agentes: Beatriz Sanchez, Raul Llerena, Jose Antonio Recio (supervisor)

---

## Reglas de desarrollo — CRITICAS

1. **Fixes quirurgicos** — nunca reescribir lo que funciona
2. **Design system intocable** — colores, fuente, radios, iconos SVG
3. **Iconos SOLO SVG** de avants_icons_v2.html — NUNCA emojis, NUNCA librerias externas
4. **Comentarios en espanol, codigo en ingles**
5. **Fechas DD/MM/YYYY** en interfaces
6. **API keys en .env** — nunca hardcodeadas
7. **Toda llamada API pasa por shared/api.js** — nunca fetch directo en modulos
8. **Cada modulo es independiente** — cargado dinamicamente
9. **Settings** es el panel de configuracion — sin tocar codigo
10. **Vanilla JS/CSS** — sin frameworks, sin librerias UI
11. **NUNCA borrar datos** — usar estados (activo/inactivo, eliminado) en vez de DELETE
12. **SIEMPRE paginar Pipedrive API** — limit=500 maximo
13. **SIEMPRE dedup** — ON CONFLICT DO NOTHING al migrar, cloudtalk_call_id para llamadas
14. **SIEMPRE cruzar agentes por email** — no por nombre
15. **Webhook CloudTalk:** formato `event.properties.*` (ticket #495931)
16. **WhatsApp token temporal** — error 401 = regenerar en Meta Developers
17. **SaaS-ready / Regla de oro** — NUNCA hardcodear nombres de empresa, producto o pipeline en logica de negocio. Todo por ID dinamico. Un cliente nuevo solo necesita configurar sus pipelines y agentes en Settings.
18. **CTI Abstraction Layer** — NUNCA llamar directamente a CloudTalk/Twilio desde rutas o frontend. Todo pasa por `backend/services/cti.js` y `GVPhone.call()`. Proveedor via `CTI_PROVIDER` env var.
19. **Responsive y aprovechamiento de espacio (OBLIGATORIA):**
    - Contenedores principales: `flex:1` o `width:100%`, NUNCA anchos fijos
    - Area contenido: `height:calc(100vh - 110px)` (menos header/tabs)
    - Anchos paneles: `min-width` + `max-width` + `flex:1` para el panel principal
    - Textareas: `min-height:20vh`, `max-height:45vh`, `resize:vertical`, `width:100%`
    - Paneles laterales: ancho fijo solo en sidebar/arbol (`width:280px;flex-shrink:0`)
    - Panel contenido: `flex:1;min-width:0;overflow-y:auto` (ocupa TODO el resto)
    - Breakpoints: `@media(max-width:1280px)` paneles estrechos, `(max-width:768px)` layout vertical, `(min-height:900px)` mas espacio vertical
    - AUDITORIA: antes de push, verificar que no hay px fijos en contenedores principales
20. **Proteccion del bloque script de index.html (CRITICA):**
    - index.html tiene UN SOLO bloque `<script>` global que define GVPhone, CloudTalkWidget, SearchGlobal
    - NUNCA declarar `const/let/var` con el mismo nombre dos veces en el mismo scope — duplicate const = SyntaxError silencioso que rompe TODO el bloque y ningun objeto se inicializa
    - ANTES de push de cualquier cambio en index.html ejecutar: `node -e "const fs=require('fs');const h=fs.readFileSync('frontend/index.html','utf8');const m=h.match(/<script>([\\s\\S]*?)<\\/script>/g);if(m){try{new Function(m[m.length-1].replace(/<\\/?script>/g,''));console.log('OK')}catch(e){console.error('ERROR:',e.message)}}"`
    - Si da ERROR → no hacer push, corregir primero
    - Commit de referencia estable GVPhone: **f20a189** — si se rompe, restaurar desde ahi
    - Despues de cambios en index.html: purgar Cloudflare + hard refresh (Cmd+Shift+R)

### CTI Architecture
```
Frontend (GVPhone.call)
  → POST /api/cti/llamar
    → backend/services/cti.js
      → adapters[CTI_PROVIDER].call()
        → CloudTalk API / Twilio API / manual
```
Env var: `CTI_PROVIDER=cloudtalk` (default)

### Pipeline layout — NUNCA cambiar
```css
.pl-board {
  display: grid;
  grid-template-columns: repeat(var(--col-count,10), 1fr);
  gap: 8px; padding: 16px 20px 8px; width: 100%;
}
.pl-col { min-width: 0; }
```
NUNCA usar flex para el board, NUNCA ancho fijo en columnas, NUNCA overflow-x:auto.

### Pipeline cards — NUNCA cambiar
- `.pl-card-name`: `white-space:normal` con `-webkit-line-clamp:2`
- `.pl-col`: SIN `overflow:hidden`

### Prohibiciones absolutas
- **NUNCA usar emojis como iconos en UI** — solo SVGs
- **NUNCA cambiar CSS de Fichate** — usa #ff4a6e como accent propio
- **NUNCA tocar logica JS de calculadora/grabaciones** — modulos estables
- **NUNCA cambiar el layout CSS del pipeline** — CSS Grid dinamico

---

## Slash commands disponibles
- `/deploy` — Desplegar a Railway
- `/check-prod` — Verificar produccion
- `/db-stats` — Metricas de BD
- `/sync-pipedrive` — Sincronizacion manual
- `/pipedrive-audit` — Auditoria de sincronizacion
- `/migrate` — Gestionar migraciones
- `/deal-won` — Flujo deal ganado
- `/backup-db` — Backup de BD

---

## POWER DIALER — Plan y Arquitectura

### Decision de diseno
Construimos nuestro propio Power Dialer integrado en Avants Suite (no usamos el nativo de CloudTalk).
Motivos:
- Independencia de proveedor CTI (puede conectar con CloudTalk, Twilio, o cualquier otro)
- Activo propio para vender como SaaS a otras corredurias
- Control total sobre la logica de prioridad y automatizaciones

### Fases de desarrollo

#### FASE 1 — Power Dialer basico (sin IA)
Objetivo: las agentes solo hablan, la maquina hace el resto.

**Modulos nuevos a crear:**
- `campanas` → admin crea campanas, asigna contactos y agentes
- `dialer` → interfaz de la agente durante la jornada de llamadas

**Cola de llamadas — orden de prioridad:**
1. ROJO — Inbound perdido al 900 (cliente intento llamar — maxima urgencia)
2. NARANJA — Seguimientos para cerrar poliza (citas agendadas)
3. AMARILLO — Leads nuevos del dia asignados a la agente
4. VERDE — Campana de recuperacion (leads anteriores, ya clientes)

**Distribucion de leads:**
- Reparto equitativo automatico entre agentes disponibles
- Si agente ausente o con agenda llena → redistribuir a otra
- Leads nuevos se reparten por la manana + redistribucion continua

**Flujo de la agente:**
1. Ficha en Fichate → entra al CRM → pulsa "Iniciar jornada de llamadas"
2. Sistema marca automaticamente al primero de su cola (via CloudTalk API POST /v1/calls)
3. Agente habla
4. Al colgar → popup resultado: Interesado / No contesta / Volver a llamar / No interesado
5. Segun resultado:
   - No contesta → WhatsApp automatico → siguiente llamada automatica
   - Volver a llamar → reagenda con fecha/hora → siguiente
   - Interesado → agente anota en ficha → siguiente
   - No interesado → descarta de campana → siguiente
6. Al quedarse sin cola → sistema activa campana de recuperacion automaticamente

**Click-to-call manual:**
- Boton llamar en cualquier ficha de contacto
- Numero se normaliza a +34XXXXXXXXX
- Abre widget CloudTalk con numero pre-rellenado via postMessage
- Fallback: muestra numero copiable + link tel:
- Backend registra inicio de llamada en persona_notas

#### FASE 2 — IA (pendiente, no implementar aun)
- Transcripcion de llamadas en tiempo real
- Deteccion de intenciones: "llamame manana", "si me interesa", "no me interesa"
- WhatsApp con IA: detecta "quiero que me llameis" → sube a primera posicion de cola
- Sugerencias al agente durante la llamada
- Analisis de calidad de llamada post-llamada

### Tablas BD (Fase 1) — 5 tablas
```sql
campanas                   — config campana (horarios, max_intentos, WA auto)
campana_pipelines_origen   — N:M pipelines/stages origen (configurable desde UI)
campana_agentes            — agente-campana con pipelines_permitidos[] y orden_pipelines[]
campana_contactos          — cola con prioridad, intentos, reagendado
dialer_sesiones            — tracking sesion agente (inicio/fin, stats)
```

**REGLA DE ORO:** campanas NO tienen pipeline_id/stage_id directo.
Los pipelines origen se configuran en campana_pipelines_origen (N:M).
Cada agente hereda todos los pipelines de la campana por defecto,
pero se puede restringir/reordenar individualmente via pipelines_permitidos[].

### Configuracion del countdown pre-llamada (Settings)
Tabla `dialer_config` (por tenant):
```sql
dialer_config (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL DEFAULT 1,
  countdown_activo BOOLEAN DEFAULT false,
  countdown_segundos INTEGER DEFAULT 10, -- 5, 10, 15, 30
  whatsapp_auto_no_contesta BOOLEAN DEFAULT true,
  max_intentos_dia INTEGER DEFAULT 3,
  horario_inicio TIME DEFAULT '09:00',
  horario_fin TIME DEFAULT '21:00'
)
```
- OFF (default): llama automaticamente sin pausa
- ON: muestra briefing X segundos antes de marcar
- La agente NO puede cancelar (evita que eviten contactos)
- Cada cliente SaaS configura su propio comportamiento en Settings → Power Dialer

### Integraciones del Dialer
- **CTI abstraction layer**: backend/services/cti.js (cloudtalk | twilio | manual)
- **WhatsApp Business API**: envio automatico si no contesta
- **IA Briefing**: backend/services/ia-briefing.js (pre-llamada + post-llamada)
- **contact_history**: todas las llamadas quedan en el timeline del contacto

### Estado actual
- [x] Tablas BD creadas (migration-dialer.sql — 5 tablas)
- [x] Backend completo (routes/dialer.js — 17 endpoints)
- [x] Modulo campanas.js (admin — config campanas, pipelines origen, agentes)
- [x] Modulo dialer.js (agente — idle/active/calling/result/done/paused)
- [x] Popup resultado post-llamada (overlay obligatorio, 4 opciones + reagendar)
- [x] WhatsApp automatico en no-contesta
- [x] Click-to-call manual con numero pre-rellenado
- [x] Badge rojo sidebar con llamadas urgentes (polling 30s)
- [x] Polling 3s para detectar call_ended automatico

**Fase 1 completada: 03/04/2026**

---

## Catalogo de Productos — completado 05/04/2026

### Tablas BD (9 tablas en migration-productos.sql)
companias, categorias_producto, productos, categoria_documentos,
producto_documentos, compania_agentes, campanas_puntos,
campana_producto_puntos, dialer_config

### Backend (18 endpoints en routes/productos.js)
CRUD companias, categorias, productos, documentos (upload S3),
agentes por compania, productos faltantes para IA

### Frontend (Settings → Productos)
Arbol expandible: Compania → Categoria → Producto
Panel lateral: edicion, docs con upload, agentes con checkboxes

### Integracion IA
- generarBriefing() lee catalogo de productos y calcula gaps
- Prompt incluye "PRODUCTOS QUE LE FALTAN" con coberturas
- Respuesta incluye productos_detalle[] con coberturas, precio, compania
- Frontend muestra pills azules clicables que expanden coberturas

---

## Pendientes prioritarios (abril 2026)
1. ✅ Power Dialer Fase 1 — completado 03/04/2026
2. ✅ Catalogo Productos — completado 05/04/2026
3. ❌ Modulo Impagos (sidebar existe, modulo no)
4. ❌ Modulo Usuarios admin (sidebar existe, modulo no)
5. ❌ Facebook Lead Ads (tablas existen, flujo no)
6. ⏳ WhatsApp: plantillas, media, validacion firma
7. ⏳ Bidireccional completo CRM → Pipedrive
8. ⏳ Notificaciones tiempo real (Socket.IO)
9. ⏳ PWA movil responsive
10. ⏳ Migracion Railway → Hetzner VPS
