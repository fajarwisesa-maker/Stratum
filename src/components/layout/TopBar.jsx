// src/components/layout/TopBar.jsx
import { motion } from 'framer-motion';
import { useAnalysisStore } from '../../store/useAnalysisStore';

export function TopBar({ title, subtitle }) {
  const useMock = useAnalysisStore((s) => s.useMockData);
  const activeSampleId = useAnalysisStore((s) => s.activeSampleId);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 32px', borderBottom: '1px solid var(--border)',
      background: 'rgba(12,14,20,0.85)', backdropFilter: 'blur(12px)',
      position: 'sticky', top: 0, zIndex: 50, minHeight: 56,
    }}>
      <div>
        <h1 style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text)', margin: 0 }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{subtitle}</p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* System Ready */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--pass)',
            boxShadow: '0 0 6px var(--pass)',
            animation: 'pulse 2s ease-in-out infinite',
          }} />
          <span style={{ fontSize: 11, color: 'var(--pass)', fontWeight: 500 }}>System Ready</span>
        </div>

        <Divider />

        {/* Latency */}
        <span className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>142ms</span>

        <Divider />

        {/* Demo badge */}
        {useMock && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              fontSize: 9, fontWeight: 700,
              color: 'var(--gold)',
              background: 'rgba(251,191,36,0.08)',
              border: '1px solid rgba(251,191,36,0.2)',
              borderRadius: 5, padding: '3px 8px',
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}
          >
            DEMO
          </motion.div>
        )}

        {/* Active sample */}
        {activeSampleId && (
          <span className="mono" style={{
            fontSize: 10, color: 'var(--muted2)',
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 5, padding: '3px 8px',
          }}>
            {activeSampleId}
          </span>
        )}

        {/* Export button */}
        <button style={{
          fontSize: 11, fontWeight: 500, color: 'var(--muted2)',
          background: 'transparent', border: '1px solid var(--border)',
          borderRadius: 7, padding: '5px 12px', cursor: 'pointer',
          transition: 'border-color 0.15s, color 0.15s',
        }}
        onMouseEnter={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.color = 'var(--accent)'; }}
        onMouseLeave={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--muted2)'; }}
        >
          Export PDF
        </button>
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{ width: 1, height: 16, background: 'var(--border)' }} />;
}
