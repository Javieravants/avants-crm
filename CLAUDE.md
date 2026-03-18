# CLAUDE.md — Avants CRM (Avants Suite)
> Versión 2.0 — Marzo 2026
> Leer también el CLAUDE.md global de Avants SL.
> Este documento es la fuente de verdad del proyecto. Seguirlo siempre.

---

## 🎯 Visión del proyecto

CRM/ERP propio para reemplazar Pipedrive a largo plazo.
Objetivo final: producto SaaS vendible a otras corredurías de seguros y sectores similares.
Durante la transición, Pipedrive actúa como puente con sincronización bidireccional.

**Repositorio:** https://github.com/Javieravants/avants-crm
**Servidor actual:** Railway (temporal) → migrar a Hetzner VPS CX23
**Stack:** Node.js + Express + PostgreSQL + HTML/CSS/JS vanilla

---

## 🎨 Design System — NUNCA CAMBIAR

```css
:root {
  --accent:        #ff4a6e;
  --sidebar-bg:    #ffffff;
  --border-radius: 16px;
  --font-family:   'Inter', sans-serif;
  --font-size-base: 16px;
}
```

---

## 🏗️ Filosofía de datos

- El centro de todo es **la PERSONA** — no el deal ni la póliza
- **Deal** = oportunidad activa en el pipeline (lo que se está trabajando)
- **Póliza** = producto ya vendido, histórico permanente de la persona
- Cuando un deal se gana → info pasa a la persona como póliza → deal desaparece del pipeline
- Todo lo que se haga con un cliente queda en su historial permanente
- Una persona puede tener múltiples pólizas de diferentes compañías y productos

---

## 👤 PERSONA

### Campos obligatorios
- Nombre completo
- DNI/NIF
- Teléfono
- Email

### Campos opcionales
- Fecha de nacimiento
- Dirección
- Nacionalidad
- Notas

### Familiares/Asegurados vinculados
- Nombre, DNI, fecha nacimiento, parentesco, teléfono, email
- Para campañas de fidelización y felicitaciones de cumpleaños

### Secciones dentro de la ficha del contacto
1. **Pólizas contratadas** — cada una con precio individual para contabilidad
2. **Oportunidades** — productos que no tiene y se le podrían vender
3. **Trámites** — todos los tickets vinculados
4. **Documentos** — todos los archivos organizados
5. **WhatsApp** — conversaciones con el cliente (Unipile)
6. **Email** — emails enviados y recibidos
7. **Llamadas** — historial CloudTalk
8. **Historial** — línea de tiempo de todo
9. **Notas** — notas libres del equipo

### Acciones rápidas desde el contacto
- Abrir calculadora
- Nueva grabación
- Nuevo trámite
- Enviar email resumen
- Abrir en Pipedrive
- Abrir WhatsApp
- Click to call (CloudTalk)

### Búsqueda y filtros
- Búsqueda por: nombre, DNI, teléfono, email, nº póliza, provincia
- Filtros por: compañía, producto, estado póliza, agente, tiene/no tiene X producto

### Campos personalizados
- Añadibles desde Settings sin tocar código

---

## 📋 DEAL (oportunidad activa)

### Campos obligatorios
- Persona vinculada
- Compañía (ADESLAS, DKV...)
- Pipeline asignado
- Etapa actual
- Agente asignado
- Fecha creación

### Campos opcionales
- Producto de interés
- Prima estimada
- Campaña origen
- Comentarios
- Documentos adjuntos

### Panel de oportunidades dentro del deal
- Qué productos ya tiene la persona
- Qué productos podría contratar aún
- Base para campañas de venta cruzada

### Flujo cuando se gana un deal
1. Deal marcado como GANADO
2. Póliza creada automáticamente en la persona
3. Deal desaparece del pipeline
4. Nota automática en historial
5. Sincronización con Pipedrive

---

## 📄 PÓLIZA (histórico permanente)

