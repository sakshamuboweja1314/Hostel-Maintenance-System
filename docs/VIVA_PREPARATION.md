# Comprehensive Viva Voce Preparation Guide
## Subject: Natural Language Processing with Large Language Models (NLP with LM)
### Project: Edge-Based Hostel Maintenance Complaint Prioritization System

This document contains 25 targeted examination questions and clear, technically rigorous answers tailored for defending this project during an academic viva voce or practical examination.

---

### Q1: What is the core problem this project solves?
**Answer:** In student hostels and residential facilities, maintenance complaints are typically triaged manually or through basic First-In-First-Out (FIFO) queues. This causes critical life-safety hazards (like electrical fires or severe pipe bursts) to wait behind non-urgent requests (like loose knobs or squeaky chairs). This project solves that problem by using local Natural Language Processing (NLP) to read free-form complaints, automatically predict their category and urgency, and prioritize them in real time.

---

### Q2: Why is this considered an "Edge AI" project?
**Answer:** The entire NLP pipeline—from tokenization to Transformer inference and priority scoring—executes locally on the client/host device using local CPU or GPU. No text or private resident data is sent to external cloud APIs like OpenAI or Google Cloud. The system works completely offline without internet connectivity once the models are downloaded and saved.

---

### Q3: What is a Transformer, and what are its key components?
**Answer:** Introduced by Vaswani et al. in 2017 ("Attention Is All You Need"), the Transformer is a deep learning architecture that replaces recurrent connections (RNNs) with self-attention mechanisms. Its primary components are:
1. **Embedding Layer + Positional Encoding:** Converts discrete token IDs into dense vectors and injects word order information.
2. **Multi-Head Self-Attention:** Computes pairwise token relationships across multiple parallel representation subspaces.
3. **Feed-Forward Networks (FFN):** Applies non-linear transformations with GELU or ReLU activations.
4. **Residual Connections & Layer Normalization:** Stabilizes gradient flow across deep networks.

---

### Q4: What is DistilBERT, and why did we choose it over BERT-Base or GPT?
**Answer:** DistilBERT is a distilled, compact Transformer model created by Hugging Face.
- **Compared to BERT-Base:** It has 40% fewer parameters (66.9M vs 110M), is 60% faster, and retains 97% of BERT's language comprehension capabilities.
- **Compared to GPT (Generative Pretrained Transformer):** GPT is an autoregressive *decoder-only* model designed for causal token generation. DistilBERT is a bidirectional *encoder-only* model that inspects tokens to the left and right simultaneously, which makes it ideal for sequence classification tasks.
- **Edge Suitability:** Its ~256 MB size and ~44 ms inference time on CPU make it well-suited for local edge deployment without specialized GPU hardware.

---

### Q5: What is Self-Attention, and what is its mathematical formula?
**Answer:** Self-attention allows each token in a sentence to attend to every other token to compute a context-aware representation.
The scaled dot-product attention formula is:
$$\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{Q K^T}{\sqrt{d_k}}\right) V$$
Where:
- $Q$ (Query), $K$ (Key), and $V$ (Value) are linear projections of input embeddings.
- $\frac{1}{\sqrt{d_k}}$ is the scaling factor that prevents large dot products from pushing the softmax function into regions with near-zero gradients.
- Softmax converts dot products into an attention probability distribution across sequence tokens.

---

### Q6: What is Multi-Head Attention, and why is it useful?
**Answer:** Instead of computing a single attention distribution, Multi-Head Attention projects $Q, K, V$ into $h$ different subspaces (in DistilBERT, $h = 12$ heads):
$$\text{MultiHead}(Q, K, V) = \text{Concat}(\text{head}_1, \dots, \text{head}_h) W^O$$
This allows the model to simultaneously attend to different aspects of the text: one head might link the subject *"switchboard"* with the predicate *"sparks"*, while another head attends to the location *"Room 204"*.

---

### Q7: Why does DistilBERT need Positional Encoding?
**Answer:** Traditional RNNs process text sequentially token-by-token, so word order is inherently preserved. Transformers, however, process all sequence tokens simultaneously in parallel. Without positional encoding, the Transformer would treat a sentence as an unordered "bag of words", unable to distinguish *"water leaking onto the electrical switch"* from *"electrical switch leaking onto the water"*. Positional encodings provide distinct mathematical coordinates for each token's position in the sequence.

---

