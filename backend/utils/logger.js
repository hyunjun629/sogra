const pool = require('../db');

async function logSecurity({ userId = null, eventType, ipAddress, detail, severity }) {
  try {
    await pool.query(
      'INSERT INTO security_logs (user_id, event_type, ip_address, detail, severity, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, eventType, ipAddress, detail, severity, Date.now()]
    );
  } catch (e) {
    console.error('[SecurityLogger] Failed to log:', e.message);
  }
}

module.exports = { logSecurity };
