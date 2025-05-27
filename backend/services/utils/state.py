# pipbycdo/backend/services/utils/state.py
from datetime import datetime

def create_initial_state(query, content, files=None, metadata=None, user_id=None, session_id=None):
    return {
        "query":       query,
        "content":     content,
        "files":       files or [],
        "metadata":    metadata or {},
        "user_id":     user_id,
        "session_id":  session_id,
        "llm_config":  {},
        "meeting_log": [],
        "agent_trace": [],
        "history":     [],
        "result":      None,
        "error":       None,
        "created_at":  datetime.utcnow().isoformat(),
    }