### Q8: What is the difference between Pretraining and Fine-Tuning?
**Answer:**
- **Pretraining:** Self-supervised training on massive unlabeled text corpora (e.g. Wikipedia and BookCorpus) to learn general grammar, semantics, and world facts using Masked Language Modeling (MLM).
- **Fine-Tuning:** Supervised training starting from the pretrained model weights, where task-specific classification heads are added and the model is trained on labeled domain datasets (in our case, 840 labeled hostel maintenance complaints) to specialize in category and urgency classification.

---

### Q9: What is Masked Language Modeling (MLM)?
**Answer:** MLM is the self-supervised pretraining objective used in the BERT family. During pretraining, 15% of the input tokens are randomly selected: 80% are replaced with a special `[MASK]` token, 10% are replaced with a random token, and 10% are kept unchanged. The model is trained to predict the original identity of the masked tokens based on both left and right bidirectional context.

---

### Q10: Why did we train two separate classifiers instead of a single combined classifier?
**Answer:** We deliberately decoupled **Category Classification** (6 classes) and **Urgency Classification** (4 classes) because:
1. **Orthogonality:** Category (what domain the issue belongs to) is structurally distinct from urgency (how quickly it needs attention). For example, a Wi-Fi complaint can be High urgency if an entire block is disconnected during exams, while an isolated minor water drip can be Medium or Low urgency.
2. **Modular Upgrades:** Maintenance categories can be adjusted or expanded without retraining the urgency model.
3. **Transparent Probabilities:** Administrators get separate, clear confidence scores for both predictions.

---

### Q11: How is the Priority Score calculated?
**Answer:** The priority score is calculated using the formula:
$$\text{Priority Score} = \text{Urgency Weight} \times \text{Urgency Confidence}$$
Where Urgency Weights are:
- **Critical:** 100.0
- **High:** 75.0
- **Medium:** 50.0
- **Low:** 25.0

For example, a complaint classified as Critical with 98.4% confidence yields a score of:
$$100.0 \times 0.984 = 98.40$$
If safety escalation is triggered, the priority score is escalated to 100.0.

---

### Q12: How are complaints ranked when two complaints have the exact same Priority Score?
**Answer:** The system uses a secondary sort key: the complaint creation timestamp ($created\_at$). In SQLite:
`ORDER BY priority_score DESC, created_at ASC`.
This ensures that equally urgent complaints are handled in First-In-First-Out order.

---

### Q13: What is the Safety Escalation Layer, and why doesn't it replace the NLP model?
**Answer:** The safety escalation layer is a deterministic safety net that scans complaint text for critical hazard keywords (such as electrical sparks, exposed live wires, fire, or uncontrolled flooding).
If detected, it escalates the final urgency to "Critical" and sets `safety_override = True`.
Importantly, it **does not alter the model's raw predicted urgency or confidence logs** in the database. Both the AI model's output and the safety override reason are recorded separately for auditing and transparency.

---

### Q14: How does the system implement Responsible AI and handle low confidence?
**Answer:**
1. **Confidence Thresholding:** If either category or urgency confidence falls below a configurable threshold (default: $\tau = 0.60$), the system automatically sets `requires_human_review = True`.
2. **Transparent Rationale:** Every complaint record includes a plain-text priority explanation detailing the math and weights used.
3. **Human-in-the-Loop Override:** Facility administrators can manually override urgency and priority, with mandatory logging of the administrator's reason in `complaint_history`.

---

### Q15: What evaluation metrics were computed on the test set?
**Answer:** We evaluated both models on a held-out test split of 180 samples using Scikit-Learn:
- **Accuracy:** The proportion of total correct predictions over all test samples.
- **Precision:** The proportion of predicted positive instances that were actually correct.
- **Recall:** The proportion of actual positive instances correctly identified by the model.
- **F1-Score:** The harmonic mean of precision and recall:
  $$F_1 = 2 \times \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}}$$
- **Confusion Matrix:** An $N \times N$ matrix showing true class labels versus predicted class labels to inspect misclassifications.

---

### Q16: What were the actual evaluation results achieved by your models?
**Answer:**
- **Category Classifier (6 Classes):**
  - Test Accuracy: **100.00%**
  - Weighted F1-Score: **1.0000**
  - Average Inference Time: **44.23 ms/sample** on local CPU
- **Urgency Classifier (4 Classes):**
  - Test Accuracy: **95.56%**
  - Weighted F1-Score: **0.9549**
  - Average Inference Time: **43.77 ms/sample** on local CPU

---

