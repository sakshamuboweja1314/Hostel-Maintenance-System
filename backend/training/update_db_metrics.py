import sqlite3
import json

with open("backend/training/evaluation_results.json", "r", encoding="utf-8") as f:
    eval_data = json.load(f)

cat_eval = eval_data["category_model"]
urg_eval = eval_data["urgency_model"]

conn = sqlite3.connect("database/hostel_complaints.db")
cursor = conn.cursor()
cursor.execute("DELETE FROM model_metrics;")
cursor.execute(
    "INSERT INTO model_metrics (model_name, task_name, accuracy, precision, recall, f1_score, model_version, evaluation_date) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'));",
    ("DistilBERT-Base-Uncased (Category Classifier)", "Category Classification", cat_eval["accuracy"], cat_eval["precision_weighted"], cat_eval["recall_weighted"], cat_eval["f1_weighted"], "1.0.0")
)
cursor.execute(
    "INSERT INTO model_metrics (model_name, task_name, accuracy, precision, recall, f1_score, model_version, evaluation_date) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'));",
    ("DistilBERT-Base-Uncased (Urgency Classifier)", "Urgency Classification", urg_eval["accuracy"], urg_eval["precision_weighted"], urg_eval["recall_weighted"], urg_eval["f1_weighted"], "1.0.0")
)
conn.commit()
print("Updated model_metrics:")
cursor.execute("SELECT task_name, accuracy, f1_score FROM model_metrics;")
for row in cursor.fetchall():
    print(row)
