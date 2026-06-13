// src/components/dashboard/ModelMetrics.jsx
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getMetrics } from '../../api/client';

/**
 * ModelMetrics — Menampilkan performa model XGBoost dari GET /metrics.
 * 4 metrik utama: Accuracy (AUC), F1-Score, Precision, Recall.
 * Style konsisten dengan design system Stratum (glass, dark theme).
 */
export function ModelMetrics() {
  const [metrics, setMetrics]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    getMetrics()
      .then((data) => { setMetrics(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, []);

  // ── Loading skeleton ─────────────────────────────────────────
  if (loading) {
    return (
      <div style={containerStyle}>
        <Header />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={skeletonCardStyle} />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────
  if (error) {
    return (
      <div style={containerStyle}>
        <Header />
        <div style={{
          padding: '10px 14px', borderRadius: 8, fontSize: 11,
          background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)',
          color: 'var(--fail)',
        }}>
          ⚠ Backend offline — {error}
        </div>
      </div>
    );
  }

  // ── Derived values ───────────────────────────────────────────
  const cards = [
    {
      label:    'AUC / Accuracy',
      value:    metrics?.cv_auc_mean,
      color:    '#22d3ee',
      glow:     'rgba(34,211,238,0.15)',
      icon:     '◎',
    },
    {
      label:    'F1-Score',
      value:    metrics?.cv_f1_mean,
      subtext:  metrics?.cv_f1_std != null ? `±${metrics.cv_f1_std.toFixed(3)} std` : null,
      color:    '#6c7ee1',
      glow:     'rgba(108,126,225,0.15)',
      icon:     '◈',
    },
    {
      label:    'Precision',
      value:    metrics?.cv_precision,
      color:    '#4ade80',
      glow:     'rgba(74,222,128,0.15)',
      icon:     '◆',
    },
    {
      label:    'Recall',
      value:    metrics?.cv_recall,
      color:    '#fbbf24',
      glow:     'rgba(251,191,36,0.15)',
      icon:     '◉',
    },
  ];

  return (
    <div style={containerStyle}>
      <Header model={metrics?.model} dataset={metrics?.dataset} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {cards.map((card, i) => (
          <MetricCard key={card.label} card={card} index={i} />
        ))}
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────

function Header({ model, dataset }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent2)' }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
          Model Performance
        </span>
        <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 400 }}>
          5-fold CV
        </span>
      </div>

      {/* Dataset label badge */}
      <div style={{
        fontSize: 9, color: 'var(--muted)',
        background: 'var(--surface2)', border: '1px solid var(--border)',
        borderRadius: 5, padding: '2px 8px',
        fontFamily: 'JetBrains Mono, monospace',
        letterSpacing: '0.02em',
      }}>
        {model ?? 'XGBoost'} · {dataset ?? 'SNI 2973:2011'}
      </div>
    </div>
  );
}

function MetricCard({ card, index }) {
  const pct = card.value != null ? `${(card.value * 100).toFixed(2)}%` : '—';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background:   `linear-gradient(135deg, ${card.glow} 0%, var(--surface) 60%)`,
        border:       `1px solid ${card.color}22`,
        borderLeft:   `3px solid ${card.color}`,
        borderRadius: 12,
        padding:      '14px 16px',
        position:     'relative',
        overflow:     'hidden',
      }}
    >
      {/* Subtle background glow blob */}
      <div style={{
        position: 'absolute', top: -12, right: -12,
        width: 60, height: 60, borderRadius: '50%',
        background: card.glow, filter: 'blur(18px)',
        pointerEvents: 'none',
      }} />

      {/* Icon + Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: card.color, lineHeight: 1 }}>{card.icon}</span>
        <span style={{
          fontSize: 9, fontWeight: 600, color: 'var(--muted)',
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          {card.label}
        </span>
      </div>

      {/* Main value */}
      <div style={{
        fontSize: 26, fontWeight: 800, color: card.color,
        lineHeight: 1, letterSpacing: '-0.03em',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {pct}
      </div>

      {/* Subtext (e.g. std dev for F1) */}
      {card.subtext && (
        <div style={{
          fontSize: 9, color: 'var(--muted)', marginTop: 5,
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          {card.subtext}
        </div>
      )}

      {/* Progress bar */}
      {card.value != null && (
        <div style={{
          marginTop: 10, height: 3,
          background: 'var(--border)', borderRadius: 2, overflow: 'hidden',
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(card.value * 100, 100)}%` }}
            transition={{ duration: 0.8, delay: 0.15 + index * 0.06, ease: [0.22, 1, 0.36, 1] }}
            style={{ height: '100%', background: card.color, borderRadius: 2 }}
          />
        </div>
      )}
    </motion.div>
  );
}

// ── Styles ───────────────────────────────────────────────────────
const containerStyle = {
  display:       'flex',
  flexDirection: 'column',
};

const skeletonCardStyle = {
  height:       80,
  borderRadius: 12,
  background:   'var(--surface2)',
  border:       '1px solid var(--border)',
  animation:    'pulse 1.6s ease-in-out infinite',
};
