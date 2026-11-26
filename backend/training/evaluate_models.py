"""
Model Evaluation Script for Edge-Based Hostel Maintenance System.
Evaluates Category Classifier and Urgency Classifier on the held-out test dataset (test.csv).
Generates detailed metrics: Accuracy, Precision, Recall, F1, Confusion Matrix, and Classification Report.
"""

import os
import json
import time
import torch
import pandas as pd
import numpy as np
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "dataset")
CATEGORY_MODEL_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "models", "category_model"))
URGENCY_MODEL_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "models", "urgency_model"))
OUTPUT_FILE = os.path.join(BASE_DIR, "evaluation_results.json")

def evaluate_single_model(model_dir, test_df, text_col, label_col, task_name):
    print(f"\n--- Evaluating {task_name} Model ---")
    if not os.path.exists(model_dir):
        raise FileNotFoundError(f"Model directory not found at: {model_dir}")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Loading model from {model_dir} on {device}...")

    with open(os.path.join(model_dir, "label_to_id.json"), "r") as f:
        label_to_id = json.load(f)
    with open(os.path.join(model_dir, "id_to_label.json"), "r") as f:
        id_to_label = {int(k): v for k, v in json.load(f).items()}

    tokenizer = AutoTokenizer.from_pretrained(model_dir)
    model = AutoModelForSequenceClassification.from_pretrained(model_dir)
    model.to(device)
    model.eval()

    texts = test_df[text_col].tolist()
    true_labels = [label_to_id[label] for label in test_df[label_col].tolist()]
    target_names = [id_to_label[i] for i in range(len(id_to_label))]

    predictions = []
    probabilities = []
    inference_times = []

    print(f"Running inference on {len(texts)} test samples...")
    with torch.no_grad():
        for text in texts:
            t0 = time.perf_counter()
            inputs = tokenizer(
                text,
                truncation=True,
                padding="max_length",
                max_length=128,
                return_tensors="pt"
            ).to(device)

            outputs = model(**inputs)
            t1 = time.perf_counter()
            inference_times.append((t1 - t0) * 1000)  # in ms

            probs = torch.softmax(outputs.logits, dim=1).cpu().numpy()[0]
            pred = np.argmax(probs)

            predictions.append(pred)
            probabilities.append(probs.tolist())

    accuracy = float(accuracy_score(true_labels, predictions))
    precision_macro = float(precision_score(true_labels, predictions, average="macro", zero_division=0))
    precision_weighted = float(precision_score(true_labels, predictions, average="weighted", zero_division=0))
    recall_macro = float(recall_score(true_labels, predictions, average="macro", zero_division=0))
    recall_weighted = float(recall_score(true_labels, predictions, average="weighted", zero_division=0))
    f1_macro = float(f1_score(true_labels, predictions, average="macro", zero_division=0))
    f1_weighted = float(f1_score(true_labels, predictions, average="weighted", zero_division=0))

    cm = confusion_matrix(true_labels, predictions).tolist()
    clf_report = classification_report(
        true_labels, predictions, target_names=target_names, output_dict=True, zero_division=0
    )

    avg_inference_time_ms = float(np.mean(inference_times))

    print(f"Results for {task_name}:")
    print(f"  Accuracy:           {accuracy:.4f} ({accuracy*100:.2f}%)")
    print(f"  Macro F1-Score:     {f1_macro:.4f}")
    print(f"  Weighted F1-Score:  {f1_weighted:.4f}")
    print(f"  Weighted Precision: {precision_weighted:.4f}")
    print(f"  Weighted Recall:    {recall_weighted:.4f}")
    print(f"  Avg Inference Time: {avg_inference_time_ms:.2f} ms/sample")

    return {
        "task_name": task_name,
        "model_architecture": "DistilBertForSequenceClassification (distilbert-base-uncased)",
        "num_classes": len(target_names),
        "classes": target_names,
        "test_sample_count": len(texts),
        "accuracy": accuracy,
        "precision_macro": precision_macro,
        "precision_weighted": precision_weighted,
        "recall_macro": recall_macro,
        "recall_weighted": recall_weighted,
        "f1_macro": f1_macro,
        "f1_weighted": f1_weighted,
        "confusion_matrix": cm,
        "classification_report": clf_report,
        "avg_inference_time_ms": avg_inference_time_ms,
        "device": str(device)
    }

def main():
    test_csv = os.path.join(DATASET_DIR, "test.csv")
    if not os.path.exists(test_csv):
        raise FileNotFoundError(f"Test CSV not found at {test_csv}. Run generate_dataset.py first.")

    test_df = pd.read_csv(test_csv)
    print(f"Loaded test dataset with {len(test_df)} records.")

    category_results = evaluate_single_model(
        CATEGORY_MODEL_DIR, test_df, "complaint_text", "category", "Category Classification"
    )

    urgency_results = evaluate_single_model(
        URGENCY_MODEL_DIR, test_df, "complaint_text", "urgency", "Urgency Classification"
    )

    full_evaluation = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "category_model": category_results,
        "urgency_model": urgency_results
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(full_evaluation, f, indent=2)

    print(f"\nSaved full evaluation metrics to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
