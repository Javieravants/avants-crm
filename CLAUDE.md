# CLAUDE.md — Avants CRM (Avants Suite)

> Archivo específico del proyecto CRM.
> Leer también el CLAUDE.md global de Avants SL.

---

## 🎯 Visión del proyecto

CRM/ERP propio para reemplazar Pipedrive a largo plazo.
Durante la transición, Pipedrive actúa como puente recibiendo webhooks.

**Nombre:** Avants Suite
**URL objetivo:** segurosdesaludonline.com/crm/ (o subdominio propio)

---

## 🏗️ Arquitectura

### Stack técnico
```
Frontend:  HTML/CSS/JS vanilla (misma línea que Fichate)
Backend:   Node.js + Express
Base de datos: PostgreSQL
Auth:      JWT tokens
```

### Estructura de carpetas objetivo
```
avants-crm/
├── backend/
│   ├── server.js           # Entry point
│   ├── config/
│   │   └── db.js           # Conexión PostgreSQL
│   ├── routes/
│   │   ├── auth.js
│   │   ├── fichate.js
│   │   ├── tickets.js
│   │   ├── leads.js
│   │   └── impagos.js
│   ├── middleware/
│   │   ├── auth.js         # JWT middleware
│   │   └── roles.js        # RBAC
│   └── models/             # Esquemas BD
├── frontend/
│   ├── index.html          # Shell principal (sidebar + router)
│   ├── modules/
│   │   ├── fichate.js
│   │   ├── tickets.js
│   │   ├── leads.js
│   │   └── impagos.js
│   └── shared/
│       ├── styles.css      # Variables y componentes globales
│       ├── api.js          # Cliente HTTP centralizado
│       └── auth.js         # Gestión de sesión frontend
└── CLAUDE.md               # Este archivo
```

---

## 🎨 Design System (OBLIGATORIO en todos los módulos)

Heredado de Fichate — **NO cambiar estos valores nunca:**

```css
:root {
  --accent:        #ff4a6e;
  --sidebar-bg:    #ffffff;
  --border-radius: 16px;
  --font-family:   'Inter', sans-serif;
  --font-size-base: 16px;       /* Texto grande */
}
```

### Componentes base (copiar de Fichate, no reinventar)
- Cards con border-radius 16px
- Sidebar blanco con accent rosa
- Botones primarios en `#ff4a6e`
- Modales con overlay semitransparente

---

## 👥 Roles y permisos

| Rol | Acceso |
|---|---|
| `admin` | Todo — configuración, usuarios, todos los módulos |
| `supervisor` | Su equipo — KPIs, aprobaciones, tickets |
| `agent` | Solo su panel — fichaje, sus tickets, sus leads |

---

## 📦 Módulos — orden de construcción

### ✅ FASE 1 — Arquitectura base (PRIMERO)
- [ ] Setup Node.js + Express + PostgreSQL
- [ ] Sistema de autenticación JWT
- [ ] Shell frontend (sidebar + navegación entre módulos)
- [ ] RBAC (control de acceso por roles)
- [ ] API client centralizado en frontend
- [ ] Estructura de carpetas completa

### 🔄 FASE 2 — Módulo Fichate (migración)
- [ ] Migrar lógica de Fichate actual (PHP → Node.js)
- [ ] Mantener UI aprobada exactamente igual
- [ ] Conectar con BD PostgreSQL
- [ ] Mantener compatibilidad con extensión Chrome

### 🔄 FASE 3 — Módulo Tickets/Trámites
- [ ] Tipos: cambios póliza, sustitución tarjeta, incidencias médicas, facturación
- [ ] Workflow: Nuevo → En gestión → Esperando → Resuelto → Cerrado
- [ ] KPI dashboard para supervisor
- [ ] Integración: nota a Pipedrive al resolver

### 🔄 FASE 4 — Módulo Leads/Pipeline
- [ ] Vista de leads por agente
- [ ] Sincronización con Pipedrive (webhooks)
- [ ] Métricas: delay inicio sesión, gaps entre llamadas

### 🔄 FASE 5 — Módulo Impagos
- [ ] Gestión de pólizas con recibo pendiente
- [ ] Seguimiento por agente

---

## 🔗 Integración con Pipedrive (durante transición)

- Pipedrive recibe webhooks del CRM
- El CRM NO lee de Pipedrive (flujo unidireccional en fase inicial)
- Campos personalizados a mantener: Campaña Facebook, Nombre Anuncio, Plataforma, AD ID
- Notas a Pipedrive: texto plano, fechas DD/MM/YYYY

---

## 🗄️ Base de datos — tablas principales

```sql
-- Usuarios del sistema
users (id, nombre, email, password_hash, rol, activo, created_at)

-- Sesiones/fichajes
fichajes (id, user_id, tipo, timestamp, ip, created_at)

-- Tickets/trámites
tickets (id, agente_id, supervisor_id, tipo, estado, descripcion, 
         pipedrive_deal_id, created_at, updated_at, resolved_at)

-- Leads
leads (id, agente_id, nombre, telefono, email, producto, 
       estado, pipedrive_id, fuente, created_at)

-- Impagos
impagos (id, poliza, titular, agente_id, importe, 
         fecha_vencimiento, estado, notas, created_at)
```

---

## ⚙️ Variables de entorno (.env)

```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=avants_crm
DB_USER=
DB_PASS=

# Auth
JWT_SECRET=
JWT_EXPIRY=8h

# Pipedrive
PIPEDRIVE_API_KEY=

# Servidor
PORT=3000
NODE_ENV=production
```

> ⚠️ NUNCA commitear el archivo .env
> ✅ Añadir .env al .gitignore desde el primer commit

---

## 🔒 Reglas de desarrollo

1. Cada módulo es un archivo JS independiente en `/frontend/modules/`
2. El shell principal carga/descarga módulos dinámicamente (SPA ligera)
3. Toda llamada a la API pasa por `shared/api.js` (nunca fetch directo en módulos)
4. La autenticación se verifica en middleware antes de cada ruta protegida
5. Los logs de actividad SÍ se registran en el CRM (a diferencia de Fichate actual)
6. Diseño: heredar siempre de Fichate — no inventar componentes nuevos innecesarios
