require('dotenv').config();
const migrate = require('../backend/migrate');
const app = require('../backend/server');

// Run migration on every Vercel cold start (idempotent)
migrate().catch(console.error);

module.exports = app;
