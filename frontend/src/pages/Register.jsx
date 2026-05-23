import React, { useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api';
import { setAuth } from '../auth';

function formatBizNum(raw) {
  const digits = raw.replace(/[^0-9]/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [bizNum, setBizNum] = useState('');
  const [bizStatus, setBizStatus] = useState(null); // null | { valid, message, checking }
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const handleBizNumChange = useCallback((e) => {
    const formatted = formatBizNum(e.target.value);
    setBizNum(formatted);
    setBizStatus(null);

    const digits = formatted.replace(/[^0-9]/g, '');
    if (digits.length !== 10) return;

    // 10자리 완성 시 실시간 검증
    setBizStatus({ checking: true });
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.verifyBusiness(digits);
        setBizStatus({ valid: res.valid, message: res.message, checking: false });
      } catch {
        setBizStatus({ valid: null, message: '검증 중 오류', checking: false });
      }
    }, 400);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError('비밀번호가 일치하지 않습니다.');
    if (password.length < 4) return setError('비밀번호는 4자 이상이어야 합니다.');

    const digits = bizNum.replace(/[^0-9]/g, '');
    if (digits.length !== 10) return setError('사업자등록번호 10자리를 입력해주세요.');
    if (bizStatus && bizStatus.valid === false) return setError(bizStatus.message);

    setLoading(true);
    try {
      const data = await api.register(email, password, digits);
      setAuth(data.token, data.user);
      navigate('/merchant');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const bizDigits = bizNum.replace(/[^0-9]/g, '');

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏪</div>
          <h1 className="text-2xl font-bold text-zinc-100">상인 회원가입</h1>
          <p className="text-zinc-500 mt-1">대충실드 QR 상점주로 가입하기</p>
        </div>

        <form onSubmit={handleSubmit} className="card">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 mb-4 text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">이메일</label>
            <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="yourshop@email.com" required />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">비밀번호</label>
            <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">비밀번호 확인</label>
            <input type="password" className="input" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" required />
          </div>

          {/* 사업자등록번호 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">
              사업자등록번호
              <span className="text-zinc-600 font-normal ml-1">(XXX-XX-XXXXX)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                className={`input pr-10 font-mono tracking-wider ${
                  bizStatus?.valid === true ? 'border-emerald-500' :
                  bizStatus?.valid === false ? 'border-red-500' : ''
                }`}
                value={bizNum}
                onChange={handleBizNumChange}
                placeholder="000-00-00000"
                maxLength={12}
                required
              />
              {bizDigits.length === 10 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-lg">
                  {bizStatus?.checking ? (
                    <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} className="inline-block">⏳</motion.span>
                  ) : bizStatus?.valid === true ? '✅' : bizStatus?.valid === false ? '❌' : ''}
                </div>
              )}
            </div>

            <AnimatePresence>
              {bizStatus && !bizStatus.checking && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`text-xs mt-1.5 ${bizStatus.valid ? 'text-emerald-400' : 'text-red-400'}`}
                >
                  {bizStatus.valid ? '✅ ' : '❌ '}{bizStatus.message}
                </motion.p>
              )}
              {bizDigits.length > 0 && bizDigits.length < 10 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs mt-1.5 text-zinc-600"
                >
                  {10 - bizDigits.length}자리 더 입력해주세요
                </motion.p>
              )}
            </AnimatePresence>

            <div className="mt-2 bg-zinc-800/60 rounded-lg px-3 py-2 text-xs text-zinc-500">
              💡 사업자등록증에 표시된 10자리 번호를 입력하면 국세청 데이터로 실시간 검증됩니다.
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading || bizStatus?.checking}
            className="btn-primary w-full py-2.5"
            whileHover={!loading ? { scale: 1.01 } : {}}
            whileTap={!loading ? { scale: 0.98 } : {}}
          >
            {loading ? '가입 중...' : '상인으로 가입하기'}
          </motion.button>

          <p className="text-center text-zinc-500 text-sm mt-4">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300">로그인</Link>
          </p>
        </form>

        <div className="card mt-4 p-4">
          <p className="text-xs text-zinc-500 mb-2 font-semibold">가입 후 진행 순서</p>
          <ul className="text-sm text-zinc-400 space-y-1.5">
            <li>1️⃣ 사업자번호 검증 → 계정 생성</li>
            <li>2️⃣ 상점 등록 (대전·세종·충남·충북)</li>
            <li>3️⃣ 관리자 상점 승인 대기</li>
            <li>4️⃣ <span className="text-emerald-400 font-medium">승인 완료</span> → 상품 자유롭게 등록 + QR 발급</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
