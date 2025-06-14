from backend.app.schemas import AppState, EstimateItem
from backend.agents.base_agent import BaseAgent
import json
import random
from typing import List, Dict, Any


class EstimatorAgent(BaseAgent):
    """
    Agent responsible for generating cost estimates based on takeoff data.
    Uses LLM for intelligent pricing with fallback to placeholder pricing.
    """
    
    # Brain prompt from Autonomous Agentic Manager Protocol
    BRAIN_PROMPT = """You are the EstimatorAgent. Use takeoff_data to generate a complete construction cost estimate. Apply current market pricing, labor rates, material costs, and overhead to each takeoff item. Create detailed estimate_data with line-item costs, subtotals by trade, and total project cost. Include material, labor, equipment, and markup. Provide realistic, market-competitive pricing for the construction industry."""
    
    def __init__(self):
        super().__init__("estimator")
        self.brain_prompt = self.BRAIN_PROMPT
    
    def process(self, state: AppState) -> AppState:
        """Main processing method for the estimator agent."""
        
        # Handle case where there's no takeoff data but there is content
        if not state.takeoff_data or len(state.takeoff_data) == 0:
            if state.content and state.content.strip():
                self.log_interaction(state, "No takeoff data, processing content directly", 
                                   "No takeoff data available, attempting direct estimation from content")
                return self._estimate_from_content(state)
            else:
                self.log_interaction(state, "No takeoff data", 
                                   "No takeoff data available for estimation", level="error")
                return state
        
        self.log_interaction(state, f"Processing {len(state.takeoff_data)} takeoff items", 
                           "Starting LLM-enhanced estimation based on takeoff data")
        
        # Process each takeoff item
        new_estimate_items: List[EstimateItem] = []
        successful_llm_calls = 0
        
        for takeoff_item in state.takeoff_data:
            try:
                estimate_item, used_llm = self._estimate_single_item(takeoff_item, state)
                new_estimate_items.append(estimate_item)
                
                if used_llm:
                    successful_llm_calls += 1
                    
            except Exception as e:
                error_msg = f"Error estimating item {takeoff_item.get('scope_item_id', 'unknown')}: {str(e)}"
                self.log_interaction(state, "Item estimation error", error_msg, level="error")
                
                # Create error estimate item
                new_estimate_items.append(self._create_error_estimate_item(takeoff_item, str(e)))
        
        # Update state with estimates
        state.estimate = new_estimate_items
        
        # Log summary
        total_items = len(new_estimate_items)
        llm_success_rate = (successful_llm_calls / total_items * 100) if total_items > 0 else 0
        
        self.log_interaction(state, "Estimation complete", 
                           f"Generated {total_items} estimate items. "
                           f"LLM pricing success rate: {llm_success_rate:.1f}% ({successful_llm_calls}/{total_items})")
        
        return state
    
    def _estimate_single_item(self, takeoff_item: Dict[str, Any], state: AppState) -> tuple[EstimateItem, bool]:
        """
        Estimate a single takeoff item.
        Returns tuple of (EstimateItem, used_llm_boolean).
        """
        # Extract item data
        item_id = takeoff_item.get("scope_item_id", "N/A")
        description = takeoff_item.get("description", "No description provided")
        quantity = float(takeoff_item.get("quantity", 0.0))
        unit = takeoff_item.get("unit", "N/A")
        csi_division = takeoff_item.get("csi_division", "000000")
        notes_from_takeoff = takeoff_item.get("notes", "")
        
        # Check for error items from previous stages
        if (csi_division == "ERROR" or 
            item_id.endswith("_ERROR") or 
            item_id.startswith("ERROR")):
            
            self.log_interaction(state, f"Skipping error item {item_id}", 
                               f"Skipping takeoff item due to previous error: {description}")
            
            return EstimateItem(
                item=item_id,
                description=f"Skipped due to error in takeoff: {description}",
                qty=0,
                unit=unit,
                unit_price=0.0,
                total=0.0,
                csi_division=csi_division,
                notes="Item skipped due to error in prior processing"
            ), False
        
        # Try LLM pricing first
        llm_result = self._get_llm_pricing(description, quantity, unit, csi_division, state)
        
        if llm_result["success"] and llm_result["unit_price"] is not None:
            unit_price = llm_result["unit_price"]
            pricing_notes = llm_result["notes"]
            used_llm = True
            
            self.log_interaction(state, f"LLM pricing successful for {item_id}", 
                               f"AI generated price: ${unit_price} for {description}")
        else:
            # Fallback to placeholder pricing
            unit_price = self._get_placeholder_price(csi_division, unit)
            pricing_notes = f"Placeholder pricing used. {llm_result['notes']}"
            used_llm = False
            
            self.log_interaction(state, f"Fallback pricing for {item_id}", 
                               f"Using placeholder price: ${unit_price} (LLM failed: {llm_result['notes']})")
        
        # Calculate total
        total = round(quantity * unit_price, 2)
        
        # Create estimate item
        estimate_item = EstimateItem(
            item=item_id,
            description=description,
            qty=quantity,
            unit=unit,
            unit_price=unit_price,
            total=total,
            csi_division=csi_division,
            notes=f"{notes_from_takeoff} {pricing_notes}".strip()
        )
        
        self.log_interaction(state, f"Estimated item: {item_id}", 
                           f"CSI: {csi_division} - Qty: {quantity} {unit} @ ${unit_price}/{unit} = ${total}")
        
        return estimate_item, used_llm
    
    def _get_llm_pricing(self, item_description: str, quantity: float, unit: str, 
                        csi_division: str, state: AppState) -> Dict[str, Any]:
        """
        Uses LLM to generate intelligent pricing for construction items.
        Returns a dictionary with 'unit_price', 'notes', and 'success' keys.
        """
        try:
            # Create comprehensive prompt for pricing
            system_prompt = """You are an expert construction estimator with decades of experience in pricing construction materials and labor. 
You understand CSI divisions, regional pricing variations, and current market conditions.
Your job is to provide accurate unit pricing for construction items based on the provided information.

IMPORTANT: You must respond with ONLY a valid JSON object with these exact keys:
{
    "unit_price": <numeric_value>,
    "notes": "<explanation_of_pricing_rationale>",
    "confidence": "<high|medium|low>"
}

Consider factors like:
- Material costs
- Labor requirements  
- Equipment needs
- Market conditions (2025)
- Regional variations (assume US national average)
- CSI division standards
- Quantity discounts or premiums"""

            user_prompt = f"""Please provide unit pricing for this construction item:

Description: {item_description}
Quantity: {quantity}
Unit: {unit}
CSI Division: {csi_division}

Provide the unit price in USD and explain your reasoning. Consider current 2025 market conditions."""

            # Call LLM using BaseAgent method
            response = self.call_llm(state, user_prompt, system_prompt)
            
            if not response:
                return {
                    "unit_price": None,
                    "notes": "LLM call failed",
                    "success": False
                }
            
            # Parse JSON response (handle markdown code blocks)
            try:
                # Clean response of markdown code blocks
                clean_response = response.strip()
                if clean_response.startswith("```json"):
                    clean_response = clean_response[7:]  # Remove ```json
                if clean_response.startswith("```"):
                    clean_response = clean_response[3:]  # Remove ```
                if clean_response.endswith("```"):
                    clean_response = clean_response[:-3]  # Remove trailing ```
                clean_response = clean_response.strip()
                
                pricing_data = json.loads(clean_response)
                
                # Validate required fields
                if "unit_price" not in pricing_data:
                    raise ValueError("Missing 'unit_price' in LLM response")
                
                unit_price = float(pricing_data["unit_price"])
                notes = pricing_data.get("notes", "AI-generated pricing")
                confidence = pricing_data.get("confidence", "medium")
                
                # Sanity check pricing
                if unit_price <= 0:
                    raise ValueError(f"Invalid unit price: {unit_price}")
                if unit_price > 10000:  # Flag high prices
                    notes += f" (High price flagged: ${unit_price})"
                
                return {
                    "unit_price": round(unit_price, 2),
                    "notes": f"AI estimate ({confidence} confidence): {notes}",
                    "success": True
                }
                
            except (json.JSONDecodeError, ValueError, KeyError) as parse_error:
                self.logger.warning(f"Failed to parse LLM pricing response: {parse_error}. Response: {response}")
                return {
                    "unit_price": None,
                    "notes": f"LLM response parsing failed: {str(parse_error)}",
                    "success": False
                }
                
        except Exception as llm_error:
            self.logger.warning(f"LLM pricing failed: {llm_error}")
            return {
                "unit_price": None,
                "notes": f"LLM pricing unavailable: {str(llm_error)}",
                "success": False
            }
    
    def _get_placeholder_price(self, csi_division: str, unit: str) -> float:
        """
        Generates a placeholder unit price based on CSI division and unit.
        This provides fallback pricing when LLM is unavailable.
        """
        price = 10.0  # Base price
        
        # Adjust by CSI division
        if csi_division.startswith("03"):  # Concrete
            price *= 1.5
        elif csi_division.startswith("05"):  # Metals
            price *= 2.0
        elif csi_division.startswith("08"):  # Openings
            price *= 1.8
        elif csi_division.startswith("09"):  # Finishes
            price *= 1.2
        
        # Adjust by unit
        if unit in ["SF", "SQFT"]:
            price *= 0.5
        elif unit in ["CY", "CUM"]:
            price *= 10.0
        elif unit == "EA":
            price *= 1.0
        elif unit == "LS":  # Lump Sum
            price *= 20.0
        
        # Add some variance
        price *= (1 + (random.randint(-10, 10) / 100.0))
        return round(price, 2)
    
    def _create_error_estimate_item(self, takeoff_item: Dict[str, Any], error_message: str) -> EstimateItem:
        """Create an estimate item for a failed takeoff item."""
        return EstimateItem(
            item=takeoff_item.get("scope_item_id", "ERROR_ITEM"),
            description=f"Error during estimation: {takeoff_item.get('description', 'No description')}",
            qty=float(takeoff_item.get("quantity", 0.0)) if takeoff_item.get("quantity") else 0.0,
            unit=takeoff_item.get("unit", "N/A"),
            unit_price=0.0,
            total=0.0,
            csi_division=takeoff_item.get("csi_division", "ERROR"),
            notes=f"Failed to estimate: {error_message}"
        )
    
    def _estimate_from_content(self, state: AppState) -> AppState:
        """Generate estimates directly from content when no takeoff data is available."""
        
        try:
            system_prompt = """You are an expert construction estimator. Generate cost estimates directly from project content.

IMPORTANT: Respond with ONLY a valid JSON array of estimate objects. Each object must have these exact keys:
[
    {
        "item": "<description of work item>",
        "qty": <numeric quantity>,
        "unit": "<unit of measure>",
        "unit_price": <numeric unit price>,
        "total": <qty * unit_price>
    }
]

Generate realistic construction cost estimates based on the content provided."""

            user_prompt = f"""Analyze this project content and generate realistic cost estimates:

{state.content}

Create specific, itemized estimates with quantities, units, and pricing. Focus on measurable work items."""

            response = self.call_llm(state, user_prompt, system_prompt)
            
            if response:
                import json
                
                # Clean response of markdown code blocks (same as _get_llm_pricing)
                clean_response = response.strip()
                if clean_response.startswith("```json"):
                    clean_response = clean_response[7:]  # Remove ```json
                if clean_response.startswith("```"):
                    clean_response = clean_response[3:]  # Remove ```
                if clean_response.endswith("```"):
                    clean_response = clean_response[:-3]  # Remove trailing ```
                clean_response = clean_response.strip()
                
                estimates_data = json.loads(clean_response)
                
                # Convert to EstimateItem objects
                new_estimate_items: List[EstimateItem] = []
                for item_data in estimates_data:
                    if isinstance(item_data, dict) and all(key in item_data for key in ["item", "qty", "unit", "unit_price", "total"]):
                        # Cast to dict for proper type checking
                        item_dict = item_data  # type: ignore
                        
                        # Type-safe dictionary access with defaults and explicit casting
                        item_val = item_dict.get("item", "Unknown Item")  # type: ignore
                        item_str = str(item_val) if item_val is not None else "Unknown Item"  # type: ignore
                        
                        qty_val = item_dict.get("qty", 0)  # type: ignore
                        qty_float = float(qty_val) if qty_val is not None else 0.0  # type: ignore
                        
                        unit_val = item_dict.get("unit", "EA")  # type: ignore
                        unit_str = str(unit_val) if unit_val is not None else "EA"  # type: ignore
                        
                        unit_price_val = item_dict.get("unit_price", 0)  # type: ignore
                        unit_price_float = float(unit_price_val) if unit_price_val is not None else 0.0  # type: ignore
                        
                        total_val = item_dict.get("total", 0)  # type: ignore
                        total_float = float(total_val) if total_val is not None else 0.0  # type: ignore
                        
                        estimate_item = EstimateItem(
                            item=item_str,
                            description=item_str,
                            qty=qty_float,
                            unit=unit_str,
                            unit_price=unit_price_float,
                            total=total_float,
                            csi_division="000000",  # General
                            notes="Generated from content analysis"
                        )
                        new_estimate_items.append(estimate_item)
                
                state.estimate = new_estimate_items
                
                self.log_interaction(state, "Estimation from content complete", 
                                   f"Generated {len(new_estimate_items)} estimate items from content analysis")
                return state
                
        except Exception as e:
            self.log_interaction(state, "Content estimation error", 
                               f"Error generating estimates from content: {str(e)}", level="error")
        
        # Fallback - no estimates generated
        self.log_interaction(state, "No estimates generated", 
                           "Unable to generate estimates from content", level="error")
        return state

# Create instance for backward compatibility
estimator_agent = EstimatorAgent()

# Legacy handle function for existing code
def handle(state_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Legacy handle function that uses the new EstimatorAgent class."""
    return estimator_agent.handle(state_dict)

