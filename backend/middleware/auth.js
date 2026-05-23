const jwt = require('jsonwebtoken');
const { logSecurity } = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'localshield_jwt_secret';

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '인증이 필요합니다.' });
  }
  try {
    const token = header.slice(7);
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
  }
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      logSecurity({
        userId: req.user.id,
        eventType: 'UNAUTHORIZED_ACCESS',
        ipAddress: req.ip,
        detail: `Non-admin user ${req.user.email} attempted to access admin endpoint: ${req.originalUrl}`,
        severity: 'high'
      });
      return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
    }
    next();
  });
}

function requireMerchant(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'merchant' && req.user.role !== 'admin') {
      return res.status(403).json({ error: '상인 권한이 필요합니다.' });
    }
    next();
  });
}

module.exports = { requireAuth, requireAdmin, requireMerchant };
