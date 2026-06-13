// src/components/dashboard/FeatureImportance.jsx
import Plot from '../shared/Plot';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { buildImportanceTrace } from '../../utils/shapHelpers';
import { plotlyLayout } from '../../design/tokens';

export function FeatureImportance() {
  const batchResults  = useAnalysisStore((s) => s.batchResults);
  const featureNames  = useAnalysisStore((s) => s.featureNames);

  if (!batchResults.length || !featureNames.length) return null;

  const allShap = batchResults.map((r) => r.shap_values);
  const trace   = buildImportanceTrace(allShap, featureNames);

  const layout = {
    ...plotlyLayout,
    height: 300,
    margin: { l: 140, r: 60, t: 10, b: 30 },
    xaxis: {
      ...plotlyLayout.xaxis,
      title: { text: 'Mean |SHAP| — Global Importance', font: { size: 10, color: '#5a7099' } },
    },
  };

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
        Global Feature Importance
        <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 8, fontWeight: 400 }}>
          Averaged across {batchResults.length} samples
        </span>
      </div>
      <div style={{ borderRadius: 12, overflow: 'hidden' }}>
        <Plot
          data={[trace]}
          layout={layout}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%' }}
          useResizeHandler
        />
      </div>
    </div>
  );
}
