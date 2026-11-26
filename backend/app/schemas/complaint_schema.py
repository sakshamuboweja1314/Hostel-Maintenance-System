from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class ComplaintCreate(BaseModel):
    complaint_text: str = Field(..., min_length=3, max_length=2000)
    student_name: Optional[str] = Field(None, max_length=100)
    room_number: Optional[str] = Field(None, max_length=50)
    hostel_block: Optional[str] = Field(None, max_length=50)
    image_url: Optional[str] = Field(None, description="Image proof URL or Base64 data URI")

class ComplaintStatusUpdate(BaseModel):
    status: str = Field(..., description="Pending, In Progress, Resolved, or Under Review")
    admin_notes: Optional[str] = None

class ComplaintPriorityOverride(BaseModel):
    override_urgency: str = Field(..., description="Critical, High, Medium, or Low")
    admin_reason: str = Field(..., min_length=3)

class ComplaintHistoryResponse(BaseModel):
    id: int
    complaint_id: int
    action: str
    previous_value: Optional[str] = None
    new_value: Optional[str] = None
    note: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

class ComplaintResponse(BaseModel):
    id: int
    complaint_text: str
    student_name: Optional[str] = None
    room_number: Optional[str] = None
    hostel_block: Optional[str] = None
    
    predicted_category: str
    category_confidence: float
    predicted_urgency: str
    urgency_confidence: float
    
    priority_score: float
    base_priority_score: Optional[float] = None
    aging_boost: Optional[float] = 0.0
    elapsed_hours: Optional[float] = 0.0
    elapsed_time_str: Optional[str] = None
    is_overdue: Optional[bool] = False
    sla_hours: Optional[float] = 48.0
    timeline: Optional[List[Dict[str, Any]]] = None

    priority_reason: str
    safety_override: bool
    requires_human_review: bool
    final_urgency: str
    
    status: str
    admin_notes: Optional[str] = None
    image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ComplaintListResponse(BaseModel):
    total: int
    page: int
    limit: int
    complaints: List[ComplaintResponse]
