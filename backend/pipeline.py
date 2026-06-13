# backend/pipeline.py
"""
Stratum ML Pipeline — UCI Wine Quality (proxy dataset for SPL Biscuit QA)
---------------------------------------------------------------------
Trains an XGBoost classifier with Stratified 5-Fold CV, saves:
  artifacts/model.joblib
  artifacts/metrics.json
  artifacts/shap_beeswarm.png
  artifacts/shap_waterfall_fail.png
  artifacts/shap_waterfall_pass.png
  artifacts/shap_summary.json

NOTE: This MVP uses the UCI Wine Quality dataset as a public proxy dataset
to validate Stratum's ML and explainability pipeline. The architecture is
designed to be retrained with actual SPL biscuit lab data when available.
"""

import os
import json
import warnings
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import joblib
import shap
from xgboost import XGBClassifier
from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.metrics import make_scorer, accuracy_score, precision_score, recall_score, f1_score

from utils.preprocessing import normalize_columns, FEATURE_COLUMNS

warnings.filterwarnings("ignore")

# Paths
BASE_DIR    = os.path.dirname(__file__)
DATA_PATH   = os.path.join(BASE_DIR, "data", "winequality-red.csv")
ARTIFACTS   = os.path.join(BASE_DIR, "artifacts")
MODEL_PATH  = os.path.join(ARTIFACTS, "model.joblib")
METRICS_PATH= os.path.join(ARTIFACTS, "metrics.json")
SHAP_BEESWARM   = os.path.join(ARTIFACTS, "shap_beeswarm.png")
SHAP_FAIL       = os.path.join(ARTIFACTS, "shap_waterfall_fail.png")
SHAP_PASS       = os.path.join(ARTIFACTS, "shap_waterfall_pass.png")
SHAP_SUMMARY    = os.path.join(ARTIFACTS, "shap_summary.json")


def load_data():
    df = pd.read_csv(DATA_PATH, sep=";")
    df = normalize_columns(df)
    df["status_binary"] = (df["quality"] >= 6).astype(int)
    X = df[FEATURE_COLUMNS]
    y = df["status_binary"]
    print(f"Loaded {len(df)} rows | PASS: {y.sum()} | FAIL: {(y == 0).sum()}")
    return X, y


def train_and_evaluate(X, y):
    model = XGBClassifier(
        n_estimators=300,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        eval_metric="logloss",
        random_state=42,
        use_label_encoder=False,
    )

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scoring = {
        "accuracy":  make_scorer(accuracy_score),
        "precision": make_scorer(precision_score, zero_division=0),
        "recall":    make_scorer(recall_score, zero_division=0),
        "f1":        make_scorer(f1_score, zero_division=0),
    }
    scores = cross_validate(model, X, y, cv=cv, scoring=scoring, return_train_score=False)

    metrics = {
        "model":      "XGBoost Classifier",
        "dataset":    "UCI Wine Quality - Red Wine",
        "validation": "Stratified 5-Fold Cross Validation",
        "accuracy":   round(float(scores["test_accuracy"].mean()), 4),
        "precision":  round(float(scores["test_precision"].mean()), 4),
        "recall":     round(float(scores["test_recall"].mean()), 4),
        "f1_score":   round(float(scores["test_f1"].mean()), 4),
    }
    print("CV Metrics:", metrics)

    # Train final model on full data
    model.fit(X, y)
    return model, metrics


def generate_shap(model, X, y):
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X)  # shape (n, features)

    # --- Beeswarm plot ---
    plt.figure(figsize=(10, 6))
    shap.summary_plot(shap_values, X, show=False, plot_type="dot")
    plt.title("SHAP Feature Impact (Beeswarm)", fontsize=13, pad=12)
    plt.tight_layout()
    plt.savefig(SHAP_BEESWARM, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"Saved {SHAP_BEESWARM}")

    # --- Waterfall — FAIL sample ---
    fail_idx = y[y == 0].index[0]
    _save_waterfall(explainer, X, fail_idx, SHAP_FAIL, "SHAP Waterfall — FAIL Sample")

    # --- Waterfall — PASS sample ---
    pass_idx = y[y == 1].index[0]
    _save_waterfall(explainer, X, pass_idx, SHAP_PASS, "SHAP Waterfall — PASS Sample")

    # --- SHAP summary JSON (mean |SHAP| per feature, for frontend bar chart) ---
    mean_abs = np.abs(shap_values).mean(axis=0)
    summary = [
        {"feature": feat, "importance": round(float(v), 5)}
        for feat, v in sorted(
            zip(FEATURE_COLUMNS, mean_abs),
            key=lambda x: x[1], reverse=True
        )
    ]
    with open(SHAP_SUMMARY, "w") as f:
        json.dump(summary, f, indent=2)
    print(f"Saved {SHAP_SUMMARY}")

    return shap_values


def _save_waterfall(explainer, X, idx, path, title):
    row = X.iloc[[idx]]
    sv  = explainer(row)
    plt.figure(figsize=(8, 5))
    shap.plots.waterfall(sv[0], show=False)
    plt.title(title, fontsize=11, pad=10)
    plt.tight_layout()
    plt.savefig(path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"Saved {path}")


def run():
    os.makedirs(ARTIFACTS, exist_ok=True)
    print("=== Stratum ML Pipeline ===")
    X, y = load_data()
    model, metrics = train_and_evaluate(X, y)

    # Save model
    joblib.dump(model, MODEL_PATH)
    print(f"Saved model → {MODEL_PATH}")

    # Save metrics
    with open(METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"Saved metrics → {METRICS_PATH}")

    # Generate SHAP plots
    print("Generating SHAP visualizations…")
    generate_shap(model, X, y)

    print("\n✓ Pipeline complete. All artifacts saved to backend/artifacts/")
    return metrics


if __name__ == "__main__":
    run()
