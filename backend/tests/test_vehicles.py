from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_vehicle_detection_sampling():
    resp = client.post("/api/vehicles/detect?duration_seconds=15")
    assert resp.status_code == 200
    data = resp.json()
    assert data["processed_frames"] == 15 * 30
    assert data["total_vehicles_detected"] > 0
    assert data["class_breakdown"]["cars"] > 0
    assert data["class_breakdown"]["motorcycles"] > 0
    assert data["estimated_hourly_pm25_kg"] > 0

def test_road_corridors_retrieval():
    resp = client.get("/api/vehicles/road-segments")
    assert resp.status_code == 200
    corridors = resp.json()
    assert len(corridors) >= 5
    first = corridors[0]
    assert "name" in first
    assert "congestion_index" in first
    assert "estimated_pm25_kgh" in first

def test_vehicle_counts_retrieval():
    resp = client.get("/api/vehicles/counts")
    assert resp.status_code == 200
    counts = resp.json()
    assert len(counts) >= 5

def test_clean_route_exposure_solver():
    resp = client.post("/api/vehicles/route-exposure", json={
        "origin": "Connaught Place",
        "destination": "Anand Vihar",
        "travel_mode": "car"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["potential_exposure_reduction_pct"] > 0
    assert data["standard_route"]["cumulative_exposure_index"] > data["clean_route"]["cumulative_exposure_index"]
    assert len(data["clean_route"]["corridors_traversed"]) > 0
