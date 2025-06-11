# pipbycdo/backend/app/main.py
import sys
import os
import json

# Add project root to path and load environment variables using our custom loader
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)

# Use our custom environment loader
from backend.load_env import *

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.routes import api as api_router
from backend.routes import analytics as analytics_router
from backend.routes import smartsheet as smartsheet_router
from backend.routes import chat as chat_router
from backend.routes import files as files_router
from backend.routes import agents as agents_router

app = FastAPI(
    title="PipByCDO API",
    version="0.1.0",
    description="API for processing estimates and exports."
)

# CORS Middleware Configuration
# TODO: Restrict origins, methods, and headers for production
cors_origins = os.environ.get("CORS_ORIGINS", "[*]")
try:
    allow_origins = json.loads(cors_origins)
except Exception:
    allow_origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,  # Use env var
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

app.include_router(api_router.router, prefix="/api")
app.include_router(analytics_router.router, prefix="/api/analytics")
app.include_router(smartsheet_router.router, prefix="/api")
app.include_router(chat_router.router, prefix="/api/chat")
app.include_router(files_router.router, prefix="/api/files")
app.include_router(agents_router.router, prefix="/api/agents")

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.get("/")
async def read_root():
    return {"message": "Welcome to PipByCDO API"}
