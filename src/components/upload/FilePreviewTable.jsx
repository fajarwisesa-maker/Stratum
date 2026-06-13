// src/components/upload/FilePreviewTable.jsx
import { motion } from 'framer-motion';
import { staggerContainer, fadeUp } from '../../design/animations';

export function FilePreviewTable({ rows, headers, fileName }) {
  if (!rows || rows.length === 0) return null;
  const preview = rows.slice(0, 8);

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      style={{ marginTop: 24 }}
    >
      <motion.div variants={fadeUp} style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Preview</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
            {fileName} · {rows.length} rows · {headers.length} columns
          </div>
        </div>
        <div style={{
          fontSize: 11, color: 'var(--accent2)',
          background: 'rgba(123,140,222,0.1)', borderRadius: 6, padding: '3px 10px',
          border: '1px solid rgba(123,140,222,0.2)',
        }}>
          Showing {Math.min(8, rows.length)} of {rows.length}
        </div>
      </motion.div>

      <motion.div variants={fadeUp} style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
              {headers.map((h) => (
                <th key={h} style={{
                  padding: '10px 14px', textAlign: 'left',
                  color: 'var(--muted2)', fontWeight: 600,
                  letterSpacing: '0.04em', whiteSpace: 'nowrap',
                  fontSize: 10, textTransform: 'uppercase',
                }}>
                  {h.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.map((row, i) => (
              <tr key={i} style={{
                background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)',
                borderBottom: '1px solid var(--border)',
              }}>
                {headers.map((h) => (
                  <td key={h} style={{
                    padding: '9px 14px', color: 'var(--text)',
                    whiteSpace: 'nowrap', fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 11,
                  }}>
                    {row[h] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </motion.div>
  );
}
