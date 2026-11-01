import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client():
    return TestClient(app)

def test_health(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["offline_ready"] is True

def test_summary(client):
    res = client.get("/api/data/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["total_observations"] > 0
    assert data["active_stations_count"] > 0
    assert data["database_connected"] is True

def test_neighbourhoods(client):
    res = client.get("/api/neighbourhoods")
    assert res.status_code == 200
    stns = res.json()
    assert len(stns) >= 5
    stn_ids = [s["id"] for s in stns]
    assert "DEL_ANAND_VIHAR" in stn_ids
    assert "PUN_PATIALA_THAPAR" in stn_ids

def test_pollution_history(client):
    res = client.get("/api/pollution/history?location_id=DEL_ANAND_VIHAR&pollutant=PM2.5&limit=20")
    assert res.status_code == 200
    rows = res.json()
    assert len(rows) > 0
    assert rows[0]["pollutant"] == "PM2.5"
    assert rows[0]["location_id"] == "DEL_ANAND_VIHAR"

def test_diwali_progression(client):
    res = client.get("/api/diwali/progression?pollutant=PM2.5")
    assert res.status_code == 200
    data = res.json()
    assert "baseline_profile" in data
    assert "historical_years" in data
    assert len(data["baseline_profile"]) > 0

def test_model_status_and_evaluation(client):
    res_status = client.get("/api/model/status")
    assert res_status.status_code == 200
    assert "supported_horizons" in res_status.json()

    res_eval = client.get("/api/model/evaluation")
    assert res_eval.status_code == 200
    data_eval = res_eval.json()
    assert "evaluations" in data_eval
    assert "ablation_suite" in data_eval
    assert len(data_eval["ablation_suite"]) == 6

def test_forecast_endpoint(client):
    req_body = {
        "location_id": "DEL_ANAND_VIHAR",
        "pollutant": "PM2.5",
        "horizon_hours": 1
    }
    res = client.post("/api/forecast", json=req_body)
    assert res.status_code == 200
    fc = res.json()
    assert fc["location_id"] == "DEL_ANAND_VIHAR"
    assert fc["point_forecast"] > 0.0
    assert fc["lower_bound_80"] <= fc["point_forecast"] <= fc["upper_bound_80"]
    assert fc["lower_bound_95"] <= fc["lower_bound_80"]
    assert fc["uncertainty_calibrated"] is True

def test_latest_forecasts(client):
    res = client.get("/api/forecast/latest?location_id=DEL_ANAND_VIHAR&pollutant=PM2.5")
    assert res.status_code == 200
    data = res.json()
    assert "current_observation" in data
    assert len(data["forecasts"]) == 4 # 1h, 3h, 6h, 24h

def test_sources_status(client):
    res = client.get("/api/sources/status?location_id=DEL_ANAND_VIHAR")
    assert res.status_code == 200
    data = res.json()
    assert "meteorology" in data
    assert "traffic" in data
    assert "active_fires" in data

def test_scenario_comparison(client):
    req_body = {
        "location_id": "DEL_ANAND_VIHAR",
        "pollutant": "PM2.5",
        "horizon_hours": 1,
        "wind_speed_multiplier": 1.5,
        "wind_direction_shift_deg": -20.0,
        "traffic_reduction_pct": 30.0,
        "fire_activity_multiplier": 0.5,
        "humidity_shift_pct": -10.0
    }
    res = client.post("/api/scenarios/compare", json=req_body)
    assert res.status_code == 200
    data = res.json()
    assert "baseline_forecast" in data
    assert "scenario_forecast" in data
    assert "delta_concentration" in data
    assert "disclaimer" in data
    assert "counterfactual_assumptions" in data

def test_data_quality_endpoint(client):
    res = client.get("/api/data/quality")
    assert res.status_code == 200
    data = res.json()
    assert "total_observations" in data
    assert "quality_flag_distribution" in data
    assert "station_coverage" in data
    assert "is_small_dataset_safeguard_active" in data

def test_peak_and_recovery_endpoint(client):
    res = client.get("/api/forecast/peak-recovery?location_id=DEL_ANAND_VIHAR")
    assert res.status_code == 200
    data = res.json()
    assert "max_predicted_pm25" in data
    assert "predicted_peak_horizon_hours" in data
    assert "recovery_threshold_pm25" in data
    assert "recovery_status" in data
    assert "recovery_criterion" in data

