# REST API Documentation
## Edge-Based Hostel Maintenance Complaint Prioritization System

The backend provides a high-performance RESTful API built on **FastAPI** with automatic Swagger interactive documentation accessible at `http://127.0.0.1:8000/docs`.

---

## 1. System Health & Model Status

### `GET /api/health`
Returns backend operational status, SQLite connection health, and DistilBERT model load status.
- **Response `200 OK`:**
```json
{
  "status": "healthy",
  "backend": "online",
  "database": "connected (SQLite: hostel_complaints.db)",
  "models": {
    "loaded": true,
    "device": "cpu",
    "category_model": "distilbert-base-uncased (Fine-tuned, 6 classes)",
    "urgency_model": "distilbert-base-uncased (Fine-tuned, 4 classes)"
  },
  "edge_inference": "active (local CPU/CUDA, zero cloud dependency)"
}
```

### `GET /api/model/status`
Returns edge model runtime statistics, confidence threshold, and class labels.
- **Response `200 OK`:**
```json
{
  "status": "ready",
  "category_model_loaded": true,
  "urgency_model_loaded": true,
  "device": "cpu",
  "confidence_threshold": 0.60,
  "category_classes": [
    "Water and Plumbing",
    "Electrical",
    "Internet and Wi-Fi",
    "Cleanliness and Sanitation",
    "Furniture and Civil Maintenance",
    "Other"
  ],
  "urgency_classes": [
    "Critical",
    "High",
    "Medium",
    "Low"
  ]
}
```

---

## 2. Model Inference & Evaluation

### `POST /api/model/predict`
Runs local edge inference without persisting to the database. Useful for debugging and testing.
- **Request Body:**
```json
{
  "complaint_text": "Sparks flying from switchboard in Room 204."
}
```
- **Response `200 OK`:**
```json
{
  "predicted_category": "Electrical",
  "category_confidence": 0.9984,
  "all_category_probabilities": {
    "Water and Plumbing": 0.0001,
    "Electrical": 0.9984,
    "Internet and Wi-Fi": 0.0001,
    "Cleanliness and Sanitation": 0.0001,
    "Furniture and Civil Maintenance": 0.0003,
    "Other": 0.0010
  },
  "predicted_urgency": "Critical",
  "urgency_confidence": 0.9912,
  "all_urgency_probabilities": {
    "Critical": 0.9912,
    "High": 0.0064,
    "Medium": 0.0018,
    "Low": 0.0006
  },
  "final_urgency": "Critical",
  "priority_score": 100.0,
  "priority_reason": "[SAFETY ESCALATION] Escalated to Critical due to hazard: Detected active electrical sparking hazard.",
  "safety_override": true,
  "requires_human_review": false,
  "processing_time_ms": 44.5,
  "model_architecture": "DistilBERT (distilbert-base-uncased)"
}
```

### `GET /api/model/metrics`
Returns empirical evaluation results calculated on the held-out test split (180 samples).
- **Response `200 OK`:** JSON containing accuracy, precision, recall, F1-scores, confusion matrices, and classification reports.

---

## 3. Complaint Management

### `POST /api/complaints`
Accepts a natural language complaint, executes edge inference, computes priority, and persists to SQLite.
- **Request Body:**
```json
{
  "complaint_text": "Bathroom faucet in Room 104 is dripping slowly throughout the night.",
  "student_name": "Rohan Sharma",
  "room_number": "Room 104",
  "hostel_block": "Block A"
}
```
- **Response `201 Created`:** Full complaint object including calculated `priority_score`, `predicted_category`, and `final_urgency`.

### `GET /api/complaints`
Retrieves complaints sorted by `priority_score` (descending) and `created_at` (ascending).
- **Query Parameters:**
  - `page`: Page index (default: `1`).
  - `limit`: Number of items per page (default: `20`).
  - `search`: Substring search in text, room, or student name.
  - `category`: Filter by category name or `all`.
  - `urgency`: Filter by urgency (`Critical`, `High`, `Medium`, `Low`, or `all`).
  - `status`: Filter by status (`Pending`, `In Progress`, `Resolved`, `Under Review`).

### `GET /api/complaints/{id}`
Returns detailed record for a single complaint.

### `PATCH /api/complaints/{id}/status`
Transitions complaint workflow state.
- **Request Body:**
```json
{
  "status": "In Progress",
  "admin_notes": "Plumber dispatched."
}
```

### `PATCH /api/complaints/{id}/priority`
Allows administrator to override model predicted urgency and priority score.
- **Request Body:**
```json
{
  "override_urgency": "Critical",
  "admin_reason": "Occupant is preparing for semester exam; immediate fix required."
}
```

### `GET /api/complaints/{id}/history`
Returns chronological audit log of all transitions, overrides, and actions.

---

## 4. Dashboard Metrics

### `GET /api/dashboard/stats`
Returns live operational counts: `total_complaints`, `pending_complaints`, `critical_complaints`, `high_priority_complaints`, `resolved_complaints`, and the top priority queue.

### `GET /api/dashboard/distribution`
Returns complaint distribution dictionaries grouped by `by_category` and `by_urgency`.

---

## 5. Prompt Engineering Lab

### `GET /api/prompts/templates`
Returns prompt templates for Zero-Shot, One-Shot, Few-Shot, Role Prompting, and Structured JSON.

### `POST /api/prompts/analyze`
Executes or compiles the selected prompt strategy. Communicates with local Ollama if present, or provides full academic demonstration without cloud dependencies.
