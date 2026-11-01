from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

# --- Qwen 3.8 Schemas ---
class QwenChatMessage(BaseModel):
    role: str = Field(..., description="user, assistant, or system")
    content: str = Field(..., description="Message text content")

class QwenChatRequest(BaseModel):
    messages: List[QwenChatMessage] = Field(..., description="Conversation history")
    location_id: Optional[str] = Field(None, description="Optional station context (e.g. DEL_ANAND_VIHAR)")
    use_reasoning_model: bool = Field(False, description="True to route to qwen3.8-max, False for qwen3.8-flash")

class QwenChatResponse(BaseModel):
    reply: str
    model_used: str
    grounding_sources: List[str]
    citations: List[Dict[str, Any]]
    offline_fallback: bool

class PredictionExplanationRequest(BaseModel):
    location_id: str
    pollutant: str = "PM2.5"
    horizon_hours: int = 6
    target_concentration: Optional[float] = None

class FeatureAttribution(BaseModel):
    feature_name: str
    contribution_ugm3: float
    percentage: float
    description: str

class PredictionExplanationResponse(BaseModel):
    location_id: str
    station_name: str
    pollutant: str
    horizon_hours: int
    predicted_value: float
    baseline_value: float
    feature_attributions: List[FeatureAttribution]
    causal_factors_synthesis: str
    actionable_advisory: str
    confidence_interval: Dict[str, float]
    model_used: str

class EventAnalysisRequest(BaseModel):
    event_name: str = "Diwali Night Pollution Peak"
    target_date: Optional[str] = "2024-10-31"

class EventAnalysisResponse(BaseModel):
    event_title: str
    overall_severity: str
    peak_aqi: int
    meteorological_role: str
    stubble_burning_contribution_pct: float
    firecracker_surge_contribution_pct: float
    vehicular_contribution_pct: float
    inversion_layer_depth_m: float
    executive_summary: str
    key_takeaways: List[str]

class NaturalSearchRequest(BaseModel):
    query: str

class NaturalSearchResponse(BaseModel):
    original_query: str
    interpreted_intent: str
    matched_stations: List[str]
    filter_pollutant: str
    time_horizon_hours: Optional[int]
    direct_answer: str
    structured_data: List[Dict[str, Any]]

# --- Vehicle Intelligence Schemas ---
class VehicleClassCounts(BaseModel):
    cars: int
    buses: int
    trucks: int
    motorcycles: int
    three_wheelers: int
    total: int

class VehicleDetectionFrame(BaseModel):
    frame_id: int
    timestamp: str
    counts: VehicleClassCounts
    estimated_speed_kmh: float
    congestion_index: float

class VehicleDetectResponse(BaseModel):
    processed_frames: int
    total_vehicles_detected: int
    class_breakdown: VehicleClassCounts
    average_speed_kmh: float
    congestion_status: str
    estimated_hourly_pm25_kg: float
    estimated_hourly_nox_kg: float

class RoadCorridorSchema(BaseModel):
    id: str
    name: str
    from_point: str
    to_point: str
    length_km: float
    baseline_speed_kmh: float
    current_speed_kmh: float
    vehicle_density_per_km: float
    congestion_index: float
    estimated_pm25_kgh: float
    lat_start: float
    lon_start: float
    lat_end: float
    lon_end: float

class RouteExposureRequest(BaseModel):
    origin: str
    destination: str
    travel_mode: str = "car" # car, bike, bus

class RouteAlternative(BaseModel):
    route_name: str
    route_type: str # 'fastest_standard' or 'clean_alternative'
    distance_km: float
    travel_time_min: float
    avg_pm25_ugm3: float
    cumulative_exposure_index: float
    corridors_traversed: List[str]
    exposure_difference_pct: float
    advisory: str

class RouteExposureResponse(BaseModel):
    origin: str
    destination: str
    standard_route: RouteAlternative
    clean_route: RouteAlternative
    recommended_route: str
    potential_exposure_reduction_pct: float
    health_guidance: str

# --- Community Reporting Schemas ---
class CommunityReportCreate(BaseModel):
    latitude: float
    longitude: float
    neighbourhood_id: Optional[str] = None
    category: str # "Firecracker Burning", "Dense Smoke", "Dust & Construction", "Burning Smell", "Low Visibility"
    description: str
    visibility_level: str # "< 50m", "< 100m", "< 200m", "< 500m", "> 500m"
    smell_intensity: str # "None", "Mild smoke smell", "Moderate sulfur smell", "Heavy burning smell"
    cracker_activity: str # "None", "Low background activity", "Moderate activity", "Continuous heavy bursts"
    reporter_id: Optional[str] = "anon_user"

class CommunityReportResponse(BaseModel):
    id: str
    timestamp: str
    latitude: float
    longitude: float
    neighbourhood_id: Optional[str]
    category: str
    description: str
    visibility_level: str
    smell_intensity: str
    cracker_activity: str
    status: str # "verified", "pending", "flagged"
    reliability_score: float # 0.0 to 100.0
    upvotes: int

class ReportCluster(BaseModel):
    cluster_id: str
    center_lat: float
    center_lon: float
    report_count: int
    dominant_category: str
    avg_reliability: float
    neighbourhood_id: Optional[str]
    reports: List[CommunityReportResponse]

# --- 5-Model Benchmark & Analytics Schemas ---
class ModelBenchmarkEntry(BaseModel):
    model_name: str
    model_category: str # "Baseline", "Machine Learning", "Hybrid Ensemble"
    pollutant: str
    horizon_hours: int
    mae: float
    rmse: float
    r2_score: float
    peak_accuracy_pct: float
    inference_latency_ms: float
    calibration_status: str

class WeatherCorrelationPoint(BaseModel):
    timestamp: str
    location_id: str
    pm25: float
    temperature_c: float
    dew_point_c: float
    relative_humidity: float
    magnus_rh: float
    wind_speed_ms: float
    ventilation_index: float

class FireLagPoint(BaseModel):
    lag_hours: int
    correlation_coefficient: float
    stubble_fire_count: int
    downwind_pm25_impact_ugm3: float

# --- n8n Automation Schemas ---
class WorkflowStatus(BaseModel):
    workflow_id: str
    name: str
    schedule: str
    description: str
    is_active: bool
    last_run_at: Optional[str]
    last_status: str # "success", "running", "failed", "pending"
    records_processed: int
    execution_time_ms: int

class WorkflowTriggerRequest(BaseModel):
    workflow_id: str
    parameters: Optional[Dict[str, Any]] = None

class WorkflowTriggerResponse(BaseModel):
    workflow_id: str
    workflow_name: str
    execution_id: str
    status: str
    message: str
    duration_ms: int

# --- Bloom's Taxonomy Schemas ---
class ActionPlanRequest(BaseModel):
    neighbourhood_id: str
    vulnerability_group: str # "general", "children", "elderly", "respiratory_asthma", "outdoor_worker"
    planned_activities: List[str]

class ActionPlanResponse(BaseModel):
    neighbourhood_name: str
    current_aqi: int
    predicted_peak_aqi: int
    vulnerability_group: str
    immediate_actions: List[str]
    indoor_guidance: List[str]
    outdoor_restrictions: List[str]
    purifier_sizing_recommendation: str
    mask_specification: str
    ward_level_policy_recommendation: str
