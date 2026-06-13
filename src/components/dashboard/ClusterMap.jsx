// src/components/dashboard/ClusterMap.jsx
import { useState } from 'react';
import Plot from '../shared/Plot';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { plotlyLayout, colors } from '../../design/tokens';

// 4-cluster definitions — matches backend CLUSTER_LABELS (K-Means, SNI 2973:2011)
const CLUSTER_DEFS = [
  { id: 0, name: 'Low Risk — Nominal Parameters',   color: '#4ade80', shortLabel: 'C0' },
  { id: 1, name: 'Moisture / Water Activity Risk',  color: '#fbbf24', shortLabel: 'C1' },
  { id: 2, name: 'Microbial Contamination Risk',    color: '#f87171', shortLabel: 'C2' },
  { id: 3, name: 'Multi-Parameter Non-Conformance', color: '#a78bfa', shortLabel: 'C3' },
];

export function ClusterMap() {
  const batchResults   = useAnalysisStore((s) => s.batchResults);
  const activeSampleId = useAnalysisStore((s) => s.activeSampleId);
  const [hoveredItem, setHoveredItem] = useState(null);

  if (!batchResults.length) return null;

  // Only render samples that have cluster_pos populated
  const enriched = batchResults.filter((r) => r.cluster_pos != null);
  const pending  = batchResults.length - enriched.length;

  // Build one Plotly trace per cluster
  const traces = CLUSTER_DEFS.map((cluster) => {
    const samples = enriched.filter((r) => r.cluster_id === cluster.id);

    return {
      type: 'scatter',
      mode: 'markers',
      name: `${cluster.shortLabel} — ${cluster.name}`,
      x: samples.map((r) => r.cluster_pos.x),
      y: samples.map((r) => r.cluster_pos.y),
      // encode full item index for hover lookup
      customdata: samples.map((r) => r.id),
      text: samples.map((r) => {
        const label    = r.cluster_label || cluster.name;
        const domFeat  = (r.dominant_failure_features || []).join(', ') || '—';
        return `<b>${r.id}</b><br>${label}<br><span style='font-size:10px'>Dominant: ${domFeat}</span>`;
      }),
      marker: {
        color:   cluster.color,
        size:    samples.map((r) => r.id === activeSampleId ? 14 : 9),
        opacity: samples.map((r) => r.id === activeSampleId ? 1.0 : 0.72),
        line: {
          color: samples.map((r) => r.id === activeSampleId ? '#fff' : 'rgba(255,255,255,0.15)'),
          width: samples.map((r) => r.id === activeSampleId ? 2 : 0.5),
        },
        symbol: samples.map((r) => r.id === activeSampleId ? 'diamond' : 'circle'),
      },
      hovertemplate: '%{text}<br>PC1: %{x:.2f} · PC2: %{y:.2f}<extra></extra>',
    };
  });

  const layout = {
    ...plotlyLayout,
    height: 280,
    margin: { l: 40, r: 20, t: 8, b: 50 },
    showlegend: true,
    legend: {
      x: 0, y: -0.28,
      orientation: 'h',
      font: { size: 9, color: colors.muted2 },
      bgcolor: 'transparent',
      itemwidth: 30,
    },
    xaxis: {
      ...plotlyLayout.xaxis,
      title: { text: 'PC1', font: { size: 9, color: colors.muted } },
      showgrid: true, gridcolor: 'rgba(30,38,48,0.4)',
      zeroline: false,
    },
    yaxis: {
      ...plotlyLayout.yaxis,
      title: { text: 'PC2', font: { size: 9, color: colors.muted } },
      showgrid: true, gridcolor: 'rgba(30,38,48,0.4)',
      zeroline: false,
      tickfont: { size: 10, color: colors.muted },
    },
  };

  // Hover handler: look up the hovered batch item by its customdata (id)
  const handleHover = (event) => {
    if (!event?.points?.[0]) return;
    const pt   = event.points[0];
    const id   = pt.customdata;
    const item = batchResults.find((r) => r.id === id);
    setHoveredItem(item ?? null);
  };

  const handleUnhover = () => setHoveredItem(null);

  // Derive panel color from cluster def
  const hoverClusterDef = hoveredItem
    ? CLUSTER_DEFS.find((c) => c.id === hoveredItem.cluster_id)
    : null;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--amber)' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>Failure Pattern Clustering</span>
          <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 400 }}>K-Means · PCA projection</span>
        </div>

        {/* Pending indicator */}
        {pending > 0 && (
          <span style={{ fontSize: 10, color: 'var(--muted)', fontStyle: 'italic' }}>
            ⏳ {pending} batch belum ter-cluster
          </span>
        )}
      </div>

      {/* Scatter plot */}
      <div style={{ borderRadius: 10, overflow: 'hidden' }}>
        <Plot
          data={traces}
          layout={layout}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%' }}
          useResizeHandler
          onHover={handleHover}
          onUnhover={handleUnhover}
        />
      </div>

      {/* Hover info panel */}
      {hoveredItem && hoverClusterDef && (
        <div style={{
          marginTop: 10,
          padding: '10px 14px',
          borderRadius: 10,
          background: 'var(--surface2)',
          border: `1px solid ${hoverClusterDef.color}44`,
          transition: 'all 0.15s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: hoverClusterDef.color, flexShrink: 0,
            }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>
              {hoveredItem.id}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 600, color: hoverClusterDef.color,
              background: `${hoverClusterDef.color}18`,
              border: `1px solid ${hoverClusterDef.color}33`,
              borderRadius: 4, padding: '1px 6px',
            }}>
              {hoverClusterDef.shortLabel}
            </span>
          </div>

          <div style={{ fontSize: 11, color: 'var(--muted2)', marginBottom: 4, lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--text)' }}>{hoveredItem.cluster_label || hoverClusterDef.name}</strong>
          </div>

          {hoveredItem.cluster_description && (
            <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.55 }}>
              {hoveredItem.cluster_description}
            </div>
          )}

          {(hoveredItem.dominant_failure_features?.length > 0) && (
            <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {hoveredItem.dominant_failure_features.map((f) => (
                <span key={f} style={{
                  fontSize: 9, fontFamily: 'JetBrains Mono, monospace',
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 4, padding: '1px 6px', color: 'var(--muted2)',
                }}>
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
