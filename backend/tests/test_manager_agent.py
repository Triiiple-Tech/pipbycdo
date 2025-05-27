import pytest
from agents import manager_agent
import importlib

def test_manager_happy_path(monkeypatch):
    # stub out estimator_agent.handle
    def fake_estimator(state):
        state["estimate"] = [{"item": "foo", "qty": 1, "unit": "u", "unit_price": 1, "total": 1}]
        return state
    monkeypatch.setattr("agents.estimator_agent.handle", fake_estimator)

    state = {"query": "Estimate this", "content": "ignored", "agent_trace": [], "meeting_log": []}
    result = manager_agent.handle(state)

    # should have delegated to estimator and injected estimate
    assert result.get("estimate") == [{"item": "foo", "qty": 1, "unit": "u", "unit_price": 1, "total": 1}]
    assert any("delegated to estimate" in log["decision"] for log in result["agent_trace"])
    assert result.get("error") is None

def test_manager_error_path():
    # unknown intent
    state = {"query": "Do nothing", "content": "", "agent_trace": [], "meeting_log": []}
    result = manager_agent.handle(state)

    assert result.get("error") is not None
    assert any("unknown intent" in log["decision"] for log in result["agent_trace"])