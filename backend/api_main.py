"""
STRATUM — FastAPI Backend (Dual-Schema)
Supports: Biscuit Quality (SNI 01-2973-2011) + UCI Wine Quality
Auto-detects dataset type from CSV columns.
Run: uvicorn api_main:app --reload --port 8000
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import json, io
import numpy as np
import pandas as pd
import joblib

# ── Import all Pydantic schemas from schema.py (single source of truth) ──
from utils.schema import (
    BiscuitParams,
    SimulateRequest,
    SimulateResponse,
    ClusterResponse,
    PredictResponse,
    BatchResponse,
    TopFactor,
    SNIViolation,
)

BASE      = os.path.dirname(os.path.abspath(__file__))
ARTIFACTS = os.path.join(BASE, "artifacts")

# ── Biscuit schema (SNI 01-2973-2011) ────────────────────────────
BISCUIT_KEYS = [
    "moisture_pct", "fat_pct", "protein_pct", "ash_pct",
    "water_activity", "ph", "peroxide_value", "microbial_cfu_g",
    "hardness_n", "thickness_mm", "weight_g"
]
BISCUIT_LABELS = {
    "moisture_pct":    "Moisture (%)",
    "fat_pct":         "Fat Content (%)",
    "protein_pct":     "Protein (%)",
    "ash_pct":         "Ash Content (%)",
    "water_activity":  "Water Activity (Aw)",
    "ph":              "pH Level",
    "peroxide_value":  "Peroxide Value (meq/kg)",
    "microbial_cfu_g": "Microbial Count (CFU/g)",
    "hardness_n":      "Hardness (N)",
    "thickness_mm":    "Thickness (mm)",
    "weight_g":        "Weight (g)",
}
SNI_LIMITS = {
    "moisture_pct":    {"max": 5.0,   "unit": "%"},
    "ash_pct":         {"max": 3.0,   "unit": "%"},
    "water_activity":  {"max": 0.70,  "unit": "Aw"},
    "peroxide_value":  {"max": 10.0,  "unit": "meq/kg"},
    "microbial_cfu_g": {"max": 500.0, "unit": "CFU/g"},
}

# ── Wine schema (UCI Wine Quality) ───────────────────────────────
WINE_KEYS = [
    "fixed_acidity", "volatile_acidity", "citric_acid", "residual_sugar",
    "chlorides", "free_sulfur_dioxide", "total_sulfur_dioxide",
    "density", "ph", "sulphates", "alcohol"
]
WINE_ORIG_COLS = [
    "fixed acidity", "volatile acidity", "citric acid", "residual sugar",
    "chlorides", "free sulfur dioxide", "total sulfur dioxide",
    "density", "pH", "sulphates", "alcohol"
]

# ── K-Means cluster labels (k=4, SNI 2973:2011 failure modes) ────
CLUSTER_LABELS: dict[int, str] = {
    0: "Low Risk — Nominal Parameters",
    1: "Moisture / Water Activity Risk",
    2: "Microbial Contamination Risk",
    3: "Multi-Parameter Non-Conformance",
}

# Dominant failure features per cluster (domain knowledge mapping)
CLUSTER_FAILURE_FEATURES: dict[int, list[str]] = {
    0: [],
    1: ["moisture_pct", "water_activity"],
    2: ["microbial_cfu_g", "peroxide_value"],
    3: ["moisture_pct", "ash_pct", "microbial_cfu_g", "peroxide_value"],
}

# Peer batch counts per cluster (estimated from training distribution)
CLUSTER_PEER_COUNTS: dict[int, int] = {
    0: 892,
    1: 387,
    2: 421,
    3: 300,
}

CLUSTER_DESCRIPTIONS: dict[int, str] = {
    0: (
        "Batch ini masuk ke cluster parameter nominal dengan risiko rendah. "
        "Semua parameter utama berada dalam batas SNI 01-2973-2011 dan tidak ada "
        "pola kegagalan yang teridentifikasi."
    ),
    1: (
        "Batch ini masuk ke cluster dengan pola kegagalan moisture/water-activity tinggi. "
        "Kadar air atau aktivitas air yang melampaui ambang SNI meningkatkan risiko "
        "pertumbuhan jamur dan penurunan shelf-life produk."
    ),
    2: (
        "Batch ini masuk ke cluster dengan pola kontaminasi mikrobiologis. "
        "Jumlah CFU/g dan/atau peroxide value yang tinggi mengindikasikan risiko "
        "keamanan pangan yang perlu ditindaklanjuti sebelum distribusi."
    ),
    3: (
        "Batch ini masuk ke cluster non-konformansi multi-parameter. "
        "Beberapa parameter secara bersamaan menyimpang dari standar SNI 01-2973-2011, "
        "menunjukkan potensi masalah sistemik pada proses produksi."
    ),
}

# ── Model caches ──────────────────────────────────────────────────
_biscuit_model     = _biscuit_scaler    = _biscuit_explainer = None
_wine_model        = _wine_scaler       = _wine_explainer    = None
_kmeans_model      = None


def get_biscuit_models():
    global _biscuit_model, _biscuit_scaler, _biscuit_explainer
    if _biscuit_model is None:
        mp = os.path.join(ARTIFACTS, "biscuit_model.joblib")
        sp = os.path.join(ARTIFACTS, "biscuit_scaler.joblib")
        if not os.path.exists(mp):
            raise RuntimeError("Biscuit model not found. Run: python train_biscuit.py")
        _biscuit_model  = joblib.load(mp)
        _biscuit_scaler = joblib.load(sp)
        import shap as _shap
        _biscuit_explainer = _shap.TreeExplainer(_biscuit_model)
    return _biscuit_model, _biscuit_scaler, _biscuit_explainer


def get_wine_models():
    global _wine_model, _wine_scaler, _wine_explainer
    if _wine_model is None:
        mp = os.path.join(ARTIFACTS, "xgboost_wine.joblib")
        sp = os.path.join(ARTIFACTS, "scaler_wine.joblib")
        if not os.path.exists(mp):
            raise RuntimeError("Wine model not found (xgboost_wine.joblib missing).")
        _wine_model  = joblib.load(mp)
        _wine_scaler = joblib.load(sp)
        import shap as _shap
        _wine_explainer = _shap.TreeExplainer(_wine_model)
    return _wine_model, _wine_scaler, _wine_explainer


def get_kmeans_model():
    """Lazy-load the K-Means clustering model."""
    global _kmeans_model
    if _kmeans_model is None:
        kp = os.path.join(ARTIFACTS, "kmeans_stratum.joblib")
        if not os.path.exists(kp):
            raise RuntimeError("K-Means model not found (kmeans_stratum.joblib missing).")
        _kmeans_model = joblib.load(kp)
    return _kmeans_model


# ── App ───────────────────────────────────────────────────────────
app = FastAPI(
    title="STRATUM API",
    description="Quality Intelligence | Biscuit (SNI) + Wine (UCI) | XGBoost + SHAP + K-Means",
    version="3.2.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)
app.mount("/artifacts", StaticFiles(directory=ARTIFACTS), name="artifacts")


# ── Helpers ───────────────────────────────────────────────────────
def _check_sni(params: dict) -> list:
    violations = []
    for k, limit in SNI_LIMITS.items():
        val = params.get(k, 0)
        if val > limit["max"]:
            violations.append({
                "feature": k, "label": BISCUIT_LABELS[k],
                "value": val, "limit": limit["max"], "unit": limit["unit"],
            })
    return violations


def _run_prediction(model, scaler, explainer, feature_keys: list, params: dict, is_biscuit: bool) -> dict:
    row = pd.DataFrame([[params[k] for k in feature_keys]], columns=feature_keys)
    row_scaled = pd.DataFrame(scaler.transform(row), columns=feature_keys)

    prob = model.predict_proba(row_scaled)[0]
    pred_class = int(np.argmax(prob))
    confidence = float(prob[pred_class])
    verdict    = "PASS" if pred_class == 1 else "FAIL"

    sv = explainer(row_scaled)
    shap_vals = sv.values[0].tolist()

    top_factors = sorted(
        [{"feature": feature_keys[i], "impact": round(float(shap_vals[i]), 5)}
         for i in range(len(feature_keys))],
        key=lambda x: abs(x["impact"]), reverse=True
    )[:5]

    return {
        "prediction":     verdict,
        "confidence":     round(confidence, 4),
        "class_id":       pred_class,
        "shap_values":    [round(v, 5) for v in shap_vals],
        "feature_names":  feature_keys,
        "top_factors":    top_factors,
        "sni_violations": _check_sni(params) if is_biscuit else [],
        "dataset_type":   "biscuit" if is_biscuit else "wine",
    }


def _detect_and_predict(df_row: dict) -> dict:
    """Auto-detect schema and run prediction."""
    keys = set(df_row.keys())
    if all(k in keys for k in BISCUIT_KEYS):
        model, scaler, explainer = get_biscuit_models()
        params = {k: float(df_row[k]) for k in BISCUIT_KEYS}
        return _run_prediction(model, scaler, explainer, BISCUIT_KEYS, params, is_biscuit=True)
    elif all(k in keys for k in WINE_KEYS):
        model, scaler, explainer = get_wine_models()
        params = {k: float(df_row[k]) for k in WINE_KEYS}
        return _run_prediction(model, scaler, explainer, WINE_KEYS, params, is_biscuit=False)
    else:
        raise ValueError(f"Cannot detect dataset type. Available keys: {list(keys)[:5]}...")


# ── Endpoints ─────────────────────────────────────────────────────

@app.get("/health")
def health():
    b_ok = w_ok = k_ok = False
    try: get_biscuit_models(); b_ok = True
    except Exception: pass
    try: get_wine_models(); w_ok = True
    except Exception: pass
    try: get_kmeans_model(); k_ok = True
    except Exception: pass
    return {
        "status": "ok", "version": "3.2.0",
        "biscuit_model": b_ok, "wine_model": w_ok, "kmeans_model": k_ok,
    }


@app.post("/predict")
def predict(req: BiscuitParams):
    model, scaler, explainer = get_biscuit_models()
    return _run_prediction(model, scaler, explainer, BISCUIT_KEYS, req.model_dump(), is_biscuit=True)


@app.post("/cluster")
def cluster(req: BiscuitParams):
    """
    Assign a biscuit batch to a K-Means failure pattern cluster.

    Uses kmeans_stratum.joblib (k=4) with SNI 01-2973-2011-derived cluster labels.
    Returns cluster ID, human-readable label, peer count, and dominant failure features.
    """
    kmeans = get_kmeans_model()
    # Use biscuit scaler for consistent feature scaling
    _, scaler, _ = get_biscuit_models()

    params = req.model_dump()
    row = pd.DataFrame([[params[k] for k in BISCUIT_KEYS]], columns=BISCUIT_KEYS)
    row_scaled = scaler.transform(row)

    cluster_id = int(kmeans.predict(row_scaled)[0])

    # Clamp to known labels in case model has more/fewer clusters than expected
    cluster_id = max(0, min(cluster_id, len(CLUSTER_LABELS) - 1))

    return {
        "cluster_id":                cluster_id,
        "cluster_label":             CLUSTER_LABELS[cluster_id],
        "peer_batch_count":          CLUSTER_PEER_COUNTS[cluster_id],
        "dominant_failure_features": CLUSTER_FAILURE_FEATURES[cluster_id],
        "description":               CLUSTER_DESCRIPTIONS[cluster_id],
    }


@app.post("/simulate")
def simulate(req: SimulateRequest):
    """
    What-if simulation: compare original prediction vs prediction after
    modifying a single parameter.

    Body: { base_parameters: {...}, modified_param: "moisture_pct", new_value: 6.5 }
    """
    model, scaler, explainer = get_biscuit_models()

    base_params = req.base_parameters.model_dump()
    mod_key     = req.modified_param
    new_val     = req.new_value

    # Validate the modified_param key
    if mod_key not in BISCUIT_KEYS:
        raise HTTPException(
            status_code=422,
            detail=f"Unknown parameter '{mod_key}'. Must be one of: {BISCUIT_KEYS}"
        )

    old_val = base_params[mod_key]

    # Original prediction
    orig = _run_prediction(model, scaler, explainer, BISCUIT_KEYS, base_params, is_biscuit=True)

    # Modified prediction
    mod_params = {**base_params, mod_key: new_val}
    modified   = _run_prediction(model, scaler, explainer, BISCUIT_KEYS, mod_params, is_biscuit=True)

    # Compute per-feature SHAP delta (modified - original)
    shap_delta = {
        BISCUIT_KEYS[i]: round(
            float(modified["shap_values"][i]) - float(orig["shap_values"][i]), 5
        )
        for i in range(len(BISCUIT_KEYS))
    }

    return {
        "original_prediction": orig["prediction"],
        "original_confidence": orig["confidence"],
        "new_prediction":      modified["prediction"],
        "new_confidence":      modified["confidence"],
        "modified_param":      mod_key,
        "old_value":           round(old_val, 5),
        "new_value":           round(new_val, 5),
        "verdict_changed":     orig["prediction"] != modified["prediction"],
        "shap_delta":          shap_delta,
    }


@app.post("/batch")
async def batch(file: UploadFile = File(...)):
    content = await file.read()
    text = content.decode("utf-8", errors="replace")
    sep = ";" if ";" in text.split("\n")[0] else ","
    try:
        df = pd.read_csv(io.StringIO(text), sep=sep)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CSV parse error: {e}")

    # Normalize column names (handles "fixed acidity" → "fixed_acidity", "pH" → "ph")
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
    col_set = set(df.columns)

    # Detect schema
    is_biscuit = all(k in col_set for k in BISCUIT_KEYS)
    is_wine    = all(k in col_set for k in WINE_KEYS)

    if not is_biscuit and not is_wine:
        b_miss = [k for k in BISCUIT_KEYS if k not in col_set]
        w_miss = [k for k in WINE_KEYS    if k not in col_set]
        fewer  = b_miss if len(b_miss) <= len(w_miss) else w_miss
        label  = "biscuit" if len(b_miss) <= len(w_miss) else "wine"
        raise HTTPException(status_code=422,
            detail=f"Unrecognised dataset. Closest: {label}. Missing: {fewer}")

    if is_biscuit:
        model, scaler, explainer = get_biscuit_models()
        feature_keys = BISCUIT_KEYS
    else:
        model, scaler, explainer = get_wine_models()
        feature_keys = WINE_KEYS
        # For wine: binarize quality column if present (quality >= 6 → label 1)
        if "quality" in df.columns and "label" not in df.columns:
            df["label"] = (df["quality"] >= 6).astype(int)

    rows = []
    for i, row_dict in enumerate(df[feature_keys].to_dict(orient="records")):
        row_dict = {k: float(v) if pd.notna(v) else 0.0 for k, v in row_dict.items()}
        res = _run_prediction(model, scaler, explainer, feature_keys, row_dict, is_biscuit=is_biscuit)
        rows.append({
            "id":             f"BATCH-{str(i+1).zfill(3)}",
            "prediction":     res["prediction"],
            "confidence":     res["confidence"],
            "class_id":       res["class_id"],
            "parameters":     row_dict,
            "shap_values":    res["shap_values"],
            "feature_names":  res["feature_names"],
            "top_factors":    res["top_factors"],
            "sni_violations": res["sni_violations"],
            "dataset_type":   res["dataset_type"],
        })

    pass_count = sum(1 for r in rows if r["prediction"] == "PASS")
    return {
        "rows": rows,
        "dataset_type": "biscuit" if is_biscuit else "wine",
        "summary": {
            "total":      len(rows),
            "pass_count": pass_count,
            "fail_count": len(rows) - pass_count,
        }
    }


@app.get("/metrics")
def metrics():
    mp = os.path.join(ARTIFACTS, "metrics.json")
    if not os.path.exists(mp):
        raise HTTPException(status_code=404, detail="Run train_biscuit.py first.")
    with open(mp) as f: return json.load(f)


@app.get("/feature-importance")
def feature_importance():
    fp = os.path.join(ARTIFACTS, "feature_importance.json")
    if not os.path.exists(fp):
        raise HTTPException(status_code=404, detail="Run train_biscuit.py first.")
    with open(fp) as f: return json.load(f)


@app.get("/sni-limits")
def sni_limits():
    return {k: {**v, "label": BISCUIT_LABELS[k]} for k, v in SNI_LIMITS.items()}


@app.get("/shap-summary")
def shap_summary():
    """
    Return SHAP feature importance summary from the pre-computed artifact.
    File: artifacts/shap_summary.json
    """
    sp = os.path.join(ARTIFACTS, "shap_summary.json")
    if not os.path.exists(sp):
        raise HTTPException(
            status_code=404,
            detail="shap_summary.json not found. Run train_biscuit.py to generate it."
        )
    with open(sp) as f:
        return json.load(f)
