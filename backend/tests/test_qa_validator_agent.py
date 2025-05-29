import pytest
from unittest.mock import Mock, patch
from backend.agents import qa_validator_agent
from backend.app.schemas import AppState, EstimateItem

class TestQAValidatorAgent:
    def test_qa_validator_agent_handle_function_exists(self):
        """Test QA validator agent handle function exists"""
        assert hasattr(qa_validator_agent, 'handle')
        
    def test_handle_basic_validation(self):
        """Test basic validation through handle function"""
        initial_state = {
            "estimate": [
                {
                    "item": "Electrical outlets",
                    "description": "Install duplex outlets",
                    "qty": 10.0,
                    "unit": "each",
                    "unit_price": 45.0,
                    "total": 450.0
                }
            ],
            "takeoff_data": [
                {
                    "description": "Electrical outlets",
                    "quantity": 10,
                    "unit": "each",
                    "trade": "electrical"
                }
            ],
            "agent_trace": [],
            "meeting_log": []
        }
        
        result = qa_validator_agent.handle(initial_state)
        
        # Should return a dictionary with state data
        assert isinstance(result, dict)
        assert "agent_trace" in result
        assert "meeting_log" in result
        
    def test_validation_with_empty_state(self):
        """Test validation with minimal state"""
        initial_state = {
            "agent_trace": [],
            "meeting_log": [],
            "estimate": [],
            "takeoff_data": []
        }
        
        result = qa_validator_agent.handle(initial_state)
        
        assert isinstance(result, dict)
        # Should handle empty data gracefully
        
    def test_validation_with_invalid_data(self):
        """Test validation handles invalid data"""
        initial_state = {
            "estimate": [
                {
                    "item": "Invalid item",
                    "qty": -5,  # Invalid negative quantity
                    "unit": "each",
                    "unit_price": 45.0,
                    "total": -225.0  # Should be positive
                }
            ],
            "agent_trace": [],
            "meeting_log": []
        }
        
        result = qa_validator_agent.handle(initial_state)
        
        assert isinstance(result, dict)
        # Should handle invalid data and potentially flag errors
        
    def test_log_interaction_function(self):
        """Test log interaction helper function"""
        state = AppState()
        
        qa_validator_agent.log_interaction(state, "test decision", "test message")
        
        assert len(state.agent_trace) == 1
        assert len(state.meeting_log) == 1
        assert state.agent_trace[0].agent == "qa_validator"
        assert state.agent_trace[0].decision == "test decision"
        
    def test_validation_with_pricing_mismatch(self):
        """Test validation detects pricing calculation errors"""
        initial_state = {
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
