from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from backend.app.schemas import AppState, AgentTraceEntry, MeetingLogEntry
from backend.services.utils.state import update_llm_config
from backend.services.gpt_handler import run_llm  # type: ignore
import logging

logger = logging.getLogger(__name__)

class BaseAgent(ABC):
    """
    Base class for all agents in the system.
    Provides standardized state handling, LLM configuration, and logging.
    """
    
    def __init__(self, agent_name: str):
        self.agent_name = agent_name
        self.logger = logging.getLogger(f"agent.{agent_name}")
    
    @abstractmethod
    def process(self, state: AppState) -> AppState:
        """
        Process the state and return the updated state.
        This is the main method that each agent must implement.
        """
        pass
    
    def handle(self, state_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Standard entry point for all agents.
        Handles state conversion, LLM configuration, error handling, and logging.
        """
        state: Optional[AppState] = None
        
        try:
            # Convert dict to Pydantic model
            state = AppState(**state_dict)
            
            # Update LLM configuration for this agent
            state_dict = update_llm_config(state_dict, self.agent_name)
            state = AppState(**state_dict)
            
            # Log agent invocation
            self.log_interaction(state, "Agent invoked", f"{self.agent_name} agent started")
            
            # Process the state using the agent-specific logic
            updated_state = self.process(state)
            
            # Update the timestamp
            updated_state.updated_at = datetime.now(timezone.utc)
            
            return updated_state.model_dump()
            
        except Exception as e:
            error_msg = f"Error in {self.agent_name} agent: {str(e)}"
            self.logger.error(error_msg, exc_info=True)
            
            # Try to update state with error info
            try:
                if state is not None:
                    state.error = error_msg
                    state.updated_at = datetime.now(timezone.utc)
                    self.log_interaction(state, "Agent error", error_msg, level="error")
                    return state.model_dump()
                else:
                    # Fallback if state conversion failed
                    state_dict["error"] = error_msg
                    state_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
                    return state_dict
            except Exception as fallback_error:
                self.logger.error(f"Failed to update state with error: {fallback_error}")
                return {"error": error_msg, "agent": self.agent_name}
    
    def log_interaction(self, state: AppState, decision: str, message: str, level: str = "info"):
        """Helper method to log agent interactions."""
        timestamp = datetime.now(timezone.utc)
        
        # Get current model from llm_config
        current_model = state.llm_config.model if state.llm_config else None
        
        # Add to agent trace
        trace_entry = AgentTraceEntry(
            agent=self.agent_name,
            decision=decision,
            model=current_model,
            timestamp=timestamp
        )
        
        if level == "error":
            trace_entry.level = "error"
            trace_entry.error = message
        
        state.agent_trace.append(trace_entry)
        
        # Add to meeting log
        state.meeting_log.append(MeetingLogEntry(
            agent=self.agent_name,
            message=message,
            timestamp=timestamp
        ))
        
        # Update error field if this is an error
        if level == "error":
            state.error = message
        
        state.updated_at = timestamp
        
        # Log to Python logger
        if level == "error":
            self.logger.error(f"{self.agent_name}: {message} - Decision: {decision}")
        else:
            self.logger.info(f"{self.agent_name}: {message} - Decision: {decision}")
    
    def call_llm(self, state: AppState, prompt: str, system_prompt: Optional[str] = None) -> Optional[str]:
        """
        Standardized method to call LLM with proper configuration and error handling.
        """
        if not state.llm_config or not state.llm_config.api_key:
            error_msg = f"No LLM configuration or API key available for {self.agent_name}"
            self.log_interaction(state, "LLM call failed", error_msg, level="error")
            return None
        
        try:
            # Use enhanced gpt_handler with fallback support
            response: str = run_llm(
                prompt=prompt,
                model=state.llm_config.model,
                system_prompt=system_prompt,
                api_key=state.llm_config.api_key,
                agent_name=self.agent_name,  # Enable fallback model selection
                **state.llm_config.params
            )
            
            if response:
                self.log_interaction(state, "LLM call successful", 
                                   f"Successfully called {state.llm_config.model}")
                return response
            else:
                error_msg = "Empty response from LLM"
                self.log_interaction(state, "LLM call failed", error_msg, level="error")
        except Exception as e:
            error_msg = f"Error calling LLM: {str(e)}"
            self.log_interaction(state, "LLM call failed", error_msg, level="error")
            return None
            return None
            self.log_interaction(state, "LLM call failed", error_msg, level="error")
    def validate_required_fields(self, state: AppState, required_fields: list[str]) -> bool:
        """
        Validate that required fields are present in the state.
        """
        missing_fields: list[str] = []
        for field in required_fields:
            if hasattr(state, field):
                value = getattr(state, field)
                if value is None:
                    missing_fields.append(field)
                elif isinstance(value, (list, dict)):
                    # Type-safe check for empty collections
                    if not value:
                        missing_fields.append(field)
            else:
                missing_fields.append(field)
        if missing_fields:
            error_msg = f"Missing required fields: {', '.join(missing_fields)}"
            self.log_interaction(state, "Validation failed", error_msg, level="error")
            return False
        
        return True
        return True
