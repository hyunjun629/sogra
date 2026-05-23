const rateLimit = require('express-rate-limit');

const SQLI_PATTERNS = ["' or", '-- ', 'union ', '; ', '/* ', 'xp_', "' or'", "or '1'='1", 'drop table', 'insert into', 'select *'];

function detectSqli(value) {
  if (!value) return false;
  const lower = value.toLowerCase();
  return SQLI_PATTERNS.some(p => lower.includes(p));
}

const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: '너무 많은 요청입니다. 15분 후 재시도해주세요.' }
});

const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: { error: '요청이 너무 많습니다.' }
});

module.exports = { detectSqli, loginRateLimit, apiRateLimit };
