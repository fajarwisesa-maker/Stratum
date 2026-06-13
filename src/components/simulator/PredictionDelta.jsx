// src/components/simulator/PredictionDelta.jsx
import { motion, AnimatePresence } from 'framer-motion';
import { useSimulatorStore } from '../../store/useSimulatorStore';
import { StatusBadge } from '../shared/StatusBadge';

export function PredictionDelta() {
  const baseResult   = useSimulatorStore((s) => s.baseResult);
  const simResult    = useSimulatorStore((s) => s.simResult);
  const isSimulating = useSimulatorStore((s) => s.isSimulating);

  if (!baseResult) return null;

  const current = simResult
    ? { prediction: simResult.new_prediction, confidence: simResult.new_confidence }
    : baseResult;

  const delta = simResult
    ? ((simResult.new_confidence - baseResult.confidence) * 100).toFixed(1)
    : null;

  const verdictChanged = simResult && simResult.new_prediction !== baseResult.prediction;

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 16, padding: '20px 24px',
    }}>
      <div className="label-xs" style={{ marginBottom: 16 }}>Prediction Output</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center' }}>
        {/* Before */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>Original</div>
          <StatusBadge status={baseResult.prediction} size="md" />
          <div style={{
            fontSize: 13, color: 'var(--muted2)', marginTop: 8,
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            {(baseResult.confidence * 100).toFixed(1)}%
          </div>
        </div>

        {/* Arrow */}
        <motion.div
          animate={{ x: isSimulating ? [0, 4, 0] : 0 }}
          transition={{ repeat: isSimulating ? Infinity : 0, duration: 0.6 }}
          style={{ color: 'var(--muted)', fontSize: 20 }}
        >
          →
        </motion.div>

        {/* After */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8 }}>Simulated</div>
          <AnimatePresence mode="wait">
            <motion.div
              key={current.prediction}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <StatusBadge status={current.prediction} size="md" />
            </motion.div>
          </AnimatePresence>
          <div style={{
            fontSize: 13, marginTop: 8, fontFamily: 'JetBrains Mono, monospace',
            color: delta > 0 ? 'var(--pass)' : delta < 0 ? 'var(--fail)' : 'var(--muted2)',
          }}>
            {(current.confidence * 100).toFixed(1)}%
            {delta !== null && (
              <span style={{ fontSize: 11, marginLeft: 4 }}>
                ({delta > 0 ? '+' : ''}{delta}%)
              </span>
            )}
          </div>
        </div>
      </div>

      {verdictChanged && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: 16, padding: '10px 14px', borderRadius: 10,
            background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)',
            fontSize: 12, color: 'var(--gold)', textAlign: 'center',
          }}
        >
          ⚡ Verdict changed: {baseResult.prediction} → {simResult.new_prediction}
        </motion.div>
      )}
    </div>
  );
}
