"""
Edge NLP Inference Service for DistilBERT Sequence Classification.
Loads local fine-tuned models once upon application startup.
Performs offline local CPU/CUDA inference with softmax confidence calculations.
"""

import os
import json
import time
import logging
from typing import Dict, Any, Optional
import torch
import numpy as np
from transformers import AutoTokenizer, AutoModelForSequenceClassification

from backend.app.config import settings
from backend.app.services.safety_service import check_safety_escalation
from backend.app.services.priority_service import calculate_priority

logger = logging.getLogger(__name__)

class InferenceService:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.category_model = None
        self.category_tokenizer = None
        self.category_labels = []
        self.cat_id2label = {}
        
        self.urgency_model = None
        self.urgency_tokenizer = None
        self.urgency_labels = []
        self.urg_id2label = {}
        
        self.is_loaded = False
        self.load_error = None

    def load_models(self):
        """Loads both fine-tuned DistilBERT models from disk."""
        try:
            logger.info("Initializing Edge NLP inference engine...")
            
            # 1. Load Category Model
            cat_dir = settings.CATEGORY_MODEL_PATH
            if not os.path.exists(cat_dir) or not os.path.exists(os.path.join(cat_dir, "id_to_label.json")):
                raise FileNotFoundError(f"Category model not found at {cat_dir}. Please run training script first.")
                
            with open(os.path.join(cat_dir, "id_to_label.json"), "r") as f:
                self.cat_id2label = {int(k): v for k, v in json.load(f).items()}
            self.category_labels = [self.cat_id2label[i] for i in range(len(self.cat_id2label))]
            
            self.category_tokenizer = AutoTokenizer.from_pretrained(cat_dir)
            self.category_model = AutoModelForSequenceClassification.from_pretrained(cat_dir)
            self.category_model.to(self.device)
            self.category_model.eval()
            logger.info(f"Loaded Category Classifier ({len(self.category_labels)} classes) on {self.device}")

            # 2. Load Urgency Model
            urg_dir = settings.URGENCY_MODEL_PATH
            if not os.path.exists(urg_dir) or not os.path.exists(os.path.join(urg_dir, "id_to_label.json")):
                raise FileNotFoundError(f"Urgency model not found at {urg_dir}. Please run training script first.")
                
            with open(os.path.join(urg_dir, "id_to_label.json"), "r") as f:
                self.urg_id2label = {int(k): v for k, v in json.load(f).items()}
            self.urgency_labels = [self.urg_id2label[i] for i in range(len(self.urg_id2label))]
            
            self.urgency_tokenizer = AutoTokenizer.from_pretrained(urg_dir)
            self.urgency_model = AutoModelForSequenceClassification.from_pretrained(urg_dir)
            self.urgency_model.to(self.device)
            self.urgency_model.eval()
            logger.info(f"Loaded Urgency Classifier ({len(self.urgency_labels)} classes) on {self.device}")

            self.is_loaded = True
            self.load_error = None
            logger.info("Both DistilBERT edge models loaded successfully.")
        except Exception as e:
            self.is_loaded = False
            self.load_error = str(e)
            logger.error(f"Error loading models: {e}")

    def predict(self, text: str) -> Dict[str, Any]:
        """
        Executes end-to-end edge inference on natural language complaint text.
        """
        if not self.is_loaded:
            if self.load_error:
                raise RuntimeError(f"Edge models not loaded: {self.load_error}")
            else:
                self.load_models()
                if not self.is_loaded:
                    raise RuntimeError("Edge models could not be loaded. Please ensure models are trained.")

        start_time = time.perf_counter()

        # Step 1: Category Classification
        cat_inputs = self.category_tokenizer(
            text,
            truncation=True,
            padding="max_length",
            max_length=128,
            return_tensors="pt"
        ).to(self.device)

        with torch.no_grad():
            cat_outputs = self.category_model(**cat_inputs)
            cat_probs = torch.softmax(cat_outputs.logits, dim=1).cpu().numpy()[0]

        cat_pred_idx = int(np.argmax(cat_probs))
        predicted_category = self.cat_id2label[cat_pred_idx]
        category_confidence = float(cat_probs[cat_pred_idx])
        all_cat_probs = {self.cat_id2label[i]: float(p) for i, p in enumerate(cat_probs)}

        # Step 2: Urgency Classification
        urg_inputs = self.urgency_tokenizer(
            text,
            truncation=True,
            padding="max_length",
            max_length=128,
            return_tensors="pt"
        ).to(self.device)

        with torch.no_grad():
            urg_outputs = self.urgency_model(**urg_inputs)
            urg_probs = torch.softmax(urg_outputs.logits, dim=1).cpu().numpy()[0]

        urg_pred_idx = int(np.argmax(urg_probs))
        predicted_urgency = self.urg_id2label[urg_pred_idx]
        urgency_confidence = float(urg_probs[urg_pred_idx])
        all_urg_probs = {self.urg_id2label[i]: float(p) for i, p in enumerate(urg_probs)}

        # Step 3: Safety Escalation Layer (Transparent & Non-destructive)
        safety_override, safety_reason = check_safety_escalation(text)

        # Step 4: Priority Engine Calculation
        priority_result = calculate_priority(
            predicted_urgency=predicted_urgency,
            urgency_confidence=urgency_confidence,
            safety_override=safety_override,
            safety_reason=safety_reason,
            category_confidence=category_confidence
        )

        elapsed_ms = (time.perf_counter() - start_time) * 1000

        return {
            "predicted_category": predicted_category,
            "category_confidence": round(category_confidence, 4),
            "all_category_probabilities": {k: round(v, 4) for k, v in all_cat_probs.items()},
            "predicted_urgency": predicted_urgency,
            "urgency_confidence": round(urgency_confidence, 4),
            "all_urgency_probabilities": {k: round(v, 4) for k, v in all_urg_probs.items()},
            "final_urgency": priority_result["final_urgency"],
            "priority_score": priority_result["priority_score"],
            "priority_reason": priority_result["priority_reason"],
            "safety_override": safety_override,
            "safety_reason": safety_reason,
            "requires_human_review": priority_result["requires_human_review"],
            "processing_time_ms": round(elapsed_ms, 2),
            "device": str(self.device)
        }

inference_service = InferenceService()
