import React from 'react';
import { useTranslation } from 'react-i18next';

const severityStyle = {
  low: 'text-zinc-400 bg-zinc-800/50',
  medium: 'text-amber-400 bg-amber-900/20',
  high: 'text-orange-400 bg-orange-900/20',
  critical: 'text-red-400 bg-red-900/20'
};

const eventIcon = {
  SQLI_ATTEMPT: '🗡️',
  BRUTE_FORCE_LOCK: '🔨',
  LOGIN_FAIL: '🔑',
  XSS_ATTEMPT: '💀',
  IDOR_ATTEMPT: '🚪',
  FAKE_QR_ACCESS: '🎭',
  UNAUTHORIZED_ACCESS: '⛔'
};

export default function LogTable({ logs, newIds = new Set() }) {
  const { t } = useTranslation();

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500 font-mono text-sm">
        {t('logTable.empty')}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm font-mono">
        <thead>
          <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider">
            <th className="text-left py-2 pr-4">{t('logTable.thTime')}</th>
            <th className="text-left py-2 pr-4">{t('logTable.thType')}</th>
            <th className="text-left py-2 pr-4">{t('logTable.thSeverity')}</th>
            <th className="text-left py-2 pr-4">{t('logTable.thIp')}</th>
            <th className="text-left py-2">{t('logTable.thDetail')}</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr
              key={log.id}
              className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors ${newIds.has(log.id) ? 'log-row-new' : ''} ${severityStyle[log.severity]}`}
            >
              <td className="py-2 pr-4 whitespace-nowrap text-zinc-500">
                {new Date(log.created_at).toLocaleTimeString()}
              </td>
              <td className="py-2 pr-4 whitespace-nowrap">
                {eventIcon[log.event_type] || '⚡'} {log.event_type}
              </td>
              <td className="py-2 pr-4">
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${log.severity === 'critical' ? 'bg-red-900/50 text-red-400' : log.severity === 'high' ? 'bg-orange-900/50 text-orange-400' : log.severity === 'medium' ? 'bg-amber-900/50 text-amber-400' : 'bg-zinc-700 text-zinc-400'}`}>
                  {log.severity.toUpperCase()}
                </span>
              </td>
              <td className="py-2 pr-4 text-zinc-500">{log.ip_address}</td>
              <td className="py-2 text-zinc-400 max-w-xs truncate">{log.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
