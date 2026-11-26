"""
Complaint Prioritization Service.
Calculates transparent priority score, priority queue ranking, timeline aging escalation, and explanation.
Formula: 
    Base Priority Score = Urgency Weight × Urgency Confidence (rounded to 2 decimal places)
    Dynamic Priority Score = min(100.0, Base Priority Score + Aging Boost)
"""

from typing import Dict, Any, Tuple, Optional, List
from datetime import datetime
from backend.app.config import settings

URGENCY_WEIGHTS = {
    "Critical": 100.0,
    "High": 75.0,
    "Medium": 50.0,
    "Low": 25.0
}

URGENCY_ACTION_DESCRIPTIONS = {
    "Critical": "Immediate attention required. High probability of hazard, life-safety risk, or major disruption.",
    "High": "Urgent attention required. Significant functional impediment to resident study or health.",
    "Medium": "Normal maintenance queue. Routine repair needed during standard operating hours.",
    "Low": "Routine maintenance queue. Minor cosmetic or non-blocking maintenance item."
}

SLA_HOURS = {
    "Critical": 12.0,
    "High": 24.0,
    "Medium": 48.0,
    "Low": 72.0
}

def calculate_priority(
    predicted_urgency: str,
    urgency_confidence: float,
    safety_override: bool = False,
    safety_reason: str = None,
    category_confidence: float = 1.0
) -> Dict[str, Any]:
    """
    Computes priority score and transparent explanation based on formula and safety escalation.
    """
    effective_urgency = "Critical" if safety_override else predicted_urgency
    weight = URGENCY_WEIGHTS.get(effective_urgency, 50.0)
    
    # Check if confidence meets threshold
    min_conf = min(category_confidence, urgency_confidence)
    requires_human_review = min_conf < settings.CONFIDENCE_THRESHOLD
    
    # If safety escalation occurred, confidence is anchored to high priority assurance
    effective_confidence = 1.0 if safety_override else urgency_confidence
    priority_score = round(weight * effective_confidence, 2)
    
    # Build transparent reasoning
    parts = []
    if safety_override:
        parts.append(f"[SAFETY ESCALATION] Escalated to Critical due to hazard: {safety_reason}")
        parts.append(f"Priority Score = 100.0 (Safety Override) = {priority_score:.2f}.")
    else:
        parts.append(
            f"Priority Score = Urgency Weight ({weight:.0f} for '{predicted_urgency}') × "
            f"Urgency Confidence ({urgency_confidence * 100:.1f}%) = {priority_score:.2f}."
        )
        parts.append(URGENCY_ACTION_DESCRIPTIONS.get(effective_urgency, ""))

    if requires_human_review:
        parts.append(
            f"[HUMAN REVIEW REQUIRED] Prediction confidence ({min_conf * 100:.1f}%) is below the "
            f"operational threshold ({settings.CONFIDENCE_THRESHOLD * 100:.0f}%). Needs administrator verification."
        )

    explanation = " ".join([p.strip() for p in parts if p.strip()])

    return {
        "final_urgency": effective_urgency,
        "priority_score": priority_score,
        "base_priority_score": priority_score,
        "priority_reason": explanation,
        "requires_human_review": requires_human_review
    }

