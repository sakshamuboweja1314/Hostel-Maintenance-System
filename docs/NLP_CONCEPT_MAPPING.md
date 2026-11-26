# Academic Syllabus Concept Mapping
## Course: Natural Language Processing with Large Language Models (NLP with LM)
### Units Addressed: Unit III (Transformer Models & Machine Translation) and Unit IV (Large Language Models)

This document establishes the explicit mapping between the university syllabus topics and the concrete, runnable implementation in the **Edge-Based Hostel Maintenance Complaint Prioritization System**.

---

## 1. Summary of Syllabus Alignment Matrix

| Unit | Syllabus Concept | Implementation Status | Primary Implementation File Path | Application Feature / Demonstration |
| :--- | :--- | :--- | :--- | :--- |
| **III** | **Transformer Architecture** | **Implemented** | `backend/app/services/inference_service.py`<br>`backend/training/train_category.py` | 6-layer bidirectional Transformer encoder processing complaint sequence |
| **III** | **Encoder Architecture** | **Implemented** | `backend/models/category_model/`<br>`backend/models/urgency_model/` | `DistilBertForSequenceClassification` dual classification heads |
| **III** | **Self-Attention & Multi-Head Attention** | **Implemented** | Loaded via PyTorch/HuggingFace Transformer layers (`attention.q_lin`, `k_lin`, `v_lin`) | 12 attention heads per layer dynamically attending to hazard keywords |
| **III** | **Positional Encoding** | **Implemented** | DistilBERT learned positional embeddings (`embeddings.position_embeddings`) | Preserves word order and structural grammar in complaint sentences |
| **III** | **Contextual Representations** | **Implemented** | DistilBERT 768-dimensional token hidden states | Distinguishes identical words in safe vs critical contexts (e.g. "pipe burst" vs "faucet leak") |
| **III** | **Prompt Engineering** | **Demonstrated in Lab** | `backend/app/routes/prompts.py`<br>`frontend/src/pages/PromptLabPage.tsx` | Interactive Prompt Engineering Lab with Zero-shot, One-shot, Few-shot templates |
| **III** | **Structured Output Generation** | **Demonstrated in Lab & API** | `backend/app/routes/prompts.py`<br>`backend/app/schemas/prediction_schema.py` | Type-safe JSON output generation conforming to schema |
| **IV** | **Pretrained Language Models** | **Implemented** | `distilbert-base-uncased` checkpoints downloaded to `backend/models/` | 66.9M parameter compact Transformer loaded locally on edge device |
| **IV** | **Knowledge Distillation** | **Implemented Base** | DistilBERT pretrained architecture | 40% parameter reduction from BERT with 97% language retention |
| **IV** | **Fine-Tuning on Downstream Task** | **Implemented** | `backend/training/train_category.py`<br>`backend/training/train_urgency.py` | End-to-end task fine-tuning on 1,200 domain complaints (99.4% & 95.6% F1) |
| **IV** | **Classification Heads** | **Implemented** | Linear layer projection `(768 -> 6)` and `(768 -> 4)` with Softmax | Category classifier (6 classes) and Urgency classifier (4 classes) |
| **IV** | **In-Context Learning (Few-Shot)** | **Demonstrated in Lab** | `backend/app/routes/prompts.py` | In-context demonstration exemplars without parameter updating |
| **IV** | **Model Evaluation Metrics** | **Implemented** | `backend/training/evaluate_models.py`<br>`frontend/src/pages/ModelPerformancePage.tsx` | Accuracy, Precision, Recall, F1, Confusion Matrix, Classification Report |
| **IV** | **Responsible AI & Human-in-the-Loop** | **Implemented** | `backend/app/services/priority_service.py`<br>`backend/app/services/safety_service.py` | Confidence threshold flag, transparent explanation, administrator override |
| **IV** | **Parameter-Efficient Fine-Tuning (PEFT / LoRA)** | **Theoretically Documented** | `docs/MODEL_ARCHITECTURE.md` | Documented as alternative low-resource fine-tuning method |

---

## 2. Detailed Technical Breakdown by Syllabus Topic

### Concept 1: Transformer Architecture & Encoder Processing (Unit III)
- **Syllabus Topic:** Transformer Models, Encoder Blocks, Attention Mechanisms.
- **Code Implementation:**
  - Tokenization: `AutoTokenizer.from_pretrained("distilbert-base-uncased")` in `backend/app/services/inference_service.py`.
  - Architecture: `DistilBertForSequenceClassification` containing 6 Transformer layers.
- **How It Works:**
  Unlike traditional Recurrent Neural Networks (RNNs or LSTMs) that process tokens sequentially ($O(n)$ sequential runtime), DistilBERT processes all input tokens simultaneously via parallel dot-product self-attention.
  For an input complaint such as *"Water is leaking directly onto the electrical board"*:
  1. Tokenizer splits text into WordPiece tokens with special tokens `[CLS]` and `[SEP]`.
  2. Input IDs are converted to vector embeddings and combined with Positional Encodings.
  3. The representation passes through 6 Transformer layers, each computing Multi-Head Attention followed by Feed-Forward Networks with GELU activation and Layer Normalization.
  4. The `[CLS]` token contextual vector at layer 6 represents the entire complaint sentence and is projected into classification logits.

