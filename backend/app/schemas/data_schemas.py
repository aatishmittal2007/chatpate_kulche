from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class StationSchema(BaseModel):
    id: str
    name: str
    city: str
    state: str
    latitude: float
    longitude: float
    is_active: bool = True

class CanonicalObservation(BaseModel):
    id: Optional[int] = None
    timestamp: datetime
    location_id: str
    latitude: float
    longitude: float
    pollutant: str = Field(description="PM2.5 or PM10")
    value: float
    unit: str = "ug/m3"
    source: str = "cpcb"
    quality_flag: str = Field(default="valid", description="valid, suspect, missing, synthetic_benchmark")

class MeteorologyRecord(BaseModel):
    id: Optional[int] = None
    timestamp: datetime
    location_id: str
    temperature_c: float
    dew_point_c: float
    relative_humidity: float
    wind_speed_ms: float
    wind_direction_deg: float
    surface_pressure_hpa: Optional[float] = 1013.25
    boundary_layer_height_m: Optional[float] = None
    source: str = "imd_weather"

class TrafficRecord(BaseModel):
    id: Optional[int] = None
    timestamp: datetime
    location_id: str
    vehicle_count_hourly: int
    average_speed_kmh: float
    congestion_index: float = Field(ge=0.0, le=1.0)
    estimated_emissions_pm25_kgh: Optional[float] = None

class FireDetectionRecord(BaseModel):
    id: Optional[str] = None
    timestamp: datetime
    latitude: float
    longitude: float
    frp: float = Field(description="Fire Radiative Power (MW)")
    confidence: float
    source: str = "nasa_firms"

class SatelliteIndicatorRecord(BaseModel):
    id: Optional[int] = None
    timestamp: datetime
    location_id: str
    aerosol_optical_depth: float
    aerosol_index: float
    data_quality: str = "standard"
    source: str = "sentinel5p"

class ImportReport(BaseModel):
    source_file: str
    total_records_processed: int
    accepted_records: int
    rejected_records: int
    duplicate_records: int
    missing_critical_fields: int
    out_of_bounds_coordinates: int
    invalid_units: int
    quality_breakdown: Dict[str, int]
    timestamp_range: Optional[Dict[str, str]] = None
    details: List[str] = []
