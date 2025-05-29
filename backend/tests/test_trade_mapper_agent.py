import pytest
from unittest.mock import Mock, patch
from backend.agents import trade_mapper_agent
from backend.app.schemas import AppState

class TestTradeMapperAgent:
    def test_trade_mapper_agent_handle_function_exists(self):
        """Test TradeMapperAgent handle function exists"""
        assert hasattr(trade_mapper_agent, 'handle')
        
    def test_handle_basic_trade_mapping(self):
        """Test basic trade mapping through handle function"""
        initial_state = {
            "processed_files_content": {
                "electrical_plan.txt": "Install electrical outlets and switches. Wire distribution panel.",
                "plumbing_plan.txt": "Install water closets and sinks. Connect piping system."
            },
            "agent_trace": [],
            "meeting_log": []
        }
        
        result = trade_mapper_agent.handle(initial_state)
        
        assert isinstance(result, dict)
        assert "trade_mapping" in result
        assert "agent_trace" in result
        assert "meeting_log" in result
        
    def test_map_content_to_trades_function(self):
        """Test trade mapping function"""
        content = "Install electrical outlets and lighting fixtures. Connect to electrical panel."
        
        trades = trade_mapper_agent.map_content_to_trades(content)
        
        assert isinstance(trades, list)
        if trades:  # If trades were mapped
            assert all("trade_name" in trade for trade in trades)
            assert all("csi_division" in trade for trade in trades)
            
    def test_handle_with_electrical_content(self):
        """Test handling electrical-related content"""
        initial_state = {
            "processed_files_content": {
                "electrical.pdf": "Install 25 duplex outlets, 15 light switches, and electrical panel"
            },
            "agent_trace": [],
            "meeting_log": []
        }
        
        result = trade_mapper_agent.handle(initial_state)
        
        assert isinstance(result, dict)
        assert "trade_mapping" in result
        # Should identify electrical trade
        
    def test_handle_with_plumbing_content(self):
        """Test handling plumbing-related content"""
        initial_state = {
            "processed_files_content": {
                "plumbing.pdf": "Install water closets, sinks, and connect piping throughout building"
            },
            "agent_trace": [],
            "meeting_log": []
        }
        
        result = trade_mapper_agent.handle(initial_state)
        
        assert isinstance(result, dict)
        assert "trade_mapping" in result
        # Should identify plumbing trade
        
    def test_handle_with_no_processed_content(self):
        """Test handle function with no processed content"""
        initial_state = {
            "processed_files_content": {},
            "agent_trace": [],
            "meeting_log": []
        }
        
        result = trade_mapper_agent.handle(initial_state)
        
        assert isinstance(result, dict)
        assert "trade_mapping" in result
        assert len(result["trade_mapping"]) == 0
        
    def test_log_interaction_function(self):
        """Test log interaction helper function"""
        state = AppState()
        
        trade_mapper_agent.log_interaction(state, "test decision", "test message")
        
        assert len(state.agent_trace) == 1
        assert len(state.meeting_log) == 1
        assert state.agent_trace[0].agent == "trade_mapper"
        assert state.agent_trace[0].decision == "test decision"
        
    def test_csi_divisions_keywords_exist(self):
        """Test that CSI division keywords are defined"""
        assert hasattr(trade_mapper_agent, 'CSI_DIVISIONS_KEYWORDS')
        assert isinstance(trade_mapper_agent.CSI_DIVISIONS_KEYWORDS, dict)
        assert len(trade_mapper_agent.CSI_DIVISIONS_KEYWORDS) > 0
        
    def test_handle_with_multiple_trades_in_content(self):
        """Test handling content with multiple trade types"""
        initial_state = {
            "processed_files_content": {
                "multi_trade.pdf": "Install electrical outlets, plumbing fixtures, and HVAC ductwork"
            },
            "agent_trace": [],
            "meeting_log": []
        }
        
        result = trade_mapper_agent.handle(initial_state)
        
        assert isinstance(result, dict)
        assert "trade_mapping" in result
        # Should identify multiple trades
        
    def test_handle_with_empty_content(self):
        """Test handling empty file content"""
        initial_state = {
            "processed_files_content": {
                "empty_file.txt": "",
                "whitespace_file.txt": "   \n  \t  "
            },
            "agent_trace": [],
            "meeting_log": []
        }
        
        result = trade_mapper_agent.handle(initial_state)
        
        assert isinstance(result, dict)
        assert "trade_mapping" in result
        # Should handle empty content gracefully
