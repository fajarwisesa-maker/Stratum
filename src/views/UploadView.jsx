// src/views/UploadView.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TopBar } from '../components/layout/TopBar';
import { DropZone } from '../components/upload/DropZone';
import { FilePreviewTable } from '../components/upload/FilePreviewTable';
import { LoadingOverlay } from '../components/shared/LoadingOverlay';
import { useFileParser } from '../hooks/useFileParser';
import { useAnalysisStore } from '../store/useAnalysisStore';
import { useHistoryStore } from '../store/useHistoryStore';
import { postBatch, postCluster } from '../api/client';
import { FEATURE_SCHEMA } from '../data/featureSchema';
import { pageTransition } from '../design/animations';

// Build mock data using wine quality feature schema
function buildWineMockResults() {
  const keys = FEATURE_SCHEMA.map(f => f.key);
  function seeded(seed, min, max) {
    const x = Math.sin(seed * 9301 + 49297) * 0.5 + 0.5;
    return min + x * (max - min);
  }
  const labels = ['PASS','PASS','FAIL','PASS','FAIL','PASS','PASS','PASS','FAIL','PASS','PASS','FAIL','PASS','PASS','PASS'];
  return labels.map((label, i) => {
    const isPass = label === 'PASS';
    const confidence = isPass ? 0.75 + seeded(i, 0, 0.24) : 0.18 + seeded(i, 0, 0.3);
    const params = {};
    FEATURE_SCHEMA.forEach(f => {
      params[f.key] = parseFloat(seeded(i * 13 + FEATURE_SCHEMA.indexOf(f), f.min, f.max).toFixed(
        f.step < 0.001 ? 4 : f.step < 0.01 ? 3 : f.step < 0.1 ? 2 : 1
      ));
    });
    if (isPass) { params.alcohol = parseFloat(seeded(i, 11, 14).toFixed(1)); params.volatile_acidity = parseFloat(seeded(i, 0.1, 0.4).toFixed(2)); }
    else        { params.alcohol = parseFloat(seeded(i, 7, 10).toFixed(1));  params.volatile_acidity = parseFloat(seeded(i, 0.6, 1.2).toFixed(2)); }
    const shapValues = keys.map((_, j) => parseFloat(seeded(i * 7 + j, -0.25, 0.25).toFixed(4)));
    return {
      id: `BATCH-${String(i+1).padStart(3,'0')}`,
      prediction: label,
      confidence: Math.min(parseFloat(confidence.toFixed(3)), 0.99),
      class_id: isPass ? 1 : 0,
      shap_values: shapValues,
      feature_names: keys,
      parameters: params,
      top_factors: keys.slice(0,5).map((k, j) => ({ feature: k, impact: shapValues[j] })),
    };
  });
}

// ── Cluster position helpers (pseudo-PCA, deterministic) ─────────
const CENTROIDS = [
  { x:  2.1, y:  1.5 },  // C0 — Low Risk
  { x: -2.8, y:  0.4 },  // C1 — Moisture/Aw Risk
  { x:  0.3, y: -2.6 },  // C2 — Microbial Risk
  { x: -1.5, y: -1.8 },  // C3 — Multi-Parameter
];
function jitter(seed, range) {
  return (Math.sin(seed * 9301 + 49297) * 0.5 + 0.5) * range * 2 - range;
}

const MOCK_BATCH_RESULTS = buildWineMockResults();

