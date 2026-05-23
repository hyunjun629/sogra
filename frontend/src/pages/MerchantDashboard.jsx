import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../api';
import { getUser } from '../auth';

export default function MerchantDashboard() {
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStoreQr, setSelectedStoreQr] = useState(null);
  const [toast, setToast] = useState('');
  const user = getUser();

  useEffect(() => {
    Promise.all([api.getMyProducts(), api.getMyStores()])
      .then(([pd, sd]) => {
        setProducts(pd.products || []);
        setStores(sd.stores || []);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id) {
    if (!confirm('상품을 비활성화 하시겠습니까?')) return;
    await api.deleteProduct(id);
    setProducts(prev => prev.filter(p => p.id !== id));
    showToast('상품이 비활성화되었습니다.');
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  const statusBadge = (status) => ({
    approved: <span className="badge-safe">승인됨</span>,
    pending: <span className="badge-warning">승인 대기</span>,
    flagged: <span className="badge-danger">신고됨</span>,
  }[status] || null);

  if (loading) return <div className="flex justify-center items-center min-h-64 text-zinc-500">로딩 중...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {toast && (
        <div className="fixed top-20 right-4 bg-emerald-800 text-emerald-200 px-4 py-2 rounded-lg shadow-lg z-50 animate-slide-in">
          ✅ {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">내 상점 대시보드</h1>
          <p className="text-zinc-500 text-sm mt-1">{user?.email}</p>
        </div>
        <Link to="/merchant/products/new" className="btn-primary">+ 상품 등록</Link>
      </div>

      {/* Stores */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-zinc-300 mb-4">내 상점</h2>
        {stores.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-zinc-500 mb-4">등록된 상점이 없습니다. 상품을 등록하면 상점을 만들 수 있습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stores.map(s => (
              <div key={s.id} className="card">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-zinc-100">{s.name}</h3>
                    <p className="text-sm text-zinc-500 mt-1">{s.region} · {s.location}</p>
                  </div>
                  {statusBadge(s.status)}
                </div>
                {s.store_qr_url ? (
                  <button
                    onClick={() => setSelectedStoreQr(s)}
                    className="btn-primary text-sm py-1.5 w-full"
                  >📱 상점 QR 보기</button>
                ) : (
                  <p className="text-xs text-zinc-600">QR 생성 중...</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Products */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-300 mb-4">내 상품 ({products.length})</h2>
        {products.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-zinc-500 mb-4">등록된 상품이 없습니다.</p>
            <Link to="/merchant/products/new" className="btn-primary">첫 상품 등록하기</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(p => (
              <div key={p.id} className="card">
                {p.image_url && (
                  <img src={p.image_url} alt={p.name} className="w-full h-40 object-cover rounded-xl mb-4" onError={e => e.target.style.display='none'} />
                )}
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-zinc-100">{p.name}</h3>
                  {statusBadge(p.store_status)}
                </div>
                <p className="text-indigo-400 font-bold mb-1">{p.price.toLocaleString()}원</p>
                <p className="text-xs text-zinc-500 mb-3">{p.store_name} · {p.region}</p>
                {p.ai_promo_text && (
                  <p className="text-xs text-zinc-400 bg-zinc-800 rounded-lg p-2 mb-3 whitespace-pre-line">{p.ai_promo_text}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="btn-danger text-sm py-1.5 w-full"
                  >삭제</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Store QR Modal */}
      {selectedStoreQr && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedStoreQr(null)}>
          <div className="card max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-zinc-100">상점 공식 인증 QR</h3>
              <button onClick={() => setSelectedStoreQr(null)} className="text-zinc-500 hover:text-zinc-300 text-xl">✕</button>
            </div>
            <div className="flex justify-center mb-4">
              <div className="bg-white p-4 rounded-xl">
                <QRCodeSVG value={selectedStoreQr.store_qr_url} size={180} />
              </div>
            </div>
            <p className="text-center font-semibold text-zinc-200 mb-1">{selectedStoreQr.name}</p>
            <p className="text-center text-sm text-zinc-500 mb-3">{selectedStoreQr.region} · {selectedStoreQr.location}</p>
            <div className="bg-zinc-800 rounded-lg p-3 mb-4">
              <p className="text-xs text-zinc-500 mb-1">QR 링크</p>
              <p className="text-xs font-mono text-zinc-300 break-all">{selectedStoreQr.store_qr_url}</p>
            </div>
            <div className="flex gap-2">
              <a href={selectedStoreQr.store_qr_url} target="_blank" rel="noopener noreferrer" className="btn-primary text-sm py-2 flex-1 text-center">
                페이지 열기
              </a>
              <button
                onClick={() => { navigator.clipboard.writeText(selectedStoreQr.store_qr_url); showToast('링크 복사됨'); }}
                className="btn-ghost text-sm py-2 px-4"
              >복사</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
