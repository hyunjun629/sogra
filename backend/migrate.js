const pool = require('./db');
const { generateStoreQrToken } = require('./utils/qr');

async function migrate() {
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS business_number TEXT`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS business_verified BOOLEAN DEFAULT FALSE`);
  await pool.query(`ALTER TABLE stores ADD COLUMN IF NOT EXISTS qr_token TEXT`);
  await pool.query(`ALTER TABLE stores ADD COLUMN IF NOT EXISTS qr_expires_at BIGINT`);
  await pool.query(`ALTER TABLE stores ADD COLUMN IF NOT EXISTS name_en TEXT`);
  await pool.query(`ALTER TABLE stores ADD COLUMN IF NOT EXISTS name_zh TEXT`);
  await pool.query(`ALTER TABLE stores ADD COLUMN IF NOT EXISTS location_en TEXT`);
  await pool.query(`ALTER TABLE stores ADD COLUMN IF NOT EXISTS location_zh TEXT`);
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS name_en TEXT`);
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS name_zh TEXT`);
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS description_en TEXT`);
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS description_zh TEXT`);
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS origin_en TEXT`);
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS origin_zh TEXT`);
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS allergy_en TEXT`);
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS allergy_zh TEXT`);
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS ai_promo_text_en TEXT`);
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS ai_promo_text_zh TEXT`);

  // 지도용 좌표 컬럼
  await pool.query(`ALTER TABLE stores ADD COLUMN IF NOT EXISTS latitude FLOAT`);
  await pool.query(`ALTER TABLE stores ADD COLUMN IF NOT EXISTS longitude FLOAT`);

  // 시드 상점 좌표 (이름 기준으로 한 번만 설정)
  await pool.query(`UPDATE stores SET latitude=36.3263, longitude=127.4215 WHERE name='OO상회' AND latitude IS NULL`);
  await pool.query(`UPDATE stores SET latitude=36.3620, longitude=127.3384 WHERE name='청년떡집' AND latitude IS NULL`);
  await pool.query(`UPDATE stores SET latitude=36.4956, longitude=127.2563 WHERE name='한솔수산' AND latitude IS NULL`);

  const { rows } = await pool.query(`SELECT id, created_at FROM stores WHERE qr_token IS NULL OR qr_token = ''`);
  for (const store of rows) {
    const token = generateStoreQrToken(store.id, store.created_at);
    const expiresAt = Date.now() + 365 * 24 * 60 * 60 * 1000;
    await pool.query('UPDATE stores SET qr_token=$1, qr_expires_at=$2 WHERE id=$3', [token, expiresAt, store.id]);
  }
  if (rows.length > 0) console.log(`[Migrate] Generated QR tokens for ${rows.length} stores.`);
  console.log('[Migrate] DB schema up to date.');
}

module.exports = migrate;
