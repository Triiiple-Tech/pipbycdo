"""
Trade Mapper Agent for PIP AI Construction Analysis
Maps construction documents to specific trades using LLM analysis
"""

import json
import logging
from typing import Any, Dict, List, Optional
from backend.app.schemas import AppState
from backend.agents.base_agent import BaseAgent
from backend.services.gpt_handler import run_llm
from backend.services.llm_selector import select_llm

logger = logging.getLogger(__name__)

class TradeMapperAgent(BaseAgent):
    """
    Agent that analyzes construction documents to identify specific trades and CSI divisions.
    Uses LLM for intelligent analysis instead of keyword matching.
    """
    
    def __init__(self):
        super().__init__("trade_mapper")
        self.brain_prompt = """You are an expert construction document analyzer specializing in CSI (Construction Specifications Institute) divisions. 
Your task is to analyze construction documents and identify specific trades and CSI divisions present.

Return ONLY a valid JSON array of trade objects. Each object must have these exact keys:
[
    {
        "trade_name": "specific trade name",
        "csi_division": "6-digit CSI code",
        "keywords_found": ["relevant keywords from text"],
        "confidence": "high|medium|low",
        "description": "brief description of work identified"
    }
]

CSI Division Reference:
- 01xxxx: General Requirements
- 02xxxx: Existing Conditions  
- 03xxxx: Concrete
- 04xxxx: Masonry
- 05xxxx: Metals
- 06xxxx: Wood, Plastics, and Composites
- 07xxxx: Thermal and Moisture Protection
- 08xxxx: Openings
- 09xxxx: Finishes
- 10xxxx: Specialties
- 11xxxx: Equipment
- 12xxxx: Furnishings
- 13xxxx: Special Construction
- 14xxxx: Conveying Equipment
- 21xxxx: Fire Suppression
- 22xxxx: Plumbing
- 23xxxx: HVAC
- 26xxxx: Electrical
- 27xxxx: Communications
- 28xxxx: Electronic Safety and Security
- 31xxxx: Earthwork
- 32xxxx: Exterior Improvements
- 33xxxx: Utilities"""

    async def process(self, state: AppState) -> AppState:
        """Process construction documents to identify trades using LLM analysis."""
        
        # Check if we have either file content OR text query to analyze
        if not state.processed_files_content and not state.query:
            self.log_interaction(state, "No content to analyze", 
                               "No processed file content or query text available for trade mapping")
            state.trade_mapping = []
            return state

        try:
            # Select optimal model for trade analysis
            llm_config = select_llm("trade_mapper", state.model_dump())
            model = llm_config.get("model", "gpt-4o-mini") or "gpt-4o-mini"
            api_key = llm_config.get("api_key", "")
            
            # Prepare content for LLM analysis (files or text query)
            content_summary = self._prepare_content_for_llm(state.processed_files_content, state.query)
            
            # Create analysis prompt
            analysis_prompt = f"""Analyze these construction documents and identify all trades and CSI divisions present:

{content_summary}

Identify all construction trades present in these documents. Return the analysis as a JSON array."""

            self.log_interaction(state, "Calling LLM for trade analysis", 
                               f"Using model {model} to analyze construction trades")

            # Call LLM for analysis
            llm_response = await run_llm(
                prompt=analysis_prompt,
                system_prompt=self.brain_prompt,
                model=model,
                api_key=api_key,
                agent_name="trade_mapper",
                temperature=0.1,
                max_tokens=2000
            )

            # Parse LLM response
            try:
                trade_mappings = json.loads(llm_response)
                if not isinstance(trade_mappings, list):
                    trade_mappings = []
            except json.JSONDecodeError as e:
                self.log_interaction(state, "LLM response parsing error", 
                                   f"Could not parse JSON from LLM: {e}", level="error")
                trade_mappings = []

            # Update state with mapped trades
            state.trade_mapping = trade_mappings
            
            self.log_interaction(state, "Trade mapping complete", 
                               f"Identified {len(trade_mappings)} construction trades using LLM analysis")

        except Exception as e:
            error_msg = f"Error in LLM-based trade mapping: {str(e)}"
            self.log_interaction(state, "Trade mapping error", error_msg, level="error")
            logger.error(f"TradeMapperAgent error: {e}")
            state.trade_mapping = []

        return state

    def _prepare_content_for_llm(self, processed_files_content: Optional[Dict[str, str]] = None, query: Optional[str] = None) -> str:
        """Prepare file content and/or query text for LLM analysis."""
        content_parts = []
        
        # Add file content if available
        if processed_files_content:
            for filename, content in processed_files_content.items():
                # Truncate very long content to avoid token limits
                truncated_content = content[:2000] if len(content) > 2000 else content
                content_parts.append(f"=== {filename} ===\n{truncated_content}\n")
        
        # Add query text if available and no files
        if query and not processed_files_content:
            content_parts.append(f"=== User Query ===\n{query}\n")
        
        return "\n".join(content_parts) if content_parts else "No content available"


# Create instance for backward compatibility
trade_mapper_agent = TradeMapperAgent()

# Legacy handle function for existing code
async def handle(state_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Legacy async handle function that uses the new TradeMapperAgent class."""
    try:
        # Convert dict to AppState
        state = AppState(**state_dict)
        
        # Run the async process method
        result_state = await trade_mapper_agent.process(state)
        
        return result_state.model_dump()
    except Exception as e:
        logger.error(f"Error in trade mapper handle: {e}")
        # Return the original state with empty trade mapping
        state_dict['trade_mapping'] = []
        return state_dict
