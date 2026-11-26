from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime
from backend.app.database import Base

class ModelMetricsRecord(Base):
    __tablename__ = "model_metrics"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    model_name = Column(String(100), nullable=False)
    task_name = Column(String(100), nullable=False)
    accuracy = Column(Float, nullable=False)
    precision = Column(Float, nullable=False)
    recall = Column(Float, nullable=False)
    f1_score = Column(Float, nullable=False)
    model_version = Column(String(50), default="1.0.0")
    evaluation_date = Column(DateTime, default=datetime.utcnow)
