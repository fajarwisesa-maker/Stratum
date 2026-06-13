// src/components/dashboard/SimulatorPanel.jsx
import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { FEATURE_SCHEMA } from '../../data/featureSchema';
import { postSimulate } from '../../api/client';

// Top 4 biscuit SHAP drivers (moisture, water activity, microbial, peroxide)
const SIM_PARAMS = ['moisture_pct', 'water_activity', 'microbial_cfu_g', 'peroxide_value'];

export function SimulatorPanel() {
  const batchResults   = useAnalysisStore((s) => s.batchResults);
  const activeSampleId = useAnalysisStore((s) => s.activeSampleId);
  const activeSample   = batchResults.find((r) => r.id === activeSampleId) ?? batchResults[0];

  const originalParams = useMemo(() => {
    if (!activeSample) return {};
    return SIM_PARAMS.reduce((acc, k) => {
      const schema = FEATURE_SCHEMA.find(f => f.key === k);
      acc[k] = Number(activeSample.parameters?.[k] ?? schema?.min ?? 0);
      return acc;
    }, {});
  }, [activeSample?.id]);

  const [simParams, setSimParams] = useState({});
  const [simulated, setSimulated] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [apiErr, setApiErr]       = useState(null);
  const debounce = useRef(null);

  useEffect(() => {
    if (Object.keys(originalParams).length > 0) {
      setSimParams(originalParams);
      setSimulated(null);
      setApiErr(null);
    }
  }, [activeSampleId]);

  if (!activeSample || Object.keys(simParams).length === 0) return null;

  const handleChange = (key, val) => {
    const newParams = { ...simParams, [key]: Number(val) };
    setSimParams(newParams);

    // Debounce API call
    clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      const changedKey = SIM_PARAMS.find(k => Math.abs((newParams[k] ?? 0) - (originalParams[k] ?? 0)) > 1e-6);
      if (!changedKey) { setSimulated(null); return; }

      // Build full params for API (use activeSample params as base)
      const fullBase = { ...activeSample.parameters };
      SIM_PARAMS.forEach(k => { fullBase[k] = newParams[k]; });

      setLoading(true);
      setApiErr(null);
      try {
        const res = await postSimulate(activeSample.parameters, changedKey, newParams[changedKey]);
        setSimulated({ prediction: res.new_prediction, confidence: res.new_confidence });
      } catch (err) {
        setApiErr('API unavailable — using local estimate');
        // Fallback local estimate using biscuit domain knowledge
        let deltaConf = 0;
        SIM_PARAMS.forEach(k => {
          const orig = originalParams[k] || 1;
          const diff = (newParams[k] - orig) / orig;
          // Higher moisture/water_activity/microbial/peroxide → lower PASS prob
          deltaConf += (['moisture_pct','water_activity','microbial_cfu_g','peroxide_value'].includes(k)
            ? -diff * 0.18 : diff * 0.05);
        });
        const newConf = Math.max(0.05, Math.min(0.99, activeSample.confidence + deltaConf));
        setSimulated({ prediction: newConf >= 0.5 ? 'PASS' : 'FAIL', confidence: newConf });
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  const isModified = (key) => Math.abs((simParams[key] ?? 0) - (originalParams[key] ?? 0)) > 0.0001;
  const origConf   = activeSample.confidence;
  const simConf    = simulated?.confidence ?? origConf;
  const delta      = simulated ? ((simConf - origConf) * 100).toFixed(1) : null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>What-If Simulator</span>
        <span style={{ fontSize: 10, color: 'var(--muted)' }}>Live API predictions</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {SIM_PARAMS.map((key) => {
          const schema   = FEATURE_SCHEMA.find(f => f.key === key);
          if (!schema) return null;
          const modified = isModified(key);
          const origVal  = originalParams[key] ?? 0;
          const currVal  = simParams[key] ?? 0;
          const diffVal  = currVal - origVal;

          return (
            <div key={key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: modified ? 'var(--amber)' : 'var(--muted2)', fontWeight: 500 }}>
                  {schema.label}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="mono" style={{ fontSize: 11, color: modified ? 'var(--amber)' : 'var(--text)', fontWeight: 500 }}>
                    {Number(currVal).toFixed(schema.step < 0.001 ? 4 : schema.step < 0.01 ? 3 : schema.step < 0.1 ? 2 : 1)}
                    <span style={{ fontSize: 9, color: 'var(--muted)', marginLeft: 2 }}>{schema.unit}</span>
                  </span>
                  {modified && (
                    <span className="mono" style={{
                      fontSize: 9, color: 'var(--amber)',
                      background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)',
                      borderRadius: 3, padding: '1px 4px',
                    }}>
                      {diffVal > 0 ? '+' : ''}{diffVal.toFixed(schema.step < 0.1 ? 2 : 1)}
                    </span>
                  )}
                </div>
              </div>
              <input
                type="range"
                className={modified ? 'modified' : ''}
                min={schema.min} max={schema.max} step={schema.step}
                value={currVal}
                onChange={(e) => handleChange(key, e.target.value)}
              />
            </div>
          );
        })}
      </div>

      {apiErr && (
        <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 8, fontStyle: 'italic' }}>{apiErr}</div>
      )}

      {/* Result */}
      <div style={{
        marginTop: 16, padding: '12px 14px',
        background: 'rgba(12,14,20,0.5)', border: '1px solid var(--border)', borderRadius: 10,
      }}>
        <div className="label-xs" style={{ fontSize: 8, marginBottom: 8 }}>SIMULATED RESULT</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 2 }}>Original</div>
            <span style={{ fontSize: 12, fontWeight: 700, color: activeSample.prediction === 'PASS' ? 'var(--pass)' : 'var(--fail)' }}>
              {activeSample.prediction} {(origConf * 100).toFixed(1)}%
            </span>
          </div>
          <span style={{ color: 'var(--muted)', fontSize: 14 }}>{loading ? '⟳' : '→'}</span>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 2 }}>Simulated</div>
            <span style={{
              fontSize: 12, fontWeight: 700,
              color: simulated ? (simulated.prediction === 'PASS' ? 'var(--pass)' : 'var(--fail)') : 'var(--muted)',
            }}>
              {simulated ? `${simulated.prediction} ${(simConf * 100).toFixed(1)}%` : '—'}
            </span>
          </div>
        </div>
        {delta && (
          <div style={{ marginTop: 8, fontSize: 10, textAlign: 'center', color: Number(delta) >= 0 ? 'var(--pass)' : 'var(--amber)' }}>
            Confidence {Number(delta) >= 0 ? 'increased' : 'decreased'} by {Math.abs(Number(delta))}%
          </div>
        )}
      </div>
    </div>
  );
}
