from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class ForecastRequest(BaseModel):
    location_id: str
    pollutant: str = Field(default="PM2.5", description="PM2.5 or PM10")
    horizon_hours: int = Field(default=1, description="1, 3, 6, or 24")

class ForecastResponse(BaseModel):
    location_id: str
    station_name: str
    pollutant: str
    horizon_hours: int
    target_timestamp: str
    point_forecast: float
    lower_bound_80: float
    upper_bound_80: float
    lower_bound_95: float
    upper_bound_95: float
    baseline_persistence: float
    baseline_historical: float
    model_name: str
    uncertainty_calibrated: bool
    residual_correction_applied: bool
    input_snapshot: Dict[str, Any]

class ScenarioRequestSchema(BaseModel):
    location_id: str
    pollutant: str = Field(default="PM2.5")
    horizon_hours: int = Field(default=1)
    wind_speed_multiplier: float = Field(default=1.0, ge=0.2, le=3.0)
    wind_direction_shift_deg: float = Field(default=0.0, ge=-180.0, le=180.0)
    traffic_reduction_pct: float = Field(default=0.0, ge=-50.0, le=75.0)
    fire_activity_multiplier: float = Field(default=1.0, ge=0.0, le=5.0)
    humidity_shift_pct: float = Field(default=0.0, ge=-30.0, le=30.0)

class ScenarioResponseSchema(BaseModel):
    location_id: str
    pollutant: str
    horizon_hours: int
    baseline_forecast: float
    scenario_forecast: float
    delta_concentration: float
    delta_percentage: float
    disclaimer: str
    counterfactual_assumptions: List[str]
    inputs_adjusted: Dict[str, Any]
