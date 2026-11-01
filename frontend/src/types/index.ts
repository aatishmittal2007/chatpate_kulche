export type PollutantType = 'PM2.5' | 'PM10';

export type QualityFlag = 'valid' | 'suspect' | 'missing' | 'synthetic_benchmark';

export interface Station {
  id: string;
  name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
}

export interface Observation {
  id?: number;
  timestamp: string; // ISO 8601
  location_id: string;
  pollutant: PollutantType;
  value: number;
  unit: string;
  source: string;
  quality_flag: QualityFlag;
}

export interface Meteorology {
  timestamp: string;
  location_id: string;
  temperature_c: number;
  dew_point_c: number;
  relative_humidity: number;
  wind_speed_ms: number;
  wind_direction_deg: number;
  surface_pressure_hpa?: number;
  boundary_layer_height_m?: number;
}

export interface TrafficIndicator {
  timestamp: string;
  location_id: string;
  vehicle_count_hourly: number;
  average_speed_kmh: number;
  congestion_index: number; // 0.0 to 1.0
  estimated_emissions_pm25_kgh?: number;
}

export interface FireDetection {
  id: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  frp: number; // Fire Radiative Power (MW)
  confidence: number;
  distance_km?: number;
  directional_weight?: number;
}

export interface SatelliteIndicator {
  timestamp: string;
  location_id: string;
  aerosol_optical_depth: number;
  aerosol_index: number;
  data_quality: string;
}

export interface DiwaliProgressionPoint {
  relative_day: number; // -30 to +30
  median: number;
  mean: number;
  q25: number;
  q75: number;
  count: number;
  is_peak: boolean;
}

export interface YearProgression {
  year: number;
  diwali_date: string;
  points: {
    relative_day: number;
    value: number;
    pm25?: number;
    pm10?: number;
    observed_date: string;
  }[];
}

export interface HorizonForecast {
  horizon_hours: number;
  target_timestamp: string;
  pollutant: PollutantType;
  point_forecast: number;
  lower_bound_80: number;
  upper_bound_80: number;
  lower_bound_95: number;
  upper_bound_95: number;
  baseline_persistence: number;
  baseline_historical: number;
  model_name: string;
  uncertainty_calibrated: boolean;
  residual_correction_applied: boolean;
}

export interface ModelEvaluationSummary {
  model_name: string;
  pollutant: PollutantType;
  horizon_hours: number;
  val_mae: number;
  val_rmse: number;
  baseline_mae: number;
  baseline_rmse: number;
  improvement_pct: number;
  sample_count: number;
  ablation_stage?: string;
}

export interface AblationResult {
  stage: string;
  features_included: string[];
  pm25_mae_1h: number;
  pm25_mae_24h: number;
  pm10_mae_1h: number;
  pm10_mae_24h: number;
  verdict: string;
}

export interface ScenarioRequest {
  location_id: string;
  pollutant: PollutantType;
  horizon_hours: number;
  wind_speed_multiplier: number; // e.g. 0.5 to 2.0
  wind_direction_shift_deg: number; // -90 to +90
  traffic_reduction_pct: number; // 0 to 50%
  fire_activity_multiplier: number; // 0.0 to 2.0
  humidity_shift_pct: number; // -20% to +20%
}

export interface ScenarioResponse {
  location_id: string;
  pollutant: PollutantType;
  horizon_hours: number;
  baseline_forecast: number;
  scenario_forecast: number;
  delta_concentration: number;
  delta_percentage: number;
  disclaimer: string;
  counterfactual_assumptions: string[];
}

export interface SystemStatus {
  is_online: boolean;
  database_connected: boolean;
  total_observations: number;
  last_observation_timestamp: string | null;
  last_model_trained_timestamp: string | null;
  active_model: string;
  active_stations_count: number;
  offline_mode: boolean;
  total_community_reports?: number;
  active_road_corridors?: number;
}

export interface PeakAndRecoveryAnalysis {
  location_id: string;
  station_name: string;
  latest_observed_pm25: number;
  latest_observed_pm10: number;
  max_predicted_pm25: number;
  max_predicted_pm10: number;
  predicted_peak_horizon_hours: number;
  predicted_peak_timestamp: string;
  concentration_change_from_latest_pm25: number;
  concentration_change_from_latest_pm10: number;
  subsequent_trend: string;
  decline_rate_pm25_per_hour: number;
  recovery_threshold_pm25: number;
  recovery_status: string;
  recovery_criterion: string;
  historical_progression_comparison: string;
}

