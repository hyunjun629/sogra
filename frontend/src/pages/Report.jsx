import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../api';

export default function Report() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState('');

  const REASONS = [
    { key: 'report.reason1', value: '가격 오류' },
    { key: 'report.reason2', value: '사칭 의심' },
    { key: 'report.reason3', value: '이상한 링크' },
    { key: 'report.reason4', value: '상품 정보 오류' },
    { key: 'report.reason5', value: '악성 페이지 의심' },
    { key: 'report.reason6', value: '기타' },
  ];

  async function handleSubmit(e) {
    e.preventDefault();
    if (!reason) return setError(t('report.errSelectReason'));
    setLoading(true);
    try {
      const d = await api.submitReport(id, reason, detail);
      setDone(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card max-w-md w-full text-center">
          <div className="text-4xl mb-4">{done.autoFlagged ? '🚨' : '✅'}</div>
          <h2 className="text-xl font-bold text-zinc-100 mb-2">{t('report.doneTitle')}</h2>
          <p className="text-zinc-400 mb-2">{t('report.doneMessage')}</p>
          {done.autoFlagged && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 mb-4 text-red-400 text-sm">
              {t('report.autoFlagged')}
            </div>
          )}
          <p className="text-sm text-zinc-500 mb-6">
            {t('report.reportCount')}: {done.reportCount}{t('report.reportCountUnit')}
          </p>
          <Link to="/" className="btn-primary inline-block">{t('report.goHome')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link to={`/product/${id}`} className="text-zinc-500 hover:text-zinc-300 text-sm">{t('report.backLink')}</Link>
        </div>
        <form onSubmit={handleSubmit} className="card">
          <h1 className="text-xl font-bold text-zinc-100 mb-1">{t('report.title')}</h1>
          <p className="text-sm text-zinc-500 mb-6">{t('report.productId')}: {id}</p>

          {error && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 mb-4 text-red-400 text-sm">{error}</div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-400 mb-2">{t('report.reasonLabel')}</label>
            <div className="grid grid-cols-2 gap-2">
              {REASONS.map(r => (
                <button
                  key={r.value} type="button"
                  onClick={() => setReason(r.value)}
                  className={`px-3 py-2 rounded-lg text-sm border transition-colors ${reason === r.value ? 'bg-red-900/40 border-red-600 text-red-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
                >
                  {t(r.key)}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">{t('report.detailLabel')}</label>
            <textarea
              className="input min-h-24 resize-none"
              value={detail}
              onChange={e => setDetail(e.target.value)}
              placeholder={t('report.detailPlaceholder')}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-danger w-full py-2.5">
            {loading ? t('report.loading') : t('report.submit')}
          </button>
          <p className="text-center text-xs text-zinc-600 mt-3">{t('report.ipNote')}</p>
        </form>
      </div>
    </div>
  );
}
