from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_n8n_integration_health():
    resp = client.get("/api/automation/integrations/n8n/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["workflows_verified"] == 6
    assert data["workflows_valid"] is True

def test_workflow_status():
    resp = client.get("/api/automation/workflow-status")
    assert resp.status_code == 200
    workflows = resp.json()
    assert len(workflows) == 6
    names = [w["name"] for w in workflows]
    assert any("Hourly CPCB" in n for n in names)
    assert any("Forecasting" in n for n in names)
    assert any("Alert" in n for n in names)

def test_workflow_trigger():
    resp = client.post("/api/automation/trigger/workflow_a_data_ingestion", json={
        "workflow_id": "workflow_a_data_ingestion"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert "triggered successfully" in data["message"]

def test_blooms_decision_support_endpoints():
    resp1 = client.get("/api/decision-support/framework")
    assert resp1.status_code == 200
    framework = resp1.json()
    assert len(framework["levels"]) == 6

    resp2 = client.post("/api/decision-support/action-plan", json={
        "neighbourhood_id": "DEL_ANAND_VIHAR",
        "vulnerability_group": "children",
        "planned_activities": ["School assembly", "Evening outdoor sports"]
    })
    assert resp2.status_code == 200
    plan = resp2.json()
    assert "Anand Vihar" in plan["neighbourhood_name"]
    assert len(plan["immediate_actions"]) > 0
    assert len(plan["indoor_guidance"]) > 0
    assert "purifier_sizing_recommendation" in plan
