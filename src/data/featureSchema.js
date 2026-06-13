// src/data/featureSchema.js
/**
 * Biscuit Quality feature schema — SNI 01-2973-2011
 * label: 1 = PASS, 0 = FAIL
 * Dataset: biscuit_synthetic.csv (n=2,000)
 * AI Open Innovation Challenge 2026
 */

export const FEATURE_SCHEMA = [
  { key: "moisture_pct",    label: "Moisture (%)",           unit: "%",        min: 0.0,  max: 15.0,  step: 0.1,   sni_max: 5.0  },
  { key: "fat_pct",         label: "Fat Content (%)",        unit: "%",        min: 0.0,  max: 50.0,  step: 0.1,   sni_max: null },
  { key: "protein_pct",     label: "Protein (%)",            unit: "%",        min: 0.0,  max: 30.0,  step: 0.1,   sni_max: null },
  { key: "ash_pct",         label: "Ash Content (%)",        unit: "%",        min: 0.0,  max: 6.0,   step: 0.01,  sni_max: 3.0  },
  { key: "water_activity",  label: "Water Activity (Aw)",    unit: "Aw",       min: 0.0,  max: 1.0,   step: 0.01,  sni_max: 0.70 },
  { key: "ph",              label: "pH Level",               unit: "",         min: 3.0,  max: 10.0,  step: 0.01,  sni_max: null },
  { key: "peroxide_value",  label: "Peroxide Value",         unit: "meq/kg",   min: 0.0,  max: 30.0,  step: 0.1,   sni_max: 10.0 },
  { key: "microbial_cfu_g", label: "Microbial Count",        unit: "CFU/g",    min: 0.0,  max: 1000,  step: 1,     sni_max: 500  },
  { key: "hardness_n",      label: "Hardness (N)",           unit: "N",        min: 0.0,  max: 200.0, step: 0.1,   sni_max: null },
  { key: "thickness_mm",    label: "Thickness (mm)",         unit: "mm",       min: 0.0,  max: 20.0,  step: 0.1,   sni_max: null },
  { key: "weight_g",        label: "Weight (g)",             unit: "g",        min: 0.0,  max: 50.0,  step: 0.1,   sni_max: null },
];

/** Default values — realistic biscuit batch */
export const DEFAULT_PARAMS = {
  moisture_pct:    4.2,
  fat_pct:         18.5,
  protein_pct:     6.8,
  ash_pct:         1.7,
  water_activity:  0.61,
  ph:              6.9,
  peroxide_value:  3.1,
  microbial_cfu_g: 150,
  hardness_n:      47,
  thickness_mm:    7.6,
  weight_g:        12.2,
};

/** Map key → schema entry for O(1) lookups */
export const FEATURE_MAP = Object.fromEntries(FEATURE_SCHEMA.map((f) => [f.key, f]));
