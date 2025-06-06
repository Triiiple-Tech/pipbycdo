import pytest
from typing import Dict, Any
from unittest.mock import patch
from backend.agents.estimator_agent import handle as estimator_handle
from backend.app.schemas import AppState

def test_estimator_happy_path() -> None:
    """Test estimator agent with successful LLM response"""
    with patch("backend.agents.base_agent.run_llm") as mock_llm:
        mock_llm.return_value = '[{"item":"Test Item","qty":2,"unit":"EA","unit_price":100.0,"total":200.0}]'
        
        state_dict: Dict[str, Any] = AppState(
            query="Estimate", 
            content="some content"
        ).model_dump()
        
        out_dict = estimator_handle(state_dict)
        out_state = AppState(**out_dict)

        assert out_state.estimate is not None
        assert len(out_state.estimate) == 1
        assert out_state.estimate[0].item == "Test Item"
        assert out_state.estimate[0].qty == 2.0
        assert out_state.estimate[0].unit == "EA"
        assert out_state.estimate[0].unit_price == 100.0
        assert out_state.estimate[0].total == 200.0
        assert out_state.error is None
        # Check that estimator agent ran successfully (look for any completion message)
        assert any(log.agent == "estimator" for log in out_state.agent_trace)

def test_estimator_error_path() -> None:
    """Test estimator agent with LLM error"""
    with patch("backend.agents.base_agent.run_llm") as mock_llm:
        mock_llm.side_effect = Exception("LLM error")
        
        state_dict: Dict[str, Any] = AppState(
            query="Estimate", 
            content="some content"
        ).model_dump()
        
        out_dict = estimator_handle(state_dict)
        out_state = AppState(**out_dict)

        assert out_state.error is not None
        assert ("LLM error" in str(out_state.error) or "Unable to generate estimates" in str(out_state.error))
        assert out_state.estimate is None or len(out_state.estimate) == 0

def test_estimator_invalid_json() -> None:
    """Test estimator agent with invalid JSON response from LLM"""
    with patch("backend.agents.base_agent.run_llm") as mock_llm:
        mock_llm.return_value = "invalid json response"
        
        state_dict: Dict[str, Any] = AppState(
            query="Estimate", 
            content="some content"
        ).model_dump()
        
        out_dict = estimator_handle(state_dict)
        out_state = AppState(**out_dict)

        # Should handle JSON parsing error gracefully
        assert out_state.error is not None or out_state.estimate is None

def test_estimator_empty_response() -> None:
    """Test estimator agent with empty response from LLM"""
    with patch("backend.agents.base_agent.run_llm") as mock_llm:
        mock_llm.return_value = "[]"
        
        state_dict: Dict[str, Any] = AppState(
            query="Estimate", 
            content="some content"
        ).model_dump()
        
        out_dict = estimator_handle(state_dict)
        out_state = AppState(**out_dict)

        assert out_state.estimate is not None
        assert len(out_state.estimate) == 0
        assert out_state.error is None


def test_estimator_invalid_json_format() -> None:
    """Test estimator agent with non-JSON response format"""
    with patch("backend.agents.base_agent.run_llm") as mock_llm:
        mock_llm.return_value = 'not a json'
        
        state_dict = AppState(query="Estimate", content="some content").model_dump()
        out_dict = estimator_handle(state_dict)
        out_state = AppState(**out_dict)

        assert out_state.error is not None
        assert "Failed to generate estimates from content" in out_state.error or "Unable to generate estimates" in out_state.error
        assert any(log.agent == "estimator" and log.level == "error" for log in out_state.agent_trace)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
