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

module.exports = { generateQrToken, verifyQrToken, buildQrUrl };
