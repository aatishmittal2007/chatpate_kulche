import math
from typing import Tuple, Dict, Any
import pandas as pd
import numpy as np

from app.ingestion.validators import calculate_magnus_rh

def calculate_wind_vectors(wind_speed_ms: float, wind_direction_deg: float) -> Tuple[float, float]:
    """
    Decomposes meteorological wind (direction wind is blowing FROM) into zonal (u) and meridional (v) components.
    u = -ws * sin(rad) (positive eastward)
    v = -ws * cos(rad) (positive northward)
    """
    rad = math.radians(wind_direction_deg % 360.0)
    u = -wind_speed_ms * math.sin(rad)
    v = -wind_speed_ms * math.cos(rad)
    return round(u, 3), round(v, 3)

def calculate_vapor_pressure_deficit(temp_c: float, dew_point_c: float) -> float:
    """
    Computes vapor pressure deficit (VPD, in kPa) from temperature and dew point.
    Higher VPD indicates drier air with greater evaporation potential.
    """
    # Saturated vapor pressure (es) in kPa using Tetens formula
    es = 0.61078 * math.exp((17.27 * temp_c) / (temp_c + 237.3))
    # Actual vapor pressure (ea) in kPa
    ea = 0.61078 * math.exp((17.27 * dew_point_c) / (dew_point_c + 237.3))
    vpd = max(0.0, es - ea)
    return round(vpd, 3)

def enrich_weather_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Calculates derived meteorological features for a pandas DataFrame.
    """
    df = df.copy()
    if "temperature_c" in df and "dew_point_c" in df:
        if "relative_humidity" not in df or df["relative_humidity"].isna().any():
            df["relative_humidity"] = df.apply(
                lambda r: calculate_magnus_rh(r["temperature_c"], r["dew_point_c"])
                if pd.isna(r.get("relative_humidity")) else r["relative_humidity"],
                axis=1
            )
        df["vpd_kpa"] = df.apply(
            lambda r: calculate_vapor_pressure_deficit(r["temperature_c"], r["dew_point_c"]),
            axis=1
        )

    if "wind_speed_ms" in df and "wind_direction_deg" in df:
        vectors = df.apply(
            lambda r: calculate_wind_vectors(r["wind_speed_ms"], r["wind_direction_deg"]),
            axis=1
        )
        df["wind_u"] = [v[0] for v in vectors]
        df["wind_v"] = [v[1] for v in vectors]

    return df
