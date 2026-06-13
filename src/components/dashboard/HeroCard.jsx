// src/components/dashboard/HeroCard.jsx
import { motion } from 'framer-motion';
import { useAnalysisStore } from '../../store/useAnalysisStore';

export function HeroCard() {
  const batchResults   = useAnalysisStore((s) => s.batchResults);
  const activeSampleId = useAnalysisStore((s) => s.activeSampleId);
  const activeSample   = batchResults.find((r) => r.id === activeSampleId) ?? batchResults[0];
  if (!activeSample) return null;

  const { prediction, confidence, id } = activeSample;
  const isPass    = prediction === 'PASS';
  const passCount = batchResults.filter((r) => r.prediction === 'PASS').length;
  const total     = batchResults.length;
  const passRate  = total > 0 ? passCount / total : 0;
  const avgConf   = total > 0
    ? batchResults.reduce((s, r) => s + r.confidence, 0) / total
    : 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.36fr 0.36fr 0.38fr', gap: 12 }}>
      {/* ── Prediction Verdict ── */}
      <motion.div
        key={id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={isPass ? 'glow-pass' : 'glow-fail'}
        style={{
          background: isPass
            ? 'linear-gradient(135deg, rgba(74,222,128,0.06) 0%, var(--surface) 50%)'
            : 'linear-gradient(135deg, rgba(248,113,113,0.06) 0%, var(--surface) 50%)',
          border: `1px solid ${isPass ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.15)'}`,
          borderLeft: `3px solid ${isPass ? 'var(--pass)' : 'var(--fail)'}`,
          borderRadius: 14, padding: '20px 24px',
          position: 'relative', overflow: 'hidden',
        }}
      >
        {/* SNI badge */}
        <div style={{
          position: 'absolute', top: 14, right: 14,
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 9, color: 'var(--pass)', fontWeight: 600,
          background: 'rgba(74,222,128,0.06)',
          border: '1px solid rgba(74,222,128,0.15)',
          borderRadius: 5, padding: '2px 8px',
          letterSpacing: '0.04em',
        }}>
          ✓ SNI 2973:2011
        </div>

        <div className="label-xs" style={{ marginBottom: 12, fontSize: 9 }}>
          PREDICTION VERDICT
        </div>

        <motion.div
          key={prediction}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            fontSize: 40, fontWeight: 800, lineHeight: 1,
            letterSpacing: '-0.04em',
            color: isPass ? 'var(--pass)' : 'var(--fail)',
          }}
        >
          {prediction}
        </motion.div>

        <div style={{ marginTop: 12 }}>
          <ConfidenceBar value={confidence} isPass={isPass} />
          <div style={{ fontSize: 12, color: 'var(--muted2)', marginTop: 4 }}>
            {(confidence * 100).toFixed(1)}% confidence
          </div>
        </div>

        <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 10 }}>
          Sample {id} · Batch 2026-05-27 · 11:45 PM
        </div>
      </motion.div>

      {/* ── Pass Rate ── */}
      <StatCard
        label="PASS RATE"
        value={`${(passRate * 100).toFixed(0)}%`}
        sub={`${passCount} of ${total}`}
        color="var(--pass)"
      />

      {/* ── Avg Confidence ── */}
      <StatCard
        label="AVG CONFIDENCE"
        value={`${(avgConf * 100).toFixed(1)}%`}
        sub={`across ${total} samples`}
        color="var(--accent)"
      />

      {/* ── Compliance ── */}
      <div className="glass" style={{ padding: '20px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className="label-xs" style={{ marginBottom: 10, fontSize: 9 }}>COMPLIANCE</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14,
          }}>✓</div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--pass)' }}>Audit Ready</span>
        </div>
        <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.5 }}>
          All parameters within<br />SNI tolerance range
        </div>
      </div>
    </div>
  );
}

function ConfidenceBar({ value, isPass }) {
  const color = isPass ? 'var(--pass)' : 'var(--fail)';
  return (
    <div style={{ width: '100%', maxWidth: 200 }}>
      <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          style={{ height: '100%', background: color, borderRadius: 3 }}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="glass" style={{ padding: '20px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div className="label-xs" style={{ marginBottom: 10, fontSize: 9 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1, letterSpacing: '-0.03em' }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6 }}>{sub}</div>
    </div>
  );
}
