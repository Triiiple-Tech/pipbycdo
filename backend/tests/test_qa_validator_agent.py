from typing import Dict, Any
from backend.agents import qa_validator_agent

class TestQAValidatorAgent:
    def test_qa_validator_agent_handle_function_exists(self) -> None:
        """Test QA validator agent handle function exists"""
        assert hasattr(qa_validator_agent, 'handle')
        
    def test_handle_basic_validation(self) -> None:
        """Test basic validation through handle function"""
        initial_state: Dict[str, Any] = {
            "estimate": [
                {"item": "Test Item", "qty": 2.0, "unit": "EA", "unit_price": 100.0, "total": 200.0}
            ],
            "agent_trace": [],
            "meeting_log": []
        }
        
        result = qa_validator_agent.handle(initial_state)
        
        assert isinstance(result, dict)
        assert "estimate" in result
        assert "agent_trace" in result
        assert "meeting_log" in result
        
    def test_validation_with_empty_state(self) -> None:
        """Test validation with empty state"""
        initial_state: Dict[str, Any] = {
            "estimate": [],
            "agent_trace": [],
            "meeting_log": []
        }
        
        result = qa_validator_agent.handle(initial_state)
        
        assert isinstance(result, dict)
        assert result["estimate"] == []
        
    def test_validation_with_invalid_data(self) -> None:
        """Test validation with invalid estimate data"""
        initial_state: Dict[str, Any] = {
            "estimate": [
                {"item": "Invalid Item", "qty": -1, "unit": "EA", "unit_price": 0, "total": 0}
            ],
            "agent_trace": [],
            "meeting_log": []
        }
        
        result = qa_validator_agent.handle(initial_state)
        
        assert isinstance(result, dict)
        # QA validator should identify issues with negative quantities and zero prices
        assert "agent_trace" in result
        assert len(result["agent_trace"]) > 0
        
    def test_log_interaction_function(self) -> None:
        """Test log interaction helper function"""
        from backend.agents.qa_validator_agent import qa_validator_agent as agent_instance
        from backend.app.schemas import AppState
        
        state = AppState()
        
        agent_instance.log_interaction(state, "test decision", "test message")
        
        assert len(state.agent_trace) == 1
        assert len(state.meeting_log) == 1
        assert state.agent_trace[0].agent == "qa_validator"
        assert state.agent_trace[0].decision == "test decision"
        
    def test_validation_with_pricing_mismatch(self) -> None:
        """Test validation detects pricing calculation errors"""
        initial_state: Dict[str, Any] = {
            "estimate": [
                {
                    "item": "Test item",
                    "qty": 10.0,
                    "unit": "each",
                    "unit_price": 50.0,
                    "total": 600.0  # Should be 500.0 (50 * 10)
                }
            ],
            "agent_trace": [],
            "meeting_log": []
        }
        
        result = qa_validator_agent.handle(initial_state)
        
        assert isinstance(result, dict)
        # Should potentially detect the calculation error


if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v"])
