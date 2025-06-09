# backend/agents/takeoff_agent.py
from backend.agents.base_agent import BaseAgent
from backend.app.schemas import AppState
import logging
import random
import json
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

# Common units for takeoff items
COMMON_UNITS = ["LS", "EA", "SF", "LF", "CY", "TON", "GAL", "HR", "SY", "FT", "IN", "PT", "QT"]

class TakeoffAgent(BaseAgent):
    """
    Agent responsible for performing quantity takeoffs from scope items.
    Uses LLM to intelligently analyze scope items and generate accurate quantities.
    """
    
    # Brain prompt from Autonomous Agentic Manager Protocol
    BRAIN_PROMPT = """You are the TakeoffAgent. Accept scope_items and extract or calculate specific quantities, measurements, and units for each work item. Convert scope descriptions into quantifiable takeoff_data with precise measurements (square feet, linear feet, each, etc.). Include material quantities, labor hours, and any equipment needs. Focus on accuracy and industry-standard units of measure for construction takeoffs."""
    
    def __init__(self):
        super().__init__("takeoff")
        self.brain_prompt = self.BRAIN_PROMPT
    
    def process(self, state: AppState) -> AppState:
        """Process scope items to generate takeoff data with quantities and units."""
        self.log_interaction(state, "Starting quantity takeoff", 
                           f"Processing {len(state.scope_items or [])} scope items")
        
        # Validate required inputs
        if not state.scope_items:
            self.log_interaction(state, "No scope items found", 
                               "No scope items available for takeoff", level="error")
            state.takeoff_data = []
            return state
        
        # Initialize takeoff data list
        all_takeoff_items: List[Dict[str, Any]] = []
        
        # Process each scope item
        for scope_item in state.scope_items:
            takeoff_item = self._process_scope_item(state, scope_item)
            all_takeoff_items.append(takeoff_item)
        
        # Store results
        state.takeoff_data = all_takeoff_items
        
        # Log completion
        successful_items = [item for item in all_takeoff_items if not item.get('error_message')]
        self.log_interaction(state, "Quantity takeoff complete", 
                           f"Generated {len(successful_items)}/{len(all_takeoff_items)} successful takeoff entries")
        
        return state
    
    def _process_scope_item(self, state: AppState, scope_item: Dict[str, Any]) -> Dict[str, Any]:
        """Process a single scope item to generate takeoff data."""
        item_id = scope_item.get("item_id", "UNKNOWN_ITEM")
        description = scope_item.get("description", "N/A")
        csi_division = scope_item.get("csi_division", "N/A")
        source_file = scope_item.get("source_file", "N/A")
        
        # Check for error items
        if csi_division == "ERROR" or item_id.startswith("SCOPE-ERROR"):
            self.log_interaction(state, f"Skipping error scope item: {item_id}", 
                               f"Skipping scope item with error: {description}", level="error")
            return {
                "scope_item_id": item_id,
                "csi_division": "ERROR",
                "description": f"Skipped due to error in scope item: {description}",
                "quantity": 0,
                "unit": "N/A",
                "method": "Error - skipped",
                "source_file": source_file,
                "error_message": scope_item.get('error_message', 'Error in scope item')
            }
        
        self.log_interaction(state, f"Processing takeoff for: {item_id}", 
                           f"Analyzing scope item: {description[:50]}...")
        
        try:
            # Try LLM-enhanced takeoff first
            llm_result = self._llm_enhanced_takeoff(state, scope_item)
            if llm_result:
                return llm_result
            
            # Fallback to basic takeoff
            return self._basic_takeoff(scope_item)
            
        except Exception as e:
            error_msg = f"Failed to perform takeoff for {item_id}: {str(e)}"
            self.log_interaction(state, f"Error during takeoff for {item_id}", error_msg, level="error")
            return {
                "scope_item_id": item_id,
                "csi_division": csi_division,
                "description": f"Error during takeoff generation for '{description}': {str(e)}",
                "quantity": 0,
                "unit": "N/A",
                "method": "Error - processing failed",
                "source_file": source_file,
                "error_message": str(e)
            }
    
    def _llm_enhanced_takeoff(self, state: AppState, scope_item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Use LLM to intelligently analyze scope item and generate takeoff data."""
        if not state.llm_config or not state.llm_config.api_key:
            self.log_interaction(state, "LLM not available for takeoff", 
                               "No LLM config available, using fallback method")
            return None
        
        # Prepare context for LLM
        item_context = {
            "description": scope_item.get("description", ""),
            "csi_division": scope_item.get("csi_division", ""),
            "complexity": scope_item.get("complexity", "medium"),
            "source_file": scope_item.get("source_file", "")
        }
        
        system_prompt = """You are a construction takeoff specialist. Analyze the scope item and provide quantity takeoff data.

Your task is to:
1. Analyze the description to determine appropriate quantities and units
2. Consider the CSI division for context about the type of work
3. Extract or estimate quantities based on typical construction practices
4. Provide the most appropriate unit of measurement

Return a JSON object with the following structure:
{
    "quantity": <number>,
    "unit": "<unit_abbreviation>",
    "method": "<explanation_of_how_quantity_was_determined>",
    "confidence": "<high|medium|low>",
    "reasoning": "<brief_explanation_of_analysis>"
}

Common units: LS (lump sum), EA (each), SF (square feet), LF (linear feet), CY (cubic yards), TON, GAL, HR (hours), SY (square yards), FT (feet), etc.

If you cannot determine a reasonable quantity, use a lump sum (LS) with quantity 1."""
        
        user_prompt = f"""Analyze this construction scope item for quantity takeoff:

Description: {item_context['description']}
CSI Division: {item_context['csi_division']}
Complexity: {item_context['complexity']}
Source File: {item_context['source_file']}

Provide takeoff data in the requested JSON format."""
        
        try:
            response = self.call_llm(state, user_prompt, system_prompt)
            if not response:
                return None
            
            # Parse JSON response
            try:
                takeoff_data = json.loads(response.strip())
                
                # Validate required fields
                if not all(key in takeoff_data for key in ['quantity', 'unit', 'method']):
                    self.log_interaction(state, "Invalid LLM takeoff response", 
                                       "LLM response missing required fields")
                    return None
                
                # Build result
                result: Dict[str, Any] = {
                    "scope_item_id": scope_item.get("item_id", "UNKNOWN_ITEM"),
                    "csi_division": scope_item.get("csi_division", "N/A"),
                    "description": scope_item.get("description", "N/A"),
                    "quantity": takeoff_data.get("quantity", 1),
                    "unit": takeoff_data.get("unit", "LS"),
                    "method": f"LLM Analysis: {takeoff_data.get('method', 'AI-generated')}",
                    "source_file": scope_item.get("source_file", "N/A"),
                    "confidence": takeoff_data.get("confidence", "medium"),
                    "reasoning": takeoff_data.get("reasoning", "AI analysis")
                }
                
                self.log_interaction(state, f"LLM takeoff successful for {scope_item.get('item_id')}", 
                                   f"Generated quantity: {result['quantity']} {result['unit']} "
                                   f"(confidence: {str(result.get('confidence', 'unknown'))})")  # type: ignore
                return result
                
            except json.JSONDecodeError as e:
                self.log_interaction(state, "LLM takeoff JSON parse error", 
                                   f"Failed to parse LLM response as JSON: {str(e)}")
                return None
                
        except Exception as e:
            self.log_interaction(state, "LLM takeoff error", 
                               f"Error during LLM takeoff analysis: {str(e)}")
            return None
    
    def _basic_takeoff(self, scope_item: Dict[str, Any]) -> Dict[str, Any]:
        """Generate basic takeoff data using rule-based approach."""
        item_id = scope_item.get("item_id", "UNKNOWN_ITEM")
        description = scope_item.get("description", "N/A")
        csi_division = scope_item.get("csi_division", "N/A")
        source_file = scope_item.get("source_file", "N/A")
        
        # Use existing quantities if available
        quantity = scope_item.get("quantity")
        unit = scope_item.get("unit")
        
        # Generate placeholder quantities if not provided
        if quantity is None:
            # Try to extract numbers from description
            import re
            numbers = re.findall(r'\d+(?:\.\d+)?', description)
            if numbers:
                quantity = float(numbers[0])
            else:
                quantity = random.randint(1, 500)  # Placeholder
        
        if unit is None:
            # Try to determine unit based on CSI division or description
            unit = self._determine_unit_from_context(description, csi_division)
        
        return {
            "scope_item_id": item_id,
            "csi_division": csi_division,
            "description": description,
            "quantity": quantity,
            "unit": unit,
            "method": "Basic estimation - placeholder quantities",
            "source_file": source_file,
            "notes": "Quantity and unit generated using basic rules"
        }
    
    def _determine_unit_from_context(self, description: str, csi_division: str) -> str:
        """Determine appropriate unit based on description and CSI division."""
        description_lower = description.lower()
        
        # Area-based work
        if any(word in description_lower for word in ['floor', 'wall', 'ceiling', 'roof', 'paint', 'tile']):
            return "SF"
        
        # Linear work
        if any(word in description_lower for word in ['pipe', 'conduit', 'trim', 'molding', 'linear']):
            return "LF"
        
        # Volume work
        if any(word in description_lower for word in ['concrete', 'excavation', 'fill', 'cubic']):
            return "CY"
        
        # Count-based work
        if any(word in description_lower for word in ['fixture', 'door', 'window', 'outlet', 'switch']):
            return "EA"
        
        # CSI division-based defaults
        if csi_division:
            div_code = csi_division[:2] if len(csi_division) >= 2 else ""
            csi_unit_map = {
                "01": "LS",  # General Requirements
                "02": "CY",  # Existing Conditions
                "03": "CY",  # Concrete
                "04": "SF",  # Masonry
                "05": "TON", # Metals
                "06": "SF",  # Wood, Plastics, and Composites
                "07": "SF",  # Thermal and Moisture Protection
                "08": "EA",  # Openings
                "09": "SF",  # Finishes
                "10": "EA",  # Specialties
                "11": "EA",  # Equipment
                "12": "EA",  # Furnishings
                "13": "EA",  # Special Construction
                "14": "EA",  # Conveying Equipment
                "21": "LF",  # Fire Suppression
                "22": "LF",  # Plumbing
                "23": "LF",  # HVAC
                "26": "LF",  # Electrical
                "27": "EA",  # Communications
                "28": "EA",  # Electronic Safety and Security
            }
            if div_code in csi_unit_map:
                return csi_unit_map[div_code]
        
        # Default fallback
        return random.choice(COMMON_UNITS)


# Create singleton instance
takeoff_agent = TakeoffAgent()

# Backward compatibility function
def handle(state_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Legacy handle function for backward compatibility."""
    return takeoff_agent.handle(state_dict)
