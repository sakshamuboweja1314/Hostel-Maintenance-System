# Edge AI Deployment Architecture
## Privacy-First, Zero-Cloud Hostel Maintenance Triage

---

## 1. Cloud AI vs. Edge AI Deployment

| Dimension | Cloud AI Architecture | Edge AI Architecture (Our System) |
| :--- | :--- | :--- |
| **Data Privacy** | High Risk: Student complaint text and room identifiers are transmitted over public internet to third-party cloud servers. | **Zero Risk:** 100% of text processing occurs locally in host memory. No data packets ever leave the computer. |
| **Internet Dependency** | Mandatory continuous internet connection. System fails during network outages. | **Zero Dependency:** After initial setup, functions completely offline without internet. |
| **Latency** | Network latency (200 - 1500 ms round trip) + queuing + API rate limits. | **Ultra-Low Latency:** ~44 ms local CPU execution time. Immediate UI response. |
| **Operating Cost** | Recurring token billing (e.g. OpenAI/Anthropic/AWS/GCP API costs). | **Zero Cost:** Free open-weight DistilBERT model. No recurring subscription fees. |
| **Operational Reliability** | Dependent on external API uptime, rate limits, and SLA. | **Guaranteed Availability:** Runs locally on campus/hostel administration workstation. |

---

## 2. Local Storage Footprint

The system maintains its complete model weights, tokenizer vocabularies, configuration, and relational database locally in the workspace:

```
backend/
├── models/
│   ├── category_model/
│   │   ├── config.json                 (Model architecture hyperparameters)
│   │   ├── model.safetensors           (Fine-tuned DistilBERT weights ~260 MB)
│   │   ├── tokenizer.json              (WordPiece vocabulary)
│   │   ├── vocab.txt                   (30,522 token vocabulary)
│   │   ├── label_to_id.json            (String-to-index class mapping)
│   │   └── id_to_label.json            (Index-to-string class mapping)
│   │
│   └── urgency_model/
│       ├── config.json
│       ├── model.safetensors           (~260 MB)
│       ├── tokenizer.json
│       ├── vocab.txt
│       ├── label_to_id.json
│       └── id_to_label.json
│
database/
└── hostel_complaints.db                (Local SQLite relational database)
```

---

## 3. Hardware Requirements & Performance Profiling

### Baseline Edge System (Minimum Specification)
- **CPU:** Dual-Core x86_64 / ARM64 processor (Intel Core i3 / AMD Ryzen 3 or equivalent).
- **RAM:** 4 GB available system RAM (Model in memory uses ~850 MB).
- **Disk:** 1.5 GB free disk space (weights, dependencies, database).
- **GPU:** Optional. CPU is default and fully supported.

### Benchmark Latency Metrics (Measured on Host)
- **Batch Size:** 1 (Interactive complaint submission).
- **Category Model Inference:** 44.23 ms on Intel/AMD CPU.
- **Urgency Model Inference:** 43.77 ms on Intel/AMD CPU.
- **Combined Dual-Head Pipeline + Safety Rules + SQLite Persistence:** **< 110 ms total roundtrip**.

---

## 4. Responsible AI & Air-Gapped Operation

1. **Student Confidentiality:** Room numbers and resident names remain strictly on the local SQLite database.
2. **Deterministic Fallbacks:** If the system is started on an air-gapped machine without internet, local Hugging Face caching loads the models directly from `./models/category_model` and `./models/urgency_model` without issuing network calls.
3. **Emergency Escalation:** Safety escalations (e.g., electrical sparking, severe flooding) are evaluated deterministically in Python memory without waiting for external API calls, guaranteeing sub-second response times.
