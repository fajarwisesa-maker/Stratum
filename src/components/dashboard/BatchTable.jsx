// src/components/dashboard/BatchTable.jsx
import { motion } from 'framer-motion';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { StatusBadge } from '../shared/StatusBadge';

export function BatchTable() {
  const batchResults   = useAnalysisStore((s) => s.batchResults);
  const activeSampleId = useAnalysisStore((s) => s.activeSampleId);
  const setActive      = useAnalysisStore((s) => s.setActiveSample);

  if (!batchResults.length) return null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>Batch Results</span>
          <span style={{
            fontSize: 9, fontWeight: 600, color: 'var(--muted)',
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 4, padding: '2px 6px',
          }}>
            {batchResults.length} samples
          </span>
        </div>
        <span style={{ fontSize: 10, color: 'var(--muted)' }}>
          Click row to inspect
        </span>
      </div>

      <div style={{ borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden', maxHeight: 280, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
            <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
              {['Sample ID', 'Verdict', 'Confidence', 'Moisture %', 'Water Act.', 'Microbial', 'SNI Viol.'].map((h) => (
                <th key={h} style={{
                  padding: '8px 12px', textAlign: 'left',
                  fontSize: 9, fontWeight: 600,
                  color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {batchResults.map((row, i) => {
              const isActive = row.id === activeSampleId;
              return (
                <motion.tr
                  key={row.id}
                  onClick={() => setActive(row.id)}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02, duration: 0.2 }}
                  style={{
                    background: isActive
                      ? 'rgba(108,126,225,0.06)'
                      : i % 2 === 0 ? 'var(--surface)' : 'rgba(26,29,36,0.5)',
                    borderBottom: '1px solid var(--border)',
                    borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'background 0.12s',
                  }}
                  whileHover={{ backgroundColor: 'rgba(108,126,225,0.04)' }}
                >
                  <td style={{ padding: '8px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'var(--text)' }}>
                    {isActive && <span style={{ color: 'var(--accent)', marginRight: 4 }}>›</span>}
                    {row.id}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <StatusBadge status={row.prediction} />
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <ConfidencePill value={row.confidence} status={row.prediction} />
                  </td>
                  <td style={tdMono}>{row.parameters?.moisture_pct != null ? Number(row.parameters.moisture_pct).toFixed(1) : '—'}%</td>
                  <td style={tdMono}>{row.parameters?.water_activity != null ? Number(row.parameters.water_activity).toFixed(2) : '—'}</td>
                  <td style={{
                    ...tdMono,
                    color: row.prediction === 'FAIL' ? 'var(--fail)' : 'var(--muted2)',
                    fontWeight: row.prediction === 'FAIL' ? 600 : 400,
                  }}>
                    {row.parameters?.microbial_cfu_g != null ? Math.round(row.parameters.microbial_cfu_g) : '—'}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    {(row.sni_violations && row.sni_violations.length > 0) ? (
                      <span style={{ color: 'var(--fail)', fontSize: 11 }} title={row.sni_violations.map(v => v.label).join(', ')}>⚠ {row.sni_violations.length}</span>
                    ) : (
                      <span style={{ color: 'var(--pass)', fontSize: 10 }}>✓</span>
                    )}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Analyst notes */}
      <div style={{
        marginTop: 10, padding: '10px 14px',
        background: 'rgba(20,23,32,0.5)',
        border: '1px solid var(--border)',
        borderRadius: 8, fontSize: 10,
      }}>
        <span style={{ color: 'var(--muted)', fontWeight: 600, marginRight: 6 }}>Analyst Notes</span>
        <span style={{ color: 'var(--muted2)' }}>
          Samples exceeding SNI 01-2973-2011 thresholds flagged for retest.
        </span>
      </div>
    </div>
  );
}

const tdMono = {
  padding: '8px 12px',
  color: 'var(--muted2)',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 10,
};

function ConfidencePill({ value, status }) {
  const isPass = status === 'PASS';
  const pct = (value * 100).toFixed(1);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 50, height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: isPass ? 'var(--pass)' : 'var(--fail)',
          borderRadius: 2,
        }} />
      </div>
      <span className="mono" style={{ fontSize: 10, color: 'var(--muted2)' }}>{pct}%</span>
    </div>
  );
}
