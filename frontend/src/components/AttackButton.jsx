import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const statusColors = {
  idle: 'bg-zinc-700 text-zinc-300',
  running: 'bg-amber-700 text-amber-200',
  success: 'bg-emerald-700 text-emerald-200',
  error: 'bg-red-700 text-red-200'
};

const cardBorderColor = {
  idle: 'border-zinc-800',
  running: 'border-amber-600/60',
  success: 'border-emerald-600/60',
  error: 'border-red-600/60',
};

export default function AttackButton({ icon, label, description, status = 'idle', onClick, disabled }) {
  const { t } = useTranslation();

  const statusLabel = {
    idle: t('attackButton.idle'),
    running: t('attackButton.running'),
    success: t('attackButton.success'),
    error: t('attackButton.error'),
  };

  return (
    <motion.div
      className={`card relative flex items-center gap-4 transition-colors overflow-hidden ${cardBorderColor[status]}`}
      whileHover={!disabled ? { scale: 1.01, x: 2 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <motion.div
        className="text-3xl flex-shrink-0"
        animate={status === 'running' ? { rotate: [0, -10, 10, -10, 0] } : { rotate: 0 }}
        transition={status === 'running' ? { repeat: Infinity, duration: 0.5 } : {}}
      >
        {icon}
      </motion.div>

      <div className="flex-1 min-w-0">
        <div className="font-semibold text-zinc-100">{label}</div>
        <div className="text-sm text-zinc-500 truncate">{description}</div>
      </div>

      <div className="flex items-center gap-3">
        <AnimatePresence mode="wait">
          <motion.span
            key={status}
            className={`text-xs px-2 py-1 rounded font-mono font-semibold ${statusColors[status]}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            {statusLabel[status]}
          </motion.span>
        </AnimatePresence>

        <motion.button
          onClick={onClick}
          disabled={disabled || status === 'running'}
          className={`btn-primary text-sm py-1.5 px-4 whitespace-nowrap ${status === 'running' ? 'opacity-50 cursor-not-allowed' : ''}`}
          whileHover={!disabled && status !== 'running' ? { scale: 1.05 } : {}}
          whileTap={!disabled && status !== 'running' ? { scale: 0.95 } : {}}
        >
          {t('attackButton.run')}
        </motion.button>
      </div>

      {status === 'success' && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          initial={{ opacity: 0.3 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.15), transparent)' }}
        />
      )}
    </motion.div>
  );
}
