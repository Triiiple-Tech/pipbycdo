# pipbycdo/backend/tests/test_estimator_agent.py
from agents.estimator_agent import handle as estimator_handle
from services import gpt_handler

def test_estimator_happy_path(monkeypatch):
    # stub LLM to return a valid JSON list
    monkeypatch.setattr(
        gpt_handler,
        "run_llm",
        lambda prompt, model=None, system_prompt=None, **kw: '[{"item":"c","qty":2,"unit":"u","unit_price":3,"total":6}]'
    )

    state = {"query": "Estimate", "content": "some content", "agent_trace": [], "meeting_log": []}
    out = estimator_handle(state)

    assert isinstance(out.get("estimate"), list)
    assert out["estimate"][0]["item"] == "c"
    assert out.get("error") is None
    assert any("estimate generated" in log["decision"] for log in out["agent_trace"])

def test_estimator_error_path(monkeypatch):
    # stub LLM to return invalid JSON, triggering error
    monkeypatch.setattr(
        gpt_handler,
        "run_llm",
        lambda prompt, model=None, system_prompt=None, **kw: "not a json"
    )

    state = {"query": "Estimate", "content": "!!!", "agent_trace": [], "meeting_log": []}
    out = estimator_handle(state)

    assert out.get("estimate") == []
    assert out.get("error") is not None
    assert any("error occurred" in log["decision"] for log in out["agent_trace"])
