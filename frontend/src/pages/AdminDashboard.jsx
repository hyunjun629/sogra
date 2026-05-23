import React, { useEffect, useState, useRef, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import LogTable from '../components/LogTable';
import AttackButton from '../components/AttackButton';
import { SkeletonStatCard } from '../components/Skeleton';
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

export default function AdminDashboard() {
  const { t } = useTranslation();
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
  const [statsLoading, setStatsLoading] = useState(true);
  const lastLogTime = useRef(0);
  const pollingRef = useRef(null);

  const ATTACK_DEMOS = [
    { key: 'sqli', icon: '🗡️', label: t('admin.sqliLabel'), description: t('admin.sqliDesc'), fn: () => api.demoSqli() },
    { key: 'bruteforce', icon: '🔨', label: t('admin.bruteLabel'), description: t('admin.bruteDesc'), fn: () => api.demoBruteforce() },
    { key: 'xss', icon: '💀', label: t('admin.xssLabel'), description: t('admin.xssDesc'), fn: () => api.demoXss() },
    { key: 'idor', icon: '🚪', label: t('admin.idorLabel'), description: t('admin.idorDesc'), fn: () => api.demoIdor() },
    { key: 'fakeqr', icon: '🎭', label: t('admin.fakeqrLabel'), description: t('admin.fakeqrDesc'), fn: () => api.demoFakeQr() },
  ];

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  }

  const fetchStats = useCallback(async () => {
    try {
      const d = await api.getStats();
      setStats(d);
      setStatsLoading(false);
      if (d.criticalLogs > 0) setCriticalAlert(true);
    } catch {
      setStatsLoading(false);
    }
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
    showToast(t('admin.allDetected'));
  }

  async function handleReset() {
    try {
      await api.resetDemo();
      setResetConfirm(false);
      const [sd, ld, rd, st] = await Promise.all([
        api.getAdminStores(), api.getLogs(), api.getAdminReports(), api.getStats()
      ]);
      setStores(sd.stores || []);
      setLogs(ld.logs || []);
      setReports(rd.reports || []);
      setStats(st);
      if (ld.logs?.length) lastLogTime.current = Math.max(...ld.logs.map(l => l.created_at));
      showToast(t('admin.resetSuccess'));
    } catch (e) {
      showToast(t('admin.resetFail') + ' ' + e.message);
    }
  }

  async function handleStoreStatus(id, status) {
    await api.updateStoreStatus(id, status);
    setStores(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    showToast(t('admin.storeStatusChanged', { status }));
  }

  const logsByType = stats?.logsByType || [];
  const chartData = logsByType.map(l => ({ name: l.event_type.replace('_', ' '), count: l.cnt }));
  const pieData = logsByType.map(l => ({ name: l.event_type, value: l.cnt }));
  const pieColors = logsByType.map(l => ATTACK_COLORS[l.event_type] || '#6b7280');

  const TABS = [
    { key: 'overview', label: t('admin.tabOverview') },
    { key: 'logs', label: t('admin.tabLogs') },
    { key: 'stores', label: t('admin.tabStores') },
    { key: 'reports', label: t('admin.tabReports') },
    { key: 'demo', label: t('admin.tabDemo') },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed top-20 right-4 bg-zinc-800 text-zinc-100 px-5 py-3 rounded-xl shadow-xl z-50 border border-zinc-700"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            🛡️ {t('admin.title')}
            {criticalAlert && <span className="pulse-ring text-xs bg-red-700 text-red-100 px-2 py-0.5 rounded-full">{t('admin.threatDetected')}</span>}
          </h1>
          <p className="text-zinc-500 text-sm mt-1">{t('admin.subtitle')}</p>
        </div>
        <button onClick={() => setResetConfirm(true)} className="btn-ghost text-sm">{t('admin.demoReset')}</button>
      </div>

      {/* Reset confirm modal */}
      {resetConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="card max-w-sm w-full">
            <h3 className="font-bold text-zinc-100 mb-2">{t('admin.resetTitle')}</h3>
            <p className="text-zinc-400 text-sm mb-6">{t('admin.resetDesc')}</p>
            <div className="flex gap-3">
              <button onClick={handleReset} className="btn-danger flex-1">{t('admin.resetConfirm')}</button>
              <button onClick={() => setResetConfirm(false)} className="btn-ghost flex-1">{t('admin.cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statsLoading ? (
          [0, 1, 2, 3].map(i => <SkeletonStatCard key={i} />)
        ) : (
          [
            { labelKey: 'admin.statMerchants', value: stats?.totalUsers ?? '—', icon: '👤', color: 'indigo' },
            { labelKey: 'admin.statStores', value: stats?.totalStores ?? '—', icon: '🏪', color: 'emerald' },
            { labelKey: 'admin.statProducts', value: stats?.totalProducts ?? '—', icon: '📦', color: 'cyan' },
            { labelKey: 'admin.statThreats', value: stats?.criticalLogs ?? '—', icon: '🚨', color: 'red' },
          ].map((s, i) => (
            <motion.div
              key={s.labelKey}
              className="card text-center"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.06 }}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
            >
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className={`text-3xl font-bold mb-1 ${s.color === 'red' && (stats?.criticalLogs > 0) ? 'text-red-400' : s.color === 'indigo' ? 'text-indigo-400' : s.color === 'emerald' ? 'text-emerald-400' : s.color === 'cyan' ? 'text-cyan-400' : 'text-zinc-100'}`}>
                {s.value}
              </div>
              <div className="text-xs text-zinc-500">{t(s.labelKey)}</div>
            </motion.div>
          ))
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-zinc-900 rounded-xl p-1 border border-zinc-800 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.key ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold text-zinc-300 mb-4">{t('admin.chartTitle')}</h3>
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
            <h3 className="font-semibold text-zinc-300 mb-4">{t('admin.pieTitle')}</h3>
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
              <div className="flex items-center justify-center h-48 text-zinc-500">{t('admin.noData')}</div>
            )}
          </div>

          <div className="card lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-zinc-300">{t('admin.recentLogs')}</h3>
              <span className="text-xs text-zinc-500 font-mono">{t('admin.pollInterval')}</span>
            </div>
            <LogTable logs={logs.slice(0, 10)} newIds={newLogIds} />
          </div>
        </div>
      )}

      {/* Logs tab */}
      {activeTab === 'logs' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-zinc-300">{t('admin.allLogs')} ({logs.length}{t('admin.unit')})</h3>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {t('admin.monitoring')}
            </div>
          </div>
          <LogTable logs={logs} newIds={newLogIds} />
        </div>
      )}

      {/* Stores tab */}
      {activeTab === 'stores' && (
        <div className="card">
          <h3 className="font-semibold text-zinc-300 mb-4">{t('admin.storeManage')} ({stores.length}{t('admin.count')})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase">
                  <th className="text-left py-2 pr-4">{t('admin.thStoreName')}</th>
                  <th className="text-left py-2 pr-4">{t('admin.thOwner')}</th>
                  <th className="text-left py-2 pr-4">{t('admin.thRegion')}</th>
                  <th className="text-left py-2 pr-4">{t('admin.thProducts')}</th>
                  <th className="text-left py-2 pr-4">{t('admin.thStatus')}</th>
                  <th className="text-left py-2">{t('admin.thAction')}</th>
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
                      {s.status === 'approved' && <span className="badge-safe text-xs">{t('admin.badgeApproved')}</span>}
                      {s.status === 'pending' && <span className="badge-warning text-xs">{t('admin.badgePending')}</span>}
                      {s.status === 'flagged' && <span className="badge-danger text-xs">{t('admin.badgeFlagged')}</span>}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-1">
                        {s.status !== 'approved' && (
                          <button onClick={() => handleStoreStatus(s.id, 'approved')} className="text-xs bg-emerald-900/50 text-emerald-400 px-2 py-1 rounded hover:bg-emerald-900">{t('admin.actionApprove')}</button>
                        )}
                        {s.status !== 'pending' && (
                          <button onClick={() => handleStoreStatus(s.id, 'pending')} className="text-xs bg-amber-900/50 text-amber-400 px-2 py-1 rounded hover:bg-amber-900">{t('admin.actionPending')}</button>
                        )}
                        {s.status !== 'flagged' && (
                          <button onClick={() => handleStoreStatus(s.id, 'flagged')} className="text-xs bg-red-900/50 text-red-400 px-2 py-1 rounded hover:bg-red-900">{t('admin.actionFlag')}</button>
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
          <h3 className="font-semibold text-zinc-300 mb-4">{t('admin.reports')} ({reports.length}{t('admin.unit')})</h3>
          {reports.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">{t('admin.reportsEmpty')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase">
                    <th className="text-left py-2 pr-4">{t('admin.thProduct')}</th>
                    <th className="text-left py-2 pr-4">{t('admin.thReason')}</th>
                    <th className="text-left py-2 pr-4">{t('admin.thTotalReports')}</th>
                    <th className="text-left py-2 pr-4">{t('admin.thIp')}</th>
                    <th className="text-left py-2">{t('admin.thTime')}</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map(r => (
                    <tr key={r.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                      <td className="py-3 pr-4 text-zinc-200">{r.product_name}</td>
                      <td className="py-3 pr-4 text-zinc-400">{r.reason}</td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs font-semibold ${r.report_count >= 3 ? 'text-red-400' : 'text-zinc-400'}`}>{r.report_count}{t('admin.unit')}</span>
                      </td>
                      <td className="py-3 pr-4 text-zinc-500 font-mono text-xs">{r.reporter_ip}</td>
                      <td className="py-3 text-zinc-500 text-xs">{new Date(r.created_at).toLocaleString()}</td>
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
                <h3 className="text-lg font-bold text-zinc-100">{t('admin.autoPlayTitle')}</h3>
                <p className="text-sm text-zinc-500">{t('admin.autoPlayDesc')}</p>
              </div>
              <button
                onClick={runAllAttacks}
                disabled={autoRunning}
                className={`px-6 py-3 rounded-xl font-bold text-lg transition-all ${autoRunning ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/50'}`}
              >
                {autoRunning ? t('admin.autoPlayRunning', { progress: autoProgress, total: ATTACK_DEMOS.length }) : t('admin.autoPlayStart')}
              </button>
            </div>

            {autoRunning && (
              <div>
                <div className="flex justify-between text-sm text-zinc-400 mb-2">
                  <span>{t('admin.autoPlayProgress')}: {autoProgress}/{ATTACK_DEMOS.length}</span>
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
            <h3 className="font-semibold text-zinc-400 mb-3">{t('admin.individualTitle')}</h3>
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
              <h3 className="font-semibold text-zinc-300">{t('admin.demoLogTitle')}</h3>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {t('admin.liveLabel')}
              </span>
            </div>
            <LogTable logs={logs.slice(0, 15)} newIds={newLogIds} />
          </div>

          {/* Manual demo tips */}
          <div className="card mt-6 border-zinc-700">
            <h4 className="font-semibold text-zinc-400 mb-3">{t('admin.manualGuide')}</h4>
            <div className="space-y-2 text-sm font-mono">
              <div className="bg-zinc-800 rounded p-2">
                <span className="text-zinc-500">{t('admin.manualFakeQrLabel')}:</span>{' '}
                <span className="text-cyan-400">{t('admin.manualFakeQrDesc')}</span>
              </div>
              <div className="bg-zinc-800 rounded p-2">
                <span className="text-zinc-500">{t('admin.manualSqliLabel')}:</span>{' '}
                <span className="text-orange-400">{t('admin.manualSqliDesc')}</span>
              </div>
              <div className="bg-zinc-800 rounded p-2">
                <span className="text-zinc-500">{t('admin.manualNormalLabel')}:</span>{' '}
                <span className="text-emerald-400">{t('admin.manualNormalDesc')}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
