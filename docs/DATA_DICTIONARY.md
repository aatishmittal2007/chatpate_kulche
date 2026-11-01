# Data Dictionary — Diwali AirSense

This document specifies the canonical schemas, physical units, acceptable ranges, and provenance standards for all data ingested into Diwali AirSense.

---

## 1. Tables & Schemas

### 1.1 `stations` (Monitoring Receptors)
| Field | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `id` | TEXT PRIMARY KEY | Unique station identifier | `DEL_ANAND_VIHAR` |
| `name` | TEXT | Station human-readable name | `Anand Vihar` |
| `city` | TEXT | City municipality | `Delhi` |
| `state` | TEXT | State or territory | `Delhi` |
| `latitude` | REAL | Decimal latitude (WGS84, [-90, 90]) | `28.6469` |
| `longitude` | REAL | Decimal longitude (WGS84, [-180, 180]) | `77.3160` |
| `is_active` | INTEGER | Operational status (1 = active, 0 = inactive) | `1` |

### 1.2 `observations` (Ground Pollution Observations)
| Field | Type | Units | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `id` | INTEGER PK | — | Auto-incrementing identifier | `1` |
| `timestamp` | TEXT | UTC ISO-8601 | Observation timestamp | `2024-10-31T18:00:00+00:00` |
| `location_id` | TEXT FK | — | References `stations(id)` | `DEL_ANAND_VIHAR` |
| `pollutant` | TEXT | — | Target pollutant (`PM2.5` or `PM10`) | `PM2.5` |
| `value` | REAL | $\mu g/m^3$ | Mass concentration ($0 \le v \le 1800$) | `342.5` |
| `unit` | TEXT | — | Must be `ug/m3` | `ug/m3` |
| `source` | TEXT | — | Ingested source agency | `cpcb` |
| `quality_flag` | TEXT | — | `valid`, `suspect`, `missing`, `synthetic_benchmark` | `synthetic_benchmark` |

### 1.3 `meteorology` (Atmospheric State)
| Field | Type | Units | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `timestamp` | TEXT | UTC ISO-8601 | Meteorological observation time | `2024-10-31T18:00:00+00:00` |
| `location_id` | TEXT FK | — | References `stations(id)` | `DEL_ANAND_VIHAR` |
| `temperature_c` | REAL | $^\circ C$ | Dry-bulb ambient air temperature | `21.4` |
| `dew_point_c` | REAL | $^\circ C$ | Dew point temperature ($T_d \le T$) | `17.2` |
| `relative_humidity` | REAL | $\%$ | Relative humidity ($0 \le RH \le 100$) | `77.5` |
| `wind_speed_ms` | REAL | $m/s$ | Wind speed at 10m height | `1.4` |
| `wind_direction_deg` | REAL | Degrees ($^\circ$) | Direction wind is blowing FROM ($0-360^\circ$) | `305.0` |
| `surface_pressure_hpa`| REAL | $hPa$ | Atmospheric pressure at surface | `1014.2` |
| `boundary_layer_height_m`| REAL | $m$ | Planetary boundary layer height | `380.0` |

### 1.4 `traffic` (Traffic Activity Proxies)
| Field | Type | Units | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `timestamp` | TEXT | UTC ISO-8601 | Traffic sensor timestamp | `2024-10-31T18:00:00+00:00` |
| `location_id` | TEXT FK | — | References `stations(id)` | `DEL_ANAND_VIHAR` |
| `vehicle_count_hourly` | INTEGER | vehicles/hour | Observed or estimated vehicle volume | `1450` |
| `average_speed_kmh` | REAL | $km/h$ | Average vehicle speed across link | `21.5` |
| `congestion_index` | REAL | Ratio ($[0, 1]$) | $1.0 - (\text{speed} / \text{free\_flow\_speed})$ | `0.57` |
| `estimated_emissions_pm25_kgh`| REAL | $kg/h$ | Proxy vehicular emission rate | `1.08` |

### 1.5 `fire_detections` (NASA FIRMS Active Thermal Anomalies)
| Field | Type | Units | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `id` | TEXT PK | — | Detection identifier | `FIRMS_PUN_01` |
| `timestamp` | TEXT | UTC ISO-8601 | Satellite acquisition time | `2024-10-31T14:15:00+00:00` |
| `latitude` | REAL | Decimal degrees | Thermal anomaly centroid latitude | `30.410` |
| `longitude` | REAL | Decimal degrees | Thermal anomaly centroid longitude | `76.450` |
| `frp` | REAL | $MW$ | Fire Radiative Power | `85.5` |
| `confidence` | REAL | $\%$ | Detection confidence score | `95.0` |
| `source` | TEXT | — | Sensor platform (`nasa_firms_viirs`) | `nasa_firms_viirs` |

### 1.6 `satellite_indicators` (Sentinel-5P Products)
| Field | Type | Units | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `timestamp` | TEXT | UTC ISO-8601 | Satellite overpass timestamp | `2024-10-31T12:00:00+00:00` |
| `location_id` | TEXT FK | — | References `stations(id)` | `DEL_ANAND_VIHAR` |
| `aerosol_optical_depth` | REAL | Unitless | Column Aerosol Optical Depth at 550nm | `0.85` |
| `aerosol_index` | REAL | Unitless | UV Aerosol Index | `1.65` |
| `data_quality` | TEXT | — | Product quality indicator (`standard`) | `standard` |
