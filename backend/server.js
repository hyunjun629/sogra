require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { apiRateLimit } = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', 1);
app.use('/api', apiRateLimit);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/admin', require('./routes/admin'));

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: Date.now() }));

app.use((err, req, res, next) => {
  console.error('[Error]', err);
  res.status(500).json({ error: '서버 내부 오류' });
});

// 로컬 실행 시 seed 후 listen, Vercel에서는 module.exports만 사용
if (require.main === module) {
  const migrate = require('./migrate');
  const seed = require('./seed');
  migrate()
    .then(() => seed())
    .then(() => app.listen(PORT, () => console.log(`[대충실드 QR] Backend running on http://localhost:${PORT}`)))
    .catch(console.error);
} else {
  module.exports = app;
}
