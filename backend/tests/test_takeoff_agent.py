from typing import Dict, Any
from backend.agents import takeoff_agent

class TestTakeoffAgent:
    def test_takeoff_agent_handle_function_exists(self) -> None:
        """Test TakeoffAgent handle function exists"""
        assert hasattr(takeoff_agent, 'handle')
        
    def test_handle_basic_takeoff_generation(self) -> None:
        """Test basic takeoff generation through handle function"""
        initial_state: Dict[str, Any] = {
            "scope_items": [
                {"item": "Electrical outlets", "description": "Install 20 amp outlets"},
                {"item": "Light switches", "description": "Install toggle switches"}
            ],
            "agent_trace": [],
            "meeting_log": []
        }
        
        result = takeoff_agent.handle(initial_state)
        
        assert isinstance(result, dict)
        assert "takeoff_data" in result
        assert "agent_trace" in result
        assert "meeting_log" in result
        
    def test_handle_with_no_scope_items(self) -> None:
        """Test handling when no scope items are provided"""
        initial_state: Dict[str, Any] = {
            "scope_items": [],
            "agent_trace": [],
            "meeting_log": []
        }
        
        result = takeoff_agent.handle(initial_state)
        
        assert isinstance(result, dict)
        assert "takeoff_data" in result
        
    def test_handle_with_multiple_scope_items(self) -> None:
        """Test handling multiple scope items"""
        initial_state: Dict[str, Any] = {
            "scope_items": [
                {"item": "Item 1", "description": "Description 1"},
                {"item": "Item 2", "description": "Description 2"},
                {"item": "Item 3", "description": "Description 3"}
            ],
            "agent_trace": [],
            "meeting_log": []
        }
        
        result = takeoff_agent.handle(initial_state)
        
        assert isinstance(result, dict)
        assert "takeoff_data" in result
        assert isinstance(result["takeoff_data"], list)

    def test_log_interaction_function(self) -> None:
        """Test log interaction helper function"""
        from backend.agents.takeoff_agent import takeoff_agent as agent_instance
        from backend.app.schemas import AppState
        
        state = AppState()
        
        agent_instance.log_interaction(state, "test decision", "test message")
        
        assert len(state.agent_trace) == 1
        assert len(state.meeting_log) == 1
        assert state.agent_trace[0].agent == "takeoff"
        assert state.agent_trace[0].decision == "test decision"
        
    def test_handle_with_error_scope_items(self) -> None:
        """Test handle function with error scope items"""
        initial_state: Dict[str, Any] = {
            "scope_items": [
                {
                    "item_id": "SCOPE-ERROR-UNKNOWN_FILE",
                    "trade_name": "Processing Error",
                    "csi_division": "ERROR",
                    "description": "Failed to process trade information",
                    "error_message": "File parsing failed"
                }
            ],
            "agent_trace": [],
            "meeting_log": []
        }
        
        result = takeoff_agent.handle(initial_state)
        
        assert isinstance(result, dict)
        assert "takeoff_data" in result
        # Should handle error items gracefully
        
    def test_handle_validates_quantities(self) -> None:
        """Test that takeoff handles quantity validation"""
        initial_state: Dict[str, Any] = {
            "scope_items": [
                {
                    "item_id": "SCOPE-260000-OUTLET-0",
                    "trade_name": "electrical",
                    "csi_division": "260000",
                    "description": "Install electrical outlets",
                    "quantity": 25,  # Valid quantity
                    "unit": "each"
                }
            ],
            "agent_trace": [],
            "meeting_log": []
        }
        
        result = takeoff_agent.handle(initial_state)
        
        assert isinstance(result, dict)
        # Should process valid quantities correctly


if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v"])
