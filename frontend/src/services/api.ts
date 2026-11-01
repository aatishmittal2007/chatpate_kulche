import {
  Station,
  Observation,
  DiwaliProgressionPoint,
  YearProgression,
  HorizonForecast,
  ModelEvaluationSummary,
  AblationResult,
  ScenarioRequest,
  ScenarioResponse,
  SystemStatus,
  Meteorology,
  TrafficIndicator,
  FireDetection,
  SatelliteIndicator,
  PollutantType
} from '../types';

const API_BASE = '/api';

export async function fetchHealth(): Promise<{ status: string; timestamp: string }> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Backend health check failed');
  return res.json();
}

export async function fetchSystemStatus(): Promise<SystemStatus> {
  const res = await fetch(`${API_BASE}/data/summary`);
  if (!res.ok) throw new Error('Failed to fetch system summary');
  return res.json();
}

export async function fetchNeighbourhoods(): Promise<Station[]> {
  const res = await fetch(`${API_BASE}/neighbourhoods`);
  if (!res.ok) throw new Error('Failed to fetch neighbourhoods');
  return res.json();
}

export async function fetchPollutionHistory(
  locationId?: string,
  pollutant: PollutantType = 'PM2.5'
): Promise<Observation[]> {
  const url = new URL(`${API_BASE}/pollution/history`, window.location.origin);
  if (locationId) url.searchParams.set('location_id', locationId);
  url.searchParams.set('pollutant', pollutant);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch pollution history');
  return res.json();
}

export async function fetchDiwaliProgression(): Promise<{
  baseline_profile: DiwaliProgressionPoint[];
  historical_years: YearProgression[];
  current_year_progression: YearProgression | null;
  peak_relative_day: number;
  total_observations_analyzed: number;
}> {
  const res = await fetch(`${API_BASE}/diwali/progression`);
  if (!res.ok) throw new Error('Failed to fetch Diwali progression');
  return res.json();
}

export async function fetchLatestForecast(
  locationId: string,
  pollutant: PollutantType = 'PM2.5'
): Promise<{
  location: Station;
  current_observation: Observation | null;
  forecasts: HorizonForecast[];
  last_model_trained: string | null;
}> {
  const res = await fetch(`${API_BASE}/forecast/latest?location_id=${locationId}&pollutant=${pollutant}`);
  if (!res.ok) throw new Error('Failed to fetch latest forecast');
  return res.json();
}

export async function fetchSingleForecast(
  locationId: string,
  pollutant: PollutantType,
  horizonHours: number
): Promise<HorizonForecast> {
  const res = await fetch(`${API_BASE}/forecast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location_id: locationId,
      pollutant,
      horizon_hours: horizonHours
    })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Forecast generation failed' }));
    throw new Error(errorData.detail || 'Forecast generation failed');
  }
  return res.json();
}

export async function fetchModelEvaluation(): Promise<{
  evaluations: ModelEvaluationSummary[];
  ablation_suite: AblationResult[];
  dataset_limitations: string[];
}> {
  const res = await fetch(`${API_BASE}/model/evaluation`);
  if (!res.ok) throw new Error('Failed to fetch model evaluation');
  return res.json();
}

export async function fetchEnvironmentalSources(locationId?: string): Promise<{
  meteorology: Meteorology | null;
  traffic: TrafficIndicator | null;
  active_fires: FireDetection[];
  satellite: SatelliteIndicator | null;
  freshness_minutes: Record<string, number>;
}> {
  const url = new URL(`${API_BASE}/sources/status`, window.location.origin);
  if (locationId) url.searchParams.set('location_id', locationId);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch environmental sources');
  return res.json();
}

export async function compareScenarios(request: ScenarioRequest): Promise<ScenarioResponse> {
  const res = await fetch(`${API_BASE}/scenarios/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Scenario comparison failed' }));
    throw new Error(errorData.detail || 'Scenario comparison failed');
  }
  return res.json();
}

export async function triggerModelTraining(): Promise<{
  message: string;
  status: string;
  models_trained: number;
}> {
  const res = await fetch(`${API_BASE}/model/train`, { method: 'POST' });
  if (!res.ok) throw new Error('Model training failed');
  return res.json();
}

export async function fetchDataQuality(): Promise<any> {
  const res = await fetch(`${API_BASE}/data/quality`);
  if (!res.ok) throw new Error('Failed to fetch data quality summary');
  return res.json();
}

