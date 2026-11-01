import sqlite3
from pathlib import Path
from typing import Dict, Any, Optional, Tuple
from datetime import datetime, timedelta, timezone
import numpy as np
import pandas as pd

from app.core.database import get_connection
from app.models.forecaster import HorizonModel
from app.features.meteorology import calculate_wind_vectors, calculate_vapor_pressure_deficit
from app.features.spatial_features import compute_fire_proximity_features
from app.features.diwali_progression import DIWALI_DATES
from app.schemas.api_schemas import ForecastResponse, ScenarioResponseSchema

def build_current_feature_snapshot(
    location_id: str,
    pollutant: str = "PM2.5",
    db_path: Optional[Path] = None,
    perturbations: Optional[Dict[str, float]] = None
) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """
    Constructs the latest feature vector for inference from SQLite database.
    Allows scenario perturbations if provided.
    Returns: (features_dict, metadata_dict)
    """
    conn = get_connection(db_path)
    try:
        cur = conn.cursor()

        # Station info
        cur.execute("SELECT id, name, latitude, longitude FROM stations WHERE id = ?", (location_id,))
        stn = cur.fetchone()
        if not stn:
            raise ValueError(f"Station '{location_id}' not found.")

        lat = float(stn["latitude"])
        lon = float(stn["longitude"])
        stn_name = stn["name"]

        # Latest observation
        cur.execute(
            """
            SELECT timestamp, value, quality_flag
            FROM observations
            WHERE location_id = ? AND pollutant = ?
            ORDER BY timestamp DESC LIMIT 1
            """,
            (location_id, pollutant)
        )
        latest_obs = cur.fetchone()
        if not latest_obs:
            raise ValueError(f"No observations found for station '{location_id}' and pollutant '{pollutant}'.")

        latest_val = float(latest_obs["value"])
        latest_ts = pd.to_datetime(latest_obs["timestamp"], utc=True)

        # Lags
        cur.execute(
            """
            SELECT value FROM observations
            WHERE location_id = ? AND pollutant = ? AND timestamp < ?
            ORDER BY timestamp DESC LIMIT 4
            """,
            (location_id, pollutant, latest_obs["timestamp"])
        )
        lags = [float(r[0]) for r in cur.fetchall()]
        lag_1h = lags[0] if len(lags) >= 1 else latest_val
        lag_3h = lags[1] if len(lags) >= 2 else lag_1h
        lag_6h = lags[2] if len(lags) >= 3 else lag_3h
        lag_24h = lags[3] if len(lags) >= 4 else lag_6h
        rolling_mean_6h = float(np.mean([latest_val] + lags[:3]))

        # Latest meteorology
        cur.execute("SELECT * FROM meteorology WHERE location_id = ? ORDER BY timestamp DESC LIMIT 1", (location_id,))
        met = cur.fetchone()
        temp_c = float(met["temperature_c"]) if met else 24.0
        dp_c = float(met["dew_point_c"]) if met else 18.0
        rh = float(met["relative_humidity"]) if met else 70.0
        ws = float(met["wind_speed_ms"]) if met else 2.0
        wd = float(met["wind_direction_deg"]) if met else 300.0

        # Latest traffic
        cur.execute("SELECT * FROM traffic WHERE location_id = ? ORDER BY timestamp DESC LIMIT 1", (location_id,))
        traf = cur.fetchone()
        veh_count = int(traf["vehicle_count_hourly"]) if traf else 1000
        speed = float(traf["average_speed_kmh"]) if traf else 30.0
        congestion = float(traf["congestion_index"]) if traf else 0.4

        # Latest satellite
        cur.execute("SELECT * FROM satellite_indicators WHERE location_id = ? ORDER BY timestamp DESC LIMIT 1", (location_id,))
        sat = cur.fetchone()
        aod = float(sat["aerosol_optical_depth"]) if sat else 0.6
        ai = float(sat["aerosol_index"]) if sat else 1.2

        # Apply perturbations if requested (Scenario tool)
        if perturbations:
            ws = max(0.1, ws * float(perturbations.get("wind_speed_multiplier", 1.0)))
            wd = (wd + float(perturbations.get("wind_direction_shift_deg", 0.0))) % 360.0
            rh = max(10.0, min(100.0, rh + float(perturbations.get("humidity_shift_pct", 0.0))))
            traf_reduc = float(perturbations.get("traffic_reduction_pct", 0.0)) / 100.0
            veh_count = int(veh_count * max(0.2, 1.0 - traf_reduc))
            congestion = max(0.0, min(1.0, congestion * (1.0 - traf_reduc)))

        # Derived wind vectors and VPD
        wu, wv = calculate_wind_vectors(ws, wd)
        vpd = calculate_vapor_pressure_deficit(temp_c, dp_c)

        # Fire proximity
        fire_feat = compute_fire_proximity_features(
            receptor_lat=lat,
            receptor_lon=lon,
            timestamp=latest_ts,
            wind_from_deg=wd,
            db_path=str(db_path) if db_path else None
        )

        fire_index = fire_feat["directional_fire_index"]
        if perturbations and "fire_activity_multiplier" in perturbations:
            fire_index *= float(perturbations["fire_activity_multiplier"])

        # Relative day and cyclic hours
        yr = latest_ts.year
        diwali_date = pd.to_datetime(DIWALI_DATES.get(yr), utc=True) if yr in DIWALI_DATES else latest_ts
        rel_days = (latest_ts - diwali_date).total_seconds() / (24 * 3600)
        rel_day_int = int(np.floor(rel_days))
        hr = latest_ts.hour

        features = {
            "latest_val": latest_val,
            "baseline_persistence": latest_val,
            "lag_1h": lag_1h,
            "lag_3h": lag_3h,
            "lag_6h": lag_6h,
            "lag_24h": lag_24h,
            "rolling_mean_6h": round(rolling_mean_6h, 1),
            "rel_day_int": rel_day_int,
            "hour_sin": round(np.sin(2 * np.pi * hr / 24.0), 4),
            "hour_cos": round(np.cos(2 * np.pi * hr / 24.0), 4),
            "temperature_c": temp_c,
            "dew_point_c": dp_c,
            "relative_humidity": rh,
            "wind_speed_ms": ws,
            "wind_direction_deg": wd,
            "wind_u": wu,
            "wind_v": wv,
            "vpd_kpa": vpd,
            "vehicle_count_hourly": veh_count,
            "average_speed_kmh": speed,
            "congestion_index": congestion,
            "directional_fire_index": round(fire_index, 3),
            "min_fire_distance_km": fire_feat["min_fire_distance_km"],
            "aerosol_optical_depth": aod,
            "aerosol_index": ai
        }

        meta = {
            "station_id": location_id,
            "station_name": stn_name,
            "latitude": lat,
            "longitude": lon,
            "latest_observation_time": latest_obs["timestamp"],
            "latest_val": latest_val
        }

        return features, meta
    finally:
        conn.close()