def compute_aging_metrics(
    created_at: Optional[datetime],
    resolved_at: Optional[datetime],
    status: str,
    base_priority_score: float,
    final_urgency: str
) -> Dict[str, Any]:
    """
    Calculates time-dependent priority escalation (aging) to prevent task starvation.
    The longer an unresolved task remains pending, the higher its priority becomes.
    """
    if not created_at:
        created_at = datetime.utcnow()

    end_time = resolved_at if (status == "Resolved" and resolved_at) else datetime.utcnow()
    delta_seconds = max(0.0, (end_time - created_at).total_seconds())
    elapsed_hours = round(delta_seconds / 3600.0, 2)
    elapsed_days = round(elapsed_hours / 24.0, 1)

    # Human-readable elapsed string
    if elapsed_hours < 1.0:
        minutes = max(1, int(delta_seconds // 60))
        elapsed_str = f"{minutes}m ago"
    elif elapsed_hours < 24.0:
        hours = int(elapsed_hours)
        mins = int((delta_seconds % 3600) // 60)
        elapsed_str = f"{hours}h {mins}m ago" if mins > 0 else f"{hours}h ago"
    else:
        days = int(elapsed_hours // 24)
        rem_hours = int(elapsed_hours % 24)
        elapsed_str = f"{days}d {rem_hours}h ago" if rem_hours > 0 else f"{days}d ago"

    sla = SLA_HOURS.get(final_urgency, 48.0)
    is_overdue = (status != "Resolved") and (elapsed_hours > sla)
    overdue_hours = round(max(0.0, elapsed_hours - sla), 1) if is_overdue else 0.0

    # Aging Escalation Calculation:
    # If already resolved, the aging does not inflate active queue priority
    if status == "Resolved":
        aging_boost = 0.0
        effective_priority = base_priority_score
    else:
        # Graduated priority escalation rate:
        # First 6 hrs: grace period (+0.5 pts/hr -> up to +3 pts)
        # 6 to 24 hrs: +0.75 pts/hr -> (+16.5 pts at 24h)
        # 24 to 72 hrs: +0.5 pts/hr -> (+40.5 pts at 72h)
        # > 72 hrs: +0.2 pts/hr up to max +45.0 pts
        if elapsed_hours <= 6.0:
            aging_boost = round(elapsed_hours * 0.5, 2)
        elif elapsed_hours <= 24.0:
            aging_boost = round(3.0 + (elapsed_hours - 6.0) * 0.75, 2)
        elif elapsed_hours <= 72.0:
            aging_boost = round(16.5 + (elapsed_hours - 24.0) * 0.5, 2)
        else:
            aging_boost = round(min(45.0, 40.5 + (elapsed_hours - 72.0) * 0.2), 2)

        # Cap at 100.0
        effective_priority = round(min(100.0, base_priority_score + aging_boost), 2)

    # Timeline milestones
    timeline = [
        {
            "step": 1,
            "title": "Complaint Submitted",
            "timestamp": created_at.isoformat() if created_at else None,
            "status": "completed",
            "description": "Complaint registered in local edge database."
        },
        {
            "step": 2,
            "title": "NLP Classification & Base Priority",
            "timestamp": created_at.isoformat() if created_at else None,
            "status": "completed",
            "description": f"DistilBERT classified as '{final_urgency}' with Base Priority {base_priority_score:.2f}."
        }
    ]

    if aging_boost > 0 and status != "Resolved":
        timeline.append({
            "step": 3,
            "title": f"Timeline Aging Escalation (+{aging_boost:.1f} pts)",
            "timestamp": end_time.isoformat(),
            "status": "active",
            "description": f"Pending for {elapsed_str}. Priority escalated from {base_priority_score:.2f} to {effective_priority:.2f} to prevent task delay."
        })

    if is_overdue:
        timeline.append({
            "step": 4,
            "title": f"SLA Overdue Alert ({overdue_hours}h overdue)",
            "timestamp": end_time.isoformat(),
            "status": "warning",
            "description": f"Exceeded {sla:.0f}h SLA target for {final_urgency} urgency. Priority escalated."
        })

    if status == "In Progress":
        timeline.append({
            "step": 5,
            "title": "Work In Progress",
            "timestamp": None,
            "status": "in_progress",
            "description": "Maintenance technician has been dispatched and is actively resolving the issue."
        })
    elif status == "Resolved":
        timeline.append({
            "step": 5,
            "title": "Complaint Resolved",
            "timestamp": resolved_at.isoformat() if resolved_at else end_time.isoformat(),
            "status": "completed",
            "description": f"Maintenance complete. Total turnaround time: {elapsed_str}."
        })
    elif status == "Under Review":
        timeline.append({
            "step": 5,
            "title": "Under Administrative Review",
            "timestamp": None,
            "status": "review",
            "description": "Complaint flagged for supervisor physical inspection."
        })

    return {
        "elapsed_hours": elapsed_hours,
        "elapsed_days": elapsed_days,
        "elapsed_time_str": elapsed_str,
        "sla_hours": sla,
        "is_overdue": is_overdue,
        "overdue_hours": overdue_hours,
        "aging_boost": aging_boost,
        "effective_priority_score": effective_priority,
        "timeline": timeline
    }
