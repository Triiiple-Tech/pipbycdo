# pipbycdo/backend/routes/api.py
from fastapi import APIRouter, Request, HTTPException, Header
from backend.app.schemas import AppState, AnalyzeRequest, AnalyzeResponse, AgentTraceEntry, MeetingLogEntry
from backend.agents.manager_agent import handle as manager_handle
from datetime import datetime, timezone
from typing import Optional # Added Optional

router = APIRouter()

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request_data: AnalyzeRequest, internal_code: Optional[str] = Header(None, alias="X-Internal-Code")):
    if internal_code != "hermes":
        raise HTTPException(status_code=401, detail="Unauthorized")

    current_time = datetime.now(timezone.utc)

    # Initialize state using Pydantic model for validation and defaults
    initial_state_data = request_data.model_dump(exclude_unset=True) # Get only provided fields
    
    state = AppState(
        **initial_state_data, # Spread the request data
        agent_trace=[],
        meeting_log=[],
        created_at=current_time,
        updated_at=current_time,
        error=None
    )

    # Ensure estimate is an empty list if not provided, not None
    if state.estimate is None: # Pydantic default_factory handles this, but good for explicit clarity if needed
        state.estimate = []

    # Call the manager agent
    final_state_dict = manager_handle(state.model_dump()) # Pass state as dict
    
    # Convert the dictionary back to AppState Pydantic model for response validation
    # This also helps if manager_handle modifies the state structure
    response_state = AppState(**final_state_dict)
    
    return response_state
