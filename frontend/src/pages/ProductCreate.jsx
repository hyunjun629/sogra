import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { api } from '../api';

export default function ProductCreate() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [stores, setStores] = useState([]);
  const [showCreateStore, setShowCreateStore] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [storeRegion, setStoreRegion] = useState('대전');
  const [storeLocation, setStoreLocation] = useState('');
  const [form, setForm] = useState({ store_id: '', name: '', price: '', description: '', origin: '', allergy: '', image_url: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null);

  const REGIONS = [
    { value: '대전', labelKey: 'productCreate.regionDaejeon' },
    { value: '세종', labelKey: 'productCreate.regionSejong' },
    { value: '충남', labelKey: 'productCreate.regionChungnam' },
    { value: '충북', labelKey: 'productCreate.regionChungbuk' },
  ];

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
          <h2 className="text-2xl font-bold text-zinc-100 mb-2">{t('productCreate.successTitle')}</h2>
          <p className="text-zinc-500 mb-6">{t('productCreate.successSubtitle')}</p>
          <div className="flex justify-center mb-6">
            <div className="bg-white p-4 rounded-xl">
              <QRCodeSVG value={created.qr_url} size={200} />
            </div>
          </div>
          <p className="font-semibold text-zinc-100 text-lg mb-1">{created.name}</p>
          <p className="text-indigo-400 font-bold mb-4">{Number(created.price).toLocaleString()}{t('common.priceUnit')}</p>
          {created.ai_promo_text && (
            <div className="bg-zinc-800 rounded-xl p-4 mb-4 text-left">
              <p className="text-xs text-zinc-500 mb-2">{t('productCreate.aiPromoLabel')}</p>
              <p className="text-sm text-zinc-300 whitespace-pre-line">{created.ai_promo_text}</p>
            </div>
          )}
          <div className="bg-zinc-800 rounded-xl p-4 mb-6 text-left">
            <p className="text-xs text-zinc-500 mb-1">{t('productCreate.qrLinkLabel')}</p>
            <p className="text-xs font-mono text-zinc-300 break-all">{created.qr_url}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <a href={created.qr_url} target="_blank" rel="noopener noreferrer" className="btn-primary">{t('productCreate.viewQr')}</a>
            <button onClick={() => navigate('/merchant')} className="btn-ghost">{t('productCreate.goToDashboard')}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100">{t('productCreate.title')}</h1>
        <p className="text-zinc-500 text-sm mt-1">{t('productCreate.subtitle')}</p>
      </div>

      {/* Store creation */}
      {showCreateStore && (
        <div className="card mb-6 border-amber-700/50">
          <h3 className="font-semibold text-amber-400 mb-4">{t('productCreate.noStoreWarn')}</h3>
          <form onSubmit={handleCreateStore}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">{t('productCreate.storeName')}</label>
                <input className="input" value={storeName} onChange={e => setStoreName(e.target.value)} placeholder={t('productCreate.storeNamePlaceholder')} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">{t('productCreate.storeRegion')}</label>
                <select className="input" value={storeRegion} onChange={e => setStoreRegion(e.target.value)}>
                  {REGIONS.map(r => <option key={r.value} value={r.value}>{t(r.labelKey)}</option>)}
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">{t('productCreate.storeLocation')}</label>
              <input className="input" value={storeLocation} onChange={e => setStoreLocation(e.target.value)} placeholder={t('productCreate.storeLocationPlaceholder')} />
            </div>
            <button type="submit" className="btn-primary">{t('productCreate.createStore')}</button>
          </form>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card">
        {error && (
          <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3 mb-4 text-red-400 text-sm">{error}</div>
        )}

        {stores.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">{t('productCreate.storeLabel')}</label>
            <select className="input" value={form.store_id} onChange={e => setForm(f => ({ ...f, store_id: e.target.value }))}>
              {stores.map(s => <option key={s.id} value={s.id}>{s.name} ({s.region})</option>)}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">{t('productCreate.productName')}</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={t('productCreate.productNamePlaceholder')} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">{t('productCreate.price')}</label>
            <input type="number" className="input" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="2500" required min="0" />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-zinc-400 mb-1.5">{t('productCreate.description')}</label>
          <textarea className="input min-h-24 resize-none" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder={t('productCreate.descriptionPlaceholder')} />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">{t('productCreate.origin')}</label>
            <input className="input" value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value }))} placeholder={t('productCreate.originPlaceholder')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">{t('productCreate.allergy')}</label>
            <input className="input" value={form.allergy} onChange={e => setForm(f => ({ ...f, allergy: e.target.value }))} placeholder={t('productCreate.allergyPlaceholder')} />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-400 mb-1.5">{t('productCreate.imageUrl')}</label>
          <input className="input" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://example.com/image.jpg" />
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading || !form.store_id} className="btn-primary flex-1 py-2.5">
            {loading ? t('productCreate.loading') : t('productCreate.submit')}
          </button>
          <button type="button" onClick={() => navigate('/merchant')} className="btn-ghost px-6">{t('productCreate.cancel')}</button>
        </div>
      </form>
    </div>
  );
}
