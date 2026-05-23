const pool = require('./db');

async function migrate() {
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS business_number TEXT`);
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS business_verified BOOLEAN DEFAULT FALSE`);
  console.log('[Migrate] DB schema up to date.');
}

module.exports = migrate;
