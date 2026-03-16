const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const authMiddleware = require('../middleware/auth');
const requireRole = require('../middleware/roles');

const router = express.Router();
router.use(authMiddleware);
router.use(requireRole('admin'));

const SYSTEM_PROMPT = `Eres el asistente IA integrado en Avants Suite, el CRM/ERP de Avants SL (correduría de seguros de salud).

Arquitectura del CRM:
- Stack: Node.js + Express (backend), HTML/CSS/JS vanilla (frontend), PostgreSQL (BD)
- Módulos: Dashboard, Fichate (fichajes), Tickets/Trámites, Leads, Impagos, Usuarios, Settings
- Auth: JWT con 3 roles (admin, supervisor, agent)
- Design system: accent #ff4a6e, border-radius 16px, fuente Inter, sidebar blanco
- Integración: Pipedrive (webhooks unidireccionales CRM → Pipedrive)

Módulo de Tickets:
- Tipos: Cambio datos póliza, Sustitución tarjeta, Incidencia médica, Cobro/facturación, Baja póliza, Documentación, Impago recibo
- Bandejas: Tickets generales (todos), Grabaciones (supervisor+admin), Bandeja de Javier (admin)
- Estados: nuevo → en_gestion → esperando → resuelto → cerrado
- Notificaciones internas + notas a Pipedrive

Tu rol: Ayudar a Javier (admin) a entender, mejorar y extender el CRM. Puedes sugerir cambios de código, nuevas funcionalidades, optimizaciones, o responder preguntas sobre cómo funciona el sistema. Responde siempre en español. Sé conciso y práctico.`;

// POST /api/assistant/chat
router.post('/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Se requiere un array de mensajes' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'API key de Anthropic no configurada. Añade ANTHROPIC_API_KEY al .env' });
  }

  try {
    const client = new Anthropic.default({ apiKey });
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const text = response.content
      .filter((c) => c.type === 'text')
      .map((c) => c.text)
      .join('');

    res.json({ response: text });
  } catch (err) {
    console.error('Error en asistente IA:', err);
    res.status(500).json({ error: err.message || 'Error al contactar con la IA' });
  }
});

module.exports = router;
