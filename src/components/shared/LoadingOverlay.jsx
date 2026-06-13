// src/components/shared/LoadingOverlay.jsx
import { motion } from 'framer-motion';

export function LoadingOverlay({ message = 'Analyzing samples...' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(8,14,28,0.85)', backdropFilter: 'blur(8px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 20,
      }}
    >
      {/* Spinner */}
      <div style={{ position: 'relative', width: 64, height: 64 }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 64, height: 64, borderRadius: '50%',
            border: '2px solid var(--border)',
            borderTopColor: 'var(--accent)',
            position: 'absolute',
          }}
        />
        <div style={{
          position: 'absolute', inset: 8,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(123,140,222,0.1), transparent)',
        }} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>{message}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>Running ML inference pipeline</div>
      </div>
    </motion.div>
  );
}