export async function fetchPeakAndRecovery(locationId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/forecast/peak-recovery?location_id=${locationId}`);
  if (!res.ok) throw new Error('Failed to fetch peak and recovery metrics');
  return res.json();
}

// --- Qwen 3.8 AI Assistant Client ---
export async function sendAIChat(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  locationId?: string,
  useReasoningModel: boolean = false
) {
  const res = await fetch(`${API_BASE}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      location_id: locationId,
      use_reasoning_model: useReasoningModel
    })
  });
  if (!res.ok) throw new Error('AI chat failed');
  return res.json();
}

export async function fetchPredictionExplanation(
  locationId: string,
  pollutant: string = 'PM2.5',
  horizonHours: number = 6
) {
  const res = await fetch(`${API_BASE}/ai/explain-prediction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location_id: locationId,
      pollutant,
      horizon_hours: horizonHours
    })
  });
  if (!res.ok) throw new Error('Failed to explain prediction');
  return res.json();
}

export async function fetchEventAnalysis(eventName: string = 'Diwali Festival Peak') {
  const res = await fetch(`${API_BASE}/ai/analyze-event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_name: eventName })
  });
  if (!res.ok) throw new Error('Failed to fetch event analysis');
  return res.json();
}

export async function sendNaturalSearch(query: string) {
  const res = await fetch(`${API_BASE}/ai/natural-search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  if (!res.ok) throw new Error('Natural search interpretation failed');
  return res.json();
}

export async function fetchQwenHealth() {
  const res = await fetch(`${API_BASE}/ai/health`);
  if (!res.ok) throw new Error('Failed to fetch Qwen health');
  return res.json();
}

// --- Vehicle Intelligence Client ---
export async function runVehicleDetection(durationSeconds: number = 30) {
  const res = await fetch(`${API_BASE}/vehicles/detect?duration_seconds=${durationSeconds}`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Vehicle detection failed');
  return res.json();
}

export async function fetchRoadCorridors() {
  const res = await fetch(`${API_BASE}/vehicles/road-segments`);
  if (!res.ok) throw new Error('Failed to fetch road corridors');
  return res.json();
}

export async function fetchVehicleCounts() {
  const res = await fetch(`${API_BASE}/vehicles/counts`);
  if (!res.ok) throw new Error('Failed to fetch vehicle counts');
  return res.json();
}

export async function calculateRouteExposure(
  origin: string,
  destination: string,
  travelMode: string = 'car'
) {
  const res = await fetch(`${API_BASE}/vehicles/route-exposure`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin,
      destination,
      travel_mode: travelMode
    })
  });
  if (!res.ok) throw new Error('Route exposure calculation failed');
  return res.json();
}

// --- Community Reporting Client ---
export async function submitCommunityReport(reportData: {
  latitude: number;
  longitude: number;
  neighbourhood_id?: string;
  category: string;
  description: string;
  visibility_level: string;
  smell_intensity: string;
  cracker_activity: string;
  reporter_id?: string;
}) {
  const res = await fetch(`${API_BASE}/community/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reportData)
  });
  if (!res.ok) throw new Error('Failed to submit community report');
  return res.json();
}

export async function fetchCommunityReports(neighbourhoodId?: string, status?: string) {
  const url = new URL(`${API_BASE}/community/reports`, window.location.origin);
  if (neighbourhoodId) url.searchParams.set('neighbourhood_id', neighbourhoodId);
  if (status) url.searchParams.set('status', status);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch community reports');
  return res.json();
}

export async function fetchCommunityClusters() {
  const res = await fetch(`${API_BASE}/community/clusters`);
  if (!res.ok) throw new Error('Failed to fetch community clusters');
  return res.json();
}

