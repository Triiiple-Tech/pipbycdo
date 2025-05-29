# backend/agents/trade_mapper_agent.py
from backend.app.schemas import AppState, AgentTraceEntry, MeetingLogEntry
from datetime import datetime, timezone
import logging
import re # For basic keyword spotting
from typing import Any, List, Dict # Added Any, List, Dict

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Basic placeholder for CSI divisions - in a real scenario, this would be more extensive
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

def log_interaction(state: AppState, decision: str, message: str, level: str = "info"):
    timestamp = datetime.now(timezone.utc)
    state.agent_trace.append(AgentTraceEntry(agent="trade_mapper", decision=decision, timestamp=timestamp))
    state.meeting_log.append(MeetingLogEntry(agent="trade_mapper", message=message, timestamp=timestamp))
    if level == "error":
        logger.error(f"Trade Mapper Agent: {message} - Decision: {decision}")
    else:
        logger.info(f"Trade Mapper Agent: {message} - Decision: {decision}")
    state.updated_at = timestamp

def map_content_to_trades(file_content: str) -> List[Dict[str, Any]]: # Changed to List[Dict[str, Any]]
    """
    Placeholder logic to map content to trades using keyword spotting.
    In a real application, this would involve more sophisticated NLP/LLM calls.
    """
    mapped_trades = []
    # Convert content to lowercase for case-insensitive matching
    content_lower = file_content.lower()

    for csi_code, keywords in CSI_DIVISIONS_KEYWORDS.items():
        found_keywords = []
        for keyword in keywords:
            # Use regex to find whole words to avoid partial matches (e.g., "cat" in "caterpillar")
            if re.search(r'\\b' + re.escape(keyword.lower()) + r'\\b', content_lower):
                found_keywords.append(keyword)
        
        if found_keywords:
            mapped_trades.append({
                "trade_name": f"Trade related to CSI {csi_code}",
                "csi_division": csi_code,
                "keywords_found": found_keywords,
                "source_excerpt": content_lower[:200] + "..." # Placeholder for relevant excerpt
            })
            
    if not mapped_trades and content_lower.strip(): # If no specific keywords found but content exists
        mapped_trades.append({
            "trade_name": "General Construction/Uncategorized",
            "csi_division": "000000", # Placeholder for general/uncategorized
            "keywords_found": [],
            "source_excerpt": content_lower[:200] + "..."
        })
        
    return mapped_trades

def handle(state_dict: dict) -> dict:
    state = AppState(**state_dict)
    log_interaction(state, "Starting trade mapping", f"Trade Mapper Agent invoked. Processing {len(state.processed_files_content or {})} files.")
    
    if not state.processed_files_content:
        log_interaction(state, "No processed file content found", "No content from File Reader Agent to process.", level="warning")
        state.trade_mapping = []
        log_interaction(state, "Trade mapping skipped", "Trade Mapper Agent finished due to no input.")
        return state.model_dump()

    all_trades: List[Dict[str, Any]] = [] # Added type hint
    for filename, content in state.processed_files_content.items():
        if not content or not content.strip():
            log_interaction(state, f"Skipping empty content for {filename}", f"File {filename} has no content to map.", level="info")
            continue
        
        log_interaction(state, f"Mapping trades for {filename}", f"Processing content of {filename}.")
        try:
            trades_from_file = map_content_to_trades(content)
            if trades_from_file:
                # Add filename to each trade for traceability
                for trade in trades_from_file:
                    trade["source_file"] = filename
                all_trades.extend(trades_from_file)
                log_interaction(state, f"Trades mapped for {filename}", f"Found {len(trades_from_file)} potential trade(s) in {filename}.")
            else:
                log_interaction(state, f"No trades mapped for {filename}", f"No specific trades identified in {filename} based on keywords.", level="info")
        except Exception as e:
            log_interaction(state, f"Error mapping trades for {filename}", f"Failed to map trades for {filename}: {str(e)}", level="error")
            # Optionally, add an error entry to the trade_mapping or handle differently
            all_trades.append({
                "trade_name": "Error in Processing",
                "csi_division": "ERROR",
                "keywords_found": [],
                "source_file": filename,
                "error_message": str(e)
            })

    state.trade_mapping = all_trades
    
    if not state.trade_mapping:
        log_interaction(state, "No trades mapped overall", "No trades were mapped from any of the processed files.", level="info")
    else:
        log_interaction(state, f"Trade mapping complete. Total trades: {len(state.trade_mapping)}", f"Trade Mapper Agent finished. Identified {len(state.trade_mapping)} trade entries overall.")
        
    return state.model_dump()
