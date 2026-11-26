import os
import json
from fastapi import APIRouter, HTTPException, status
from backend.app.config import settings
from backend.app.schemas.prediction_schema import PredictionRequest, PredictionResponse, ModelStatusResponse
from backend.app.services.inference_service import inference_service

router = APIRouter(prefix="/api/model", tags=["Model"])

@router.get("/status", response_model=ModelStatusResponse)
def get_model_status():
    """Returns local inference engine status, loaded device, and class labels."""
    return ModelStatusResponse(
        status="ready" if inference_service.is_loaded else ("error" if inference_service.load_error else "unloaded"),
        category_model_loaded=inference_service.category_model is not None,
        urgency_model_loaded=inference_service.urgency_model is not None,
        device=str(inference_service.device),
        confidence_threshold=settings.CONFIDENCE_THRESHOLD,
        category_classes=inference_service.category_labels,
        urgency_classes=inference_service.urgency_labels
    )

@router.post("/predict", response_model=PredictionResponse)
def predict_only(request: PredictionRequest):
    """
    Runs local NLP inference without persisting the complaint to the database.
    Useful for testing, debugging, and live interactive analysis.
    """
    if not request.complaint_text.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Complaint text cannot be empty."
        )
    try:
        return inference_service.predict(request.complaint_text)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(e)}"
        )

@router.get("/metrics")
def get_evaluation_metrics():
    """
    Returns actual held-out test evaluation metrics for both DistilBERT classifiers.
    Reads from evaluation_results.json produced by evaluate_models.py.
    """
    eval_file = settings.EVALUATION_RESULTS_PATH
    if not os.path.exists(eval_file):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model evaluation metrics file not found. Please run evaluate_models.py."
        )
    with open(eval_file, "r", encoding="utf-8") as f:
        return json.load(f)
