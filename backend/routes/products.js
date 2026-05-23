const express = require('express');
const sanitizeHtml = require('sanitize-html');
const getDb = require('../db');
const { requireAuth, requireMerchant } = require('../middleware/auth');
const { logSecurity } = require('../utils/logger');
const { generateQrToken, verifyQrToken, buildQrUrl } = require('../utils/qr');
const { generatePromoText } = require('../utils/promo');

const router = express.Router();

// Public: get single product with QR verification
router.get('/public/:id', (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { token } = req.query;
    const ip = req.ip;

    const product = db.prepare(`
      SELECT p.*, s.name as store_name, s.status as store_status, s.region as store_region
      FROM products p
      JOIN stores s ON p.store_id = s.id
      WHERE p.id = ?
    `).get(id);

    if (!product) {
      logSecurity({ eventType: 'FAKE_QR_ACCESS', ipAddress: ip, detail: `Product not found: id=${id}, token=${token}`, severity: 'critical' });
      return res.json({ status: 'danger', message: '존재하지 않거나 위조 가능성이 있는 QR입니다.' });
    }

    if (!product.is_active) {
      logSecurity({ eventType: 'FAKE_QR_ACCESS', ipAddress: ip, detail: `Inactive product accessed: id=${id}`, severity: 'high' });
      return res.json({ status: 'danger', message: '비활성화된 상품입니다.' });
    }

    if (!token || !verifyQrToken(product.id, product.created_at, token)) {
      logSecurity({ eventType: 'FAKE_QR_ACCESS', ipAddress: ip, detail: `Invalid QR token for product_id=${id}: token=${token}`, severity: 'critical' });
      return res.json({ status: 'danger', message: '토큰이 일치하지 않습니다. 위조된 QR일 수 있습니다.' });
    }

    if (product.qr_expires_at && Date.now() > product.qr_expires_at) {
      return res.json({ status: 'danger', message: 'QR이 만료되었습니다.' });
    }

    if (product.store_status === 'pending') {
      return res.json({ status: 'warning', message: '승인 대기 중인 상점입니다.', product });
    }

    if (product.store_status === 'flagged') {
      return res.json({ status: 'warning', message: '신고가 접수된 상점입니다.', product });
    }

    return res.json({ status: 'safe', message: '공식 인증된 대충실드 QR 페이지입니다.', product });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: '서버 오류' });
  }
});

// Merchant: list own products
router.get('/my', requireMerchant, (req, res) => {
  try {
    const db = getDb();
    const products = db.prepare(`
      SELECT p.*, s.name as store_name, s.status as store_status, s.region
      FROM products p
      JOIN stores s ON p.store_id = s.id
      WHERE p.owner_id = ?
      ORDER BY p.created_at DESC
    `).all(req.user.id);

    const result = products.map(p => ({
      ...p,
      qr_url: buildQrUrl(p.id, p.qr_token)
    }));
    return res.json({ products: result });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: '서버 오류' });
  }
});

// Merchant: create product
router.post('/', requireMerchant, (req, res) => {
  try {
    const db = getDb();
    const { store_id, name, price, description, origin, allergy, image_url } = req.body;
    const ip = req.ip;

    if (!name || !price || !store_id) {
      return res.status(400).json({ error: '필수 항목을 입력해주세요.' });
    }

    // Verify store ownership
    const store = db.prepare('SELECT * FROM stores WHERE id=?').get(store_id);
    if (!store || store.owner_id !== req.user.id) {
      logSecurity({ userId: req.user.id, eventType: 'IDOR_ATTEMPT', ipAddress: ip, detail: `User ${req.user.id} attempted product creation with store owned by others: store_id=${store_id}`, severity: 'medium' });
      return res.status(403).json({ error: '해당 상점의 권한이 없습니다.' });
    }

    // XSS detection in description
    let cleanDescription = description || '';
    const rawLower = cleanDescription.toLowerCase();
    const xssPatterns = ['<script', 'onerror=', 'onload=', 'javascript:', 'onclick=', 'alert('];
    const hasXss = xssPatterns.some(p => rawLower.includes(p));
    if (hasXss) {
      logSecurity({ userId: req.user.id, eventType: 'XSS_ATTEMPT', ipAddress: ip, detail: `XSS payload detected in description: ${cleanDescription.slice(0, 200)}`, severity: 'critical' });
    }
    cleanDescription = sanitizeHtml(cleanDescription, { allowedTags: [], allowedAttributes: {} });

    const createdAt = Date.now();
    const promoText = generatePromoText({ name, region: store.region, origin: origin || store.region });

    const result = db.prepare(`
      INSERT INTO products (store_id, owner_id, name, price, description, origin, allergy, image_url, ai_promo_text, qr_token, qr_expires_at, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '', ?, 1, ?)
    `).run(store_id, req.user.id, name, parseInt(price), cleanDescription, origin || '', allergy || '', image_url || '', Date.now() + 30 * 24 * 60 * 60 * 1000, createdAt);

    const productId = result.lastInsertRowid;
    const token = generateQrToken(productId, createdAt);
    db.prepare('UPDATE products SET qr_token=?, ai_promo_text=? WHERE id=?').run(token, promoText, productId);

    const product = db.prepare('SELECT * FROM products WHERE id=?').get(productId);
    return res.status(201).json({
      product: { ...product, qr_url: buildQrUrl(productId, token) }
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: '서버 오류' });
  }
});

