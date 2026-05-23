// obj의 field를 현재 언어에 맞게 반환. 번역 없으면 한국어 원문 fallback
export function loc(obj, field, lang) {
  if (!obj) return '';
  if (lang === 'ko') return obj[field] || '';
  return obj[`${field}_${lang}`] || obj[field] || '';
}
