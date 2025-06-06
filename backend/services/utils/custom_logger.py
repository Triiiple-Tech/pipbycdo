from datetime import datetime, timezone # Add timezone
from typing import Dict, Any

def log_agent_turn(state: Dict[str, Any], **entry: Any) -> Dict[str, Any]:
    entry.setdefault("timestamp", datetime.now(timezone.utc).isoformat())
    state.setdefault("agent_trace", []).append(entry)
    state.setdefault("meeting_log", []).append({
        "agent": entry.get("agent"),
        "message": entry.get("decision"),
        "timestamp": entry["timestamp"]
    })
    if entry.get("error"):
        state["error"] = entry["error"]
    return state
