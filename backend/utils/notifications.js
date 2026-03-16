const pool = require('../config/db');

async function notifyUser(userId, ticketId, mensaje) {
  try {
    await pool.query(
      'INSERT INTO notifications (user_id, ticket_id, mensaje) VALUES ($1, $2, $3)',
      [userId, ticketId, mensaje]
    );
  } catch (err) {
    console.error('Error creando notificación:', err);
  }
}

module.exports = { notifyUser };
