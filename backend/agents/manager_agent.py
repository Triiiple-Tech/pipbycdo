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
from typing import Optional, Callable, Dict, List, Tuple, Any, cast, Union, Awaitable
import logging
import asyncio
import json
from datetime import datetime, timezone

# Initialize route planner
route_planner = RoutePlanner()

# Type alias for agent handler functions (both sync and async)
AgentHandler = Union[
    Callable[[Dict[str, Any]], Dict[str, Any]],
    Callable[[Dict[str, Any]], Awaitable[Dict[str, Any]]]
]

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Define the agent pipeline structure with proper typing
# Each entry is a tuple: (agent_name, agent_handler_function, required_input_field_in_state)
AGENT_PIPELINE: List[Tuple[str, AgentHandler, Optional[str]]] = [
    ("file_reader", file_reader_handle, "files"), # File reader depends on initial files
    ("trade_mapper", trade_mapper_handle, "processed_files_content"), # Depends on file reader output
    ("scope", scope_handle, "trade_mapping"),          # Depends on trade mapper output
    ("takeoff", takeoff_handle, "scope_items"),        # Depends on takeoff agent output
    ("estimator", estimator_handle, "takeoff_data"),   # Depends on estimator output
    ("exporter", exporter_handle, "estimate")          # Depends on estimator output
]

