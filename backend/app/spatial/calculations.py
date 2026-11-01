import math
from typing import Tuple

EARTH_RADIUS_KM = 6371.0

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes great-circle distance between two points on the Earth surface using Haversine formula.
    Returns distance in kilometers.
    """
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    return EARTH_RADIUS_KM * c

def calculate_bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates initial bearing (azimuth in degrees, 0-360) from point 1 (source) to point 2 (receptor).
    """
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_lambda = math.radians(lon2 - lon1)

    y = math.sin(delta_lambda) * math.cos(phi2)
    x = (math.cos(phi1) * math.sin(phi2) -
         math.sin(phi1) * math.cos(phi2) * math.cos(delta_lambda))

    bearing_rad = math.atan2(y, x)
    bearing_deg = (math.degrees(bearing_rad) + 360.0) % 360.0
    return bearing_deg

def convert_wind_direction_to_transport(wind_from_deg: float) -> float:
    """
    Meteorological wind direction denotes WHERE the wind is blowing FROM.
    Transport direction is WHERE the plume travels TO.
    theta_transport = (theta_from + 180) % 360
    """
    return (wind_from_deg + 180.0) % 360.0

def compute_directional_screening_weight(
    source_lat: float,
    source_lon: float,
    receptor_lat: float,
    receptor_lon: float,
    wind_from_deg: float,
    decay_length_km: float = 150.0
) -> float:
    """
    Calculates directional screening weight w(i,j,t) between source j and receptor i:
    w(i,j,t) = exp(-distance(i,j) / L) * max(0, cos(direction_difference))

    NOTE ON SCIENTIFIC USE:
    This weight is an empirical source-proximity and transport-alignment proxy, NOT
    a direct estimate or physical dispersion simulation of ground-level concentration.
    """
    dist_km = haversine_distance(source_lat, source_lon, receptor_lat, receptor_lon)
    bearing_source_to_receptor = calculate_bearing(source_lat, source_lon, receptor_lat, receptor_lon)
    transport_deg = convert_wind_direction_to_transport(wind_from_deg)

    diff_deg = abs(transport_deg - bearing_source_to_receptor)
    diff_rad = math.radians(diff_deg)

    # Cosine alignment: positive only if transport aligns within +/- 90 degrees of receptor
    alignment = max(0.0, math.cos(diff_rad))
    decay = math.exp(-dist_km / decay_length_km)

    return decay * alignment
