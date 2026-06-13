# backend/utils/schema.py
"""
Pydantic schemas for STRATUM API — Biscuit Quality (SNI 01-2973-2011)
All models here are imported and used by api_main.py to avoid duplication.
"""
from pydantic import BaseModel, Field
from typing import Dict, List, Optional


# ── Request schemas ───────────────────────────────────────────────

class BiscuitParams(BaseModel):
    """11-feature biscuit batch parameters (SNI 01-2973-2011)."""
    moisture_pct:    float = Field(..., ge=0.0,  le=15.0,   description="Moisture (%)")
    fat_pct:         float = Field(..., ge=0.0,  le=50.0,   description="Fat Content (%)")
    protein_pct:     float = Field(..., ge=0.0,  le=30.0,   description="Protein (%)")
    ash_pct:         float = Field(..., ge=0.0,  le=6.0,    description="Ash Content (%)")
    water_activity:  float = Field(..., ge=0.0,  le=1.0,    description="Water Activity (Aw)")
    ph:              float = Field(..., ge=3.0,  le=10.0,   description="pH Level")
    peroxide_value:  float = Field(..., ge=0.0,  le=30.0,   description="Peroxide Value (meq/kg)")
    microbial_cfu_g: float = Field(..., ge=0.0,  le=1000.0, description="Microbial Count (CFU/g)")
    hardness_n:      float = Field(..., ge=0.0,  le=200.0,  description="Hardness (N)")
    thickness_mm:    float = Field(..., ge=0.0,  le=20.0,   description="Thickness (mm)")
    weight_g:        float = Field(..., ge=0.0,  le=50.0,   description="Weight (g)")


class SimulateRequest(BaseModel):
    """What-if simulation: base parameters + one parameter override."""
    base_parameters: BiscuitParams
    modified_param:  str   = Field(..., description="Parameter key to modify")
    new_value:       float = Field(..., description="New value for the modified parameter")


# ── Shared sub-schemas ────────────────────────────────────────────

class TopFactor(BaseModel):
    feature: str
    impact:  float


class SNIViolation(BaseModel):
    feature: str
    label:   str
    value:   float
    limit:   float
    unit:    str


# ── Response schemas ──────────────────────────────────────────────

class PredictResponse(BaseModel):
    """Response shape for /predict endpoint."""
    prediction:     str
    confidence:     float
    class_id:       int
    shap_values:    List[float]
    feature_names:  List[str]
    top_factors:    List[TopFactor]
    sni_violations: List[SNIViolation]
    dataset_type:   str


class SimulateResponse(BaseModel):
    """Response shape for /simulate endpoint (what-if comparison)."""
    original_prediction: str
    original_confidence: float
    new_prediction:      str
    new_confidence:      float
    modified_param:      str
    old_value:           float
    new_value:           float
    verdict_changed:     bool
    shap_delta:          Dict[str, float]


class ClusterResponse(BaseModel):
    """Response shape for /cluster endpoint (K-Means batch grouping)."""
    cluster_id:               int
    cluster_label:            str
    peer_batch_count:         int
    dominant_failure_features: List[str]
    description:              str


class BatchRow(BaseModel):
    id:             str
    prediction:     str
    confidence:     float
    class_id:       int
    parameters:     Dict[str, float]
    shap_values:    List[float]
    feature_names:  List[str]
    top_factors:    List[TopFactor]
    sni_violations: List[SNIViolation]
    dataset_type:   str


class BatchSummary(BaseModel):
    total:      int
    pass_count: int
    fail_count: int


class BatchResponse(BaseModel):
    rows:         List[BatchRow]
    dataset_type: str
    summary:      BatchSummary


class ShapImportanceItem(BaseModel):
    feature:    str
    importance: float


class HealthResponse(BaseModel):
    status:        str
    version:       str
    biscuit_model: bool
    wine_model:    bool
