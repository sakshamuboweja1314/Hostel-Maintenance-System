from typing import Optional, Dict, List, Any
from pydantic import BaseModel, Field

class PredictionRequest(BaseModel):
    complaint_text: str = Field(..., min_length=3, max_length=2000, description="Natural language complaint text")

class PredictionResponse(BaseModel):
    predicted_category: str
    category_confidence: float
    all_category_probabilities: Dict[str, float]
    
    predicted_urgency: str
    urgency_confidence: float
    all_urgency_probabilities: Dict[str, float]
    
    final_urgency: str
    priority_score: float
    priority_reason: str
    
    safety_override: bool
    requires_human_review: bool
    processing_time_ms: float
    model_architecture: str = "DistilBERT (distilbert-base-uncased)"

class ModelStatusResponse(BaseModel):
    status: str
    category_model_loaded: bool
    urgency_model_loaded: bool
    device: str
    confidence_threshold: float
    category_classes: List[str]
    urgency_classes: List[str]
