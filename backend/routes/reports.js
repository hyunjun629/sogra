const express = require('express');
const getDb = require('../db');

const router = express.Router();

const REASONS = ['가격 오류', '사칭 의심', '이상한 링크', '상품 정보 오류', '악성 페이지 의심', '기타'];

router.post('/:productId', (req, res) => {
  try {
    const db = getDb();
    const { productId } = req.params;
    const { reason, detail } = req.body;
    const ip = req.ip;

    if (!reason || !REASONS.includes(reason)) {
      return res.status(400).json({ error: '유효하지 않은 신고 유형입니다.' });
    }

    const product = db.prepare('SELECT * FROM products WHERE id=?').get(productId);
    if (!product) return res.status(404).json({ error: '상품을 찾을 수 없습니다.' });

    db.prepare(
      'INSERT INTO reports (product_id, reason, detail, reporter_ip, status, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(productId, reason, detail || '', ip, 'open', Date.now());

    const newCount = (product.report_count || 0) + 1;
    db.prepare('UPDATE products SET report_count=? WHERE id=?').run(newCount, productId);

    if (newCount >= 3) {
      db.prepare('UPDATE products SET is_active=0 WHERE id=?').run(productId);
      db.prepare("UPDATE stores SET status='flagged' WHERE id=?").run(product.store_id);
    }

    return res.json({ success: true, reportCount: newCount, autoFlagged: newCount >= 3 });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: '서버 오류' });
  }
});

router.get('/product/:productId', (req, res) => {
  try {
    const db = getDb();
    const reports = db.prepare('SELECT * FROM reports WHERE product_id=? ORDER BY created_at DESC').all(req.params.productId);
    return res.json({ reports });
  } catch (e) {
    return res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = router;
