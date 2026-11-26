"""
NLP Inference and Edge Model Unit Tests.
Tests tokenization, sequence classification across all 6 categories,
urgency levels, edge cases (empty, long, ambiguous), and safety escalation.
"""

import pytest
from backend.app.services.inference_service import inference_service

@pytest.fixture(scope="module", autouse=True)
def setup_models():
    """Ensure models are loaded once before running inference tests."""
    if not inference_service.is_loaded:
        inference_service.load_models()
    assert inference_service.is_loaded, "Inference service failed to load DistilBERT models."

def test_water_plumbing_inference():
    text = "The bathroom tap in Room 204 is leaking heavily and the floor is flooding."
    pred = inference_service.predict(text)
    assert pred["predicted_category"] == "Water and Plumbing"
    assert pred["category_confidence"] > 0.50
    assert pred["final_urgency"] in ["Critical", "High", "Medium"]
    assert 0.0 <= pred["priority_score"] <= 100.0

def test_electrical_fault_inference():
    text = "Visible sparks and burning plastic smell coming from the wall switchboard."
    pred = inference_service.predict(text)
    assert pred["predicted_category"] == "Electrical"
    assert pred["final_urgency"] == "Critical"
    assert pred["safety_override"] is True  # Detected sparks hazard
    assert pred["priority_score"] == 100.0

def test_wifi_complaint_inference():
    text = "Wi-Fi access point in 3rd floor corridor is completely down before online exam."
    pred = inference_service.predict(text)
    assert pred["predicted_category"] == "Internet and Wi-Fi"
    assert pred["final_urgency"] in ["Critical", "High"]
    assert pred["priority_score"] >= 60.0

def test_cleanliness_complaint_inference():
    text = "Common washroom has foul stench and dustbins have not been emptied for days."
    pred = inference_service.predict(text)
    assert pred["predicted_category"] == "Cleanliness and Sanitation"
    assert pred["category_confidence"] > 0.60

def test_furniture_damage_inference():
    text = "Study chair leg is cracked and wobbles dangerously when seated."
    pred = inference_service.predict(text)
    assert pred["predicted_category"] == "Furniture and Civil Maintenance"
    assert pred["priority_score"] > 0.0

def test_safety_escalation_triggers():
    text = "Emergency: exposed live wire hanging from corridor ceiling touching the metal door."
    pred = inference_service.predict(text)
    assert pred["safety_override"] is True
    assert pred["final_urgency"] == "Critical"
    assert pred["priority_score"] == 100.0
    assert "hazard" in pred["priority_reason"].lower() or "safety" in pred["priority_reason"].lower()

def test_very_long_complaint_truncation():
    # DistilBERT max length is 128 tokens; test input with 500 words
    long_text = "Water is leaking from pipe. " * 100
    pred = inference_service.predict(long_text)
    assert pred["predicted_category"] == "Water and Plumbing"
    assert pred["processing_time_ms"] > 0.0

def test_low_urgency_routine_complaint():
    text = "Wall clock in common study hall is running 10 minutes slow."
    pred = inference_service.predict(text)
    assert pred["predicted_category"] == "Other"
    assert pred["final_urgency"] in ["Low", "Medium"]
    assert pred["priority_score"] <= 55.0

def test_latency_is_edge_viable():
    text = "Minor tap leak in bathroom sink."
    pred = inference_service.predict(text)
    # CPU inference on edge should complete under 500 ms per sample
    assert pred["processing_time_ms"] < 500.0
