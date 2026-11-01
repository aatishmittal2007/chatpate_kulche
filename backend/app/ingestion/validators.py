import math
from datetime import datetime, timezone
from typing import Optional, Tuple
import re

def validate_coordinates(lat: float, lon: float) -> Tuple[bool, Optional[str]]:
    if not (-90.0 <= lat <= 90.0):
        return False, f"Latitude {lat} out of planetary bounds [-90, 90]"
    if not (-180.0 <= lon <= 180.0):
        return False, f"Longitude {lon} out of planetary bounds [-180, 180]"
    return True, None

def validate_pollutant_unit(pollutant: str, unit: str) -> Tuple[bool, str]:
    normalized_unit = unit.strip().lower().replace("µ", "u").replace("³", "3")
    if pollutant.upper() in ["PM2.5", "PM10"]:
        if normalized_unit in ["ug/m3", "ug/m^3", "mg/m3"]:
            return True, "ug/m3"
        return False, f"Invalid unit '{unit}' for {pollutant}. Expected ug/m3."
    return True, unit

def parse_and_normalize_timestamp(ts_str: str) -> datetime:
    ts_clean = str(ts_str).strip()
    # Try standard ISO
    try:
        dt = datetime.fromisoformat(ts_clean.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except Exception:
        pass

    # Try common formats
    formats = [
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%d-%m-%Y %H:%M:%S",
        "%d-%m-%Y %H:%M",
        "%Y/%m/%d %H:%M:%S",
        "%d/%m/%Y %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S",
    ]
    for fmt in formats:
        try:
            dt = datetime.strptime(ts_clean, fmt)
            # Default to UTC if not specified
            return dt.replace(tzinfo=timezone.utc)
        except ValueError:
            continue

    raise ValueError(f"Unrecognized timestamp format: '{ts_str}'")

def validate_concentration_value(pollutant: str, value: float) -> Tuple[str, Optional[str]]:
    if math.isnan(value) or value is None:
        return "missing", "Missing concentration value"
    if value < 0:
        return "suspect", f"Negative concentration {value} for {pollutant}"
    if value > 1800.0:
        return "suspect", f"Extreme unverified concentration {value} > 1800 ug/m3 for {pollutant}"
    return "valid", None

def calculate_magnus_rh(temperature_c: float, dew_point_c: float) -> float:
    """
    Magnus relationship for Relative Humidity:
    RH = 100 * exp[(a*Td / (b + Td)) - (a*T / (b + T))]
    Constants (Sonntag 1990 / Alduchov & Eskridge 1996):
    a = 17.625, b = 243.04 deg C
    """
    a = 17.625
    b = 243.04

    # Dew point cannot physically exceed dry bulb temperature (super-saturation in ambient air is capped at ~100% RH)
    if dew_point_c > temperature_c:
        dew_point_c = temperature_c

    num_td = a * dew_point_c
    den_td = b + dew_point_c
    num_t = a * temperature_c
    den_t = b + temperature_c

    if den_td == 0 or den_t == 0:
        return 50.0

    exponent = (num_td / den_td) - (num_t / den_t)
    rh = 100.0 * math.exp(exponent)
    return max(0.0, min(100.0, round(rh, 2)))
