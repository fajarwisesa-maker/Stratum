// src/store/useSimulatorStore.js
import { create } from 'zustand';

export const useSimulatorStore = create((set) => ({
  baseParams:    {},
  sliderValues:  {},
  baseResult:    null,
  simResult:     null,
  isSimulating:  false,

  initFromSample: (sample) =>
    set({
      baseParams:   sample.parameters,
      sliderValues: { ...sample.parameters },
      baseResult:   { prediction: sample.prediction, confidence: sample.confidence, shap_values: sample.shap_values },
      simResult:    null,
    }),

  setParam: (key, value) =>
    set((s) => ({ sliderValues: { ...s.sliderValues, [key]: value } })),

  setSimulating: (v) => set({ isSimulating: v }),

  setSimResult: (result) => set({ simResult: result, isSimulating: false }),

  resetSim: () => set((s) => ({ sliderValues: { ...s.baseParams }, simResult: null })),
}));