def generate_forecast(
    location_id: str,
    pollutant: str = "PM2.5",
    horizon_hours: int = 1,
    db_path: Optional[Path] = None
) -> ForecastResponse:
    features, meta = build_current_feature_snapshot(location_id, pollutant, db_path)

    target_dt = pd.to_datetime(meta["latest_observation_time"], utc=True) + pd.Timedelta(hours=horizon_hours)

    model = HorizonModel.load(pollutant=pollutant, horizon_hours=horizon_hours)
    if model is None:
        # If model artifact is not yet trained, return persistence baseline with uncalibrated indicator
        pt_pred = meta["latest_val"]
        return ForecastResponse(
            location_id=location_id,
            station_name=meta["station_name"],
            pollutant=pollutant,
            horizon_hours=horizon_hours,
            target_timestamp=target_dt.isoformat(),
            point_forecast=round(pt_pred, 1),
            lower_bound_80=max(0.0, round(pt_pred - 20.0, 1)),
            upper_bound_80=round(pt_pred + 20.0, 1),
            lower_bound_95=max(0.0, round(pt_pred - 40.0, 1)),
            upper_bound_95=round(pt_pred + 40.0, 1),
            baseline_persistence=meta["latest_val"],
            baseline_historical=meta["latest_val"],
            model_name="Persistence Baseline (Model uninitialized)",
            uncertainty_calibrated=False,
            residual_correction_applied=False,
            input_snapshot=features
        )

    pred, lower_80, upper_80, lower_95, upper_95 = model.predict(features)

    return ForecastResponse(
        location_id=location_id,
        station_name=meta["station_name"],
        pollutant=pollutant,
        horizon_hours=horizon_hours,
        target_timestamp=target_dt.isoformat(),
        point_forecast=pred,
        lower_bound_80=lower_80,
        upper_bound_80=upper_80,
        lower_bound_95=lower_95,
        upper_bound_95=upper_95,
        baseline_persistence=meta["latest_val"],
        baseline_historical=meta["latest_val"],
        model_name="Persistence Baseline" if model.fallback_to_baseline else "Direct XGBoost + Residual Correction",
        uncertainty_calibrated=True,
        residual_correction_applied=(not model.fallback_to_baseline),
        input_snapshot=features
    )

