# pipbycdo/backend/agents/estimator_agent.py
import json
from services.gpt_handler import run_llm
from services.llm_selector import select_llm
from services.utils.logging import log_agent_turn

SYSTEM_PROMPT = "You are Estimator Agent..."

def handle(state: dict) -> dict:
    content = state["content"]
    llm = select_llm("estimator", state)
    model = llm.get("model")
    if not isinstance(model, str) or not model:
        raise ValueError("Selected LLM does not have a valid 'model' string.")
    raw = run_llm(content, model=model, system_prompt=SYSTEM_PROMPT)
    try:
        estimate = json.loads(raw)
        error = None
    except Exception as e:
        estimate = []
        error = str(e)
    state["estimate"] = estimate
    log_agent_turn(
        state,
        agent="estimator",
        decision="estimate generated" if not error else "error occurred",
        raw_output=raw,
        error=error
    )
    return state