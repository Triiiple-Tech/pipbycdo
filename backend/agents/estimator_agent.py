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

def handle(state_dict: dict) -> dict: # Expect and return dict
    state = AppState(**state_dict) # Convert dict to Pydantic model

    log_interaction(state, "Estimator agent invoked", "Estimator agent started.")

    if not state.takeoff_data:
        error_msg = "Missing takeoff data. Estimator cannot proceed."
        log_interaction(state, "Missing takeoff data", error_msg, level="error")
        return state.model_dump()

    log_interaction(state, f"Processing {len(state.takeoff_data)} takeoff items", "Starting estimation based on takeoff data.")
    
    new_estimate_items: List[EstimateItem] = []
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
            # Placeholder pricing logic
            unit_price = get_placeholder_price(csi_division, unit)
            total = round(float(quantity) * unit_price, 2)

            new_estimate_items.append(
                EstimateItem(
                    item=item_id, 
                    description=description,
                    qty=float(quantity), 
                    unit=unit,
                    unit_price=unit_price,
                    total=total,
                    csi_division=csi_division, # Pass CSI division
                    notes=f"{notes_from_takeoff} Unit price is a placeholder.".strip() # Corrected variable name
                )
            )
            log_interaction(state, f"Estimated item: {item_id}", f"Successfully estimated item {item_id} (CSI: {csi_division}) - Qty: {quantity} {unit} @ ${unit_price}/{unit} = ${total}")

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
    log_interaction(state, "Estimate calculation complete", f"Estimation process finished. Generated {len(new_estimate_items)} estimate items.")
    
    return state.model_dump()