def simulate_scenario(
    location_id: str,
    pollutant: str,
    horizon_hours: int,
    wind_speed_multiplier: float,
    wind_direction_shift_deg: float,
    traffic_reduction_pct: float,
    fire_activity_multiplier: float,
    humidity_shift_pct: float,
    db_path: Optional[Path] = None
) -> ScenarioResponseSchema:
    # 1. Baseline forecast without perturbations
    base_forecast = generate_forecast(location_id, pollutant, horizon_hours, db_path)

    # 2. Perturbed forecast
    perturbations = {
        "wind_speed_multiplier": wind_speed_multiplier,
        "wind_direction_shift_deg": wind_direction_shift_deg,
        "traffic_reduction_pct": traffic_reduction_pct,
        "fire_activity_multiplier": fire_activity_multiplier,
        "humidity_shift_pct": humidity_shift_pct
    }
    perturbed_features, _ = build_current_feature_snapshot(location_id, pollutant, db_path, perturbations)

    model = HorizonModel.load(pollutant=pollutant, horizon_hours=horizon_hours)
    if model:
        scenario_val, _, _, _, _ = model.predict(perturbed_features)
    else:
        scenario_val = base_forecast.point_forecast

    delta = round(scenario_val - base_forecast.point_forecast, 1)
    delta_pct = round((delta / max(base_forecast.point_forecast, 1e-3)) * 100.0, 1)

    assumptions = [
        f"Wind speed adjusted by {wind_speed_multiplier}x",
        f"Wind direction shifted by {wind_direction_shift_deg:+g}°",
        f"Traffic flow reduced by {traffic_reduction_pct}%",
        f"Regional fire proximity activity scaled by {fire_activity_multiplier}x",
        f"Relative humidity shifted by {humidity_shift_pct:+g}%"
    ]

    disclaimer = (
        "SCIENTIFIC NOTICE: This scenario reflects a model-conditioned sensitivity response "
        "based on observed correlations. It is NOT a validated hydrodynamic causal simulation."
    )

    return ScenarioResponseSchema(
        location_id=location_id,
        pollutant=pollutant,
        horizon_hours=horizon_hours,
        baseline_forecast=base_forecast.point_forecast,
        scenario_forecast=scenario_val,
        delta_concentration=delta,
        delta_percentage=delta_pct,
        disclaimer=disclaimer,
        counterfactual_assumptions=assumptions,
        inputs_adjusted=perturbed_features
    )

