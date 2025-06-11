# backend/services/route_planner.py
from typing import Dict, List, Optional, Any, Tuple, Callable
from backend.app.schemas import AppState
from backend.services.intent_classifier import intent_classifier
import logging

logger = logging.getLogger(__name__)

class RoutePlanner:
    """
    Enhanced route planning service that determines optimal agent sequences
    based on intent classification and current state analysis.
    """
    
    def __init__(self):
        self.name = "route_planner"
    
    async def plan_route(self, state: AppState, available_agents: Dict[str, Any]) -> Dict[str, Any]:
        """
        Plan the optimal route through agents based on current state and user intent.
        
        Args:
            state: Current application state
            available_agents: Dictionary mapping agent names to agent configuration dictionaries
        
        Returns:
            Dictionary containing route plan with agent sequence, skip decisions, and metadata
        """
        try:
            # Enhanced debugging for Smartsheet URL processing
            if state.query and "smartsheet.com" in state.query.lower():
                logger.info(f"DEBUG: Route planning for Smartsheet URL. Query: {state.query[:100]}...")
                logger.info(f"DEBUG: Available agents: {list(available_agents.keys())}")
            
            # Step 1: Classify intent (now async)
            intent_type, intent_metadata = await intent_classifier.classify_intent(state)
            intent_result = {"primary_intent": intent_type.value, "metadata": intent_metadata}
            
            # Enhanced debugging for Smartsheet intent classification
            if state.query and "smartsheet.com" in state.query.lower():
                logger.info(f"DEBUG: Intent classification result: {intent_result}")
                logger.info(f"DEBUG: Primary intent: {intent_result.get('primary_intent')}")
                logger.info(f"DEBUG: Recommended sequence: {intent_result.get('recommended_sequence')}")
            
            # Step 2: Analyze current state capabilities
            state_analysis = self._analyze_state_capabilities(state)
            
            # Step 3: Plan optimal sequence
            route_plan = self._create_route_plan(intent_result, state_analysis, available_agents)
            
            # Enhanced debugging for Smartsheet route plan
            if state.query and "smartsheet.com" in state.query.lower():
                logger.info(f"DEBUG: Initial route plan base sequence: {route_plan.get('base_sequence')}")
                logger.info(f"DEBUG: Skip candidates: {route_plan.get('skip_candidates')}")
            
            # Step 4: Optimize for efficiency
            optimized_plan = self._optimize_route(route_plan, state, available_agents)
            
            # Enhanced debugging for Smartsheet optimization result
            if state.query and "smartsheet.com" in state.query.lower():
                logger.info(f"DEBUG: Optimized sequence: {optimized_plan.get('sequence')}")
                logger.info(f"DEBUG: Skipped agents: {optimized_plan.get('skipped_agents')}")
            
            logger.info(f"Route planned: {len(optimized_plan['sequence'])} agents, "
                       f"{len(optimized_plan['skipped_agents'])} skipped")
            
            return optimized_plan
            
        except Exception as e:
            logger.error(f"Error in route planning: {str(e)}")
            return self._fallback_route_plan(available_agents)
    
    def _analyze_state_capabilities(self, state: AppState) -> Dict[str, Any]:
        """Analyze what data is already available and what processing can be skipped."""
        capabilities: Dict[str, Any] = {
            "can_skip_file_reader": bool(state.processed_files_content),
            "can_skip_trade_mapper": bool(state.trade_mapping),
            "can_skip_scope": bool(state.scope_items),
            "can_skip_takeoff": bool(state.takeoff_data),
            "can_skip_estimator": bool(state.estimate),
            "has_raw_files": bool(state.files and len(state.files) > 0),
            "has_files": bool(state.files and len(state.files) > 0),
            "has_smartsheet_url": bool(state.query and "smartsheet.com" in state.query.lower()),
            "data_freshness": self._assess_data_freshness(state),
            "processing_gaps": self._identify_processing_gaps(state)
        }
        
        return capabilities
    
    def _assess_data_freshness(self, state: AppState) -> Dict[str, str]:
        """Assess whether existing data is fresh enough to reuse."""
        freshness: Dict[str, str] = {}
        
        # Check if we have timestamps or can infer freshness
        if state.updated_at and state.created_at:
            # If data was recently updated, consider it fresh
            time_diff = (state.updated_at - state.created_at).total_seconds()
            if time_diff < 300:  # 5 minutes
                freshness["overall"] = "fresh"
            elif time_diff < 3600:  # 1 hour
                freshness["overall"] = "moderate"
            else:
                freshness["overall"] = "stale"
        else:
            freshness["overall"] = "unknown"
        
        # Check individual data components
        if state.processed_files_content:
            freshness["files"] = "fresh" if state.files else "orphaned"
        if state.trade_mapping:
            freshness["trades"] = "fresh" if state.processed_files_content else "orphaned"
        if state.scope_items:
            freshness["scope"] = "fresh" if state.trade_mapping else "orphaned"
        if state.takeoff_data:
            freshness["takeoff"] = "fresh" if state.scope_items else "orphaned"
        if state.estimate:
            freshness["estimate"] = "fresh" if state.takeoff_data else "orphaned"
        
        return freshness
    
    def _identify_processing_gaps(self, state: AppState) -> List[str]:
        """Identify gaps in the processing pipeline that need to be filled."""
        gaps: List[str] = []
        
        # Check for logical gaps in the pipeline
        if state.files and not state.processed_files_content:
            gaps.append("file_processing_needed")
        
        if state.processed_files_content and not state.trade_mapping:
            gaps.append("trade_mapping_needed")
        
        if state.trade_mapping and not state.scope_items:
            gaps.append("scope_extraction_needed")
        
        if state.scope_items and not state.takeoff_data:
            gaps.append("takeoff_needed")
        
        if state.takeoff_data and not state.estimate:
            gaps.append("estimation_needed")
        
        return gaps
    
    def _create_route_plan(self, intent_result: Dict[str, Any], state_analysis: Dict[str, Any], 
                          available_agents: Dict[str, Any]) -> Dict[str, Any]:
        """Create initial route plan based on intent and state analysis."""
        
        primary_intent = intent_result.get("primary_intent", "full_estimation")
        confidence = intent_result.get("confidence", 0.5)
        
        # Get base sequence from intent
        if "recommended_sequence" in intent_result:
            base_sequence = intent_result["recommended_sequence"]
        else:
            try:
                base_sequence = intent_classifier.get_agent_sequence_for_intent(primary_intent)
            except Exception as e:
                logger.warning(f"Failed to get sequence for intent {primary_intent}: {e}")
                base_sequence = ["file_reader", "trade_mapper", "scope", "takeoff", "estimator"]
        
        # Special handling for Smartsheet URLs without files
        if (primary_intent == "smartsheet_integration" and 
            state_analysis.get("has_smartsheet_url", False) and 
            not state_analysis.get("has_files", False)):
            
            logger.info("DEBUG: Detected Smartsheet URL without files - adjusting sequence to start with smartsheet agent")
            # For Smartsheet-only scenarios, start with smartsheet agent
            base_sequence = ["smartsheet"]
            
        # Filter to only include available agents
        available_sequence = [agent for agent in base_sequence if agent in available_agents]
        
        route_plan: Dict[str, Any] = {
            "intent": primary_intent,
            "confidence": confidence,
            "base_sequence": available_sequence,
            "state_analysis": state_analysis,
            "intent_reasoning": intent_result.get("reasoning", ""),
            "skip_candidates": [],
            "force_include": []
        }
        
        # Identify agents that could potentially be skipped
        for agent_name in available_sequence:
            skip_key = f"can_skip_{agent_name}"
            if state_analysis.get(skip_key, False):
                route_plan["skip_candidates"].append({
                    "agent": agent_name,
                    "reason": f"Data already available for {agent_name}",
                    "confidence": 0.8
                })
        
        return route_plan
    
    def _optimize_route(self, route_plan: Dict[str, Any], state: AppState, 
                       available_agents: Dict[str, Any]) -> Dict[str, Any]:
        """Optimize the route for efficiency while maintaining data integrity."""
        
        base_sequence = route_plan["base_sequence"]
        skip_candidates = route_plan["skip_candidates"]
        state_analysis = route_plan["state_analysis"]
        
        optimized_sequence: List[str] = []
        skipped_agents: List[Dict[str, Any]] = []
        
        for agent_name in base_sequence:
            # Check if this agent should be skipped
            skip_info = next((s for s in skip_candidates if s["agent"] == agent_name), None)
            
            if skip_info and self._should_skip_agent(agent_name, state, state_analysis):
                skipped_agents.append({
                    "agent": agent_name,
                    "reason": skip_info["reason"],
                    "confidence": skip_info["confidence"]
                })
            else:
                optimized_sequence.append(agent_name)
        
        # Ensure critical dependencies are maintained
        optimized_sequence = self._ensure_dependencies(optimized_sequence, available_agents, state)
        
        return {
            "sequence": optimized_sequence,
            "skipped_agents": skipped_agents,
            "intent": route_plan["intent"],
            "confidence": route_plan["confidence"],
            "reasoning": route_plan["intent_reasoning"],
            "optimization_applied": True,
            "state_analysis": state_analysis
        }
    
    def _should_skip_agent(self, agent_name: str, state: AppState, state_analysis: Dict[str, Any]) -> bool:
        """Determine if an agent should be skipped based on current state."""
        
        # Check data freshness
        freshness = state_analysis.get("data_freshness", {})
        
        # Agent-specific skip logic
        if agent_name == "file_reader":
            return bool(state.processed_files_content and 
                       freshness.get("files") == "fresh")
        
        elif agent_name == "trade_mapper":
            return bool(state.trade_mapping and 
                       freshness.get("trades") in ["fresh", "moderate"] and
                       state.processed_files_content)
        
        elif agent_name == "scope":
            return bool(state.scope_items and 
                       freshness.get("scope") in ["fresh", "moderate"] and
                       state.trade_mapping)
        
        elif agent_name == "takeoff":
            return bool(state.takeoff_data and 
                       freshness.get("takeoff") in ["fresh", "moderate"] and
                       state.scope_items)
        
        elif agent_name == "estimator":
            return bool(state.estimate and 
                       freshness.get("estimate") == "fresh" and
                       state.takeoff_data)
        
        elif agent_name == "exporter":
            # Never skip exporter if explicitly requested
            query_lower = (state.query or "").lower()
            if any(keyword in query_lower for keyword in ["export", "download", "save"]):
                return False
            # Skip if no estimate data to export
            return not state.estimate
        
        return False
    
    def _ensure_dependencies(self, sequence: List[str], available_agents: Dict[str, Any], 
                           state: AppState) -> List[str]:
        """Ensure that required dependencies are included in the sequence."""
        
        # Define dependency graph
        dependencies = {
            "trade_mapper": ["file_reader"],
            "scope": ["trade_mapper"],
            "takeoff": ["scope"],
            "estimator": ["takeoff"],
            "exporter": ["estimator"]
        }
        
        # Check each agent in sequence and add missing dependencies
        final_sequence: List[str] = []
        
        for agent_name in sequence:
            # Add dependencies if needed
            if agent_name in dependencies:
                for dep in dependencies[agent_name]:
                    if dep not in final_sequence and dep in available_agents:
                        # Check if dependency data is available in state
                        if not self._has_dependency_data(dep, state):
                            final_sequence.append(dep)
            
            # Add the agent itself
            if agent_name not in final_sequence:
                final_sequence.append(agent_name)
        
        return final_sequence
    
    def _has_dependency_data(self, agent_name: str, state: AppState) -> bool:
        """Check if state has the data that an agent would produce."""
        data_mapping: Dict[str, Any] = {
            "file_reader": state.processed_files_content,
            "trade_mapper": state.trade_mapping,
            "scope": state.scope_items,
            "takeoff": state.takeoff_data,
            "estimator": state.estimate
        }
        
        return bool(data_mapping.get(agent_name))
    
    def _fallback_route_plan(self, available_agents: Dict[str, Any]) -> Dict[str, Any]:
        """Fallback route plan when classification fails."""
        logger.warning("Using fallback route planning")
        
        # Default to full pipeline
        full_sequence = ["file_reader", "trade_mapper", "scope", "takeoff", "estimator", "exporter"]
        available_sequence = [agent for agent in full_sequence if agent in available_agents]
        
        return {
            "sequence": available_sequence,
            "skipped_agents": [],
            "intent": "full_estimation",
            "confidence": 0.5,
            "reasoning": "Fallback route due to classification failure",
            "optimization_applied": False,
            "fallback_used": True
        }

# Create singleton instance
route_planner = RoutePlanner()
