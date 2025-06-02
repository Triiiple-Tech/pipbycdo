"""
Tests for multi-key setup functionality in LLM selector and GPT handler.
"""
import pytest
import os
from unittest.mock import patch, Mock
from backend.services.llm_selector import select_llm, get_fallback_config, _get_working_api_key
from backend.services.gpt_handler import run_llm, LLMCallError, _categorize_error


class TestMultiKeySetup:
    """Test multi-key fallback functionality"""
    
    @patch.dict(os.environ, {
        "OPENAI_o4-mini_KEY": "key1", 
        "OPENAI_4o_KEY": "key2"
    })
    def test_select_llm_uses_primary_key(self):
        """Test that primary API key is used when available"""
        result = select_llm("manager", {})
        
        assert result["model"] == "o4-mini"
        assert result["api_key"] == "key1"
        assert result["api_key_source"] == "OPENAI_o4-mini_KEY"
    
    @patch.dict(os.environ, {
        "OPENAI_4o_KEY": "fallback_key"
    }, clear=True)  # Primary key missing, only fallback available
    def test_select_llm_uses_fallback_key(self):
        """Test that fallback API key is used when primary is missing"""
        result = select_llm("manager", {})
        
        assert result["model"] == "o4-mini"
        assert result["api_key"] == "fallback_key"
        assert result["api_key_source"] == "OPENAI_4o_KEY"
    
    @patch.dict(os.environ, {}, clear=True)
    def test_select_llm_no_keys_available(self):
        """Test behavior when no API keys are available"""
        result = select_llm("manager", {})
        
        assert result["model"] == "o4-mini"
        assert result["api_key"] is None
        assert result["api_key_source"] is None
    
    def test_get_working_api_key_multiple_keys(self):
        """Test _get_working_api_key function with multiple options"""
        with patch.dict(os.environ, {
            "KEY1": "",  # Empty
            "KEY2": "working_key",
            "KEY3": "another_key"
        }):
            api_key, source = _get_working_api_key(["KEY1", "KEY2", "KEY3"], "test_agent", "test_model")
            
            assert api_key == "working_key"
            assert source == "KEY2"
    
    def test_get_fallback_config_estimator(self):
        """Test fallback configuration for estimator agent"""
        with patch.dict(os.environ, {
            "OPENAI_4o_KEY": "fallback_key",
            "OPENAI_4.1_KEY": "secondary_key"
        }):
            # Primary model (o3) fails, should get fallback (gpt-4o)
            fallback = get_fallback_config("estimator", "o3", "rate_limit: too many requests")
            
            assert fallback is not None
            assert fallback["model"] == "gpt-4o"
            assert fallback["api_key"] == "fallback_key"
            assert fallback["is_fallback"] is True
            assert fallback["failed_model"] == "o3"
    
    def test_get_fallback_config_no_fallback_available(self):
        """Test when no fallback is available"""
        result = get_fallback_config("unknown_agent", "unknown_model", "some error")
        assert result is None


class TestGPTHandlerMultiKey:
    """Test enhanced GPT handler with fallback support"""
    
    @patch('backend.services.gpt_handler.OpenAI')
    def test_run_llm_success_first_try(self, mock_openai):
        """Test successful LLM call on first attempt"""
        mock_client = Mock()
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "success response"
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai.return_value = mock_client
        
        result = run_llm("test prompt", api_key="test_key")
        
        assert result == "success response"
        mock_openai.assert_called_once_with(api_key="test_key")
    
    @patch('backend.services.gpt_handler.OpenAI')
    @patch('backend.services.gpt_handler._get_fallback_for_failed_call')
    def test_run_llm_fallback_on_rate_limit(self, mock_get_fallback, mock_openai):
        """Test fallback when rate limit is hit"""
        # First call fails with rate limit
        mock_client1 = Mock()
        mock_client1.chat.completions.create.side_effect = Exception("rate limit exceeded")
        
        # Second call succeeds
        mock_client2 = Mock()
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "fallback success"
        mock_client2.chat.completions.create.return_value = mock_response
        
        mock_openai.side_effect = [mock_client1, mock_client2]
        
        # Mock fallback config
        mock_get_fallback.return_value = {
            "model": "gpt-4o",
            "api_key": "fallback_key"
        }
        
        result = run_llm("test prompt", model="o3", api_key="primary_key", agent_name="estimator")
        
        assert result == "fallback success"
        assert mock_openai.call_count == 2
        mock_get_fallback.assert_called_once()
    
    @patch('backend.services.gpt_handler.OpenAI')
    def test_run_llm_all_attempts_fail(self, mock_openai):
        """Test when all retry attempts fail"""
        mock_client = Mock()
        mock_client.chat.completions.create.side_effect = Exception("persistent error")
        mock_openai.return_value = mock_client
        
        with pytest.raises(LLMCallError) as exc_info:
            run_llm("test prompt", api_key="test_key", max_retries=2)
        
        assert "All 2 LLM call attempts failed" in str(exc_info.value)
        assert mock_openai.call_count == 2
    
    def test_categorize_error_types(self):
        """Test error categorization for appropriate fallback decisions"""
        assert _categorize_error(Exception("Rate limit exceeded")) == "rate_limit"
        assert _categorize_error(Exception("Quota exceeded")) == "quota_exceeded"
        assert _categorize_error(Exception("Authentication failed")) == "auth_error"
        assert _categorize_error(Exception("Model gpt-5 not found")) == "model_not_found"
        assert _categorize_error(Exception("Connection timeout")) == "network_error"
        assert _categorize_error(Exception("Internal server error 500")) == "server_error"
        assert _categorize_error(Exception("Unknown problem")) == "unknown_error"
    
    def test_llm_call_error_exception(self):
        """Test custom LLMCallError exception"""
        error = LLMCallError("Test error", "rate_limit", True)
        
        assert str(error) == "Test error"
        assert error.error_type == "rate_limit"
        assert error.retry_with_fallback is True


class TestIntegratedMultiKeyFlow:
    """Test the complete multi-key flow from agent to LLM"""
    
    @patch('backend.services.gpt_handler.OpenAI')
    def test_complete_fallback_flow(self, mock_openai):
        """Test complete flow: agent selection -> primary fails -> fallback succeeds"""
        from backend.agents.base_agent import BaseAgent
        from backend.app.schemas import AppState, LLMConfig
        
        # Create test agent using a concrete implementation
        class TestAgent(BaseAgent):
            def process(self, state):
                return state
        
        agent = TestAgent("estimator")
        
        # Create test state
        state = AppState(
            query="test query",
            llm_config=LLMConfig(model="o3", api_key="primary_key")
        )
        
        # First OpenAI client fails (primary)
        mock_client1 = Mock()
        mock_client1.chat.completions.create.side_effect = Exception("rate limit exceeded")
        
        # Second OpenAI client succeeds (fallback)
        mock_client2 = Mock()
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "fallback response"
        mock_client2.chat.completions.create.return_value = mock_response
        
        mock_openai.side_effect = [mock_client1, mock_client2]
        
        # Mock environment for fallback key
        with patch.dict(os.environ, {"OPENAI_4o_KEY": "fallback_key"}):
            result = agent.call_llm(state, "test prompt")
        
        assert result == "fallback response"
        assert mock_openai.call_count == 2
        
        # Verify the calls used different configurations
        call_args_list = mock_openai.call_args_list
        assert call_args_list[0][1]["api_key"] == "primary_key"  # Primary attempt
        assert call_args_list[1][1]["api_key"] == "fallback_key"  # Fallback attempt
