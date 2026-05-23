const pool = require('./db');
const { generateStoreQrToken } = require('./utils/qr');

async function migrate() {
  await pool.query(`ALTER TABLE stores ADD COLUMN IF NOT EXISTS qr_token TEXT`);
  await pool.query(`ALTER TABLE stores ADD COLUMN IF NOT EXISTS qr_expires_at BIGINT`);

  const { rows } = await pool.query(`SELECT id, created_at FROM stores WHERE qr_token IS NULL OR qr_token = ''`);
  for (const store of rows) {
    const token = generateStoreQrToken(store.id, store.created_at);
    const expiresAt = Date.now() + 365 * 24 * 60 * 60 * 1000;
    await pool.query('UPDATE stores SET qr_token=$1, qr_expires_at=$2 WHERE id=$3', [token, expiresAt, store.id]);
  }
  if (rows.length > 0) console.log(`[Migrate] Generated QR tokens for ${rows.length} stores.`);
}

module.exports = migrate;
