import sqlite3
import pandas as pd
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta, timezone

from app.core.database import get_connection
from app.spatial.calculations import compute_directional_screening_weight, haversine_distance

def compute_fire_proximity_features(
    receptor_lat: float,
    receptor_lon: float,
    timestamp: datetime,
    wind_from_deg: float,
    db_path: Optional[str] = None,
    lookback_hours: int = 48
) -> Dict[str, float]:
    """
    Computes spatial directional fire proximity metrics for a receiving neighbourhood.
    w(i,j,t) = exp(-d/L) * max(0, cos(direction_diff))
    Aggregate index = sum(w(i,j,t) * (FRP / 50.0))
    """
    conn = get_connection()
    try:
        t_start = (timestamp - timedelta(hours=lookback_hours)).isoformat()
        t_end = timestamp.isoformat()

        cur = conn.cursor()
        cur.execute(
            """
            SELECT id, timestamp, latitude, longitude, frp, confidence
            FROM fire_detections
            WHERE timestamp BETWEEN ? AND ?
            """,
            (t_start, t_end)
        )
        fires = cur.fetchall()

        if not fires:
            return {
                "active_fire_count_48h": 0.0,
                "directional_fire_index": 0.0,
                "min_fire_distance_km": 999.0,
                "max_aligned_frp": 0.0
            }

        total_weighted_index = 0.0
        min_distance = 999.0
        max_aligned_frp = 0.0

        for f in fires:
            f_lat = float(f["latitude"])
            f_lon = float(f["longitude"])
            frp = float(f["frp"])

            dist = haversine_distance(f_lat, f_lon, receptor_lat, receptor_lon)
            if dist < min_distance:
                min_distance = dist

            weight = compute_directional_screening_weight(
                source_lat=f_lat,
                source_lon=f_lon,
                receptor_lat=receptor_lat,
                receptor_lon=receptor_lon,
                wind_from_deg=wind_from_deg,
                decay_length_km=150.0
            )

            scaled_frp = (frp / 50.0) * weight
            total_weighted_index += scaled_frp

            if weight > 0.2 and frp > max_aligned_frp:
                max_aligned_frp = frp

        return {
            "active_fire_count_48h": float(len(fires)),
            "directional_fire_index": round(total_weighted_index, 3),
            "min_fire_distance_km": round(min_distance, 1),
            "max_aligned_frp": round(max_aligned_frp, 1)
        }
    finally:
        conn.close()