// Merchant: update product (IDOR protection)
router.put('/:id', requireMerchant, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const ip = req.ip;

    const product = db.prepare('SELECT * FROM products WHERE id=?').get(id);
    if (!product) return res.status(404).json({ error: '상품을 찾을 수 없습니다.' });

    if (product.owner_id !== req.user.id && req.user.role !== 'admin') {
      logSecurity({ userId: req.user.id, eventType: 'IDOR_ATTEMPT', ipAddress: ip, detail: `User ${req.user.id} (${req.user.email}) attempted to modify product owned by user ${product.owner_id} (product_id: ${id})`, severity: 'medium' });
      return res.status(403).json({ error: '이 상품을 수정할 권한이 없습니다.' });
    }

    const { name, price, description, origin, allergy, image_url } = req.body;
    let cleanDescription = description || product.description;
    const rawLower = cleanDescription.toLowerCase();
    const xssPatterns = ['<script', 'onerror=', 'onload=', 'javascript:', 'onclick=', 'alert('];
    const hasXss = xssPatterns.some(p => rawLower.includes(p));
    if (hasXss) {
      logSecurity({ userId: req.user.id, eventType: 'XSS_ATTEMPT', ipAddress: ip, detail: `XSS payload detected in product update: ${cleanDescription.slice(0, 200)}`, severity: 'critical' });
    }
    cleanDescription = sanitizeHtml(cleanDescription, { allowedTags: [], allowedAttributes: {} });

    db.prepare(`
      UPDATE products SET name=?, price=?, description=?, origin=?, allergy=?, image_url=?
      WHERE id=?
    `).run(name || product.name, parseInt(price) || product.price, cleanDescription, origin || product.origin, allergy || product.allergy, image_url || product.image_url, id);

    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: '서버 오류' });
  }
});

// Merchant: delete product (IDOR protection)
router.delete('/:id', requireMerchant, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const ip = req.ip;

    const product = db.prepare('SELECT * FROM products WHERE id=?').get(id);
    if (!product) return res.status(404).json({ error: '상품을 찾을 수 없습니다.' });

    if (product.owner_id !== req.user.id && req.user.role !== 'admin') {
      logSecurity({ userId: req.user.id, eventType: 'IDOR_ATTEMPT', ipAddress: ip, detail: `User ${req.user.id} attempted to delete product owned by user ${product.owner_id} (product_id: ${id})`, severity: 'medium' });
      return res.status(403).json({ error: '이 상품을 삭제할 권한이 없습니다.' });
    }

    db.prepare('UPDATE products SET is_active=0 WHERE id=?').run(id);
    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: '서버 오류' });
  }
});

// Merchant: get/create store
router.get('/stores/my', requireMerchant, (req, res) => {
  try {
    const db = getDb();
    const stores = db.prepare('SELECT * FROM stores WHERE owner_id=?').all(req.user.id);
    return res.json({ stores });
  } catch (e) {
    return res.status(500).json({ error: '서버 오류' });
  }
});

router.post('/stores', requireMerchant, (req, res) => {
  try {
    const db = getDb();
    const { name, region, location } = req.body;
    if (!name || !region) return res.status(400).json({ error: '상점명과 지역을 입력해주세요.' });
    const validRegions = ['대전', '세종', '충남', '충북'];
    if (!validRegions.includes(region)) return res.status(400).json({ error: '유효하지 않은 지역입니다.' });
    const result = db.prepare(
      'INSERT INTO stores (owner_id, name, region, location, status, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(req.user.id, name, region, location || '', 'pending', Date.now());
    const store = db.prepare('SELECT * FROM stores WHERE id=?').get(result.lastInsertRowid);
    return res.status(201).json({ store });
  } catch (e) {
    return res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = router;
