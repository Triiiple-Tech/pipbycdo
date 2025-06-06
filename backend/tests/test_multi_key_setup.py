"""
Tests for multi-key setup functionality in LLM selector and GPT handler.
"""
import pytest
import os
from unittest.mock import patch, Mock, MagicMock
from backend.services.llm_selector import select_llm


class TestMultiKeySetup:
    """Test multi-key fallback functionality"""
    
    @patch.dict(os.environ, {
        "OPENAI_o4-mini_KEY": "key1", 
        "OPENAI_4o_KEY": "key2"
    })
    def test_select_llm_uses_primary_key(self) -> None:
        """Test that primary API key is used when available"""
        result = select_llm("manager", {})
        
        assert result["model"] == "o4-mini"
        assert result["api_key"] == "key1"
        assert result["api_key_source"] == "OPENAI_o4-mini_KEY"
    
    @patch.dict(os.environ, {
        "OPENAI_4o_KEY": "fallback_key"
    }, clear=True)  # Primary key missing, only fallback available
    def test_select_llm_uses_fallback_key(self) -> None:
        """Test that fallback API key is used when primary is missing"""
        result = select_llm("manager", {})
        
        assert result["model"] == "o4-mini"
        assert result["api_key"] == "fallback_key"
        assert result["api_key_source"] == "OPENAI_4o_KEY"
    
    @patch.dict(os.environ, {}, clear=True)
    def test_select_llm_no_keys_available(self) -> None:
        """Test behavior when no API keys are available"""
        result = select_llm("manager", {})
        
        assert result["model"] == "o4-mini"
        assert result["api_key"] is None


class TestGPTHandlerMultiKey:
    """Test enhanced GPT handler with fallback support"""
    
    @patch('backend.services.gpt_handler.OpenAI')
    def test_run_llm_success_first_try(self, mock_openai: MagicMock) -> None:
        """Test successful LLM call on first attempt"""
        from backend.services.gpt_handler import run_llm
        
        mock_client = Mock()
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = "success response"
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai.return_value = mock_client
        
        result = run_llm("test prompt", api_key="test_key")
        
        assert result == "success response"
        mock_openai.assert_called_once_with(api_key="test_key")  # type: ignore[attr-defined]
    
    @patch('backend.services.gpt_handler.OpenAI')
    def test_run_llm_all_attempts_fail(self, mock_openai: MagicMock) -> None:
        """Test when all retry attempts fail"""
        from backend.services.gpt_handler import run_llm, LLMCallError
        
        mock_client = Mock()
        mock_client.chat.completions.create.side_effect = Exception("persistent error")
        mock_openai.return_value = mock_client
        
        with pytest.raises(LLMCallError):
            run_llm("test prompt", api_key="test_key", max_retries=2)
        
        assert mock_openai.call_count == 2  # type: ignore[attr-defined]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
