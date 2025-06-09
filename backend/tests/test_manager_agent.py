# pipbycdo/backend/tests/test_manager_agent.py
import pytest
from typing import Dict, Any, Optional
from backend.agents import manager_agent
from backend.app.schemas import AppState, EstimateItem # Import Pydantic models

def test_manager_happy_path(monkeypatch: pytest.MonkeyPatch) -> None:
    # Create mocks for the agents that will be called by manager
    def fake_takeoff(state_dict: Dict[str, Any]) -> Dict[str, Any]:
        state_dict["takeoff_data"] = [{"item": "foo", "qty": 1, "unit": "u"}]
        return state_dict
    
    def fake_estimator(state_dict: Dict[str, Any]) -> Dict[str, Any]:
        # Return estimate as a dictionary that can be serialized to JSON
        state_dict["estimate"] = [{"item": "foo", "qty": 1, "unit": "u", "unit_price": 1, "total": 1}]
        return state_dict
    
    # Mock run_llm to provide predictable LLM responses for enhanced routing
    def mock_run_llm(prompt: str, model: Optional[str] = None, temperature: Optional[float] = None, max_tokens: Optional[int] = None, **kwargs: Any) -> str:
        if "intent classification" in prompt.lower():
            return '{"intent": "quick_estimate", "confidence": 0.9, "reasoning": "Test wants estimation"}'
        return "Mock LLM response"
    
    monkeypatch.setattr("backend.agents.base_agent.run_llm", mock_run_llm)
    
    # Patch the manager agent's available_agents dictionary to use our mocks
    from backend.agents.manager_agent import manager_agent  # type: ignore[attr-defined]
    
    # Store original handlers
    original_takeoff = manager_agent.available_agents["takeoff"]  # type: ignore[attr-defined]
    original_estimator = _manager_agent.available_agents["estimator"]  # type: ignore[attr-defined]
    
    # Replace with mocks
    _manager_agent.available_agents["takeoff"] = (fake_takeoff, original_takeoff[1])  # type: ignore[attr-defined]
    _manager_agent.available_agents["estimator"] = (fake_estimator, original_estimator[1])  # type: ignore[attr-defined]
    
    try:
        # Test the manager agent with a typical estimation request
        # Provide scope_items so takeoff agent has required input
        state_input_dict = AppState(
            query="Estimate this", 
            content="some content",
            scope_items=[{"item": "test item", "description": "test description"}]  # Provide required input for takeoff
        ).model_dump()
        
        result_dict = manager_agent.handle(state_input_dict)
        result_state = AppState(**result_dict)

        # Manager should have executed the enhanced routing and called the mocked agents
        assert result_state.estimate == [EstimateItem(item="foo", qty=1, unit="u", unit_price=1, total=1)]
        
        # Check that manager executed successfully (enhanced routing should have run)
        assert any(log.agent == "manager" for log in result_state.agent_trace)
        assert result_state.error is None
        
    finally:
        # Restore original handlers
        _manager_agent.available_agents["takeoff"] = original_takeoff  # type: ignore[attr-defined]
        _manager_agent.available_agents["estimator"] = original_estimator  # type: ignore[attr-defined]

def test_manager_error_path() -> None:
    # Test manager handles "no action" intent gracefully
    state_dict = AppState(query="Do nothing", content="").model_dump()
    result_dict = manager_agent.handle(state_dict)
    result_state = AppState(**result_dict)

    # Enhanced routing should handle "do nothing" gracefully, not error
    assert result_state.error is None
    
    # Manager should have processed the request and logged the no-action decision
    assert any(log.agent == "manager" for log in result_state.agent_trace)
    
    # Should have meeting log entries from the manager's processing
    manager_logs = [log for log in result_state.meeting_log if log.agent == "manager"]
    assert len(manager_logs) > 0, "Manager should have logged its processing decisions"
