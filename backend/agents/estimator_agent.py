# pipbycdo/backend/agents/estimator_agent.py
from backend.app.schemas import AppState, AgentTraceEntry, MeetingLogEntry, EstimateItem # Use Pydantic models
from backend.services import gpt_handler
from backend.services import llm_selector
from datetime import datetime, timezone
import json
import logging # Added standard logging
import random # For placeholder pricing
from typing import List, Dict, Any # Added for type hinting

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# If 'log' does not exist in service_logging, define a simple log function here
# This local log function should ideally be replaced by a proper logging setup
def log_interaction(state: AppState, decision: str, message: str, level: str = "info"): # Renamed and standardized
    timestamp = datetime.now(timezone.utc)
    state.agent_trace.append(AgentTraceEntry(agent="estimator", decision=decision, timestamp=timestamp))
    state.meeting_log.append(MeetingLogEntry(agent="estimator", message=message, timestamp=timestamp))
    if level == "error":
        logger.error(f"Estimator Agent: {message} - Decision: {decision}")
        state.error = message # Keep setting state.error for critical issues
    else:
        logger.info(f"Estimator Agent: {message} - Decision: {decision}")
    state.updated_at = timestamp

def get_llm_pricing(item_description: str, quantity: float, unit: str, csi_division: str, state: AppState) -> Dict[str, Any]:
    """
    Uses LLM to generate intelligent pricing for construction items.
    Returns a dictionary with 'unit_price', 'notes', and 'success' keys.
    """
    try:
        # Get LLM configuration for estimator agent
        llm_config = llm_selector.select_llm("estimator", state)
        model = llm_config.get("model") or "gpt-4"  # Ensure model is never None
        
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
- Quantity discounts or premiums
"""

        user_prompt = f"""Please provide unit pricing for this construction item:

Description: {item_description}
Quantity: {quantity}
Unit: {unit}
CSI Division: {csi_division}

