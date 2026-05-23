import React from 'react';

const statusColors = {
  idle: 'bg-zinc-700 text-zinc-300',
  running: 'bg-amber-700 text-amber-200',
  success: 'bg-emerald-700 text-emerald-200',
  error: 'bg-red-700 text-red-200'
};

const statusLabel = {
  idle: '대기',
  running: '실행중...',
  success: '탐지·차단',
  error: '오류'
};

export default function AttackButton({ icon, label, description, status = 'idle', onClick, disabled }) {
  return (
    <div className={`card flex items-center gap-4 transition-all ${status === 'running' ? 'border-amber-700/50' : status === 'success' ? 'border-emerald-700/50' : 'border-zinc-800'}`}>
      <div className="text-3xl flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-zinc-100">{label}</div>
        <div className="text-sm text-zinc-500 truncate">{description}</div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-xs px-2 py-1 rounded font-mono font-semibold ${statusColors[status]}`}>
          {statusLabel[status]}
        </span>
        <button
          onClick={onClick}
          disabled={disabled || status === 'running'}
          className={`btn-primary text-sm py-1.5 px-4 whitespace-nowrap ${status === 'running' ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          시연
        </button>
      </div>
    </div>
  );
}
