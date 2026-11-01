from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_community_report_submission_and_scoring():
    payload = {
        "latitude": 28.6480,
        "longitude": 77.3180,
        "neighbourhood_id": "DEL_ANAND_VIHAR",
        "category": "Dense Smoke",
        "description": "Thick acrid smoke cloud settling over Anand Vihar bus terminal.",
        "visibility_level": "< 100m",
        "smell_intensity": "Heavy burning smell",
        "cracker_activity": "Continuous heavy bursts",
        "reporter_id": "tester_citizen_1"
    }
    resp = client.post("/api/community/reports", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"].startswith("REP_")
    assert data["reliability_score"] >= 70.0
    assert data["status"] == "verified"

def test_community_reports_listing():
    resp = client.get("/api/community/reports")
    assert resp.status_code == 200
    reports = resp.json()
    assert len(reports) >= 5

def test_community_clusters():
    resp = client.get("/api/community/clusters")
    assert resp.status_code == 200
    clusters = resp.json()
    assert len(clusters) >= 1
    assert "report_count" in clusters[0]
    assert "center_lat" in clusters[0]

def test_report_upvote():
    # Fetch existing report
    list_resp = client.get("/api/community/reports")
    first_id = list_resp.json()[0]["id"]
    resp = client.post(f"/api/community/reports/{first_id}/upvote")
    assert resp.status_code == 200
    assert resp.json()["status"] == "upvoted"
