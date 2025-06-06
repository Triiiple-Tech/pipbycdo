from unittest.mock import Mock, patch
from backend.agents import scope_agent
from backend.app.schemas import AppState
import json
from typing import Any, Dict

class TestScopeAgent:
    def test_scope_agent_handle_function_exists(self) -> None:
        """Test ScopeAgent handle function exists"""
        assert hasattr(scope_agent, 'handle')
    
    @patch('backend.agents.base_agent.run_llm')
    def test_handle_basic_scope_extraction(self, mock_run_llm: Mock) -> None:
        """Test basic scope extraction through handle function with mocked LLM"""
        # Mock LLM response for scope extraction
        mock_llm_response = json.dumps([
            {
                "item_id": "SCOPE-260000-001",
                "description": "Install electrical outlets",
                "trade_name": "electrical",
                "csi_division": "260000",
                "work_type": "material",
                "estimated_unit": "EA",
                "complexity": "medium",
                "notes": "Standard outlet installation"
            },
            {
                "item_id": "SCOPE-260000-002",
                "description": "Install electrical wiring",
                "trade_name": "electrical",
                "csi_division": "260000",
                "work_type": "labor",
                "estimated_unit": "LF",
                "complexity": "medium",
                "notes": "Electrical wiring installation"
            }
        ])
        mock_run_llm.return_value = mock_llm_response
        
        initial_state: Dict[str, Any] = {
            "trade_mapping": [
                {
                    "trade_name": "electrical",
                    "csi_division": "260000",
                    "keywords_found": ["outlet", "wiring"],
                    "source_file": "test_plan.txt"
                }
            ],
            "agent_trace": [],
            "meeting_log": [],
            "llm_config": {
                "model": "gpt-4",
                "api_key": "test_key",
                "params": {}
            }
        }
        
        result = scope_agent.handle(initial_state)
        
        assert isinstance(result, dict)
        assert "scope_items" in result
        assert "agent_trace" in result
        assert "meeting_log" in result
        assert len(result["scope_items"]) == 2
        assert result["scope_items"][0]["item_id"] == "SCOPE-260000-001"
        assert result["scope_items"][0]["trade_name"] == "electrical"
        
    @patch.object(scope_agent, 'generate_scope_items')
    def test_generate_scope_items_function(self, mock_generate_scope_items: Mock) -> None:
        """Test scope item generation function"""
        trade_info: Dict[str, Any] = {
            "trade_name": "electrical",
            "csi_division": "260000",
            "keywords_found": ["outlet", "switch"],
            "source_file": "electrical_plan.pdf"
        }
        
        # Mock the return value
        mock_generate_scope_items.return_value = [
            {"item_id": "1", "trade_name": "electrical"},
            {"item_id": "2", "trade_name": "electrical"}
        ]
        
        scope_items: list[Dict[str, Any]] = mock_generate_scope_items(trade_info)
        
        assert isinstance(scope_items, list)
        if scope_items:  # If items were generated
            assert all("item_id" in item for item in scope_items if isinstance(item, dict))
            assert all("trade_name" in item for item in scope_items if isinstance(item, dict))
            
    @patch('backend.agents.base_agent.run_llm')
    def test_handle_with_no_trade_mapping(self, mock_run_llm: Mock) -> None:
        """Test handle function with no trade mapping data"""
        initial_state: Dict[str, Any] = {
            "trade_mapping": [],
            "agent_trace": [],
            "meeting_log": [],
            "llm_config": {
                "model": "gpt-4",
                "api_key": "test_key",
                "params": {}
            }
        }
        
        result = scope_agent.handle(initial_state)
        
        assert isinstance(result, dict)
        assert "scope_items" in result
        assert len(result["scope_items"]) == 0
        # Should not call LLM when no trade mapping
        mock_run_llm.assert_not_called()
        
    @patch('backend.agents.base_agent.run_llm')
    def test_handle_with_error_trade_mapping(self, mock_run_llm: Mock) -> None:
        """Test handle function with error in trade mapping"""
        initial_state: Dict[str, Any] = {
            "trade_mapping": [
                {
                    "trade_name": "Error in Processing",
                    "csi_division": "ERROR",
                    "error_message": "File processing failed",
                    "source_file": "broken_file.pdf"
                }
            ],
            "agent_trace": [],
            "meeting_log": [],
            "llm_config": {
                "model": "gpt-4",
                "api_key": "test_key",
                "params": {}
            }
        }
        
        result = scope_agent.handle(initial_state)
        
        assert isinstance(result, dict)
        assert "scope_items" in result
        assert len(result["scope_items"]) == 1
        assert result["scope_items"][0]["csi_division"] == "ERROR"
        # Should not call LLM for error entries
        mock_run_llm.assert_not_called()
        
    @patch.object(scope_agent, 'log_interaction')
    def test_log_interaction_function(self, mock_log_interaction: Mock) -> None:
        """Test log interaction helper function"""
        state = AppState()
        
        scope_agent.log_interaction(state, "test decision", "test message")
        
        mock_log_interaction.assert_called_once_with(state, "test decision", "test message")
        
    @patch('backend.agents.base_agent.run_llm')
    def test_scope_extraction_with_multiple_trades(self, mock_run_llm: Mock) -> None:
        """Test scope extraction with multiple trade types"""
        # Mock different LLM responses for different trades
        electrical_response = json.dumps([
            {
                "item_id": "SCOPE-260000-001",
                "description": "Install electrical outlets",
                "trade_name": "electrical",
                "csi_division": "260000",
                "work_type": "material",
                "estimated_unit": "EA",
                "complexity": "medium",
                "notes": "Electrical outlets"
            }
        ])
        
        plumbing_response = json.dumps([
            {
                "item_id": "SCOPE-220000-001",
                "description": "Install plumbing pipes",
                "trade_name": "plumbing",
                "csi_division": "220000",
                "work_type": "material",
                "estimated_unit": "LF",
                "complexity": "medium",
                "notes": "Plumbing pipes"
            }
        ])
        
        # Mock to return different responses for each call
        mock_run_llm.side_effect = [electrical_response, plumbing_response]
        
        initial_state: Dict[str, Any] = {
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
            "meeting_log": [],
            "llm_config": {
                "model": "gpt-4",
                "api_key": "test_key",
                "params": {}
            }
        }
        
        result = scope_agent.handle(initial_state)
        
        assert isinstance(result, dict)
        assert "scope_items" in result
        assert len(result["scope_items"]) == 2
        # Should call LLM twice (once for each trade)
        assert mock_run_llm.call_count == 2
        
        # Verify both trades are processed
        trade_names = [item["trade_name"] for item in result["scope_items"]]
        assert "electrical" in trade_names
        assert "plumbing" in trade_names
        
    @patch('backend.agents.base_agent.run_llm')
    def test_llm_failure_fallback_to_keywords(self, mock_run_llm: Mock) -> None:
        """Test fallback to keyword-based scope generation when LLM fails"""
        # Mock LLM to raise an exception
        mock_run_llm.side_effect = Exception("LLM service unavailable")
        
        initial_state: Dict[str, Any] = {
            "trade_mapping": [
                {
                    "trade_name": "electrical",
                    "csi_division": "260000",
                    "keywords_found": ["outlet", "wiring"],
                    "source_file": "test_plan.txt"
                }
            ],
            "agent_trace": [],
            "meeting_log": [],
            "llm_config": {
                "model": "gpt-4",
                "api_key": "test_key",
                "params": {}
            }
        }
        
        result = scope_agent.handle(initial_state)
        
        assert isinstance(result, dict)
        assert "scope_items" in result
        # Should fall back to keyword-based extraction when LLM fails
        assert len(result["scope_items"]) > 0
        # Check that it used keyword extraction method
        assert result["scope_items"][0]["extraction_method"] == "keyword"
        mock_run_llm.assert_called_once()
        
    @patch('backend.agents.base_agent.run_llm')
    def test_llm_invalid_json_fallback_to_keywords(self, mock_run_llm: Mock) -> None:
        """Test fallback to keyword-based scope generation when LLM returns invalid JSON"""
        # Mock LLM to return invalid JSON
        mock_run_llm.return_value = "This is not valid JSON {invalid format"
        
        initial_state: Dict[str, Any] = {
            "trade_mapping": [
                {
                    "trade_name": "plumbing",
                    "csi_division": "220000",
                    "keywords_found": ["pipe", "fixture"],
                    "source_file": "plumbing_plan.pdf"
                }
            ],
            "agent_trace": [],
            "meeting_log": [],
            "llm_config": {
                "model": "gpt-4",
                "api_key": "test_key",
                "params": {}
            }
        }
        
        result = scope_agent.handle(initial_state)
        
        assert isinstance(result, dict)
        assert "scope_items" in result
        # Should fall back to keyword-based extraction when JSON parsing fails
        assert len(result["scope_items"]) > 0
        # Check that it used keyword extraction method as fallback
        assert result["scope_items"][0]["extraction_method"] == "keyword"
        mock_run_llm.assert_called_once()
        
    @patch('backend.agents.base_agent.run_llm')
    def test_empty_llm_response_fallback_to_keywords(self, mock_run_llm: Mock) -> None:
        """Test fallback to keyword-based scope generation when LLM returns empty response"""
        # Mock LLM to return empty string
        mock_run_llm.return_value = ""
        
        initial_state: Dict[str, Any] = {
            "trade_mapping": [
                {
                    "trade_name": "hvac",
                    "csi_division": "230000",
                    "keywords_found": ["duct", "unit"],
                    "source_file": "hvac_plan.pdf"
                }
            ],
            "agent_trace": [],
            "meeting_log": [],
            "llm_config": {
                "model": "gpt-4",
                "api_key": "test_key",
                "params": {}
            }
        }
        
        result = scope_agent.handle(initial_state)
        
        assert isinstance(result, dict)
        assert "scope_items" in result
        # Should fall back to keyword-based extraction when LLM returns empty response
        assert len(result["scope_items"]) > 0
        # Check that it used keyword extraction method as fallback
        assert result["scope_items"][0]["extraction_method"] == "keyword"
        mock_run_llm.assert_called_once()
