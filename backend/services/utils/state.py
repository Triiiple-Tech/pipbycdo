from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from backend.app.schemas import AppState, LLMConfig, File, AgentTraceEntry, MeetingLogEntry, EstimateItem
from backend.services.llm_selector import select_llm
import logging

logger = logging.getLogger(__name__)

def create_initial_state(
    query: Optional[str] = None,
    content: Optional[str] = None,
    files: Optional[List[Dict[str, Any]]] = None,
    metadata: Optional[Dict[str, Any]] = None,
    user_id: Optional[str] = None,
    session_id: Optional[str] = None,
    estimate: Optional[List[Dict[str, Any]]] = None,
    agent_name: str = "manager"  # Default agent for LLM selection
) -> Dict[str, Any]:
    """
    Create an initial state dictionary that follows the Universal State Dict structure.
    Automatically configures LLM settings for the specified agent.
    """
    current_time = datetime.now(timezone.utc)
    
    # Set up LLM configuration for the agent
    llm_selection = select_llm(agent_name, {})
    model_name = llm_selection.get("model")
    if not model_name:
        raise ValueError(f"No model available for agent '{agent_name}'")
    
    llm_config = LLMConfig(
        model=model_name,
        api_key=llm_selection["api_key"]
    )
    
    # Default metadata structure
    default_metadata: Dict[str, Any] = {
        "project_name": None,
        "location": None,
        "trade": None,
        "sheet_id": None,
        "source": None,
        "user_id": user_id
    }
    if metadata:
        default_metadata.update(metadata)
    
    # Convert files to File objects if they're provided as dicts
    file_objects: List[File] = []
    if files:
        for file_data in files:
            # Handle both dict and File object types
            try:
                if hasattr(file_data, 'filename'):  # It's already a File object
                    file_objects.append(file_data)  # type: ignore
                else:  # It's a dict
                    file_objects.append(File(**file_data))  # type: ignore
            except Exception as e:
                logger.warning(f"Failed to process file data: {e}")
                continue
    
    # Convert estimate to EstimateItem objects if they're provided as dicts
    estimate_objects: List[EstimateItem] = []
    if estimate:
        for estimate_data in estimate:
            # Handle both dict and EstimateItem object types
            try:
                if hasattr(estimate_data, 'description'):  # It's already an EstimateItem object
                    estimate_objects.append(estimate_data)  # type: ignore
                else:  # It's a dict
                    estimate_objects.append(EstimateItem(**estimate_data))  # type: ignore
            except Exception as e:
                logger.warning(f"Failed to process estimate data: {e}")
                continue
    
    # Create the initial state using AppState model
    initial_state = AppState(
        query=query,
        content=content,
        files=file_objects,
        metadata=default_metadata,
        user_id=user_id,
        session_id=session_id,
        estimate=estimate_objects,
        llm_config=llm_config,
        created_at=current_time,
        updated_at=current_time
    )
    
    # Log the initial state creation
    initial_state.agent_trace.append(AgentTraceEntry(
        agent="system",
        decision="Initial state created",
        model=llm_config.model,
        timestamp=current_time
    ))
    
    initial_state.meeting_log.append(MeetingLogEntry(
        agent="system",
        message=f"Initial state created for agent '{agent_name}' with model '{llm_config.model}'",
        timestamp=current_time
    ))
    
    return initial_state.model_dump()

def update_llm_config(state: Dict[str, Any], agent_name: str) -> Dict[str, Any]:
    """
    Update the LLM configuration in state for a specific agent.
    Now supports multi-key fallback and enhanced logging.
    """
    llm_selection = select_llm(agent_name, state)
    
    if "llm_config" not in state or state["llm_config"] is None:
        state["llm_config"] = {}
    
    state["llm_config"]["model"] = llm_selection["model"]
    state["llm_config"]["api_key"] = llm_selection["api_key"]
    
    # Log the LLM config update with additional context
    timestamp = datetime.now(timezone.utc)
    if "agent_trace" not in state:
        state["agent_trace"] = []
    
    # Create more detailed log message
    log_message = f"LLM config updated to model '{llm_selection['model']}'"
    if "api_key_source" in llm_selection:
        log_message += f" using key from '{llm_selection['api_key_source']}'"
    if llm_selection.get("is_fallback"):
        log_message += f" (fallback from '{llm_selection.get('failed_model')}': {llm_selection.get('failure_reason', 'unknown')})"
    
    trace_entry: Dict[str, Any] = {
        "agent": agent_name,
        "decision": log_message,
        "model": llm_selection["model"],
        "timestamp": timestamp.isoformat(),
        "api_key_source": llm_selection.get("api_key_source"),
        "is_fallback": llm_selection.get("is_fallback", False)
    }
    
    state["agent_trace"].append(trace_entry)  # type: ignore
    state["updated_at"] = timestamp.isoformat()
    
    return state

def add_to_history(state: Dict[str, Any], role: str, content: str) -> Dict[str, Any]:
    """
    Add an entry to the conversation history.
    """
    if "history" not in state:
        state["history"] = []
    
    timestamp = datetime.now(timezone.utc)
    history_entry: Dict[str, Any] = {
        "role": role,
        "content": content,
        "timestamp": timestamp.isoformat()
    }
    
    state["history"].append(history_entry)  # type: ignore
    state["updated_at"] = timestamp.isoformat()
    
    return state

def log_agent_interaction(state: Dict[str, Any], agent_name: str, decision: str, message: str, level: str = "info") -> Dict[str, Any]:
    """
    Log an agent interaction to both agent_trace and meeting_log.
    """
    timestamp = datetime.now(timezone.utc)
    
    # Get current model from llm_config
    current_model = None
    if state.get("llm_config") and state["llm_config"].get("model"):
        current_model = state["llm_config"]["model"]
    
    # Add to agent trace
    if "agent_trace" not in state:
        state["agent_trace"] = []
    
    trace_entry: Dict[str, Any] = {
        "agent": agent_name,
        "decision": decision,
        "model": current_model,
        "timestamp": timestamp.isoformat()
    }
    
    if level == "error":
        trace_entry["level"] = "error"
        trace_entry["error"] = message
    
    state["agent_trace"].append(trace_entry)  # type: ignore
    
    # Add to meeting log
    if "meeting_log" not in state:
        state["meeting_log"] = []
    
    meeting_entry: Dict[str, Any] = {
        "agent": agent_name,
        "message": message,
        "timestamp": timestamp.isoformat()
    }
    
    state["meeting_log"].append(meeting_entry)  # type: ignore
    
    # Update error field if this is an error
    if level == "error":
        state["error"] = message
    
    state["updated_at"] = timestamp.isoformat()
    
    return state
