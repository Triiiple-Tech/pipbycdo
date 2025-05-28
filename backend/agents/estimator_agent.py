# pipbycdo/backend/agents/estimator_agent.py
from backend.app.schemas import AppState, AgentTraceEntry, MeetingLogEntry # Use Pydantic models
from backend.services import gpt_handler
from backend.services import llm_selector
from datetime import datetime, timezone
import json

# If 'log' does not exist in service_logging, define a simple log function here
# This local log function should ideally be replaced by a proper logging setup
def log_local(state_model: AppState, level: str = "info", msg: str = ""):
    print(f"[{level.upper()}] {msg}")
    state_model.agent_trace.append(AgentTraceEntry(
        agent="estimator", 
        decision=msg, 
        level=level if level == "error" else None,
        error=msg if level == "error" else None
    ))
    state_model.meeting_log.append(MeetingLogEntry(
        agent="estimator",
        message=msg
    ))

def handle(state_dict: dict) -> dict: # Expect and return dict
    state = AppState(**state_dict) # Convert dict to Pydantic model

    log_local(state, msg="start estimating")
    try:
        model_info = llm_selector.select_llm("estimator", state.model_dump()) # Pass state as dict if needed by select_llm
        model = model_info.get("model")
        if model is None:
            raise ValueError("Model information is missing for estimator agent.")
        
        result_str = gpt_handler.run_llm(
            f"Estimate the quantities and costs from: {state.content}",
            model=model,
            system_prompt=model_info.get("system_prompt"),
        )
        
        estimate_data = json.loads(result_str)
        state.estimate = estimate_data # Pydantic will validate this against List[EstimateItem]
        log_local(state, msg="estimate complete")

    except json.JSONDecodeError as e:
        error_msg = f"Estimator failed: LLM returned invalid JSON. Error: {e}. LLM Output: {result_str[:200]}..."
        state.error = error_msg
        log_local(state, level="error", msg=error_msg)
    except Exception as e:
        error_msg = f"Estimator failed: {e}"
        state.error = error_msg
        log_local(state, level="error", msg=error_msg)
    
    state.updated_at = datetime.now(timezone.utc)
    return state.model_dump() # Return as dict
