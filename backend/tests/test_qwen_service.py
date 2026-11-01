import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.qwen_service import qwen_service
from app.schemas.advanced_schemas import QwenChatMessage

client = TestClient(app)

def test_qwen_health():
    resp = client.get("/api/ai/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ready"
    assert data["offline_fallback_enabled"] is True
    assert "models" in data

@pytest.mark.anyio
async def test_qwen_chat_offline_grounding():
    resp = await qwen_service.chat(
        messages=[QwenChatMessage(role="user", content="Why is the PM2.5 level spiking at Anand Vihar?")],
        location_id="DEL_ANAND_VIHAR"
    )
    assert resp.reply is not None
    assert len(resp.reply) > 20
    assert resp.offline_fallback in (True, False)
    assert ("Anand Vihar" in resp.reply) or ("PM2.5" in resp.reply) or ("observed" in resp.reply.lower())

def test_explain_prediction_endpoint():
    resp = client.post("/api/ai/explain-prediction", json={
        "location_id": "DEL_ANAND_VIHAR",
        "pollutant": "PM2.5",
        "horizon_hours": 6
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["location_id"] == "DEL_ANAND_VIHAR"
    assert len(data["feature_attributions"]) >= 3
    assert data["predicted_value"] > 0
    assert "confidence_interval" in data

def test_event_analysis_endpoint():
    resp = client.post("/api/ai/analyze-event", json={
        "event_name": "Diwali Festival Peak"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["peak_aqi"] >= 400
    assert data["firecracker_surge_contribution_pct"] > 0
    assert len(data["key_takeaways"]) >= 2

def test_natural_search_endpoint():
    resp = client.post("/api/ai/natural-search", json={
        "query": "Show me forecasts above 400 at Anand Vihar"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "Anand Vihar" in data["direct_answer"] or len(data["matched_stations"]) > 0
