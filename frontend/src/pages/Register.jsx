import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { setAuth } from '../auth';

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError('비밀번호가 일치하지 않습니다.');
    if (password.length < 4) return setError('비밀번호는 4자 이상이어야 합니다.');
    setLoading(true);
    try {
      const data = await api.register(email, password);
      setAuth(data.token, data.user);
      navigate('/merchant');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏪</div>
          <h1 className="text-2xl font-bold text-zinc-100">상인 회원가입</h1>
          <p className="text-zinc-500 mt-1">대충실드 QR 상점주로 가입하기</p>
        </div>

        <form onSubmit={handleSubmit} className="card">
          {error && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 mb-4 text-red-400 text-sm">
              {error}
            </div>
          )}
          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">이메일</label>
            <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="yourshop@email.com" required />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">비밀번호</label>
            <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">비밀번호 확인</label>
            <input type="password" className="input" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" required />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? '가입 중...' : '상인으로 가입하기'}
          </button>
          <p className="text-center text-zinc-500 text-sm mt-4">
            이미 계정이 있으신가요? <Link to="/login" className="text-indigo-400 hover:text-indigo-300">로그인</Link>
          </p>
        </form>

        <div className="card mt-4 p-4">
          <p className="text-xs text-zinc-500 mb-2">가입 후 가능한 작업:</p>
          <ul className="text-sm text-zinc-400 space-y-1">
            <li>✅ 상점 등록 (대전·세종·충남·충북)</li>
            <li>✅ 상품 등록 + HMAC QR 자동 발급</li>
            <li>✅ QR 코드 인쇄 및 공유</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
