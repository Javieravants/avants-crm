async function sendPipedriveNote(ticket) {
  const apiKey = process.env.PIPEDRIVE_API_KEY;
  if (!apiKey || !ticket.pipedrive_deal_id) return;

  const now = new Date();
  const fecha = now.toLocaleDateString('es-ES');
  const content = `[Avants CRM] Ticket #${ticket.id} resuelto (${fecha})\n\n${ticket.descripcion || ''}`;

  try {
    const res = await fetch(
      `https://api.pipedrive.com/v1/notes?api_token=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          deal_id: parseInt(ticket.pipedrive_deal_id, 10),
        }),
      }
    );
    if (!res.ok) {
      console.error('Pipedrive API error:', res.status, await res.text());
    }
  } catch (err) {
    console.error('Error enviando nota a Pipedrive:', err);
  }
}

module.exports = { sendPipedriveNote };
