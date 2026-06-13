// src/components/layout/StatusBar.jsx
export function StatusBar() {
  return (
    <div className="status-bar">
      <span>Last sync: 27 May 2026 23:45</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span className="dot" style={{ background: 'var(--pass)' }} />
        API: healthy
      </span>
      <span className="mono" style={{ fontSize: 10 }}>XGBoost v2.4.1</span>
      <span style={{ marginLeft: 'auto' }}>© 2026 Stratum · TÜV NORD Indonesia</span>
    </div>
  );
}
