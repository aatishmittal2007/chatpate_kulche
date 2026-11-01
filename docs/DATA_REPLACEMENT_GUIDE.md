# Live Data Ingestion & Replacement Guide — Diwali AirSense

Diwali AirSense ships with an initial calibrated benchmark dataset in `data/raw/` to verify pipeline functionality. This guide explains how to replace the benchmark dataset with live observational data from the Central Pollution Control Board (CPCB), India Meteorological Department (IMD), NASA FIRMS, and ESA Sentinel-5P.

---

## 1. Overview of Data Flow

Once live CSV files are placed in `data/raw/` or uploaded via the API:
1. Ingestion validators verify timestamps, coordinates, units, and duplicate records.
2. The SQLite database (`data/processed/airsense.db`) is populated.
3. Feature engineering constructs lag variables, Magnus relative humidity, and spatial screening weights.
4. Models retrain locally and write updated weights to `models/model_*.joblib`.
5. The application seamlessly serves live predictions without requiring any code changes.

---

## 2. Source-by-Source Replacement Instructions

### A. CPCB Ground-Level Pollution Observations
1. **Download source**: Download historical 15-minute or 1-hour station records from the official CPCB CCR portal (https://app.cpcbccr.com) or State Pollution Control Boards (DPCC / PPCB).
2. **Format specification**: Ensure the CSV includes columns matching:
   ```csv
   timestamp,location_id,station_name,latitude,longitude,pollutant,value,unit,source,quality_flag
   2024-10-31 18:00:00,DEL_ANAND_VIHAR,Anand Vihar,28.6469,77.3160,PM2.5,315.4,ug/m3,cpcb_live,valid
   ```
3. **Placement**: Save to `data/raw/cpcb_observations.csv`.

### B. Meteorological Data (IMD or Open-Meteo)
1. **Download source**: Download hourly historical or forecast surface meteorology from IMD or Open-Meteo Historical Weather API.
2. **Format specification**:
   ```csv
   timestamp,location_id,temperature_c,dew_point_c,relative_humidity,wind_speed_ms,wind_direction_deg,surface_pressure_hpa
   2024-10-31 18:00:00,DEL_ANAND_VIHAR,22.4,16.8,71.0,1.8,310.0,1013.5
   ```
   *(Note: If relative humidity is missing, the ingestion pipeline automatically computes it using the Sonntag/Magnus equation from temperature and dew point).*
3. **Placement**: Save to `data/raw/weather_observations.csv`.

### C. NASA FIRMS Fire Detections
1. **Download source**: Download active fire detections (VIIRS S-NPP or NOAA-20 375m) for North India (Bounding Box: Lat 28–32°N, Lon 74–78°E) from NASA FIRMS (https://firms.modaps.eosdis.nasa.gov).
2. **Format specification**:
   ```csv
   id,timestamp,latitude,longitude,frp,confidence,source
   FIRMS_2024_001,2024-10-31 14:15:00,30.450,76.220,64.2,95.0,nasa_firms_viirs
   ```
3. **Placement**: Save to `data/raw/firms_fire.csv`.

### D. Sentinel-5P Satellite Aerosol Data
1. **Download source**: Level 2 or Level 3 gridded Aerosol Optical Depth / UV Aerosol Index from Copernicus Open Access Hub or Google Earth Engine.
2. **Format specification**:
   ```csv
   timestamp,location_id,aerosol_optical_depth,aerosol_index,data_quality,source
   2024-10-31 12:00:00,DEL_ANAND_VIHAR,0.72,1.45,standard,sentinel5p_tropomi
   ```
3. **Placement**: Save to `data/raw/satellite_indicators.csv`.

---

## 3. Ingestion and Model Retraining Commands

After placing your files:

### Method 1: Using the Command-Line Script
Run the automated seed and ingestion pipeline:
```bash
cd diwali-airsense
python3 scripts/seed_database.py
```
Then retrain all models on the newly ingested observations:
```bash
python3 -c "
from app.evaluation.evaluator import run_chronological_evaluation
report = run_chronological_evaluation()
print(f'Training complete. Models trained: {report[\"models_trained_count\"]}')
"
```

### Method 2: Ingest via REST API
Upload files programmatically using `curl` or the Swagger UI at `http://127.0.0.1:8000/docs`:
```bash
# Upload live CPCB observations
curl -X POST "http://127.0.0.1:8000/api/data/import" \
  -F "source_type=cpcb" \
  -F "file=@data/raw/cpcb_observations.csv"

# Trigger local model retraining
curl -X POST "http://127.0.0.1:8000/api/model/train"
```

### Method 3: Ingest via UI
In the web interface at `http://127.0.0.1:5173`:
1. Click the **"Retrain Models"** button in the Overview tab.
2. The local training pipeline will re-evaluate chronological splits, update the evaluation report, and refresh the UI telemetry.