### Q17: What dataset was used to train the models?
**Answer:** A balanced dataset of 1,200 domain-specific hostel maintenance complaints was created using a deterministic script (`generate_dataset.py`, random seed 42).
- It contains exactly 200 examples per category across 6 categories.
- Urgency is distributed as 240 Critical, 360 High, 360 Medium, and 240 Low.
- It was split using stratified sampling into 70% Training (840 samples), 15% Validation (180 samples), and 15% Testing (180 samples).
- Variations in grammar, typos, prefixes/suffixes, and sentence lengths were included to reflect real-world writing.

---

### Q18: What is the Prompt Engineering Lab, and why is it included?
**Answer:** The Prompt Engineering Lab is an educational demonstration module aligned with Unit III and Unit IV. It demonstrates:
1. **Zero-Shot Prompting:** Providing direct instructions without examples.
2. **One-Shot Prompting:** Providing one exemplar to anchor formatting.
3. **Few-Shot In-Context Learning:** Providing multiple balanced exemplars to guide output without updating weights.
4. **Role Prompting:** Conditioning the model with a persona (e.g. Chief Facility Warden).
5. **Structured JSON Output:** Constraining generation to a type-safe schema.
If a local Ollama instance is running, it executes locally. Otherwise, it clearly displays the compiled prompt template and explains the mechanism without fabricating responses.

---

### Q19: What is the difference between Parameter-Efficient Fine-Tuning (PEFT) and full fine-tuning?
**Answer:**
- **Full Fine-Tuning:** All 66.9M parameters across all layers and heads are updated via backpropagation.
- **PEFT (e.g. LoRA - Low-Rank Adaptation):** Keeps the pretrained base model weights frozen and injects small trainable rank-decomposition matrices ($A$ and $B$) into attention projection layers. This reduces trainable parameters by ~99%, saving memory while retaining performance.

---

### Q20: What database is used, and how is it structured?
**Answer:** SQLite (`hostel_complaints.db`) via SQLAlchemy ORM. It has three core tables:
1. `complaints`: Stores raw complaint text, student info, model predictions, confidence scores, priority score, final urgency, status, and timestamps.
2. `complaint_history`: An immutable audit log tracking every action (`CREATED`, `STATUS_UPDATED`, `PRIORITY_OVERRIDDEN`), with previous/new values and notes.
3. `model_metrics`: Stores test evaluation metrics for academic verification.

---

### Q21: How does the application prevent SQL injection and malformed inputs?
**Answer:**
1. **Parameterized Queries:** SQLAlchemy ORM compiles all queries into parameterized SQL statements, preventing SQL injection.
2. **Pydantic Validation:** All incoming request payloads are strictly validated for length, type, and non-empty constraints. Whitespace-only submissions return HTTP 422.

---

### Q22: What happens if an input complaint is ambiguous or nonsensical?
**Answer:**
1. DistilBERT processes the tokens through its attention layers.
2. The softmax probability distribution across classes becomes flatter (entropy increases).
3. The resulting confidence score falls below our 60% threshold.
4. The system flags the complaint with `requires_human_review = True` and displays an explanation alert in the dashboard for human administrator verification.

---

### Q23: How fast does the model run, and what is its computational footprint?
**Answer:**
- **Inference Latency:** ~44 ms per classification head on a standard consumer laptop CPU (Intel/AMD).
- **RAM Usage:** ~850 MB total for Python runtime, PyTorch, and both loaded models.
- **Disk Storage:** ~260 MB per model in Safetensors format (~520 MB total).

---

### Q24: What are the main limitations of the current implementation?
**Answer:**
1. **Synthetic Training Data:** While realistic, the initial dataset was synthetically generated. Real-world deployment requires continuous data collection and periodic fine-tuning on actual student grievances.
2. **English Language Only:** The tokenizer is `distilbert-base-uncased`, meaning it handles English only. Regional languages or Romanized vernacular would benefit from multilingual models (e.g. `xlm-roberta-base`).
3. **Single Modality:** Does not accept photos or audio recordings directly.

---

### Q25: How would you extend this project in the future?
**Answer:**
1. **Multi-Modal Verification:** Integrate lightweight edge vision models (e.g., MobileNet or CLIP) to allow students to attach photos of broken items and verify severity visually.
2. **Voice-to-Text:** Add a local edge Whisper model (`whisper.cpp` or `whisper-tiny`) for voice complaint submission.
3. **Automated Work Orders:** Automatically dispatch SMS or WhatsApp notifications to assigned plumbers or electricians based on the predicted category.
