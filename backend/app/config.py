import os

class Settings:
    PROJECT_NAME: str = "Edge-Based Hostel Maintenance Complaint Prioritization System"
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Paths
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DATABASE_PATH: str = os.path.abspath(os.path.join(BASE_DIR, "..", "database", "hostel_complaints.db"))
    DATABASE_URL: str = f"sqlite:///{DATABASE_PATH}"
    
    CATEGORY_MODEL_PATH: str = os.path.abspath(os.path.join(BASE_DIR, "models", "category_model"))
    URGENCY_MODEL_PATH: str = os.path.abspath(os.path.join(BASE_DIR, "models", "urgency_model"))
    EVALUATION_RESULTS_PATH: str = os.path.abspath(os.path.join(BASE_DIR, "training", "evaluation_results.json"))
    
    # Priority & Confidence Thresholds
    CONFIDENCE_THRESHOLD: float = float(os.getenv("CONFIDENCE_THRESHOLD", "0.60"))
    ADMIN_TOKEN: str = os.getenv("ADMIN_TOKEN", "admin123")
    
    # Optional Local LLM (Ollama)
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")

settings = Settings()
