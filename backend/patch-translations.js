// 기존 Supabase 데이터에 번역 컬럼을 한 번 채우는 스크립트
// 실행: node backend/patch-translations.js
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pool = require('./db');
const { generatePromoTextEn, generatePromoTextZh } = require('./utils/promo');

async function patch() {
  console.log('[Patch] Adding translations to existing data...');

  // 상점 번역
  const stores = [
    { name: 'OO상회',  name_en: 'OO Merchant',    name_zh: 'OO商行',    location_en: 'Block B, Unit 12, Daejeon Central Market', location_zh: '大田中央市场 B栋 12号' },
    { name: '청년떡집', name_en: 'Youth Tteokjip', name_zh: '青年年糕店', location_en: '55-3 Bongmyeong-dong, Yuseong-gu, Daejeon',    location_zh: '大田市儒城区凤鸣洞 55-3' },
    { name: '한솔수산', name_en: 'Hansol Seafood',  name_zh: '汉索水产',   location_en: 'Hansol Community Market, Hansol-dong, Sejong', location_zh: '世宗市汉索洞居民市场内' },
  ];
  for (const s of stores) {
    const res = await pool.query(
      'UPDATE stores SET name_en=$1, name_zh=$2, location_en=$3, location_zh=$4 WHERE name=$5',
      [s.name_en, s.name_zh, s.location_en, s.location_zh, s.name]
    );
    console.log(`  stores "${s.name}" → ${res.rowCount} row(s) updated`);
  }

  // 상품 번역
  const products = [
    {
      name: '성심당 튀김소보로',
      name_en: 'Sungsimdang Fried Soborro', name_zh: '圣心堂炸酥饼',
      description_en: "Sungsimdang's signature fried soborro from Daejeon. Crispy outside, soft and moist inside.",
      description_zh: '大田名品圣心堂的招牌炸酥饼，外皮酥脆，内里松软湿润。',
      origin_en: 'Daejeon', origin_zh: '大田',
      allergy_en: 'Wheat, Milk, Eggs', allergy_zh: '小麦、牛奶、鸡蛋',
      promo: { name_en: 'Sungsimdang Fried Soborro', region_en: 'Daejeon', origin_en: 'Daejeon', name_zh: '圣心堂炸酥饼', region_zh: '大田', origin_zh: '大田' },
    },
    {
      name: '대전 한밭식혜',
      name_en: 'Daejeon Hanbat Sikhye', name_zh: '大田汉밧甜米露',
      description_en: 'Sweet rice punch brewed the traditional Daejeon way. No preservatives, produced fresh daily.',
      description_zh: '以大田传统方式酿造的甜米露。无防腐剂，当日生产。',
      origin_en: 'Daejeon', origin_zh: '大田',
      allergy_en: 'None', allergy_zh: '无',
      promo: { name_en: 'Daejeon Hanbat Sikhye', region_en: 'Daejeon', origin_en: 'Daejeon', name_zh: '大田汉밧甜米露', region_zh: '大田', origin_zh: '大田' },
    },
    {
      name: '충남 서산 6년근 인삼',
      name_en: 'Seosan 6-Year Ginseng', name_zh: '忠南瑞山6年根人参',
      description_en: '6-year-old ginseng grown naturally in Seosan, South Chungcheong. Cultivated without pesticides.',
      description_zh: '忠清南道瑞山天然种植的6年根人参，无农药自然培育。',
      origin_en: 'Seosan, South Chungcheong', origin_zh: '忠清南道瑞山',
      allergy_en: 'None', allergy_zh: '无',
      promo: { name_en: 'Seosan 6-Year Ginseng', region_en: 'South Chungcheong', origin_en: 'Seosan', name_zh: '忠南瑞山6年根人参', region_zh: '忠清南道', origin_zh: '瑞山' },
    },
    {
      name: '한솔수산 갈치',
      name_en: 'Hansol Hairtail Fish', name_zh: '汉索水产带鱼',
      description_en: 'Silver hairtail fish delivered directly from Jeju. Fresh stock sourced every morning at Sejong Hansol Seafood.',
      description_zh: '从济州岛直送的银带鱼。世宗汉索水产每日清晨新鲜进货。',
      origin_en: 'Jeju Island', origin_zh: '济州岛',
      allergy_en: 'Fish', allergy_zh: '鱼类',
      promo: { name_en: 'Hansol Hairtail Fish', region_en: 'Sejong', origin_en: 'Jeju Island', name_zh: '汉索水产带鱼', region_zh: '世宗', origin_zh: '济州岛' },
    },
    {
      name: '청남대 막걸리',
      name_en: 'Cheongnamdae Makgeolli', name_zh: '青南台米酒',
      description_en: 'Traditional makgeolli brewed near Cheongnamdae in Cheongju, North Chungcheong. Made with 100% Korean rice.',
      description_zh: '在忠北清州青南台附近酿造的传统米酒。使用100%韩国大米。',
      origin_en: 'Cheongju, North Chungcheong', origin_zh: '忠清北道清州',
      allergy_en: 'None', allergy_zh: '无',
      promo: { name_en: 'Cheongnamdae Makgeolli', region_en: 'North Chungcheong', origin_en: 'Cheongju', name_zh: '青南台米酒', region_zh: '忠清北道', origin_zh: '清州' },
    },
  ];
  for (const p of products) {
    const ai_promo_text_en = generatePromoTextEn(p.promo);
    const ai_promo_text_zh = generatePromoTextZh(p.promo);
    const res = await pool.query(
      `UPDATE products SET
        name_en=$1, name_zh=$2,
        description_en=$3, description_zh=$4,
        origin_en=$5, origin_zh=$6,
        allergy_en=$7, allergy_zh=$8,
        ai_promo_text_en=$9, ai_promo_text_zh=$10
       WHERE name=$11`,
      [p.name_en, p.name_zh, p.description_en, p.description_zh,
       p.origin_en, p.origin_zh, p.allergy_en, p.allergy_zh,
       ai_promo_text_en, ai_promo_text_zh, p.name]
    );
    console.log(`  products "${p.name}" → ${res.rowCount} row(s) updated`);
  }

  console.log('[Patch] Done.');
  await pool.end();
}

patch().catch(e => { console.error(e); process.exit(1); });
