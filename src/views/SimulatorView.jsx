// src/views/SimulatorView.jsx
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TopBar } from '../components/layout/TopBar';
import { ParamSlider } from '../components/simulator/ParamSlider';
import { PredictionDelta } from '../components/simulator/PredictionDelta';
import { SHAPWaterfall } from '../components/dashboard/SHAPWaterfall';
import { useAnalysisStore } from '../store/useAnalysisStore';
import { useSimulatorStore } from '../store/useSimulatorStore';
import { FEATURE_SCHEMA, DEFAULT_PARAMS } from '../data/featureSchema';
import { postSimulate } from '../api/client';
import { pageTransition } from '../design/animations';

export function SimulatorView() {
  const navigate       = useNavigate();
  const batchResults   = useAnalysisStore((s) => s.batchResults);
  const activeSampleId = useAnalysisStore((s) => s.activeSampleId);
  const initFromSample = useSimulatorStore((s) => s.initFromSample);
  const resetSim       = useSimulatorStore((s) => s.resetSim);
  const simResult      = useSimulatorStore((s) => s.simResult);
  const baseResult     = useSimulatorStore((s) => s.baseResult);
  const sliderValues   = useSimulatorStore((s) => s.sliderValues);
  const baseParams     = useSimulatorStore((s) => s.baseParams);
  const setSimResult   = useSimulatorStore((s) => s.setSimResult);
  const setSimulating  = useSimulatorStore((s) => s.setSimulating);

  const [apiError, setApiError] = useState(null);
  const debounceRef = useRef(null);

  const activeSample = batchResults.find((r) => r.id === activeSampleId) ?? batchResults[0];

  useEffect(() => {
    if (activeSample) {
      // Ensure sample has wine-compatible parameters
      const params = { ...DEFAULT_PARAMS, ...activeSample.parameters };
      const enriched = { ...activeSample, parameters: params };
      initFromSample(enriched);
    }
  }, [activeSample?.id]);

  // Debounced simulate call on slider change
  useEffect(() => {
    if (!baseResult || !baseParams || Object.keys(sliderValues).length === 0) return;

    // Find changed param
    const changedKey = Object.keys(sliderValues).find(
      (k) => Math.abs((sliderValues[k] ?? 0) - (baseParams[k] ?? 0)) > 1e-6
    );

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSimulating(true);
      setApiError(null);

      if (changedKey) {
        try {
          // postSimulate sends { base_parameters, modified_param, new_value }
          // and returns the full comparison: original vs modified prediction + shap_delta
          const result = await postSimulate(
            baseParams,
            changedKey,
            sliderValues[changedKey],
          );
          setSimResult({
            // New API fields — available directly on result
            new_prediction:      result.new_prediction,
            new_confidence:      result.new_confidence,
            original_prediction: result.original_prediction,
            original_confidence: result.original_confidence,
            verdict_changed:     result.verdict_changed,
            modified_param:      result.modified_param,
            old_value:           result.old_value,
            new_value:           result.new_value,
            shap_delta:          result.shap_delta ?? {},
            // SHAP waterfall values: use base SHAP adjusted by delta when available
            shap_values:         baseResult.shap_values,
            feature_names:       FEATURE_SCHEMA.map(f => f.key),
          });
        } catch (err) {
          setApiError(err.message);
          // Fallback: keep current result
          setSimulating(false);
        }
      } else {
        // No change — reset sim
        setSimResult(null);
        setSimulating(false);
      }
    }, 600);

    return () => clearTimeout(debounceRef.current);
  }, [sliderValues]);

  return (
    <motion.div {...pageTransition}>
      <TopBar
        title="Parameter Simulator"
        subtitle="Adjust parameters to simulate prediction changes (live API)"
      />

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', height: 'calc(100vh - 65px)' }}>
        {/* Left — sliders */}
        <div style={{
          borderRight: '1px solid var(--border)', padding: '24px 20px',
          overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
              Parameters
              <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 6, fontWeight: 400 }}>
                {activeSample?.id}
              </span>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={resetSim}
              style={{
                fontSize: 11, color: 'var(--muted)', background: 'var(--surface2)',
                border: '1px solid var(--border)', borderRadius: 7,
                padding: '5px 12px', cursor: 'pointer',
              }}
            >
              Reset
            </motion.button>
          </div>

          {FEATURE_SCHEMA.map((f) => (
            <ParamSlider key={f.key} paramKey={f.key} />
          ))}
        </div>

        {/* Right — output */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <PredictionDelta />

          {apiError && (
            <div style={{
              padding: '10px 14px', borderRadius: 10, fontSize: 12,
              background: 'rgba(251,113,133,0.08)', border: '1px solid rgba(251,113,133,0.25)',
              color: 'var(--fail)',
            }}>
              ⚠ {apiError} — showing last known result.
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="glass" style={{ padding: 20 }}>
              <SHAPWaterfall
                shapValues={baseResult?.shap_values}
                featureNames={FEATURE_SCHEMA.map(f => f.key)}
                title="Original SHAP"
              />
            </div>
            <div className="glass" style={{ padding: 20 }}>
              <SHAPWaterfall
                shapValues={simResult?.shap_values ?? baseResult?.shap_values}
                featureNames={FEATURE_SCHEMA.map(f => f.key)}
                title="Simulated SHAP"
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
