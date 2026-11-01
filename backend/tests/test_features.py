import math
import pytest
from datetime import datetime, timezone

from app.ingestion.validators import calculate_magnus_rh
from app.features.meteorology import calculate_wind_vectors, calculate_vapor_pressure_deficit
from app.spatial.calculations import (
    haversine_distance,
    calculate_bearing,
    convert_wind_direction_to_transport,
    compute_directional_screening_weight
)
from app.features.diwali_progression import compute_diwali_progression

def test_magnus_rh_basic():
    # At saturation (T = Td), RH must be 100%
    rh = calculate_magnus_rh(temperature_c=25.0, dew_point_c=25.0)
    assert rh == 100.0

    # With depression (T = 25, Td = 15), RH should be approx 53-55%
    rh_depressed = calculate_magnus_rh(temperature_c=25.0, dew_point_c=15.0)
    assert 50.0 <= rh_depressed <= 60.0

    # When Td > T (unphysical supersaturation), should cap at 100%
    rh_capped = calculate_magnus_rh(temperature_c=20.0, dew_point_c=25.0)
    assert rh_capped == 100.0

    # Low dew point gives positive valid RH
    rh_low = calculate_magnus_rh(temperature_c=30.0, dew_point_c=-5.0)
    assert 0.0 <= rh_low <= 15.0

def test_wind_vector_decomposition():
    # Wind FROM North (0 deg): blows south, so u=0, v=-ws
    u, v = calculate_wind_vectors(wind_speed_ms=10.0, wind_direction_deg=0.0)
    assert abs(u) < 1e-4
    assert abs(v - (-10.0)) < 1e-4

    # Wind FROM East (90 deg): blows west, so u=-ws, v=0
    u, v = calculate_wind_vectors(wind_speed_ms=10.0, wind_direction_deg=90.0)
    assert abs(u - (-10.0)) < 1e-4
    assert abs(v) < 1e-4

    # Wind FROM South (180 deg): blows north, so u=0, v=+ws
    u, v = calculate_wind_vectors(wind_speed_ms=10.0, wind_direction_deg=180.0)
    assert abs(u) < 1e-4
    assert abs(v - 10.0) < 1e-4

def test_haversine_distance():
    # Zero distance between identical coordinates
    assert haversine_distance(28.61, 77.21, 28.61, 77.21) == 0.0

    # Distance between Delhi and Patiala is ~210-230 km
    d = haversine_distance(28.6139, 77.2090, 30.3564, 76.3647)
    assert 200.0 <= d <= 240.0

def test_directional_screening_weight():
    # Source at North (30.0, 77.0), Receptor at South (28.0, 77.0)
    # Bearing from source to receptor is ~180 deg (South)
    # Wind is FROM North (0 deg), so transport direction is South (180 deg)
    # Alignment is 100% aligned -> max weight
    weight_aligned = compute_directional_screening_weight(
        source_lat=30.0, source_lon=77.0,
        receptor_lat=28.0, receptor_lon=77.0,
        wind_from_deg=0.0,
        decay_length_km=250.0
    )
    assert weight_aligned > 0.0

    # Opposite wind: Wind is FROM South (180 deg), transport is North (0 deg)
    # Plume blows AWAY from receptor -> weight must be 0.0
    weight_opposed = compute_directional_screening_weight(
        source_lat=30.0, source_lon=77.0,
        receptor_lat=28.0, receptor_lon=77.0,
        wind_from_deg=180.0,
        decay_length_km=250.0
    )
    assert weight_opposed == 0.0

def test_diwali_progression_execution():
    result = compute_diwali_progression(pollutant="PM2.5")
    assert "baseline_profile" in result
    assert "historical_years" in result
    assert result["total_observations_analyzed"] > 0
    assert len(result["baseline_profile"]) > 0

    # Ensure Day 0 or Day 1 peak exists
    has_peak = any(pt["is_peak"] for pt in result["baseline_profile"])
    assert has_peak is True
