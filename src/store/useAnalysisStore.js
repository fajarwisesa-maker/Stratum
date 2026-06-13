// src/store/useAnalysisStore.js
import { create } from 'zustand';
import { MOCK_BATCH_RESULTS } from '../data/mockData';

export const useAnalysisStore = create((set, get) => ({
  batchResults:    [],
  activeSampleId:  null,
  featureNames:    [],
  parsedCSV:       null,
  isLoading:       false,
  error:           null,
  useMockData:     false,

  get activeSample() {
    const { batchResults, activeSampleId } = get();
    return batchResults.find((r) => r.id === activeSampleId) ?? batchResults[0] ?? null;
  },

  setParsedCSV:  (rows) => set({ parsedCSV: rows }),
  setLoading:    (v)    => set({ isLoading: v }),
  setError:      (e)    => set({ error: e }),

  setBatchResults: (results) =>
    set({
      batchResults:   results,
      activeSampleId: results[0]?.id ?? null,
      featureNames:   results[0]?.feature_names ?? [],
      isLoading:      false,
      error:          null,
    }),

  setActiveSample: (id) => set({ activeSampleId: id }),

  loadMockData: () =>
    set({
      batchResults:    MOCK_BATCH_RESULTS,
      activeSampleId:  MOCK_BATCH_RESULTS[0].id,
      featureNames:    MOCK_BATCH_RESULTS[0].feature_names,
      isLoading:       false,
      error:           null,
      useMockData:     true,
    }),

  loadSession: (session) =>
    set({
      batchResults:    session.batchResults,
      activeSampleId:  session.batchResults[0]?.id ?? null,
      featureNames:    session.batchResults[0]?.feature_names ?? [],
      useMockData:     false,
    }),

  reset: () =>
    set({
      batchResults:   [],
      activeSampleId: null,
      featureNames:   [],
      parsedCSV:      null,
      isLoading:      false,
      error:          null,
      useMockData:    false,
    }),
}));
