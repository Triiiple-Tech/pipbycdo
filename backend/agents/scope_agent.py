# backend/agents/scope_agent.py
from backend.app.schemas import AppState, AgentTraceEntry, MeetingLogEntry
from datetime import datetime, timezone
import logging
from typing import List, Dict, Any # Added List, Dict, Any

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def log_interaction(state: AppState, decision: str, message: str, level: str = "info"):
    timestamp = datetime.now(timezone.utc)
    state.agent_trace.append(AgentTraceEntry(agent="scope", decision=decision, timestamp=timestamp))
    state.meeting_log.append(MeetingLogEntry(agent="scope", message=message, timestamp=timestamp))
    if level == "error":
        logger.error(f"Scope Agent: {message} - Decision: {decision}")
    else:
        logger.info(f"Scope Agent: {message} - Decision: {decision}")
    state.updated_at = timestamp

def generate_scope_items(trade_info: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Placeholder logic to generate scope items from a single trade entry.
    In a real application, this would involve more detailed parsing or LLM calls.
    """
    scope_items = []
    csi_division = trade_info.get("csi_division", "N/A")
    trade_name = trade_info.get("trade_name", "Unspecified Trade")
    keywords_found = trade_info.get("keywords_found", [])
    source_file = trade_info.get("source_file", "N/A")
    source_excerpt = trade_info.get("source_excerpt", "N/A")

    if not keywords_found and csi_division != "000000": # If specific keywords led to this trade
        # Create a general scope item for the trade
        scope_items.append({
            "item_id": f"SCOPE-{csi_division}-GENERAL",
            "trade_name": trade_name,
            "csi_division": csi_division,
            "description": f"General scope for {trade_name} (CSI {csi_division}) based on document analysis.",
            "details": f"Identified in file: {source_file}. Excerpt: {source_excerpt[:100]}...",
            "quantity": None, # To be determined by Takeoff Agent
            "unit": None, # To be determined by Takeoff Agent
            "source_file": source_file,
            "related_keywords": []
        })
    else:
        # Create a scope item for each keyword found, or a general one if no keywords
        if not keywords_found:
             keywords_found.append("general scope") # Default if no keywords but trade was mapped

        for i, keyword in enumerate(keywords_found):
            scope_items.append({
                "item_id": f"SCOPE-{csi_division}-{keyword.replace(' ', '_').upper()}-{i}",
                "trade_name": trade_name,
                "csi_division": csi_division,
                "description": f"Scope item related to '{keyword}' for {trade_name}.",
                "details": f"Identified in file: {source_file}. Based on keyword: '{keyword}'. Excerpt: {source_excerpt[:100]}...",
                "quantity": None, # To be determined by Takeoff Agent
                "unit": None, # To be determined by Takeoff Agent
                "source_file": source_file,
                "related_keywords": [keyword]
            })
    return scope_items

def handle(state_dict: dict) -> dict:
    state = AppState(**state_dict)
    log_interaction(state, "Starting scope extraction", f"Scope Agent invoked. Processing {len(state.trade_mapping or [])} trade entries.")
    
    if not state.trade_mapping:
        log_interaction(state, "No trade mapping found", "No trade mapping from Trade Mapper Agent to process.", level="warning")
        state.scope_items = []
        log_interaction(state, "Scope extraction skipped", "Scope Agent finished due to no input.")
        return state.model_dump()

    all_scope_items: List[Dict[str, Any]] = []
    for trade_entry in state.trade_mapping:
        if trade_entry.get("csi_division") == "ERROR":
            log_interaction(state, f"Skipping error entry from trade mapping", f"Skipping trade entry with error: {trade_entry.get('error_message')}", level="warning")
            # Optionally create an error scope item
            all_scope_items.append({
                "item_id": f"SCOPE-ERROR-{trade_entry.get('source_file', 'UNKNOWN_FILE')}",
                "trade_name": "Processing Error",
                "csi_division": "ERROR",
                "description": f"Failed to process trade information from {trade_entry.get('source_file')}. Error: {trade_entry.get('error_message')}",
                "source_file": trade_entry.get('source_file', 'UNKNOWN_FILE')
            })
            continue

        log_interaction(state, f"Extracting scope for trade: {trade_entry.get('trade_name')}", f"Processing trade: {trade_entry.get('trade_name')} (CSI: {trade_entry.get('csi_division')}) from file {trade_entry.get('source_file')}.")
        try:
            items = generate_scope_items(trade_entry)
            if items:
                all_scope_items.extend(items)
                log_interaction(state, f"Scope items generated for {trade_entry.get('trade_name')}", f"Generated {len(items)} scope item(s) for {trade_entry.get('trade_name')}.")
            else:
                log_interaction(state, f"No scope items generated for {trade_entry.get('trade_name')}", f"No specific scope items derived from {trade_entry.get('trade_name')}.", level="info")
        except Exception as e:
            log_interaction(state, f"Error extracting scope for {trade_entry.get('trade_name')}", f"Failed to extract scope for {trade_entry.get('trade_name')}: {str(e)}", level="error")
            all_scope_items.append({
                "item_id": f"SCOPE-PROCESSING_ERROR-{trade_entry.get('csi_division', 'UNKNOWN_CSI')}",
                "trade_name": trade_entry.get('trade_name', 'Unknown Trade'),
                "csi_division": trade_entry.get('csi_division', 'ERROR'),
                "description": f"Error during scope generation for trade '{trade_entry.get('trade_name')}': {str(e)}",
                "source_file": trade_entry.get('source_file', 'N/A'),
                "error_message": str(e)
            })

    state.scope_items = all_scope_items
    
    if not state.scope_items:
        log_interaction(state, "No scope items extracted overall", "No scope items were extracted from the trade mapping.", level="info")
    else:
        log_interaction(state, f"Scope extraction complete. Total items: {len(state.scope_items)}", f"Scope Agent finished. Identified {len(state.scope_items)} scope items overall.")
        
    return state.model_dump()