class ManagerAgent(BaseAgent):
    """
    🎯 Autonomous Agentic Manager Protocol - Central Orchestrator with Enhanced Real-Time Streaming
    
    PRIMARY RESPONSIBILITIES:
    1. 🧠 INTELLIGENT ROUTING: Analyze user intent and route to optimal agent sequence
    2. 🤖 BRAIN ALLOCATION: Decide which LLM model each agent needs (efficiency + cost optimization)
    3. 📊 REAL-TIME ORCHESTRATION: Manage agent handoffs and user communication
    4. 🔄 ERROR RECOVERY: Handle failures gracefully and continue workflow when possible
    5. 🎯 USER EXPERIENCE: Present stepwise progress and manage user interactions
    6. 📡 ENHANCED STREAMING: Real-time decision broadcasting and granular progress tracking
    
    DECISION FRAMEWORK:
    - Simple tasks (file listing, basic responses) → 4.1-mini (LOW COST)
    - Complex reasoning (trade analysis, cost modeling) → o3 (HIGH INTELLIGENCE) 
    - Large documents (1M+ tokens) → 4.1 (HIGH CONTEXT)
    - Visual content (plans, drawings) → 4o (MULTIMODAL)
    
    ENHANCED STREAMING FEATURES:
    - Manager decision broadcasting (thinking process visible)
    - Granular agent progress with substeps
    - Interactive user decision points
    - Visual workflow representation
    - Real-time brain allocation decisions
    """
    
    def __init__(self):
        """Initialize the Autonomous Manager Agent with enhanced streaming capabilities."""
        super().__init__("manager")
        
        # Enhanced streaming state with proper typing
        self.current_workflow_stage: str = "idle"
        self.active_agents: Dict[str, Dict[str, Any]] = {}
        self.user_decision_pending: bool = False
        self.workflow_visualization: Dict[str, Any] = {
            "stages": [],
            "dependencies": {},
            "completion_percentage": 0.0,
            "parallel_tracks": []
        }
        
        # Define available agents with their capabilities and requirements
        self.available_agents: Dict[str, Dict[str, Any]] = {
            "file_reader": {
                "handler": cast(AgentHandler, file_reader_handle),
                "required_field": "files",
                "needs_llm": False,  # Pure text extraction
                "complexity": "simple",
                "description": "Extracts text and structure from documents"
            },
            "trade_mapper": {
                "handler": cast(AgentHandler, trade_mapper_handle),
                "required_field": "processed_files_content",
                "needs_llm": True,  # Requires reasoning about construction trades
                "complexity": "high",  # Needs deep construction knowledge
                "description": "Identifies and maps construction trades from document content"
            },
            "scope": {
                "handler": cast(AgentHandler, scope_handle),
                "required_field": "trade_mapping",
                "needs_llm": True,  # Requires analysis and interpretation
                "complexity": "high",  # Complex scope analysis
                "description": "Analyzes project scope and requirements"
            },
            "takeoff": {
                "handler": cast(AgentHandler, takeoff_handle),
                "required_field": "scope_items",
                "needs_llm": True,  # Requires calculation reasoning
                "complexity": "medium",  # Mathematical calculations with context
                "description": "Calculates quantities and measurements"
            },
            "estimator": {
                "handler": cast(AgentHandler, estimator_handle),
                "required_field": "takeoff_data",
                "needs_llm": True,  # Requires cost reasoning and market knowledge
                "complexity": "high",  # Complex pricing and market analysis
                "description": "Generates cost estimates and pricing analysis"
            },
            "exporter": {
                "handler": cast(AgentHandler, exporter_handle),
                "required_field": "estimate",
                "needs_llm": False,  # Data formatting and export
                "complexity": "simple",
                "description": "Formats and exports final deliverables"
            },
            "smartsheet": {
                "handler": cast(AgentHandler, smartsheet_handle),
                "required_field": None,
                "needs_llm": True,  # Requires interpretation of user requests
                "complexity": "medium",  # API integration with reasoning
                "description": "Handles Smartsheet integration and file management"
            }
        }
        
        # Brain allocation strategy (LLM model selection)
        self.model_allocation = {
            "simple": "gpt-4o-mini",      # Fast, cheap for simple tasks
            "medium": "gpt-4o",           # Balanced for moderate complexity
            "high": "gpt-4o",             # Best model for complex reasoning
            "ultra": "o1-preview"         # Reserved for most complex tasks
        }
        
        # Protocol state tracking
        self.current_workflow = []
        self.completed_agents = []
        self.pending_handoffs = []
        self.user_context = {}
        self.workflow_status = "idle"
    
    async def process(self, state: AppState) -> AppState:
        """
        Enhanced Autonomous Agentic Manager Protocol with Real-Time Streaming
        
        Phase 1: Universal Intake with streaming acknowledgment
        Phase 2: Intent Classification with decision broadcasting
        Phase 3: Self-Governing Task Delegation with granular progress
        Phase 4: Autonomous Output Management with workflow visualization
        """
        # Initialize enhanced workflow tracking
        self.workflow_visualization["stages"] = []
        self.workflow_visualization["completion_percentage"] = 0.0
        await self._broadcast_workflow_state_change(state, "workflow_started", {
            "total_phases": 4,
            "current_phase": 1,
            "phase_name": "Universal Intake"
        })
        
        # Phase 1: Universal Intake with streaming
        await self._broadcast_manager_thinking(state, "analyzing_input", {
            "analysis": "Examining uploaded files, URLs, and instructions",
            "input_types": self._detect_input_types(state)
        })
        
        intake_result = await self._universal_intake(state)
        if intake_result.get("needs_user_selection"):
            await self._broadcast_user_decision_needed(state, intake_result)
            state.status = "awaiting_user_selection"
            state.pending_user_action = intake_result.get("user_prompt")
            return state
            
        # Phase 2: Intent Classification and Route Planning with decision broadcasting
        await self._broadcast_workflow_state_change(state, "phase_transition", {
            "from_phase": 1,
            "to_phase": 2,
            "phase_name": "Intent Classification & Route Planning"
        })
        
        self.log_interaction(state, "🎯 Starting Enhanced Autonomous Protocol", 
                           "Beginning intelligent intent classification and route planning")
        
        try:
            # Stream manager's thinking process
            await self._broadcast_manager_thinking(state, "route_planning", {
                "analysis": "Analyzing user intent and optimal agent sequence",
                "factors": ["file_types", "user_query", "existing_data", "complexity"]
            })
            
            # Plan optimal route using enhanced routing
            route_plan = await self._plan_route_enhanced(state)
            
            # Broadcast routing decision with full reasoning
            await self._broadcast_routing_decision_enhanced(state, route_plan)
            
            # Phase 3: Self-Governing Task Delegation with granular streaming
            await self._broadcast_workflow_state_change(state, "phase_transition", {
                "from_phase": 2,
                "to_phase": 3,
                "phase_name": "Autonomous Task Delegation"
            })
            
            state = await self._execute_autonomous_workflow_enhanced(state, route_plan)
            
            # Phase 4: Autonomous Output Management with completion tracking
            if not state.error and state.status not in ["awaiting_user_input", "error"]:
                await self._broadcast_workflow_state_change(state, "phase_transition", {
                    "from_phase": 3,
                    "to_phase": 4,
                    "phase_name": "Output Management & Finalization"
                })
                
                state = await self._autonomous_output_management_enhanced(state)
            
            # Final workflow completion
            await self._broadcast_workflow_state_change(state, "workflow_completed", {
                "success": not bool(state.error),
                "final_state": state.status,
                "completion_percentage": 100.0
            })
            
        except Exception as e:
            error_msg = f"Critical error in Enhanced Autonomous Protocol: {str(e)}"
            self.log_interaction(state, "🚨 Protocol Error", error_msg, level="error")
            await self._broadcast_error_recovery(state, error_msg, "critical")
            state.error = error_msg
            state.status = "error"
        
        return state
    
    def _determine_agent_sequence(self, state: AppState) -> List[Tuple[str, Any, Optional[str]]]:
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
        
        return sequence
    
    def _check_agent_readiness(self, state_dict: Dict[str, Any], required_field: Optional[str]) -> bool:
        """
        Check if an agent has the required inputs to run.
        """
        if required_field is None:
            return True
        
        # 🔧 SPECIAL CASE: Trade mapper can work with complex text queries OR processed files
        if required_field == "processed_files_content":
            # Check if we have processed files
            has_processed_files = (
                "processed_files_content" in state_dict and 
                state_dict["processed_files_content"] is not None and
                len(state_dict["processed_files_content"]) > 0
            )
            
            # Check if we have a complex text query (200+ chars as construction request)
            has_complex_query = (
                "query" in state_dict and 
                state_dict["query"] is not None and
                len(str(state_dict["query"])) > 200
            )
            
            # Trade mapper can work with either
            return has_processed_files or has_complex_query
        
        # Standard field check for other agents
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
        
        # Broadcast routing decision in real-time (non-blocking)
        try:
            asyncio.create_task(self._broadcast_routing_decision_enhanced(state, route_plan))
        except RuntimeError:
            # If no event loop is running, skip broadcasting
            pass
        
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
    
    async def _fallback_processing(self, state: AppState) -> AppState:
        """Fallback to basic processing when enhanced routing fails."""
        self.log_interaction(state, "Using fallback processing", 
                           "Enhanced routing failed, using basic agent sequence")
        
        # Use the old determine_agent_sequence method as fallback
        agents_to_run = self._determine_agent_sequence(state)
        current_state_dict = state.model_dump()
        
        for agent_tuple in agents_to_run:
            # Handle both old tuple format and new dict format
            if isinstance(agent_tuple, tuple):
                agent_name, agent_handle, required_input_field = agent_tuple
            else:
                # If it's a dict (new format)
                agent_name = agent_tuple.get("name")
                agent_handle = agent_tuple.get("handler")
                required_input_field = agent_tuple.get("required_field")
            
            if not self._check_agent_readiness(current_state_dict, required_input_field):
                continue
            
            try:
                # Execute the agent (handle both async and sync)
                result = agent_handle(current_state_dict)
                if hasattr(result, '__await__'):
                    current_state_dict = await result
                else:
                    current_state_dict = result
                
                # Update state for continued processing
                state = AppState(**current_state_dict)
                
                if state.error and self._is_critical_error(state.error):
                    break
            except Exception as e:
                state.error = f"Fallback processing error in {agent_name}: {str(e)}"
                break
        
        return state

    async def _universal_intake(self, state: AppState) -> Dict[str, Any]:
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
    
    async def _execute_autonomous_workflow_enhanced(self, state: AppState, route_plan: Dict[str, Any]) -> AppState:
        """
        Enhanced autonomous workflow with real-time streaming
        """
        # Start enhanced workflow execution
        await self._broadcast_manager_thinking(state, "workflow_execution", {
            "analysis": "Beginning autonomous agent orchestration",
            "agent_count": len(route_plan.get("sequence", [])),
            "execution_strategy": "intelligent_sequential_with_parallel_optimization"
        })
        
        workflow_complete = False
        iteration = 0
        max_iterations = 10
        
        while not workflow_complete and iteration < max_iterations:
            iteration += 1
            
            # Enhanced situation analysis with streaming
            await self._broadcast_manager_thinking(state, "situation_analysis", {
                "analysis": f"Analyzing current situation (iteration {iteration})",
                "factors": ["available_data", "missing_requirements", "optimal_next_actions"]
            })
            
            situation_analysis = await self._analyze_current_situation(state)
            
            # Stream situation analysis
            await self._broadcast_situation_analysis_enhanced(state, situation_analysis)
            
            # Manager decision with full reasoning
            next_actions = await self._manager_decide_next_actions(state, situation_analysis)
            
            if not next_actions or len(next_actions) == 0:
                await self._broadcast_manager_thinking(state, "completion_analysis", {
                    "analysis": "No further actions needed - workflow objectives achieved",
                    "completion_reason": "objectives_met"
                })
                break
            
            # Stream brain allocation decisions
            for action in next_actions:
                agent_name = action.get('agent')
                if agent_name:
                    allocation = self._allocate_agent_brain(agent_name, "medium")
                    await self._broadcast_brain_allocation_decision(
                        state, agent_name, allocation, 
                        f"Allocated {allocation.get('model')} for {action.get('reason', 'processing')}"
                    )
            
            # Execute with enhanced progress tracking
            state = await self._execute_manager_decision_enhanced(state, next_actions)
            
            # Workflow completion assessment
            workflow_complete = await self._assess_workflow_completion(state)
            
            await self._broadcast_workflow_state_change(state, "iteration_complete", {
                "iteration": iteration,
                "completion_status": workflow_complete,
                "next_iteration_needed": not workflow_complete
            })
        
        return state

    async def _execute_manager_decision_enhanced(self, state: AppState, actions: List[Dict[str, Any]]) -> AppState:
        """
        Enhanced manager decision execution with granular progress streaming
        """
        if not actions:
            return state
        
        # Determine execution strategy
        parallel_capable = all(action.get('parallel', False) for action in actions)
        
        if parallel_capable and len(actions) > 1:
            await self._broadcast_manager_thinking(state, "parallel_execution", {
                "analysis": f"Executing {len(actions)} agents in parallel for optimal performance",
                "agents": [action.get('agent') for action in actions]
            })
            
            # Execute in parallel with progress tracking
            tasks = []
            for action in actions:
                task = self._delegate_task_async_enhanced(state, action)
                tasks.append(task)
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Process results with streaming updates
            for i, result in enumerate(results):
                agent_name = actions[i].get('agent', 'unknown')
                if isinstance(result, Exception):
                    await self._broadcast_agent_substep(state, agent_name, "failed", 0, {
                        "error": str(result),
                        "operation": "parallel_execution"
                    })
                else:
                    await self._broadcast_agent_substep(state, agent_name, "completed", 100, {
                        "operation": "parallel_execution_success"
                    })
                    # Update state
                    for key, value in result.items():
                        if hasattr(state, key):
                            setattr(state, key, value)
        else:
            # Sequential execution with progress streaming
            for i, action in enumerate(actions):
                agent_name = action.get('agent', 'unknown')
                
                await self._broadcast_agent_substep(state, agent_name, "initializing", 0, {
                    "operation": f"sequential_execution_step_{i+1}_of_{len(actions)}"
                })
                
                try:
                    await self._broadcast_agent_substep(state, agent_name, "processing", 50, {
                        "operation": "executing_agent_logic"
                    })
                    
                    result_dict = await self._delegate_task_async_enhanced(state, action)
                    
                    # 🔧 CRITICAL FIX: Convert result dict back to AppState to update the state object
                    if isinstance(result_dict, dict):
                        # Update state with results from agent execution
                        for key, value in result_dict.items():
                            if hasattr(state, key) and value is not None:
                                setattr(state, key, value)
                                # Log important state updates
                                if key in ['trade_mapping', 'scope_items', 'takeoff_data', 'estimate']:
                                    logger.info(f"🔄 State updated: {key} = {len(value) if isinstance(value, list) else value}")
                    
                    await self._broadcast_agent_substep(state, agent_name, "completed", 100, {
                        "operation": "agent_execution_successful",
                        "state_updated": True
                    })
                            
                except Exception as e:
                    await self._broadcast_agent_substep(state, agent_name, "failed", 0, {
                        "error": str(e),
                        "operation": "agent_execution_failed"
                    })
                    
                    if action.get('critical', False):
                        break
        
        return state

    async def _delegate_task_async_enhanced(self, state: AppState, task: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enhanced async task delegation with progress streaming
        """
        agent_name = task['agent']
        agent_handler = task['handler']
        required_field = task['required_field']
        
        # Mark agent as active
        self.active_agents[agent_name] = {
            "started_at": datetime.now(timezone.utc).isoformat(),
            "status": "running",
            "task": task
        }
        
        try:
            # Progress: Input validation
            await self._broadcast_agent_substep(state, agent_name, "validating_inputs", 10, {
                "operation": "checking_required_fields",
                "required_field": required_field
            })
            
            current_state_dict = state.model_dump()
            if required_field and not self._check_agent_readiness(current_state_dict, required_field):
                raise Exception(f"Agent {agent_name} not ready: missing {required_field}")
            
            # Progress: Agent execution
            await self._broadcast_agent_substep(state, agent_name, "executing", 25, {
                "operation": "running_agent_logic"
            })
            
            # Execute agent (all handlers are async)
            import asyncio
            if asyncio.iscoroutinefunction(agent_handler):
                result = await agent_handler(current_state_dict)
            else:
                # Handle case where handler might be a coroutine object
                result = agent_handler(current_state_dict)
                if asyncio.iscoroutine(result):
                    result = await result
            
            # Progress: Post-processing
            await self._broadcast_agent_substep(state, agent_name, "post_processing", 90, {
                "operation": "validating_output"
            })
            
            # Mark as completed
            self.active_agents[agent_name]["status"] = "completed"
            self.active_agents[agent_name]["completed_at"] = datetime.now(timezone.utc).isoformat()
            
            # 🔧 CRITICAL FIX: Return the UPDATED state dict, not just result
            if isinstance(result, dict):
                return result
            else:
                # Fallback: return the updated state as dict
                updated_state_dict = state.model_dump()
                return updated_state_dict
            
        except Exception as e:
            # Mark as failed
            self.active_agents[agent_name]["status"] = "failed"
            self.active_agents[agent_name]["error"] = str(e)
            raise e
        finally:
            # Clean up active agent tracking
            if agent_name in self.active_agents:
                del self.active_agents[agent_name]

    async def _autonomous_output_management_enhanced(self, state: AppState) -> AppState:
        """
        Enhanced autonomous output management with streaming
        """
        await self._broadcast_manager_thinking(state, "output_management", {
            "analysis": "Analyzing output options and user preferences",
            "available_outputs": self._get_available_outputs(state)
        })
        
        # Continue with existing logic but add streaming
        return await self._autonomous_output_management(state)
    
    async def _autonomous_output_management(self, state: AppState) -> AppState:
        """
        Base autonomous output management - handles final output processing
        """
        # Basic output management - just ensure state is ready for final output
        if state.estimate and len(state.estimate) > 0:
            # Set status to indicate estimate is ready for export
            state.status = "estimate_ready"
        elif state.takeoff_data and len(state.takeoff_data) > 0:
            # Set status to indicate takeoff is ready
            state.status = "takeoff_ready" 
        elif state.scope_items and len(state.scope_items) > 0:
            # Set status to indicate scope analysis is ready
            state.status = "scope_ready"
        else:
            # Default status
            state.status = "processing_complete"
        
        return state

    async def _situation_analysis_enhanced(self, state: AppState) -> Dict[str, Any]:
        """
        Enhanced situation analysis with streaming
        """
        analysis = await self._analyze_current_situation(state)
        
        await self._broadcast_situation_analysis_enhanced(state, analysis)
        
        return analysis

    async def _broadcast_situation_analysis_enhanced(self, state: AppState, analysis: Dict[str, Any]):
        """
        Enhanced situation analysis broadcasting
        """
        await self._broadcast_manager_thinking(state, "situation_analysis_complete", {
            "analysis": analysis.get("summary", "Analysis complete"),
            "available_data": analysis.get("available_data", []),
            "optimal_actions": [action.get("type", "unknown") for action in analysis.get("optimal_actions", [])],
            "confidence": 0.9
        })

    async def _broadcast_routing_decision_enhanced(self, state: AppState, route_plan: Dict[str, Any]):
        """
        Enhanced routing decision broadcasting with full details
        """
        await self._broadcast_manager_thinking(state, "routing_decision", {
            "analysis": f"Route planned: {route_plan.get('intent', 'unknown')} intent detected",
            "confidence": route_plan.get("confidence", 0.0),
            "agent_sequence": route_plan.get("sequence", []),
            "optimization_applied": route_plan.get("optimization_applied", False),
            "reasoning": route_plan.get("reasoning", ""),
            "estimated_duration": route_plan.get("estimated_duration", "calculating...")
        })

    def _get_available_outputs(self, state: AppState) -> List[str]:
        """Get list of available outputs for user"""
        outputs = []
        
        if state.estimate:
            outputs.extend(["estimate_xlsx", "estimate_pdf", "estimate_csv"])
        if state.takeoff_data:
            outputs.extend(["takeoff_xlsx", "takeoff_pdf"])
        if state.scope_items:
            outputs.extend(["scope_xlsx", "scope_pdf"])
        
        return outputs

    def _allocate_agent_brain(self, agent_name: str, task_complexity: str, 
                             has_visual_content: bool = False, 
                             document_size: str = "medium") -> Dict[str, Any]:
        """
        Intelligent Brain Allocation Manager
        Decides what level of LLM intelligence each agent needs based on available models
        
        Our Available Models:
        - o4-mini: Fast reasoning, coding, visual tasks (200K context, 100K output) - LOW COST
        - o3: Complex reasoning, math, science (200K context, 100K output) - HIGH COST  
        - 4.1: General purpose, coding, long context (1M context, 32K output) - MEDIUM COST
        - 4.1-mini: Cost-efficient general tasks (large context, standard output) - LOW COST
        - 4o: Multimodal (text, images, audio) (128K context, 16K output) - HIGH COST
        """
        # Available models from our environment configuration
        available_models = {
            "o4-mini": {
                "name": "o4-mini", 
                "cost": "low",
                "strengths": ["fast_reasoning", "coding", "visual_tasks", "efficient"],
                "context_window": 200000,
                "output_tokens": 100000,
                "best_for": ["simple_tasks", "quick_responses", "coding", "visual_processing"]
            },
            "o3": {
                "name": "o3",
                "cost": "high", 
                "strengths": ["complex_reasoning", "math", "science", "exceptional_reasoning"],
                "context_window": 200000,
                "output_tokens": 100000,
                "best_for": ["complex_reasoning", "scientific_analysis", "advanced_math", "expert_analysis"]
            },
            "4.1": {
                "name": "4.1",
                "cost": "medium",
                "strengths": ["coding", "long_context", "instruction_following", "general_purpose"],
                "context_window": 1000000,  # 1 million tokens
                "output_tokens": 32768,
                "best_for": ["general_purpose", "coding", "long_documents", "complex_workflows"]
            },
            "4.1-mini": {
                "name": "4.1-mini", 
                "cost": "low",
                "strengths": ["efficient", "general_purpose", "cost_effective"],
                "context_window": 200000,  # Estimated
                "output_tokens": 16000,    # Estimated
                "best_for": ["cost_efficient_tasks", "simple_analysis", "basic_processing"]
            },
            "4o": {
                "name": "4o",
                "cost": "high",
                "strengths": ["multimodal", "images", "audio", "vision", "real_time"],
                "context_window": 128000,
                "output_tokens": 16384,
                "best_for": ["visual_content", "multimodal_tasks", "image_analysis", "audio_processing"]
            }
        }
        
        # Agent-specific brain allocation logic
        allocation_rules = {
            "smartsheet": {
                "simple": "4.1-mini",     # File listing, basic responses
                "complex": "4.1",         # Large document analysis
                "visual": "4o"            # If visual content in sheets
            },
            "file_reader": {
                "simple": "4.1-mini",     # Small documents
                "complex": "4.1",         # Large documents need 1M context
                "visual": "4o"            # PDF with images, diagrams
            },
            "trade_mapper": {
                "simple": "o4-mini",      # Fast coding/reasoning for trade identification
                "complex": "o3",          # Complex trade relationships need reasoning
                "visual": "4o"            # Construction drawings/plans
            },
            "scope": {
                "simple": "o4-mini",      # Basic scope items
                "complex": "o3",          # Complex scope analysis requires reasoning
                "visual": "4o"            # Visual scope analysis
            },
            "takeoff": {
                "simple": "o4-mini",      # Basic quantity calculations
                "complex": "o3",          # Complex math/calculations
                "visual": "4o"            # Visual measurement from plans
            },
            "estimator": {
                "simple": "o4-mini",      # Basic cost calculations
                "complex": "o3",          # Complex cost modeling needs reasoning
                "visual": "4o"            # Cost analysis from visual data
            },
            "exporter": {
                "simple": "4.1-mini",     # Simple data formatting
                "complex": "4.1",         # Complex document generation
                "visual": "4.1"           # Export rarely needs visual processing
            }
        }
        
        # Determine complexity level
        if has_visual_content:
            complexity_key = "visual"
        elif task_complexity in ["high", "complex"] or document_size == "large":
            complexity_key = "complex"
        else:
            complexity_key = "simple"
        
        # Get recommended model for this agent and complexity
        recommended_model_key = allocation_rules.get(agent_name, {}).get(complexity_key, "4.1-mini")
        selected_model = available_models.get(recommended_model_key, available_models["4.1-mini"])
        
        return {
            "model": selected_model["name"],
            "reasoning": f"Selected {selected_model['name']} for {agent_name} - {complexity_key} task",
            "cost_level": selected_model["cost"],
            "context_window": selected_model["context_window"],
            "output_tokens": selected_model["output_tokens"],
            "strengths": selected_model["strengths"]
        }

    def _assess_task_complexity(self, state: AppState, agent_name: str) -> str:
        """
        Assess the complexity of the task for brain allocation
        """
        complexity_indicators = {
            "high": 0,
            "medium": 0,
            "low": 0
        }
        
        # File size indicators
        if hasattr(state, 'files') and state.files:
            total_size = sum(getattr(f, 'size', 0) for f in state.files)
            if total_size > 50_000_000:  # 50MB+
                complexity_indicators["high"] += 2
            elif total_size > 10_000_000:  # 10MB+
                complexity_indicators["medium"] += 1
        
        # Content indicators
        if hasattr(state, 'processed_files_content') and state.processed_files_content:
            total_content = sum(len(content.get('text', '')) for content in state.processed_files_content)
            if total_content > 100_000:  # 100K+ characters
                complexity_indicators["high"] += 1
            elif total_content > 25_000:  # 25K+ characters
                complexity_indicators["medium"] += 1
        
        # Agent-specific complexity assessment
        if agent_name in ["scope", "estimator", "takeoff"] and hasattr(state, 'trade_mapping'):
            trade_count = len(state.trade_mapping or [])
            if trade_count > 15:
                complexity_indicators["high"] += 1
            elif trade_count > 5:
                complexity_indicators["medium"] += 1
        
        # Determine final complexity
        if complexity_indicators["high"] >= 2:
            return "high"
        elif complexity_indicators["high"] >= 1 or complexity_indicators["medium"] >= 2:
            return "medium"
        else:
            return "low"
    
    def _detect_visual_content(self, state_dict: Dict[str, Any]) -> bool:
        """
        Detect if the current task involves visual content that would benefit from multimodal models
        """
        # Check file types for visual content
        if 'files' in state_dict and state_dict['files']:
            for file in state_dict['files']:
                if isinstance(file, dict):
                    filename = file.get('name', '').lower()
                    if any(ext in filename for ext in ['.pdf', '.png', '.jpg', '.jpeg', '.tiff', '.dwg', '.svg']):
                        return True
        
        # Check processed content for visual indicators
        if 'processed_files_content' in state_dict:
            content_list = state_dict['processed_files_content']
            if isinstance(content_list, list):
                for content in content_list:
                    if isinstance(content, dict):
                        text = content.get('text', '').lower()
                        # Look for visual content indicators
                        visual_keywords = ['diagram', 'figure', 'image', 'drawing', 'blueprint', 'plan', 'elevation', 'section']
                        if any(keyword in text for keyword in visual_keywords):
                            return True
        
        # Check query for visual content requests
        if 'query' in state_dict and state_dict['query']:
            query = state_dict['query'].lower()
            visual_request_keywords = ['visual', 'image', 'drawing', 'diagram', 'blueprint', 'plan', 'elevation']
            if any(keyword in query for keyword in visual_request_keywords):
                return True
        
        return False
        
    async def _analyze_current_situation(self, state: AppState) -> Dict[str, Any]:
        """Manager analyzes current situation to decide next actions"""
        # Enhanced: Broadcast manager thinking process
        await self._broadcast_manager_thinking(state, "situation_analysis", {
            "analysis": "Analyzing current workflow state and determining optimal next actions",
            "stage": "Situation Analysis",
            "factors": ["available_data", "missing_requirements", "workflow_dependencies"]
        })
        
        available_data = []
        missing_requirements = []
        optimal_actions = []
        
        # Catalog what data is available
        if state.query:
            available_data.append(f"query ({len(state.query)} chars)")
        if state.files:
            available_data.append(f"files ({len(state.files)} uploaded)")
        if state.processed_files_content:
            available_data.append(f"processed_files_content ({len(state.processed_files_content)} files)")
        if state.trade_mapping:
            available_data.append(f"trade_mapping ({len(state.trade_mapping)} trades)")
        if state.scope_items:
            available_data.append(f"scope_items ({len(state.scope_items)} items)")
        if state.takeoff_data:
            available_data.append(f"takeoff_data ({len(state.takeoff_data)} calculations)")
        if state.estimate:
            available_data.append(f"estimate ({len(state.estimate)} line items)")
        
        # Determine what actions are needed based on situation
        if state.files and not state.processed_files_content:
            optimal_actions.append({
                'type': 'parallel_file_processing',
                'reason': 'Files need to be processed',
                'agents': ['file_reader'],
                'parallel': len(state.files) > 1
            })
        elif state.query and len(state.query) > 200 and not state.trade_mapping:
            # 🔧 FIX: Handle text-only construction requests (no files uploaded)
            optimal_actions.append({
                'type': 'text_analysis_phase',
                'reason': 'Text-only construction request needs trade analysis',
                'agents': ['trade_mapper'],
                'parallel': False
            })
        elif state.processed_files_content and not state.trade_mapping:
            optimal_actions.append({
                'type': 'analysis_phase',
                'reason': 'Content ready for analysis',
                'agents': ['trade_mapper'],
                'parallel': False
            })
        elif state.trade_mapping and not state.scope_items:
            optimal_actions.append({
                'type': 'scope_analysis',
                'reason': 'Trades identified, need scope analysis',
                'agents': ['scope'],
                'parallel': False
            })
        elif state.scope_items and not state.takeoff_data:
            optimal_actions.append({
                'type': 'quantity_calculation',
                'reason': 'Scope ready, calculate quantities',
                'agents': ['takeoff'],
                'parallel': False
            })
        elif state.takeoff_data and not state.estimate:
            optimal_actions.append({
                'type': 'cost_estimation',
                'reason': 'Quantities ready, generate estimate',
                'agents': ['estimator'],
                'parallel': False
            })
        
        summary = f"Available: {', '.join(available_data) if available_data else 'None'}. Next: {optimal_actions[0]['type'] if optimal_actions else 'Complete'}"
        
        return {
            'available_data': available_data,
            'missing_requirements': missing_requirements,
            'optimal_actions': optimal_actions,
            'summary': summary
        }
    
    async def _manager_decide_next_actions(self, state: AppState, situation: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Manager decides what actions to take based on situation analysis"""
        optimal_actions = situation.get('optimal_actions', [])
        
        if not optimal_actions:
            return []
        
        # Manager makes intelligent decisions about execution
        next_action = optimal_actions[0]
        
        # Convert to actionable tasks
        tasks = []
        for agent_name in next_action['agents']:
            if agent_name in self.available_agents:
                agent_info = self.available_agents[agent_name]
                tasks.append({
                    'name': f'{agent_name}_task',
                    'agent': agent_name,
                    'handler': agent_info['handler'],
                    'required_field': agent_info['required_field'],
                    'parallel': next_action.get('parallel', False),
                    'reason': next_action['reason']
                })
        
        self.log_interaction(state, "🎯 Manager Decision", 
                           f"Next action: {next_action['type']} with {len(tasks)} agents")
        
        return tasks
    
    async def _execute_autonomous_workflow(self, state: AppState, route_plan: Dict[str, Any]) -> AppState:
        """
        Enhanced autonomous workflow orchestration with smart fallback
        """
        try:
            # Use enhanced workflow if available
            return await self._execute_autonomous_workflow_enhanced(state, route_plan)
        except Exception as e:
            logger.warning(f"Enhanced workflow failed, using fallback: {str(e)}")
            # Fall back to original workflow execution
            return await self._fallback_processing(state)

    async def _plan_route_enhanced(self, state: AppState) -> Dict[str, Any]:
        """Enhanced route planning with real-time streaming"""
        try:
            # Use the route planner service
            from backend.services.route_planner import RoutePlanner
            
            route_planner = RoutePlanner()
            
            # Plan the route with AppState object directly
            route_plan = await route_planner.plan_route(state, self.available_agents)
            
            return route_plan
            
        except Exception as e:
            # Fallback to basic routing
            self.log_interaction(state, "Route planning fallback", 
                               f"Enhanced routing failed: {str(e)}, using basic sequence")
            
            # Return a basic route plan
            sequence = self._determine_agent_sequence(state)
            return {
                "intent": "fallback",
                "confidence": 0.5,
                "sequence": [s[0] for s in sequence],
                "reasoning": f"Fallback routing due to error: {str(e)}",
                "skipped_agents": []
            }

    async def _assess_workflow_completion(self, state: AppState) -> bool:
        """Manager assesses if workflow objectives are met"""
        # Manager checks user intent and current state
        if not state.query:
            # No specific user intent, check if we have meaningful output
            return bool(state.estimate or state.takeoff_data or state.scope_items)
        
        query_lower = state.query.lower()
        
        # Check if user's goals are satisfied
        if 'estimate' in query_lower or 'cost' in query_lower:
            return bool(state.estimate and len(state.estimate) > 0)
        
        elif 'analyze' in query_lower or 'analysis' in query_lower:
            return bool(state.processed_files_content and state.trade_mapping)
        
        elif 'takeoff' in query_lower or 'quantity' in query_lower:
            return bool(state.takeoff_data and len(state.takeoff_data) > 0)
        
        elif 'scope' in query_lower:
            return bool(state.scope_items and len(state.scope_items) > 0)
        
        # Default completion check - estimate is the typical end goal
        return bool(state.estimate and len(state.estimate) > 0)

    # ===== ENHANCED REAL-TIME STREAMING IMPLEMENTATION =====
    
    async def _broadcast_manager_thinking(self, state: AppState, thinking_type: str, data: Dict[str, Any]):
        """
        🧠 MANAGER THINKING PROCESS BROADCASTING
        Stream manager's real-time decision-making process
        """
        try:
            from backend.routes.chat import broadcast_message
            
            message = {
                "type": "manager_thinking",
                "session_id": state.session_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "data": {
                    "thinking_type": thinking_type,
                    "stage": self.current_workflow_stage,
                    "analysis": data.get("analysis", "Processing..."),
                    "factors": data.get("factors", []),
                    "confidence": data.get("confidence", 0.85),
                    "reasoning_depth": data.get("reasoning_depth", "standard"),
                    **data
                }
            }
            
            await self._safe_websocket_broadcast(state, message)
            
        except Exception as e:
            logger.warning(f"Failed to broadcast manager thinking: {str(e)}")

    async def _broadcast_agent_substep(self, state: AppState, agent_name: str, substep: str, 
                                     progress_pct: float, details: Dict[str, Any] = None):
        """
        📊 GRANULAR AGENT PROGRESS STREAMING
        Stream detailed progress within each agent
        """
        try:
            from backend.routes.chat import broadcast_message
            
            message = {
                "type": "agent_substep",
                "session_id": state.session_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "data": {
                    "agent_name": agent_name,
                    "substep": substep,
                    "progress_percentage": progress_pct,
                    "substep_details": details or {},
                    "estimated_completion": details.get("estimated_completion", "calculating..."),
                    "current_operation": details.get("operation", substep),
                    "model_used": details.get("model", "processing"),
                    "tokens_processed": details.get("tokens", 0)
                }
            }
            
            await self._safe_websocket_broadcast(state, message)
            
        except Exception as e:
            logger.warning(f"Failed to broadcast agent substep: {str(e)}")

    async def _broadcast_user_decision_needed(self, state: AppState, decision_context: Dict[str, Any]):
        """
        🤔 INTERACTIVE USER DECISION STREAMING
        Stream when user input is required with full context
        """
        try:
            from backend.routes.chat import broadcast_message
            
            self.user_decision_pending = True
            
            message = {
                "type": "user_decision_needed",
                "session_id": state.session_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "data": {
                    "decision_type": decision_context.get("type", "selection"),
                    "prompt": decision_context.get("user_prompt", "Input needed"),
                    "options": decision_context.get("options", []),
                    "context": decision_context.get("context", {}),
                    "default_option": decision_context.get("default", None),
                    "timeout_seconds": decision_context.get("timeout", 300),
                    "can_skip": decision_context.get("can_skip", False),
                    "affects_workflow": decision_context.get("affects_workflow", True)
                }
            }
            
            await self._safe_websocket_broadcast(state, message)
            
        except Exception as e:
            logger.warning(f"Failed to broadcast user decision needed: {str(e)}")

    async def _broadcast_workflow_state_change(self, state: AppState, change_type: str, data: Dict[str, Any]):
        """
        🎯 VISUAL WORKFLOW REPRESENTATION STREAMING
        Stream workflow state changes for visual pipeline representation
        """
        try:
            from backend.routes.chat import broadcast_message
            
            # Update internal workflow visualization
            if change_type == "phase_transition":
                self.current_workflow_stage = data.get("phase_name", "unknown")
                self.workflow_visualization["completion_percentage"] = (data.get("to_phase", 1) / 4.0) * 100
            
            message = {
                "type": "workflow_state_change",
                "session_id": state.session_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "data": {
                    "change_type": change_type,
                    "current_stage": self.current_workflow_stage,
                    "workflow_visualization": self.workflow_visualization.copy(),
                    "active_agents": list(self.active_agents.keys()),
                    "pipeline_status": self._get_pipeline_status(state),
                    **data
                }
            }
            
            await self._safe_websocket_broadcast(state, message)
            
        except Exception as e:
            logger.warning(f"Failed to broadcast workflow state change: {str(e)}")

    async def _broadcast_brain_allocation_decision(self, state: AppState, agent_name: str, 
                                                 allocation: Dict[str, Any], reasoning: str):
        """
        🤖 BRAIN ALLOCATION DECISION STREAMING
        Stream manager's LLM model allocation decisions with full reasoning
        """
        try:
            from backend.routes.chat import broadcast_message
            
            message = {
                "type": "brain_allocation",
                "session_id": state.session_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "data": {
                    "agent_name": agent_name,
                    "model_selected": allocation.get("model", "unknown"),
                    "model_tier": allocation.get("cost_level", "unknown"),
                    "reasoning": reasoning,
                    "complexity_assessment": allocation.get("complexity", "medium"),
                    "context_window": allocation.get("context_window", "unknown"),
                    "expected_cost": allocation.get("cost_estimate", "calculating"),
                    "performance_expectation": allocation.get("performance", "standard"),
                    "factors_considered": allocation.get("factors", [
                        "task_complexity", "content_size", "visual_content", "reasoning_required"
                    ])
                }
            }
            
            await self._safe_websocket_broadcast(state, message)
            
        except Exception as e:
            logger.warning(f"Failed to broadcast brain allocation: {str(e)}")

    async def _broadcast_error_recovery(self, state: AppState, error_msg: str, severity: str):
        """
        🚨 ERROR RECOVERY STREAMING
        Stream error handling and recovery attempts
        """
        try:
            from backend.routes.chat import broadcast_message
            
            message = {
                "type": "error_recovery",
                "session_id": state.session_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "data": {
                    "error_message": error_msg,
                    "severity": severity,
                    "recovery_strategy": "analyzing_options",
                    "can_continue": severity != "critical",
                    "affected_agents": list(self.active_agents.keys()),
                    "user_action_required": severity == "critical"
                }
            }
            
            await self._safe_websocket_broadcast(state, message)
            
        except Exception as e:
            logger.warning(f"Failed to broadcast error recovery: {str(e)}")

    async def _safe_websocket_broadcast(self, state: AppState, message: Dict[str, Any]):
        """
        🔒 SAFE WEBSOCKET BROADCASTING
        Safely broadcast messages without breaking workflow
        """
        try:
            if state.session_id:
                from backend.routes.chat import broadcast_message
                
                # Try to broadcast with proper async handling
                try:
                    loop = asyncio.get_event_loop()
                    if loop.is_running():
                        # Create task for existing loop
                        asyncio.create_task(broadcast_message(state.session_id, message))
                    else:
                        # Run directly if no loop
                        await broadcast_message(state.session_id, message)
                except RuntimeError:
                    # Create new event loop if needed
                    try:
                        asyncio.run(broadcast_message(state.session_id, message))
                    except Exception:
                        # Final fallback - just log
                        logger.info(f"BROADCAST: {message['type']} - {message.get('data', {})}")
                        
        except Exception as e:
            # Never let broadcasting break the workflow
            logger.warning(f"Safe WebSocket broadcast failed: {str(e)}")

    def _detect_input_types(self, state: AppState) -> List[str]:
        """Detect types of input provided by user"""
        input_types = []
        
        if state.files and len(state.files) > 0:
            input_types.append(f"files ({len(state.files)})")
        
        if state.query:
            if "smartsheet.com" in state.query.lower():
                input_types.append("smartsheet_url")
            else:
                input_types.append("text_instructions")
        
        return input_types

    def _get_pipeline_status(self, state: AppState) -> Dict[str, Any]:
        """Get current pipeline status for visualization"""
        return {
            "files_processed": bool(state.processed_files_content),
            "trades_mapped": bool(state.trade_mapping),
            "scope_analyzed": bool(state.scope_items),
            "takeoff_calculated": bool(state.takeoff_data),
            "estimate_generated": bool(state.estimate),
            "export_ready": bool(state.estimate and len(state.estimate) > 0)
        }

# Create instance for backward compatibility
manager_agent = ManagerAgent()

# Legacy handle function for existing code
async def handle(state_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Legacy handle function that uses the new ManagerAgent class."""
    return await manager_agent.handle(state_dict)
