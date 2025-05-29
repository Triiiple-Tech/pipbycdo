import pytest
from unittest.mock import Mock, patch
from backend.agents import takeoff_agent
from backend.app.schemas import AppState

class TestTakeoffAgent:
    def test_takeoff_agent_handle_function_exists(self):
        """Test TakeoffAgent handle function exists"""
        assert hasattr(takeoff_agent, 'handle')
        
    def test_handle_basic_takeoff_generation(self):
        """Test basic takeoff generation through handle function"""
        initial_state = {
            "scope_items": [
                {
                    "item_id": "SCOPE-260000-OUTLET-0",
                    "trade_name": "electrical",
                    "csi_division": "260000",
                    "description": "Install electrical outlets",
                    "source_file": "electrical_plan.pdf"
                }
            ],
            "agent_trace": [],
            "meeting_log": []
        }
        
        result = takeoff_agent.handle(initial_state)
        
        assert isinstance(result, dict)
        assert "takeoff_data" in result
        assert "agent_trace" in result
        assert "meeting_log" in result
        
    def test_handle_with_no_scope_items(self):
        """Test handle function with no scope items"""
        initial_state = {
            "scope_items": [],
            "agent_trace": [],
            "meeting_log": []
        }
        
        result = takeoff_agent.handle(initial_state)
        
        assert isinstance(result, dict)
        assert "takeoff_data" in result
        assert len(result["takeoff_data"]) == 0
        
    def test_handle_with_multiple_scope_items(self):
        """Test handle function with multiple scope items"""
        initial_state = {
            "scope_items": [
                {
                    "item_id": "SCOPE-260000-OUTLET-0",
                    "trade_name": "electrical",
                    "csi_division": "260000",
                    "description": "Install electrical outlets",
                    "source_file": "electrical.pdf"
                },
                {
                    "item_id": "SCOPE-220000-PIPE-0",
                    "trade_name": "plumbing", 
                    "csi_division": "220000",
                    "description": "Install water pipes",
                    "source_file": "plumbing.pdf"
                }
            ],
            "agent_trace": [],
            "meeting_log": []
        }
        
        result = takeoff_agent.handle(initial_state)
        
        assert isinstance(result, dict)
        assert "takeoff_data" in result
        # Should process multiple items
        
    def test_log_interaction_function(self):
        """Test log interaction helper function"""
        state = AppState()
        
        takeoff_agent.log_interaction(state, "test decision", "test message")
        
        assert len(state.agent_trace) == 1
        assert len(state.meeting_log) == 1
        assert state.agent_trace[0].agent == "takeoff"
        assert state.agent_trace[0].decision == "test decision"
        
    def test_handle_with_error_scope_items(self):
        """Test handle function with error scope items"""
        initial_state = {
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
        
    def test_handle_validates_quantities(self):
        """Test that takeoff handles quantity validation"""
        initial_state = {
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
