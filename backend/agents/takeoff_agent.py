# backend/agents/takeoff_agent.py
from backend.app.schemas import AppState, AgentTraceEntry, MeetingLogEntry
from datetime import datetime, timezone
import logging
import random # For generating placeholder quantities
from typing import List, Dict, Any # Added List, Dict, Any

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Placeholder units for takeoff items
COMMON_UNITS = ["LS", "EA", "SF", "LF", "CY", "TON", "GAL", "HR"]

def log_interaction(state: AppState, decision: str, message: str, level: str = "info"):
    timestamp = datetime.now(timezone.utc)
    state.agent_trace.append(AgentTraceEntry(agent="takeoff", decision=decision, timestamp=timestamp))
    state.meeting_log.append(MeetingLogEntry(agent="takeoff", message=message, timestamp=timestamp))
    if level == "error":
        logger.error(f"Takeoff Agent: {message} - Decision: {decision}")
    else:
        logger.info(f"Takeoff Agent: {message} - Decision: {decision}")
    state.updated_at = timestamp

def perform_takeoff_for_item(scope_item: Dict[str, Any]) -> Dict[str, Any]:
    """
    Placeholder logic to generate takeoff data for a single scope item.
    In a real application, this would involve complex calculations, possibly using plan data or OCR.
    """
    item_id = scope_item.get("item_id", "UNKNOWN_ITEM")
    description = scope_item.get("description", "N/A")
    csi_division = scope_item.get("csi_division", "N/A")
    source_file = scope_item.get("source_file", "N/A")

    # Simulate quantity and unit generation
    # In a real scenario, quantity might come from parsing numbers in scope_item description or external data
    quantity = scope_item.get("quantity") # Preserve if already set
    unit = scope_item.get("unit") # Preserve if already set

    if quantity is None:
        quantity = random.randint(1, 500) # Placeholder quantity
    if unit is None:
        unit = random.choice(COMMON_UNITS) # Placeholder unit

    return {
        "scope_item_id": item_id,
        "csi_division": csi_division,
        "description": description, # Carry over description for context
        "quantity": quantity,
        "unit": unit,
        "method": "Placeholder estimation", # How was this quantity derived?
        "source_file": source_file, # For traceability
        "notes": "Quantity and unit are placeholders."
    }

def handle(state_dict: dict) -> dict:
    state = AppState(**state_dict)
    log_interaction(state, "Starting quantity takeoff", f"Takeoff Agent invoked. Processing {len(state.scope_items or [])} scope items.")
    
    if not state.scope_items:
        log_interaction(state, "No scope items found", "No scope items from Scope Agent to process.", level="warning")
        state.takeoff_data = []
        log_interaction(state, "Quantity takeoff skipped", "Takeoff Agent finished due to no input.")
        return state.model_dump()

    all_takeoff_items: List[Dict[str, Any]] = []
    for scope_item in state.scope_items:
        if scope_item.get("csi_division") == "ERROR" or scope_item.get("item_id", "").startswith("SCOPE-ERROR"):
            log_interaction(state, f"Skipping error scope item: {scope_item.get('item_id')}", f"Skipping scope item with error: {scope_item.get('description')}", level="warning")
            # Optionally create an error takeoff item or just skip
            all_takeoff_items.append({
                "scope_item_id": scope_item.get("item_id", "ERROR_ITEM"),
                "csi_division": "ERROR",
                "description": f"Skipped due to error in scope item: {scope_item.get('description')}",
                "quantity": 0,
                "unit": "N/A",
                "error_message": scope_item.get('error_message') or scope_item.get('description')
            })
            continue

        log_interaction(state, f"Performing takeoff for: {scope_item.get('item_id')}", f"Processing scope item: {scope_item.get('description', 'No description')[:50]}...")
        try:
            takeoff_item_data = perform_takeoff_for_item(scope_item)
            all_takeoff_items.append(takeoff_item_data)
            log_interaction(state, f"Takeoff generated for {scope_item.get('item_id')}", f"Generated takeoff data for {scope_item.get('item_id')}: Qty {takeoff_item_data.get('quantity')} {takeoff_item_data.get('unit')}.")
        except Exception as e:
            log_interaction(state, f"Error during takeoff for {scope_item.get('item_id')}", f"Failed to perform takeoff for {scope_item.get('item_id')}: {str(e)}", level="error")
            all_takeoff_items.append({
                "scope_item_id": scope_item.get("item_id", "ERROR_PROCESSING"),
                "csi_division": scope_item.get("csi_division", "ERROR"),
                "description": f"Error during takeoff generation for '{scope_item.get('description')}': {str(e)}",
                "quantity": 0,
                "unit": "N/A",
                "error_message": str(e)
            })

    state.takeoff_data = all_takeoff_items
    
    if not state.takeoff_data:
        log_interaction(state, "No takeoff data generated overall", "No takeoff data was generated from the scope items.", level="info")
    else:
        log_interaction(state, f"Quantity takeoff complete. Total items: {len(state.takeoff_data)}", f"Takeoff Agent finished. Generated {len(state.takeoff_data)} takeoff entries overall.")
        
    return state.model_dump()
