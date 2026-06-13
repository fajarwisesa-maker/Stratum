// src/components/history/HistoryCard.jsx
import { motion } from 'framer-motion';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { useNavigate } from 'react-router-dom';
import { dateStr } from '../../utils/formatters';

export function HistoryCard({ session, index }) {
  const loadSession = useAnalysisStore((s) => s.loadSession);
  const navigate    = useNavigate();

  const total    = session.batchResults.length;
  const passing  = session.batchResults.filter((r) => r.prediction === 'PASS').length;
  const passRate = total > 0 ? (passing / total * 100).toFixed(0) : 0;
  const avgConf  = total > 0
    ? (session.batchResults.reduce((s, r) => s + r.confidence, 0) / total * 100).toFixed(1)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.005, borderColor: 'var(--border2)' }}
      onClick={() => { loadSession(session); navigate('/dashboard'); }}
      style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 14, padding: '16px 20px',
        cursor: 'pointer', transition: 'border-color 0.2s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>
            {session.filename || 'lab_results.csv'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{dateStr(session.timestamp)}</div>
        </div>
        <div style={{
          fontSize: 20, fontWeight: 800,
          color: passRate >= 70 ? 'var(--pass)' : 'var(--fail)',
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          {passRate}%
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 14, fontSize: 11, color: 'var(--muted)' }}>
        <Stat label="Samples" value={total} />
        <Stat label="Passed"  value={passing} color="var(--pass)" />
        <Stat label="Failed"  value={total - passing} color="var(--fail)" />
        <Stat label="Avg Conf" value={`${avgConf}%`} />
      </div>

      {/* Pass rate bar */}
      <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, marginTop: 14, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${passRate}%`,
          background: passRate >= 70
            ? 'linear-gradient(90deg, var(--pass), #10b981)'
            : 'linear-gradient(90deg, var(--fail), #f43f5e)',
          borderRadius: 2, transition: 'width 0.5s',
        }} />
      </div>
    </motion.div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div>
      <div style={{ color: color || 'var(--text)', fontWeight: 600, fontSize: 13 }}>{value}</div>
      <div style={{ marginTop: 1 }}>{label}</div>
    </div>
  );
}
