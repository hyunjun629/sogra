import React, { useEffect, useState, useRef, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import LogTable from '../components/LogTable';
import AttackButton from '../components/AttackButton';
import { api } from '../api';

const ATTACK_COLORS = {
  SQLI_ATTEMPT: '#f97316',
  BRUTE_FORCE_LOCK: '#eab308',
  XSS_ATTEMPT: '#ef4444',
  IDOR_ATTEMPT: '#8b5cf6',
  FAKE_QR_ACCESS: '#06b6d4',
  LOGIN_FAIL: '#6b7280',
  UNAUTHORIZED_ACCESS: '#ec4899',
};

const ATTACK_DEMOS = [
  { key: 'sqli', icon: '🗡️', label: 'SQL Injection 시연', description: "admin' OR '1'='1 -- 로그인 차단", fn: () => api.demoSqli() },
  { key: 'bruteforce', icon: '🔨', label: 'BruteForce 시연', description: '5회 연속 로그인 실패 → 계정 잠금', fn: () => api.demoBruteforce() },
  { key: 'xss', icon: '💀', label: 'XSS 시연', description: '<script>alert("hack")</script> 정제 차단', fn: () => api.demoXss() },
  { key: 'idor', icon: '🚪', label: 'IDOR 시연', description: '타인 상품 수정 시도 → 403 차단', fn: () => api.demoIdor() },
  { key: 'fakeqr', icon: '🎭', label: '위조 QR 시연', description: 'FAKE_TOKEN_12345 → 위험 페이지', fn: () => api.demoFakeQr() },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [newLogIds, setNewLogIds] = useState(new Set());
  const [stores, setStores] = useState([]);
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [attackStatus, setAttackStatus] = useState({});
  const [autoRunning, setAutoRunning] = useState(false);
  const [autoProgress, setAutoProgress] = useState(0);
  const [toast, setToast] = useState('');
  const [resetConfirm, setResetConfirm] = useState(false);
  const [criticalAlert, setCriticalAlert] = useState(false);
  const lastLogTime = useRef(0);
  const pollingRef = useRef(null);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  }

  const fetchStats = useCallback(async () => {
    try {
      const d = await api.getStats();
      setStats(d);
      if (d.criticalLogs > 0) setCriticalAlert(true);
    } catch {}
  }, []);

  const pollLogs = useCallback(async () => {
    try {
      const since = lastLogTime.current;
      const d = await api.getRecentLogs(since);
      if (d.logs && d.logs.length > 0) {
        const freshIds = new Set(d.logs.filter(l => l.created_at > since).map(l => l.id));
        setLogs(prev => {
          const existing = new Set(prev.map(l => l.id));
          const newOnes = d.logs.filter(l => !existing.has(l.id));
          if (newOnes.length > 0) {
            setNewLogIds(freshIds);
            setTimeout(() => setNewLogIds(new Set()), 2000);
            return [...newOnes, ...prev].slice(0, 100);
          }
          return prev;
        });
        lastLogTime.current = Math.max(...d.logs.map(l => l.created_at));
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchStats();
    // Load all logs initially
    api.getLogs().then(d => {
      if (d.logs?.length) {
        setLogs(d.logs);
        lastLogTime.current = Math.max(...d.logs.map(l => l.created_at));
      }
    }).catch(() => {});
    api.getAdminStores().then(d => setStores(d.stores || [])).catch(() => {});
    api.getAdminReports().then(d => setReports(d.reports || [])).catch(() => {});

    pollingRef.current = setInterval(() => {
      pollLogs();
      fetchStats();
    }, 3000);
    return () => clearInterval(pollingRef.current);
  }, [fetchStats, pollLogs]);

  async function runAttack(key, fn) {
    setAttackStatus(s => ({ ...s, [key]: 'running' }));
    try {
      await fn();
      setAttackStatus(s => ({ ...s, [key]: 'success' }));
      setTimeout(() => pollLogs(), 500);
    } catch {
      setAttackStatus(s => ({ ...s, [key]: 'error' }));
    }
    setTimeout(() => setAttackStatus(s => ({ ...s, [key]: 'idle' })), 5000);
  }

  async function runAllAttacks() {
    setAutoRunning(true);
    setAutoProgress(0);
    for (let i = 0; i < ATTACK_DEMOS.length; i++) {
      const a = ATTACK_DEMOS[i];
      await runAttack(a.key, a.fn);
      setAutoProgress(i + 1);
      if (i < ATTACK_DEMOS.length - 1) await new Promise(r => setTimeout(r, 2500));
    }
    setAutoRunning(false);
    showToast('✅ 5종 공격 시도 모두 탐지·차단 완료');
  }

  async function handleReset() {
    try {
      await api.resetDemo();
      setResetConfirm(false);
      // Refresh everything
      const [sd, ld, rd, st] = await Promise.all([
        api.getAdminStores(), api.getLogs(), api.getAdminReports(), api.getStats()
      ]);
      setStores(sd.stores || []);
      setLogs(ld.logs || []);
      setReports(rd.reports || []);
      setStats(st);
      if (ld.logs?.length) lastLogTime.current = Math.max(...ld.logs.map(l => l.created_at));
      showToast('✅ 데모 데이터가 초기 상태로 복원되었습니다.');
    } catch (e) {
      showToast('❌ 리셋 실패: ' + e.message);
    }
  }

  async function handleStoreStatus(id, status) {
    await api.updateStoreStatus(id, status);
    setStores(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    showToast(`상점 상태가 '${status}'로 변경되었습니다.`);
  }

  const logsByType = stats?.logsByType || [];
  const chartData = logsByType.map(l => ({ name: l.event_type.replace('_', ' '), count: l.cnt }));

  const pieData = logsByType.map(l => ({ name: l.event_type, value: l.cnt }));
  const pieColors = logsByType.map(l => ATTACK_COLORS[l.event_type] || '#6b7280');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-4 bg-zinc-800 text-zinc-100 px-5 py-3 rounded-xl shadow-xl z-50 border border-zinc-700 animate-slide-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            🛡️ 보안 관제 대시보드
            {criticalAlert && <span className="pulse-ring text-xs bg-red-700 text-red-100 px-2 py-0.5 rounded-full">🚨 위협 탐지</span>}
          </h1>
          <p className="text-zinc-500 text-sm mt-1">실시간 3초 폴링 · 5종 보안 위협 모니터링</p>
        </div>
        <button onClick={() => setResetConfirm(true)} className="btn-ghost text-sm">🔄 데모 리셋</button>
      </div>

      {/* Reset confirm modal */}
      {resetConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="card max-w-sm w-full">
            <h3 className="font-bold text-zinc-100 mb-2">데모 데이터 리셋</h3>
            <p className="text-zinc-400 text-sm mb-6">모든 보안 로그와 신고 내역이 초기화되고, 시드 데이터로 복원됩니다. 계속하시겠습니까?</p>
            <div className="flex gap-3">
              <button onClick={handleReset} className="btn-danger flex-1">리셋 실행</button>
              <button onClick={() => setResetConfirm(false)} className="btn-ghost flex-1">취소</button>
            </div>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: '등록 상인', value: stats?.totalUsers ?? '—', icon: '👤', color: 'indigo' },
          { label: '등록 상점', value: stats?.totalStores ?? '—', icon: '🏪', color: 'emerald' },
          { label: '활성 상품', value: stats?.totalProducts ?? '—', icon: '📦', color: 'cyan' },
          { label: '24h 위협', value: stats?.criticalLogs ?? '—', icon: '🚨', color: 'red' },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className={`text-3xl font-bold mb-1 ${s.color === 'red' && (stats?.criticalLogs > 0) ? 'text-red-400' : s.color === 'indigo' ? 'text-indigo-400' : s.color === 'emerald' ? 'text-emerald-400' : s.color === 'cyan' ? 'text-cyan-400' : 'text-zinc-100'}`}>
              {s.value}
            </div>
            <div className="text-xs text-zinc-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-zinc-900 rounded-xl p-1 border border-zinc-800 w-fit">
        {[
          { key: 'overview', label: '📊 개요' },
          { key: 'logs', label: '🔍 보안 로그' },
          { key: 'stores', label: '🏪 상점 관리' },
          { key: 'reports', label: '📋 신고 내역' },
          { key: 'demo', label: '🎬 보안 시연' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === t.key ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold text-zinc-300 mb-4">24시간 공격 유형별 탐지</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 10 }} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} labelStyle={{ color: '#d4d4d8' }} itemStyle={{ color: '#a1a1aa' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={ATTACK_COLORS[logsByType[i]?.event_type] || '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="font-semibold text-zinc-300 mb-4">공격 유형 분포</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name.split('_')[0]} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {pieData.map((_, i) => <Cell key={i} fill={pieColors[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-zinc-500">데이터 없음</div>
            )}
          </div>

          <div className="card lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-zinc-300">최근 보안 로그</h3>
              <span className="text-xs text-zinc-500 font-mono">3초마다 갱신</span>
            </div>
            <LogTable logs={logs.slice(0, 10)} newIds={newLogIds} />
          </div>
        </div>
      )}

      {/* Logs tab */}
      {activeTab === 'logs' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-zinc-300">전체 보안 로그 ({logs.length}건)</h3>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              실시간 모니터링 중
            </div>
          </div>
          <LogTable logs={logs} newIds={newLogIds} />
        </div>
      )}

      {/* Stores tab */}
      {activeTab === 'stores' && (
        <div className="card">
          <h3 className="font-semibold text-zinc-300 mb-4">상점 관리 ({stores.length}개)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase">
                  <th className="text-left py-2 pr-4">상점명</th>
                  <th className="text-left py-2 pr-4">소유자</th>
                  <th className="text-left py-2 pr-4">지역</th>
                  <th className="text-left py-2 pr-4">상품</th>
                  <th className="text-left py-2 pr-4">상태</th>
                  <th className="text-left py-2">액션</th>
                </tr>
              </thead>
              <tbody>
                {stores.map(s => (
                  <tr key={s.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="py-3 pr-4 font-medium text-zinc-200">{s.name}</td>
                    <td className="py-3 pr-4 text-zinc-500 text-xs">{s.owner_email}</td>
                    <td className="py-3 pr-4 text-zinc-400">{s.region}</td>
                    <td className="py-3 pr-4 text-zinc-400">{s.product_count}</td>
                    <td className="py-3 pr-4">
                      {s.status === 'approved' && <span className="badge-safe text-xs">승인</span>}
                      {s.status === 'pending' && <span className="badge-warning text-xs">대기</span>}
                      {s.status === 'flagged' && <span className="badge-danger text-xs">신고됨</span>}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-1">
                        {s.status !== 'approved' && (
                          <button onClick={() => handleStoreStatus(s.id, 'approved')} className="text-xs bg-emerald-900/50 text-emerald-400 px-2 py-1 rounded hover:bg-emerald-900">승인</button>
                        )}
                        {s.status !== 'pending' && (
                          <button onClick={() => handleStoreStatus(s.id, 'pending')} className="text-xs bg-amber-900/50 text-amber-400 px-2 py-1 rounded hover:bg-amber-900">대기</button>
                        )}
                        {s.status !== 'flagged' && (
                          <button onClick={() => handleStoreStatus(s.id, 'flagged')} className="text-xs bg-red-900/50 text-red-400 px-2 py-1 rounded hover:bg-red-900">신고</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reports tab */}
      {activeTab === 'reports' && (
        <div className="card">
          <h3 className="font-semibold text-zinc-300 mb-4">신고 내역 ({reports.length}건)</h3>
          {reports.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">신고 내역이 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase">
                    <th className="text-left py-2 pr-4">상품</th>
                    <th className="text-left py-2 pr-4">유형</th>
                    <th className="text-left py-2 pr-4">누적신고</th>
                    <th className="text-left py-2 pr-4">IP</th>
                    <th className="text-left py-2">시각</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map(r => (
                    <tr key={r.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                      <td className="py-3 pr-4 text-zinc-200">{r.product_name}</td>
                      <td className="py-3 pr-4 text-zinc-400">{r.reason}</td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs font-semibold ${r.report_count >= 3 ? 'text-red-400' : 'text-zinc-400'}`}>{r.report_count}건</span>
                      </td>
                      <td className="py-3 pr-4 text-zinc-500 font-mono text-xs">{r.reporter_ip}</td>
                      <td className="py-3 text-zinc-500 text-xs">{new Date(r.created_at).toLocaleString('ko-KR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Demo tab */}
      {activeTab === 'demo' && (
        <div>
          {/* Auto run */}
          <div className="card mb-6 border-indigo-700/50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-100">🎯 전체 보안 시연 자동 재생</h3>
                <p className="text-sm text-zinc-500">5종 공격이 2.5초 간격으로 순차 실행됩니다</p>
              </div>
              <button
                onClick={runAllAttacks}
                disabled={autoRunning}
                className={`px-6 py-3 rounded-xl font-bold text-lg transition-all ${autoRunning ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/50'}`}
              >
                {autoRunning ? `실행 중 ${autoProgress}/${ATTACK_DEMOS.length}` : '▶ 전체 시연 시작'}
              </button>
            </div>

            {autoRunning && (
              <div>
                <div className="flex justify-between text-sm text-zinc-400 mb-2">
                  <span>진행: {autoProgress}/{ATTACK_DEMOS.length}</span>
                  <span>{Math.round((autoProgress / ATTACK_DEMOS.length) * 100)}%</span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(autoProgress / ATTACK_DEMOS.length) * 100}%` }}
                  />
                </div>
                <div className="flex gap-2 mt-3">
                  {ATTACK_DEMOS.map((a, i) => (
                    <div
                      key={a.key}
                      className={`flex-1 h-1.5 rounded-full transition-colors ${i < autoProgress ? 'bg-emerald-500' : i === autoProgress && autoRunning ? 'bg-amber-500 animate-pulse' : 'bg-zinc-700'}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Individual attacks */}
          <div className="space-y-3 mb-6">
            <h3 className="font-semibold text-zinc-400 mb-3">개별 공격 시연</h3>
            {ATTACK_DEMOS.map(a => (
              <AttackButton
                key={a.key}
                icon={a.icon}
                label={a.label}
                description={a.description}
                status={attackStatus[a.key] || 'idle'}
                onClick={() => runAttack(a.key, a.fn)}
                disabled={autoRunning}
              />
            ))}
          </div>

          {/* Live log during demo */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-zinc-300">실시간 탐지 로그</h3>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                실시간
              </span>
            </div>
            <LogTable logs={logs.slice(0, 15)} newIds={newLogIds} />
          </div>

          {/* Manual demo tips */}
          <div className="card mt-6 border-zinc-700">
            <h4 className="font-semibold text-zinc-400 mb-3">📋 수동 시연 가이드</h4>
            <div className="space-y-2 text-sm font-mono">
              <div className="bg-zinc-800 rounded p-2">
                <span className="text-zinc-500">위조 QR:</span>{' '}
                <span className="text-cyan-400">http://localhost:5173/product/1?token=FAKE_TOKEN_12345</span>
              </div>
              <div className="bg-zinc-800 rounded p-2">
                <span className="text-zinc-500">SQLi:</span>{' '}
                <span className="text-orange-400">로그인 이메일에 admin' OR '1'='1 입력</span>
              </div>
              <div className="bg-zinc-800 rounded p-2">
                <span className="text-zinc-500">정상 QR:</span>{' '}
                <span className="text-emerald-400">merchant 로그인 → 상품 선택 → QR 보기</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
