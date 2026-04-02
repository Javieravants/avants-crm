# Pipedrive Sync — Documentación completa

> Última actualización: 02/04/2026
> Fuente de verdad para sincronización Pipedrive ↔ Avants CRM

---

## 1. Formato Webhook v2

Pipedrive envía webhooks en **3 formatos posibles**. El handler (`backend/routes/webhooks.js`) los normaliza todos:

### Formato 1 — V1 clásico (con `event`)
```json
{
  "event": "updated.deal",
  "current": { ... },
  "previous": { ... }
}
```

### Formato 2 — V2 con `event` + `data` wrapper
```json
{
  "event": "updated.deal",
  "data": {
    "current": { ... },
    "previous": { ... }
  }
}
```

### Formato 3 — V2 con `meta` (el más nuevo)
```json
{
  "meta": {
    "action": "change",
    "object": "deal",
    "entity": "deal"
  },
  "data": { ... },
  "previous": { ... }
}
```

### Normalización en el handler
```javascript
// Si viene con event (v1/v2)
current = body.current || body.data?.current || body.data;
previous = body.previous || body.data?.previous || null;

// Si viene con meta (v2 nuevo) — construir event desde meta
const entity = body.meta.object || body.meta.entity;
event = `${body.meta.action}.${entity}`;
current = body.data || {};
previous = body.previous || body.previous_data || null;

// Normalizar acciones v2 → v1
const normalizedAction = { create: 'added', change: 'updated', delete: 'deleted' }[action] || action;
```

---

## 2. Scripts de sincronización

### `sync-pipeline-stages.js` (240 líneas)
- **Propósito:** Resync completo de deals comparando stage_id, pipeline_id, status, agente_id
- **Lee:** deals open, won, lost, deleted por separado
- **Paginación:** `limit=500` con check de `more_items_in_collection`
- **Upsert:** `ON CONFLICT (pipedrive_id) DO UPDATE`
- **Uso:** `node backend/scripts/sync-pipeline-stages.js`

### `resync-deals-custom-fields.js` (252 líneas)
- **Propósito:** Resync de campos personalizados → personas, propuestas, asegurados, deals
- **Lee:** deals open y won
- **Operaciones:**
  - Actualiza `personas` con datos del titular (DNI, fecha nac, sexo, nacionalidad, dirección, provincia, CP)
  - Inserta/actualiza `propuestas` (producto, precio, fecha efecto, campaña, nº asegurados, forma pago)
  - Inserta/actualiza `asegurados` (personas 1-12 con parentesco)
  - Actualiza `deals` con datos de póliza
- **Uso:** `node backend/scripts/resync-deals-custom-fields.js`

### `sync-custom-fields.js` (~130 líneas)
- **Propósito:** Sync solo campos personalizados para deals sin datos_extra
- **Uso:** `node backend/scripts/sync-custom-fields.js [--status open|won|lost|all]`

### `register-webhooks.js` (103 líneas)
- **Propósito:** Registrar/listar/borrar webhooks en Pipedrive
- **Uso:**
  ```bash
  node backend/scripts/register-webhooks.js https://tu-dominio.com
  node backend/scripts/register-webhooks.js --list
  node backend/scripts/register-webhooks.js --delete
  ```

### `sync-activities.js`
- **Propósito:** Migrar actividades históricas de Pipedrive a contact_history
- **Paginación:** `limit=100`
- **Usa ON CONFLICT DO NOTHING** para evitar duplicados

### `sync-deals-status.js`
- **Propósito:** Sincronizar deals won/lost que no se importaron inicialmente
- **Paginación:** `limit=500`

---

## 3. Pipelines y stages con IDs

### Pipelines en BD
| ID local | Pipeline | ID Pipedrive | Color |
|----------|----------|-------------|-------|
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

### Pipelines en Pipedrive (mapping documentado)
| Pipeline | ID Pipedrive | Empresa |
|----------|-------------|---------|
| ADESLAS SALUD | 10 | ADESLAS |
| DENTAL | 11 | ADESLAS |
| DECESOS | 12 | ADESLAS |
| MASCOTAS | 13 | ADESLAS |

