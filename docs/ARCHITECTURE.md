# Architecture Specification — Diwali AirSense

**Diwali AirSense** is an offline-first, neighbourhood-level air pollution forecasting system designed specifically for the period before, during, and after Diwali (Day -30 to Day +30).

---

## 1. High-Level Architecture Diagram

```mermaid
graph TD
    subgraph Data Sources [Data Ingestion Layer]
        CPCB[CPCB Ground Monitoring CSV]
        IMD[IMD / Open-Meteo Weather CSV]
        FIRMS[NASA FIRMS VIIRS Fire CSV]
        SAT[Sentinel-5P Satellite TROPOMI CSV]
        TRAF[Traffic Flow & Speed CSV]
    end

    subgraph Preprocessing [Data Normalisation & Validation]
        VAL[Validators: Units, Coordinates, Timestamps, Outliers]
        MAGNUS[Magnus Equation Relative Humidity Fallback]
        DIR_WEIGHT[Spatial Haversine & Directional Screening w(i,j,t)]
    end

    subgraph Storage [Local Offline Storage]
        SQLITE[(Local SQLite Database: airsense.db)]
        GEOJSON[Neighbourhood Boundary GeoJSON]
    end

    subgraph Modeling [Machine Learning Engine]
        ALIGN[Diwali-Relative Temporal Alignment: Day -30 to +30]
        FEAT[Leakage-Free Feature Matrix Pipeline]
        BASE[Persistence & Historical Baselines]
        XGB[Direct Multi-Horizon XGBoost Regressors: 1h, 3h, 6h, 24h]
        UNCERT[Empirical Residual Quantiles: 80% & 95% Intervals]
        EVAL[Chronological Train-Validation Split & 6-Stage Ablation]
        MODELS_DISK[(Serialized Model Artifacts: models/*.joblib)]
    end

    subgraph BackendAPI [FastAPI Local REST API]
        API_HEALTH[GET /api/health]
        API_DATA[GET /api/data/summary & POST /api/data/import]
        API_PROG[GET /api/diwali/progression]
        API_FC[POST /api/forecast & GET /api/forecast/latest]
        API_SCEN[POST /api/scenarios/compare]
        API_EVAL[GET /api/model/evaluation & POST /api/model/train]
    end

    subgraph FrontendUI [Scientific Research Frontend (React + Vite + Leaflet)]
        OVERVIEW[Overview & Ground-Truth vs Prediction KPIs]
        MAP[Interactive Leaflet Neighbourhood & Fire Corridors Map]
        PROG_CHART[Day -30 to +30 Relative Progression Recharts]
        FC_EXP[Multi-Horizon Forecast Explorer & Feature Telemetry]
        ENV_VIEW[Atmospheric Moisture & Multi-Source Telemetry]
        SCEN_LAB[Hypothetical Scenario Comparator with Counterfactual Caveats]
        EVAL_VIEW[Model Horizon Performance & 6-Stage Feature Ablation]
    end

    CPCB --> VAL
    IMD --> VAL
    FIRMS --> VAL
    SAT --> VAL
    TRAF --> VAL

    VAL --> MAGNUS
    VAL --> DIR_WEIGHT
    MAGNUS --> SQLITE
    DIR_WEIGHT --> SQLITE
    VAL --> SQLITE

    SQLITE --> ALIGN
    SQLITE --> FEAT
    ALIGN --> FEAT
    FEAT --> BASE
    FEAT --> XGB
    XGB --> UNCERT
    XGB --> EVAL
    XGB --> MODELS_DISK

    SQLITE --> BackendAPI
    MODELS_DISK --> BackendAPI
    BackendAPI --> FrontendUI
```

---

## 2. Core Subsystems

### 2.1 Ingestion & Canonical Schema
- **Input Formats**: CSV and GeoJSON.
- **Canonical Observations**: `timestamp` (UTC ISO-8601), `location_id`, `latitude`, `longitude`, `pollutant` (PM2.5, PM10), `value`, `unit` ($\mu g/m^3$), `source`, and `quality_flag`.
- **Duplicate & Validation Rejection**: Strict database integrity with UNIQUE constraint `(location_id, pollutant, timestamp)`. Out-of-bounds coordinates ($lat \notin [-90, 90]$, $lon \notin [-180, 180]$) and invalid concentration units (e.g., ppm for particulate matter) are quarantined and documented in the `ImportReport`.

### 2.2 Relative Temporal Progression
- Rather than calendar dates, observations are indexed to Diwali:
  $$t_{\text{rel}} = \text{observation\_date} - \text{diwali\_date}$$
- Historical Diwali reference dates:
  - 2021: Nov 04
  - 2022: Oct 24
  - 2023: Nov 12
  - 2024: Oct 31
  - 2025: Oct 20
  - 2026: Nov 08
- Computes multi-year statistical distribution (Median, Mean, IQR 25th–75th percentiles) across relative days $-30$ to $+30$.

### 2.3 Scientific Feature Engineering
1. **Pollution History**: $C(t)$, $C(t-1)$, $C(t-3)$, $C(t-6)$, $C(t-24)$, rolling 6-hour mean.
2. **Meteorology & Moisture**:
   - Sonntag/Magnus formulation for relative humidity:
     $$RH = 100 \times \exp\left(\frac{17.625 \cdot T_d}{243.04 + T_d} - \frac{17.625 \cdot T}{243.04 + T}\right)$$
   - Wind vector decomposition: $u = -w_s \sin(\theta), v = -w_s \cos(\theta)$.
   - Vapor Pressure Deficit (VPD).
3. **Traffic Activity**: Hourly count, average speed, and congestion index.
4. **Spatial Proximity & Directional Fire Screening**:
   $$w(i,j,t) = \exp\left(-\frac{d_{ij}}{L}\right) \times \max(0, \cos(\theta_{\text{transport}} - \phi_{ij}))$$
   where $L = 150\text{ km}$, $\theta_{\text{transport}} = (\theta_{\text{wind\_from}} + 180^\circ) \pmod{360^\circ}$.

### 2.4 Multi-Horizon Forecasting Engine
- **Direct Multi-Horizon Strategy**: Direct models trained for $h \in \{1\text{h}, 3\text{h}, 6\text{h}, 24\text{h}\}$.
- **Residual Correction Formulation**:
  $$\hat{C}(t+h) = C_{\text{latest}}(t) + \hat{\Delta}_{\text{xgb}}(t+h)$$
- **Safeguard**: If XGBoost does not outperform the persistence baseline within 2% on held-out chronological test sets, the system falls back to the baseline.
- **Uncertainty Quantification**: Held-out empirical residual quantiles generate calibrated 80% and 95% forecast intervals: $[\hat{C} - q_{80}, \hat{C} + q_{80}]$ and $[\hat{C} - q_{95}, \hat{C} + q_{95}]$.

### 2.5 Offline Execution Guarantee
- SQLite database stored locally in `data/processed/airsense.db`.
- Serialized model files stored in `models/model_*.joblib`.
- Zero mandatory internet connections, cloud APIs, or external LLM dependencies for inference.
