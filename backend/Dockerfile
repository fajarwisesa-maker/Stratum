FROM python:3.11-slim

WORKDIR /app

# Install dependencies first (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code & artifacts
COPY . .

# HF Spaces uses port 7860 by default
EXPOSE 7860

CMD ["uvicorn", "api_main:app", "--host", "0.0.0.0", "--port", "7860"]