| Campo | Descripción |
|---|---|
| Persona vinculada | Obligatorio |
| Compañía | ADESLAS, DKV... |
| Producto | Del catálogo |
| Nº Solicitud | — |
| Nº Póliza | — |
| Nº Grabación | Audio |
| Fecha grabación | — |
| Fecha efecto | — |
| Forma de pago | Mensual/Anual/Trimestral |
| Descuento | % |
| Prima anual/mensual | — |
| Beneficio / Base | — |
| Asegurados | Nº |
| Campaña | Origen |
| Carencias | — |
| Enviada CCPP | Sí/No |
| Estado | Activa/Impago/Baja/Pendiente/Rechazada |
| Agente | Quien la vendió |
| Comentarios | — |
| Documentos | Adjuntos |

---

## 📦 CATÁLOGO DE PRODUCTOS

### ADESLAS — Salud Particulares
- GO
- Plena, Plena Plus, Plena Total, Plena Vital, Plena Vital Total
- Senior, Senior Total

### ADESLAS — Salud Colectivos
- Familiar de Funcionarios
- Aristeo
- (otros creables desde Settings)

### ADESLAS — Salud Autónomos
- Negocios NIF
- Extra Autónomos

### ADESLAS — Salud Empresas
- Negocios CIF 1-4
- Negocios CIF 5+
- Pyme Total
- Extra Empresas

### ADESLAS — Extras/Complementos
- Extra 150.000
- Extra 240.000
- Extra 1.000.000

### ADESLAS — Dental
- Dental MAX
- Dental Familia

### ADESLAS — Decesos
- Decesos Plus
- Decesos Completo
- Decesos Prima Única

### ADESLAS — Mascotas
- Básica
- Completa

### ADESLAS — Otros
- Hogar, Auto, Accidentes, Electro, Asistencia en Viaje

### DKV — Salud Particulares
- Integral Elite, Integral Classic, Integral Complet, Personal Doctor

### DKV — Salud Colectivos
- Famedic, Famedic Profesional, Fuencisla

### DKV — Salud Empresas
- DKV Profesional, DKV Empresas

### DKV — Otros
- Dental, Decesos, Hogar, Renta, Renta Baremada, Seguro de Vida

> ⚙️ Todos los productos son editables y ampliables desde Settings

---

## 🔄 PIPELINES Y EMBUDOS

### EMBUDO ADESLAS
Ventas IA → Renovación → Venta Cruzada → Adeslas → Dental → Mascotas → Decesos → Intentando Contactar → Contactado → Esperando Documentación

### EMBUDO DKV
Renovación → Negocios → Salud → Decesos → Facebook → Dental DKV → Intentando Contactar → Contactado → Esperando Documentación

### EMBUDO MASCOTAS
Lead → Contactado → Enviada Propuesta → Esperando Documentación

### Reglas
- Deal puede moverse entre etapas del mismo pipeline
- Deal puede moverse a otro embudo/compañía
- Vista Kanban igual que Pipedrive
- Embudos y etapas creables/editables desde Settings
- Contactos compartidos entre todos los embudos

---

## 📦 MÓDULOS

### ✅ FASE 1 — Completada
- Arquitectura base Node.js + PostgreSQL + Auth JWT
- Módulo Tickets/Trámites básico
- Settings — gestión de usuarios
- Importador Excel

### 🔄 FASE 2 — En construcción
- **Personas + Deals + Pólizas** (núcleo del CRM)
- **Pipeline Kanban** por embudo
- **Catálogo de productos**
- **Sincronización Pipedrive** (webhooks bidireccional)

### 📅 FASE 3 — Próximas
- Módulo Grabaciones completo
- Módulo Impagos
- Integración CloudTalk
- Integrar Fichate

