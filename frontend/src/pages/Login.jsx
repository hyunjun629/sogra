import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { api } from '../api';
import { setAuth } from '../auth';

export default function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 에러 5초 후 자동 닫힘
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(''), 5000);
    return () => clearTimeout(timer);
  }, [error]);

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

  const demoAccounts = [
    { labelKey: 'login.demoAdmin', email: 'admin@localshield.com', pass: '1234', color: 'purple' },
    { labelKey: 'login.demoMerchant', email: 'merchant@localshield.com', pass: '1234', color: 'indigo' },
    { labelKey: 'login.demoPending', email: 'pending@localshield.com', pass: '1234', color: 'amber' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🛡️</div>
          <h1 className="text-2xl font-bold text-zinc-100">{t('login.title')}</h1>
          <p className="text-zinc-500 mt-1">{t('login.subtitle')}</p>
        </div>

        {/* Demo accounts */}
        <div className="card mb-6 p-4">
          <p className="text-xs text-zinc-500 mb-3 font-semibold uppercase tracking-wider">{t('login.demoLabel')}</p>
          <div className="flex flex-col gap-2">
            {demoAccounts.map(a => (
              <button
                key={a.email}
                onClick={() => fillDemo(a.email, a.pass)}
                className="flex justify-between items-center bg-zinc-800 hover:bg-zinc-700 rounded-lg px-3 py-2 text-sm transition-colors"
              >
                <span className={`font-semibold ${a.color === 'purple' ? 'text-purple-400' : a.color === 'amber' ? 'text-amber-400' : 'text-indigo-400'}`}>{t(a.labelKey)}</span>
                <span className="text-zinc-400 font-mono text-xs">{a.email}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card">
          <AnimatePresence>
            {error && (
              <motion.div
                key="login-error"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="mb-4"
              >
                <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 text-red-400 text-sm">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span>⚠️ {error}</span>
                    <button
                      type="button"
                      onClick={() => setError('')}
                      className="text-red-400/60 hover:text-red-300 flex-shrink-0 leading-none"
                    >✕</button>
                  </div>
                  {/* 5초 자동 닫힘 진행바 */}
                  <div className="h-0.5 bg-red-900/60 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-red-500"
                      initial={{ width: '100%' }}
                      animate={{ width: '0%' }}
                      transition={{ duration: 5, ease: 'linear' }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">{t('login.email')}</label>
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
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">{t('login.password')}</label>
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
            {loading ? t('login.loading') : t('login.submit')}
          </button>
          <p className="text-center text-zinc-500 text-sm mt-4">
            {t('login.noAccount')}{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300">{t('login.registerLink')}</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
