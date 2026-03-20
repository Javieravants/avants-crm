---
name: frontend-design
description: Design guidelines for Avants CRM frontend — vanilla JS, Inter font, #009DDD accent
---

# Frontend Design — Avants CRM

## Design System (OBLIGATORIO — no cambiar)
- Font: 'Inter', system-ui, sans-serif
- Accent: #009DDD (azul ADESLAS)
- Accent hover: #0088c2
- Accent light: #e6f5fc
- Background: #f4f6f9
- White: #ffffff
- Text: #0f172a
- Text secondary: #475569
- Text muted: #94a3b8
- Border: #e8edf2
- Border radius: 12px (cards), 8px (inputs), 50% (avatars)
- Shadow: 0 2px 8px rgba(0,0,0,0.08)
- Shadow hover: 0 4px 16px rgba(0,0,0,0.10)

## Composición
- Layout principal: sidebar (220px colapsable a 52px) + main content
- Cards: fondo blanco, border 1px solid #e8edf2, border-radius 12px
- Ficha contacto: header fijo + 2 columnas (panel izquierdo 300px + centro scroll)
- Pipeline Kanban: columnas 220px, cards con drag & drop
- Responsive: <768px sidebar oculto, 1 columna

## Componentes
- Botones primarios: background #009DDD, color white, border-radius 8px, font-weight 700
- Botones secundarios: border 1px solid #e8edf2, background white
- Inputs: padding 8-10px, border 1px solid #e8edf2, border-radius 8px, focus: border-color #009DDD
- Badges: padding 2px 8px, border-radius 20px, font-size 10-11px, font-weight 700
- Avatares: border-radius 50%, background hsl(id*47%360, 55%, 55%), iniciales en blanco
- Tablas: thead background #fafafa, th uppercase 11px, td padding 14px 20px

## Iconos
- Set propio SVG en /shared/icons.js (20+ iconos)
- Stroke-width: 1.6px, linecap: round, linejoin: round
- Tamaños: 16px sidebar, 20px botones, 24px cards

## Motion
- Transitions: 0.15s para hover, 0.2s para sidebar collapse
- Cards hover: translateY(-1px) + shadow-md
- Drag & drop: opacity 0.4 + rotate(2deg) durante arrastre

## Qué NO hacer
- NO usar emojis como iconos (usar SVGs de icons.js)
- NO cambiar el color accent de #009DDD
- NO usar fuentes diferentes a Inter
- NO usar border-radius > 16px
- NO añadir gradientes en backgrounds de cards/panels
- NO usar frameworks CSS (Tailwind, Bootstrap) — vanilla CSS only
