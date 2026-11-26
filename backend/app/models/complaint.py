from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    complaint_text = Column(Text, nullable=False)
    student_name = Column(String(100), nullable=True)
    room_number = Column(String(50), nullable=True)
    hostel_block = Column(String(50), nullable=True)
    
    # NLP Model Predictions
    predicted_category = Column(String(50), nullable=False)
    category_confidence = Column(Float, nullable=False)
    predicted_urgency = Column(String(20), nullable=False)
    urgency_confidence = Column(Float, nullable=False)
    
    # Priority
    priority_score = Column(Float, nullable=False, index=True)
    base_priority_score = Column(Float, nullable=True)
    priority_reason = Column(Text, nullable=False)
    
    # Safety & Review Overrides
    safety_override = Column(Boolean, default=False)
    requires_human_review = Column(Boolean, default=False)
    final_urgency = Column(String(20), nullable=False)
    
    # Workflow Status
    status = Column(String(30), default="Pending", index=True)  # Pending, In Progress, Resolved, Under Review
    admin_notes = Column(Text, nullable=True)
    image_url = Column(Text, nullable=True)  # Photo proof / visual evidence
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    history = relationship("ComplaintHistory", back_populates="complaint", cascade="all, delete-orphan")
