const getDb = require('../db');

function logSecurity({ userId = null, eventType, ipAddress, detail, severity }) {
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO security_logs (user_id, event_type, ip_address, detail, severity, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, eventType, ipAddress, detail, severity, Date.now());
  } catch (e) {
    console.error('[SecurityLogger] Failed to log:', e.message);
  }
}

module.exports = { logSecurity };
