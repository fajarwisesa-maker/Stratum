// src/data/mockData.js
// Biscuit Quality mock data — SNI 01-2973-2011
import { FEATURE_SCHEMA, DEFAULT_PARAMS } from './featureSchema';

export const FEATURE_NAMES = FEATURE_SCHEMA.map(f => f.key);

export const DISPLAY_NAMES = Object.fromEntries(FEATURE_SCHEMA.map(f => [f.key, f.label]));

export const PARAM_RANGES = Object.fromEntries(
  FEATURE_SCHEMA.map(f => [f.key, { min: f.min, max: f.max, step: f.step, unit: f.unit }])
);

export const SNI_LIMITS = Object.fromEntries(
  FEATURE_SCHEMA.filter(f => f.sni_max != null).map(f => [f.key, f.sni_max])
);

// 4 clusters matching backend CLUSTER_LABELS (K-Means, SNI 2973:2011 failure modes)
export const CLUSTERS = [
  { id: 0, name: 'Low Risk — Nominal Parameters',   color: '#4ade80', shortLabel: 'C0' },
  { id: 1, name: 'Moisture / Water Activity Risk',  color: '#fbbf24', shortLabel: 'C1' },
  { id: 2, name: 'Microbial Contamination Risk',    color: '#f87171', shortLabel: 'C2' },
  { id: 3, name: 'Multi-Parameter Non-Conformance', color: '#a78bfa', shortLabel: 'C3' },
];

export const CLUSTER_CENTROIDS = [
  { x:  2.1, y:  1.5 },  // C0 — Low Risk
  { x: -2.8, y:  0.4 },  // C1 — Moisture/Aw Risk
  { x:  0.3, y: -2.6 },  // C2 — Microbial Risk
  { x: -1.5, y: -1.8 },  // C3 — Multi-Parameter
];

function seededVal(seed, min, max) {
  const x = Math.sin(seed * 9301 + 49297) * 0.5 + 0.5;
  return min + x * (max - min);
}

function makeShap(id, isPass) {
  return FEATURE_NAMES.map((k, i) => {
    let v = seededVal(id * 10 + i, -0.25, 0.25);
    // moisture and water_activity are top SHAP drivers for biscuit quality
    if (k === 'moisture_pct')    v = isPass ? -0.42 :  0.65;
    if (k === 'water_activity')  v = isPass ? -0.28 :  0.38;
    if (k === 'microbial_cfu_g') v = isPass ? -0.15 :  0.22;
    if (k === 'peroxide_value')  v = isPass ? -0.08 :  0.12;
    return Number(v.toFixed(4));
  });
}

function makeSample(id, label) {
  const isPass = label === 'PASS';
  const confidence = isPass
    ? 0.78 + seededVal(id, 0, 0.20)
    : 0.20 + seededVal(id, 0, 0.30);

  // 4-cluster assignment: PASS → C0; FAIL distributed across C1/C2/C3 by id
  const clusterId = isPass ? 0 : [1, 2, 3][id % 3];
  const centroid  = CLUSTER_CENTROIDS[clusterId];
  const px = centroid.x + seededVal(id * 3, -0.7, 0.7);
  const py = centroid.y + seededVal(id * 7, -0.7, 0.7);

  const params = { ...DEFAULT_PARAMS };
  // Bias key features toward realistic PASS/FAIL biscuit values
  params.moisture_pct    = parseFloat(seededVal(id, isPass ? 1.5  : 5.5,  isPass ? 4.8  : 10.0).toFixed(1));
  params.water_activity  = parseFloat(seededVal(id, isPass ? 0.40 : 0.65, isPass ? 0.65 : 0.90).toFixed(2));
  params.microbial_cfu_g = parseFloat(seededVal(id, isPass ? 20   : 350,  isPass ? 300  : 750 ).toFixed(0));
  params.peroxide_value  = parseFloat(seededVal(id, isPass ? 0.5  : 8.0,  isPass ? 7.0  : 20.0).toFixed(1));
  params.ash_pct         = parseFloat(seededVal(id, isPass ? 0.5  : 2.0,  isPass ? 2.5  : 5.0 ).toFixed(2));
  params.fat_pct         = parseFloat(seededVal(id, 12.0, 28.0).toFixed(1));
  params.protein_pct     = parseFloat(seededVal(id,  5.0, 12.0).toFixed(1));
  params.ph              = parseFloat(seededVal(id,  5.5,  7.5).toFixed(2));
  params.hardness_n      = parseFloat(seededVal(id, 25.0, 80.0).toFixed(1));
  params.thickness_mm    = parseFloat(seededVal(id,  5.5, 11.0).toFixed(1));
  params.weight_g        = parseFloat(seededVal(id,  8.0, 18.0).toFixed(1));

  const shapValues = makeShap(id, isPass);

  const clusterMeta = CLUSTERS[clusterId];
  return {
    id:                        `BATCH-${String(id).padStart(3, '0')}`,
    prediction:                label,
    confidence:                Math.min(Number(confidence.toFixed(3)), 0.99),
    class_id:                  isPass ? 1 : 0,
    shap_values:               shapValues,
    feature_names:             FEATURE_NAMES,
    cluster_id:                clusterId,
    cluster_label:             clusterMeta.name,
    cluster_description:       `Batch ini masuk ke cluster: ${clusterMeta.name}.`,
    dominant_failure_features: isPass ? [] : ['moisture_pct', 'microbial_cfu_g'].slice(0, clusterId),
    cluster_pos:               { x: Number(px.toFixed(2)), y: Number(py.toFixed(2)) },
    anomaly:                   !isPass,
    parameters:                params,
    top_factors:               FEATURE_NAMES.slice(0, 5).map((k, i) => ({ feature: k, impact: shapValues[i] })),
  };
}

const labels = ['PASS','PASS','FAIL','PASS','FAIL','PASS','PASS','PASS','FAIL','PASS','PASS','FAIL','PASS','PASS','PASS'];
export const MOCK_BATCH_RESULTS = labels.map((l, i) => makeSample(i + 1, l));
export const MOCK_CSV_ROWS = MOCK_BATCH_RESULTS.slice(0, 5).map((s) => ({
  sample_id: s.id, ...s.parameters,
}));
