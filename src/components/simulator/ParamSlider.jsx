// src/components/simulator/ParamSlider.jsx
import { motion } from 'framer-motion';
import { useSimulatorStore } from '../../store/useSimulatorStore';
import { FEATURE_MAP } from '../../data/featureSchema';

export function ParamSlider({ paramKey }) {
  const sliderValues = useSimulatorStore((s) => s.sliderValues);
  const baseParams   = useSimulatorStore((s) => s.baseParams);
  const setParam     = useSimulatorStore((s) => s.setParam);

  const schema  = FEATURE_MAP[paramKey] || { min: 0, max: 100, step: 1, unit: '', label: paramKey };
  const value   = parseFloat(sliderValues[paramKey] ?? baseParams[paramKey] ?? schema.min);
  const base    = parseFloat(baseParams[paramKey] ?? value);
  const changed = Math.abs(value - base) > 1e-6;
  const pct     = Math.min(100, Math.max(0, ((value - schema.min) / (schema.max - schema.min)) * 100));

  const decimals = schema.step < 0.001 ? 4 : schema.step < 0.01 ? 3 : schema.step < 0.1 ? 2 : 1;

  return (
    <div style={{
      background: changed ? 'rgba(123,140,222,0.06)' : 'var(--surface2)',
      border: `1px solid ${changed ? 'rgba(123,140,222,0.25)' : 'var(--border)'}`,
      borderRadius: 12, padding: '14px 16px', transition: 'all 0.2s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{schema.label}</span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{
            fontSize: 14, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
            color: changed ? 'var(--accent2)' : 'var(--text)',
          }}>
            {value.toFixed(decimals)}
          </span>
          <span style={{ fontSize: 11, color: 'var(--muted)' }}>{schema.unit}</span>
          {changed && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              style={{
                fontSize: 10, color: 'var(--accent2)', marginLeft: 4,
                background: 'rgba(123,140,222,0.1)', borderRadius: 4, padding: '1px 5px',
              }}
            >
              {value > base ? '▲' : '▼'} {Math.abs(value - base).toFixed(decimals)}
            </motion.span>
          )}
        </div>
      </div>

      <div style={{ position: 'relative', height: 6, background: 'var(--border)', borderRadius: 3 }}>
        <motion.div
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.1 }}
          style={{
            height: '100%', borderRadius: 3,
            background: changed
              ? 'linear-gradient(90deg, var(--accent) 0%, var(--accent2) 100%)'
              : 'linear-gradient(90deg, var(--muted) 0%, var(--muted2) 100%)',
          }}
        />
        <input
          type="range"
          min={schema.min} max={schema.max} step={schema.step} value={value}
          onChange={(e) => setParam(paramKey, parseFloat(e.target.value))}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', margin: 0 }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: 'var(--muted)' }}>
        <span>{schema.min}</span>
        <span>Base: {base.toFixed(decimals)} {schema.unit}</span>
        <span>{schema.max}</span>
      </div>
    </div>
  );
}
