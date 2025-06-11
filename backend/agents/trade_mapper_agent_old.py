from backend.app.schemas import AppState
from backend.agents.base_agent import BaseAgent
from backend.services.gpt_handler import run_llm
from backend.services.llm_selector import select_llm
import json
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)


class TradeMapperAgent(BaseAgent):
    """
    Agent responsible for mapping file content to construction trades using LLM analysis.
    Uses AI to identify relevant trades and CSI divisions from construction documents.
    """
    
    # Brain prompt from Autonomous Agentic Manager Protocol
    BRAIN_PROMPT = """You are the TradeMapperAgent, an expert in construction project analysis and CSI (Construction Specifications Institute) divisions. 

Your task is to analyze processed file content from construction documents and identify all relevant construction trades and CSI divisions present in the project.

Analyze the content and return a JSON array of trade mappings. Each mapping should include:
- trade_name: The specific construction trade (e.g., "Electrical", "HVAC", "Concrete", etc.)
- csi_division: The CSI division code (e.g., "260000" for Electrical)
- confidence: Confidence level (0.0-1.0) based on evidence strength
- keywords_found: Array of key terms/phrases that led to this identification
- source_file: The filename where this trade was identified
- relevant_content: Brief excerpt of the most relevant content for this trade

Focus on identifying actual construction trades, not general project management items. Be thorough but accurate - only include trades with clear evidence in the documents.

Return ONLY the JSON array, no other text."""

    def __init__(self):
        super().__init__("trade_mapper")
        self.brain_prompt = self.BRAIN_PROMPT

    async def process(self, state: AppState) -> AppState:
        """Main processing method for the trade mapper agent using LLM analysis."""
        
        self.log_interaction(state, "Starting LLM-based trade mapping", 
                           f"Trade Mapper Agent analyzing {len(state.processed_files_content or {})} files")
        
        # Check if there's content to process
        if not state.processed_files_content:
            self.log_interaction(state, "No processed file content found", 
                               "No content from File Reader Agent to process", level="error")
            state.trade_mapping = []
            return state

        try:
            # Get LLM configuration for this agent
            llm_config = select_llm("trade_mapper", state.model_dump())
            model = llm_config.get("model", "gpt-4o")
            api_key = llm_config.get("api_key")
            
            if not api_key:
                self.log_interaction(state, "No API key available", 
                                   "Cannot perform LLM analysis without API key", level="error")
                state.trade_mapping = []
                return state

            # Prepare content summary for LLM
            content_summary = self._prepare_content_for_llm(state.processed_files_content)
            
            # Create the analysis prompt
            analysis_prompt = f"""Analyze the following construction document content and identify all construction trades and CSI divisions:

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

    def _prepare_content_for_llm(self, processed_files_content: Dict[str, str]) -> str:
        """Prepare file content for LLM analysis by creating a summary."""
        content_parts = []
        
        for filename, content in processed_files_content.items():
            # Truncate very long content to avoid token limits
            truncated_content = content[:2000] if len(content) > 2000 else content
            content_parts.append(f"=== {filename} ===\n{truncated_content}\n")
        
        return "\n".join(content_parts)
        
        # Fallback to keyword-based mapping
        keyword_trades = self._map_content_to_trades_keywords(content, filename)
        
        if keyword_trades:
            self.log_interaction(state, f"Keyword trade mapping: {filename}", 
                               f"Found {len(keyword_trades)} trades using keyword matching")
        else:
            self.log_interaction(state, f"No trades mapped: {filename}", 
                               f"No specific trades identified in {filename}")
        
        return keyword_trades
    
    def _get_llm_trade_mapping(self, content: str, filename: str, state: AppState) -> List[Dict[str, Any]]:
        """Use LLM to intelligently map content to trades and CSI divisions."""
        
        try:
            system_prompt = """You are an expert construction document analyzer specializing in CSI (Construction Specifications Institute) divisions. 
Your task is to analyze construction documents and identify specific trades and CSI divisions present.

