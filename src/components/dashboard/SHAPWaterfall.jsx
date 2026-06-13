// src/components/dashboard/SHAPWaterfall.jsx
import Plot from '../shared/Plot';
import { buildWaterfallTrace } from '../../utils/shapHelpers';
import { plotlyLayout, colors } from '../../design/tokens';

export function SHAPWaterfall({ shapValues, featureNames, title = 'SHAP Analysis' }) {
  if (!shapValues || !featureNames) return <EmptyChart title={title} />;

  const trace = buildWaterfallTrace(shapValues, featureNames);

  // Find top negative feature (primary risk)
  const pairs = featureNames.map((n, i) => ({ name: formatName(n), val: shapValues[i] }));
  const topRisk = pairs.sort((a, b) => a.val - b.val)[0];

  const layout = {
    ...plotlyLayout,
    height: 300,
    margin: { l: 130, r: 50, t: 8, b: 28 },
    xaxis: {
      ...plotlyLayout.xaxis,
      title: { text: 'SHAP Value (Impact on Prediction)', font: { size: 9, color: colors.muted } },
      zeroline: true, zerolinewidth: 1, zerolinecolor: colors.border2,
    },
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--cyan)' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{title}</span>
          <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 400 }}>
            Feature contribution to verdict
          </span>
        </div>
        {topRisk && topRisk.val < 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 10, color: 'var(--cyan)', fontWeight: 500,
          }}>
            <span style={{ fontSize: 12 }}>⚠</span>
            Primary Risk: {topRisk.name}
          </div>
        )}
      </div>

      {/* Chart */}
      <div style={{ borderRadius: 10, overflow: 'hidden' }}>
        <Plot
          data={[trace]}
          layout={layout}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%' }}
          useResizeHandler
        />
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, marginTop: 8, justifyContent: 'flex-end' }}>
        {[
          { color: 'var(--pass)', label: 'PASS direction' },
          { color: 'var(--fail)', label: 'FAIL direction' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--muted)' }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function formatName(name) {
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function EmptyChart({ title }) {
  return (
    <div style={{
      height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: '1px dashed var(--border)', borderRadius: 10,
      color: 'var(--muted)', fontSize: 12,
    }}>
      {title} — No data available
    </div>
  );
}