### 📅 FASE 4 — Futuras
- WhatsApp Business (Unipile)
- Email integrado
- Mensajería interna
- App móvil (PWA o React Native)
- Integrar Calculadora
- IA (campañas automáticas, análisis grabaciones)

---

## 🎫 MÓDULO TRÁMITES (detalle)

### Tipos (configurables desde Settings)
Alta de póliza, Baja de póliza, Tarjeta/Documentación, Modificación de datos, Facturación/Pagos, Incidencia médica, Certificado/Informe, Rehabilitación, Otro

### Estados
Nuevo → En gestión → Esperando → Resuelto → Cerrado

### Flujo
- Agente crea ticket → Laura o Javier gestionan → respuesta al agente
- Laura recibe todos por defecto, agente puede cambiarlo a Javier
- Al resolver → nota automática en CRM y Pipedrive

### Campos especiales
- Nº EGAS
- Nº de grabación
- Múltiples números de incidencia por ticket
- Alarmas con fecha (aviso visual y email)
- Adjuntos sin límite con previsualización
- Botón enviar email resumen con plantilla

### Bandeja privada de Javier
- Solo visible para Javier
- Laura le asigna trámites con la compañía
- Javier ve qué falta tramitar

---

## 🎙️ MÓDULO GRABACIONES (detalle)

- Se activa cuando deal pasa a GANADO
- Arrastra nota estructurada completa de la grabación
- Campos: nº solicitud, nº grabación, nº póliza
- Textos de ticket diferentes según producto (salud, dental, decesos, mascotas)
- Estados: Grabado → Solicitud enviada → Aceptado → Póliza emitida → Rechazado → Baja → Impago
- Adjuntos con previsualización
- Guardado en CRM y Pipedrive simultáneamente
- Notificación automática a Laura y Javier con resumen
- Burbuja en header con pólizas pendientes de subir

---

## 👥 ROLES Y PERMISOS

| Rol | Acceso |
|---|---|
| **Admin (Javier)** | Todo — configuración, usuarios, todos los módulos, métricas globales |
| **Supervisor (Laura y otros)** | Todos los contactos, deals, trámites. Configurable por Javier |
| **Agente** | Solo sus clientes, sus trámites, su pipeline. Sin datos sensibles (IBAN, DNI completo, grabación) una vez cerrada la venta |

---

## 🔌 INTEGRACIONES

### Pipedrive (transición)
- 153.000 contactos y 127.000 deals ya importados
- Sincronización bidireccional en tiempo real (webhooks)
- Al resolver trámite → nota automática en Pipedrive

### CloudTalk
- Click to call desde ficha del contacto
- Grabaciones de llamadas vinculadas al contacto
- Historial de llamadas con fecha, duración, agente, resultado
- Estadísticas por agente

### WhatsApp Business (Unipile)
- Tarifa plana por cuenta — sin pagar por mensaje
- Conversaciones vinculadas al contacto
- Múltiples agentes desde el CRM
- Plantillas configurables

### Email
- Cuentas @segurosdesaludonline.es integradas
- Outlook: abrir mailto con texto prellenado
- Historial de emails en ficha del contacto

### Google Drive
- Lectura directa de Excel de ventas
- Importación automática al CRM

---

## ⚙️ REGLAS DE DESARROLLO

1. **Fixes quirúrgicos** — nunca reescribir lo que funciona
2. **Diseño intocable** — sidebar blanco, #ff4a6e, Inter, 16px radius
3. **Siempre evaluar MCPs, Skills y agentes** antes de hacer trabajo manual
4. **Comentarios en español, código en inglés**
5. **Fechas siempre DD/MM/YYYY** en interfaces
6. **API keys en .env** — nunca hardcodeadas
7. **.env nunca en GitHub** — ya está en .gitignore
8. **Cada módulo es independiente** — cargado dinámicamente
9. **Toda llamada API pasa por shared/api.js** — nunca fetch directo en módulos
10. **Settings** es el panel de configuración de todo — sin tocar código