IMPORTANT: Respond with ONLY a valid JSON array of trade objects. Each object must have these exact keys:
[
    {
        "trade_name": "<specific trade name>",
        "csi_division": "<6-digit CSI code>",
        "keywords_found": ["<relevant keywords from text>"],
        "confidence": "<high|medium|low>",
        "description": "<brief description of work identified>"
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

            user_prompt = f"""Analyze this construction document content and identify all trades and CSI divisions present:

=== DOCUMENT: {filename} ===
{content[:3000]}  

Identify specific trades, provide appropriate CSI division codes, and list relevant keywords found in the text."""

            response = self.call_llm(state, user_prompt, system_prompt)
            
            if response:
                import json
                trades_data = json.loads(response)
                
                # Validate and clean the response
                validated_trades: List[Dict[str, Any]] = []
                for trade in trades_data:
                    if isinstance(trade, dict) and "trade_name" in trade and "csi_division" in trade:
                        # Type-safe dictionary access
                        trade_dict = trade  # type: ignore
                        validated_trade: Dict[str, Any] = {
                            "trade_name": str(trade_dict.get("trade_name", "Unknown Trade")),  # type: ignore
                            "csi_division": str(trade_dict.get("csi_division", "000000")),  # type: ignore
                            "keywords_found": list(trade_dict.get("keywords_found", [])),  # type: ignore
                            "confidence": str(trade_dict.get("confidence", "medium")),  # type: ignore
                            "description": str(trade_dict.get("description", "")),  # type: ignore
                            "source_file": filename,
                            "mapping_method": "LLM"
                        }
                        validated_trades.append(validated_trade)
                
                return validated_trades
                
        except Exception as e:
            self.logger.warning(f"LLM trade mapping failed for {filename}: {e}")
            return []
        
        return []
    
    def _map_content_to_trades_keywords(self, content: str, filename: str) -> List[Dict[str, Any]]:
        """
        Fallback method: Map content to trades using keyword spotting.
        """
        mapped_trades: List[Dict[str, Any]] = []  # type: ignore
        content_lower = content.lower()

        for csi_code, keywords in self.CSI_DIVISIONS_KEYWORDS.items():
            found_keywords: List[str] = []  # type: ignore
            for keyword in keywords:
                # Use regex to find whole words to avoid partial matches
                if re.search(r'\b' + re.escape(keyword.lower()) + r'\b', content_lower):
                    found_keywords.append(keyword)
            
            if found_keywords:
                mapped_trades.append({
                    "trade_name": f"Trade related to CSI {csi_code}",
                    "csi_division": csi_code,
                    "keywords_found": found_keywords,
                    "source_excerpt": content_lower[:200] + "...",
                    "source_file": filename,
                    "mapping_method": "keyword"
                })
        
        # If no specific keywords found but content exists, add general category
        if not mapped_trades and content_lower.strip():
            mapped_trades.append({
                "trade_name": "General Construction/Uncategorized",
                "csi_division": "000000",
                "keywords_found": [],
                "source_excerpt": content_lower[:200] + "...",
                "source_file": filename,
                "mapping_method": "fallback"
            })
        
        return mapped_trades


# Create instance for backward compatibility
trade_mapper_agent = TradeMapperAgent()

# Add the missing module-level functions and constants that tests expect
def map_content_to_trades(content: str) -> List[Dict[str, Any]]:
    """Module-level function for mapping content to trades."""
    # Create a temporary instance to access the method
    temp_agent = TradeMapperAgent()
    return temp_agent._map_content_to_trades_keywords(content, "test_file.txt")  # type: ignore

def log_interaction(state: AppState, decision: str, message: str, level: str = "info") -> None:
    """Module-level function for logging interactions."""
    trade_mapper_agent.log_interaction(state, decision, message, level)

# Expose the CSI_DIVISIONS_KEYWORDS at module level for tests
CSI_DIVISIONS_KEYWORDS = TradeMapperAgent.CSI_DIVISIONS_KEYWORDS

# Legacy handle function for existing code
def handle(state_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Legacy handle function that uses the new TradeMapperAgent class."""
    return trade_mapper_agent.handle(state_dict)

