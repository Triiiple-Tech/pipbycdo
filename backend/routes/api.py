from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel
from ..services.utils.state import create_initial_state
from agents.manager_agent import handle as manager_handle

api_router = APIRouter()

class AnalyzeRequest(BaseModel):
    smartsheet_link: str | None = None

@api_router.post("/analyze")
async def analyze(
    file: UploadFile = File(None),
    payload: AnalyzeRequest = Depends()
):
    # 1. Validate inputs
    if file:
        state = create_initial_state(file=file)
    elif payload.smartsheet_link:
        state = create_initial_state(link=payload.smartsheet_link)
    else:
        raise HTTPException(
            status_code=400,
            detail="Provide either a file upload or smartsheet_link"
        )

    # 2. Orchestrate Manager → sub-agents → QA → Exporter
    result = manager_handle(state)
    return result
