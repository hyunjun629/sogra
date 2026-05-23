import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { setAuth } from '../auth';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login(email, password);
      setAuth(data.token, data.user);
      if (data.user.role === 'admin') navigate('/admin');
      else navigate('/merchant');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(emailVal, passVal) {
    setEmail(emailVal);
    setPassword(passVal);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🛡️</div>
          <h1 className="text-2xl font-bold text-zinc-100">로그인</h1>
          <p className="text-zinc-500 mt-1">대충실드 QR에 오신 것을 환영합니다</p>
        </div>

        {/* Demo accounts */}
        <div className="card mb-6 p-4">
          <p className="text-xs text-zinc-500 mb-3 font-semibold uppercase tracking-wider">데모 계정</p>
          <div className="flex flex-col gap-2">
            {[
              { label: '관리자', email: 'admin@localshield.com', pass: '1234', color: 'purple' },
              { label: '상인 (승인)', email: 'merchant@localshield.com', pass: '1234', color: 'indigo' },
              { label: '상인 (대기)', email: 'pending@localshield.com', pass: '1234', color: 'amber' },
            ].map(a => (
              <button
                key={a.email}
                onClick={() => fillDemo(a.email, a.pass)}
                className="flex justify-between items-center bg-zinc-800 hover:bg-zinc-700 rounded-lg px-3 py-2 text-sm transition-colors"
              >
                <span className={`font-semibold ${a.color === 'purple' ? 'text-purple-400' : a.color === 'amber' ? 'text-amber-400' : 'text-indigo-400'}`}>{a.label}</span>
                <span className="text-zinc-400 font-mono text-xs">{a.email}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card">
          {error && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 mb-4 text-red-400 text-sm">
              {error}
            </div>
          )}
          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">이메일</label>
            <input
              type="text"
              className="input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">비밀번호</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? '로그인 중...' : '로그인'}
          </button>
          <p className="text-center text-zinc-500 text-sm mt-4">
            계정이 없으신가요? <Link to="/register" className="text-indigo-400 hover:text-indigo-300">회원가입</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
