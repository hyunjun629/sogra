const bcrypt = require('bcrypt');
const getDb = require('./db');
const { generateQrToken } = require('./utils/qr');
const { generatePromoText } = require('./utils/promo');

async function seed() {
  const db = getDb();

  const existing = db.prepare('SELECT COUNT(*) as cnt FROM users').get();
  if (existing.cnt > 0) return;

  console.log('[Seed] Seeding database...');

  const now = Date.now();

  // Users
  const adminHash = await bcrypt.hash('1234', 10);
  const merchantHash = await bcrypt.hash('1234', 10);
  const pendingHash = await bcrypt.hash('1234', 10);

  const adminId = db.prepare(
    'INSERT INTO users (email, password_hash, role, created_at) VALUES (?, ?, ?, ?)'
  ).run('admin@localshield.com', adminHash, 'admin', now).lastInsertRowid;

  const merchantId = db.prepare(
    'INSERT INTO users (email, password_hash, role, created_at) VALUES (?, ?, ?, ?)'
  ).run('merchant@localshield.com', merchantHash, 'merchant', now).lastInsertRowid;

  const pendingUserId = db.prepare(
    'INSERT INTO users (email, password_hash, role, created_at) VALUES (?, ?, ?, ?)'
  ).run('pending@localshield.com', pendingHash, 'merchant', now).lastInsertRowid;

  // Stores
  const store1Id = db.prepare(
    'INSERT INTO stores (owner_id, name, region, location, status, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(merchantId, 'OO상회', '대전', '대전 중앙시장 B동 12호', 'approved', now).lastInsertRowid;

  const store2Id = db.prepare(
    'INSERT INTO stores (owner_id, name, region, location, status, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(merchantId, '청년떡집', '대전', '대전 유성구 봉명동 55-3', 'approved', now).lastInsertRowid;

  const store3Id = db.prepare(
    'INSERT INTO stores (owner_id, name, region, location, status, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(pendingUserId, '한솔수산', '세종', '세종 한솔동 주민시장 내', 'pending', now).lastInsertRowid;

  // Products
  const productsData = [
    {
      store_id: store1Id, owner_id: merchantId,
      name: '성심당 튀김소보로', price: 2500,
      description: '대전의 명물 성심당에서 엄선한 튀김소보로. 겉은 바삭, 속은 촉촉한 소보로빵.',
      origin: '대전', allergy: '밀, 우유, 달걀',
      image_url: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=600',
      region: '대전'
    },
    {
      store_id: store1Id, owner_id: merchantId,
      name: '대전 한밭식혜', price: 4000,
      description: '대전 전통 방식으로 만든 달콤한 식혜. 방부제 없이 당일 생산.',
      origin: '대전', allergy: '없음',
      image_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600',
      region: '대전'
    },
    {
      store_id: store1Id, owner_id: merchantId,
      name: '충남 서산 6년근 인삼', price: 85000,
      description: '충남 서산에서 직접 재배한 6년근 인삼. 농약 없이 자연 재배.',
      origin: '충남 서산', allergy: '없음',
      image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600',
      region: '충남'
    },
    {
      store_id: store3Id, owner_id: pendingUserId,
      name: '한솔수산 갈치', price: 35000,
      description: '제주 직송 은갈치. 세종 한솔수산에서 매일 새벽 공수.',
      origin: '제주', allergy: '어류',
      image_url: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=600',
      region: '세종'
    },
    {
      store_id: store2Id, owner_id: merchantId,
      name: '청남대 막걸리', price: 6000,
      description: '충북 청주 청남대 인근에서 빚은 전통 막걸리. 국산 쌀 100% 사용.',
      origin: '충북 청주', allergy: '없음',
      image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
      region: '충북'
    }
  ];

  for (const p of productsData) {
    const createdAt = now - Math.floor(Math.random() * 86400000);
    const result = db.prepare(`
      INSERT INTO products (store_id, owner_id, name, price, description, origin, allergy, image_url, ai_promo_text, qr_token, qr_expires_at, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(
      p.store_id, p.owner_id, p.name, p.price, p.description, p.origin, p.allergy,
      p.image_url, '', '', now + 30 * 24 * 60 * 60 * 1000, createdAt
    );
    const productId = result.lastInsertRowid;
    const token = generateQrToken(productId, createdAt);
    const promoText = generatePromoText({ name: p.name, region: p.region, origin: p.origin });
    db.prepare('UPDATE products SET qr_token=?, ai_promo_text=? WHERE id=?').run(token, promoText, productId);
  }

  // Security logs — 과거 24시간 가짜 공격 로그 10건
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
    db.prepare(
      'INSERT INTO security_logs (user_id, event_type, ip_address, detail, severity, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(null, log.event_type, log.ip, log.detail, log.severity, now - log.ago);
  }

  console.log('[Seed] Done. Seeded users, stores, products, security_logs.');
}

module.exports = seed;
