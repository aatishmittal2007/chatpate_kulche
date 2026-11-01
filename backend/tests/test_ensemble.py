import numpy as np
from fastapi.testclient import TestClient
from app.main import app
from app.models.forecaster import RandomForestForecaster, HybridEnsembleForecaster
from app.models.benchmark import run_multi_model_benchmark

client = TestClient(app)

def test_random_forest_forecaster_fit_predict():
    rf = RandomForestForecaster(n_estimators=10, max_depth=3)
    X = np.random.randn(20, 5)
    y = np.random.randn(20) * 10 + 100
    rf.fit(X, y)
    preds = rf.predict(X[:5])
    assert len(preds) == 5

def test_hybrid_ensemble_forecaster():
    ensemble = HybridEnsembleForecaster()
    X = np.random.randn(25, 4)
    residuals = np.random.randn(25) * 5
    ensemble.fit(X, residuals)
    pred_res = ensemble.predict_residual(X[:3])
    assert len(pred_res) == 3

def test_multi_model_benchmark_suite():
    benchmarks = run_multi_model_benchmark()
    assert len(benchmarks) >= 10
    model_names = set(b.model_name for b in benchmarks)
    assert "Persistence Baseline" in model_names
    assert "Historical Progression Baseline" in model_names
    assert "Random Forest Regressor" in model_names
    assert "Direct XGBoost Regressor" in model_names
    assert "Hybrid Ensemble (XGB + RF + Res)" in model_names

def test_analytics_endpoints():
    resp1 = client.get("/api/analytics/model-comparison?pollutant=PM2.5&horizon_hours=6")
    assert resp1.status_code == 200
    assert len(resp1.json()) == 5

    resp2 = client.get("/api/analytics/weather-correlations?limit=10")
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert len(data2) > 0
    assert "magnus_rh" in data2[0]
    assert "ventilation_index" in data2[0]

    resp3 = client.get("/api/analytics/fire-lag-correlation")
    assert resp3.status_code == 200
    assert len(resp3.json()) >= 6
