// src/views/HistoryView.jsx
import { motion, AnimatePresence } from 'framer-motion';
import { TopBar } from '../components/layout/TopBar';
import { HistoryCard } from '../components/history/HistoryCard';
import { useHistoryStore } from '../store/useHistoryStore';
import { pageTransition } from '../design/animations';

const FILTERS = ['ALL', 'PASS', 'FAIL'];

export function HistoryView() {
  const sessions    = useHistoryStore((s) => s.sessions);
  const filter      = useHistoryStore((s) => s.filter);
  const setFilter   = useHistoryStore((s) => s.setFilter);
  const clearHistory = useHistoryStore((s) => s.clearHistory);

  const filtered = filter === 'ALL'
    ? sessions
    : sessions.filter((s) => {
        const pass = s.batchResults.filter((r) => r.prediction === 'PASS').length;
        const fail = s.batchResults.length - pass;
        return filter === 'PASS' ? pass > fail : fail >= pass;
      });

  return (
    <motion.div {...pageTransition}>
      <TopBar title="Analysis History" subtitle={`${sessions.length} sessions stored locally`} />

      <div style={{ padding: '28px 32px' }}>
        {/* Filter bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {FILTERS.map((f) => (
              <motion.button
                key={f}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setFilter(f)}
                style={{
                  fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  padding: '7px 16px', borderRadius: 8,
                  background: filter === f ? 'rgba(123,140,222,0.15)' : 'var(--surface2)',
                  border: `1px solid ${filter === f ? 'rgba(123,140,222,0.3)' : 'var(--border)'}`,
                  color: filter === f ? 'var(--accent2)' : 'var(--muted2)',
                  transition: 'all 0.15s',
                }}
              >
                {f}
              </motion.button>
            ))}
          </div>
          {sessions.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={clearHistory}
              style={{
                fontSize: 12, cursor: 'pointer',
                color: 'var(--fail)', background: 'rgba(251,113,133,0.06)',
                border: '1px solid rgba(251,113,133,0.2)',
                borderRadius: 8, padding: '7px 14px',
              }}
            >
              Clear All
            </motion.button>
          )}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              textAlign: 'center', padding: '80px 0',
              color: 'var(--muted)',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>📂</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
              No history yet
            </div>
            <div style={{ fontSize: 13 }}>
              Run an analysis from the Upload page to start building history.
            </div>
          </motion.div>
        )}

        {/* Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <AnimatePresence>
            {filtered.map((session, i) => (
              <HistoryCard key={session.id} session={session} index={i} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
