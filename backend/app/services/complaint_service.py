"""
Complaint Business Logic Service.
Orchestrates database operations, history logging, and administrative workflows.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc, func

from backend.app.models.complaint import Complaint
from backend.app.models.complaint_history import ComplaintHistory
from backend.app.schemas.complaint_schema import ComplaintCreate, ComplaintStatusUpdate, ComplaintPriorityOverride
from backend.app.services.inference_service import inference_service
from backend.app.services.priority_service import URGENCY_WEIGHTS, compute_aging_metrics

class ComplaintService:
    @staticmethod
    def enrich_complaint_dict(complaint: Complaint) -> Dict[str, Any]:
        """Calculates aging timeline metrics and dynamic priority for a complaint."""
        base_score = complaint.base_priority_score if complaint.base_priority_score is not None else complaint.priority_score
        metrics = compute_aging_metrics(
            created_at=complaint.created_at,
            resolved_at=complaint.resolved_at,
            status=complaint.status,
            base_priority_score=base_score,
            final_urgency=complaint.final_urgency
        )
        return {
            "id": complaint.id,
            "complaint_text": complaint.complaint_text,
            "student_name": complaint.student_name,
            "room_number": complaint.room_number,
            "hostel_block": complaint.hostel_block,
            "predicted_category": complaint.predicted_category,
            "category_confidence": complaint.category_confidence,
            "predicted_urgency": complaint.predicted_urgency,
            "urgency_confidence": complaint.urgency_confidence,
            "priority_score": metrics["effective_priority_score"],
            "base_priority_score": base_score,
            "aging_boost": metrics["aging_boost"],
            "elapsed_hours": metrics["elapsed_hours"],
            "elapsed_time_str": metrics["elapsed_time_str"],
            "is_overdue": metrics["is_overdue"],
            "sla_hours": metrics["sla_hours"],
            "timeline": metrics["timeline"],
            "priority_reason": complaint.priority_reason,
            "safety_override": complaint.safety_override,
            "requires_human_review": complaint.requires_human_review,
            "final_urgency": complaint.final_urgency,
            "status": complaint.status,
            "admin_notes": complaint.admin_notes,
            "image_url": complaint.image_url,
            "created_at": complaint.created_at,
            "updated_at": complaint.updated_at,
            "resolved_at": complaint.resolved_at
        }

    @staticmethod
    def create_complaint(db: Session, complaint_in: ComplaintCreate) -> Dict[str, Any]:
        """
        Runs NLP inference, calculates priority, and persists complaint with audit trail.
        """
        # Run local edge inference
        pred = inference_service.predict(complaint_in.complaint_text)
        now = datetime.utcnow()

        complaint = Complaint(
            complaint_text=complaint_in.complaint_text,
            student_name=complaint_in.student_name,
            room_number=complaint_in.room_number,
            hostel_block=complaint_in.hostel_block,
            predicted_category=pred["predicted_category"],
            category_confidence=pred["category_confidence"],
            predicted_urgency=pred["predicted_urgency"],
            urgency_confidence=pred["urgency_confidence"],
            priority_score=pred["priority_score"],
            base_priority_score=pred["priority_score"],
            priority_reason=pred["priority_reason"],
            safety_override=pred["safety_override"],
            requires_human_review=pred["requires_human_review"],
            final_urgency=pred["final_urgency"],
            status="Pending",
            image_url=complaint_in.image_url,
            created_at=now,
            updated_at=now
        )
        db.add(complaint)
        db.commit()
        db.refresh(complaint)

        # Audit history log
        history_entry = ComplaintHistory(
            complaint_id=complaint.id,
            action="CREATED",
            previous_value=None,
            new_value=f"Urgency: {complaint.final_urgency}, Base Priority: {complaint.priority_score:.2f}",
            note=f"Created via local NLP inference ({pred['processing_time_ms']} ms). Category: {complaint.predicted_category}",
            timestamp=now
        )
        db.add(history_entry)
        db.commit()

        return ComplaintService.enrich_complaint_dict(complaint)

    @staticmethod
    def get_complaints(
        db: Session,
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
        category: Optional[str] = None,
        urgency: Optional[str] = None,
        status: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Retrieves complaints dynamically sorted by effective aging priority score (descending).
        The longer an issue remains unresolved, the higher it climbs in priority.
        """
        query = db.query(Complaint)

        if search:
            search_clean = search.strip()
            if search_clean.isdigit():
                query = query.filter(
                    or_(
                        Complaint.id == int(search_clean),
                        Complaint.complaint_text.ilike(f"%{search_clean}%"),
                        Complaint.room_number.ilike(f"%{search_clean}%")
                    )
                )
            else:
                query = query.filter(
                    or_(
                        Complaint.complaint_text.ilike(f"%{search_clean}%"),
                        Complaint.room_number.ilike(f"%{search_clean}%"),
                        Complaint.hostel_block.ilike(f"%{search_clean}%"),
                        Complaint.student_name.ilike(f"%{search_clean}%")
                    )
                )

        if category and category.lower() != "all":
            query = query.filter(Complaint.predicted_category == category)

        if urgency and urgency.lower() != "all":
            query = query.filter(Complaint.final_urgency == urgency)

        if status and status.lower() != "all":
            query = query.filter(Complaint.status == status)

        raw_items = query.all()
        # Enrich with timeline and dynamic aging priority score
        enriched = [ComplaintService.enrich_complaint_dict(c) for c in raw_items]

        # Dynamic priority ranking:
        # Highest effective priority first (aging boosted), then oldest created_at first
        enriched.sort(
            key=lambda x: (
                -x["priority_score"],
                x["created_at"] or datetime.min
            )
        )

        total = len(enriched)
        offset = (page - 1) * limit
        paged_items = enriched[offset:offset + limit]

        return {
            "total": total,
            "page": page,
            "limit": limit,
            "complaints": paged_items
        }

    @staticmethod
    def get_complaint_by_id(db: Session, complaint_id: int) -> Optional[Dict[str, Any]]:
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if not complaint:
            return None
        return ComplaintService.enrich_complaint_dict(complaint)

    @staticmethod
    def update_status(db: Session, complaint_id: int, status_update: ComplaintStatusUpdate) -> Optional[Dict[str, Any]]:
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if not complaint:
            return None

        old_status = complaint.status
        new_status = status_update.status
        complaint.status = new_status
        now = datetime.utcnow()
        complaint.updated_at = now

        if status_update.admin_notes:
            complaint.admin_notes = status_update.admin_notes

        if new_status == "Resolved" and not complaint.resolved_at:
            complaint.resolved_at = now
        elif new_status != "Resolved":
            complaint.resolved_at = None

        # Log history
        history = ComplaintHistory(
            complaint_id=complaint.id,
            action="STATUS_UPDATED",
            previous_value=old_status,
            new_value=new_status,
            note=status_update.admin_notes or f"Status transitioned from {old_status} to {new_status}",
            timestamp=now
        )
        db.add(history)
        db.commit()
        db.refresh(complaint)
        return ComplaintService.enrich_complaint_dict(complaint)

    @staticmethod
    def override_priority(db: Session, complaint_id: int, override: ComplaintPriorityOverride) -> Optional[Dict[str, Any]]:
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if not complaint:
            return None

        old_urgency = complaint.final_urgency
        old_score = complaint.priority_score

        new_urgency = override.override_urgency
        weight = URGENCY_WEIGHTS.get(new_urgency, 50.0)
        # Recalculate priority score based on administrator override
        new_score = round(weight * complaint.urgency_confidence, 2)

        complaint.final_urgency = new_urgency
        complaint.base_priority_score = new_score
        complaint.priority_score = new_score
        complaint.priority_reason = (
            f"[ADMIN OVERRIDE] Urgency manually updated from '{old_urgency}' to '{new_urgency}' "
            f"by administrator. Reason: {override.admin_reason}. New Base Priority Score: {new_score:.2f}."
        )
        complaint.requires_human_review = False  # Administrator has verified
        now = datetime.utcnow()
        complaint.updated_at = now

        history = ComplaintHistory(
            complaint_id=complaint.id,
            action="PRIORITY_OVERRIDDEN",
            previous_value=f"Urgency: {old_urgency}, Score: {old_score:.2f}",
            new_value=f"Urgency: {new_urgency}, Score: {new_score:.2f}",
            note=f"Admin reason: {override.admin_reason}",
            timestamp=now
        )
        db.add(history)
        db.commit()
        db.refresh(complaint)
        return ComplaintService.enrich_complaint_dict(complaint)

    @staticmethod
    def get_dashboard_stats(db: Session) -> Dict[str, Any]:
        """Computes live stats from actual SQLite database including overdue timeline aging."""
        total = db.query(func.count(Complaint.id)).scalar() or 0
        pending = db.query(func.count(Complaint.id)).filter(Complaint.status == "Pending").scalar() or 0
        in_progress = db.query(func.count(Complaint.id)).filter(Complaint.status == "In Progress").scalar() or 0
        resolved = db.query(func.count(Complaint.id)).filter(Complaint.status == "Resolved").scalar() or 0
        critical = db.query(func.count(Complaint.id)).filter(Complaint.final_urgency == "Critical").scalar() or 0
        high = db.query(func.count(Complaint.id)).filter(Complaint.final_urgency == "High").scalar() or 0
        needs_review = db.query(func.count(Complaint.id)).filter(Complaint.requires_human_review == True).scalar() or 0

        # Fetch active complaints and calculate dynamic aging
        active_complaints = db.query(Complaint).filter(Complaint.status != "Resolved").all()
        enriched_active = [ComplaintService.enrich_complaint_dict(c) for c in active_complaints]
        
        # Count overdue complaints
        overdue_count = sum(1 for c in enriched_active if c.get("is_overdue", False))

        # Sort by dynamic priority score descending
        enriched_active.sort(
            key=lambda x: (
                -x["priority_score"],
                x["created_at"] or datetime.min
            )
        )
        top_priority = enriched_active[:5]

        return {
            "total_complaints": total,
            "pending_complaints": pending,
            "in_progress_complaints": in_progress,
            "resolved_complaints": resolved,
            "critical_complaints": critical,
            "high_priority_complaints": high,
            "needs_review_complaints": needs_review,
            "overdue_complaints": overdue_count,
            "top_priority": [
                {
                    "id": c["id"],
                    "text": c["complaint_text"],
                    "category": c["predicted_category"],
                    "urgency": c["final_urgency"],
                    "priority_score": c["priority_score"],
                    "base_priority_score": c.get("base_priority_score"),
                    "aging_boost": c.get("aging_boost", 0.0),
                    "is_overdue": c.get("is_overdue", False),
                    "elapsed_time_str": c.get("elapsed_time_str", ""),
                    "status": c["status"],
                    "room_number": c["room_number"],
                    "image_url": c["image_url"],
                    "created_at": c["created_at"].isoformat() if c["created_at"] else None
                } for c in top_priority
            ]
        }

    @staticmethod
    def get_dashboard_distribution(db: Session) -> Dict[str, Any]:
        """Calculates breakdown by category and urgency."""
        cat_counts = db.query(Complaint.predicted_category, func.count(Complaint.id))\
            .group_by(Complaint.predicted_category).all()
        urg_counts = db.query(Complaint.final_urgency, func.count(Complaint.id))\
            .group_by(Complaint.final_urgency).all()

        categories = {cat: count for cat, count in cat_counts}
        urgencies = {urg: count for urg, count in urg_counts}

        return {
            "by_category": categories,
            "by_urgency": urgencies
        }