### Stages — resolución dinámica
Si un stage no existe localmente al recibir un webhook, el handler lo crea automáticamente:
```javascript
// webhooks.js, líneas 118-134
const stageRow = await pool.query(
  'SELECT id FROM pipeline_stages WHERE pipedrive_id = $1', [pipedrive_stage_id]
);
// Si no existe → fetch desde Pipedrive API → INSERT en pipeline_stages
```

---

## 4. Problemas encontrados y sus fixes

### 4.1 Historial duplicado — CRÍTICO
**Problema:** `deal.updated` dispara en CUALQUIER modificación del deal (no solo cambio de etapa). Genera entradas "INTENTANDO CONTACTAR → INTENTANDO CONTACTAR" en contact_history.

**Fix:** Verificar que la etapa realmente cambió antes de registrar:
```javascript
const dealActual = await pool.query(
  'SELECT stage_id FROM deals WHERE pipedrive_id = $1', [pipedrive_id]
);
if (etapaAnterior !== nuevaStageId) {
  // Solo entonces INSERT INTO contact_history
}
```

### 4.2 Deals won/lost no importados
**Problema:** Importación inicial solo trajo deals `status='open'`. Deals ganados/perdidos históricos no estaban en el CRM.

**Fix:** Script `sync-deals-status.js` que lee con paginación:
```
GET /v1/deals?status=won&start=0&limit=500
GET /v1/deals?status=lost&start=0&limit=500
```

### 4.3 Columnas cortas (VARCHAR)
**Problema:** Campos como `pipedrive_stage`, `pipedrive_status` definidos con `VARCHAR(100)` que podían quedarse cortos para nombres de etapas o campos concatenados.

**Tamaños actuales en migraciones:**
- `varchar(200)` para nombres de pipeline y stage
- `varchar(100)` para pipedrive_stage, status, owner
- `varchar(50)` para teléfonos
- UNIQUE constraints en `pipedrive_id` (personas, deals)

### 4.4 Deals eliminados
**Problema:** Pipedrive envía `delete.deal`. Si se borra físicamente de la BD, se pierde el histórico.

**Fix:** NUNCA borrar, solo marcar estado:
```javascript
// webhooks.js, líneas 431-437
await pool.query(
  "UPDATE deals SET estado = 'eliminado', updated_at = CURRENT_TIMESTAMP WHERE pipedrive_id = $1",
  [pipedriveId]
);
```

### 4.5 Personas eliminadas
**Fix:** No se borran. Solo se loguea:
```javascript
console.log(`[Webhook] Persona #${pipedriveId} eliminada en Pipedrive (mantenida en CRM)`);
```

### 4.6 Actividades históricas no migradas
**Problema:** Webhooks de actividades solo se crearon el 23/03/2026. Todo lo anterior no estaba en contact_history.

**Fix:** Script `sync-activities.js` con `ON CONFLICT DO NOTHING` usando `pipedrive_activity_id` en metadata como clave de deduplicación.

### 4.7 Agentes sin cruzar
**Problema:** Deals importados sin agente asignado (solo 367 de 106.771).

**Fix:** Cruce por email:
```sql
UPDATE deals d SET agente_id = u.id
FROM users u
WHERE d.pipedrive_owner = u.pipedrive_owner_id::text
  AND d.agente_id IS NULL;
```
**Resultado 23/03/2026:** 367 → 106.771 deals con agente.

### 4.8 Cache bust del navegador
**Problema:** Cambios en JS no llegaban por caché del navegador.

**Fix actual:** `?v=20260323b` en script tags de index.html.

---

## 5. Estado actual de webhooks

**URL:** `https://avants-crm-production.up.railway.app/webhook/pipedrive`
**Ruta en app:** `POST /api/webhooks/pipedrive`
**Auth:** Basic Auth (`avants:crm2026webhook`)

### 7 webhooks activos (desde 23/03/2026)
| Webhook | Estado | Handler |
|---------|--------|---------|
| `create.deal` (deal.added) | Activo | handleDeal() — crea deal en BD |
| `change.deal` (deal.updated) | Activo | handleDeal() — actualiza status, stage, owner, custom fields |
| `delete.deal` (deal.deleted) | Activo | handleDeal() — marca `estado='eliminado'`, nunca borra |
| `create.person` (person.added) | Activo | handlePerson() — crea persona en BD |
| `change.person` (person.updated) | Activo | handlePerson() — actualiza datos persona |
| `create.activity` (activity.added) | Activo | handleActivity() — registra en contact_history + tareas |
| `change.activity` (activity.updated) | Activo | handleActivity() — actualiza contact_history + tareas |

