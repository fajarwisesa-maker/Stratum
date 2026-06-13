// src/components/layout/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAnalysisStore } from '../../store/useAnalysisStore';

const NAV = [
  { to: '/',          icon: <UploadIcon />,    label: 'Upload'    },
  { to: '/dashboard', icon: <DashboardIcon />, label: 'Dashboard' },
  { to: '/simulator', icon: <SliderIcon />,    label: 'Simulator' },
  { to: '/history',   icon: <HistoryIcon />,   label: 'History'   },
];

export function Sidebar() {
  const passCount = useAnalysisStore((s) => s.batchResults.filter((r) => r.prediction === 'PASS').length);
  const failCount = useAnalysisStore((s) => s.batchResults.filter((r) => r.prediction === 'FAIL').length);
  const total     = useAnalysisStore((s) => s.batchResults.length);

  return (
    <aside style={{
      width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column',
      background: '#0f1116', borderRight: '1px solid var(--border)',
      padding: '20px 14px', gap: 6, minHeight: '100vh', position: 'fixed',
      top: 0, left: 0, zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 28, padding: '0 6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 7,
            background: 'linear-gradient(135deg, var(--accent) 0%, #4f46e5 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 12px rgba(108,126,225,0.3)',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)' }}>Stratum</div>
            <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '0.04em' }}>Quality Intelligence</div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
        {NAV.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'} style={{ textDecoration: 'none' }}>
            {({ isActive }) => (
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '9px 10px', borderRadius: 8, cursor: 'pointer',
                  background: isActive ? 'rgba(108,126,225,0.08)' : 'transparent',
                  color: isActive ? 'var(--accent2)' : 'var(--muted)',
                  borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                  transition: 'color 0.15s, background 0.15s',
                  fontSize: 13, fontWeight: isActive ? 500 : 400,
                }}
              >
                <span style={{ opacity: isActive ? 1 : 0.5 }}>{icon}</span>
                {label}
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Batch summary */}
      {total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '10px 12px',
          }}
        >
          <div className="label-xs" style={{ marginBottom: 6, fontSize: 8 }}>CURRENT BATCH</div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Pill label={`${passCount} PASS`} color="var(--pass)" />
            <Pill label={`${failCount} FAIL`} color="var(--fail)" />
          </div>
          <div style={{ marginTop: 6, height: 3, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(passCount / total) * 100}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              style={{ height: '100%', background: 'var(--pass)', borderRadius: 2 }}
            />
          </div>
        </motion.div>
      )}

      {/* User + Footer */}
      <div style={{ padding: '10px 6px 0', borderTop: '1px solid var(--border)', marginTop: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: 'rgba(108,126,225,0.12)', border: '1px solid rgba(108,126,225,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 700, color: 'var(--accent)',
          }}>WA</div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text)', fontWeight: 500 }}>Wahyu · Analyst</div>
            <div className="mono" style={{ fontSize: 8, color: 'var(--muted)' }}>Model v2.4.1</div>
          </div>
        </div>
        <div style={{ fontSize: 9, color: 'var(--muted)', lineHeight: 1.4 }}>
          <span style={{ fontWeight: 600, color: 'var(--muted2)' }}>TÜV NORD Indonesia</span><br />
          <span style={{ color: 'var(--accent)', fontSize: 8 }}>AI Open Innovation 2026</span>
        </div>
      </div>
    </aside>
  );
}

function Pill({ label, color }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, color, letterSpacing: '0.03em',
      background: `${color}12`, border: `1px solid ${color}25`,
      borderRadius: 5, padding: '2px 6px',
    }}>
      {label}
    </span>
  );
}

function UploadIcon()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>; }
function DashboardIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>; }
function SliderIcon()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>; }
function HistoryIcon()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5"/></svg>; }
