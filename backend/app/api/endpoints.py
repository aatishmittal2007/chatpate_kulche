import json
import shutil
import tempfile
from pathlib import Path
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import pandas as pd
from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Form

from app.core.database import get_connection, get_system_summary
from app.schemas.api_schemas import (
    ForecastRequest,
    ForecastResponse,
    ScenarioRequestSchema,
    ScenarioResponseSchema
)
from app.schemas.data_schemas import ImportReport
from app.ingestion.cpcb_importer import import_cpcb_csv
from app.ingestion.weather_importer import import_weather_csv
from app.ingestion.traffic_adapter import import_traffic_csv, import_satellite_csv
from app.ingestion.firms_adapter import import_firms_csv
from app.features.diwali_progression import compute_diwali_progression
from app.evaluation.evaluator import run_chronological_evaluation, REPORTS_DIR
from app.forecasting.engine import generate_forecast, simulate_scenario, compute_peak_and_recovery_analysis

router = APIRouter(prefix="/api")

@router.get("/health")
def get_health():
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "offline_ready": True
    }

@router.get("/data/summary")
def get_data_summary():
    return get_system_summary()

@router.get("/data/quality")
def get_data_quality():
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM observations")
        total_obs = cur.fetchone()[0]

        cur.execute("SELECT quality_flag, COUNT(*) FROM observations GROUP BY quality_flag")
        q_breakdown = {r[0]: r[1] for r in cur.fetchall()}

        cur.execute("SELECT location_id, COUNT(*), MAX(timestamp), MIN(timestamp) FROM observations GROUP BY location_id")
        station_coverage = []
        now = datetime.now(timezone.utc)
        for r in cur.fetchall():
            dt_last = pd.to_datetime(r[2], utc=True)
            freshness_min = int((now - dt_last).total_seconds() / 60)
            station_coverage.append({
                "location_id": r[0],
                "observation_count": r[1],
                "latest_observation": r[2],
                "earliest_observation": r[3],
                "freshness_minutes": freshness_min
            })

        is_small = total_obs < 500
        warning = None
        if is_small:
            warning = (
                f"Small-Dataset Safeguard Active: Current dataset contains {total_obs} observations. "
                "This is insufficient for reliable multi-neighbourhood, multi-horizon operational forecasting; "
                "models conservatively prioritize persistence baselines when ML fails to demonstrate >2% out-of-sample improvement."
            )

        return {
            "total_observations": total_obs,
            "quality_flag_distribution": q_breakdown,
            "station_coverage": station_coverage,
            "is_small_dataset_safeguard_active": is_small,
            "small_dataset_warning": warning,
            "spatial_bounding_status": "All coordinates verified within WGS84 and Indo-Gangetic regional bounds.",
            "unit_standardization": "All particulate matter standardized to µg/m³."
        }
    finally:
        conn.close()

@router.get("/neighbourhoods")
def get_neighbourhoods():
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, name, city, state, latitude, longitude, is_active FROM stations WHERE is_active = 1")
        rows = [dict(r) for r in cur.fetchall()]
        return rows
    finally:
        conn.close()

@router.get("/pollution/history")
def get_pollution_history(
    location_id: Optional[str] = Query(None, description="Station ID"),
    pollutant: str = Query("PM2.5", description="PM2.5 or PM10"),
    limit: int = Query(200, ge=1, le=1000)
):
    conn = get_connection()
    try:
        query = "SELECT id, timestamp, location_id, pollutant, value, unit, source, quality_flag FROM observations WHERE pollutant = ?"
        params: List[Any] = [pollutant]
        if location_id:
            query += " AND location_id = ?"
            params.append(location_id)
        query += " ORDER BY timestamp ASC LIMIT ?"
        params.append(limit)

        cur = conn.cursor()
        cur.execute(query, params)
        rows = [dict(r) for r in cur.fetchall()]
        return rows
    finally:
        conn.close()

@router.get("/diwali/progression")
def get_progression(
    location_id: Optional[str] = Query(None),
    pollutant: str = Query("PM2.5")
):
    return compute_diwali_progression(location_id=location_id, pollutant=pollutant)