### Respuesta rápida
```javascript
res.status(200).json({ ok: true }); // Responder inmediatamente a Pipedrive
```

---

## 6. Mapeo de campos personalizados

### DEAL_FIELDS (hashes Pipedrive → campo CRM)
```javascript
{
  dni:             'ac4b5a68dd8017ad4e272a277acfa3900083ec2c',
  nombre_titular:  '7be436a2ba6a9716faa8297f9217eb6a399fce7b',
  fecha_nac:       'b6e5e600603abc4ef5fa0adada3afbb8e87f2af0',
  sexo:            'f30ff90ede820fd3cbe38e0d3fabcd2b340a64ec',
  provincia:       '59254e99faba7f7363e90a38cfe9bda47e868e56',
  poblacion:       '6c12cd4518ba4bc5b39d8a537ad1a656c8f7fcb4',
  direccion:       '4174ce87fa81673775d04dc415ece3df77bcdba9',
  cod_postal:      '3df0724c19951d401cac42b4bc5b1b657eb36d50',
  freq_pago:       'bec5e85fc187a079508a772b11d07bb016f09365',
  iban:            '96989616deb0d45af2c7ca9b4f3cb8690f1e1e21',
  estado_civil:    '61f7204af03724e4c808716a449207cd13333983',
  nacionalidad:    'af52237fd40a2dc8c6a872d9a3189c67396560a4',
  tipo_poliza:     '3bbf1d7498851d89b0a1c8058bf63581284fd223',
  n_solicitud:     'e52a6275eab20be44e25ae4d0299c60d4d5f25b8',
  poliza:          '0becdaead32abfdda6eac11a73dc89b22760725f',
  n_asegurados:    'b9a7a346963c4c6ebe2ecfc9f06a6a11ed581d03',
  precio:          '5618371c04237f61f24ef097b1038d9eec00d3df',
  descuento:       '15a955b1555b507810cd34a9a22d4b03506ed1a7',
  efecto:          'ccc79ae1430a738779b1458fca6c92a048523c31',
  etiqueta:        '4363500d82f493e99534054e26dbebd7cd15d445',
  campana_fb:      'c8fbebd78f50513852c00ab3686edb8dfca3d536',
  comision:        'e40123ad99d0f954e88b43f3c90964a7f09462a5',
  nombre_anuncio:  'd53398324c87d5bcb636317791a39e9eb367ea98',
  plataforma:      '7ec3412d66ed7858fe73444f426c6c9cf18672f2',
  ad_id:           '75b0af7a051f49a2fee51f27a830fbc2484b5b06',
  observaciones:   '652b847100e1c92b57e7d4dc3c11373e9a23111e',
}
```

### PERSON_FIELDS
```javascript
{
  dni:       '303a6637a70e700bd62969e13422e9b56a7a580f',
  dni_alt:   'fd6a652732bb68b2bfd6af0865f213cba5585d1a',
  fecha_nac: '4998e149210abdb567698f83129f15f4e0fabfbd',
  sexo:      '196d1c1f08378911e979bb4f45b0568fbafab636',
  provincia: 'b752d1c165962221b241c19714c9a64247d618ea',
}
```

### Enum maps
- **PROVINCIA_MAP:** 52 provincias (IDs 147-198 → Álava, Barcelona, Madrid, etc.)
- **SEXO_MAP:** `{114: 'H', 115: 'M', 116: 'Otro'}`
- **SEXO_ASEG_MAP:** `{275: 'H', 276: 'M'}`
- **PARENTESCO_MAP:** `{110: 'Titular', 111: 'Cónyuge', 112: 'Hijo/a', ...}` (11 valores)
- **FREQ_PAGO_MAP:** `{297: 'MENSUAL', 298: 'TRIMESTRAL', 299: 'SEMESTRAL', 300: 'ANUAL'}`

