# pipbycdo/backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware # Added
from backend.routes import api as api_router # Corrected import

app = FastAPI(
    title="PipByCDO API",
    version="0.1.0",
    description="API for processing estimates and exports."
)

# CORS Middleware Configuration
# TODO: Restrict origins, methods, and headers for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

app.include_router(api_router.router, prefix="/api")

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.get("/")
async def read_root():
    return {"message": "Welcome to PipByCDO API"}
