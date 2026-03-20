Flujo completo cuando un deal se marca como GANADO:

1. Pide al usuario el ID del deal o búscalo por nombre del contacto
2. Obtén los datos del deal con su persona vinculada
3. Crea la póliza en la tabla `polizas` con todos los datos:
   - persona_id, deal_id, compania, producto, agente_id
   - n_solicitud, n_poliza, prima, fecha_efecto
   - estado = 'poliza_emitida'
4. Actualiza el deal: pipedrive_status = 'won', estado = 'poliza_activa'
5. Si tiene pipedrive_id, sincroniza con Pipedrive:
   - PUT /deals/:id con status=won
   - POST /notes con nota estructurada de la póliza
6. Muestra resumen: póliza creada, deal actualizado, sync status
