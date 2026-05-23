const express = require('express');
const pool = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { logSecurity } = require('../utils/logger');
const { buildQrUrl } = require('../utils/qr');
const { generatePromoText } = require('../utils/promo');

const router = express.Router();

router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const since24h = Date.now() - 24 * 60 * 60 * 1000;
    const [u, s, p, r, ps, fs, cl, lt] = await Promise.all([
      pool.query("SELECT COUNT(*) as cnt FROM users WHERE role='merchant'"),
      pool.query('SELECT COUNT(*) as cnt FROM stores'),
      pool.query('SELECT COUNT(*) as cnt FROM products WHERE is_active=1'),
      pool.query('SELECT COUNT(*) as cnt FROM reports'),
      pool.query("SELECT COUNT(*) as cnt FROM stores WHERE status='pending'"),
      pool.query("SELECT COUNT(*) as cnt FROM stores WHERE status='flagged'"),
      pool.query("SELECT COUNT(*) as cnt FROM security_logs WHERE severity='critical' AND created_at > $1", [since24h]),
      pool.query('SELECT event_type, COUNT(*) as cnt FROM security_logs WHERE created_at > $1 GROUP BY event_type', [since24h]),
    ]);
    return res.json({
      totalUsers: parseInt(u.rows[0].cnt),
      totalStores: parseInt(s.rows[0].cnt),
      totalProducts: parseInt(p.rows[0].cnt),
      totalReports: parseInt(r.rows[0].cnt),
      pendingStores: parseInt(ps.rows[0].cnt),
      flaggedStores: parseInt(fs.rows[0].cnt),
      criticalLogs: parseInt(cl.rows[0].cnt),
      logsByType: lt.rows,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: '서버 오류' });
  }
});

router.get('/logs/recent', requireAdmin, async (req, res) => {
  try {
    const since = req.query.since ? parseInt(req.query.since) : 0;
    const { rows } = await pool.query(
      'SELECT * FROM security_logs WHERE created_at > $1 ORDER BY created_at DESC LIMIT 50',
      [since]
    );
    return res.json({ logs: rows });
  } catch (e) {
    return res.status(500).json({ error: '서버 오류' });
  }
});

router.get('/logs', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM security_logs ORDER BY created_at DESC LIMIT 100');
    return res.json({ logs: rows });
  } catch (e) {
    return res.status(500).json({ error: '서버 오류' });
  }
});

router.get('/stores', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT s.*, u.email as owner_email,
        (SELECT COUNT(*) FROM products WHERE store_id=s.id AND is_active=1) as product_count
      FROM stores s JOIN users u ON s.owner_id = u.id ORDER BY s.created_at DESC
    `);
    return res.json({ stores: rows });
  } catch (e) {
    return res.status(500).json({ error: '서버 오류' });
  }
});

router.put('/stores/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'pending', 'flagged'].includes(status)) return res.status(400).json({ error: '유효하지 않은 상태입니다.' });
    await pool.query('UPDATE stores SET status=$1 WHERE id=$2', [status, req.params.id]);
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: '서버 오류' });
  }
});

router.get('/reports', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT r.*, p.name as product_name, p.report_count
      FROM reports r JOIN products p ON r.product_id = p.id
      ORDER BY r.created_at DESC LIMIT 50
    `);
    return res.json({ reports: rows });
  } catch (e) {
    return res.status(500).json({ error: '서버 오류' });
  }
});

