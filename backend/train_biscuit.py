"""
STRATUM — Biscuit ML Pipeline
Trains XGBoost on biscuit_synthetic.csv and saves artifacts.
Run: python train_biscuit.py
"""
import os, json, warnings
import numpy as np
import pandas as pd
import joblib
import shap
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_validate
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import f1_score, precision_score, recall_score, roc_auc_score
import xgboost as xgb
warnings.filterwarnings("ignore")

BASE      = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE, "data", "biscuit_synthetic.csv")
MODELS    = os.path.join(BASE, "artifacts")

FEATURE_NAMES = [
    "moisture_pct", "fat_pct", "protein_pct", "ash_pct",
    "water_activity", "ph", "peroxide_value", "microbial_cfu_g",
    "hardness_n", "thickness_mm", "weight_g"
]

os.makedirs(MODELS, exist_ok=True)

# ── Load data ─────────────────────────────────────────────────────
df = pd.read_csv(DATA_PATH)
X  = df[FEATURE_NAMES]
y  = df["label"]
print(f"Loaded {len(df)} rows | PASS(0): {(y==0).sum()} | FAIL(1): {(y==1).sum()}")

# ── Scale ─────────────────────────────────────────────────────────
scaler   = StandardScaler()
X_scaled = pd.DataFrame(scaler.fit_transform(X), columns=FEATURE_NAMES)

# ── Train XGBoost with 5-Fold CV ──────────────────────────────────
neg, pos = (y==0).sum(), (y==1).sum()
model = xgb.XGBClassifier(
    n_estimators=300, max_depth=5, learning_rate=0.05,
    subsample=0.8, colsample_bytree=0.8, min_child_weight=3,
    gamma=0.1, reg_alpha=0.1, reg_lambda=1.0,
    scale_pos_weight=neg/pos, eval_metric="logloss",
    random_state=42, n_jobs=-1,
)
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_res = cross_validate(model, X_scaled, y, cv=cv,
    scoring=["f1","roc_auc","precision","recall"], n_jobs=-1)

metrics = {
    "model": "XGBoost Classifier",
    "dataset": "Biscuit Synthetic (SNI 01-2973-2011 based)",
    "cv_f1_mean":   round(float(cv_res["test_f1"].mean()),   4),
    "cv_f1_std":    round(float(cv_res["test_f1"].std()),    4),
    "cv_auc_mean":  round(float(cv_res["test_roc_auc"].mean()),4),
    "cv_precision": round(float(cv_res["test_precision"].mean()),4),
    "cv_recall":    round(float(cv_res["test_recall"].mean()),4),
}
print(f"CV F1={metrics['cv_f1_mean']:.4f} | AUC={metrics['cv_auc_mean']:.4f}")

# Train on full data
model.fit(X_scaled, y, verbose=False)

# ── SHAP feature importance ────────────────────────────────────────
explainer  = shap.TreeExplainer(model)
shap_vals  = explainer.shap_values(X_scaled)
mean_abs   = np.abs(shap_vals).mean(axis=0)
fi_list = sorted(
    [{"feature": f, "importance": round(float(v),6)} for f, v in zip(FEATURE_NAMES, mean_abs)],
    key=lambda x: -x["importance"]
)

# ── Save artifacts ─────────────────────────────────────────────────
joblib.dump(model,   os.path.join(MODELS, "biscuit_model.joblib"))
joblib.dump(scaler,  os.path.join(MODELS, "biscuit_scaler.joblib"))
with open(os.path.join(MODELS, "metrics.json"), "w") as f:
    json.dump(metrics, f, indent=2)
with open(os.path.join(MODELS, "feature_importance.json"), "w") as f:
    json.dump(fi_list, f, indent=2)

print(f"\n✅ All artifacts saved to backend/artifacts/")
print(f"   biscuit_model.joblib | biscuit_scaler.joblib | metrics.json | feature_importance.json")
print(f"\nTop 3 features:")
for fi in fi_list[:3]:
    print(f"   {fi['feature']:<25} {fi['importance']:.5f}")
