import pytest
from unittest.mock import Mock, patch
import json
from backend.services import gpt_handler

class TestGPTHandler:
    def test_gpt_handler_module_exists(self):
        """Test GPT handler module exists"""
        assert gpt_handler is not None
        
    @patch('backend.services.gpt_handler.OpenAI')
    def test_run_llm_success(self, mock_openai):
        """Test successful LLM response"""
        # Mock OpenAI client and response
        mock_client = Mock()
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = 'test response'
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai.return_value = mock_client
        
        # Mock the _client in gpt_handler
        with patch('backend.services.gpt_handler._client', mock_client):
            result = gpt_handler.run_llm("test prompt")
            
            assert result == "test response"
            mock_client.chat.completions.create.assert_called_once()
        
    @patch('backend.services.gpt_handler.OpenAI')
    def test_run_llm_with_system_prompt(self, mock_openai):
        """Test LLM response with system prompt"""
        mock_client = Mock()
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message.content = 'system response'
        mock_client.chat.completions.create.return_value = mock_response
        mock_openai.return_value = mock_client
        
        with patch('backend.services.gpt_handler._client', mock_client):
            result = gpt_handler.run_llm("test prompt", system_prompt="You are a helpful assistant")
            
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
        
        with patch('backend.services.gpt_handler._client', mock_client):
            with pytest.raises(Exception):
                gpt_handler.run_llm("test prompt")
                
    def test_run_llm_model_parameter(self):
        """Test model parameter usage"""
        with patch('backend.services.gpt_handler._client') as mock_client:
            mock_response = Mock()
            mock_response.choices = [Mock()]
            mock_response.choices[0].message.content = 'response'
            mock_client.chat.completions.create.return_value = mock_response
            
            gpt_handler.run_llm("test prompt", model="gpt-3.5-turbo")
            
            call_args = mock_client.chat.completions.create.call_args
            assert call_args[1]['model'] == "gpt-3.5-turbo"
