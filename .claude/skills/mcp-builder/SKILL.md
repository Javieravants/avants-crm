---
name: mcp-builder
description: Guide for building custom MCP servers for Avants CRM integrations (CloudTalk, WhatsApp, etc.)
---

# MCP Builder — Avants CRM

## Cuándo usar este skill
- Construir MCP server para CloudTalk (click-to-call, grabaciones, historial)
- Construir MCP server para WhatsApp Business Cloud API
- Construir MCP server para IONOS (fichate legacy sync)
- Cualquier integración externa que necesite herramientas para Claude

## Stack recomendado
- TypeScript con @modelcontextprotocol/sdk
- Transport: stdio para uso local
- Autenticación: API keys en variables de entorno

## Proceso
1. Investigar la API del servicio (endpoints, auth, rate limits)
2. Diseñar las herramientas (tool names con prefijo del servicio)
3. Implementar con Zod schemas para inputs
4. Testear con MCP Inspector: npx @modelcontextprotocol/inspector
5. Registrar: claude mcp add nombre -- node dist/index.js

## Convenciones de naming
- cloudtalk_list_calls, cloudtalk_get_recording
- whatsapp_send_message, whatsapp_list_templates
- Prefijo consistente por servicio

## Referencia
- MCP spec: https://modelcontextprotocol.io/
- TypeScript SDK: https://github.com/modelcontextprotocol/typescript-sdk
- MCP Best Practices: naming, pagination, error handling
