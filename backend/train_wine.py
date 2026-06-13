"""
STRATUM — Wine ML Pipeline (retrain)
Trains XGBoost on UCI Wine Quality (red) and saves:
  artifacts/xgboost_wine.joblib   (model)
  artifacts/scaler_wine.joblib    (StandardScaler with snake_case columns)

Run: python train_wine.py
"""
import os, json, warnings
import numpy as np
import pandas as pd
import joblib
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.metrics import make_scorer, accuracy_score, precision_score, recall_score, f1_score
from xgboost import XGBClassifier

warnings.filterwarnings("ignore")

BASE      = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE, "data", "winequality-red.csv")
ARTIFACTS = os.path.join(BASE, "artifacts")

WINE_KEYS = [
    "fixed_acidity", "volatile_acidity", "citric_acid", "residual_sugar",
    "chlorides", "free_sulfur_dioxide", "total_sulfur_dioxide",
    "density", "ph", "sulphates", "alcohol"
]

os.makedirs(ARTIFACTS, exist_ok=True)

# ── Load & normalize columns ──────────────────────────────────────
df = pd.read_csv(DATA_PATH, sep=";")

# Normalize UCI column names (spaces → snake_case, pH → ph)
rename_map = {
    "fixed acidity":        "fixed_acidity",
    "volatile acidity":     "volatile_acidity",
    "citric acid":          "citric_acid",
    "residual sugar":       "residual_sugar",
    "chlorides":            "chlorides",
    "free sulfur dioxide":  "free_sulfur_dioxide",
    "total sulfur dioxide": "total_sulfur_dioxide",
    "density":              "density",
    "pH":                   "ph",
    "sulphates":            "sulphates",
    "alcohol":              "alcohol",
    "quality":              "quality",
}
df.rename(columns=rename_map, inplace=True)

# Binarize quality: >= 6 → PASS (1), else FAIL (0)
df["label"] = (df["quality"] >= 6).astype(int)

X = df[WINE_KEYS]
y = df["label"]
print(f"Loaded {len(df)} rows | PASS: {y.sum()} | FAIL: {(y==0).sum()}")

# ── Scale (fit with snake_case column names) ──────────────────────
scaler   = StandardScaler()
X_scaled = pd.DataFrame(scaler.fit_transform(X), columns=WINE_KEYS)

# ── Train XGBoost ─────────────────────────────────────────────────
model = XGBClassifier(
    n_estimators=300, max_depth=5, learning_rate=0.05,
    subsample=0.8, colsample_bytree=0.8,
    eval_metric="logloss", random_state=42,
)

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
scoring = {
    "accuracy":  make_scorer(accuracy_score),
    "precision": make_scorer(precision_score, zero_division=0),
    "recall":    make_scorer(recall_score, zero_division=0),
    "f1":        make_scorer(f1_score, zero_division=0),
}
scores = cross_validate(model, X_scaled, y, cv=cv, scoring=scoring)
print(f"CV Accuracy={scores['test_accuracy'].mean():.4f} | F1={scores['test_f1'].mean():.4f}")

model.fit(X_scaled, y)

# ── Save ──────────────────────────────────────────────────────────
joblib.dump(model,  os.path.join(ARTIFACTS, "xgboost_wine.joblib"))
joblib.dump(scaler, os.path.join(ARTIFACTS, "scaler_wine.joblib"))
print("[OK] Saved xgboost_wine.joblib & scaler_wine.joblib")
print("   Column names used:", WINE_KEYS)
