# backend/Dockerfile

FROM python:3.10-slim
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

# Run the API
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--reload"]
