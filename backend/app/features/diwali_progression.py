import sqlite3
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone

from app.core.database import get_connection

DIWALI_DATES = {
    2021: "2021-11-04",
    2022: "2022-10-24",
    2023: "2023-11-12",
    2024: "2024-10-31",
    2025: "2025-10-20",
    2026: "2026-11-08",
}

def get_diwali_date_for_year(year: int) -> Optional[datetime]:
    if year in DIWALI_DATES:
        dt = datetime.strptime(DIWALI_DATES[year], "%Y-%m-%d")
        return dt.replace(tzinfo=timezone.utc)
    return None

def compute_diwali_progression(
    db_path: Optional[Path] = None,
    location_id: Optional[str] = None,
    pollutant: str = "PM2.5"
) -> Dict[str, Any]:
    conn = get_connection(db_path)
    try:
        query = """
        SELECT timestamp, location_id, pollutant, value, quality_flag
        FROM observations
        WHERE pollutant = ?
        """
        params: List[Any] = [pollutant]
        if location_id:
            query += " AND location_id = ?"
            params.append(location_id)

        df = pd.read_sql_query(query, conn, params=params)
        if df.empty:
            return {
                "baseline_profile": [],
                "historical_years": [],
                "current_year_progression": None,
                "peak_relative_day": 0,
                "total_observations_analyzed": 0,
                "warning": "Insufficient historical observations to construct progression profile."
            }

        df["dt"] = pd.to_datetime(df["timestamp"], utc=True)
        df["year"] = df["dt"].dt.year
        df["date"] = df["dt"].dt.floor("D")

        # Map each year to its Diwali date
        df["diwali_date"] = df["year"].map(
            lambda y: pd.to_datetime(DIWALI_DATES.get(y), utc=True) if y in DIWALI_DATES else pd.NaT
        )
        df = df.dropna(subset=["diwali_date"])

        # Compute relative day
        df["relative_day"] = (df["dt"] - df["diwali_date"]).dt.total_seconds() / (24 * 3600)
        df["rel_day_int"] = df["relative_day"].apply(lambda x: int(np.floor(x)))

        # Filter window: -30 to +30
        df = df[(df["rel_day_int"] >= -30) & (df["rel_day_int"] <= 30)]

        # Group by relative day for multi-year aggregate profile
        grouped = df.groupby("rel_day_int")["value"]
        profile_list = []
        for r_day, vals in grouped:
            q25 = float(vals.quantile(0.25))
            q75 = float(vals.quantile(0.75))
            med = float(vals.median())
            mean_val = float(vals.mean())
            cnt = int(vals.count())
            profile_list.append({
                "relative_day": int(r_day),
                "median": round(med, 1),
                "mean": round(mean_val, 1),
                "q25": round(q25, 1),
                "q75": round(q75, 1),
                "count": cnt,
                "is_peak": (int(r_day) in [0, 1])
            })

        profile_list.sort(key=lambda x: x["relative_day"])

        # Find historical peak relative day
        peak_r_day = 0
        if profile_list:
            peak_r_day = max(profile_list, key=lambda x: x["median"])["relative_day"]

        # Year-by-year series
        years_list = []
        for yr, y_df in df.groupby("year"):
            y_pts = []
            for r_day, r_vals in y_df.groupby("rel_day_int"):
                y_pts.append({
                    "relative_day": int(r_day),
                    "value": round(float(r_vals["value"].median()), 1),
                    "observed_date": r_vals["dt"].dt.strftime("%Y-%m-%d").iloc[0]
                })
            y_pts.sort(key=lambda x: x["relative_day"])
            years_list.append({
                "year": int(yr),
                "diwali_date": DIWALI_DATES.get(int(yr), "unknown"),
                "points": y_pts
            })

        return {
            "baseline_profile": profile_list,
            "historical_years": years_list,
            "peak_relative_day": peak_r_day,
            "total_observations_analyzed": len(df),
            "period_summaries": {
                "pre_diwali_median": round(float(df[df["rel_day_int"] < 0]["value"].median()), 1) if not df[df["rel_day_int"] < 0].empty else None,
                "diwali_day_median": round(float(df[df["rel_day_int"] == 0]["value"].median()), 1) if not df[df["rel_day_int"] == 0].empty else None,
                "post_diwali_median": round(float(df[df["rel_day_int"] > 0]["value"].median()), 1) if not df[df["rel_day_int"] > 0].empty else None,
            }
        }
    finally:
        conn.close()