export async function upvoteCommunityReport(reportId: string) {
  const res = await fetch(`${API_BASE}/community/reports/${reportId}/upvote`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to upvote report');
  return res.json();
}

// --- Prediction Analytics Client ---
export async function fetchModelBenchmarks(pollutant: string = 'PM2.5', horizonHours?: number) {
  const url = new URL(`${API_BASE}/analytics/model-comparison`, window.location.origin);
  url.searchParams.set('pollutant', pollutant);
  if (horizonHours) url.searchParams.set('horizon_hours', horizonHours.toString());
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch model benchmarks');
  return res.json();
}

export async function fetchWeatherCorrelations(locationId?: string, limit: number = 60) {
  const url = new URL(`${API_BASE}/analytics/weather-correlations`, window.location.origin);
  if (locationId) url.searchParams.set('location_id', locationId);
  url.searchParams.set('limit', limit.toString());
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch weather correlations');
  return res.json();
}

export async function fetchVehiclePollutionCorrelation() {
  const res = await fetch(`${API_BASE}/analytics/vehicle-vs-pollution`);
  if (!res.ok) throw new Error('Failed to fetch vehicle pollution correlation');
  return res.json();
}

export async function fetchFireLagCorrelations() {
  const res = await fetch(`${API_BASE}/analytics/fire-lag-correlation`);
  if (!res.ok) throw new Error('Failed to fetch fire lag correlations');
  return res.json();
}

// --- n8n Automation Client ---
export async function fetchWorkflowStatuses() {
  const res = await fetch(`${API_BASE}/automation/workflow-status`);
  if (!res.ok) throw new Error('Failed to fetch workflow statuses');
  return res.json();
}

export async function triggerWorkflow(workflowId: string) {
  const res = await fetch(`${API_BASE}/automation/trigger/${workflowId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workflow_id: workflowId })
  });
  if (!res.ok) throw new Error('Failed to trigger workflow');
  return res.json();
}

export async function fetchN8nHealth() {
  const res = await fetch(`${API_BASE}/automation/integrations/n8n/health`);
  if (!res.ok) throw new Error('Failed to check n8n health');
  return res.json();
}

// --- Bloom's Taxonomy Decision Support Client ---
export async function fetchBloomsFramework() {
  const res = await fetch(`${API_BASE}/decision-support/framework`);
  if (!res.ok) throw new Error('Failed to fetch Bloom framework');
  return res.json();
}

export async function generateActionPlan(
  neighbourhoodId: string,
  vulnerabilityGroup: string,
  plannedActivities: string[] = []
) {
  const res = await fetch(`${API_BASE}/decision-support/action-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      neighbourhood_id: neighbourhoodId,
      vulnerability_group: vulnerabilityGroup,
      planned_activities: plannedActivities
    })
  });
  if (!res.ok) throw new Error('Failed to generate action plan');
  return res.json();
}

// --- Real Experiment Dataset API Client ---
export async function fetchExperimentSummary() {
  const res = await fetch(`${API_BASE}/experiment/summary`);
  if (!res.ok) throw new Error('Failed to fetch experiment summary');
  return res.json();
}

export async function fetchExperimentMetrics(): Promise<{
  test_metrics_2019: any[];
  validation_metrics_2018: any[];
  source: string;
  evaluation_windows: string[];
}> {
  const res = await fetch(`${API_BASE}/experiment/metrics`);
  if (!res.ok) throw new Error('Failed to fetch experiment metrics');
  return res.json();
}

export async function fetchExperimentEnsembleWeights() {
  const res = await fetch(`${API_BASE}/experiment/ensemble-weights`);
  if (!res.ok) throw new Error('Failed to fetch ensemble weights');
  return res.json();
}

export async function fetchExperimentFeatureImportance(model?: string) {
  const url = new URL(`${API_BASE}/experiment/feature-importance`, window.location.origin);
  if (model) url.searchParams.set('model', model);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch feature importance');
  return res.json();
}

export async function fetchExperimentStations() {
  const res = await fetch(`${API_BASE}/experiment/stations`);
  if (!res.ok) throw new Error('Failed to fetch experiment stations');
  return res.json();
}

export async function fetchExperimentPredictionsSample(
  stationId?: string,
  evalWindow: string = 'all',
  limit: number = 500,
  offset: number = 0
) {
  const url = new URL(`${API_BASE}/experiment/predictions-sample`, window.location.origin);
  if (stationId) url.searchParams.set('station_id', stationId);
  url.searchParams.set('window', evalWindow);
  url.searchParams.set('limit', limit.toString());
  url.searchParams.set('offset', offset.toString());
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch predictions sample');
  return res.json();
}

export async function fetchExperimentDiwaliTimeseries(stationId: string = 'DL002') {
  const res = await fetch(`${API_BASE}/experiment/diwali-timeseries?station_id=${stationId}`);
  if (!res.ok) throw new Error('Failed to fetch Diwali timeseries');
  return res.json();
}

