# pipbycdo/backend/agents/manager_agent.py
from backend.app.schemas import AppState
from backend.agents.base_agent import BaseAgent
from backend.agents.file_reader_agent import handle as file_reader_handle
from backend.agents.trade_mapper_agent import handle as trade_mapper_handle  # type: ignore
from backend.agents.scope_agent import handle as scope_handle
from backend.agents.takeoff_agent import handle as takeoff_handle  # type: ignore
from backend.agents.estimator_agent import handle as estimator_handle
from backend.agents.exporter_agent import handle as exporter_handle
from backend.agents.smartsheet_agent import handle as smartsheet_handle
from backend.services.route_planner import RoutePlanner
from typing import Optional, Callable, Dict, List, Tuple, Any, cast
import logging

# Initialize route planner
route_planner = RoutePlanner()

# Type alias for agent handler functions
AgentHandler = Callable[[Dict[str, Any]], Dict[str, Any]]

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define the agent pipeline structure
# Each entry is a tuple: (agent_name, agent_handler_function, required_input_field_in_state)
AGENT_PIPELINE: List[Tuple[str, Callable[[Dict[str, Any]], Dict[str, Any]], Optional[str]]] = [
    ("file_reader", file_reader_handle, "files"), # File reader depends on initial files
    ("trade_mapper", trade_mapper_handle, "processed_files_content"), # Depends on file reader output
    ("scope", scope_handle, "trade_mapping"),          # Depends on trade mapper output
    ("takeoff", takeoff_handle, "scope_items"),        # Depends on scope agent output
    ("estimator", estimator_handle, "takeoff_data"),   # Depends on takeoff agent output
    ("exporter", exporter_handle, "estimate")          # Depends on estimator output
]

