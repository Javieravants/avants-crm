// === Sync público desde calculadora externa (sin JWT) ===
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { generarPDFPropuesta } = require('../utils/pdf-generator');

// Clave secreta compartida con la calculadora de Ionos
const SYNC_SECRET = 'gstv_sync_2026_adeslas';

function checkSecret(req, res, next) {
  const secret = req.headers['x-sync-secret'] || req.body?.sync_secret;
  if (secret !== SYNC_SECRET) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
}

// POST /api/sync/propuesta — Guardar propuesta desde calculadora externa
router.post('/propuesta', checkSecret, async (req, res) => {
  try {
    const {
      pipedrive_deal_id, compania, modalidad,
      prima_mensual, prima_anual, campana_puntos,
      nota, asegurados_data, productos
    } = req.body;

    if (!pipedrive_deal_id) {
      return res.status(400).json({ error: 'pipedrive_deal_id requerido' });
    }

    // Buscar deal y persona por pipedrive_deal_id
    let persona_id = null;
    let deal_id = null;

    try {
      const dealRes = await pool.query(
        'SELECT id, persona_id FROM deals WHERE pipedrive_id = $1 LIMIT 1',
        [parseInt(pipedrive_deal_id)]
      );
      if (dealRes.rows[0]) {
        deal_id = dealRes.rows[0].id;
        persona_id = dealRes.rows[0].persona_id;
      }
    } catch(e) {
      console.log('[sync] No se pudo buscar deal:', e.message);
    }

    if (!persona_id) {
      console.log(`[sync] Deal ${pipedrive_deal_id} sin persona en Gestavly aún — guardando sin vincular`);
    }

    // Guardar propuesta usando columnas reales de la tabla
    const result = await pool.query(`
      INSERT INTO propuestas (
        persona_id, deal_id, pipedrive_deal_id, compania, producto,
        prima_mensual, prima_anual, campana_puntos,
        nota_contenido, asegurados_data, desglose
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING id
    `, [
      persona_id || null,
      deal_id || null,
      parseInt(pipedrive_deal_id),
      compania || 'ADESLAS',
      modalidad || 'MULTIPRODUCTO',
      parseFloat(prima_mensual) || 0,
      parseFloat(prima_anual) || 0,
      parseInt(campana_puntos) || 0,
      nota || null,
      JSON.stringify(asegurados_data || []),
      JSON.stringify(productos || {})
    ]);

    // Registrar en historial si tenemos persona
    if (persona_id && nota) {
      await pool.query(`
        INSERT INTO contact_history (persona_id, tipo, titulo, descripcion, origen)
        VALUES ($1, 'nota', $2, $3, 'calculadora_externa')
      `, [
        persona_id,
        'Propuesta ADESLAS ' + (modalidad || '') + ' — ' + parseFloat(prima_mensual || 0).toFixed(2) + 'euros/mes',
        nota
      ]);
    }

    const propuestaId = result.rows[0]?.id || null;

    // Generar PDF con los datos que ya tenemos
    if (propuestaId) {
      setImmediate(async () => {
        try {
          const prop = {
            id: propuestaId,
            persona_id: persona_id,
            compania: compania || 'ADESLAS',
            producto: modalidad || 'MULTIPRODUCTO',
            prima_mensual: parseFloat(prima_mensual) || 0,
            prima_anual: parseFloat(prima_anual) || 0,
            campana_puntos: parseInt(campana_puntos) || 0,
            asegurados_data: asegurados_data || [],
            desglose: productos || {},
            nota_contenido: nota || null,
            _persona: { nombre: 'Cliente' }
          };

          // Cargar nombre de persona si existe
          if (persona_id) {
            const pRes = await pool.query('SELECT nombre FROM personas WHERE id = $1', [persona_id]);
            if (pRes.rows[0]) prop._persona = { nombre: pRes.rows[0].nombre };
          }

          const pdfUrl = await generarPDFPropuesta(prop);
          await pool.query('UPDATE propuestas SET pdf_url = $1, pipedrive_synced = true WHERE id = $2', [pdfUrl, propuestaId]);
          console.log('[sync] PDF generado:', pdfUrl);
        } catch(e) {
          console.log('[sync] Error PDF:', e.message);
        }
      });
    }
    res.json({ ok: true, propuesta_id: propuestaId });

  } catch (err) {
    console.error('[sync] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});


// POST /api/sync/grabacion — Guardar grabación/póliza desde grabaciones externas
router.post('/grabacion', checkSecret, async (req, res) => {
  try {
    const {
      pipedrive_deal_id, compania, producto, tipo_producto,
      prima_mensual, forma_pago, n_solicitud, n_poliza,
      fecha_efecto, campana_puntos, descuento, descuento_contra,
      dental, nota_estructurada, datos_titular, asegurados_data
    } = req.body;

    if (!pipedrive_deal_id) {
      return res.status(400).json({ error: 'pipedrive_deal_id requerido' });
    }

    // Buscar deal y persona
    let persona_id = null;
    let deal_id = null;

    try {
      const dealRes = await pool.query(
        'SELECT id, persona_id FROM deals WHERE pipedrive_id = $1 LIMIT 1',
        [parseInt(pipedrive_deal_id)]
      );
      if (dealRes.rows[0]) {
        deal_id = dealRes.rows[0].id;
        persona_id = dealRes.rows[0].persona_id;
      }
    } catch(e) {
      console.log('[sync/grabacion] No se pudo buscar deal:', e.message);
    }

    // Calcular prima anual
    const primaMensual = parseFloat(prima_mensual) || 0;
    const formaP = (forma_pago || 'MENSUAL').toUpperCase();
    const multiplicador = formaP === 'ANUAL' ? 1 : formaP === 'SEMESTRAL' ? 2 : formaP === 'TRIMESTRAL' ? 4 : 12;
    const primaAnual = primaMensual * multiplicador;

    // Insertar en polizas (la grabación crea una póliza)
    const result = await pool.query(`
      INSERT INTO polizas (
        persona_id, deal_id, pipedrive_deal_id,
        compania, producto, tipo_producto,
        n_solicitud, n_poliza, fecha_efecto,
        forma_pago, descuento, descuento_contra,
        prima_mensual, prima_anual,
        campana_puntos, dental, carencias,
        datos_titular, asegurados_data,
        nota_estructurada, estado, agente_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NULL,$17,$18,$19,'grabado',NULL)
      RETURNING id
    `, [
      persona_id || null,
      deal_id || null,
      parseInt(pipedrive_deal_id),
      compania || 'ADESLAS',
      producto || tipo_producto || 'SALUD',
      tipo_producto || 'SALUD',
      n_solicitud || null,
      n_poliza || null,
      fecha_efecto || null,
      forma_pago || 'MENSUAL',
      parseFloat(descuento) || 0,
      parseFloat(descuento_contra) || 0,
      primaMensual,
      primaAnual,
      parseInt(campana_puntos) || 0,
      dental || null,
      JSON.stringify(datos_titular || {}),
      JSON.stringify(asegurados_data || []),
      nota_estructurada || null
    ]);

    const polizaId = result.rows[0]?.id || null;

    // Registrar en historial
    if (persona_id) {
      await pool.query(`
        INSERT INTO contact_history (persona_id, tipo, titulo, descripcion, origen)
        VALUES ($1, 'nota', $2, $3, 'grabacion_externa')
      `, [
        persona_id,
        'Grabación póliza ' + (producto || tipo_producto || 'ADESLAS') + ' — ' + primaMensual.toFixed(2) + '€/mes',
        nota_estructurada || ''
      ]);

      // Marcar deal como ganado si existe
      if (deal_id) {
        await pool.query(
          "UPDATE deals SET estado = 'won', pipedrive_status = 'won', updated_at = NOW() WHERE id = $1",
          [deal_id]
        );
      }
    }

    res.json({ ok: true, poliza_id: polizaId });

  } catch (err) {
    console.error('[sync/grabacion] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