export function UploadView() {
  const navigate        = useNavigate();
  const { rows, headers, error: parseError, fileName, rawFile, parse, reset } = useFileParser();
  const setBatchResults = useAnalysisStore((s) => s.setBatchResults);
  const loadMockData    = useAnalysisStore((s) => s.loadMockData);
  const addSession      = useHistoryStore((s) => s.addSession);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError]   = useState(null);

  const handleRunAnalysis = async () => {
    if (!rawFile) return;
    setIsLoading(true);
    setApiError(null);
    try {
      const response = await postBatch(rawFile);

      // Build base results from /batch response
      const baseResults = response.rows.map((r) => ({
        id:            r.id,
        prediction:    r.prediction,
        confidence:    r.confidence,
        class_id:      r.class_id,
        parameters:    r.parameters,
        top_factors:   r.top_factors,
        shap_values:   r.shap_values,
        feature_names: r.feature_names,
        sni_violations: r.sni_violations ?? [],
        dataset_type:  r.dataset_type,
      }));

      // Enrich each row with cluster data via parallel /cluster calls
      const clusterResults = await Promise.all(
        baseResults.map((r) => postCluster(r.parameters).catch(() => null))
      );

      const results = baseResults.map((r, idx) => {
        const cr  = clusterResults[idx];
        const cid = cr?.cluster_id ?? 0;
        const centroid = CENTROIDS[Math.min(cid, CENTROIDS.length - 1)];
        return {
          ...r,
          cluster_id:                cid,
          cluster_label:             cr?.cluster_label             ?? 'Unknown',
          cluster_description:       cr?.description               ?? '',
          dominant_failure_features: cr?.dominant_failure_features ?? [],
          cluster_pos: {
            x: parseFloat((centroid.x + jitter(idx * 3, 0.7)).toFixed(2)),
            y: parseFloat((centroid.y + jitter(idx * 7, 0.7)).toFixed(2)),
          },
        };
      });

      setBatchResults(results);
      addSession({
        id:           Date.now().toString(),
        timestamp:    Date.now(),
        filename:     fileName || 'lab_results.csv',
        batchResults: results,
        summary:      response.summary,
      });
      navigate('/dashboard');
    } catch (err) {
      setApiError(err.message);
      setIsLoading(false);
    }
  };

  const handleDemoMode = () => {
    loadMockData();
    addSession({
      id:           Date.now().toString(),
      timestamp:    Date.now(),
      filename:     'demo_wine_quality.csv',
      batchResults: MOCK_BATCH_RESULTS,
    });
    navigate('/dashboard');
  };

  const EXPECTED_COLS = FEATURE_SCHEMA.map(f => f.key);

  return (
    <motion.div {...pageTransition} style={{ minHeight: '100vh' }}>
      <TopBar title="Upload Lab Data" subtitle="Import CSV from TÜV NORD laboratory systems" />
      <AnimatePresence>{isLoading && <LoadingOverlay />}</AnimatePresence>

      <div style={{ padding: '40px 40px', maxWidth: 860, margin: '0 auto' }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text)', margin: 0 }}>
                New Batch Analysis
              </h2>
              <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 6 }}>
                Upload your quality test CSV to run ML predictions and SHAP analysis.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={handleDemoMode}
              style={{
                background: 'rgba(123,140,222,0.1)', border: '1px solid rgba(123,140,222,0.25)',
                color: 'var(--accent2)', borderRadius: 10, padding: '10px 18px',
                fontSize: 13, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              ⚡ Load Demo Data
            </motion.button>
          </div>

          {/* Expected columns */}
          <div style={{
            background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '12px 16px',
          }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>
              Expected columns (semicolon <code>;</code> or comma separated):
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {EXPECTED_COLS.map((col) => (
                <span key={col} style={{
                  fontSize: 10, fontFamily: 'JetBrains Mono, monospace',
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 4, padding: '2px 7px', color: 'var(--muted2)',
                }}>{col}</span>
              ))}
            </div>
          </div>

          {/* Dataset note */}
          <div style={{
            marginTop: 10, padding: '8px 14px', borderRadius: 8,
            background: 'rgba(123,140,222,0.04)', border: '1px solid rgba(123,140,222,0.15)',
            fontSize: 11, color: 'var(--muted)', lineHeight: 1.6,
          }}>
            ℹ️ <strong style={{ color: 'var(--muted2)' }}>MVP Dataset Note:</strong> This MVP currently uses the UCI Wine Quality dataset as a public proxy dataset to validate Stratum's ML and explainability pipeline. The architecture is designed to be retrained with actual SPL biscuit lab data when available.
          </div>
        </motion.div>

        {/* Drop zone */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <DropZone onFile={parse} />
        </motion.div>

        {/* Parse / API errors */}
        {(parseError || apiError) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
            marginTop: 16, padding: '12px 16px', borderRadius: 10,
            background: 'rgba(251,113,133,0.08)', border: '1px solid rgba(251,113,133,0.25)',
            color: 'var(--fail)', fontSize: 13,
          }}>
            ⚠ {parseError || apiError}
          </motion.div>
        )}

        {/* File preview */}
        <AnimatePresence>
          {rows && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <FilePreviewTable rows={rows} headers={headers} fileName={fileName} />

              <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={reset}
                  style={{
                    background: 'transparent', border: '1px solid var(--border)',
                    color: 'var(--muted2)', borderRadius: 10, padding: '11px 20px',
                    fontSize: 13, cursor: 'pointer',
                  }}
                >
                  Remove file
                </motion.button>
                <motion.button
                  id="run-analysis-btn"
                  whileHover={{ scale: 1.02, boxShadow: '0 0 24px rgba(123,140,222,0.35)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleRunAnalysis}
                  style={{
                    background: 'linear-gradient(135deg, var(--accent) 0%, #4f46e5 100%)',
                    border: 'none', color: '#fff', borderRadius: 10, padding: '11px 28px',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    boxShadow: '0 0 16px rgba(123,140,222,0.25)',
                  }}
                >
                  Run Analysis →
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