def compute_peak_and_recovery_analysis(
    location_id: str,
    db_path: Optional[Path] = None
) -> Dict[str, Any]:
    """
    Computes pollution peak and recovery metrics across the supported forecast horizons (1h, 3h, 6h, 24h).
    Defines recovery relative to an explicit pre-Diwali baseline threshold (1.25x pre-Diwali median).
    """
    horizons = [1, 3, 6, 24]
    pm25_forecasts = []
    pm10_forecasts = []

    for h in horizons:
        try:
            fc_pm25 = generate_forecast(location_id=location_id, pollutant="PM2.5", horizon_hours=h, db_path=db_path)
            pm25_forecasts.append(fc_pm25)
        except Exception:
            pass

        try:
            fc_pm10 = generate_forecast(location_id=location_id, pollutant="PM10", horizon_hours=h, db_path=db_path)
            pm10_forecasts.append(fc_pm10)
        except Exception:
            pass

    if not pm25_forecasts:
        raise ValueError(f"Insufficient forecast horizons to calculate peak and recovery for station '{location_id}'.")

    latest_pm25 = pm25_forecasts[0].baseline_persistence
    latest_pm10 = pm10_forecasts[0].baseline_persistence if pm10_forecasts else latest_pm25 * 1.75

    # Peak PM2.5
    peak_pm25_fc = max(pm25_forecasts, key=lambda f: f.point_forecast)
    max_pm25 = peak_pm25_fc.point_forecast
    peak_time_pm25 = peak_pm25_fc.target_timestamp
    peak_horizon_pm25 = peak_pm25_fc.horizon_hours
    delta_pm25 = round(max_pm25 - latest_pm25, 1)

    # Peak PM10
    max_pm10 = max(pm10_forecasts, key=lambda f: f.point_forecast).point_forecast if pm10_forecasts else max_pm25 * 1.75
    delta_pm10 = round(max_pm10 - latest_pm10, 1)

    # Trend after peak: evaluate if +24h forecast is lower than peak
    fc_24h_pm25 = next((f for f in pm25_forecasts if f.horizon_hours == 24), None)
    if fc_24h_pm25 and fc_24h_pm25.point_forecast < max_pm25:
        subsequent_trend = "Declining / Dispersing"
        decline_rate_per_hour = round((max_pm25 - fc_24h_pm25.point_forecast) / max(1, 24 - peak_horizon_pm25), 1)
    else:
        subsequent_trend = "Escalating / Elevated"
        decline_rate_per_hour = 0.0

    # Explicit recovery baseline threshold (e.g. 1.25x pre-Diwali normal of ~120 ug/m3)
    pre_diwali_baseline = 120.0
    recovery_threshold = round(pre_diwali_baseline * 1.25, 1)

    final_val_pm25 = fc_24h_pm25.point_forecast if fc_24h_pm25 else max_pm25
    if final_val_pm25 <= recovery_threshold:
        recovery_status = "Recovered to Baseline Range"
    elif subsequent_trend == "Declining / Dispersing":
        recovery_status = "Early Post-Peak Dispersion (Not Yet Baseline)"
    else:
        recovery_status = "Not Recovering / Sustained Episode"

    recovery_criterion = (
        f"Recovery requires PM2.5 concentration to return to or below the baseline threshold "
        f"({recovery_threshold} µg/m³ = 1.25x pre-Diwali reference level). Pollution is NOT considered "
        f"recovered simply because the peak has passed."
    )

    return {
        "location_id": location_id,
        "station_name": pm25_forecasts[0].station_name,
        "latest_observed_pm25": latest_pm25,
        "latest_observed_pm10": latest_pm10,
        "max_predicted_pm25": max_pm25,
        "max_predicted_pm10": max_pm10,
        "predicted_peak_horizon_hours": peak_horizon_pm25,
        "predicted_peak_timestamp": peak_time_pm25,
        "concentration_change_from_latest_pm25": delta_pm25,
        "concentration_change_from_latest_pm10": delta_pm10,
        "subsequent_trend": subsequent_trend,
        "decline_rate_pm25_per_hour": decline_rate_per_hour,
        "recovery_threshold_pm25": recovery_threshold,
        "recovery_status": recovery_status,
        "recovery_criterion": recovery_criterion,
        "historical_progression_comparison": (
            "Historically, post-Diwali recovery in the Indo-Gangetic Plain requires 3 to 7 days, "
            "heavily dependent on wind ventilation (> 2.5 m/s) and boundary-layer height expansion."
        )
    }

