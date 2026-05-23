import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { api } from '../api';

export default function PublicStore() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPublicStore(id, token)
      .then(d => setResult(d))
      .catch(() => setResult({ status: 'danger', message: '서버 오류가 발생했습니다.' }))
      .finally(() => setLoading(false));
  }, [id, token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-zinc-500 text-lg">🔍 QR 검증 중...</div>
      </div>
    );
  }

  const { status, message, store, products = [] } = result || {};

  if (status === 'danger') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="card border-red-700/50 text-center py-10">
            <div className="text-6xl mb-6">🚨</div>
            <div className="badge-danger inline-block mb-4 text-base px-4 py-2">위험 — QR 검증 실패</div>
            <h2 className="text-xl font-bold text-red-400 mb-3">존재하지 않거나 위조 가능성이 있는 QR입니다</h2>
            <p className="text-zinc-400 mb-2">{message}</p>
            <p className="text-zinc-500 text-sm mb-8">이 링크는 공식 대충실드 QR이 아닐 수 있습니다. 결제하거나 개인정보를 입력하지 마십시오.</p>
            <div className="bg-red-950/30 border border-red-800/50 rounded-xl p-4 mb-6">
              <p className="text-red-400 text-sm font-semibold">⚠️ 보안 경고</p>
              <p className="text-red-300/70 text-xs mt-1">이 페이지 접근이 보안 로그에 기록되었습니다.</p>
            </div>
            <Link to="/" className="btn-ghost inline-block">홈으로 돌아가기</Link>
          </div>
        </div>
      </div>
    );
  }

  const statusBorder = status === 'safe' ? 'border-emerald-700/50' : 'border-amber-700/50';
  const statusIcon = status === 'safe' ? '✅' : '⚠️';
  const statusBadge = status === 'safe'
    ? <span className="badge-safe">공식 인증 QR</span>
    : <span className="badge-warning">주의 — 승인 대기 중</span>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* 상태 헤더 */}
      <div className={`card ${statusBorder} mb-6`}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">{statusIcon}</span>
          <div>
            {statusBadge}
            <p className="text-sm text-zinc-400 mt-1">{message}</p>
          </div>
        </div>
      </div>

      {store && (
        <>
          {/* 상점 정보 */}
          <div className="card mb-6">
            <h1 className="text-2xl font-bold text-zinc-100 mb-1">{store.name}</h1>
            <p className="text-sm text-zinc-400">
              📍 {store.region}
              {store.location && ` · ${store.location}`}
            </p>
          </div>

          {/* 상품 목록 */}
          <h2 className="text-lg font-semibold text-zinc-300 mb-4">
            상품 목록 <span className="text-zinc-500 text-sm font-normal">({products.length}개)</span>
          </h2>

          {products.length === 0 ? (
            <div className="card text-center py-10 text-zinc-500">
              등록된 상품이 없습니다.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {products.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ProductCard({ product: p }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="card">
      <div className="flex gap-4">
        {p.image_url && (
          <img
            src={p.image_url}
            alt={p.name}
            className="w-24 h-24 object-cover rounded-xl flex-shrink-0"
            onError={e => e.target.style.display = 'none'}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-semibold text-zinc-100 text-lg leading-tight">{p.name}</h3>
            <span className="text-indigo-400 font-bold whitespace-nowrap">{p.price.toLocaleString()}원</span>
          </div>
          {p.origin && (
            <p className="text-sm text-zinc-500 mt-1">🌾 원산지: {p.origin}</p>
          )}
          {p.allergy && (
            <p className="text-sm text-amber-500/80 mt-0.5">⚠️ 알레르기: {p.allergy}</p>
          )}
          <button
            onClick={() => setOpen(v => !v)}
            className="text-xs text-zinc-500 hover:text-zinc-300 mt-2 underline underline-offset-2"
          >
            {open ? '접기' : '상세 보기'}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-4 pt-4 border-t border-zinc-800">
          {p.description && (
            <p className="text-sm text-zinc-400 bg-zinc-800 rounded-lg p-3 mb-3">{p.description}</p>
          )}
          {p.ai_promo_text && (
            <div className="bg-indigo-950/30 border border-indigo-800/30 rounded-xl p-3">
              <p className="text-xs text-indigo-400 mb-1">🤖 AI 홍보 문구</p>
              <p className="text-sm text-zinc-300 whitespace-pre-line">{p.ai_promo_text}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
