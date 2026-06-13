// src/api/client.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:8000";

async function apiCall(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  try {
    const res = await fetch(url, { ...options });
    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try { const j = await res.json(); detail = j.detail || detail; } catch {}
      throw new Error(detail);
    }
    return res.json();
  } catch (err) {
    if (err.message.startsWith("HTTP ")) throw err;
    throw new Error(`Cannot reach API at ${API_BASE_URL}. Is the backend running?`);
  }
}

export async function getHealth() {
  return apiCall("/health");
}

export async function postPredict(parameters) {
  // Backend expects flat BiscuitParams object (not wrapped in { parameters })
  return apiCall("/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parameters),
  });
}

export async function postBatch(file) {
  const form = new FormData();
  form.append("file", file);
  return apiCall("/batch", { method: "POST", body: form });
}

/**
 * What-if simulation: compare original prediction vs prediction
 * after modifying a single parameter.
 *
 * @param {Object} baseParameters - Full 11-parameter biscuit object
 * @param {string} modifiedParam  - Key of the parameter to change
 * @param {number} newValue       - New value for that parameter
 * @returns {Promise<{
 *   original_prediction: string,
 *   original_confidence: number,
 *   new_prediction: string,
 *   new_confidence: number,
 *   modified_param: string,
 *   old_value: number,
 *   new_value: number,
 *   verdict_changed: boolean,
 *   shap_delta: Record<string, number>
 * }>}
 */
export async function postSimulate(baseParameters, modifiedParam, newValue) {
  return apiCall("/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      base_parameters: baseParameters,
      modified_param: modifiedParam,
      new_value: newValue,
    }),
  });
}

/**
 * Assign a biscuit batch to a K-Means failure pattern cluster.
 *
 * @param {Object} parameters - Full 11-parameter biscuit object (same shape as /predict)
 * @returns {Promise<{
 *   cluster_id: number,
 *   cluster_label: string,
 *   peer_batch_count: number,
 *   dominant_failure_features: string[],
 *   description: string
 * }>}
 */
export async function postCluster(parameters) {
  return apiCall("/cluster", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parameters),
  });
}

export async function getMetrics() {
  return apiCall("/metrics");
}

/**
 * Fetch SHAP feature importance summary from the backend.
 * Served from artifacts/shap_summary.json via GET /shap-summary.
 * @returns {Promise<Array<{ feature: string, importance: number }>>}
 */
export async function getShapSummary() {
  return apiCall("/shap-summary");
}

export const SHAP_IMAGE_URLS = {
  beeswarm:      `${API_BASE_URL}/artifacts/shap_beeswarm.png`,
  waterfallFail: `${API_BASE_URL}/artifacts/shap_waterfall_fail.png`,
  waterfallPass: `${API_BASE_URL}/artifacts/shap_waterfall_pass.png`,
};
