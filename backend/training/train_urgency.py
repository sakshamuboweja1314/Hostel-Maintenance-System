"""
Training script for Urgency Classification Model.
Architecture: Pretrained DistilBERT (distilbert-base-uncased) fine-tuned for Sequence Classification.
Classes: 4 (Critical, High, Medium, Low)
"""

import os
import json
import time
import torch
import pandas as pd
import numpy as np
from torch.utils.data import Dataset, DataLoader
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    get_linear_schedule_with_warmup
)
from torch.optim import AdamW
from sklearn.metrics import accuracy_score, f1_score

# Determinism
RANDOM_SEED = 42
torch.manual_seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "dataset")
OUTPUT_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "models", "urgency_model"))

MODEL_NAME = "distilbert-base-uncased"
MAX_LENGTH = 128
BATCH_SIZE = 16
EPOCHS = 3
LEARNING_RATE = 4e-5

URGENCY_LABELS = [
    "Critical",
    "High",
    "Medium",
    "Low"
]

LABEL_TO_ID = {label: i for i, label in enumerate(URGENCY_LABELS)}
ID_TO_LABEL = {i: label for i, label in enumerate(URGENCY_LABELS)}

class ComplaintDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_length):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_length = max_length

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        text = str(self.texts[idx])
        label = self.labels[idx]

        encoding = self.tokenizer(
            text,
            truncation=True,
            padding="max_length",
            max_length=self.max_length,
            return_tensors="pt"
        )

        return {
            "input_ids": encoding["input_ids"].squeeze(0),
            "attention_mask": encoding["attention_mask"].squeeze(0),
            "labels": torch.tensor(label, dtype=torch.long)
        }

def train_epoch(model, dataloader, optimizer, scheduler, device):
    model.train()
    total_loss = 0.0

    for batch in dataloader:
        optimizer.zero_grad()

        input_ids = batch["input_ids"].to(device)
        attention_mask = batch["attention_mask"].to(device)
        labels = batch["labels"].to(device)

        outputs = model(
            input_ids=input_ids,
            attention_mask=attention_mask,
            labels=labels
        )

        loss = outputs.loss
        total_loss += loss.item()

        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()
        scheduler.step()

    return total_loss / len(dataloader)

def evaluate(model, dataloader, device):
    model.eval()
    total_loss = 0.0
    all_preds = []
    all_labels = []

    with torch.no_grad():
        for batch in dataloader:
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["labels"].to(device)

            outputs = model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                labels=labels
            )

            total_loss += outputs.loss.item()
            logits = outputs.logits
            preds = torch.argmax(logits, dim=1).cpu().numpy()

            all_preds.extend(preds)
            all_labels.extend(labels.cpu().numpy())

    avg_loss = total_loss / len(dataloader)
    acc = accuracy_score(all_labels, all_preds)
    f1 = f1_score(all_labels, all_preds, average="weighted")
    return avg_loss, acc, f1

def main():
    print("=" * 60)
    print("Fine-Tuning DistilBERT for Hostel Complaint Urgency Classification")
    print("=" * 60)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    # Load splits
    train_df = pd.read_csv(os.path.join(DATASET_DIR, "train.csv"))
    val_df = pd.read_csv(os.path.join(DATASET_DIR, "val.csv"))

    train_texts = train_df["complaint_text"].tolist()
    train_labels = [LABEL_TO_ID[u] for u in train_df["urgency"].tolist()]

    val_texts = val_df["complaint_text"].tolist()
    val_labels = [LABEL_TO_ID[u] for u in val_df["urgency"].tolist()]

    print(f"Loaded {len(train_texts)} training examples and {len(val_texts)} validation examples.")

    # Initialize Tokenizer and Model
    print(f"Loading pretrained base model: {MODEL_NAME}")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    model = AutoModelForSequenceClassification.from_pretrained(
        MODEL_NAME,
        num_labels=len(URGENCY_LABELS),
        id2label=ID_TO_LABEL,
        label2id=LABEL_TO_ID
    )
    model.to(device)

    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"Total Parameters: {total_params:,} | Trainable: {trainable_params:,}")

    # DataLoaders
    train_dataset = ComplaintDataset(train_texts, train_labels, tokenizer, MAX_LENGTH)
    val_dataset = ComplaintDataset(val_texts, val_labels, tokenizer, MAX_LENGTH)

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False)

    optimizer = AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=0.01)
    total_steps = len(train_loader) * EPOCHS
    scheduler = get_linear_schedule_with_warmup(
        optimizer,
        num_warmup_steps=int(total_steps * 0.1),
        num_training_steps=total_steps
    )

    best_val_f1 = -1.0
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    history = []

    start_time = time.time()
    for epoch in range(1, EPOCHS + 1):
        epoch_start = time.time()
        train_loss = train_epoch(model, train_loader, optimizer, scheduler, device)
        val_loss, val_acc, val_f1 = evaluate(model, val_loader, device)
        epoch_time = time.time() - epoch_start

        print(f"Epoch {epoch}/{EPOCHS} [{epoch_time:.1f}s] - "
              f"Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f} | "
              f"Val Acc: {val_acc:.4f} | Val F1: {val_f1:.4f}")

        history.append({
            "epoch": epoch,
            "train_loss": train_loss,
            "val_loss": val_loss,
            "val_acc": val_acc,
            "val_f1": val_f1,
            "time_sec": epoch_time
        })

        if val_f1 > best_val_f1:
            best_val_f1 = val_f1
            print(f"Saving best model checkpoint to {OUTPUT_DIR} (Val F1: {val_f1:.4f})")
            model.save_pretrained(OUTPUT_DIR)
            tokenizer.save_pretrained(OUTPUT_DIR)

            # Save label metadata
            with open(os.path.join(OUTPUT_DIR, "label_to_id.json"), "w") as f:
                json.dump(LABEL_TO_ID, f, indent=2)
            with open(os.path.join(OUTPUT_DIR, "id_to_label.json"), "w") as f:
                json.dump(ID_TO_LABEL, f, indent=2)

    total_training_time = time.time() - start_time
    print(f"\nTraining completed in {total_training_time:.1f}s. Best Val F1: {best_val_f1:.4f}")

    # Save training history
    with open(os.path.join(OUTPUT_DIR, "training_history.json"), "w") as f:
        json.dump({
            "model_name": MODEL_NAME,
            "task": "urgency_classification",
            "epochs": EPOCHS,
            "batch_size": BATCH_SIZE,
            "learning_rate": LEARNING_RATE,
            "total_time_seconds": total_training_time,
            "best_val_f1": best_val_f1,
            "history": history
        }, f, indent=2)

    print(f"All urgency classification artifacts successfully saved to: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
