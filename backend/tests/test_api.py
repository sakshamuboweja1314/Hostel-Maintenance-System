"""
FastAPI REST API Integration Tests.
Tests all endpoints: Health, Model Status/Predict/Metrics, Complaints CRUD/Status/Override/History,
Dashboard stats/distribution, and Prompt Engineering templates/analysis.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client

def test_health_endpoint(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["backend"] == "online"
    assert "SQLite" in data["database"]

def test_model_status_endpoint(client):
    res = client.get("/api/model/status")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ready"
    assert data["category_model_loaded"] is True
    assert data["urgency_model_loaded"] is True
    assert len(data["category_classes"]) == 6
    assert len(data["urgency_classes"]) == 4

def test_model_metrics_endpoint(client):
    res = client.get("/api/model/metrics")
    assert res.status_code == 200
    data = res.json()
    assert "category_model" in data
    assert "urgency_model" in data
    assert data["category_model"]["accuracy"] >= 0.90
    assert data["urgency_model"]["accuracy"] >= 0.90

def test_predict_only_endpoint(client):
    res = client.post("/api/model/predict", json={
        "complaint_text": "The corridor Wi-Fi router keeps resetting every 5 minutes."
    })
    assert res.status_code == 200
    data = res.json()
    assert data["predicted_category"] == "Internet and Wi-Fi"
    assert data["priority_score"] > 0.0

def test_submit_complaint_and_retrieve(client):
    payload = {
        "complaint_text": "Ceiling fan regulator in Room 310 is broken and stuck at maximum speed.",
        "student_name": "Karan Mehra",
        "room_number": "Room 310",
        "hostel_block": "Block B"
    }
    create_res = client.post("/api/complaints", json=payload)
    assert create_res.status_code == 201
    created = create_res.json()
    assert created["id"] is not None
    assert created["predicted_category"] == "Electrical"
    assert created["status"] == "Pending"

    # Fetch by ID
    get_res = client.get(f"/api/complaints/{created['id']}")
    assert get_res.status_code == 200
    assert get_res.json()["room_number"] == "Room 310"

    # Update Status
    status_res = client.patch(f"/api/complaints/{created['id']}/status", json={
        "status": "In Progress",
        "admin_notes": "Electrician dispatched to Room 310."
    })
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "In Progress"

    # Override Priority
    override_res = client.patch(f"/api/complaints/{created['id']}/priority", json={
        "override_urgency": "High",
        "admin_reason": "High noise preventing student sleep"
    })
    assert override_res.status_code == 200
    assert override_res.json()["final_urgency"] == "High"

    # Check History
    hist_res = client.get(f"/api/complaints/{created['id']}/history")
    assert hist_res.status_code == 200
    actions = [h["action"] for h in hist_res.json()]
    assert "CREATED" in actions
    assert "STATUS_UPDATED" in actions
    assert "PRIORITY_OVERRIDDEN" in actions

def test_empty_complaint_rejection(client):
    res = client.post("/api/complaints", json={
        "complaint_text": "   "
    })
    assert res.status_code == 422

def test_complaints_filtering_and_search(client):
    res = client.get("/api/complaints?category=Electrical")
    assert res.status_code == 200
    data = res.json()
    assert "complaints" in data
    assert all(c["predicted_category"] == "Electrical" for c in data["complaints"])

def test_dashboard_stats_and_distribution(client):
    stats_res = client.get("/api/dashboard/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert "total_complaints" in stats
    assert "pending_complaints" in stats
    assert stats["total_complaints"] >= 1

    dist_res = client.get("/api/dashboard/distribution")
    assert dist_res.status_code == 200
    dist = dist_res.json()
    assert "by_category" in dist
    assert "by_urgency" in dist

def test_prompt_engineering_endpoints(client):
    # Templates
    tmpl_res = client.get("/api/prompts/templates")
    assert tmpl_res.status_code == 200
    assert "zero_shot" in tmpl_res.json()["strategies"]
    assert "few_shot" in tmpl_res.json()["strategies"]

    # Analyze
    analyze_res = client.post("/api/prompts/analyze", json={
        "complaint_text": "The washroom tap is broken.",
        "prompt_strategy": "few_shot"
    })
    assert analyze_res.status_code == 200
    data = analyze_res.json()
    assert "compiled_prompt" in data
    assert "The washroom tap is broken." in data["compiled_prompt"]
