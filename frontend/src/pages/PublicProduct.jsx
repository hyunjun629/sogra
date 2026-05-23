import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { api } from '../api';
import { SkeletonProductVerify } from '../components/Skeleton';
import { loc } from '../utils/locale';

export default function PublicProduct() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.slice(0, 2) || 'ko';
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPublicProduct(id, token)
      .then(d => setResult(d))
      .catch(() => setResult({ status: 'danger', message: t('publicProduct.serverError') }))
      .finally(() => setLoading(false));
  }, [id, token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <div className="text-center mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
              className="inline-block text-3xl mb-2"
            >
              🔍
            </motion.div>
            <p className="text-zinc-500 text-sm">{t('publicProduct.verifying')}</p>
          </div>
          <SkeletonProductVerify />
        </div>
      </div>
    );
  }

  const { status, message, product } = result || {};

  if (status === 'danger') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          className="max-w-md w-full"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="card border-red-700/50 text-center py-10">
            <motion.div
              className="text-6xl mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
            >
              🚨
            </motion.div>
            <div className="badge-danger inline-block mb-4 text-base px-4 py-2">{t('publicProduct.dangerBadge')}</div>
            <h2 className="text-xl font-bold text-red-400 mb-3">{t('publicProduct.dangerTitle')}</h2>
            <p className="text-zinc-400 mb-2">{message}</p>
            <p className="text-zinc-500 text-sm mb-8">{t('publicProduct.dangerWarning')}</p>
            <div className="bg-red-950/30 border border-red-800/50 rounded-xl p-4 mb-6">
              <p className="text-red-400 text-sm font-semibold">{t('publicProduct.dangerSecurityTitle')}</p>
              <p className="text-red-300/70 text-xs mt-1">{t('publicProduct.dangerSecurityNote')}</p>
            </div>
            <Link to="/" className="btn-ghost inline-block">{t('publicProduct.goHome')}</Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (status === 'warning') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          className="max-w-lg w-full"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="card border-amber-700/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-4xl">⚠️</div>
              <div>
                <div className="badge-warning inline-block mb-1">{t('publicProduct.warningBadge')}</div>
                <p className="text-sm text-zinc-400">{message}</p>
              </div>
            </div>
            {product && <ProductDetails product={product} t={t} lang={lang} />}
            <div className="mt-4 border-t border-zinc-800 pt-4">
              <Link to={`/product/${id}/report`} className="text-amber-400 text-sm hover:underline">{t('publicProduct.reportLink')}</Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        className="max-w-lg w-full"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="card border-emerald-700/50">
          <div className="flex items-center gap-3 mb-6">
            <motion.div
              className="text-4xl"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            >
              ✅
            </motion.div>
            <div>
              <div className="badge-safe inline-block mb-1">{t('publicProduct.successBadge')}</div>
              <p className="text-sm text-zinc-400">{t('publicProduct.successSubtitle')}</p>
            </div>
          </div>
          {product && <ProductDetails product={product} t={t} lang={lang} />}
          <div className="mt-6 border-t border-zinc-800 pt-4 flex gap-3">
            <Link to={`/product/${id}/report`} className="text-zinc-500 text-sm hover:text-zinc-400">{t('publicProduct.reportLink')}</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ProductDetails({ product, t, lang }) {
  const qrUrl = `http://localhost:5173/product/${product.id}?token=${product.qr_token}`;
  return (
    <div>
      {product.image_url && (
        <img src={product.image_url} alt={product.name} className="w-full h-56 object-cover rounded-xl mb-4" onError={e => e.target.style.display='none'} />
      )}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-zinc-100 mb-1">{loc(product, 'name', lang)}</h1>
        <p className="text-2xl font-bold text-indigo-400 mb-2">{product.price.toLocaleString()}{t('common.priceUnit')}</p>
        <p className="text-sm text-zinc-400 mb-1">📍 {product.store_name} — {product.store_region}</p>
        {product.origin && <p className="text-sm text-zinc-500">🌾 {t('publicProduct.originLabel')}: {loc(product, 'origin', lang)}</p>}
        {product.allergy && <p className="text-sm text-zinc-500">⚠️ {t('publicProduct.allergyLabel')}: {loc(product, 'allergy', lang)}</p>}
      </div>
      {product.description && (
        <p className="text-sm text-zinc-400 bg-zinc-800 rounded-lg p-3 mb-4">{loc(product, 'description', lang)}</p>
      )}
      {product.ai_promo_text && (
        <div className="bg-indigo-950/30 border border-indigo-800/30 rounded-xl p-3 mb-4">
          <p className="text-xs text-indigo-400 mb-1">{t('publicProduct.aiPromoLabel')}</p>
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
