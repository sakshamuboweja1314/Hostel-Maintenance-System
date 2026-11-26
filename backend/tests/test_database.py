"""
Database and SQLAlchemy Model Unit Tests.
Tests SQLite connection, schema creation, relationship integrity, and CRUD operations.
"""

import pytest
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.database import Base
from backend.app.models.complaint import Complaint
from backend.app.models.complaint_history import ComplaintHistory
from backend.app.models.model_metrics import ModelMetricsRecord

TEST_DB_URL = "sqlite:///:memory:"

@pytest.fixture
def db_session():
    engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()

def test_complaint_and_history_relationship(db_session):
    complaint = Complaint(
        complaint_text="Corridor light flickering continuously.",
        room_number="Room 302",
        hostel_block="Block B",
        predicted_category="Electrical",
        category_confidence=0.98,
        predicted_urgency="Medium",
        urgency_confidence=0.85,
        priority_score=42.5,
        priority_reason="Medium priority test",
        safety_override=False,
        requires_human_review=False,
        final_urgency="Medium",
        status="Pending",
        created_at=datetime.utcnow()
    )
    db_session.add(complaint)
    db_session.commit()
    db_session.refresh(complaint)

    assert complaint.id is not None
    assert complaint.status == "Pending"

    # Add history record
    history = ComplaintHistory(
        complaint_id=complaint.id,
        action="CREATED",
        new_value="Status: Pending",
        note="Initial submission",
        timestamp=datetime.utcnow()
    )
    db_session.add(history)
    db_session.commit()

    # Query back
    fetched = db_session.query(Complaint).filter(Complaint.id == complaint.id).first()
    assert len(fetched.history) == 1
    assert fetched.history[0].action == "CREATED"

def test_model_metrics_record(db_session):
    metric = ModelMetricsRecord(
        model_name="DistilBERT-Category",
        task_name="Category Classification",
        accuracy=1.0,
        precision=1.0,
        recall=1.0,
        f1_score=1.0,
        model_version="1.0.0",
        evaluation_date=datetime.utcnow()
    )
    db_session.add(metric)
    db_session.commit()

    saved = db_session.query(ModelMetricsRecord).first()
    assert saved.accuracy == 1.0
    assert saved.f1_score == 1.0