Provide the unit price in USD and explain your reasoning. Consider current 2025 market conditions."""

        # Call LLM
        response = gpt_handler.run_llm(
            prompt=user_prompt,
            model=model,
            system_prompt=system_prompt,
            temperature=0.3,  # Lower temperature for more consistent pricing
            max_tokens=500
        )
        
        # Parse JSON response
        try:
            pricing_data = json.loads(response)
            
            # Validate required fields
            if "unit_price" not in pricing_data:
                raise ValueError("Missing 'unit_price' in LLM response")
            
            unit_price = float(pricing_data["unit_price"])
            notes = pricing_data.get("notes", "AI-generated pricing")
            confidence = pricing_data.get("confidence", "medium")
            
            # Sanity check pricing (should be positive and reasonable)
            if unit_price <= 0:
                raise ValueError(f"Invalid unit price: {unit_price}")
            if unit_price > 10000:  # Arbitrary upper limit, adjust as needed
                notes += f" (High price flagged: ${unit_price})"
            
            return {
                "unit_price": round(unit_price, 2),
                "notes": f"AI estimate ({confidence} confidence): {notes}",
                "success": True
            }
            
        except (json.JSONDecodeError, ValueError, KeyError) as parse_error:
            logger.warning(f"Failed to parse LLM pricing response: {parse_error}. Response: {response}")
            return {
                "unit_price": None,
                "notes": f"LLM response parsing failed: {str(parse_error)}",
                "success": False
            }
            
    except Exception as llm_error:
        logger.warning(f"LLM pricing failed: {llm_error}")
        return {
            "unit_price": None,
            "notes": f"LLM pricing unavailable: {str(llm_error)}",
            "success": False
        }

def get_placeholder_price(csi_division: str, unit: str) -> float:
    """
    Generates a placeholder unit price based on CSI division and unit.
    This is a mock function and should be replaced with actual pricing logic.
    """
    price = 10.0  # Base price
    if csi_division.startswith("03"): # Concrete
        price *= 1.5
    elif csi_division.startswith("05"): # Metals
        price *= 2.0
    elif csi_division.startswith("08"): # Openings
        price *= 1.8
    elif csi_division.startswith("09"): # Finishes
        price *= 1.2
    
    if unit in ["SF", "SQFT"]:
        price *= 0.5
    elif unit in ["CY", "CUM"]:
        price *= 10.0
    elif unit == "EA":
        price *= 1.0
    elif unit == "LS": # Lump Sum
        price *= 20.0
        
    # Add some randomness
    price *= (1 + (random.randint(-10, 10) / 100.0)) 
    return round(price, 2)

def estimate_item_price(takeoff_item: Dict[str, Any], state: AppState) -> Dict[str, Any]:
    """
    Estimates price for a single takeoff item using LLM first, then fallback to placeholder.
    Returns dict with 'unit_price' and 'notes'.
    """
    item_id = takeoff_item.get("scope_item_id", "N/A")
    description = takeoff_item.get("description", "No description provided.")
    quantity = takeoff_item.get("quantity", 0.0)
    unit = takeoff_item.get("unit", "N/A")
    csi_division = takeoff_item.get("csi_division", "000000")
    
    # Try LLM pricing first
    llm_result = get_llm_pricing(description, quantity, unit, csi_division, state)
    
    if llm_result["success"] and llm_result["unit_price"] is not None:
        log_interaction(state, f"LLM pricing successful for {item_id}", 
                       f"AI generated price: ${llm_result['unit_price']} for {description}")
        return {
            "unit_price": llm_result["unit_price"],
            "notes": llm_result["notes"]
        }
    else:
        # Fallback to placeholder pricing
        fallback_price = get_placeholder_price(csi_division, unit)
        fallback_notes = f"Placeholder pricing used. {llm_result['notes']}"
        
        log_interaction(state, f"Fallback pricing for {item_id}", 
                       f"Using placeholder price: ${fallback_price} (LLM failed: {llm_result['notes']})")
        return {
            "unit_price": fallback_price,
            "notes": fallback_notes
        }

def handle(state_dict: dict) -> dict: # Expect and return dict
    state = AppState(**state_dict) # Convert dict to Pydantic model

    log_interaction(state, "Estimator agent invoked", "Estimator agent started with LLM-enhanced pricing.")

    if not state.takeoff_data:
        error_msg = "Missing takeoff data. Estimator cannot proceed."
        log_interaction(state, "Missing takeoff data", error_msg, level="error")
        return state.model_dump()

    log_interaction(state, f"Processing {len(state.takeoff_data)} takeoff items", "Starting LLM-enhanced estimation based on takeoff data.")
    
    new_estimate_items: List[EstimateItem] = []
    successful_llm_calls = 0
    
    for takeoff_item in state.takeoff_data:
        if takeoff_item.get("csi_division") == "ERROR" or takeoff_item.get("scope_item_id", "").endswith("_ERROR") or takeoff_item.get("scope_item_id", "").startswith("ERROR") :
            log_interaction(state, f"Skipping error takeoff item: {takeoff_item.get('scope_item_id')}", 
                            f"Skipping takeoff item due to previous error: {takeoff_item.get('description')}", level="warning")
            # Optionally create an error estimate item or just skip
            new_estimate_items.append(EstimateItem(
                item=takeoff_item.get("scope_item_id", "ERROR_ITEM"),
                description=f"Skipped due to error in takeoff: {takeoff_item.get('error_message', takeoff_item.get('description'))}",
                qty=0,
                unit="N/A",
                unit_price=0.0,
                total=0.0,
                csi_division=takeoff_item.get("csi_division", "ERROR"),
                notes="Item skipped due to error in prior processing."
            ))
            continue

        item_id = takeoff_item.get("scope_item_id", "N/A")
        description = takeoff_item.get("description", "No description provided.")
        quantity = takeoff_item.get("quantity", 0.0)
        unit = takeoff_item.get("unit", "N/A")
        csi_division = takeoff_item.get("csi_division", "000000") # Default CSI if not present
        notes_from_takeoff = takeoff_item.get("notes", "")

        try:
            # Use enhanced pricing function
            pricing_result = estimate_item_price(takeoff_item, state)
            unit_price = pricing_result["unit_price"]
            pricing_notes = pricing_result["notes"]
            
            # Track successful LLM calls
            if "AI estimate" in pricing_notes:
                successful_llm_calls += 1
            
            total = round(float(quantity) * unit_price, 2)

            new_estimate_items.append(
                EstimateItem(
                    item=item_id, 
                    description=description,
                    qty=float(quantity), 
                    unit=unit,
                    unit_price=unit_price,
                    total=total,
                    csi_division=csi_division,
                    notes=f"{notes_from_takeoff} {pricing_notes}".strip()
                )
            )
            log_interaction(state, f"Estimated item: {item_id}", 
                           f"Successfully estimated item {item_id} (CSI: {csi_division}) - Qty: {quantity} {unit} @ ${unit_price}/{unit} = ${total}")

        except Exception as e:
            error_msg = f"Error estimating item {item_id}: {str(e)}"
            log_interaction(state, f"Estimation error for item {item_id}", error_msg, level="error")
            new_estimate_items.append(
                EstimateItem(
                    item=item_id,
                    description=f"Error during estimation: {description}",
                    qty=float(quantity) if quantity is not None else 0.0,
                    unit=unit,
                    unit_price=0.0,
                    total=0.0,
                    csi_division=csi_division,
                    notes=f"Failed to estimate: {str(e)}"
                )
            )
        
    state.estimate = new_estimate_items
    
    # Summary logging
    total_items = len(new_estimate_items)
    llm_success_rate = (successful_llm_calls / total_items * 100) if total_items > 0 else 0
    
    log_interaction(state, "Estimate calculation complete", 
                   f"Estimation process finished. Generated {total_items} estimate items. "
                   f"LLM pricing success rate: {llm_success_rate:.1f}% ({successful_llm_calls}/{total_items})")
    
    return state.model_dump()
