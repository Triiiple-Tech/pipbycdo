# pipbycdo/backend/agents/manager_agent.py
from services.utils.logging import log_agent_turn
import importlib

AGENTS = {
    "estimate": "agents.estimator_agent",
    "export":   "agents.exporter_agent",
}

from typing import Optional

def detect_intent(query: str) -> Optional[str]:
    q = query.lower()
    if "export" in q:
        return "export"
    if "estimate" in q:
        return "estimate"
    return None

def handle(state: dict) -> dict:
    intent = detect_intent(state["query"])
    log_agent_turn(state, agent="manager", decision=f"intent detected: {intent}")
    if not intent or intent not in AGENTS:
        log_agent_turn(state, agent="manager", decision="unknown intent", error="No matching intent", level="error")
        return state
    module = importlib.import_module(AGENTS[intent])
    state = module.handle(state)
    log_agent_turn(state, agent="manager", decision=f"delegated to {intent}")
    return state