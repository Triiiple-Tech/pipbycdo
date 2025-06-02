import pytest
from unittest.mock import Mock, patch
import json
from backend.services import gpt_handler
from backend.services.gpt_handler import LLMCallError

class TestGPTHandler:
    def test_gpt_handler_module_exists(self):
        """Test GPT handler module exists"""
        assert gpt_handler is not None
        
    @patch('backend.services.gpt_handler.OpenAI')
    @patch.dict('os.environ', {'OPENAI_4o_KEY': 'test_api_key'})
    def test_run_llm_success(self, mock_openai):
        """Test successful LLM response"""
        # Mock OpenAI client and response
        mock_client = Mock()
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = 'test response'
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai.return_value = mock_client
        
        result = gpt_handler.run_llm("test prompt", api_key="test_api_key")
        
        assert result == "test response"
        mock_openai.assert_called_once_with(api_key="test_api_key")
        mock_client.chat.completions.create.assert_called_once()
        
    @patch('backend.services.gpt_handler.OpenAI')
    @patch.dict('os.environ', {'OPENAI_4o_KEY': 'test_api_key'})
    def test_run_llm_with_system_prompt(self, mock_openai):
        """Test LLM response with system prompt"""
        mock_client = Mock()
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = 'system response'
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai.return_value = mock_client
        
        result = gpt_handler.run_llm("test prompt", system_prompt="You are a helpful assistant", api_key="test_api_key")
        
        assert result == "system response"
        # Verify system prompt was included
        call_args = mock_client.chat.completions.create.call_args
        messages = call_args[1]['messages']
        assert len(messages) == 2
        assert messages[0]['role'] == 'system'
        assert messages[1]['role'] == 'user'
        
    @patch('backend.services.gpt_handler.OpenAI')
    def test_run_llm_api_error(self, mock_openai):
        """Test handling of API errors"""
        mock_client = Mock()
        mock_client.chat.completions.create.side_effect = Exception("API Error")
        mock_openai.return_value = mock_client
        
        with pytest.raises(Exception):
            gpt_handler.run_llm("test prompt", api_key="test_api_key")
                
    @patch('backend.services.gpt_handler.OpenAI')
    def test_run_llm_model_parameter(self, mock_openai):
        """Test model parameter usage"""
        mock_client = Mock()
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = 'response'
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai.return_value = mock_client
        
        gpt_handler.run_llm("test prompt", model="gpt-3.5-turbo", api_key="test_api_key")
        
        call_args = mock_client.chat.completions.create.call_args
        assert call_args[1]['model'] == "gpt-3.5-turbo"
        
    @patch.dict('os.environ', {'OPENAI_4o_KEY': 'fallback_key'})
    @patch('backend.services.gpt_handler.OpenAI')
    def test_run_llm_fallback_api_key(self, mock_openai):
        """Test that fallback API key is used when none is provided"""
        mock_client = Mock()
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = 'response'
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai.return_value = mock_client
        
        result = gpt_handler.run_llm("test prompt")  # No api_key provided
        
        assert result == "response"
        mock_openai.assert_called_once_with(api_key="fallback_key")
        
    def test_run_llm_no_api_key_raises_error(self):
        """Test that missing API key raises LLMCallError"""
        with patch.dict('os.environ', {}, clear=True):  # No API keys set
            with pytest.raises(LLMCallError, match="No API key available"):
                gpt_handler.run_llm("test prompt")
