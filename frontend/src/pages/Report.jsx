import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';

const REASONS = ['가격 오류', '사칭 의심', '이상한 링크', '상품 정보 오류', '악성 페이지 의심', '기타'];

export default function Report() {
  const { id } = useParams();
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!reason) return setError('신고 유형을 선택해주세요.');
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
          <h2 className="text-xl font-bold text-zinc-100 mb-2">신고 접수 완료</h2>
          <p className="text-zinc-400 mb-2">신고가 접수되었습니다. 관리자가 검토합니다.</p>
          {done.autoFlagged && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 mb-4 text-red-400 text-sm">
              ⚠️ 신고 누적 3회로 자동 비활성화 및 관리자 알림이 발송되었습니다.
            </div>
          )}
          <p className="text-sm text-zinc-500 mb-6">이 상품의 누적 신고 수: {done.reportCount}건</p>
          <Link to="/" className="btn-primary inline-block">홈으로</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link to={`/product/${id}`} className="text-zinc-500 hover:text-zinc-300 text-sm">← QR 페이지로</Link>
        </div>
        <form onSubmit={handleSubmit} className="card">
          <h1 className="text-xl font-bold text-zinc-100 mb-1">상품 신고</h1>
          <p className="text-sm text-zinc-500 mb-6">상품 ID: {id}</p>

          {error && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 mb-4 text-red-400 text-sm">{error}</div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-400 mb-2">신고 유형 *</label>
            <div className="grid grid-cols-2 gap-2">
              {REASONS.map(r => (
                <button
                  key={r} type="button"
                  onClick={() => setReason(r)}
                  className={`px-3 py-2 rounded-lg text-sm border transition-colors ${reason === r ? 'bg-red-900/40 border-red-600 text-red-400' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">상세 내용 (선택)</label>
            <textarea
              className="input min-h-24 resize-none"
              value={detail}
              onChange={e => setDetail(e.target.value)}
              placeholder="의심스러운 점을 자세히 설명해주세요."
            />
          </div>

          <button type="submit" disabled={loading} className="btn-danger w-full py-2.5">
            {loading ? '신고 중...' : '신고 접수'}
          </button>
          <p className="text-center text-xs text-zinc-600 mt-3">IP 주소가 신고 기록에 저장됩니다.</p>
        </form>
      </div>
    </div>
  );
}
