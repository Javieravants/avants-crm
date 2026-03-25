const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const { generarPDFPropuesta } = require('../utils/pdf-generator');

// Todas las rutas requieren autenticación
router.use(auth);

// POST /api/calculadora/propuestas — Guardar propuesta + generar PDF
router.post('/propuestas', async (req, res) => {
  try {
    const {
      persona_id, deal_id, compania, producto, modalidad,
      zona, provincia, num_asegurados, prima_mensual, prima_anual,
      descuento, descuento_contra, campana_puntos, fecha_efecto,
      forma_pago, asegurados_data, desglose, nota_contenido,
      pipedrive_deal_id
    } = req.body;

    if (!producto) {
      return res.status(400).json({ error: 'Producto es obligatorio' });
    }

    const { tipo_poliza, fecha_validez } = req.body;
    const validez = fecha_validez || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    const result = await pool.query(`
      INSERT INTO propuestas (
        persona_id, deal_id, agente_id, compania, producto, modalidad,
        zona, provincia, num_asegurados, prima_mensual, prima_anual,
        descuento, descuento_contra, campana_puntos, fecha_efecto,
        forma_pago, asegurados_data, desglose, nota_contenido,
        pipedrive_deal_id, tipo_poliza, fecha_validez
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
      RETURNING *
    `, [
      persona_id || null, deal_id || null, req.user.id,
      compania || 'ADESLAS', producto, modalidad || null,
      zona || null, provincia || null, num_asegurados || 1,
      prima_mensual || null, prima_anual || null,
      descuento || 0, descuento_contra || 0, campana_puntos || 0,
      fecha_efecto || null, forma_pago || 'mensual',
      JSON.stringify(asegurados_data || []),
      JSON.stringify(desglose || {}),
      nota_contenido || null, pipedrive_deal_id || null,
      tipo_poliza || producto || null, validez
    ]);

    const propuesta = result.rows[0];

    // Generar PDF
    try {
      let personaData = {};
      if (persona_id) {
        const pRes = await pool.query('SELECT * FROM personas WHERE id = $1', [persona_id]);
        personaData = pRes.rows[0] || {};
      }
      propuesta._persona = personaData;
      propuesta.desglose = desglose || {};
      propuesta.asegurados_data = asegurados_data || [];
      // Nombre del agente para el PDF
      const agRes = await pool.query('SELECT nombre FROM users WHERE id = $1', [req.user.id]);
      propuesta._agente_nombre = agRes.rows[0]?.nombre || '';

      const pdfUrl = await generarPDFPropuesta(propuesta);
      await pool.query('UPDATE propuestas SET pdf_url = $1 WHERE id = $2', [pdfUrl, propuesta.id]);
      propuesta.pdf_url = pdfUrl;
    } catch (pdfErr) {
      console.error('Error generando PDF propuesta:', pdfErr.message);
    }

    res.status(201).json(propuesta);
  } catch (err) {
    console.error('Error guardando propuesta:', err);
    res.status(500).json({ error: 'Error al guardar propuesta' });
  }
});

// GET /api/calculadora/propuestas/:id — Detalle propuesta
router.get('/propuestas/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.nombre as agente_nombre
      FROM propuestas p
      LEFT JOIN users u ON u.id = p.agente_id
      WHERE p.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Propuesta no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error obteniendo propuesta:', err);
    res.status(500).json({ error: 'Error al obtener propuesta' });
  }
});

// GET /api/calculadora/propuestas/persona/:personaId — Propuestas de una persona
router.get('/propuestas/persona/:personaId', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.nombre as agente_nombre
      FROM propuestas p
      LEFT JOIN users u ON u.id = p.agente_id
      WHERE p.persona_id = $1
      ORDER BY p.created_at DESC
    `, [req.params.personaId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error listando propuestas:', err);
    res.status(500).json({ error: 'Error al listar propuestas' });
  }
});

// GET /api/calculadora/propuestas/deal/:dealId — Propuestas de un deal
router.get('/propuestas/deal/:dealId', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, u.nombre as agente_nombre
      FROM propuestas p
      LEFT JOIN users u ON u.id = p.agente_id
      WHERE p.deal_id = $1
      ORDER BY p.created_at DESC
    `, [req.params.dealId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error listando propuestas por deal:', err);
    res.status(500).json({ error: 'Error al listar propuestas' });
  }
});

