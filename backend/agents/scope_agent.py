from backend.app.schemas import AppState
from backend.agents.base_agent import BaseAgent
from typing import List, Dict, Any


class ScopeAgent(BaseAgent):
    """
    Agent responsible for extracting detailed scope items from trade mappings.
    Analyzes trade information to create specific work scope items.
    """
    
    def __init__(self):
        super().__init__("scope")
    
    def process(self, state: AppState) -> AppState:
        """Main processing method for the scope agent."""
        
        self.log_interaction(state, "Starting scope extraction", 
                           f"Scope Agent invoked. Processing {len(state.trade_mapping or [])} trade entries")
        
        # Check if there's trade mapping to process
        if not state.trade_mapping:
            self.log_interaction(state, "No trade mapping found", 
                               "No trade mapping from Trade Mapper Agent to process", level="error")
            state.scope_items = []
            return state
        
        # Process each trade entry
        all_scope_items: List[Dict[str, Any]] = []
        for trade_entry in state.trade_mapping:
            try:
                scope_items = self._process_trade_entry(trade_entry, state)
                all_scope_items.extend(scope_items)
            except Exception as e:
                error_msg = f"Error extracting scope for {trade_entry.get('trade_name', 'unknown')}: {str(e)}"
                self.log_interaction(state, f"Scope extraction error", error_msg, level="error")
                
                # Add error scope item
                all_scope_items.append(self._create_error_scope_item(trade_entry, str(e)))
        
        # Update state with scope items
        state.scope_items = all_scope_items
        
        # Log completion summary
        if not state.scope_items:
            self.log_interaction(state, "No scope items extracted", 
                               "No scope items were extracted from the trade mapping")
        else:
            self.log_interaction(state, f"Scope extraction complete", 
                               f"Identified {len(state.scope_items)} scope items overall")
        
        return state
    
    def _process_trade_entry(self, trade_entry: Dict[str, Any], state: AppState) -> List[Dict[str, Any]]:
        """Process a single trade entry to extract scope items."""
        
        # Skip error entries from previous stages
        if trade_entry.get("csi_division") == "ERROR":
            self.log_interaction(state, f"Skipping error entry", 
                               f"Skipping trade entry with error: {trade_entry.get('error_message')}")
            return [self._create_error_scope_item(trade_entry, trade_entry.get('error_message', 'Unknown error'))]
        
        trade_name = trade_entry.get('trade_name', 'Unknown Trade')
        csi_division = trade_entry.get('csi_division', 'N/A')
        
        self.log_interaction(state, f"Extracting scope for: {trade_name}", 
                           f"Processing trade: {trade_name} (CSI: {csi_division})")
        
        # Try LLM-enhanced scope extraction first
        llm_scope_items = self._get_llm_scope_extraction(trade_entry, state)
        if llm_scope_items:
            self.log_interaction(state, f"LLM scope extraction successful: {trade_name}", 
                               f"Generated {len(llm_scope_items)} scope items using LLM analysis")
            return llm_scope_items
        
        # Fallback to keyword-based scope generation
        keyword_scope_items = self._generate_scope_items_keywords(trade_entry)
        
        if keyword_scope_items:
            self.log_interaction(state, f"Keyword scope extraction: {trade_name}", 
                               f"Generated {len(keyword_scope_items)} scope items using keyword analysis")
        else:
            self.log_interaction(state, f"No scope items generated: {trade_name}", 
                               f"No specific scope items derived from {trade_name}")
        
        return keyword_scope_items
    
    def _get_llm_scope_extraction(self, trade_entry: Dict[str, Any], state: AppState) -> List[Dict[str, Any]]:
        """Use LLM to intelligently extract detailed scope items from trade information."""
        
        try:
            system_prompt = """You are an expert construction scope analyst. Your task is to break down trade information into specific, actionable scope items for construction takeoff and estimation.

IMPORTANT: Respond with ONLY a valid JSON array of scope item objects. Each object must have these exact keys:
[
    {
        "item_id": "<unique identifier>",
        "description": "<detailed work description>",
        "trade_name": "<trade name>",
        "csi_division": "<6-digit CSI code>",
        "work_type": "<material|labor|equipment|lump_sum>",
        "estimated_unit": "<likely unit of measure like SF, LF, EA, CY, etc>",
        "complexity": "<low|medium|high>",
        "notes": "<additional details or considerations>"
    }
]

Create specific, measurable scope items that a takeoff specialist could quantify. Focus on work that can be estimated with quantities and units."""

            trade_name = trade_entry.get('trade_name', 'Unknown')
            csi_division = trade_entry.get('csi_division', '000000')
            keywords = trade_entry.get('keywords_found', [])
            source_info = trade_entry.get('description', trade_entry.get('source_excerpt', ''))
            
            user_prompt = f"""Analyze this trade information and create detailed scope items:

Trade: {trade_name}
CSI Division: {csi_division}
Keywords Found: {', '.join(keywords) if keywords else 'None'}
Source Information: {source_info}

Break this down into specific, measurable scope items that can be quantified for estimation. Each item should represent work that can be counted, measured, or estimated."""

            response = self.call_llm(state, user_prompt, system_prompt)
            
            if response:
                import json
                scope_data = json.loads(response)
                
                # Validate and clean the response
                validated_scope_items = []
                for item in scope_data:
                    if isinstance(item, dict) and "item_id" in item and "description" in item:
                        validated_item = {
                            "item_id": item.get("item_id", f"SCOPE-{csi_division}-AUTO"),
                            "description": item.get("description", "Generated scope item"),
                            "trade_name": item.get("trade_name", trade_name),
                            "csi_division": item.get("csi_division", csi_division),
                            "work_type": item.get("work_type", "material"),
                            "estimated_unit": item.get("estimated_unit", "EA"),
                            "complexity": item.get("complexity", "medium"),
                            "notes": item.get("notes", ""),
                            "source_file": trade_entry.get("source_file", "N/A"),
                            "extraction_method": "LLM",
                            "quantity": None,  # To be determined by Takeoff Agent
                            "unit": item.get("estimated_unit", "EA")  # Initial estimate
                        }
                        validated_scope_items.append(validated_item)
                
                return validated_scope_items
                
        except Exception as e:
            self.logger.warning(f"LLM scope extraction failed for {trade_entry.get('trade_name')}: {e}")
            return []
        
        return []
    
    def _generate_scope_items_keywords(self, trade_entry: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Fallback method: Generate scope items using keyword-based analysis.
        """
        scope_items = []
        csi_division = trade_entry.get("csi_division", "N/A")
        trade_name = trade_entry.get("trade_name", "Unspecified Trade")
        keywords_found = trade_entry.get("keywords_found", [])
        source_file = trade_entry.get("source_file", "N/A")
        source_excerpt = trade_entry.get("source_excerpt", "N/A")

        if not keywords_found and csi_division != "000000":
            # Create a general scope item for the trade
            scope_items.append({
                "item_id": f"SCOPE-{csi_division}-GENERAL",
                "trade_name": trade_name,
                "csi_division": csi_division,
                "description": f"General scope for {trade_name} (CSI {csi_division}) based on document analysis",
                "details": f"Identified in file: {source_file}. Excerpt: {source_excerpt[:100]}...",
                "quantity": None,  # To be determined by Takeoff Agent
                "unit": None,  # To be determined by Takeoff Agent
                "source_file": source_file,
                "related_keywords": [],
                "extraction_method": "keyword"
            })
        else:
            # Create scope items based on keywords found
            if not keywords_found:
                keywords_found = ["general scope"]  # Default if no keywords

            for i, keyword in enumerate(keywords_found):
                scope_items.append({
                    "item_id": f"SCOPE-{csi_division}-{keyword.replace(' ', '_').upper()}-{i}",
                    "trade_name": trade_name,
                    "csi_division": csi_division,
                    "description": f"Scope item related to '{keyword}' for {trade_name}",
                    "details": f"Identified in file: {source_file}. Based on keyword: '{keyword}'. Excerpt: {source_excerpt[:100]}...",
                    "quantity": None,  # To be determined by Takeoff Agent
                    "unit": None,  # To be determined by Takeoff Agent
                    "source_file": source_file,
                    "related_keywords": [keyword],
                    "extraction_method": "keyword"
                })
        
        return scope_items
    
    def _create_error_scope_item(self, trade_entry: Dict[str, Any], error_message: str) -> Dict[str, Any]:
        """Create an error scope item for failed trade processing."""
        return {
            "item_id": f"SCOPE-ERROR-{trade_entry.get('source_file', 'UNKNOWN_FILE')}",
            "trade_name": "Processing Error",
            "csi_division": "ERROR",
            "description": f"Failed to process trade information from {trade_entry.get('source_file')}",
            "source_file": trade_entry.get('source_file', 'UNKNOWN_FILE'),
            "error_message": error_message,
            "extraction_method": "error"
        }


# Create instance for backward compatibility
scope_agent = ScopeAgent()

# Legacy handle function for existing code
def handle(state_dict: dict) -> dict:
    """Legacy handle function that uses the new ScopeAgent class."""
    return scope_agent.handle(state_dict)