export interface DataQualitySummary {
  total_observations: number;
  quality_flag_distribution: Record<string, number>;
  station_coverage: {
    location_id: string;
    observation_count: number;
    latest_observation: string;
    earliest_observation: string;
    freshness_minutes: number;
  }[];
  is_small_dataset_safeguard_active: boolean;
  small_dataset_warning: string | null;
  spatial_bounding_status: string;
  unit_standardization: string;
}

// --- Qwen 3.8 AI Assistant Interfaces ---
export interface QwenChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface QwenChatResponse {
  reply: string;
  model_used: string;
  grounding_sources: string[];
  citations: Array<{ source: string; details: any }>;
  offline_fallback: boolean;
}

export interface FeatureAttribution {
  feature_name: string;
  contribution_ugm3: number;
  percentage: number;
  description: string;
}

export interface PredictionExplanationResponse {
  location_id: string;
  station_name: string;
  pollutant: string;
  horizon_hours: number;
  predicted_value: number;
  baseline_value: number;
  feature_attributions: FeatureAttribution[];
  causal_factors_synthesis: string;
  actionable_advisory: string;
  confidence_interval: { p10: number; p50: number; p90: number };
  model_used: string;
}

export interface EventAnalysisResponse {
  event_title: string;
  overall_severity: string;
  peak_aqi: number;
  meteorological_role: string;
  stubble_burning_contribution_pct: number;
  firecracker_surge_contribution_pct: number;
  vehicular_contribution_pct: number;
  inversion_layer_depth_m: number;
  executive_summary: string;
  key_takeaways: string[];
}

export interface NaturalSearchResponse {
  original_query: string;
  interpreted_intent: string;
  matched_stations: string[];
  filter_pollutant: string;
  time_horizon_hours?: number;
  direct_answer: string;
  structured_data: any[];
}

// --- Vehicle Intelligence Interfaces ---
export interface VehicleClassCounts {
  cars: number;
  buses: number;
  trucks: number;
  motorcycles: number;
  three_wheelers: number;
  total: number;
}

export interface VehicleDetectResponse {
  processed_frames: number;
  total_vehicles_detected: number;
  class_breakdown: VehicleClassCounts;
  average_speed_kmh: number;
  congestion_status: string;
  estimated_hourly_pm25_kg: number;
  estimated_hourly_nox_kg: number;
}

export interface RoadCorridor {
  id: string;
  name: string;
  from_point: string;
  to_point: string;
  length_km: number;
  baseline_speed_kmh: number;
  current_speed_kmh: number;
  vehicle_density_per_km: number;
  congestion_index: number;
  estimated_pm25_kgh: number;
  lat_start: number;
  lon_start: number;
  lat_end: number;
  lon_end: number;
}

export interface RouteAlternative {
  route_name: string;
  route_type: 'fastest_standard' | 'clean_alternative';
  distance_km: number;
  travel_time_min: number;
  avg_pm25_ugm3: number;
  cumulative_exposure_index: number;
  corridors_traversed: string[];
  exposure_difference_pct: number;
  advisory: string;
}

export interface RouteExposureResponse {
  origin: string;
  destination: string;
  standard_route: RouteAlternative;
  clean_route: RouteAlternative;
  recommended_route: string;
  potential_exposure_reduction_pct: number;
  health_guidance: string;
}

// --- Community Reporting Interfaces ---
export interface CommunityReport {
  id: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  neighbourhood_id?: string;
  category: string;
  description: string;
  visibility_level: string;
  smell_intensity: string;
  cracker_activity: string;
  status: 'verified' | 'pending' | 'flagged';
  reliability_score: number;
  upvotes: number;
}

export interface ReportCluster {
  cluster_id: string;
  center_lat: number;
  center_lon: number;
  report_count: number;
  dominant_category: string;
  avg_reliability: number;
  neighbourhood_id?: string;
  reports: CommunityReport[];
}

// --- Prediction Analytics & 5-Model Benchmark Interfaces ---
export interface ModelBenchmarkEntry {
  model_name: string;
  model_category: string;
  pollutant: string;
  horizon_hours: number;
  mae: number;
  rmse: number;
  r2_score: number;
  peak_accuracy_pct: number;
  inference_latency_ms: number;
  calibration_status: string;
}

