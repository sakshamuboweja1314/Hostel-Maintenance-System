import os
import uuid
import shutil
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.schemas.complaint_schema import (
    ComplaintCreate,
    ComplaintResponse,
    ComplaintListResponse,
    ComplaintStatusUpdate,
    ComplaintPriorityOverride,
    ComplaintHistoryResponse
)
from backend.app.services.complaint_service import ComplaintService

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])

@router.post("/upload-image")
async def upload_complaint_image(file: UploadFile = File(...)):
    """
    Uploads a photo proof for a maintenance complaint.
    Validates file type and stores locally on disk.
    """
    valid_extensions = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp"}
    ext = os.path.splitext(file.filename)[1].lower() if file.filename else ".jpg"
    if ext not in valid_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image format. Allowed formats: {', '.join(valid_extensions)}"
        )
    
    uploads_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))
    os.makedirs(uploads_dir, exist_ok=True)
    
    unique_filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(uploads_dir, unique_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"image_url": f"/uploads/{unique_filename}", "filename": unique_filename}

@router.post("", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
def submit_complaint(complaint_in: ComplaintCreate, db: Session = Depends(get_db)):
    """
    Submits a new maintenance complaint in natural language.
    Executes local edge NLP classification (Category & Urgency), calculates priority, and persists to SQLite.
    """
    if not complaint_in.complaint_text.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Complaint text cannot be empty or whitespace only."
        )
    return ComplaintService.create_complaint(db=db, complaint_in=complaint_in)

@router.get("", response_model=ComplaintListResponse)
def list_complaints(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    urgency: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db)
):
    """
    Lists complaints ranked by priority score (descending) and creation date.
    Supports search query and filtering by category, urgency, and status.
    """
    return ComplaintService.get_complaints(
        db=db,
        page=page,
        limit=limit,
        search=search,
        category=category,
        urgency=urgency,
        status=status_filter
    )

@router.get("/{complaint_id}", response_model=ComplaintResponse)
def get_complaint(complaint_id: int, db: Session = Depends(get_db)):
    """Returns detailed information for a single complaint."""
    complaint = ComplaintService.get_complaint_by_id(db=db, complaint_id=complaint_id)
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")
    return complaint

@router.patch("/{complaint_id}/status", response_model=ComplaintResponse)
def update_complaint_status(
    complaint_id: int,
    status_update: ComplaintStatusUpdate,
    db: Session = Depends(get_db)
):
    """Updates complaint status (Pending -> In Progress -> Resolved -> Under Review)."""
    valid_statuses = ["Pending", "In Progress", "Resolved", "Under Review"]
    if status_update.status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of {valid_statuses}"
        )
    complaint = ComplaintService.update_status(db=db, complaint_id=complaint_id, status_update=status_update)
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")
    return complaint

@router.patch("/{complaint_id}/priority", response_model=ComplaintResponse)
def override_complaint_priority(
    complaint_id: int,
    override: ComplaintPriorityOverride,
    db: Session = Depends(get_db)
):
    """Allows an administrator to manually override model predicted urgency and priority."""
    valid_urgencies = ["Critical", "High", "Medium", "Low"]
    if override.override_urgency not in valid_urgencies:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid urgency. Must be one of {valid_urgencies}"
        )
    complaint = ComplaintService.override_priority(db=db, complaint_id=complaint_id, override=override)
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")
    return complaint

@router.get("/{complaint_id}/history", response_model=List[ComplaintHistoryResponse])
def get_complaint_history(complaint_id: int, db: Session = Depends(get_db)):
    """Returns the full audit history and status change logs for a complaint."""
    from backend.app.models.complaint import Complaint
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")
    return complaint.history
