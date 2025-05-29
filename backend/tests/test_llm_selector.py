import pytest
import os
from unittest.mock import patch
from backend.services.llm_selector import select_llm, AGENT_MODELS


class TestLLMSelector:
    
    def test_select_llm_estimator_agent(self):
        """Test LLM selection for estimator agent."""
        with patch.dict(os.environ, {"OPENAI_API_KEY": "test-api-key"}):
            result = select_llm("estimator", {})
            
            assert result["model"] == "gpt-4"
            assert result["api_key"] == "test-api-key"
    
    def test_select_llm_manager_agent(self):
        """Test LLM selection for manager agent."""
        with patch.dict(os.environ, {"OPENAI_API_KEY": "test-api-key"}):
            result = select_llm("manager", {})
            
            assert result["model"] == "gpt-3.5-turbo"
            assert result["api_key"] == "test-api-key"
    
    def test_select_llm_unknown_agent(self):
        """Test LLM selection for unknown agent."""
        with patch.dict(os.environ, {"OPENAI_API_KEY": "test-api-key"}):
            result = select_llm("unknown_agent", {})
            
            assert result["model"] is None
            assert result["api_key"] == "test-api-key"
    
    def test_select_llm_no_api_key(self):
        """Test LLM selection when no API key is set."""
        with patch.dict(os.environ, {}, clear=True):
            result = select_llm("estimator", {})
            
            assert result["model"] == "gpt-4"
            assert result["api_key"] is None
    
    def test_agent_models_configuration(self):
        """Test that AGENT_MODELS contains expected configurations."""
        assert "estimator" in AGENT_MODELS
        assert "manager" in AGENT_MODELS
        assert AGENT_MODELS["estimator"] == "gpt-4"
        assert AGENT_MODELS["manager"] == "gpt-3.5-turbo"
    
    def test_select_llm_with_state(self):
        """Test LLM selection with state parameter (should not affect result)."""
        mock_state = {"some": "data"}
        
        with patch.dict(os.environ, {"OPENAI_API_KEY": "test-api-key"}):
            result = select_llm("estimator", mock_state)
            
            assert result["model"] == "gpt-4"
            assert result["api_key"] == "test-api-key"