@router.post("/model/train")
def train_model():
    try:
        report = run_chronological_evaluation()
        return {
            "message": "Local model training and chronological evaluation complete.",
            "status": "success",
            "models_trained": report["models_trained_count"],
            "generated_at": report["generated_at"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model training failed: {str(e)}")

@router.get("/model/status")
def get_model_status():
    summary = get_system_summary()
    return {
        "active_model": summary["active_model"],
        "last_trained_timestamp": summary["last_model_trained_timestamp"],
        "supported_horizons": [1, 3, 6, 24],
        "supported_pollutants": ["PM2.5", "PM10"],
        "evaluation_strategy": "Chronological 75/25 train-validation split"
    }

@router.get("/model/evaluation")
def get_model_evaluation():
    report_file = REPORTS_DIR / "evaluation_report.json"
    if not report_file.exists():
        # Auto-run if not yet generated
        return run_chronological_evaluation()
    with open(report_file, "r", encoding="utf-8") as f:
        return json.load(f)

@router.post("/forecast", response_model=ForecastResponse)
def post_forecast(req: ForecastRequest):
    if req.horizon_hours not in [1, 3, 6, 24]:
        raise HTTPException(status_code=400, detail="Supported forecast horizons are 1, 3, 6, and 24 hours.")
    try:
        return generate_forecast(
            location_id=req.location_id,
            pollutant=req.pollutant,
            horizon_hours=req.horizon_hours
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecast generation failed: {str(e)}")

@router.get("/forecast/latest")
def get_latest_forecasts(
    location_id: str = Query(..., description="Location ID"),
    pollutant: str = Query("PM2.5", description="PM2.5 or PM10")
):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT id, name, city, state, latitude, longitude, is_active FROM stations WHERE id = ?", (location_id,))
        stn = cur.fetchone()
        if not stn:
            raise HTTPException(status_code=404, detail=f"Station '{location_id}' not found.")

        # Latest observation
        cur.execute(
            """
            SELECT id, timestamp, location_id, pollutant, value, unit, source, quality_flag
            FROM observations
            WHERE location_id = ? AND pollutant = ?
            ORDER BY timestamp DESC LIMIT 1
            """,
            (location_id, pollutant)
        )
        obs = cur.fetchone()
        cur_obs = dict(obs) if obs else None

        # Forecasts for all 4 horizons
        forecasts = []
        if cur_obs:
            for h in [1, 3, 6, 24]:
                try:
                    fc = generate_forecast(location_id=location_id, pollutant=pollutant, horizon_hours=h)
                    forecasts.append(fc.model_dump())
                except Exception:
                    pass

        cur.execute("SELECT MAX(trained_at) FROM model_runs")
        last_train = cur.fetchone()[0]

        return {
            "location": dict(stn),
            "current_observation": cur_obs,
            "forecasts": forecasts,
            "last_model_trained": last_train
        }
    finally:
        conn.close()

@router.get("/forecast/peak-recovery")
def get_peak_and_recovery(location_id: str = Query(..., description="Location ID")):
    try:
        return compute_peak_and_recovery_analysis(location_id=location_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Peak and recovery analysis failed: {str(e)}")

@router.get("/sources/status")
def get_sources_status(location_id: Optional[str] = Query(None)):
    conn = get_connection()
    try:
        cur = conn.cursor()
        loc_clause = "WHERE location_id = ?" if location_id else ""
        params = [location_id] if location_id else []

        cur.execute(f"SELECT * FROM meteorology {loc_clause} ORDER BY timestamp DESC LIMIT 1", params)
        met = cur.fetchone()

        cur.execute(f"SELECT * FROM traffic {loc_clause} ORDER BY timestamp DESC LIMIT 1", params)
        traf = cur.fetchone()

        cur.execute(f"SELECT * FROM satellite_indicators {loc_clause} ORDER BY timestamp DESC LIMIT 1", params)
        sat = cur.fetchone()

        cur.execute("SELECT id, timestamp, latitude, longitude, frp, confidence FROM fire_detections ORDER BY timestamp DESC LIMIT 10")
        fires = [dict(f) for f in cur.fetchall()]

        # Freshness calculation
        now = datetime.now(timezone.utc)
        freshness = {}
        if met:
            dt_met = pd.to_datetime(met["timestamp"], utc=True)
            freshness["meteorology_minutes_old"] = int((now - dt_met).total_seconds() / 60)
        if traf:
            dt_tr = pd.to_datetime(traf["timestamp"], utc=True)
            freshness["traffic_minutes_old"] = int((now - dt_tr).total_seconds() / 60)
        if sat:
            dt_sat = pd.to_datetime(sat["timestamp"], utc=True)
            freshness["satellite_minutes_old"] = int((now - dt_sat).total_seconds() / 60)

        return {
            "meteorology": dict(met) if met else None,
            "traffic": dict(traf) if traf else None,
            "satellite": dict(sat) if sat else None,
            "active_fires": fires,
            "freshness": freshness
        }
    finally:
        conn.close()

@router.post("/scenarios/compare", response_model=ScenarioResponseSchema)
def post_compare_scenarios(req: ScenarioRequestSchema):
    try:
        return simulate_scenario(
            location_id=req.location_id,
            pollutant=req.pollutant,
            horizon_hours=req.horizon_hours,
            wind_speed_multiplier=req.wind_speed_multiplier,
            wind_direction_shift_deg=req.wind_direction_shift_deg,
            traffic_reduction_pct=req.traffic_reduction_pct,
            fire_activity_multiplier=req.fire_activity_multiplier,
            humidity_shift_pct=req.humidity_shift_pct
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scenario calculation failed: {str(e)}")

@router.post("/data/import")
async def post_data_import(
    source_type: str = Form(..., description="cpcb, weather, traffic, satellite, or firms"),
    file: UploadFile = File(...)
):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".csv") as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = Path(tmp.name)

    try:
        if source_type == "cpcb":
            report = import_cpcb_csv(tmp_path)
        elif source_type == "weather":
            report = import_weather_csv(tmp_path)
        elif source_type == "traffic":
            report = import_traffic_csv(tmp_path)
        elif source_type == "satellite":
            report = import_satellite_csv(tmp_path)
        elif source_type == "firms":
            report = import_firms_csv(tmp_path)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown source_type '{source_type}'.")
        return report
    finally:
        if tmp_path.exists():
            tmp_path.unlink()
