function generatePromoText({ name, region, origin }) {
  const hooks = [
    `🔥 ${region} 대표 ${name}, 한 번 맛보면 잊을 수 없어요!`,
    `✨ ${origin} 직송 ${name} — 지역의 자부심을 담았습니다.`,
    `🌟 진짜 ${region} 맛집 ${name}, 이 가격에 이 퀄리티?`
  ];
  const tags = `#${region} #로컬푸드 #${name.replace(/\s/g, '')} #대충실드인증`;
  return `${hooks[Math.floor(Math.random() * 3)]}\n\n${tags}`;
}

module.exports = { generatePromoText };
