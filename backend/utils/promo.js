function generatePromoText({ name, region, origin }) {
  const hooks = [
    `🔥 ${region} 대표 ${name}, 한 번 맛보면 잊을 수 없어요!`,
    `✨ ${origin} 직송 ${name} — 지역의 자부심을 담았습니다.`,
    `🌟 진짜 ${region} 맛집 ${name}, 이 가격에 이 퀄리티?`
  ];
  const tags = `#${region} #로컬푸드 #${name.replace(/\s/g, '')} #대충실드인증`;
  return `${hooks[Math.floor(Math.random() * 3)]}\n\n${tags}`;
}

function generatePromoTextEn({ name_en, region_en, origin_en }) {
  const hooks = [
    `🔥 ${name_en} — the pride of ${region_en}. One bite and you'll never forget!`,
    `✨ ${name_en}, delivered fresh from ${origin_en}. Taste the local difference.`,
    `🌟 Real ${region_en} flavor: ${name_en}. This quality at this price?`
  ];
  const tags = `#${region_en} #LocalFood #${name_en.replace(/\s/g, '')} #DaechungShieldCertified`;
  return `${hooks[Math.floor(Math.random() * 3)]}\n\n${tags}`;
}

function generatePromoTextZh({ name_zh, region_zh, origin_zh }) {
  const hooks = [
    `🔥 ${region_zh}代表美食${name_zh}，一口难忘！`,
    `✨ ${name_zh}，${origin_zh}直送 — 承载着地方的骄傲。`,
    `🌟 真正的${region_zh}美味${name_zh}，这个价格这个品质？`
  ];
  const tags = `#${region_zh} #本地美食 #${name_zh.replace(/\s/g, '')} #大充实德认证`;
  return `${hooks[Math.floor(Math.random() * 3)]}\n\n${tags}`;
}

module.exports = { generatePromoText, generatePromoTextEn, generatePromoTextZh };
