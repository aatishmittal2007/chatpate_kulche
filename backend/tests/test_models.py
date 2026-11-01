import pytest
from pathlib import Path
import os
import numpy as np
import pandas as pd

from app.models.baseline import PersistenceBaseline, HistoricalProgressionBaseline
from app.models.forecaster import HorizonModel
from app.evaluation.evaluator import run_chronological_evaluation

def test_persistence_baseline():
    model = PersistenceBaseline()
    pred = model.predict(142.5)
    assert pred == 142.5

def test_historical_progression_baseline():
    model = HistoricalProgressionBaseline()
    r_days = np.array([-2, -1, 0, 0, 1, 2])
    vals = np.array([100.0, 120.0, 350.0, 370.0, 250.0, 180.0])
    model.fit(r_days, vals)

    # Relative day 0 should return median of [350, 370] = 360
    assert model.predict(0, fallback_val=50.0) == 360.0
    # Unseen day returns fallback
    assert model.predict(10, fallback_val=50.0) == 50.0

def test_chronological_evaluation_and_serialization(tmp_path):
    report = run_chronological_evaluation()
    assert report["models_trained_count"] > 0
    assert len(report["evaluations"]) > 0
    assert len(report["ablation_suite"]) == 6

    # Verify that model artifacts exist on disk and can be reloaded
    loaded = HorizonModel.load(pollutant="PM2.5", horizon_hours=1)
    assert loaded is not None
    assert loaded.pollutant == "PM2.5"
    assert loaded.horizon_hours == 1

    # Verify prediction with uncertainty bounds
    test_features = {
        "latest_val": 150.0,
        "baseline_persistence": 150.0,
        "lag_1h": 145.0,
        "lag_3h": 140.0,
        "lag_6h": 135.0,
        "lag_24h": 120.0,
        "rolling_mean_6h": 142.0,
        "rel_day_int": 0,
        "hour_sin": 0.5,
        "hour_cos": -0.86,
        "temperature_c": 22.0,
        "dew_point_c": 17.0,
        "relative_humidity": 73.0,
        "wind_speed_ms": 1.5,
        "wind_u": -1.0,
        "wind_v": -1.0,
        "vpd_kpa": 0.7,
        "vehicle_count_hourly": 1200,
        "average_speed_kmh": 25.0,
        "congestion_index": 0.5,
        "directional_fire_index": 2.5,
        "min_fire_distance_km": 80.0,
        "aerosol_optical_depth": 0.75,
        "aerosol_index": 1.4
    }

    pred, lower_80, upper_80, lower_95, upper_95 = loaded.predict(test_features)
    assert pred > 0.0
    assert 0.0 <= lower_80 <= pred <= upper_80
    assert 0.0 <= lower_95 <= lower_80
    assert upper_80 <= upper_95
