from fastapi import FastAPI
from routes.api import api_router

app = FastAPI(title="PIP AI API")

# mount your API router at /api
app.include_router(api_router, prefix="/api")

@app.get("/health")
async def health():
    return {"status": "ok"}
