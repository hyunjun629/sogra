import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getUser, isLoggedIn, clearAuth } from '../auth';
import { useTheme } from '../context/ThemeContext';

const LANGS = [
  { code: 'ko', label: '한' },
  { code: 'en', label: 'EN' },
  { code: 'zh', label: '中' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const user = getUser();
  const loggedIn = isLoggedIn();
  const { isDark, toggle } = useTheme();
  const { t, i18n } = useTranslation();

  function handleLogout() {
    clearAuth();
    navigate('/');
  }

  function changeLanguage(code) {
    i18n.changeLanguage(code);
    localStorage.setItem('ls_lang', code);
  }

  return (
    <nav className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 sticky top-0 z-40 backdrop-blur-sm bg-opacity-90">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-indigo-400 text-xl">🛡️</span>
          <span className="font-bold text-zinc-100 text-lg">대충실드 QR</span>
          <span className="text-zinc-500 text-xs hidden sm:block">{t('nav.subtitle')}</span>
        </Link>

        <div className="flex items-center gap-3">
          {/* Language switcher */}
          <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-0.5">
            {LANGS.map(lang => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`text-xs font-semibold px-2 py-1 rounded-md transition-colors ${
                  i18n.language === lang.code
                    ? 'bg-indigo-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>

          {/* Dark/light toggle */}
          <motion.button
            onClick={toggle}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-lg"
            title={isDark ? t('nav.lightMode') : t('nav.darkMode')}
            aria-label={t('common.themeToggle')}
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
                {user?.role === 'admin' ? t('nav.admin') : t('nav.merchant')}
              </span>
              {user?.role === 'merchant' && (
                <Link to="/merchant" className="text-sm text-zinc-300 hover:text-white transition-colors">{t('nav.myStore')}</Link>
              )}
              {user?.role === 'admin' && (
                <Link to="/admin" className="text-sm text-zinc-300 hover:text-white transition-colors">{t('nav.controlCenter')}</Link>
              )}
              <button onClick={handleLogout} className="btn-ghost text-sm py-1.5 px-3">{t('nav.logout')}</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-zinc-300 hover:text-white transition-colors">{t('nav.login')}</Link>
              <Link to="/register" className="btn-primary text-sm py-1.5 px-3">{t('nav.register')}</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
