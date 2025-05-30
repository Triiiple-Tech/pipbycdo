# pipbycdo/backend/agents/manager_agent.py
from backend.app.schemas import AppState, AgentTraceEntry, MeetingLogEntry
from backend.agents.base_agent import BaseAgent
from backend.agents.file_reader_agent import handle as file_reader_handle
from backend.agents.trade_mapper_agent import handle as trade_mapper_handle
from backend.agents.scope_agent import handle as scope_handle
from backend.agents.takeoff_agent import handle as takeoff_handle
from backend.agents.estimator_agent import handle as estimator_handle
from backend.agents.exporter_agent import handle as exporter_handle
from backend.services.route_planner import route_planner
from datetime import datetime, timezone
from typing import Optional, Callable, Dict, List, Tuple, Any
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define the agent pipeline structure
# Each entry is a tuple: (agent_name, agent_handler_function, required_input_field_in_state)
AGENT_PIPELINE: List[Tuple[str, Callable[[dict], dict], Optional[str]]] = [
    ("file_reader", file_reader_handle, "files"), # File reader depends on initial files
    ("trade_mapper", trade_mapper_handle, "processed_files_content"), # Depends on file reader output
    ("scope", scope_handle, "trade_mapping"),          # Depends on trade mapper output
    ("takeoff", takeoff_handle, "scope_items"),        # Depends on scope agent output
    ("estimator", estimator_handle, "takeoff_data"),   # Depends on takeoff agent output
    ("exporter", exporter_handle, "estimate")          # Depends on estimator output
]

