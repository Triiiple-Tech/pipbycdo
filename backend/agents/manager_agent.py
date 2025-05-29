# pipbycdo/backend/agents/manager_agent.py
from backend.app.schemas import AppState, AgentTraceEntry, MeetingLogEntry # Use Pydantic models
from backend.agents.file_reader_agent import handle as file_reader_handle
from backend.agents.trade_mapper_agent import handle as trade_mapper_handle
from backend.agents.scope_agent import handle as scope_handle
from backend.agents.takeoff_agent import handle as takeoff_handle
from backend.agents.estimator_agent import handle as estimator_handle
from backend.agents.exporter_agent import handle as exporter_handle
from datetime import datetime, timezone
from typing import Optional, Callable, Dict, List # Added Optional, Callable, Dict, List
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define the agent pipeline structure
# Each entry is a tuple: (agent_name, agent_handler_function, required_input_field_in_state)
AGENT_PIPELINE: List[tuple[str, Callable[[dict], dict], Optional[str]]] = [
    ("file_reader", file_reader_handle, "files"), # File reader might depend on initial files
    ("trade_mapper", trade_mapper_handle, "processed_files_content"), # Depends on file reader output (example field)
    ("scope", scope_handle, "trade_mapping"),          # Depends on trade mapper output
    ("takeoff", takeoff_handle, "scope_items"),        # Depends on scope agent output
    ("estimator", estimator_handle, "takeoff_data"),   # Depends on takeoff agent output
    ("exporter", exporter_handle, "estimate")          # Depends on estimator output
]

def log_interaction(state: AppState, decision: str, message: str, level: str = "info", agent_name: str = "manager"):
    """Helper function to log manager agent interactions."""
    timestamp = datetime.now(timezone.utc)
    state.agent_trace.append(AgentTraceEntry(
        agent=agent_name,
        decision=decision,
        timestamp=timestamp,
        level=level if level == "error" else None,
        error=message if level == "error" else None
    ))
    state.meeting_log.append(MeetingLogEntry(
        agent=agent_name,
        message=message,
        timestamp=timestamp
    ))
    if level == "error":
        logger.error(f"Manager Agent: {message} - Decision: {decision}")
    else:
        logger.info(f"Manager Agent: {message} - Decision: {decision}")
    state.updated_at = timestamp


def handle(state_dict: dict) -> dict:
    state = AppState(**state_dict)
    log_interaction(state, "Starting overall process", "Manager Agent invoked.")

    current_state_dict = state.model_dump()

    for agent_name, agent_handle, required_input_field in AGENT_PIPELINE:
        log_interaction(state, f"Preparing to call {agent_name}", f"Delegating to {agent_name} agent.")
        
        # Check if a required input field is present (if specified)
        # This is a simple check; more sophisticated input validation might be needed.
        # For example, file_reader_agent might not have a 'required_input_field' from the initial AppState,
        # but subsequent agents will depend on outputs from previous ones.
        # The `required_input_field` here refers to a field in AppState that this agent *needs* to have been
        # populated by a *previous* agent or the initial request.
        
        # A more robust way to check for readiness:
        # if required_input_field and not getattr(AppState(**current_state_dict), required_input_field, None):
        #     error_msg = f"Cannot run {agent_name}: Required input '{required_input_field}' is missing or empty."
        #     log_interaction(state, f"Skipping {agent_name} due to missing input", error_msg, level="error", agent_name=agent_name)
        #     state.error = state.error + f"; {error_msg}" if state.error else error_msg
        #     # Decide if the pipeline should stop or continue if an agent is skipped.
        #     # For a linear flow, we might want to break.
        #     # For a manager that can run agents conditionally, this might differ.
        #     # For now, let's assume if a required input is missing, we can't proceed with this agent.
        #     continue # Or break, depending on desired pipeline behavior


        try:
            current_state_dict = agent_handle(current_state_dict)
            # Update the main state object for logging purposes after each agent call
            # This ensures that logs made by the manager reflect the state *after* an agent has run.
            state = AppState(**current_state_dict) 

            if state.error: # If an agent set an error in the state
                log_interaction(state, f"{agent_name} reported an error", f"Error from {agent_name}: {state.error}", level="error")
                # Decide if the pipeline should stop on first error.
                # For now, we'll let it continue to try other agents if possible,
                # but the error will be logged and persisted.
                # If a critical error occurs that prevents further processing, the agent itself should raise an exception
                # or the manager should explicitly break here.
                # break # Uncomment to stop pipeline on first agent error
            else:
                log_interaction(state, f"{agent_name} completed successfully", f"{agent_name} agent finished processing.")
        
        except Exception as e:
            error_msg = f"Critical error during {agent_name} execution: {str(e)}"
            log_interaction(state, f"Critical error in {agent_name}", error_msg, level="error", agent_name=agent_name)
            state.error = state.error + f"; {error_msg}" if state.error else error_msg
            # current_state_dict['error'] = state.error # Ensure dict also has it
            # break # Stop pipeline on critical unhandled exception from an agent

    log_interaction(state, "Overall process finished", "Manager Agent completed orchestration.")
    return state.model_dump()
