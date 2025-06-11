"""
Scope Agent for PIP AI Construction Analysis
Extracts detailed scope items from trade mappings using LLM analysis
"""

import json
import logging
from typing import Any, Dict, List
from backend.app.schemas import AppState
from backend.agents.base_agent import BaseAgent
from backend.services.gpt_handler import run_llm
from backend.services.llm_selector import select_llm

logger = logging.getLogger(__name__)

class ScopeAgent(BaseAgent):
    """
    Agent that extracts detailed scope items from trade mappings using LLM analysis.
    """
    
    def __init__(self):
        super().__init__("scope")
        self.brain_prompt = """You are an expert construction scope analyst. Your task is to take identified trades and create detailed, specific scope items for each trade.

Return ONLY a valid JSON array of scope items. Each object must have these exact keys:
[
    {
        "trade_name": "specific trade name",
        "scope_item": "specific work item description",
        "unit_of_measure": "unit (SF, LF, EA, CY, etc.)",
        "estimated_quantity": "estimated quantity as number",
        "description": "detailed description of work",
        "materials_needed": ["list of materials"],
        "labor_type": "type of labor required",
        "complexity": "low|medium|high"
    }
]

Break down each trade into specific, measurable work items that can be quantified and estimated."""

    async def process(self, state: AppState) -> AppState:
        """Process trade mappings to extract detailed scope items using LLM analysis."""
        
        if not state.trade_mapping:
            self.log_interaction(state, "No trade mapping", 
                               "No trade mapping available for scope extraction")
            state.scope_items = []
            return state

        try:
            # Select optimal model for scope analysis
            llm_config = select_llm("scope", state.model_dump())
            model = llm_config.get("model", "gpt-4o-mini")
            api_key = llm_config.get("api_key", "")
            
            # Prepare trade mapping for LLM analysis
            trades_summary = self._prepare_trades_for_llm(state.trade_mapping)
            
            # Create analysis prompt
            analysis_prompt = f"""Analyze these identified construction trades and create detailed scope items for each:

{trades_summary}

For each trade, break down the work into specific, measurable scope items that include quantities, materials, and labor requirements."""

            self.log_interaction(state, "Calling LLM for scope analysis", 
                               f"Using model {model} to extract scope items from {len(state.trade_mapping)} trades")

            # Call LLM for analysis
            llm_response = await run_llm(
                prompt=analysis_prompt,
                system_prompt=self.brain_prompt,
                model=model,
                api_key=api_key,
                agent_name="scope",
                temperature=0.1,
                max_tokens=3000
            )

            # Parse LLM response
            try:
                scope_items = json.loads(llm_response)
                if not isinstance(scope_items, list):
                    scope_items = []
            except json.JSONDecodeError as e:
                self.log_interaction(state, "LLM response parsing error", 
                                   f"Could not parse JSON from LLM: {e}", level="error")
                scope_items = []

            # Update state with scope items
            state.scope_items = scope_items
            
            self.log_interaction(state, "Scope extraction complete", 
                               f"Extracted {len(scope_items)} scope items using LLM analysis")

        except Exception as e:
            error_msg = f"Error in LLM-based scope extraction: {str(e)}"
            self.log_interaction(state, "Scope extraction error", error_msg, level="error")
            logger.error(f"ScopeAgent error: {e}")
            state.scope_items = []

        return state

    def _prepare_trades_for_llm(self, trade_mapping: List[Dict[str, Any]]) -> str:
        """Prepare trade mapping data for LLM analysis."""
        trade_parts = []
        
        for i, trade in enumerate(trade_mapping, 1):
            trade_name = trade.get("trade_name", "Unknown Trade")
            csi_division = trade.get("csi_division", "")
            description = trade.get("description", "")
            keywords = trade.get("keywords_found", [])
            
            trade_summary = f"""Trade {i}: {trade_name}
CSI Division: {csi_division}
Description: {description}
Keywords Found: {', '.join(keywords) if keywords else 'None'}
"""
            trade_parts.append(trade_summary)
        
        return "\n".join(trade_parts)


# Create instance for backward compatibility
scope_agent = ScopeAgent()

# Legacy handle function for existing code
async def handle(state_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Legacy async handle function that uses the new ScopeAgent class."""
    try:
        # Convert dict to AppState
        state = AppState(**state_dict)
        
        # Run the async process method
        result_state = await scope_agent.process(state)
        
        return result_state.model_dump()
    except Exception as e:
        logger.error(f"Error in scope agent handle: {e}")
        # Return the original state with empty scope items
        state_dict['scope_items'] = []
        return state_dict
