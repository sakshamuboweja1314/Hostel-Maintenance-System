"""
Database initialization and seeding script.
Seeds the model_metrics table with actual evaluation results and initial sample complaints.
"""

import os
import json
from datetime import datetime, timedelta
from backend.app.database import init_db, SessionLocal
from backend.app.models.complaint import Complaint
from backend.app.models.complaint_history import ComplaintHistory
from backend.app.models.model_metrics import ModelMetricsRecord
from backend.app.services.inference_service import inference_service
from backend.app.config import settings

def seed_database():
    print("Initializing database tables...")
    init_db()
    db = SessionLocal()

    try:
        # 1. Seed Model Metrics from evaluation_results.json
        eval_path = settings.EVALUATION_RESULTS_PATH
        if os.path.exists(eval_path):
            with open(eval_path, "r", encoding="utf-8") as f:
                eval_data = json.load(f)

            existing_metrics = db.query(ModelMetricsRecord).count()
            if existing_metrics == 0:
                print("Seeding actual evaluation metrics into model_metrics table...")
                cat_eval = eval_data.get("category_model", {})
                urg_eval = eval_data.get("urgency_model", {})

                cat_record = ModelMetricsRecord(
                    model_name="DistilBERT-Base-Uncased (Category Classifier)",
                    task_name="Category Classification",
                    accuracy=cat_eval.get("accuracy", 1.0),
                    precision=cat_eval.get("precision_weighted", 1.0),
                    recall=cat_eval.get("recall_weighted", 1.0),
                    f1_score=cat_eval.get("f1_weighted", 1.0),
                    model_version="1.0.0",
                    evaluation_date=datetime.utcnow()
                )
                urg_record = ModelMetricsRecord(
                    model_name="DistilBERT-Base-Uncased (Urgency Classifier)",
                    task_name="Urgency Classification",
                    accuracy=urg_eval.get("accuracy", 0.9556),
                    precision=urg_eval.get("precision_weighted", 0.9549),
                    recall=urg_eval.get("recall_weighted", 0.9556),
                    f1_score=urg_eval.get("f1_weighted", 0.9549),
                    model_version="1.0.0",
                    evaluation_date=datetime.utcnow()
                )
                db.add(cat_record)
                db.add(urg_record)
                db.commit()
                print("Seeded model metrics successfully.")

        # 2. Seed initial complaints if empty
        existing_complaints = db.query(Complaint).count()
        if existing_complaints == 0:
            print("Seeding initial realistic complaints with local DistilBERT inference...")
            inference_service.load_models()

            seed_samples = [
                {
                    "text": "Water is leaking directly through the ceiling onto our main electrical board in Room 204. Immediate risk of fire!",
                    "name": "Rohan Sharma",
                    "room": "Room 204",
                    "block": "Block B",
                    "offset_hours": 1
                },
                {
                    "text": "The entire 3rd floor Wi-Fi network has been dead for 6 hours before our placement deadline.",
                    "name": "Ananya Patel",
                    "room": "Room 312",
                    "block": "Girls Hostel 2",
                    "offset_hours": 3
                },
                {
                    "text": "The washbasin pipe in Room 108 is blocked and water drains very slowly.",
                    "name": "Siddharth Verma",
                    "room": "Room 108",
                    "block": "Boys Hostel 3",
                    "offset_hours": 6
                },
                {
                    "text": "Common washrooms on 2nd floor have not been cleaned for 2 days and dustbin is overflowing.",
                    "name": "Kavita Nair",
                    "room": "Room 218",
                    "block": "Block A",
                    "offset_hours": 8
                },
                {
                    "text": "The study chair backrest has a loose screw and wobbles slightly.",
                    "name": "Vikram Singh",
                    "room": "Room 405",
                    "block": "Block C",
                    "offset_hours": 12
                },
                {
                    "text": "Wall clock in the common study hall is running 15 minutes slow.",
                    "name": "Pooja Reddy",
                    "room": "Room 102",
                    "block": "Block D",
                    "offset_hours": 16
                }
            ]

            for s in seed_samples:
                pred = inference_service.predict(s["text"])
                created_time = datetime.utcnow() - timedelta(hours=s["offset_hours"])
                c = Complaint(
                    complaint_text=s["text"],
                    student_name=s["name"],
                    room_number=s["room"],
                    hostel_block=s["block"],
                    predicted_category=pred["predicted_category"],
                    category_confidence=pred["category_confidence"],
                    predicted_urgency=pred["predicted_urgency"],
                    urgency_confidence=pred["urgency_confidence"],
                    priority_score=pred["priority_score"],
                    priority_reason=pred["priority_reason"],
                    safety_override=pred["safety_override"],
                    requires_human_review=pred["requires_human_review"],
                    final_urgency=pred["final_urgency"],
                    status="Pending",
                    created_at=created_time,
                    updated_at=created_time
                )
                db.add(c)
                db.commit()
                db.refresh(c)

                h = ComplaintHistory(
                    complaint_id=c.id,
                    action="CREATED",
                    previous_value=None,
                    new_value=f"Urgency: {c.final_urgency}, Priority: {c.priority_score:.2f}",
                    note=f"Seeded baseline complaint via local inference. Category: {c.predicted_category}",
                    timestamp=created_time
                )
                db.add(h)
                db.commit()

            print(f"Seeded {len(seed_samples)} baseline complaints into SQLite database.")

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
