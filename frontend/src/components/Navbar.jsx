import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUser, isLoggedIn, clearAuth } from '../auth';

export default function Navbar() {
  const navigate = useNavigate();
  const user = getUser();
  const loggedIn = isLoggedIn();

  function handleLogout() {
    clearAuth();
    navigate('/');
  }

  return (
    <nav className="bg-zinc-900 border-b border-zinc-800 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-indigo-400 text-xl">🛡️</span>
          <span className="font-bold text-zinc-100 text-lg">대충실드 QR</span>
          <span className="text-zinc-500 text-xs hidden sm:block">Daejeon, Chungcheong-do QR</span>
        </Link>
        <div className="flex items-center gap-3">
          {loggedIn ? (
            <>
              <span className="text-zinc-400 text-sm hidden sm:block">{user?.email}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${user?.role === 'admin' ? 'bg-purple-900/50 text-purple-400' : 'bg-indigo-900/50 text-indigo-400'}`}>
                {user?.role === 'admin' ? '관리자' : '상인'}
              </span>
              {user?.role === 'merchant' && (
                <Link to="/merchant" className="text-sm text-zinc-300 hover:text-white transition-colors">내 상점</Link>
              )}
              {user?.role === 'admin' && (
                <Link to="/admin" className="text-sm text-zinc-300 hover:text-white transition-colors">관제 센터</Link>
              )}
              <button onClick={handleLogout} className="btn-ghost text-sm py-1.5 px-3">로그아웃</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-zinc-300 hover:text-white transition-colors">로그인</Link>
              <Link to="/register" className="btn-primary text-sm py-1.5 px-3">가입하기</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