// GET /api/calculadora/propuestas/:id/pdf — Servir PDF (regenera si no existe)
router.get('/propuestas/:id/pdf', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM propuestas WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Propuesta no encontrada' });

    const propuesta = rows[0];
    const pdfPath = propuesta.pdf_url ? require('path').join(__dirname, '../..', propuesta.pdf_url) : null;

    // Regenerar si no existe en disco
    if (!pdfPath || !require('fs').existsSync(pdfPath)) {
      let personaData = {};
      if (propuesta.persona_id) {
        const pRes = await pool.query('SELECT * FROM personas WHERE id = $1', [propuesta.persona_id]);
        personaData = pRes.rows[0] || {};
      }
      let agenteNombre = '';
      if (propuesta.agente_id) {
        const aRes = await pool.query('SELECT nombre FROM users WHERE id = $1', [propuesta.agente_id]);
        agenteNombre = aRes.rows[0]?.nombre || '';
      }

      propuesta._persona = personaData;
      propuesta._agente_nombre = agenteNombre;
      propuesta.desglose = typeof propuesta.desglose === 'string' ? JSON.parse(propuesta.desglose) : (propuesta.desglose || {});
      propuesta.asegurados_data = typeof propuesta.asegurados_data === 'string' ? JSON.parse(propuesta.asegurados_data) : (propuesta.asegurados_data || []);

      const newUrl = await generarPDFPropuesta(propuesta);
      await pool.query('UPDATE propuestas SET pdf_url = $1 WHERE id = $2', [newUrl, propuesta.id]);
      propuesta.pdf_url = newUrl;
    }

    const finalPath = require('path').join(__dirname, '../..', propuesta.pdf_url);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="propuesta_${req.params.id}.pdf"`);
    require('fs').createReadStream(finalPath).pipe(res);
  } catch (err) {
    console.error('Error PDF propuesta:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/calculadora/grabacion/:dealId/pdf — Servir PDF grabación (regenera si no existe)
router.get('/grabacion/:dealId/pdf', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM deals WHERE id = $1', [req.params.dealId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Deal no encontrado' });

    const deal = rows[0];
    let pdfPath = deal.grabacion_pdf_url ? require('path').join(__dirname, '../..', deal.grabacion_pdf_url) : null;

    if (!pdfPath || !require('fs').existsSync(pdfPath)) {
      // Regenerar PDF
      const { generarPDFGrabacion } = require('../utils/pdf-generator');
      let persona = {};
      if (deal.persona_id) {
        const pRes = await pool.query('SELECT * FROM personas WHERE id = $1', [deal.persona_id]);
        persona = pRes.rows[0] || {};
      }
      let agente = '';
      if (deal.agente_id) {
        const aRes = await pool.query('SELECT nombre FROM users WHERE id = $1', [deal.agente_id]);
        agente = aRes.rows[0]?.nombre || '';
      }
      const asegurados = (await pool.query('SELECT * FROM asegurados WHERE deal_id = $1', [deal.id])).rows;

      const newUrl = await generarPDFGrabacion({
        deal_id: deal.id, tipo_poliza: deal.tipo_poliza, compania: deal.compania,
        prima: deal.prima, fecha_efecto: deal.fecha_efecto, num_solicitud: deal.num_solicitud,
        poliza: deal.poliza, nombre: persona.nombre, dni: persona.dni,
        fecha_nacimiento: persona.fecha_nacimiento, sexo: persona.sexo,
        telefono: persona.telefono, email: persona.email, direccion: persona.direccion,
        codigo_postal: persona.codigo_postal, provincia: persona.provincia,
        localidad: persona.localidad, iban: deal.iban || persona.iban,
        agente_nombre: agente, asegurados,
        datos_especificos: typeof deal.datos_extra === 'string' ? JSON.parse(deal.datos_extra) : deal.datos_extra,
      });
      await pool.query('UPDATE deals SET grabacion_pdf_url = $1 WHERE id = $2', [newUrl, deal.id]);
      pdfPath = require('path').join(__dirname, '../..', newUrl);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="grabacion_${req.params.dealId}.pdf"`);
    require('fs').createReadStream(pdfPath).pipe(res);
  } catch (err) {
    console.error('Error PDF grabacion:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/calculadora/asegurados — Guardar/actualizar asegurado
router.post('/asegurados', async (req, res) => {
  const { persona_id, nombre, fecha_nacimiento, sexo, parentesco, provincia, localidad, dni } = req.body;
  if (!persona_id || !nombre) return res.status(400).json({ error: 'persona_id y nombre obligatorios' });

  try {
    // Upsert: si ya existe con mismo persona_id + nombre → actualizar
    const existing = await pool.query(
      'SELECT id FROM asegurados WHERE persona_id = $1 AND nombre = $2',
      [persona_id, nombre]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE asegurados SET
           fecha_nac = COALESCE($1::date, fecha_nac),
           sexo = COALESCE(NULLIF($2,''), sexo),
           parentesco = COALESCE(NULLIF($3,''), parentesco),
           dni = COALESCE(NULLIF($4,''), dni),
           provincia = COALESCE(NULLIF($5,''), provincia),
           localidad = COALESCE(NULLIF($6,''), localidad)
         WHERE id = $7`,
        [fecha_nacimiento || null, sexo, parentesco, dni, provincia, localidad, existing.rows[0].id]
      );
      res.json({ id: existing.rows[0].id, updated: true });
    } else {
      const r = await pool.query(
        `INSERT INTO asegurados (persona_id, nombre, fecha_nac, sexo, parentesco, dni, provincia, localidad)
         VALUES ($1, $2, $3::date, $4, $5, $6, $7, $8) RETURNING id`,
        [persona_id, nombre, fecha_nacimiento || null, sexo || null, parentesco || 'Familiar', dni || null, provincia || null, localidad || null]
      );
      res.status(201).json({ id: r.rows[0].id, created: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/calculadora/asegurados/:personaId — Asegurados guardados
router.get('/asegurados/:personaId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM asegurados WHERE persona_id = $1 ORDER BY id',
      [req.params.personaId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/calculadora/propuestas/:id — Eliminar propuesta
router.delete('/propuestas/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM propuestas WHERE id = $1', [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Propuesta no encontrada' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/calculadora/propuestas/:id/pipedrive-sync — Sync a Pipedrive
router.post('/propuestas/:id/pipedrive-sync', async (req, res) => {
  try {
    const apiKey = process.env.PIPEDRIVE_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ error: 'PIPEDRIVE_API_KEY no configurada' });
    }

    const propuesta = await pool.query('SELECT * FROM propuestas WHERE id = $1', [req.params.id]);
    if (propuesta.rows.length === 0) {
      return res.status(404).json({ error: 'Propuesta no encontrada' });
    }

    const p = propuesta.rows[0];
    if (!p.pipedrive_deal_id) {
      return res.status(400).json({ error: 'No hay deal de Pipedrive vinculado' });
    }

    // Actualizar campos del deal en Pipedrive
    const dealUpdate = req.body.dealUpdate || {};
    if (Object.keys(dealUpdate).length > 0) {
      await fetch(`https://api.pipedrive.com/v1/deals/${p.pipedrive_deal_id}?api_token=${apiKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dealUpdate)
      });
    }

    // Crear nota en el deal
    if (p.nota_contenido) {
      await fetch(`https://api.pipedrive.com/v1/notes?api_token=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deal_id: p.pipedrive_deal_id,
          content: p.nota_contenido,
          pinned_to_deal_flag: 1
        })
      });
    }

    // Marcar como sincronizado
    await pool.query('UPDATE propuestas SET pipedrive_synced = true WHERE id = $1', [p.id]);

    res.json({ ok: true });
  } catch (err) {
    console.error('Error sincronizando propuesta con Pipedrive:', err);
    res.status(500).json({ error: 'Error al sincronizar con Pipedrive' });
  }
});

module.exports = router;
