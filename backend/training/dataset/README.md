# Hostel Maintenance Complaint Dataset

## Overview
This dataset contains synthetic, domain-realistic hostel maintenance complaints designed specifically for fine-tuning compact Transformer models (DistilBERT) for edge deployment.

### Specifications
- **Total Records:** 1,200
- **Random Seed:** 42 (Fully deterministic and reproducible)
- **Train/Val/Test Split:** 70% / 15% / 15% (Stratified by both category and urgency)
  - `train.csv`: 840 examples
  - `val.csv`: 180 examples
  - `test.csv`: 180 examples

### Categories (6 Classes)
1. **Water and Plumbing** (200 records): Pipe bursts, geyser leaks, toilet clogs, tap issues, seepage.
2. **Electrical** (200 records): Sparks, short circuits, exposed wires, MCB tripping, lights, fans.
3. **Internet and Wi-Fi** (200 records): Access point failure, captive portal issues, slow speed, latency.
4. **Cleanliness and Sanitation** (200 records): Sewage backflow, pest infestations, mold, dustbin overflow, stains.
5. **Furniture and Civil Maintenance** (200 records): Plaster collapse, broken chair/bed, jammed door, window cracks.
6. **Other** (200 records): Fire safety, elevators, laundry machines, animal intrusion, noise, clock issues.

### Urgency Levels (4 Classes)
1. **Critical** (240 records): Severe hazards to life, physical safety, health, or massive infrastructure disruption.
2. **High** (360 records): Serious functional disruption affecting daily student life or imminent deadlines.
3. **Medium** (360 records): Suboptimal equipment function, intermittent problems, standard queue.
4. **Low** (240 records): Minor cosmetic flaws, slight squeaks, routine non-urgent adjustments.

### Academic Notes (Unit III & IV)
- Generated via stratified domain templates with grammatical, prefix/suffix, spelling, and casing variations.
- Demonstrates encoder-based sequence classification on natural language complaint text.
- Provides test sets with zero overlap with training text.
