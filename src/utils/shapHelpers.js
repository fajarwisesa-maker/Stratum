// src/utils/shapHelpers.js
import { colors } from '../design/tokens';

/**
 * Transform raw SHAP arrays from the API into a Plotly waterfall trace.
 * Sorted by absolute magnitude (most impactful feature first).
 */
export function buildWaterfallTrace(shapValues, featureNames) {
  const pairs = featureNames.map((name, i) => ({
    name: formatFeatureName(name),
    value: shapValues[i],
  }));
  pairs.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  const top = pairs.slice(0, 10); // show top 10

  return {
    type: 'waterfall',
    orientation: 'h',
    y: top.map((d) => d.name),
    x: top.map((d) => d.value),
    connector: { line: { color: 'rgba(255,255,255,0.06)', width: 1 } },
    increasing: { marker: { color: colors.pass,   line: { width: 0 } } },
    decreasing: { marker: { color: colors.fail,   line: { width: 0 } } },
    totals:     { marker: { color: colors.accent, line: { width: 0 } } },
    textposition: 'outside',
    texttemplate: '%{x:.3f}',
    textfont: { size: 10, color: colors.muted2 },
  };
}

/**
 * Build a horizontal bar trace for global feature importance.
 * Takes mean(|shap_values|) across all samples.
 */
export function buildImportanceTrace(allShapValues, featureNames) {
  const means = featureNames.map((name, i) => ({
    name: formatFeatureName(name),
    mean: allShapValues.reduce((sum, row) => sum + Math.abs(row[i]), 0) / allShapValues.length,
  }));
  means.sort((a, b) => a.mean - b.mean);

  return {
    type: 'bar',
    orientation: 'h',
    y: means.map((d) => d.name),
    x: means.map((d) => d.mean),
    marker: {
      color: means.map((d) =>
        `rgba(123, 140, 222, ${0.35 + 0.65 * (d.mean / (means[means.length - 1].mean || 1))})`
      ),
      line: { width: 0 },
    },
    textposition: 'outside',
    texttemplate: '%{x:.3f}',
    textfont: { size: 10, color: colors.muted2 },
  };
}

function formatFeatureName(name) {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
