import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getUser, isLoggedIn, clearAuth } from '../auth';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const navigate = useNavigate();
  const user = getUser();
  const loggedIn = isLoggedIn();
  const { isDark, toggle } = useTheme();

  function handleLogout() {
    clearAuth();
    navigate('/');
  }

  return (
    <nav className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 sticky top-0 z-40 backdrop-blur-sm bg-opacity-90">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-indigo-400 text-xl">🛡️</span>
          <span className="font-bold text-zinc-100 text-lg">대충실드 QR</span>
          <span className="text-zinc-500 text-xs hidden sm:block">Daejeon, Chungcheong-do QR</span>
        </Link>

        <div className="flex items-center gap-3">
          {/* 다크/라이트 토글 */}
          <motion.button
            onClick={toggle}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-lg"
            title={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
            aria-label="테마 전환"
          >
            <motion.span
              key={isDark ? 'moon' : 'sun'}
              initial={{ rotate: -30, opacity: 0, scale: 0.7 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {isDark ? '☀️' : '🌙'}
            </motion.span>
          </motion.button>

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
