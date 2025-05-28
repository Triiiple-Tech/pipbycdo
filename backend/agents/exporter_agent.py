# pipbycdo/backend/agents/exporter_agent.py
# Update the import path to the correct location of 'log'
import logging
from backend.app.schemas import AppState, AgentTraceEntry, MeetingLogEntry # Use Pydantic models
from datetime import datetime, timezone

def log(state, level="info", msg=""):
    getattr(logging, level, logging.info)(msg)

def handle(state_dict: dict) -> dict: # Expect and return dict
    state = AppState(**state_dict) # Convert dict to Pydantic model

    if state.estimate:
        num_items = len(state.estimate)
        export_message = f"Exported estimate with {num_items} items."
        state.export = export_message
        state.agent_trace.append(AgentTraceEntry(agent="exporter", decision="export done"))
        state.meeting_log.append(MeetingLogEntry(agent="exporter", message="export done"))
        log(state, level="info", msg="Export successful")
    else:
        error_msg = "Export failed: Missing estimate data"
        state.error = error_msg
        state.agent_trace.append(AgentTraceEntry(agent="exporter", decision=error_msg, level="error", error=error_msg))
        state.meeting_log.append(MeetingLogEntry(agent="exporter", message=error_msg))
        log(state, level="error", msg=f"Export failed: {error_msg}")
        # Consider raising an exception here or ensuring the error is handled upstream
        # For now, just setting the error in state as per existing pattern

    state.updated_at = datetime.now(timezone.utc)
    return state.model_dump() # Return as dict