### Asegurados (personas 2-12)
Cada asegurado tiene 5 campos personalizados (nombre, fecha, dni, parentesco, sexo) en `ASEG_KEYS`.

---

## 7. Mapeo de estados

### Deal status → estado CRM
```javascript
status === 'won'  → estado = 'poliza_activa'
status === 'lost' → estado = 'perdido'
status === 'open' → estado = 'en_tramite'
```

### Actividades Pipedrive → contact_history
| Tipo Pipedrive | Tipo CRM | Notas |
|----------------|----------|-------|
| call | llamada | Incluir duración |
| note | nota | texto en descripcion |
| task | actividad | fecha_venc en metadata |
| meeting | reunion | — |
| email | email | asunto en metadata |

---

## 8. Reglas criticas

1. **NUNCA borrar datos** — usar status/estado para soft-delete
2. **NUNCA registrar en contact_history si etapa_origen === etapa_destino** (evita duplicados)
3. **SIEMPRE paginar** las llamadas a Pipedrive API (`limit=500` maximo, excepto actividades que usan `limit=100`)
4. **SIEMPRE usar ON CONFLICT DO NOTHING** al migrar historicos para evitar duplicados
5. **SIEMPRE cruzar agentes por email**, no por nombre
6. **Deals ganados/perdidos DEBEN aparecer** en oportunidades del contacto (no solo open)
7. **Etiquetas se gestionan desde Pipedrive/Make**, el CRM solo las muestra y filtra
8. **Responder 200 inmediatamente** al webhook, procesamiento despues
9. **Webhook auth:** Basic Auth obligatorio en produccion

---

## 9. Archivos clave

| Archivo | Lineas | Proposito |
|---------|--------|-----------|
| `backend/routes/webhooks.js` | ~637 | Handler principal de webhooks Pipedrive |
| `backend/utils/pipedrive-sync.js` | ~331 | Utilidades reutilizables (fetchAll, enum maps, field hashes) |
| `backend/scripts/register-webhooks.js` | 103 | Registrar/listar/borrar webhooks |
| `backend/scripts/sync-pipeline-stages.js` | ~240 | Resync completo de deals con pipeline/stage |
| `backend/scripts/resync-deals-custom-fields.js` | 252 | Resync campos personalizados + propuestas + asegurados |
| `backend/scripts/sync-custom-fields.js` | ~130 | Sync solo campos personalizados |
| `backend/scripts/sync-deals-status.js` | — | Sync deals won/lost historicos |
| `backend/scripts/sync-activities.js` | — | Migrar actividades historicas |
| `backend/config/migration-pipedrive.sql` | 49 | Schema integracion Pipedrive |
| `backend/config/migration-pipeline.sql` | 69 | Schema pipelines/stages + seed |
| `backend/config/migration-webhooks.sql` | 51 | Schema CloudTalk + Facebook webhooks |
| `skills/SKILL-pipedrive-sync.md` | 225 | Skill operativo (version compacta) |

---

## 10. Etiquetas de Pipedrive (fuentes de leads)

| Etiqueta | Tipo | Descripcion |
|----------|------|-------------|
| ADESLAS SALUD | Producto | Campaña salud ADESLAS |
| ADESLAS MASCOTAS | Producto | Campaña mascotas |
| ADESLAS DENTAL | Producto | Campaña dental |
| ADESLAS | Producto | ADESLAS generico |
| DKV SALUD | Producto | Campaña salud DKV |
| DECESOS FACE | Producto | Decesos via Facebook |
| SALUD FAMEDIC | Producto | Salud via Famedic |
| GADS | Origen | Google Ads |
| SALUD AAPEX | Proveedor | Salud via AAPEX |
| AAPEX SALUD | Proveedor | Salud via AAPEX |
| AAPEX FAMEDIC | Proveedor | Famedic via AAPEX |
| AAPEX ADESLAS | Proveedor | ADESLAS via AAPEX |
| AAPEX DKV | Proveedor | DKV via AAPEX |
| AAPEX PREMIM | Proveedor | Premim via AAPEX |
| AAPEX DENTAL | Proveedor | Dental via AAPEX |

Las etiquetas se leen desde: `GET /v1/dealFields` → campo "label" con id, label y color.
