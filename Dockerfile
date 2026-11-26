FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install CPU-only PyTorch first (to keep image lean)
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu torch torchvision torchaudio \
    && pip install --no-cache-dir -r requirements.txt

# Copy backend source code, database, and models
COPY backend /app/backend
COPY database /app/database
RUN mkdir -p /app/uploads

# Expose FastAPI port
EXPOSE 8000

# Start FastAPI application
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
