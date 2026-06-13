// src/components/shared/StatusBadge.jsx
export function StatusBadge({ status, size = 'sm' }) {
  const isPass = status === 'PASS';
  const sizes = { sm: { fontSize: 10, padding: '2px 8px' }, md: { fontSize: 12, padding: '4px 12px' } };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontWeight: 700, letterSpacing: '0.08em',
      color: isPass ? 'var(--pass)' : 'var(--fail)',
      background: isPass ? 'rgba(52,211,153,0.1)' : 'rgba(251,113,133,0.1)',
      border: `1px solid ${isPass ? 'rgba(52,211,153,0.3)' : 'rgba(251,113,133,0.3)'}`,
      borderRadius: 6, ...sizes[size],
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%',
        background: isPass ? 'var(--pass)' : 'var(--fail)',
        display: 'inline-block',
      }} />
      {status}
    </span>
  );
}
