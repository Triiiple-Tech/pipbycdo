# pipbycdo/backend/tests/test_manager_agent.py
import pytest
from backend.agents import manager_agent
from backend.app.schemas import AppState, EstimateItem # Import Pydantic models
import backend.agents.manager_agent as manager_agent_module # For patching

def test_manager_happy_path(monkeypatch):
    # stub out estimator_agent.handle
    def fake_estimator(state):
        state["estimate"] = [{"item": "foo", "qty": 1, "unit": "u", "unit_price": 1, "total": 1}]
        return state
    monkeypatch.setattr(manager_agent_module, "estimator_handle", fake_estimator)

    state_input_dict = AppState(query="Estimate this", content="ignored").model_dump()
    result_dict = manager_agent.handle(state_input_dict)
    result_state = AppState(**result_dict)

    assert result_state.estimate == [EstimateItem(item="foo", qty=1, unit="u", unit_price=1, total=1)]
    assert any("delegated to estimate" in log.decision for log in result_state.agent_trace if log.agent == "manager")
    assert result_state.error is None

def test_manager_error_path():
    # unknown intent
    state_dict = AppState(query="Do nothing", content="").model_dump()
    result_dict = manager_agent.handle(state_dict)
    result_state = AppState(**result_dict)

    assert result_state.error is not None
    assert any("unknown intent" in log.decision for log in result_state.agent_trace if log.agent == "manager" and log.level == "error")
