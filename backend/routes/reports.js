const express = require('express');
const pool = require('../db');

const router = express.Router();
const REASONS = ['가격 오류', '사칭 의심', '이상한 링크', '상품 정보 오류', '악성 페이지 의심', '기타'];

router.post('/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { reason, detail } = req.body;
    const ip = req.ip;

    if (!reason || !REASONS.includes(reason)) return res.status(400).json({ error: '유효하지 않은 신고 유형입니다.' });

    const { rows } = await pool.query('SELECT * FROM products WHERE id=$1', [productId]);
    const product = rows[0];
    if (!product) return res.status(404).json({ error: '상품을 찾을 수 없습니다.' });

    await pool.query(
      'INSERT INTO reports (product_id, reason, detail, reporter_ip, status, created_at) VALUES ($1,$2,$3,$4,$5,$6)',
      [productId, reason, detail || '', ip, 'open', Date.now()]
    );

    const newCount = (product.report_count || 0) + 1;
    await pool.query('UPDATE products SET report_count=$1 WHERE id=$2', [newCount, productId]);

    if (newCount >= 3) {
      await pool.query('UPDATE products SET is_active=0 WHERE id=$1', [productId]);
      await pool.query("UPDATE stores SET status='flagged' WHERE id=$1", [product.store_id]);
    }

    return res.json({ success: true, reportCount: newCount, autoFlagged: newCount >= 3 });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: '서버 오류' });
  }
});

router.get('/product/:productId', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM reports WHERE product_id=$1 ORDER BY created_at DESC', [req.params.productId]);
    return res.json({ reports: rows });
  } catch (e) {
    return res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = router;