### Concept 2: Self-Attention & Multi-Head Attention (Unit III)
- **Syllabus Topic:** Scaled Dot-Product Attention, Multi-Head Attention.
- **Code Implementation:**
  - Built into the DistilBERT attention modules in `backend/models/category_model/` and `backend/models/urgency_model/`.
- **Mathematical Operation:**
  $$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{Q K^T}{\sqrt{d_k}}\right) V$$
  $$\text{MultiHead}(Q, K, V) = \text{Concat}(\text{head}_1, \dots, \text{head}_h) W^O$$
- **Domain Significance in Application:**
  Multi-head attention enables the model to simultaneously attend to:
  - Subject tokens: *"pipe"*, *"switchboard"*, *"Wi-Fi"*, *"chair"*.
  - Modifier/Severity tokens: *"burst"*, *"sparks"*, *"disconnected"*, *"broken"*.
  - Spatial/Urgency modifiers: *"flooding"*, *"fire"*, *"exam"*, *"slight"*.

### Concept 3: Pretraining vs. Downstream Fine-Tuning (Unit IV)
- **Syllabus Topic:** Large Language Model Pretraining (MLM), Transfer Learning, Task-Specific Fine-Tuning.
- **Code Implementation:**
  - `backend/training/train_category.py`
  - `backend/training/train_urgency.py`
- **Technical Explanation:**
  - **Pretraining Phase:** DistilBERT was pretrained on Toronto BookCorpus and English Wikipedia via Masked Language Modeling (MLM) to acquire general syntax, vocabulary, and world knowledge.
  - **Fine-Tuning Phase:** In this project, the pretrained Transformer weights were loaded as the initial checkpoint. We attached two task-specific linear heads:
    1. Category Head: Linear layer mapping 768 hidden dimensions to 6 category logits.
    2. Urgency Head: Linear layer mapping 768 hidden dimensions to 4 urgency logits.
  - The models were trained for 3 epochs on 840 domain complaints using AdamW optimizer ($\text{lr} = 4 \times 10^{-5}$) with a linear warmup-decay schedule.

### Concept 4: Prompt Engineering & In-Context Learning (Unit III & IV)
- **Syllabus Topic:** Prompt Engineering, Zero-Shot, Few-Shot, Role Prompting, In-Context Learning.
- **Code Implementation:**
  - Backend API: `backend/app/routes/prompts.py`
  - Interactive UI: `frontend/src/pages/PromptLabPage.tsx`
- **Demonstrated Techniques:**
  1. **Zero-Shot Prompting:** The prompt provides direct task instructions without demonstration examples.
  2. **One-Shot Prompting:** The prompt provides one input-output exemplar to anchor output syntax.
  3. **Few-Shot In-Context Learning:** The prompt includes 3 balanced exemplars across categories and urgencies, steering the generative model without gradient updates.
  4. **Role Prompting:** The prompt explicitly primes the model as a *"Chief Facility & Safety Warden"* to heighten safety sensitivity.
  5. **Structured Output Generation:** Constrains model output to a valid JSON schema for downstream software consumption.
- **Academic Integrity Note:** If local Ollama is running, live inference executes locally on the edge. If Ollama is not detected, the application transparently displays the compiled prompt template and academic explanation without generating fabricated outputs.

### Concept 5: Model Evaluation & Metrics (Unit IV)
- **Syllabus Topic:** Evaluation Metrics, Confusion Matrix, Classification Report, Generalization.
- **Code Implementation:**
  - `backend/training/evaluate_models.py`
  - `backend/training/evaluation_results.json`
  - `frontend/src/pages/ModelPerformancePage.tsx`
- **Actual Empirical Evaluation on Held-Out Test Set (180 Samples):**
  - **Category Classification:**
    - Accuracy: **100.00%**
    - Weighted Precision: **1.0000**
    - Weighted Recall: **1.0000**
    - Weighted F1-Score: **1.0000**
    - Average Inference Latency: **44.23 ms/sample** (Local CPU)
  - **Urgency Classification:**
    - Accuracy: **95.56%**
    - Weighted Precision: **0.9549**
    - Weighted Recall: **0.9556**
    - Weighted F1-Score: **0.9549**
    - Average Inference Latency: **43.77 ms/sample** (Local CPU)

### Concept 6: Responsible AI, Bias, and Explainability (Unit IV)
- **Syllabus Topic:** Explainable AI, Confidence Thresholds, Safety Guardrails, Human-in-the-Loop.
- **Code Implementation:**
  - `backend/app/services/priority_service.py`
  - `backend/app/services/safety_service.py`
- **Mechanisms:**
  1. **Transparent Prioritization Formula:** Priority Score is deterministically computed as:
     $$\text{Priority Score} = \text{Urgency Weight} \times \text{Urgency Confidence}$$
     Where weights are: Critical = 100, High = 75, Medium = 50, Low = 25.
  2. **Confidence-Driven Human Review:** If model confidence is below the threshold ($\tau = 0.60$), the complaint is automatically flagged with `requires_human_review = True`.
  3. **Safety Escalation Layer:** High-risk hazards (sparks, live wires, fire, flooding into electrical circuits) trigger a transparent safety escalation. Model predictions are preserved in the database to prevent silent manipulation.
  4. **Administrator Audit Trail:** Full change logs and audit records are recorded in `complaint_history` whenever urgency or status is modified.
