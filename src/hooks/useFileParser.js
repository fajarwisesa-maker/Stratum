// src/hooks/useFileParser.js
import { useState, useCallback } from 'react';
import Papa from 'papaparse';

// Biscuit feature keys (SNI 01-2973-2011)
const BISCUIT_KEYS = [
  'moisture_pct', 'fat_pct', 'protein_pct', 'ash_pct',
  'water_activity', 'ph', 'peroxide_value', 'microbial_cfu_g',
  'hardness_n', 'thickness_mm', 'weight_g',
];

// Wine feature keys (UCI Wine Quality) — after normalization
const WINE_KEYS = [
  'fixed_acidity', 'volatile_acidity', 'citric_acid', 'residual_sugar',
  'chlorides', 'free_sulfur_dioxide', 'total_sulfur_dioxide',
  'density', 'ph', 'sulphates', 'alcohol',
];

/** Normalize header: "Fixed Acidity" → "fixed_acidity", "pH" → "ph" */
function normalizeHeader(h) {
  return h.trim().toLowerCase().replace(/\s+/g, '_');
}

/**
 * Detect dataset type from normalized column names.
 * Returns 'biscuit' | 'wine' | null
 */
function detectDatasetType(normFields) {
  const fieldSet = new Set(normFields);
  const biscuitMatch = BISCUIT_KEYS.filter(k => fieldSet.has(k)).length;
  const wineMatch    = WINE_KEYS.filter(k => fieldSet.has(k)).length;
  if (biscuitMatch === BISCUIT_KEYS.length) return 'biscuit';
  if (wineMatch    === WINE_KEYS.length)    return 'wine';
  // Partial match — report which is closer
  return null;
}

export function useFileParser() {
  const [rows, setRows]             = useState(null);
  const [headers, setHeaders]       = useState([]);
  const [error, setError]           = useState(null);
  const [fileName, setFileName]     = useState('');
  const [rawFile, setRawFile]       = useState(null);
  const [datasetType, setDatasetType] = useState(null); // 'biscuit' | 'wine'

  const parse = useCallback((file) => {
    if (!file) return;
    setFileName(file.name);
    setError(null);
    setRawFile(null);
    setDatasetType(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const firstLine = text.split('\n')[0] || '';
      const sep = firstLine.includes(';') ? ';' : ',';

      Papa.parse(file, {
        header:         true,
        skipEmptyLines: true,
        dynamicTyping:  true,
        delimiter:      sep,
        complete: ({ data, meta, errors }) => {
          if (errors.length > 0) {
            setError(`CSV parse error: ${errors[0].message}`);
            return;
          }

          // Normalize headers
          const normFields = (meta.fields || []).map(normalizeHeader);
          const renamedData = data.map((row) => {
            const newRow = {};
            (meta.fields || []).forEach((orig, i) => {
              newRow[normFields[i]] = row[orig];
            });
            return newRow;
          });

          // Auto-detect dataset type
          const dtype = detectDatasetType(normFields);
          if (!dtype) {
            const bMissing = BISCUIT_KEYS.filter(k => !normFields.includes(k));
            const wMissing = WINE_KEYS.filter(k => !normFields.includes(k));
            const fewer = bMissing.length <= wMissing.length ? bMissing : wMissing;
            const label = bMissing.length <= wMissing.length ? 'biscuit' : 'wine';
            setError(`Unrecognised dataset. Closest match: ${label}. Missing: ${fewer.join(', ')}`);
            return;
          }

          setDatasetType(dtype);
          setHeaders(normFields);
          setRows(renamedData);
          setRawFile(file);
        },
        error: (err) => setError(err.message),
      });
    };
    reader.readAsText(file);
  }, []);

  const reset = useCallback(() => {
    setRows(null); setHeaders([]); setError(null);
    setFileName(''); setRawFile(null); setDatasetType(null);
  }, []);

  return { rows, headers, error, fileName, rawFile, datasetType, parse, reset };
}
