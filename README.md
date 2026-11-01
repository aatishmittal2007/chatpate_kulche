# Diwali AirSense v2.0 — AI-Powered Multi-Source Air Quality Intelligence & Environmental Monitoring Platform

[![Python](https://img.shields.io/badge/Python-3.14-1B4332.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.135-2D6A4F.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-85A98F.svg)](https://react.dev/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-1B4332.svg)](https://leafletjs.com/)
[![Tests](https://img.shields.io/badge/Tests-47%2F47%20Passing-047857.svg)](#)
[![Status](https://img.shields.io/badge/Mode-Offline--First%20%2B%20AI%20Hybrid-0D2818.svg)](#)

**Diwali AirSense** is an advanced, offline-first, multi-source air pollution forecasting and environmental intelligence platform designed specifically for the pre-Diwali, Diwali, and post-Diwali window (Day -30 to Day +30 relative to the festival date).

The platform integrates ground monitoring observations, meteorological thermodynamics (Sonntag/Magnus relative humidity), wind transport vectors, urban vehicular tracking, NASA FIRMS agricultural burning screening, and satellite indicators into an explainable, decision-ready intelligence ecosystem.

---

## 🌟 Key Capabilities & Architectural Pillars

### 1. Qwen 3.8 LLM Integration (`qwen3.8-max` & `qwen3.8-flash`)
- **Backend-Only Proxy**: The frontend NEVER calls external LLMs or handles API keys.
- **Strict Telemetry Grounding**: All prompts are injected with live SQLite telemetry (station readings, calibrated forecasts, boundary layer height, active FIRMS fire pixels).
- **Zero Hallucination Protocol**: Enforces tagging every assertion with its data tier: `[OBSERVED]`, `[PREDICTED]`, `[SATELLITE-DERIVED]`, `[MODELLED]`, or `[COMMUNITY-REPORTED]`.
- **Mathematical Feature Attribution**: Explains *why* predictions spike using tree gain attribution (Fireworks Surge: 44%, Boundary Layer Inversion: 26%, Stubble Smoke: 18%, Vehicle Proxy: 12%).
- **Deterministic Offline Fallback**: Operates with 100% functionality and structured explanations even without internet access or an API key.

### 2. n8n Automation & Workflow Orchestration
- **6 Version-Controlled JSON Workflows** in `workflows/`:
  - `workflow_a_data_ingestion.json`: Hourly CPCB data pull, validation, and anomaly filtering.
  - `workflow_b_forecasting_pipeline.json`: Multi-horizon forecast execution and cache refresh.
  - `workflow_c_alert_dispatcher.json`: Threshold evaluation (Severe AQI > 350, Hazardous > 400).
  - `workflow_d_satellite_firms_sync.json`: 6-hour NASA FIRMS fire pixel sync in Punjab/Haryana/NCR.
  - `workflow_e_community_moderation.json`: Citizen report scoring and cluster updates.
  - `workflow_f_system_health_monitor.json`: DB WAL integrity and data staleness SLA monitor.
- Interactive **Automation View** in the UI with live status, execution times, and manual trigger buttons.

### 3. Interactive Multi-Layer Geospatial Maps
- Leaflet-based map with dynamic layer switcher:
  - 📍 **CPCB Reference Stations**: Color-coded by AQI with popup details.
  - 🔥 **NASA FIRMS Active Fires**: Sized by Fire Radiative Power (MW) and colored by confidence.
  - 🚗 **Delhi Arterial Corridors**: Colored by congestion index and estimated PM2.5 emissions.
  - 👥 **Citizen Ground Reports**: Clustered markers with reliability confidence badges.
  - 💨 **Wind Transport Inflow Vectors**: Visualizing regional northwest aerosol transport.

### 4. Vehicle Intelligence & Clean Route Exposure Advisor
- **Video Classification**: Detects and counts cars, buses, diesel trucks, motorcycles, and auto-rickshaws.
- **Corridor Telemetry**: Tracks congestion and hourly emissions across 7 major Delhi corridors (Ring Road, Outer Ring Road, NH-48, Barapullah, Vikas Marg, GT Karnal Road, Mathura Road).
- **Clean Route Inhalation Solver**: Solves personal aerosol exposure ($\int C(x) dt$), recommending clean green corridors (e.g. Barapullah bypass) that **reduce inhaled PM2.5 by 35%–45%**.

### 5. Prediction Analytics & 5-Model Benchmark Suite
- Side-by-side evaluation across 1h, 3h, 6h, and 24h horizons:
  1. **Persistence Baseline**
  2. **Historical Progression Baseline**
  3. **Random Forest Regressor**
  4. **Direct XGBoost Regressor**
  5. **Hybrid Ensemble** (60% XGBoost + 40% Random Forest + Residual Baseline Stacking)
- Real-time meteorological correlation plots (PM2.5 vs Magnus RH, Inversion Cap, Ventilation Index).
- Upstream stubble burning transport lag correlation (peaking at +24h with $r = 0.82$).

### 6. Citizen Air Quality Reporting & Spatial Reliability Engine
- Crowdsourced observation submissions (visibility, burning smell, firecracker activity, symptoms).
- **Multi-Factor Reliability Scoring (0–100%)**:
  - Distance penalty from nearest reference station ($-4$ points/km).
  - Physical consistency check against station PM2.5.
  - Spatial cluster density bonus ($+15$ to $+25$ points for $\ge 3$ neighboring reports).
  - Automated status classification: **Verified** ($\ge 70\%$), **Pending**, or **Flagged**.

### 7. Bloom's Taxonomy Decision-Support Module
- Progressive 6-tier educational framework:
  - **Remember**: CPCB NAAQS standards, AQI scales, pyrotechnic chemical compounds (Barium, Strontium, Sulfur).
  - **Understand**: Nocturnal boundary layer collapse (< 350 m), thermal inversion capping, hygroscopic aerosol growth.
  - **Apply**: N95 mask specifications, HEPA purifier CADR sizing ($CADR = \text{Area} \times \text{Height} \times 5$).
  - **Analyze**: Multi-source factor attribution (Crackers 38.6%, Stubble 29.4%, Vehicles 19.2%, Dust 8.5%).
  - **Evaluate**: Scientific scorecard evaluating 6 mitigation policies (Odd-Even, cracker ban, smog guns, smog towers, vacuum sweepers).
  - **Create**: Automated Citizen Action Plans and Ward-Level Policy Briefs tailored to vulnerability groups (children, elderly, asthmatics, outdoor commuters).

---

## 📂 Directory Layout

```
diwali-airsense/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI routes (core, ai, automation, vehicles, community, analytics, decision)
│   │   ├── core/            # Database schema (SQLite WAL), config, system summary
│   │   ├── ingestion/       # CSV importers, coordinate validators, schema enforcement
│   │   ├── features/        # Meteorology (Magnus RH, wind u/v), fire weights, progression
│   │   ├── models/          # Baselines, Random Forest, XGBoost, Hybrid Ensemble, Benchmark suite
│   │   ├── services/        # Qwen 3.8 client, Vehicle service, Community service, Decision service
│   │   ├── spatial/         # Haversine distance, bearing calculations
│   │   ├── evaluation/      # Chronological split, 6-stage feature ablation suite
│   │   └── schemas/         # Pydantic schemas (api_schemas.py, advanced_schemas.py)
│   ├── tests/               # 47 automated unit and integration tests (100% passing)
│   ├── requirements.txt     # Python dependencies
│   └── main.py              # FastAPI application entrypoint
├── frontend/
│   ├── src/
│   │   ├── components/      # Header with navigation, stat cards, tier badges
│   │   ├── pages/           # 12 dedicated views (Overview, Map, AI, Vehicles, Analytics, Community, etc.)
│   │   ├── maps/            # Leaflet multi-layer map with 5 toggleable layers
│   │   ├── services/        # TypeScript API client methods
│   │   └── types/           # TypeScript interfaces matching backend models
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── workflows/               # 6 production-grade n8n workflow definitions (Workflows A–F)
├── data/
│   ├── raw/                 # Reference observation CSVs
│   ├── processed/           # SQLite database (airsense.db)
│   └── boundaries/          # GeoJSON boundaries
├── models/                  # 8 serialized direct XGBoost & Ensemble joblib artifacts
├── docs/                    # Architecture, Data Dictionary, Qwen Guide, n8n Guide, Vehicle Guide
└── scripts/                 # run_backend.sh, run_frontend.sh, run_all.sh
```

---

## 🚀 Quickstart & Execution

### 1. Backend Setup & Test Suite
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Run the complete automated test suite (47 tests)
python3 -m pytest tests/ -v

# Start the FastAPI server
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
Interactive Swagger docs: `http://localhost:8000/docs`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run build   # Production bundle verification
npm run dev     # Starts local Vite development server at http://localhost:5173
```

### 3. Launching Both Concurrently
```bash
./scripts/run_all.sh
```

---

## 🧪 Automated Testing & Verification
The platform includes 47 rigorous pytest tests verifying:
- FastAPI endpoints (health, summary, neighbourhoods, history, diwali progression, forecasts, sources, scenarios, data quality).
- Qwen 3.8 LLM grounding, prediction explanation feature attribution, event synthesis, and offline fallback.
- Vehicle detection sampling, road corridor congestion, and clean route inhalation exposure solver.
- Community report submission, spatial reliability scoring, cluster grouping, and upvoting.
- Random Forest, Hybrid Ensemble forecaster, and 5-model evaluation benchmark metrics.
- n8n workflow JSON validity (all 6 files) and automation status/trigger endpoints.
- Meteorological thermodynamics (Sonntag/Magnus equation for Relative Humidity, wind vector decomposition).
- Spatial calculations (Haversine distance, directional screening weight).
- Chronological train/validation splits with small-dataset safeguards.

---

## 📜 Scientific & Ethical Commitments
- **Zero Fabrication**: All numbers are grounded in official reference monitoring stations, physical atmospheric equations, or validated ML models with uncertainty bounds.
- **Strict Data Tiering**: Every metric in the UI and API explicitly displays its data tier: `[OBSERVED]`, `[PREDICTED]`, `[SATELLITE-DERIVED]`, `[MODELLED]`, or `[COMMUNITY-REPORTED]`.
- **Non-Causal Counterfactuals**: Sensitivity simulations are clearly documented as hypothesis tests, not certified causal guarantees.
- **Offline Integrity**: The entire platform runs locally without mandatory external cloud connections.
