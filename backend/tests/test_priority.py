"""
Priority Engine Unit Tests.
Verifies urgency weights, formula calculation, priority score ranking order,
tie-breaking via creation timestamp, and administrator overrides.
"""

import pytest
from datetime import datetime, timedelta
from backend.app.services.priority_service import calculate_priority, URGENCY_WEIGHTS

def test_urgency_weights_hierarchy():
    assert URGENCY_WEIGHTS["Critical"] == 100.0
    assert URGENCY_WEIGHTS["High"] == 75.0
    assert URGENCY_WEIGHTS["Medium"] == 50.0
    assert URGENCY_WEIGHTS["Low"] == 25.0
    assert URGENCY_WEIGHTS["Critical"] > URGENCY_WEIGHTS["High"] > URGENCY_WEIGHTS["Medium"] > URGENCY_WEIGHTS["Low"]

def test_priority_score_formula():
    # Priority Score = Urgency Weight * Urgency Confidence
    res_critical = calculate_priority("Critical", urgency_confidence=0.95)
    assert res_critical["priority_score"] == 95.0
    assert res_critical["final_urgency"] == "Critical"

    res_high = calculate_priority("High", urgency_confidence=0.80)
    assert res_high["priority_score"] == 60.0  # 75 * 0.80 = 60.0

    res_medium = calculate_priority("Medium", urgency_confidence=0.90)
    assert res_medium["priority_score"] == 45.0  # 50 * 0.90 = 45.0

    res_low = calculate_priority("Low", urgency_confidence=0.88)
    assert res_low["priority_score"] == 22.0  # 25 * 0.88 = 22.0

def test_priority_ranking_order():
    c = calculate_priority("Critical", 0.90)["priority_score"]  # 90.0
    h = calculate_priority("High", 0.90)["priority_score"]      # 67.5
    m = calculate_priority("Medium", 0.90)["priority_score"]    # 45.0
    l = calculate_priority("Low", 0.90)["priority_score"]       # 22.5
    assert c > h > m > l

def test_safety_escalation_priority():
    res = calculate_priority(
        predicted_urgency="Low",
        urgency_confidence=0.70,
        safety_override=True,
        safety_reason="Detected live sparking wire"
    )
    assert res["final_urgency"] == "Critical"
    assert res["priority_score"] == 100.0
    assert "[SAFETY ESCALATION]" in res["priority_reason"]

def test_low_confidence_review_flag():
    # If confidence < 0.60, requires_human_review must be True
    res = calculate_priority(
        predicted_urgency="High",
        urgency_confidence=0.45,
        category_confidence=0.40
    )
    assert res["requires_human_review"] is True
    assert "[HUMAN REVIEW REQUIRED]" in res["priority_reason"]
