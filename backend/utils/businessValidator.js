/**
 * 한국 사업자등록번호 체크섬 검증
 * 가중치: [1,3,7,1,3,7,1,3,5], 마지막 자리가 검증번호
 */
function validateChecksum(number) {
  const digits = number.replace(/[^0-9]/g, '');
  if (digits.length !== 10) return false;

  const weights = [1, 3, 7, 1, 3, 7, 1, 3, 5];
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += weights[i] * parseInt(digits[i]);
  }
  sum += Math.floor((5 * parseInt(digits[8])) / 10);
  const check = (10 - (sum % 10)) % 10;
  return check === parseInt(digits[9]);
}

/**
 * 국세청 사업자 상태 조회 API
 * BUSINESS_API_KEY 미설정 시 체크섬 검증만으로 대체
 *
 * API: https://api.odcloud.kr/api/nts-businessman/v1/status
 * b_stt_cd: "01"=계속사업자, "02"=휴업자, "03"=폐업자
 */
async function verifyBusiness(rawNumber) {
  const digits = rawNumber.replace(/[^0-9]/g, '');

  if (!validateChecksum(digits)) {
    return { verified: false, message: '유효하지 않은 사업자등록번호입니다. (체크섬 오류)' };
  }

  const apiKey = process.env.BUSINESS_API_KEY;
  if (!apiKey) {
    return { verified: true, source: 'checksum', message: '사업자등록번호 형식 확인 완료' };
  }

  try {
    const res = await fetch(
      `https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=${encodeURIComponent(apiKey)}&returnType=JSON`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ b_no: [digits] }),
      }
    );

    if (!res.ok) throw new Error(`NTS API HTTP ${res.status}`);

    const json = await res.json();
    const result = json.data?.[0];

    if (!result?.b_stt_cd) {
      return { verified: false, message: '국세청에 등록되지 않은 사업자번호입니다.' };
    }
    if (result.b_stt_cd === '01') {
      return { verified: true, source: 'nts', message: `실시간 조회 완료 — 계속사업자 (${result.tax_type || ''})` };
    }
    if (result.b_stt_cd === '02') {
      return { verified: false, message: '휴업 중인 사업자입니다. 계속사업자만 가입 가능합니다.' };
    }
    if (result.b_stt_cd === '03') {
      return { verified: false, message: '폐업한 사업자입니다.' };
    }
    return { verified: false, message: '유효하지 않은 사업자 상태입니다.' };
  } catch (e) {
    console.error('[NTS API Error]', e.message);
    // API 오류 시 체크섬 검증으로 대체
    return { verified: true, source: 'checksum_fallback', message: '사업자등록번호 형식 확인 완료 (API 연결 오류로 오프라인 검증)' };
  }
}

module.exports = { validateChecksum, verifyBusiness };
