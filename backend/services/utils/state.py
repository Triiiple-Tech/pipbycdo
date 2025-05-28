from typing import Optional, List, Dict, Any
from datetime import datetime, timezone

def create_initial_state(
    query: Optional[str] = None,
    content: Optional[str] = None,
    files: Optional[List[Dict[str, Any]]] = None,
    metadata: Optional[Dict[str, Any]] = None,
    user_id: Optional[str] = None,
    session_id: Optional[str] = None,
    estimate: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    current_time = datetime.now(timezone.utc).isoformat()
    initial_state: Dict[str, Any] = {
        "query": query,
        "content": content,
        "files": files if files is not None else [],
        "metadata": metadata if metadata is not None else {},
        "user_id": user_id,
        "session_id": session_id,
        "estimate": estimate if estimate is not None else [],
        "agent_trace": [],
        "meeting_log": [],
        "created_at": current_time,
        "updated_at": current_time,
        "error": None,
    }
    return initial_state
