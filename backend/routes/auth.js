const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const getDb = require('../db');
const { logSecurity } = require('../utils/logger');
const { detectSqli, loginRateLimit } = require('../middleware/security');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'localshield_jwt_secret';

router.post('/login', loginRateLimit, async (req, res) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip;

    if (!email || !password) {
      return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요.' });
    }

    // SQLi detection
    if (detectSqli(email) || detectSqli(password)) {
      logSecurity({
        eventType: 'SQLI_ATTEMPT',
        ipAddress: ip,
        detail: `Login attempt with payload: ${email}`,
        severity: 'high'
      });
      return res.status(400).json({ error: '유효하지 않은 입력값입니다.' });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    // Check lock
    const now = Date.now();
    if (user.locked_until && user.locked_until > now) {
      const remaining = Math.ceil((user.locked_until - now) / 1000);
      return res.status(429).json({ error: `계정 잠금. ${remaining}초 후 재시도해주세요.` });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      const newCount = (user.failed_login_count || 0) + 1;
      if (newCount >= 5) {
        const lockUntil = now + 60000;
        db.prepare('UPDATE users SET failed_login_count=?, locked_until=? WHERE id=?')
          .run(newCount, lockUntil, user.id);
        logSecurity({
          userId: user.id,
          eventType: 'BRUTE_FORCE_LOCK',
          ipAddress: ip,
          detail: `Account locked after 5 failed attempts: ${email}`,
          severity: 'high'
        });
        return res.status(429).json({ error: '계정이 잠겼습니다. 60초 후 재시도해주세요.' });
      }
      db.prepare('UPDATE users SET failed_login_count=? WHERE id=?').run(newCount, user.id);
      logSecurity({
        userId: user.id,
        eventType: 'LOGIN_FAIL',
        ipAddress: ip,
        detail: `Failed login attempt ${newCount}/5 for: ${email}`,
        severity: newCount >= 3 ? 'medium' : 'low'
      });
      return res.status(401).json({ error: `비밀번호가 올바르지 않습니다. (${newCount}/5회 실패)` });
    }

    // Success
    db.prepare('UPDATE users SET failed_login_count=0, locked_until=NULL WHERE id=?').run(user.id);
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { email, password, role = 'merchant' } = req.body;
    const ip = req.ip;

    if (!email || !password) {
      return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요.' });
    }
    if (detectSqli(email) || detectSqli(password)) {
      logSecurity({ eventType: 'SQLI_ATTEMPT', ipAddress: ip, detail: `Register attempt: ${email}`, severity: 'high' });
      return res.status(400).json({ error: '유효하지 않은 입력값입니다.' });
    }
    if (!['merchant'].includes(role)) {
      return res.status(400).json({ error: '유효하지 않은 역할입니다.' });
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email=?').get(email);
    if (existing) return res.status(409).json({ error: '이미 사용중인 이메일입니다.' });

    const hash = await bcrypt.hash(password, 10);
    const result = db.prepare(
      'INSERT INTO users (email, password_hash, role, created_at) VALUES (?, ?, ?, ?)'
    ).run(email, hash, role, Date.now());

    const token = jwt.sign({ id: result.lastInsertRowid, email, role }, JWT_SECRET, { expiresIn: '24h' });
    return res.status(201).json({ token, user: { id: result.lastInsertRowid, email, role } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

router.get('/me', (req, res) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: '인증 필요' });
  try {
    const user = jwt.verify(header.slice(7), JWT_SECRET);
    return res.json({ user });
  } catch {
    return res.status(401).json({ error: '유효하지 않은 토큰' });
  }
});

module.exports = router;
