const bcrypt = require('bcrypt');
const pool = require('./db');
const { generateQrToken, generateStoreQrToken } = require('./utils/qr');
const { generatePromoText } = require('./utils/promo');

async function seed() {
  const { rows } = await pool.query('SELECT COUNT(*) as cnt FROM users');
  if (parseInt(rows[0].cnt) > 0) return;

  console.log('[Seed] Seeding database...');

  const now = Date.now();
  const adminHash = await bcrypt.hash('1234', 10);
  const merchantHash = await bcrypt.hash('1234', 10);
  const pendingHash = await bcrypt.hash('1234', 10);

  const { rows: [{ id: adminId }] } = await pool.query(
    'INSERT INTO users (email, password_hash, role, created_at) VALUES ($1,$2,$3,$4) RETURNING id',
    ['admin@localshield.com', adminHash, 'admin', now]
  );
  const { rows: [{ id: merchantId }] } = await pool.query(
    'INSERT INTO users (email, password_hash, role, created_at) VALUES ($1,$2,$3,$4) RETURNING id',
    ['merchant@localshield.com', merchantHash, 'merchant', now]
  );
  const { rows: [{ id: pendingUserId }] } = await pool.query(
    'INSERT INTO users (email, password_hash, role, created_at) VALUES ($1,$2,$3,$4) RETURNING id',
    ['pending@localshield.com', pendingHash, 'merchant', now]
  );

  const { rows: [{ id: store1Id }] } = await pool.query(
    'INSERT INTO stores (owner_id, name, region, location, status, created_at) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
    [merchantId, 'OO상회', '대전', '대전 중앙시장 B동 12호', 'approved', now]
  );
  await pool.query(
    'UPDATE stores SET qr_token=$1, qr_expires_at=$2, name_en=$3, name_zh=$4, location_en=$5, location_zh=$6 WHERE id=$7',
    [generateStoreQrToken(store1Id, now), now + 365 * 24 * 60 * 60 * 1000,
     'OO Merchant', 'OO商行',
     'Block B, Unit 12, Daejeon Central Market', '大田中央市场 B栋 12号',
     store1Id]
  );

  const { rows: [{ id: store2Id }] } = await pool.query(
    'INSERT INTO stores (owner_id, name, region, location, status, created_at) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
    [merchantId, '청년떡집', '대전', '대전 유성구 봉명동 55-3', 'approved', now]
  );
  await pool.query(
    'UPDATE stores SET qr_token=$1, qr_expires_at=$2, name_en=$3, name_zh=$4, location_en=$5, location_zh=$6 WHERE id=$7',
    [generateStoreQrToken(store2Id, now), now + 365 * 24 * 60 * 60 * 1000,
     'Youth Tteokjip', '青年年糕店',
     '55-3 Bongmyeong-dong, Yuseong-gu, Daejeon', '大田市儒城区凤鸣洞 55-3',
     store2Id]
  );

  const { rows: [{ id: store3Id }] } = await pool.query(
    'INSERT INTO stores (owner_id, name, region, location, status, created_at) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
    [pendingUserId, '한솔수산', '세종', '세종 한솔동 주민시장 내', 'pending', now]
  );
  await pool.query(
    'UPDATE stores SET qr_token=$1, qr_expires_at=$2, name_en=$3, name_zh=$4, location_en=$5, location_zh=$6 WHERE id=$7',
    [generateStoreQrToken(store3Id, now), now + 365 * 24 * 60 * 60 * 1000,
     'Hansol Seafood', '汉索水产',
     'Hansol Community Market, Hansol-dong, Sejong', '世宗市汉索洞居民市场内',
     store3Id]
  );

  const productsData = [
    {
      store_id: store1Id, owner_id: merchantId, region: '대전',
      name: '성심당 튀김소보로',
      name_en: 'Sungsimdang Fried Soborro', name_zh: '圣心堂炸酥饼',
      price: 2500,
      description: '대전의 명물 성심당에서 엄선한 튀김소보로. 겉은 바삭, 속은 촉촉한 소보로빵.',
      description_en: "Sungsimdang's signature fried soborro from Daejeon. Crispy outside, soft and moist inside.",
      description_zh: '大田名品圣心堂的招牌炸酥饼，外皮酥脆，内里松软湿润。',
      origin: '대전', origin_en: 'Daejeon', origin_zh: '大田',
      allergy: '밀, 우유, 달걀', allergy_en: 'Wheat, Milk, Eggs', allergy_zh: '小麦、牛奶、鸡蛋',
      image_url: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=600',
    },
    {
      store_id: store1Id, owner_id: merchantId, region: '대전',
      name: '대전 한밭식혜',
      name_en: 'Daejeon Hanbat Sikhye', name_zh: '大田汉밧甜米露',
      price: 4000,
      description: '대전 전통 방식으로 만든 달콤한 식혜. 방부제 없이 당일 생산.',
      description_en: 'Sweet rice punch brewed the traditional Daejeon way. No preservatives, produced fresh daily.',
      description_zh: '以大田传统方式酿造的甜米露。无防腐剂，当日生产。',
      origin: '대전', origin_en: 'Daejeon', origin_zh: '大田',
      allergy: '없음', allergy_en: 'None', allergy_zh: '无',
      image_url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600',
    },
    {
      store_id: store1Id, owner_id: merchantId, region: '충남',
      name: '충남 서산 6년근 인삼',
      name_en: 'Seosan 6-Year Ginseng', name_zh: '忠南瑞山6年根人参',
      price: 85000,
      description: '충남 서산에서 직접 재배한 6년근 인삼. 농약 없이 자연 재배.',
      description_en: '6-year-old ginseng grown naturally in Seosan, South Chungcheong. Cultivated without pesticides.',
      description_zh: '忠清南道瑞山天然种植的6年根人参，无农药自然培育。',
      origin: '충남 서산', origin_en: 'Seosan, South Chungcheong', origin_zh: '忠清南道瑞山',
      allergy: '없음', allergy_en: 'None', allergy_zh: '无',
      image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600',
    },
    {
      store_id: store3Id, owner_id: pendingUserId, region: '세종',
      name: '한솔수산 갈치',
      name_en: 'Hansol Hairtail Fish', name_zh: '汉索水产带鱼',
      price: 35000,
      description: '제주 직송 은갈치. 세종 한솔수산에서 매일 새벽 공수.',
      description_en: 'Silver hairtail fish delivered directly from Jeju. Fresh stock sourced every morning at Sejong Hansol Seafood.',
      description_zh: '从济州岛直送的银带鱼。世宗汉索水产每日清晨新鲜进货。',
      origin: '제주', origin_en: 'Jeju Island', origin_zh: '济州岛',
      allergy: '어류', allergy_en: 'Fish', allergy_zh: '鱼类',
      image_url: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=600',
    },
    {
      store_id: store2Id, owner_id: merchantId, region: '충북',
      name: '청남대 막걸리',
      name_en: 'Cheongnamdae Makgeolli', name_zh: '青南台米酒',
      price: 6000,
      description: '충북 청주 청남대 인근에서 빚은 전통 막걸리. 국산 쌀 100% 사용.',
      description_en: 'Traditional makgeolli brewed near Cheongnamdae in Cheongju, North Chungcheong. Made with 100% Korean rice.',
      description_zh: '在忠北清州青南台附近酿造的传统米酒。使用100%韩国大米。',
      origin: '충북 청주', origin_en: 'Cheongju, North Chungcheong', origin_zh: '忠清北道清州',
      allergy: '없음', allergy_en: 'None', allergy_zh: '无',
      image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600',
    },
  ];

  for (const p of productsData) {
    const createdAt = now - Math.floor(Math.random() * 86400000);
    const promoText = generatePromoText({ name: p.name, region: p.region, origin: p.origin });
    const { rows: [{ id: productId }] } = await pool.query(
      `INSERT INTO products
        (store_id, owner_id, name, name_en, name_zh, price, description, description_en, description_zh,
         origin, origin_en, origin_zh, allergy, allergy_en, allergy_zh,
         image_url, ai_promo_text, qr_token, qr_expires_at, is_active, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,'',$18,1,$19) RETURNING id`,
      [p.store_id, p.owner_id, p.name, p.name_en, p.name_zh, p.price,
       p.description, p.description_en, p.description_zh,
       p.origin, p.origin_en, p.origin_zh, p.allergy, p.allergy_en, p.allergy_zh,
       p.image_url, promoText, now + 30 * 24 * 60 * 60 * 1000, createdAt]
    );
    const token = generateQrToken(productId, createdAt);
    await pool.query('UPDATE products SET qr_token=$1 WHERE id=$2', [token, productId]);
  }

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
    await pool.query(
      'INSERT INTO security_logs (user_id, event_type, ip_address, detail, severity, created_at) VALUES ($1,$2,$3,$4,$5,$6)',
      [null, log.event_type, log.ip, log.detail, log.severity, now - log.ago]
    );
  }

  console.log('[Seed] Done.');
}

module.exports = seed;
