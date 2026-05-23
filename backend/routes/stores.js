const express = require('express');
const pool = require('../db');
const { buildStoreQrUrl } = require('../utils/qr');

const router = express.Router();

// 공개 인증 상점 목록 (지도용) — 인증 불필요
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT s.id, s.name, s.name_en, s.name_zh,
             s.region, s.location, s.location_en, s.location_zh,
             s.latitude, s.longitude, s.qr_token,
             (SELECT COUNT(*) FROM products WHERE store_id = s.id AND is_active = 1) AS product_count
      FROM stores s
      WHERE s.status = 'approved'
        AND s.latitude IS NOT NULL
        AND s.longitude IS NOT NULL
      ORDER BY s.region, s.name
    `);
    return res.json({
      stores: rows.map(s => ({
        ...s,
        store_qr_url: s.qr_token ? buildStoreQrUrl(s.id, s.qr_token) : null,
      })),
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = router;
