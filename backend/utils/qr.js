const crypto = require('crypto');

const QR_SECRET = process.env.QR_SECRET || 'localshield_qr_hmac_secret';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

function generateQrToken(productId, createdAt) {
  return crypto
    .createHmac('sha256', QR_SECRET)
    .update(`${productId}${createdAt}`)
    .digest('hex')
    .slice(0, 32);
}

function verifyQrToken(productId, createdAt, token) {
  const expected = generateQrToken(productId, createdAt);
  return expected === token;
}

function buildQrUrl(productId, token) {
  return `${FRONTEND_URL}/product/${productId}?token=${token}`;
}

function generateStoreQrToken(storeId, createdAt) {
  return crypto
    .createHmac('sha256', QR_SECRET)
    .update(`store:${storeId}:${createdAt}`)
    .digest('hex')
    .slice(0, 32);
}

function verifyStoreQrToken(storeId, createdAt, token) {
  return generateStoreQrToken(storeId, createdAt) === token;
}

function buildStoreQrUrl(storeId, token) {
  return `${FRONTEND_URL}/store/${storeId}?token=${token}`;
}

// ── 30초 회전 QR (큐싱 방지) ──────────────────────────────
const TIMED_WINDOW_MS = 30000;

function generateTimedStoreQrToken(storeId, timeWindow) {
  return crypto
    .createHmac('sha256', QR_SECRET)
    .update(`store-timed:${storeId}:${timeWindow}`)
    .digest('hex')
    .slice(0, 32);
}

// 현재 윈도우 + 이전 윈도우 모두 허용 (경계값 안전 처리)
function verifyTimedStoreQrToken(storeId, token) {
  const now = Math.floor(Date.now() / TIMED_WINDOW_MS);
  return (
    generateTimedStoreQrToken(storeId, now)     === token ||
    generateTimedStoreQrToken(storeId, now - 1) === token
  );
}

function buildTimedStoreQrUrl(storeId) {
  const timeWindow = Math.floor(Date.now() / TIMED_WINDOW_MS);
  const token = generateTimedStoreQrToken(storeId, timeWindow);
  return { url: `${FRONTEND_URL}/store/${storeId}?token=${token}`, expiresIn: TIMED_WINDOW_MS - (Date.now() % TIMED_WINDOW_MS) };
}

module.exports = {
  generateQrToken, verifyQrToken, buildQrUrl,
  generateStoreQrToken, verifyStoreQrToken, buildStoreQrUrl,
  generateTimedStoreQrToken, verifyTimedStoreQrToken, buildTimedStoreQrUrl,
};
