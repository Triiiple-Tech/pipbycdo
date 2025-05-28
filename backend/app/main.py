# pipbycdo/backend/app/main.py
from fastapi import FastAPI
from backend.routes import api as api_router # Corrected import

app = FastAPI(
    title="PipByCDO API",
    version="0.1.0",
    description="API for processing estimates and exports."
)

app.include_router(api_router.router, prefix="/api")

@app.get("/")
async def read_root():
    return {"message": "Welcome to PipByCDO API"}
