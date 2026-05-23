import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../api';

const REGIONS = ['대전', '세종', '충남', '충북'];

export default function ProductCreate() {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [showCreateStore, setShowCreateStore] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [storeRegion, setStoreRegion] = useState('대전');
  const [storeLocation, setStoreLocation] = useState('');
  const [form, setForm] = useState({ store_id: '', name: '', price: '', description: '', origin: '', allergy: '', image_url: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null);

  useEffect(() => {
    api.getMyStores().then(d => {
      setStores(d.stores || []);
      if (d.stores?.length === 0) setShowCreateStore(true);
      else if (d.stores?.length > 0) setForm(f => ({ ...f, store_id: d.stores[0].id }));
    });
  }, []);

  async function handleCreateStore(e) {
    e.preventDefault();
    try {
      const d = await api.createStore({ name: storeName, region: storeRegion, location: storeLocation });
      setStores([d.store]);
      setForm(f => ({ ...f, store_id: d.store.id }));
      setShowCreateStore(false);
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const d = await api.createProduct(form);
      setCreated(d.product);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (created) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="card text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-zinc-100 mb-2">상품 등록 완료!</h2>
          <p className="text-zinc-500 mb-6">공식 HMAC QR이 자동 생성되었습니다.</p>
          <div className="flex justify-center mb-6">
            <div className="bg-white p-4 rounded-xl">
              <QRCodeSVG value={created.qr_url} size={200} />
            </div>
          </div>
          <p className="font-semibold text-zinc-100 text-lg mb-1">{created.name}</p>
          <p className="text-indigo-400 font-bold mb-4">{Number(created.price).toLocaleString()}원</p>
          {created.ai_promo_text && (
            <div className="bg-zinc-800 rounded-xl p-4 mb-4 text-left">
              <p className="text-xs text-zinc-500 mb-2">🤖 AI 홍보 문구 (자동 생성)</p>
              <p className="text-sm text-zinc-300 whitespace-pre-line">{created.ai_promo_text}</p>
            </div>
          )}
          <div className="bg-zinc-800 rounded-xl p-4 mb-6 text-left">
            <p className="text-xs text-zinc-500 mb-1">🔗 QR 링크</p>
            <p className="text-xs font-mono text-zinc-300 break-all">{created.qr_url}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <a href={created.qr_url} target="_blank" rel="noopener noreferrer" className="btn-primary">QR 페이지 확인</a>
            <button onClick={() => navigate('/merchant')} className="btn-ghost">대시보드로</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100">상품 등록</h1>
        <p className="text-zinc-500 text-sm mt-1">등록 즉시 HMAC 서명 QR이 자동 생성됩니다</p>
      </div>

      {/* Store creation */}
      {showCreateStore && (
        <div className="card mb-6 border-amber-700/50">
          <h3 className="font-semibold text-amber-400 mb-4">⚠️ 상점이 없습니다. 먼저 상점을 만들어주세요.</h3>
          <form onSubmit={handleCreateStore}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">상점명 *</label>
                <input className="input" value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="OO상회" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">지역 *</label>
                <select className="input" value={storeRegion} onChange={e => setStoreRegion(e.target.value)}>
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">위치</label>
              <input className="input" value={storeLocation} onChange={e => setStoreLocation(e.target.value)} placeholder="예: 대전 중앙시장 B동 12호" />
            </div>
            <button type="submit" className="btn-primary">상점 생성</button>
          </form>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card">
        {error && (
          <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 mb-4 text-red-400 text-sm">{error}</div>
        )}

        {stores.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">상점 *</label>
            <select className="input" value={form.store_id} onChange={e => setForm(f => ({ ...f, store_id: e.target.value }))}>
              {stores.map(s => <option key={s.id} value={s.id}>{s.name} ({s.region})</option>)}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">상품명 *</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="예: 성심당 튀김소보로" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">가격 (원) *</label>
            <input type="number" className="input" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="2500" required min="0" />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-400 mb-1.5">상품 설명</label>
          <textarea className="input min-h-24 resize-none" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="XSS 공격 시도 시 자동 탐지 및 정제됩니다." />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">원산지</label>
            <input className="input" value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value }))} placeholder="예: 대전 직접 생산" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">알레르기 정보</label>
            <input className="input" value={form.allergy} onChange={e => setForm(f => ({ ...f, allergy: e.target.value }))} placeholder="예: 밀, 우유" />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-400 mb-1.5">이미지 URL</label>
          <input className="input" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://example.com/image.jpg" />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading || !form.store_id} className="btn-primary flex-1 py-2.5">
            {loading ? '등록 중...' : '🔐 상품 등록 + QR 생성'}
          </button>
          <button type="button" onClick={() => navigate('/merchant')} className="btn-ghost px-6">취소</button>
        </div>
      </form>
    </div>
  );
}
