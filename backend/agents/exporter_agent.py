# pipbycdo/backend/agents/exporter_agent.py
from services.utils.logging import log_agent_turn

def handle(state: dict) -> dict:
    estimate = state.get("estimate", [])
    # dummy exporter: echo back
    state["export"] = f"Ready to export {len(estimate)} items"
    log_agent_turn(state, agent="exporter", decision="export done")
    return state