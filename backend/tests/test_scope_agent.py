import pytest
from unittest.mock import Mock, patch
from backend.agents import scope_agent
from backend.app.schemas import AppState

class TestScopeAgent:
    def test_scope_agent_handle_function_exists(self):
        """Test ScopeAgent handle function exists"""
        assert hasattr(scope_agent, 'handle')
        
    def test_handle_basic_scope_extraction(self):
        """Test basic scope extraction through handle function"""
        initial_state = {
            "trade_mapping": [
                {
                    "trade_name": "electrical",
                    "csi_division": "260000",
                    "keywords_found": ["outlet", "wiring"],
                    "source_file": "test_plan.txt"
                }
            ],
            "agent_trace": [],
            "meeting_log": []
        }
        
        result = scope_agent.handle(initial_state)
        
        assert isinstance(result, dict)
        assert "scope_items" in result
        assert "agent_trace" in result
        assert "meeting_log" in result
        
    def test_generate_scope_items_function(self):
        """Test scope item generation function"""
        trade_info = {
            "trade_name": "electrical",
            "csi_division": "260000",
            "keywords_found": ["outlet", "switch"],
            "source_file": "electrical_plan.pdf"
        }
        
        scope_items = scope_agent.generate_scope_items(trade_info)
        
        assert isinstance(scope_items, list)
        if scope_items:  # If items were generated
            assert all("item_id" in item for item in scope_items)
            assert all("trade_name" in item for item in scope_items)
            
    def test_handle_with_no_trade_mapping(self):
        """Test handle function with no trade mapping data"""
        initial_state = {
            "trade_mapping": [],
            "agent_trace": [],
            "meeting_log": []
        }
        
        result = scope_agent.handle(initial_state)
        
        assert isinstance(result, dict)
        assert "scope_items" in result
        assert len(result["scope_items"]) == 0
        
    def test_handle_with_error_trade_mapping(self):
        """Test handle function with error in trade mapping"""
        initial_state = {
            "trade_mapping": [
                {
                    "trade_name": "Error in Processing",
                    "csi_division": "ERROR",
                    "error_message": "File processing failed",
                    "source_file": "broken_file.pdf"
                }
            ],
            "agent_trace": [],
            "meeting_log": []
        }
        
        result = scope_agent.handle(initial_state)
        
        assert isinstance(result, dict)
        assert "scope_items" in result
        # Should handle error gracefully
        
    def test_log_interaction_function(self):
        """Test log interaction helper function"""
        state = AppState()
        
        scope_agent.log_interaction(state, "test decision", "test message")
        
        assert len(state.agent_trace) == 1
        assert len(state.meeting_log) == 1
        assert state.agent_trace[0].agent == "scope"
        assert state.agent_trace[0].decision == "test decision"
        
    def test_scope_extraction_with_multiple_trades(self):
        """Test scope extraction with multiple trade types"""
        initial_state = {
            "trade_mapping": [
                {
                    "trade_name": "electrical",
                    "csi_division": "260000",
                    "keywords_found": ["outlet", "panel"],
                    "source_file": "electrical.pdf"
                },
                {
                    "trade_name": "plumbing",
                    "csi_division": "220000",
                    "keywords_found": ["pipe", "fixture"],
                    "source_file": "plumbing.pdf"
                }
            ],
            "agent_trace": [],
            "meeting_log": []
        }
        
        result = scope_agent.handle(initial_state)
        
        assert isinstance(result, dict)
        assert "scope_items" in result
        # Should process multiple trades