export interface WeatherCorrelationPoint {
  timestamp: string;
  location_id: string;
  pm25: number;
  temperature_c: number;
  dew_point_c: number;
  relative_humidity: number;
  magnus_rh: number;
  wind_speed_ms: number;
  ventilation_index: number;
}

export interface FireLagPoint {
  lag_hours: number;
  correlation_coefficient: number;
  stubble_fire_count: number;
  downwind_pm25_impact_ugm3: number;
}

// --- n8n Automation Interfaces ---
export interface WorkflowStatus {
  workflow_id: string;
  name: string;
  schedule: string;
  description: string;
  is_active: boolean;
  last_run_at: string | null;
  last_status: 'success' | 'running' | 'failed' | 'pending';
  records_processed: number;
  execution_time_ms: number;
}

// --- Bloom's Taxonomy Interfaces ---
export interface ActionPlanResponse {
  neighbourhood_name: string;
  current_aqi: number;
  predicted_peak_aqi: number;
  vulnerability_group: string;
  immediate_actions: string[];
  indoor_guidance: string[];
  outdoor_restrictions: string[];
  purifier_sizing_recommendation: string;
  mask_specification: string;
  ward_level_policy_recommendation: string;
}

export interface BloomsPolicy {
  policy: string;
  effectiveness_score: number;
  cost: string;
  feasibility: string;
  scientific_verdict: string;
}

export interface BloomsTopic {
  title: string;
  content: string;
}

export interface BloomsLevel {
  level: string;
  badge: string;
  description: string;
  topics?: BloomsTopic[];
  policies?: BloomsPolicy[];
}

export interface BloomsFramework {
  title: string;
  levels: BloomsLevel[];
}

// --- Experiment Dataset & Trained Model Evaluation Interfaces ---
export interface ExperimentSummary {
  source_zip: string;
  source_csv: string;
  raw_rows: number;
  modeling_subset_rows: number;
  modeling_station_count: number;
  raw_columns: number;
  date_min: string;
  date_max: string;
  stations: number;
  selected_station_ids: string[];
  pm25_nonmissing_rows: number;
  pm25_nonmissing_pct: number;
  valid_next_hour_target_rows: number;
  train_sample_rows: number;
  validation_rows: number;
  test_rows: number;
  training_strategy: string;
  target: string;
  diwali_dates: Record<string, string>;
  weather_fire_status: string;
  important_caveats: string[];
}

export interface ExperimentMetricRow {
  Model: string;
  Evaluation: string;
  n: number;
  MAE: number;
  RMSE: number;
}

export interface EnsembleWeightRow {
  Model: string;
  Validation_Ensemble_Weight: number;
}

export interface FeatureImportanceRow {
  Model: string;
  Feature: string;
  Importance: number;
}

export interface ExperimentStation {
  id: string;
  name: string;
  city: string;
  state: string;
  region: string;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  is_verified_cpcb: boolean;
  type: string;
  total_test_records_2019: number;
}

export interface PredictionSampleRow {
  StationId: string;
  Datetime: string;
  'PM2.5': number | null;
  target_next_hour: number | null;
  diwali_window_3d: number;
  diwali_window_7d: number;
  RandomForest_prediction: number | null;
  XGBoost_prediction: number | null;
  LightGBM_prediction: number | null;
  Residual_XGBoost_prediction: number | null;
  Weighted_Ensemble_prediction: number | null;
  Persistence_prediction: number | null;
}

export interface PredictionSampleResponse {
  total_count: number;
  limit: number;
  offset: number;
  station_id: string | null;
  window: string;
  summary_stats: {
    count?: number;
    actual_mean?: number;
    actual_min?: number;
    actual_max?: number;
    residual_xgb_mae?: number;
    residual_xgb_rmse?: number;
    ensemble_mae?: number;
    ensemble_rmse?: number;
    persistence_mae?: number;
  };
  rows: PredictionSampleRow[];
}

export interface DiwaliTimeseriesPoint {
  datetime: string;
  observed_current: number | null;
  actual_next_hour: number | null;
  residual_xgboost: number | null;
  weighted_ensemble: number | null;
  persistence: number | null;
  is_diwali_day: boolean;
  is_diwali_3d: boolean;
}

export interface DiwaliTimeseriesResponse {
  station_id: string;
  station_name: string;
  city: string;
  diwali_date_2019: string;
  total_points: number;
  points: DiwaliTimeseriesPoint[];
}

