from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

# Base & Response Models for Community
class CommunityBase(BaseModel):
    name: str
    code: str
    ward_number: Optional[str] = None
    district: str
    state: str
    zone_type: str = "Urban Slum / Informal"
    latitude: float
    longitude: float
    population: int = 5000
    households: int = 1000
    median_income_monthly: float = 9000.0
    digital_literacy_rate: float = 35.0
    internet_penetration_rate: float = 30.0
    distance_to_gov_office_km: float = 8.0
    primary_language: str = "Local"

class CommunityCreate(CommunityBase):
    pass

class CommunityResponse(CommunityBase):
    id: int
    created_at: datetime
    last_signal_received_at: Optional[datetime] = None
    last_signal_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Service Indicators
class ServiceIndicatorBase(BaseModel):
    water_access_hours_per_day: float = 2.0
    water_contamination_index: float = 65.0
    water_source_type: str = "Shared Standpost"
    road_condition_index: float = 30.0
    pothole_density_per_km: float = 12.0
    public_transit_access_score: float = 25.0
    garbage_collection_per_week: float = 1.0
    waste_overflow_rate: float = 75.0
    open_drainage_percentage: float = 70.0
    power_outage_hours_per_week: float = 30.0
    voltage_fluctuation_severity: float = 60.0
    street_light_operational_pct: float = 20.0
    distance_to_nearest_phc_km: float = 8.5
    doctor_availability_score: float = 20.0
    infant_immunization_rate: float = 55.0
    flood_vulnerability_index: float = 75.0
    drainage_blockage_percentage: float = 80.0
    waterlogging_days_per_year: float = 40.0
    ration_shop_queue_hours: float = 3.5
    csc_service_center_dist_km: float = 7.0
    official_complaints_registered_90d: int = 3

class ServiceIndicatorCreate(ServiceIndicatorBase):
    community_id: int

class ServiceIndicatorResponse(ServiceIndicatorBase):
    id: int
    community_id: int
    recorded_date: datetime

    class Config:
        from_attributes = True

# ML Predictions & Explainability
class FactorContribution(BaseModel):
    factor: str
    impact: str
    direction: str # "increases_risk", "suppresses_complaints", "health_hazard"
    value: float
    benchmark: float

class NeedPredictionResponse(BaseModel):
    id: int
    community_id: int
    evaluation_date: datetime
    ml_risk_score: float
    rule_risk_score: float
    final_risk_score: float
    risk_tier: str
    expected_complaints_90d: float
    actual_complaints_90d: int
    complaint_gap_ratio: float
    silent_need_index: float
    water_risk: float
    infra_risk: float
    sanitation_risk: float
    power_risk: float
    health_risk: float
    flooding_risk: float
    admin_access_risk: float
    is_anomaly: bool
    anomaly_score: float
    anomaly_type: str
    top_contributing_factors: List[Dict[str, Any]]
    explanation_narrative: Optional[str] = None
    recommended_action: Optional[str] = None
    confidence_level: float = 0.92
    fallback_used: bool = False

    class Config:
        from_attributes = True

# Aggregated Community Detail (with latest prediction, indicator, and dynamic silence clock)
class CommunityDetailResponse(CommunityResponse):
    latest_indicator: Optional[ServiceIndicatorResponse] = None
    latest_prediction: Optional[NeedPredictionResponse] = None
    last_signal_at: Optional[datetime] = None
    silence_duration_days: Optional[float] = None
    silence_display: Optional[str] = None          # e.g. "2 days silent", "15 days silent", "Never reported"
    silence_status: Optional[str] = "Normal"        # "Normal", "Attention Needed", "Critical"
    silence_tier: Optional[str] = "Active"          # "Active", "Drifting", "Silent", "Ghost Ward"
    silence_tier_color: Optional[str] = "emerald"   # "emerald", "amber", "orange", "rose"
    silence_penalty_points: Optional[float] = 0.0
    silence_alert_triggered: Optional[bool] = False
    silence_alert_message: Optional[str] = None
    total_signals_logged: Optional[int] = 0

# Interventions
class InterventionBase(BaseModel):
    title: str
    sector: str
    priority: str = "High"
    estimated_budget: float = 250000.0
    lead_department: str
    status: str = "Identified"
    target_completion_days: int = 30
    impact_projection: Optional[str] = None
    notes: Optional[str] = None

class InterventionCreate(InterventionBase):
    community_id: int

class InterventionUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    estimated_budget: Optional[float] = None
    notes: Optional[str] = None

class InterventionResponse(InterventionBase):
    id: int
    community_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Simulation Request & Response
class SimulationRequest(BaseModel):
    community_id: int
    water_access_hours_boost: float = 0.0 # e.g. +6 hours
    water_purification_plant_added: bool = False
    road_repair_investment: bool = False
    garbage_frequency_boost: float = 0.0 # +days/wk
    mobile_clinic_deployed: bool = False
    drainage_desilting_completed: bool = False
    civic_grievance_kiosk_installed: bool = False # Decreases digital friction, unmasks silent complaints!

class SimulationResponse(BaseModel):
    community_id: int
    baseline_risk_score: float
    simulated_risk_score: float
    risk_reduction_pct: float
    baseline_silent_need_index: float
    simulated_silent_need_index: float
    silent_need_reduction_pct: float
    baseline_expected_complaints: float
    simulated_visible_complaints: float
    sector_improvements: Dict[str, float]
    estimated_intervention_cost: float
    roi_score: float
    summary: str


# --------------------------------------------------------------------------
# Signal Record (Append-Only Civic Signal Log)
# --------------------------------------------------------------------------
class SignalRecordCreate(BaseModel):
    signal_type: str  # "Complaint", "Survey Response", "Field Report", etc.
    source: str = "Municipal Portal"
    summary: str
    severity: str = "Medium"
    corrects_signal_id: Optional[int] = None  # References prior record being corrected
    metadata_payload: Optional[Dict[str, Any]] = None

class SignalRecordResponse(BaseModel):
    id: int
    community_id: int
    signal_type: str
    source: str
    summary: str
    severity: str
    corrects_signal_id: Optional[int] = None
    metadata_payload: Optional[Dict[str, Any]] = None
    received_at: datetime
    # Display helpers for UI
    is_correction: bool = False
    corrected_by_signal_id: Optional[int] = None

    class Config:
        from_attributes = True

# --------------------------------------------------------------------------
# Silence Clock
# --------------------------------------------------------------------------
class SilenceClockResponse(BaseModel):
    community_id: int
    community_name: str
    ward_identifier: Optional[str] = None
    last_signal_at: Optional[datetime] = None
    last_signal_received_at: Optional[datetime] = None
    silence_duration_days: Optional[float] = None # Days elapsed, or None if never reported
    silence_display: str                          # "2 days silent", "15 days silent", "Never reported"
    silence_status: str                           # "Normal", "Attention Needed", "Critical"
    silence_tier: str                             # "Active", "Drifting", "Silent", "Ghost Ward"
    silence_tier_color: str                       # UI color key ("emerald", "amber", "orange", "rose")
    silence_penalty_points: float                 # SNI boost from silence (0–20)
    alert_triggered: bool                         # True if silence_duration_days > threshold (>= 30 days)
    alert_message: str
    threshold_days: float = 30.0                  # Documented configurable threshold
    total_signals_logged: int
    signal_type_breakdown: Dict[str, int]
    silent_need_score: Optional[float] = None

