import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_experiment_summary():
    response = client.get("/api/experiment/summary")
    assert response.status_code == 200
    data = response.json()
    assert data.get("stations") == 15
    assert data.get("raw_rows") == 2589083
    assert data.get("modeling_subset_rows") == 705691
    assert data.get("pm25_nonmissing_rows") == 527868
    assert "DL002" in data.get("selected_station_ids", [])

def test_experiment_metrics_and_accuracy():
    response = client.get("/api/experiment/metrics")
    assert response.status_code == 200
    data = response.json()
    test_metrics = data.get("test_metrics_2019", [])
    assert len(test_metrics) == 18 # 6 models * 3 evaluation windows

    # Verify All 2019 metrics
    all_2019 = {m["Model"]: m for m in test_metrics if m["Evaluation"] == "All_2019"}
    assert "Residual_XGBoost" in all_2019
    assert "Weighted_Ensemble" in all_2019
    assert "Persistence" in all_2019

    # Residual XGBoost has lowest MAE (12.711)
    assert abs(all_2019["Residual_XGBoost"]["MAE"] - 12.711) < 0.01
    # Weighted Ensemble has lowest RMSE (26.334)
    assert abs(all_2019["Weighted_Ensemble"]["RMSE"] - 26.334) < 0.01

    # Verify Diwali +- 7d metrics
    d7 = {m["Model"]: m for m in test_metrics if m["Evaluation"] == "Diwali_7d"}
    assert abs(d7["Residual_XGBoost"]["MAE"] - 15.965) < 0.01
    assert abs(d7["Weighted_Ensemble"]["RMSE"] - 29.902) < 0.01

    # Verify Diwali +- 3d metrics
    d3 = {m["Model"]: m for m in test_metrics if m["Evaluation"] == "Diwali_3d"}
    assert abs(d3["Residual_XGBoost"]["MAE"] - 17.618) < 0.01
    assert abs(d3["Weighted_Ensemble"]["RMSE"] - 35.338) < 0.01

def test_experiment_ensemble_weights():
    response = client.get("/api/experiment/ensemble-weights")
    assert response.status_code == 200
    weights = {w["Model"]: w["Validation_Ensemble_Weight"] for w in response.json()}
    assert pytest.approx(weights.get("RandomForest"), 0.001) == 0.00
    assert pytest.approx(weights.get("XGBoost"), 0.001) == 0.05
    assert pytest.approx(weights.get("LightGBM"), 0.001) == 0.45
    assert pytest.approx(weights.get("Residual_XGBoost"), 0.001) == 0.50

def test_experiment_feature_importance():
    response = client.get("/api/experiment/feature-importance?model=LightGBM")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    top_feature = data[0]["Feature"]
    assert top_feature == "PM2.5"

def test_experiment_stations():
    response = client.get("/api/experiment/stations")
    assert response.status_code == 200
    stations = response.json()
    assert len(stations) == 15
    stn_map = {s["id"]: s for s in stations}
    assert "DL002" in stn_map
    assert stn_map["DL002"]["name"] == "Anand Vihar, Delhi"
    assert stn_map["DL002"]["is_verified_cpcb"] is True

def test_experiment_predictions_sample():
    response = client.get("/api/experiment/predictions-sample?station_id=DL002&window=diwali_7d&limit=10")
    assert response.status_code == 200
    data = response.json()
    assert data["station_id"] == "DL002"
    assert data["window"] == "diwali_7d"
    assert len(data["rows"]) == 10
    row = data["rows"][0]
    assert row["StationId"] == "DL002"
    assert "target_next_hour" in row
    assert "Residual_XGBoost_prediction" in row

def test_experiment_diwali_timeseries():
    response = client.get("/api/experiment/diwali-timeseries?station_id=DL002")
    assert response.status_code == 200
    data = response.json()
    assert data["station_id"] == "DL002"
    assert data["total_points"] > 0
    # Check that Diwali day is marked
    diwali_pts = [p for p in data["points"] if p.get("is_diwali_day")]
    assert len(diwali_pts) > 0
