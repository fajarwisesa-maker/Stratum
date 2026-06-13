# backend/utils/preprocessing.py
"""
Column name normalization for Wine Quality dataset.
Supports both original UCI names and snake_case variants.
"""

COLUMN_MAP = {
    "fixed acidity":        "fixed_acidity",
    "volatile acidity":     "volatile_acidity",
    "citric acid":          "citric_acid",
    "residual sugar":       "residual_sugar",
    "chlorides":            "chlorides",
    "free sulfur dioxide":  "free_sulfur_dioxide",
    "total sulfur dioxide": "total_sulfur_dioxide",
    "density":              "density",
    "pH":                   "ph",
    "ph":                   "ph",
    "sulphates":            "sulphates",
    "alcohol":              "alcohol",
    "quality":              "quality",
}

FEATURE_COLUMNS = [
    "fixed_acidity", "volatile_acidity", "citric_acid", "residual_sugar",
    "chlorides", "free_sulfur_dioxide", "total_sulfur_dioxide", "density",
    "ph", "sulphates", "alcohol",
]


def normalize_columns(df):
    """Rename UCI column names to snake_case. Handles both formats."""
    rename = {}
    for col in df.columns:
        stripped = col.strip()
        if stripped in COLUMN_MAP:
            rename[col] = COLUMN_MAP[stripped]
        elif stripped.lower().replace(" ", "_") in FEATURE_COLUMNS:
            rename[col] = stripped.lower().replace(" ", "_")
    return df.rename(columns=rename)


def validate_features(df):
    """Return (ok: bool, missing: list)."""
    missing = [c for c in FEATURE_COLUMNS if c not in df.columns]
    return len(missing) == 0, missing