router.get('/products', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.*, s.name as store_name, s.region, u.email as owner_email
      FROM products p JOIN stores s ON p.store_id = s.id JOIN users u ON p.owner_id = u.id
      ORDER BY p.created_at DESC
    `);
    return res.json({ products: rows.map(p => ({ ...p, qr_url: buildQrUrl(p.id, p.qr_token) })) });
  } catch (e) {
    return res.status(500).json({ error: '서버 오류' });
  }
});

// Demo attack endpoints
router.post('/demo/sqli', async (req, res) => {
  await logSecurity({ eventType: 'SQLI_ATTEMPT', ipAddress: req.ip, detail: `[DEMO] Login attempt with payload: admin' OR '1'='1 --`, severity: 'high' });
  return res.json({ blocked: true, message: 'SQL Injection 시도가 탐지되어 차단되었습니다.' });
});

router.post('/demo/bruteforce', async (req, res) => {
  for (let i = 1; i <= 4; i++) {
    await logSecurity({ eventType: 'LOGIN_FAIL', ipAddress: req.ip, detail: `[DEMO] Failed login attempt ${i}/5 for: demo_target@test.com`, severity: i >= 3 ? 'medium' : 'low' });
  }
  await logSecurity({ eventType: 'BRUTE_FORCE_LOCK', ipAddress: req.ip, detail: '[DEMO] Account locked after 5 failed attempts: demo_target@test.com', severity: 'high' });
  return res.json({ blocked: true, message: 'BruteForce 공격이 탐지되어 계정이 잠겼습니다.' });
});

router.post('/demo/xss', async (req, res) => {
  await logSecurity({ eventType: 'XSS_ATTEMPT', ipAddress: req.ip, detail: `[DEMO] XSS payload detected: <script>alert('XSS_HACK')</script>`, severity: 'critical' });
  return res.json({ blocked: true, message: 'XSS 공격이 탐지되어 sanitize 처리되었습니다.' });
});

router.post('/demo/idor', async (req, res) => {
  await logSecurity({ eventType: 'IDOR_ATTEMPT', ipAddress: req.ip, detail: '[DEMO] User 3 (attacker@test.com) attempted to modify product owned by user 2 (product_id: 1)', severity: 'medium' });
  return res.json({ blocked: true, message: 'IDOR 공격이 탐지되어 403 차단되었습니다.' });
});

router.post('/demo/fake-qr', async (req, res) => {
  await logSecurity({ eventType: 'FAKE_QR_ACCESS', ipAddress: req.ip, detail: '[DEMO] Invalid QR token for product_id=1: token=FAKE_TOKEN_12345', severity: 'critical' });
  return res.json({ blocked: true, message: '위조 QR이 탐지되었습니다.' });
});

router.post('/demo/reset', requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM security_logs');
    await pool.query('DELETE FROM reports');
    await pool.query('UPDATE products SET is_active=1, report_count=0');
    await pool.query("UPDATE stores SET status='approved' WHERE owner_id IN (SELECT id FROM users WHERE email='merchant@localshield.com')");
    await pool.query("UPDATE stores SET status='pending' WHERE owner_id IN (SELECT id FROM users WHERE email='pending@localshield.com')");
    await pool.query('UPDATE users SET failed_login_count=0, locked_until=NULL');

    const now = Date.now();
    const ips = ['192.168.1.101', '10.0.0.55', '172.16.0.23', '203.0.113.42', '198.51.100.7'];
    const fakeLogs = [
      { event_type: 'SQLI_ATTEMPT', ip: ips[0], detail: "Login attempt with payload: admin' OR '1'='1 --", severity: 'high', ago: 23 * 3600000 },
      { event_type: 'SQLI_ATTEMPT', ip: ips[1], detail: "Login attempt with payload: ' UNION SELECT * FROM users--", severity: 'high', ago: 21 * 3600000 },
      { event_type: 'SQLI_ATTEMPT', ip: ips[2], detail: "Login attempt with payload: 1; DROP TABLE users;--", severity: 'high', ago: 18 * 3600000 },
      { event_type: 'BRUTE_FORCE_LOCK', ip: ips[0], detail: 'Account locked after 5 failed attempts: test@test.com', severity: 'high', ago: 16 * 3600000 },
      { event_type: 'BRUTE_FORCE_LOCK', ip: ips[3], detail: 'Account locked after 5 failed attempts: merchant@test.com', severity: 'high', ago: 12 * 3600000 },
      { event_type: 'XSS_ATTEMPT', ip: ips[1], detail: 'XSS payload detected: <script>alert("hack")</script>', severity: 'critical', ago: 10 * 3600000 },
      { event_type: 'XSS_ATTEMPT', ip: ips[4], detail: 'XSS payload detected: <img src=x onerror=fetch("//evil.com")>', severity: 'critical', ago: 8 * 3600000 },
      { event_type: 'IDOR_ATTEMPT', ip: ips[2], detail: 'User 3 attempted to modify product owned by user 2 (product_id: 1)', severity: 'medium', ago: 6 * 3600000 },
      { event_type: 'FAKE_QR_ACCESS', ip: ips[3], detail: 'Invalid QR token for product_id=1: token=FAKE_TOKEN_12345', severity: 'critical', ago: 4 * 3600000 },
      { event_type: 'FAKE_QR_ACCESS', ip: ips[0], detail: 'Invalid QR token for product_id=2: token=abc123forged', severity: 'critical', ago: 2 * 3600000 },
    ];
    for (const log of fakeLogs) {
      await pool.query('INSERT INTO security_logs (user_id, event_type, ip_address, detail, severity, created_at) VALUES ($1,$2,$3,$4,$5,$6)',
        [null, log.event_type, log.ip, log.detail, log.severity, now - log.ago]);
    }
    return res.json({ success: true, message: '데모 데이터가 초기 상태로 복원되었습니다.' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = router;
