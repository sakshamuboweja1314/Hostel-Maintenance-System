from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.services.complaint_service import ComplaintService

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    """Returns actual operational statistics from the SQLite database."""
    return ComplaintService.get_dashboard_stats(db=db)

@router.get("/distribution")
def get_distribution(db: Session = Depends(get_db)):
    """Returns complaint distribution across all 6 categories and 4 urgency levels."""
    return ComplaintService.get_dashboard_distribution(db=db)