class ManagerAgent(BaseAgent):
    """
    Autonomous Agentic Manager Protocol Implementation
    
    Self-governing agent workflow that handles:
    - Universal intake (files, Smartsheet URLs, text instructions)
    - Intent classification and route planning
    - Stepwise user presentation with minimal oversight
    - Autonomous task delegation and error handling
    - Smartsheet integration and export management
    """
    
    def __init__(self):
        """Initialize the Autonomous Manager Agent with protocol configuration."""
        super().__init__("manager")
        # Define available agents with their handlers and required fields
        self.available_agents: Dict[str, Tuple[AgentHandler, Optional[str]]] = {
            "file_reader": (cast(AgentHandler, file_reader_handle), "files"),
            "trade_mapper": (cast(AgentHandler, trade_mapper_handle), "processed_files_content"),
            "scope": (cast(AgentHandler, scope_handle), "trade_mapping"),
            "takeoff": (cast(AgentHandler, takeoff_handle), "scope_items"),
            "estimator": (cast(AgentHandler, estimator_handle), "takeoff_data"),
            "exporter": (cast(AgentHandler, exporter_handle), "estimate"),
            "smartsheet": (cast(AgentHandler, smartsheet_handle), None)
        }
        
        # Protocol-specific state tracking
        self.user_confirmations_needed = []
        self.execution_steps = []
        self.autopilot_mode = True
    
    def process(self, state: AppState) -> AppState:
        """
        Autonomous Agentic Manager Protocol Implementation
        
        Phase 1: Universal Intake - Accept files, Smartsheet URLs, text instructions
        Phase 2: Intent Classification and Route Planning
        Phase 3: Self-Governing Task Delegation with stepwise presentation
        Phase 4: Autonomous Output Management
        """
        # Phase 1: Universal Intake and Initial Response
        intake_result = self._universal_intake(state)
        if intake_result.get("needs_user_selection"):
            # Store state and return with user prompt
            state.status = "awaiting_user_selection"
            state.pending_user_action = intake_result.get("user_prompt")
            return state
            
        # Phase 2: Intent Classification and Route Planning
        self.log_interaction(state, "🎯 Starting Autonomous Agentic Manager Protocol", 
                           "Beginning intelligent intent classification and route planning")
        
        try:
            # Plan optimal route using enhanced routing (sync wrapper for async call)
            route_plan = self._plan_route_sync(state)
            
            # Log routing decision
            self._log_routing_decision(state, route_plan)
            
            # Phase 3: Self-Governing Task Delegation
            state = self._execute_autonomous_workflow(state, route_plan)
            
            # Phase 4: Autonomous Output Management
            if not state.error and state.status not in ["awaiting_user_input", "error"]:
                state = self._autonomous_output_management(state)
            
        except Exception as e:
            error_msg = f"Critical error in Autonomous Agentic Manager: {str(e)}"
            self.log_interaction(state, "🚨 Protocol Error", error_msg, level="error")
            state.error = error_msg
            state.status = "error"
        
        return state
    
    def _determine_agent_sequence(self, state: AppState) -> List[Tuple[str, Callable[[Dict[str, Any]], Dict[str, Any]], Optional[str]]]:
        """
        Determine which agents to run based on the current state and intent.
        This implements the smart routing logic.
        """
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
    
    def _check_agent_readiness(self, state_dict: Dict[str, Any], required_field: Optional[str]) -> bool:
        """
        Check if an agent has the required inputs to run.
        """
        if required_field is None:
            return True
        
        if required_field not in state_dict:
            return False
        
        value = state_dict[required_field]
        if value is None:
            return False
        if isinstance(value, (list, dict)) and len(value) == 0:  # type: ignore
            return False
        if isinstance(value, str) and value.strip() == "":
            return False
        
        return True
    
    def _check_agent_readiness_enhanced(self, state_dict: Dict[str, Any], agent_name: str, 
                                       required_field: Optional[str], route_plan: Dict[str, Any]) -> bool:
        """Enhanced agent readiness check with route plan context."""
        # Enhanced debugging for SmartsheetAgent specifically
        if agent_name == "smartsheet":
            state = AppState(**state_dict)
            self.log_interaction(state, "DEBUG: SmartsheetAgent readiness check", 
                               f"Checking readiness for SmartsheetAgent. Required field: {required_field}")
            self.log_interaction(state, "DEBUG: SmartsheetAgent current state", 
                               f"State contains: {list(state_dict.keys())}")
            if hasattr(state, 'query') and state.query:
                self.log_interaction(state, "DEBUG: SmartsheetAgent query check", 
                                   f"Query present: '{state.query[:100]}...'")
        
        # Basic readiness check
        if not self._check_agent_readiness(state_dict, required_field):
            warning_msg = f"Agent {agent_name} not ready: required field '{required_field}' missing or empty"
            state = AppState(**state_dict)
            self.log_interaction(state, f"Skipping {agent_name}", warning_msg)
            
            # Enhanced debugging for SmartsheetAgent readiness failure
            if agent_name == "smartsheet":
                field_value = state_dict.get(required_field) if required_field else "N/A (no required field)"
                self.log_interaction(state, "DEBUG: SmartsheetAgent readiness details", 
                                   f"Required field '{required_field}' check failed. Field value: {field_value}")
            return False
        
        # Additional checks based on route plan context
        # Check if agent was meant to be skipped but included due to dependencies
        skipped_agents = route_plan.get("skipped_agents", [])
        for skipped_info in skipped_agents:
            if skipped_info.get("agent") == agent_name:
                state = AppState(**state_dict)
                self.log_interaction(state, f"Running {agent_name} despite skip candidate", 
                                   f"Agent included due to dependencies: {skipped_info.get('reason', 'unknown')}")
        
        # Special case for SmartsheetAgent - it should be ready if there's a query (required_field is None)
        if agent_name == "smartsheet":
            state = AppState(**state_dict)
            self.log_interaction(state, "DEBUG: SmartsheetAgent final readiness", 
                               f"SmartsheetAgent passed readiness check. Required field was: {required_field}")
        
        return True
    
    def _is_critical_error(self, error_message: str) -> bool:
        """
        Determine if an error is critical and should stop the pipeline.
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
    
    def _handle_agent_error(self, state: AppState, agent_name: str, route_plan: Dict[str, Any]) -> bool:
        """Handle agent errors. Returns True to continue, False to stop."""
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
        
        # Enhanced debugging for SmartsheetAgent
        if "smartsheet" in sequence:
            self.log_interaction(state, "DEBUG: SmartsheetAgent in sequence", 
                               f"SmartsheetAgent is included in execution sequence at position {sequence.index('smartsheet')}")
        else:
            self.log_interaction(state, "DEBUG: SmartsheetAgent NOT in sequence", 
                               f"SmartsheetAgent not found in sequence. Available agents: {list(self.available_agents.keys())}")
        
        # Log detailed route plan structure
        self.log_interaction(state, "DEBUG: Full route plan", 
                           f"Complete route plan: {route_plan}")
        
        # Log reasoning if available
        if route_plan.get("reasoning"):
            self.log_interaction(state, "Routing reasoning", route_plan["reasoning"])
    
    def _fallback_processing(self, state: AppState) -> AppState:
        """Fallback to basic processing when enhanced routing fails."""
        self.log_interaction(state, "Using fallback processing", 
                           "Enhanced routing failed, using basic agent sequence")
        
        # Use the old determine_agent_sequence method as fallback
        agents_to_run = self._determine_agent_sequence(state)
        current_state_dict = state.model_dump()
        
        for agent_name, agent_handle, required_input_field in agents_to_run:
            if not self._check_agent_readiness(current_state_dict, required_input_field):
                continue
            
            try:
                # Execute the agent
                current_state_dict = agent_handle(current_state_dict)
                
                # Update state for continued processing
                state = AppState(**current_state_dict)
                
                if state.error and self._is_critical_error(state.error):
                    break
            except Exception as e:
                state.error = f"Fallback processing error in {agent_name}: {str(e)}"
                break
        
        return state

    def _universal_intake(self, state: AppState) -> Dict[str, Any]:
        """
        Phase 1: Universal Intake
        Accepts files, Smartsheet URLs, and text instructions
        Returns initial acknowledgment and any user prompts needed
        """
        intake_result = {"needs_user_selection": False}
        
        # Instant acknowledgment
        if state.files and len(state.files) > 0:
            self.log_interaction(state, "📁 Files received. Beginning analysis.", 
                               f"Processing {len(state.files)} uploaded files")
        
        if state.query and "smartsheet.com" in state.query.lower():
            self.log_interaction(state, "🔗 Smartsheet URL detected. Extracting sheet data.", 
                               "Beginning Smartsheet integration analysis")
            
            # TODO: Extract and list all available sheets/files
            # For now, proceed with available data
            
        if state.query:
            self.log_interaction(state, "💬 Text instructions received.", 
                               f"Processing query: {state.query[:100]}...")
        
        return intake_result
    
    def _execute_autonomous_workflow(self, state: AppState, route_plan: Dict[str, Any]) -> AppState:
        """
        Phase 3: Self-Governing Task Delegation
        Executes agent pipeline with stepwise user presentation
        """
        current_state_dict = state.model_dump()
        planned_sequence = route_plan.get("sequence", [])
        
        self.log_interaction(state, "🤖 Starting autonomous workflow", 
                           f"Executing {len(planned_sequence)} agents: {planned_sequence}")
        
        for i, agent_name in enumerate(planned_sequence):
            self.log_interaction(state, f"⚡ Step {i+1}/{len(planned_sequence)}: {agent_name}", 
                               f"Processing with {agent_name.replace('_', ' ').title()}Agent")
            
            if agent_name not in self.available_agents:
                self.log_interaction(state, f"⚠️ Agent unavailable: {agent_name}", 
                                   f"Skipping {agent_name}: not in available agents", level="warning")
                continue
            
            agent_handle, required_field = self.available_agents[agent_name]
            
            # Check readiness with enhanced validation
            if not self._check_agent_readiness_enhanced(current_state_dict, agent_name, required_field, route_plan):
                self.log_interaction(state, f"⏭️ Skipping {agent_name}", 
                                   f"Missing required input: {required_field}")
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
                    # Stepwise presentation - show user what was accomplished
                    self._present_agent_completion(state, agent_name, i+1, len(planned_sequence))
            
            except Exception as e:
                if not self._handle_agent_exception(state, agent_name, e, route_plan):
                    break
        
        return state
    
    def _present_agent_completion(self, state: AppState, agent_name: str, step_num: int, total_steps: int):
        """
        Stepwise User Presentation
        Present output to user after each agent runs
        """
        emoji_map = {
            "file_reader": "📖",
            "trade_mapper": "🏗️", 
            "scope": "📋",
            "takeoff": "📏",
            "estimator": "💰",
            "exporter": "📄",
            "smartsheet": "📊"
        }
        
        emoji = emoji_map.get(agent_name, "✅")
        agent_display = agent_name.replace('_', ' ').title() + "Agent"
        
        # Broadcast agent completion to WebSocket clients for real-time UI updates
        self._broadcast_agent_progress(state, agent_name, "complete", step_num, total_steps)
        
        # Agent-specific completion messages following protocol
        if agent_name == "file_reader" and state.processed_files_content:
            file_count = len(state.processed_files_content)
            result_summary = f"Text extracted from all {file_count} files."
            self.log_interaction(state, f"{emoji} FileReader: {result_summary}", 
                               f"Successfully processed {file_count} documents")
        
        elif agent_name == "trade_mapper" and state.trade_mapping:
            trade_count = len(state.trade_mapping)
            trades = [tm.get('trade', 'Unknown') for tm in state.trade_mapping[:4]]
            trades_display = ', '.join(trades)
            if trade_count > 4:
                trades_display += f" and {trade_count - 4} more"
            result_summary = f"Identified {trade_count} trades: [{trades_display}]. Proceed?"
            self.log_interaction(state, f"{emoji} TradeMapper: {result_summary}", 
                               f"Trade mapping completed with {trade_count} trades identified")
        
        elif agent_name == "scope" and state.scope_items:
            scope_count = len(state.scope_items)
            primary_trade = state.scope_items[0].get('trade', 'Unknown') if state.scope_items else 'Various'
            result_summary = f"Extracted {scope_count} unique scope items under '{primary_trade}'. View details?"
            self.log_interaction(state, f"{emoji} ScopeAgent: {result_summary}", 
                               f"Scope analysis completed with {scope_count} items")
        
        elif agent_name == "takeoff" and state.takeoff_data:
            takeoff_count = len(state.takeoff_data)
            result_summary = f"Quantities calculated. See summary table?"
            self.log_interaction(state, f"{emoji} TakeoffAgent: {result_summary}", 
                               f"Takeoff completed with {takeoff_count} line items")
        
        elif agent_name == "estimator" and state.estimate:
            estimate_count = len(state.estimate)
            total_cost = sum(item.total for item in state.estimate)
            result_summary = f"Cost estimate generated (${total_cost:,.2f}). Download or export?"
            self.log_interaction(state, f"{emoji} EstimatorAgent: {result_summary}", 
                               f"Estimate completed with {estimate_count} line items")
        
        else:
            result_summary = "Completed successfully"
            self.log_interaction(state, f"{emoji} {agent_display}: {result_summary}", 
                               f"{agent_display} finished processing step {step_num}/{total_steps}")
    
    def _broadcast_agent_progress(self, state: AppState, agent_name: str, status: str, step_num: int, total_steps: int):
        """
        Broadcast agent progress to WebSocket clients for real-time UI updates
        """
        try:
            # Import here to avoid circular imports
            import asyncio
            from backend.routes.chat import broadcast_message
            
            # Get result summary based on agent output
            result_summary = self._get_agent_result_summary(state, agent_name)
            
            # Create progress message
            progress_message: Dict[str, Any] = {
                "type": f"agent_processing_{status}",
                "session_id": state.session_id,
                "data": {
                    "agent_name": agent_name,
                    "status": status,
                    "step_number": step_num,
                    "total_steps": total_steps,
                    "result_summary": result_summary,
                    "timestamp": self._get_current_timestamp()
                }
            }
            
            # Broadcast the message asynchronously
            if state.session_id:
                try:
                    # Try to run in existing event loop or create new one
                    loop = asyncio.get_event_loop()
                    if loop.is_running():
                        # Schedule as task if loop is already running
                        asyncio.create_task(broadcast_message(state.session_id, progress_message))
                    else:
                        # Run directly if no loop is running
                        loop.run_until_complete(broadcast_message(state.session_id, progress_message))
                except RuntimeError:
                    # If no event loop exists, create one
                    asyncio.run(broadcast_message(state.session_id, progress_message))
                    
        except Exception as e:
            # Don't let WebSocket errors break the agent workflow
            logger.warning(f"Failed to broadcast agent progress: {str(e)}")
    
    def _get_agent_result_summary(self, state: AppState, agent_name: str) -> str:
        """Get a concise result summary for the agent"""
        if agent_name == "file_reader" and state.processed_files_content:
            return f"Processed {len(state.processed_files_content)} files"
        elif agent_name == "trade_mapper" and state.trade_mapping:
            return f"Identified {len(state.trade_mapping)} trades"
        elif agent_name == "scope" and state.scope_items:
            return f"Extracted {len(state.scope_items)} scope items"
        elif agent_name == "takeoff" and state.takeoff_data:
            return f"Calculated {len(state.takeoff_data)} quantities"
        elif agent_name == "estimator" and state.estimate:
            total_cost = sum(item.total for item in state.estimate)
            return f"Generated estimate: ${total_cost:,.2f}"
        elif agent_name == "exporter":
            return "Export ready"
        elif agent_name == "smartsheet":
            return "Smartsheet sync complete"
        else:
            return "Completed successfully"
    
    def _get_current_timestamp(self) -> str:
        """Get current timestamp in ISO format"""
        from datetime import datetime
        return datetime.now().isoformat()
    
    def _autonomous_output_management(self, state: AppState) -> AppState:
        """
        Phase 4: Autonomous Output Management
        Handle final output options and user export preferences
        """
        try:
            self.log_interaction(state, "📤 Autonomous Output Management", 
                               "Preparing final output options and export capabilities")
            
            # Check if we have any outputs to manage
            has_outputs = bool(
                state.estimate or 
                state.takeoff_data or 
                state.scope_items or 
                state.trade_mapping or 
                state.processed_files_content
            )
            
            if not has_outputs:
                self.log_interaction(state, "⚠️ No outputs to manage", 
                                   "No processable outputs found for export", level="warning")
                return state
            
            # Present export options to user
            export_options: List[str] = []
            if state.estimate:
                total_cost = sum(item.total for item in state.estimate)
                export_options.append(f"💰 Cost Estimate (${total_cost:,.2f}) - Available for download/export")
            
            if state.takeoff_data:
                export_options.append(f"📏 Takeoff Data ({len(state.takeoff_data)} items) - Ready for export")
            
            if state.scope_items:
                export_options.append(f"📋 Scope Analysis ({len(state.scope_items)} items) - Available for export")
            
            if state.trade_mapping:
                export_options.append(f"🏗️ Trade Mapping ({len(state.trade_mapping)} trades) - Ready for export")
            
            # Log available export options
            export_summary = "\n".join([f"  • {option}" for option in export_options])
            self.log_interaction(state, "📋 Available Export Options", export_summary)
            
            # Check for Smartsheet integration opportunity
            if state.query and "smartsheet.com" in state.query.lower():
                self.log_interaction(state, "📊 Smartsheet Integration Available", 
                                   "Results can be pushed back to your Smartsheet. Ready for sync.")
                
                # Note: SmartsheetAgent will handle the actual sync when user requests it
            
            # Offer download/export options 
            self.log_interaction(state, "💾 Export Options Ready", 
                               "Download as XLSX, PDF, JSON, or push to Smartsheet. Choose your preferred format.")
            
            # Set completion status
            state.status = "output_ready"
            self.log_interaction(state, "✅ Protocol Complete", 
                               "Autonomous Agentic Manager Protocol completed successfully. Ready for user action.")
            
        except Exception as e:
            error_msg = f"Error in autonomous output management: {str(e)}"
            self.log_interaction(state, "🚨 Output Management Error", error_msg, level="error")
            state.error = error_msg
        
        return state

    def _plan_route_sync(self, state: AppState) -> Dict[str, Any]:
        """
        Synchronous wrapper for the async route_planner.plan_route method.
        Uses asyncio.run to execute the async function in a sync context.
        """
        import asyncio
        
        try:
            # Run the async route planning in a new event loop
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                route_plan = loop.run_until_complete(
                    route_planner.plan_route(state, self.available_agents)
                )
                return route_plan
            finally:
                loop.close()
                
        except Exception as e:
            # Fallback to a basic route plan if async routing fails
            self.log_interaction(state, "⚠️ Route Planning", 
                               f"Async routing failed: {str(e)}, using fallback", level="warning")
            
            # Smart fallback route plan that handles Smartsheet URLs
            if state.query and "smartsheet.com" in state.query.lower():
                self.log_interaction(state, "🔗 Smartsheet Fallback", 
                                   "Detected Smartsheet URL, using Smartsheet-first route")
                return {
                    "sequence": ["smartsheet"],
                    "skipped_agents": [],
                    "optimization_applied": False,
                    "intent": "smartsheet_integration",
                    "confidence": 0.9
                }
            
            # Default fallback route plan
            return {
                "sequence": ["file_reader", "trade_mapper", "scope", "takeoff", "estimator"],
                "skipped_agents": [],
                "optimization_applied": False,
                "intent": "full_estimation",
                "confidence": 0.5
            }


# Create instance for backward compatibility
manager_agent = ManagerAgent()

# Legacy handle function for existing code
def handle(state_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Legacy handle function that uses the new ManagerAgent class."""
    return manager_agent.handle(state_dict)
