import pandas as pd
import numpy as np
from pathlib import Path
from typing import Optional, List, Dict, Tuple, Any
from datetime import datetime, timezone

from app.core.database import get_connection
from app.features.diwali_progression import DIWALI_DATES
from app.features.meteorology import enrich_weather_dataframe
from app.features.spatial_features import compute_fire_proximity_features

FEATURE_GROUPS = {
    "stage1_lags": [
        "latest_val", "lag_1h", "lag_3h", "lag_6h", "lag_24h",
        "rolling_mean_6h", "rel_day_int", "hour_sin", "hour_cos"
    ],
    "stage2_weather": [
        "temperature_c", "dew_point_c", "relative_humidity",
        "wind_speed_ms", "wind_u", "wind_v", "vpd_kpa"
    ],
    "stage3_traffic": [
        "vehicle_count_hourly", "average_speed_kmh", "congestion_index"
    ],
    "stage4_fires": [
        "directional_fire_index", "min_fire_distance_km"
    ],
    "stage5_satellite": [
        "aerosol_optical_depth", "aerosol_index"
    ]
}

def build_feature_dataset(
    pollutant: str = "PM2.5",
    horizon_hours: int = 1,
    db_path: Optional[Path] = None
) -> pd.DataFrame:
    """
    Constructs a tabular feature matrix and target column for a specific pollutant and forecast horizon.
    Guarantees strict chronological integrity with zero future target leakage into features.
    """
    conn = get_connection(db_path)
    try:
        # Load observations
        obs_df = pd.read_sql_query(
            """
            SELECT o.timestamp, o.location_id, o.value, s.latitude, s.longitude
            FROM observations o
            JOIN stations s ON o.location_id = s.id
            WHERE o.pollutant = ?
            ORDER BY o.location_id, o.timestamp ASC
            """,
            conn,
            params=[pollutant]
        )

        if obs_df.empty:
            return pd.DataFrame()

        obs_df["dt"] = pd.to_datetime(obs_df["timestamp"], utc=True)

        # Load meteorology
        met_df = pd.read_sql_query("SELECT * FROM meteorology", conn)
        if not met_df.empty:
            met_df["dt"] = pd.to_datetime(met_df["timestamp"], utc=True)
            met_df = enrich_weather_dataframe(met_df)

        # Load traffic
        traf_df = pd.read_sql_query("SELECT * FROM traffic", conn)
        if not traf_df.empty:
            traf_df["dt"] = pd.to_datetime(traf_df["timestamp"], utc=True)

        # Load satellite
        sat_df = pd.read_sql_query("SELECT * FROM satellite_indicators", conn)
        if not sat_df.empty:
            sat_df["dt"] = pd.to_datetime(sat_df["timestamp"], utc=True)

        rows = []
        # Group by location for lag and target construction
        for loc_id, loc_obs in obs_df.groupby("location_id"):
            loc_obs = loc_obs.sort_values("dt").reset_index(drop=True)
            lat = float(loc_obs["latitude"].iloc[0])
            lon = float(loc_obs["longitude"].iloc[0])

            loc_met = met_df[met_df["location_id"] == loc_id].sort_values("dt") if not met_df.empty else pd.DataFrame()
            loc_traf = traf_df[traf_df["location_id"] == loc_id].sort_values("dt") if not traf_df.empty else pd.DataFrame()
            loc_sat = sat_df[sat_df["location_id"] == loc_id].sort_values("dt") if not sat_df.empty else pd.DataFrame()

            # Iterate through observation points
            for i in range(len(loc_obs)):
                current_row = loc_obs.iloc[i]
                current_dt = current_row["dt"]
                current_val = float(current_row["value"])

                # Target at horizon: find observation closest to current_dt + horizon_hours
                target_dt = current_dt + pd.Timedelta(hours=horizon_hours)
                # Find matching target observation within +/- 2.5 hours tolerance
                future_candidates = loc_obs[
                    (loc_obs["dt"] >= target_dt - pd.Timedelta(hours=2.5)) &
                    (loc_obs["dt"] <= target_dt + pd.Timedelta(hours=2.5))
                ]

                if future_candidates.empty:
                    # Target not observed in discrete sample
                    continue

                target_val = float(future_candidates.iloc[0]["value"])

                # Lags from strictly past records (dt < current_dt)
                past_obs = loc_obs[loc_obs["dt"] < current_dt]
                lag_1h = float(past_obs.iloc[-1]["value"]) if len(past_obs) >= 1 else current_val
                lag_3h = float(past_obs.iloc[-2]["value"]) if len(past_obs) >= 2 else lag_1h
                lag_6h = float(past_obs.iloc[-3]["value"]) if len(past_obs) >= 3 else lag_3h
                lag_24h = float(past_obs.iloc[-4]["value"]) if len(past_obs) >= 4 else lag_6h

                recent_vals = list(past_obs["value"].tail(5)) + [current_val]
                rolling_mean_6h = float(np.mean(recent_vals))

                # Diwali relative day
                yr = current_dt.year
                diwali_date = pd.to_datetime(DIWALI_DATES.get(yr), utc=True) if yr in DIWALI_DATES else current_dt
                rel_days = (current_dt - diwali_date).total_seconds() / (24 * 3600)
                rel_day_int = int(np.floor(rel_days))

                # Hour encoding
                hr = current_dt.hour
                hr_sin = np.sin(2 * np.pi * hr / 24.0)
                hr_cos = np.cos(2 * np.pi * hr / 24.0)

                # Weather merge
                met_match = loc_met[loc_met["dt"] <= current_dt].tail(1) if not loc_met.empty else pd.DataFrame()
                temp_c = float(met_match["temperature_c"].iloc[0]) if not met_match.empty else 22.0
                dp_c = float(met_match["dew_point_c"].iloc[0]) if not met_match.empty else 16.0
                rh = float(met_match["relative_humidity"].iloc[0]) if not met_match.empty else 68.0
                ws = float(met_match["wind_speed_ms"].iloc[0]) if not met_match.empty else 2.0
                wd = float(met_match["wind_direction_deg"].iloc[0]) if not met_match.empty else 300.0
                wu = float(met_match["wind_u"].iloc[0]) if not met_match.empty else -1.5
                wv = float(met_match["wind_v"].iloc[0]) if not met_match.empty else -1.0
                vpd = float(met_match["vpd_kpa"].iloc[0]) if not met_match.empty else 0.8

                # Traffic merge
                traf_match = loc_traf[loc_traf["dt"] <= current_dt].tail(1) if not loc_traf.empty else pd.DataFrame()
                veh_count = int(traf_match["vehicle_count_hourly"].iloc[0]) if not traf_match.empty else 1000
                speed = float(traf_match["average_speed_kmh"].iloc[0]) if not traf_match.empty else 30.0
                congestion = float(traf_match["congestion_index"].iloc[0]) if not traf_match.empty else 0.4

                # Satellite merge
                sat_match = loc_sat[loc_sat["dt"] <= current_dt].tail(1) if not loc_sat.empty else pd.DataFrame()
                aod = float(sat_match["aerosol_optical_depth"].iloc[0]) if not sat_match.empty else 0.6
                ai = float(sat_match["aerosol_index"].iloc[0]) if not sat_match.empty else 1.2

                # Fire proximity
                fire_features = compute_fire_proximity_features(
                    receptor_lat=lat,
                    receptor_lon=lon,
                    timestamp=current_dt,
                    wind_from_deg=wd,
                    db_path=str(db_path) if db_path else None
                )

                row_dict = {
                    "timestamp": current_row["timestamp"],
                    "location_id": loc_id,
                    "target_timestamp": future_candidates.iloc[0]["timestamp"],
                    "target_concentration": target_val,
                    "latest_val": current_val,
                    "baseline_persistence": current_val,
                    "lag_1h": lag_1h,
                    "lag_3h": lag_3h,
                    "lag_6h": lag_6h,
                    "lag_24h": lag_24h,
                    "rolling_mean_6h": round(rolling_mean_6h, 1),
                    "rel_day_int": rel_day_int,
                    "hour_sin": round(hr_sin, 4),
                    "hour_cos": round(hr_cos, 4),
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
                    "directional_fire_index": fire_features["directional_fire_index"],
                    "min_fire_distance_km": fire_features["min_fire_distance_km"],
                    "aerosol_optical_depth": aod,
                    "aerosol_index": ai
                }
                rows.append(row_dict)

        result_df = pd.DataFrame(rows)
        if not result_df.empty:
            result_df = result_df.sort_values("timestamp").reset_index(drop=True)
        return result_df
    finally:
        conn.close()
