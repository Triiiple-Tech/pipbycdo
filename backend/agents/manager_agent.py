# pipbycdo/backend/agents/manager_agent.py
from backend.app.schemas import AppState, AgentTraceEntry, MeetingLogEntry # Use Pydantic models
from backend.agents.estimator_agent import handle as estimator_handle
from backend.agents.exporter_agent import handle as exporter_handle
from datetime import datetime, timezone
from typing import Optional # Added Optional

def detect_intent(query: Optional[str]) -> Optional[str]:
    if not query:
        return None
    q = query.lower()
    if "export" in q:
        return "export"
    if "estimate" in q:
        return "estimate"
    return None

def handle(state_dict: dict) -> dict: # Expect and return dict for now
    state = AppState(**state_dict) # Convert dict to Pydantic model

    intent = detect_intent(state.query)
    
    state.agent_trace.append(AgentTraceEntry(
        agent="manager", 
        decision=f"detected intent: {intent}"
    ))
    state.meeting_log.append(MeetingLogEntry(
        agent="manager", 
        message=f"detected intent: {intent}"
    ))

    if intent == "estimate":
        # Pass as dict, get dict back, then update Pydantic model
        updated_state_dict = estimator_handle(state.model_dump())
        state = AppState(**updated_state_dict)
        state.agent_trace.append(AgentTraceEntry(agent="manager", decision="delegated to estimate"))
        state.meeting_log.append(MeetingLogEntry(agent="manager", message="delegated to estimate"))
    elif intent == "export":
        updated_state_dict = exporter_handle(state.model_dump())
        state = AppState(**updated_state_dict)
        state.agent_trace.append(AgentTraceEntry(agent="manager", decision="delegated to export"))
        state.meeting_log.append(MeetingLogEntry(agent="manager", message="delegated to export"))
    else:
        state.error = "Unknown intent"
        state.agent_trace.append(AgentTraceEntry(agent="manager", decision="unknown intent", level="error"))
        state.meeting_log.append(MeetingLogEntry(agent="manager", message="unknown intent"))
    
    state.updated_at = datetime.now(timezone.utc)
    return state.model_dump() # Return as dict
