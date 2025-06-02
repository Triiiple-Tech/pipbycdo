from app.schemas import AppState
from agents.base_agent import BaseAgent
import re
from typing import List, Dict, Any


class TradeMapperAgent(BaseAgent):
    """
    Agent responsible for mapping file content to construction trades based on CSI divisions.
    Uses keyword matching and pattern recognition to identify relevant trades.
    """
    
    # CSI divisions mapping with keywords
    CSI_DIVISIONS_KEYWORDS = {
        "010000": ["general requirements", "summary of work", "allowances"],
        "020000": ["existing conditions", "demolition", "site remediation"],
        "030000": ["concrete", "cast-in-place", "precast"],
        "040000": ["masonry", "brick", "stone", "block"],
        "050000": ["metals", "structural steel", "metal fabrications"],
        "060000": ["wood, plastics, and composites", "rough carpentry", "finish carpentry", "millwork"],
        "070000": ["thermal and moisture protection", "roofing", "waterproofing", "insulation"],
        "080000": ["openings", "doors", "windows", "glazing", "hardware"],
        "090000": ["finishes", "drywall", "painting", "flooring", "ceilings"],
        "100000": ["specialties", "signage", "toilet accessories", "fire protection specialties"],
        "110000": ["equipment", "laboratory equipment", "kitchen equipment"],
        "120000": ["furnishings", "casework", "furniture", "window treatments"],
        "130000": ["special construction", "clean rooms", "aquatic facilities"],
        "140000": ["conveying equipment", "elevators", "escalators"],
        "210000": ["fire suppression", "sprinklers", "standpipes"],
        "220000": ["plumbing", "piping", "fixtures"],
        "230000": ["hvac", "heating, ventilating, and air conditioning", "ductwork", "air distribution"],
        "260000": ["electrical", "wiring", "lighting", "power generation"],
        "270000": ["communications", "data", "voice", "audiovisual"],
        "280000": ["electronic safety and security", "access control", "cctv"],
        "310000": ["earthwork", "excavation", "grading"],
        "320000": ["exterior improvements", "paving", "fences", "landscaping"],
        "330000": ["utilities", "water", "sewer", "storm drainage"]
    }
    
    def __init__(self):
        super().__init__("trade_mapper")
    
    def process(self, state: AppState) -> AppState:
        """Main processing method for the trade mapper agent."""
        
        self.log_interaction(state, "Starting trade mapping", 
                           f"Trade Mapper Agent invoked. Processing {len(state.processed_files_content or {})} files")
        
        # Check if there's content to process
        if not state.processed_files_content:
            self.log_interaction(state, "No processed file content found", 
                               "No content from File Reader Agent to process", level="error")
            state.trade_mapping = []
            return state
        
        # Process each file's content
        all_trades: List[Dict[str, Any]] = []
        for filename, content in state.processed_files_content.items():
            try:
                trades = self._process_file_content(filename, content, state)
                all_trades.extend(trades)
            except Exception as e:
                error_msg = f"Error mapping trades for {filename}: {str(e)}"
                self.log_interaction(state, f"Trade mapping error: {filename}", error_msg, level="error")
                
                # Add error entry to trade mapping
                all_trades.append({
                    "trade_name": "Error in Processing",
                    "csi_division": "ERROR",
                    "keywords_found": [],
                    "source_file": filename,
                    "error_message": str(e)
                })
        
        # Update state with mapped trades
        state.trade_mapping = all_trades
        
        # Log completion summary
        if not state.trade_mapping:
            self.log_interaction(state, "No trades mapped overall", 
                               "No trades were mapped from any of the processed files")
        else:
            self.log_interaction(state, f"Trade mapping complete", 
                               f"Identified {len(state.trade_mapping)} trade entries overall")
        
        return state
    
    def _process_file_content(self, filename: str, content: str, state: AppState) -> List[Dict[str, Any]]:
        """Process content from a single file to identify trades."""
        
        if not content or not content.strip():
            self.log_interaction(state, f"Skipping empty content: {filename}", 
                               f"File {filename} has no content to map")
            return []
        
        self.log_interaction(state, f"Mapping trades for: {filename}", 
                           f"Processing content of {filename}")
        
        # Try LLM-enhanced mapping first
        llm_trades = self._get_llm_trade_mapping(content, filename, state)
        if llm_trades:
            self.log_interaction(state, f"LLM trade mapping successful: {filename}", 
                               f"Found {len(llm_trades)} trades using LLM analysis")
            return llm_trades
        
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
                validated_trades = []
                for trade in trades_data:
                    if isinstance(trade, dict) and "trade_name" in trade and "csi_division" in trade:
                        validated_trade = {
                            "trade_name": trade.get("trade_name", "Unknown Trade"),
                            "csi_division": trade.get("csi_division", "000000"),
                            "keywords_found": trade.get("keywords_found", []),
                            "confidence": trade.get("confidence", "medium"),
                            "description": trade.get("description", ""),
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
        mapped_trades = []
        content_lower = content.lower()

        for csi_code, keywords in self.CSI_DIVISIONS_KEYWORDS.items():
            found_keywords = []
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
    return trade_mapper_agent._map_content_to_trades_keywords(content, "test_file.txt")

def log_interaction(state: AppState, decision: str, message: str, level: str = "info") -> None:
    """Module-level function for logging interactions."""
    trade_mapper_agent.log_interaction(state, decision, message, level)

# Expose the CSI_DIVISIONS_KEYWORDS at module level for tests
CSI_DIVISIONS_KEYWORDS = TradeMapperAgent.CSI_DIVISIONS_KEYWORDS

# Legacy handle function for existing code
def handle(state_dict: dict) -> dict:
    """Legacy handle function that uses the new TradeMapperAgent class."""
    return trade_mapper_agent.handle(state_dict)