class ManagerAgent(BaseAgent):
    """
    Manager Agent that orchestrates the entire pipeline of agents.
    Responsible for enhanced routing, coordination, and overall process management.
    Features LLM-assisted intent classification and smart agent sequencing.
    """
    
    def __init__(self):
        super().__init__("manager")
        
        # Define available agents with their handlers and required fields
        self.available_agents = {
            "file_reader": (file_reader_handle, "files"),
            "trade_mapper": (trade_mapper_handle, "processed_files_content"),
            "scope": (scope_handle, "trade_mapping"),
            "takeoff": (takeoff_handle, "scope_items"),
            "estimator": (estimator_handle, "takeoff_data"),
            "exporter": (exporter_handle, "estimate")
        }
    
    def process(self, state: AppState) -> AppState:
        """
        Enhanced processing logic with LLM-assisted routing and smart agent sequencing.
        Uses intent classification to determine optimal agent execution paths.
        """
        self.log_interaction(state, "Starting enhanced pipeline", 
                           "Manager orchestrating pipeline with intelligent routing")
        
        try:
            # Step 1: Plan optimal route using enhanced routing
            # Convert available_agents to match expected type
            agents_for_routing: Dict[str, Tuple[Callable, Optional[str]]] = {
                name: (handler, field) for name, (handler, field) in self.available_agents.items()
            }
            route_plan = route_planner.plan_route(state, agents_for_routing)
            
            # Log routing decision
            self._log_routing_decision(state, route_plan)
            
            # Step 2: Execute planned agent sequence
            current_state_dict = state.model_dump()
            
            for agent_name in route_plan["sequence"]:
                if agent_name not in self.available_agents:
                    self.log_interaction(state, f"Agent unavailable: {agent_name}", 
                                       f"Skipping {agent_name}: not in available agents", level="warning")
                    continue
                
                agent_handle, required_field = self.available_agents[agent_name]
                
                self.log_interaction(state, f"Executing {agent_name}", 
                                   f"Running {agent_name} agent based on route plan")
                
                # Check readiness with enhanced validation
                if not self._check_agent_readiness_enhanced(current_state_dict, agent_name, required_field, route_plan):
                    continue
                
                try:
                    # Execute the agent
                    current_state_dict = agent_handle(current_state_dict)
                    
                    # Update state for continued processing
                    state = AppState(**current_state_dict)
                    
                    if state.error:
                        if not self._handle_agent_error(state, agent_name, route_plan):
                            break
                    else:
                        self.log_interaction(state, f"{agent_name} completed", 
                                           f"{agent_name} agent completed successfully")
                
                except Exception as e:
                    if not self._handle_agent_exception(state, agent_name, e, route_plan):
                        break
            
            # Step 3: Log completion summary
            self._log_completion_summary(state, route_plan)
            
        except Exception as e:
            error_msg = f"Critical error in enhanced routing: {str(e)}"
            self.log_interaction(state, "Routing failed", error_msg, level="error")
            state.error = error_msg
            # Fallback to basic processing if routing fails completely
            return self._fallback_processing(state)
        
        return state
    
    def _determine_agent_sequence(self, state: AppState) -> List[Tuple[str, Callable[[dict], dict], Optional[str]]]:
        """
        Determine which agents to run based on the current state and intent.
        This implements the smart routing logic.
        """
        # For now, return the full pipeline
        # Future: Implement intent detection and smart routing
        # Examples:
        # - If only query (no files), might skip file_reader
        # - If user asks for specific export format, might run only exporter
        # - If state already has estimate, might skip estimation pipeline
        
        sequence = []
        
        # Basic intent detection
        if state.files and len(state.files) > 0:
            # Files present, run full pipeline
            sequence = AGENT_PIPELINE.copy()
        elif state.query:
            query_lower = state.query.lower()
            if "export" in query_lower and state.estimate:
                # Export request with existing estimate
                sequence = [("exporter", exporter_handle, "estimate")]
            elif "estimate" in query_lower:
                # Direct estimation request - might need mock data
                sequence = [("estimator", estimator_handle, "takeoff_data")]
            else:
                # General query - run relevant agents
                sequence = AGENT_PIPELINE.copy()
        else:
            # No clear intent, run full pipeline
            sequence = AGENT_PIPELINE.copy()
        
        self.log_interaction(state, "Agent sequence determined", 
                           f"Will run {len(sequence)} agents: {[s[0] for s in sequence]}")
        
        # Type cast to satisfy type checker
        return sequence  # type: ignore
    
    def _check_agent_readiness(self, state_dict: Dict, agent_name: str, required_field: Optional[str]) -> bool:
        """
        Check if an agent has the required inputs to run.
        """
        if not required_field:
            return True
        
        if required_field not in state_dict:
            return False
        
        value = state_dict[required_field]
        
        # Check if the value is meaningful
        if value is None:
            return False
        if isinstance(value, (list, dict)) and len(value) == 0:
            return False
        if isinstance(value, str) and value.strip() == "":
            return False
        
        return True
    
    def _is_critical_error(self, error_message: str) -> bool:
        """
        Determine if an error is critical enough to stop the pipeline.
        """
        if not error_message:
            return False
        
        critical_keywords = [
            "authentication failed",
            "api key",
            "quota exceeded",
            "service unavailable",
            "critical error"
        ]
        
        error_lower = error_message.lower()
        return any(keyword in error_lower for keyword in critical_keywords)
    
    def _log_routing_decision(self, state: AppState, route_plan: Dict[str, Any]) -> None:
        """Log the routing decision for transparency and debugging."""
        intent = route_plan.get("intent", "unknown")
        confidence = route_plan.get("confidence", 0)
        sequence = route_plan.get("sequence", [])
        skipped = route_plan.get("skipped_agents", [])
        
        decision_msg = (f"Intent: {intent} (confidence: {confidence:.2f}), "
                       f"Sequence: {sequence}")
        
        if skipped:
            skipped_names = [s.get("agent", "unknown") for s in skipped]
            decision_msg += f", Skipped: {skipped_names}"
        
        self.log_interaction(state, "Enhanced routing decision", decision_msg)
        
        # Log reasoning if available
        if route_plan.get("reasoning"):
            self.log_interaction(state, "Routing reasoning", route_plan["reasoning"])
    
    def _check_agent_readiness_enhanced(self, state_dict: Dict, agent_name: str, 
                                       required_field: Optional[str], route_plan: Dict[str, Any]) -> bool:
        """Enhanced readiness check with route plan context."""
        # Basic readiness check
        if not self._check_agent_readiness(state_dict, agent_name, required_field):
            warning_msg = f"Skipping {agent_name}: required input '{required_field}' not available"
            state = AppState(**state_dict)
            self.log_interaction(state, f"Skipping {agent_name}", warning_msg)
            return False
        
        # Additional checks based on route plan context
        state_analysis = route_plan.get("state_analysis", {})
        
        # Check if agent was meant to be skipped but included due to dependencies
        for skipped_info in route_plan.get("skipped_agents", []):
            if skipped_info.get("agent") == agent_name:
                state = AppState(**state_dict)
                self.log_interaction(state, f"Running {agent_name} despite skip candidate", 
                                   f"Agent included due to dependencies: {skipped_info.get('reason', 'unknown')}")
        
        return True
    
    def _handle_agent_error(self, state: AppState, agent_name: str, route_plan: Dict[str, Any]) -> bool:
        """Handle agent errors with route plan context. Returns True to continue, False to stop."""
        error_msg = f"Error from {agent_name}: {state.error}"
        self.log_interaction(state, f"{agent_name} error", error_msg, level="error")
        
        # Check if this is a critical error
        if state.error and self._is_critical_error(state.error):
            self.log_interaction(state, "Pipeline stopped", 
                               "Critical error encountered, stopping pipeline", level="error")
            return False
        
        # Check if we can continue with other agents
        remaining_agents = self._get_remaining_agents(agent_name, route_plan)
        if remaining_agents:
            self.log_interaction(state, "Continuing pipeline", 
                               f"Non-critical error, continuing with {len(remaining_agents)} remaining agents")
            return True
        else:
            self.log_interaction(state, "Pipeline completed with errors", 
                               "No more agents to process")
            return False
    
    def _handle_agent_exception(self, state: AppState, agent_name: str, 
                               exception: Exception, route_plan: Dict[str, Any]) -> bool:
        """Handle agent exceptions. Returns True to continue, False to stop."""
        error_msg = f"Critical error in {agent_name}: {str(exception)}"
        self.log_interaction(state, f"{agent_name} failed", error_msg, level="error")
        state.error = error_msg
        
        # For now, stop on unhandled exceptions
        # Future enhancement: could implement agent-specific recovery strategies
        self.log_interaction(state, "Pipeline stopped", 
                           "Unhandled exception encountered, stopping pipeline", level="error")
        return False
    
    def _log_completion_summary(self, state: AppState, route_plan: Dict[str, Any]) -> None:
        """Log a comprehensive completion summary."""
        executed_agents = route_plan.get("sequence", [])
        skipped_agents = route_plan.get("skipped_agents", [])
        intent = route_plan.get("intent", "unknown")
        
        summary = (f"Pipeline completed. Intent: {intent}, "
                  f"Executed: {len(executed_agents)} agents, "
                  f"Skipped: {len(skipped_agents)} agents")
        
        if state.error:
            summary += f", Final status: ERROR - {state.error}"
        else:
            summary += ", Final status: SUCCESS"
        
        self.log_interaction(state, "Enhanced pipeline completed", summary)
    
    def _get_remaining_agents(self, current_agent: str, route_plan: Dict[str, Any]) -> List[str]:
        """Get list of agents remaining to be executed after the current agent."""
        sequence = route_plan.get("sequence", [])
        try:
            current_index = sequence.index(current_agent)
            return sequence[current_index + 1:]
        except ValueError:
            return []
    
    def _fallback_processing(self, state: AppState) -> AppState:
        """Fallback to basic processing when enhanced routing fails."""
        self.log_interaction(state, "Using fallback processing", 
                           "Enhanced routing failed, using basic agent sequence")
        
        # Use the old determine_agent_sequence method as fallback
        agents_to_run = self._determine_agent_sequence(state)
        current_state_dict = state.model_dump()
        
        for agent_name, agent_handle, required_input_field in agents_to_run:
            if not self._check_agent_readiness(current_state_dict, agent_name, required_input_field):
                continue
            
            try:
                current_state_dict = agent_handle(current_state_dict)
                state = AppState(**current_state_dict)
                
                if state.error and self._is_critical_error(state.error):
                    break
            except Exception as e:
                state.error = f"Fallback processing error in {agent_name}: {str(e)}"
                break
        
        return state

# Create singleton instance
_manager_agent = ManagerAgent()

def handle(state_dict: dict) -> dict:
    """
    Legacy entry point for backward compatibility.
    """
    return _manager_agent.handle(state_dict)
