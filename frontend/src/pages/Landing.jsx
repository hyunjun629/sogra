import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import MapKorea from '../components/MapKorea';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.45, delay, ease: 'easeOut' },
});

export default function Landing() {
  const [stats, setStats] = useState({ stores: 0, products: 0 });
  const [storeCounts, setStoreCounts] = useState({});

  useEffect(() => {
    fetch('/api/admin/stats', {
      headers: { Authorization: `Bearer ${localStorage.getItem('ls_token')}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) setStats({ stores: d.totalStores, products: d.totalProducts });
      })
      .catch(() => {});

    fetch('/api/admin/stores', {
      headers: { Authorization: `Bearer ${localStorage.getItem('ls_token')}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.stores) {
          const counts = {};
          d.stores.forEach(s => { counts[s.region] = (counts[s.region] || 0) + 1; });
          setStoreCounts(counts);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative px-4 py-24 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/30 to-transparent pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 bg-indigo-950/50 border border-indigo-700/50 rounded-full px-4 py-2 text-indigo-400 text-sm mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            HMAC SHA-256 기반 공식 인증 시스템
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl font-bold text-zinc-100 mb-6 leading-tight"
          >
            공식 인증 QR로<br />
            <span className="text-indigo-400">지키는 로컬마켓 신뢰</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto"
          >
            대전·충청 소상공인이 상품을 등록하면 위조 불가능한 HMAC 서명 QR이 자동 생성됩니다.
            고객은 QR 한 번으로 정품 여부를 확인하고, 관리자는 실시간으로 사이버 공격을 탐지합니다.
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex justify-center gap-8 mb-12"
          >
            {[
              { value: stats.stores || 3, label: '등록 상점', color: 'text-indigo-400' },
              null,
              { value: stats.products || 5, label: '인증 상품', color: 'text-emerald-400' },
              null,
              { value: '5종', label: '보안 방어', color: 'text-amber-400' },
            ].map((item, i) =>
              item === null ? (
                <div key={i} className="w-px bg-zinc-800" />
              ) : (
                <div key={i} className="text-center">
                  <div className={`text-3xl font-bold ${item.color}`}>{item.value}</div>
                  <div className="text-sm text-zinc-500">{item.label}</div>
                </div>
              )
            )}
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link to="/register" className="btn-primary text-lg py-3 px-8 text-center block">
                🏪 상인으로 시작하기
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link to="/product/1?token=demo" className="btn-ghost text-lg py-3 px-8 text-center block">
                📱 샘플 QR 페이지 보기
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link to="/admin" className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-lg py-3 px-8 rounded-lg transition-colors text-center block">
                🛡️ 관리자 대시보드
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16 max-w-6xl mx-auto">
        <motion.h2 {...fadeUp()} className="text-2xl font-bold text-center text-zinc-100 mb-12">
          4가지 핵심 보안 기능
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: '🔐', title: 'HMAC QR 인증', desc: 'SHA-256 서명으로 위조 불가능한 공식 QR 자동 발급' },
            { icon: '🔍', title: '3단계 QR 검증', desc: '정상·주의·위험 즉시 판별. 위조 QR은 아무것도 노출 안 함' },
            { icon: '📊', title: '실시간 보안 관제', desc: 'SQLi·XSS·BruteForce·IDOR·위조QR 5종 실시간 탐지' },
            { icon: '🎯', title: '원클릭 시연 모드', desc: '발표 중 버튼 하나로 5종 공격 자동 재생 및 탐지 확인' },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              className="card text-center"
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="font-bold text-zinc-100 mb-2">{f.title}</h3>
              <p className="text-sm text-zinc-400">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Map */}
      <section className="px-4 py-16 max-w-4xl mx-auto">
        <motion.h2 {...fadeUp()} className="text-2xl font-bold text-center text-zinc-100 mb-4">
          서비스 지역
        </motion.h2>
        <motion.p {...fadeUp(0.1)} className="text-center text-zinc-500 mb-8">
          대전·세종·충남·충북 지역 소상공인을 위한 플랫폼
        </motion.p>
        <motion.div {...fadeUp(0.15)}>
          <MapKorea storeCounts={storeCounts} />
        </motion.div>
      </section>

      {/* Flow */}
      <section className="px-4 py-16 bg-zinc-900/50">
        <div className="max-w-4xl mx-auto">
          <motion.h2 {...fadeUp()} className="text-2xl font-bold text-center text-zinc-100 mb-12">
            이용 흐름
          </motion.h2>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
            {[
              { step: '1', role: '상인', action: '상품 등록', icon: '🏪' },
              null,
              { step: '2', role: '시스템', action: 'HMAC QR 자동 생성', icon: '🔐' },
              null,
              { step: '3', role: '고객', action: 'QR 스캔 → 검증', icon: '📱' },
              null,
              { step: '4', role: '관리자', action: '실시간 관제', icon: '🛡️' },
            ].map((item, i) =>
              item === null ? (
                <div key={i} className="text-2xl text-zinc-600 hidden md:block">→</div>
              ) : (
                <motion.div
                  key={i}
                  className="card text-center min-w-32"
                  initial={{ opacity: 0, scale: 0.85 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: (i / 2) * 0.1 }}
                  whileHover={{ scale: 1.05, transition: { duration: 0.15 } }}
                >
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <div className="text-xs text-zinc-500 mb-1">{item.role}</div>
                  <div className="text-sm font-semibold text-zinc-200">{item.action}</div>
                </motion.div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-4 py-8 text-center text-zinc-600 text-sm">
        <p>🛡️ 대충실드 QR — 대전·충청 소상공인 공식 인증 플랫폼 | 해커톤 2025</p>
        <p className="mt-1">
          <Link to="/demo/attacker" className="text-zinc-500 hover:text-zinc-400">공격자 시점 보기</Link>
        </p>
      </footer>
    </div>
  );
}
