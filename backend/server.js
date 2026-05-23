require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { apiRateLimit } = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Trust proxy for correct IP
app.set('trust proxy', 1);

app.use('/api', apiRateLimit);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/admin', require('./routes/admin'));

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: Date.now() }));

app.use((err, req, res, next) => {
  console.error('[Error]', err);
  res.status(500).json({ error: '서버 내부 오류' });
});

async function start() {
  // Initialize DB and seed
  require('./db')();
  const seed = require('./seed');
  await seed();

  app.listen(PORT, () => {
    console.log(`[LocalShield QR] Backend running on http://localhost:${PORT}`);
  });
}

start().catch(console.error);
