import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../api';

export default function PublicProduct() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPublicProduct(id, token)
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

  const { status, message, product } = result || {};

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

  if (status === 'warning') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-lg w-full">
          <div className="card border-amber-700/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-4xl">⚠️</div>
              <div>
                <div className="badge-warning inline-block mb-1">주의 — 승인 대기 중</div>
                <p className="text-sm text-zinc-400">{message}</p>
              </div>
            </div>
            {product && <ProductDetails product={product} />}
            <div className="mt-4 border-t border-zinc-800 pt-4">
              <Link to={`/product/${id}/report`} className="text-amber-400 text-sm hover:underline">신고하기</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="card border-emerald-700/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="text-4xl">✅</div>
            <div>
              <div className="badge-safe inline-block mb-1">공식 인증 QR</div>
              <p className="text-sm text-zinc-400">공식 인증된 대충실드 QR 페이지입니다</p>
            </div>
          </div>
          {product && <ProductDetails product={product} />}
          <div className="mt-6 border-t border-zinc-800 pt-4 flex gap-3">
            <Link to={`/product/${id}/report`} className="text-zinc-500 text-sm hover:text-zinc-400">신고하기</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductDetails({ product }) {
  const qrUrl = `http://localhost:5173/product/${product.id}?token=${product.qr_token}`;
  return (
    <div>
      {product.image_url && (
        <img src={product.image_url} alt={product.name} className="w-full h-56 object-cover rounded-xl mb-4" onError={e => e.target.style.display='none'} />
      )}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-zinc-100 mb-1">{product.name}</h1>
        <p className="text-2xl font-bold text-indigo-400 mb-2">{product.price.toLocaleString()}원</p>
        <p className="text-sm text-zinc-400 mb-1">📍 {product.store_name} — {product.store_region}</p>
        {product.origin && <p className="text-sm text-zinc-500">🌾 원산지: {product.origin}</p>}
        {product.allergy && <p className="text-sm text-zinc-500">⚠️ 알레르기: {product.allergy}</p>}
      </div>
      {product.description && (
        <p className="text-sm text-zinc-400 bg-zinc-800 rounded-lg p-3 mb-4">{product.description}</p>
      )}
      {product.ai_promo_text && (
        <div className="bg-indigo-950/30 border border-indigo-800/30 rounded-xl p-3 mb-4">
          <p className="text-xs text-indigo-400 mb-1">🤖 AI 홍보 문구</p>
          <p className="text-sm text-zinc-300 whitespace-pre-line">{product.ai_promo_text}</p>
        </div>
      )}
      <div className="flex justify-center mt-4">
        <div className="bg-white p-3 rounded-xl">
          <QRCodeSVG value={qrUrl} size={120} />
        </div>
      </div>
    </div>
  );
}
