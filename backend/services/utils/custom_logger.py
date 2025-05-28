from datetime import datetime, timezone # Add timezone

def log_agent_turn(state, **entry):
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
