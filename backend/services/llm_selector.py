# pipbycdo/backend/services/llm_selector.py
import os

AGENT_MODELS = {
    "manager":   os.getenv("MANAGER_MODEL", "o4-mini"),
    "estimator": os.getenv("ESTIMATOR_MODEL", "gpt-4o"),
    "exporter":  os.getenv("EXPORTER_MODEL", "gpt-4o"),
}

def select_llm(agent_name, state):
    return {"model": AGENT_MODELS.get(agent_name), "api_key": os.getenv("OPENAI_API_KEY")}