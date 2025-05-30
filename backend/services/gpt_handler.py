# pipbycdo/backend/services/gpt_handler.py
import os
import logging
from openai import OpenAI
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class LLMCallError(Exception):
    """Custom exception for LLM call failures"""
    def __init__(self, message: str, error_type: str = "unknown", retry_with_fallback: bool = True):
        self.error_type = error_type
        self.retry_with_fallback = retry_with_fallback
        super().__init__(message)

def run_llm(prompt: str, model: str = "gpt-4o", system_prompt: Optional[str] = None, 
           api_key: Optional[str] = None, agent_name: Optional[str] = None, 
           max_retries: int = 3, **kwargs) -> str:
    """
    Run an LLM with the specified model and API key, with automatic fallback support.
    
    Args:
        prompt: The user prompt
        model: The model to use (default: gpt-4o)
        system_prompt: Optional system prompt
        api_key: The API key to use (if None, falls back to OPENAI_4o_KEY)
        agent_name: Name of the calling agent (for fallback model selection)
        max_retries: Maximum number of retry attempts with different configurations
        **kwargs: Additional parameters for the OpenAI API
    
    Returns:
        The response content from the LLM
        
    Raises:
        LLMCallError: If all attempts fail
    """
    # Use provided API key or fall back to a default
    if api_key is None:
        api_key = os.getenv("OPENAI_4o_KEY")
    
    if not api_key:
        raise LLMCallError(f"No API key available for model {model}", "missing_api_key", False)
    
    last_error = None
    current_model = model
    current_api_key = api_key
    
    for attempt in range(max_retries):
        try:
            logger.debug(f"LLM call attempt {attempt + 1}/{max_retries} with model '{current_model}'")
            
            client = OpenAI(api_key=current_api_key)
            
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})
            
            resp = client.chat.completions.create(
                model=current_model, messages=messages, **kwargs
            )
            
            result = resp.choices[0].message.content.strip()
            
            if attempt > 0:
                logger.info(f"LLM call succeeded on attempt {attempt + 1} with model '{current_model}'")
            
            return result
            
        except Exception as e:
            last_error = e
            error_msg = str(e)
            
            # Categorize the error
            error_type = _categorize_error(e)
            
            logger.warning(f"LLM call failed on attempt {attempt + 1}/{max_retries}: {error_msg}")
            
            # Try fallback on next iteration if we have an agent name and this isn't the last attempt
            if agent_name and attempt < max_retries - 1:
                fallback_config = _get_fallback_for_failed_call(
                    agent_name, current_model, error_msg, error_type
                )
                
                if fallback_config:
                    current_model = fallback_config["model"]
                    current_api_key = fallback_config["api_key"]
                    logger.info(f"Trying fallback: model '{current_model}' (reason: {error_type})")
                else:
                    logger.warning(f"No fallback available for agent '{agent_name}', model '{current_model}'")
                    break
            else:
                break
    
    # All attempts failed
    raise LLMCallError(
        f"All {max_retries} LLM call attempts failed. Last error: {str(last_error)}", 
        error_type if 'error_type' in locals() else "unknown",
        False
    )

def _categorize_error(error: Exception) -> str:
    """Categorize an error to determine if fallback is appropriate"""
    error_str = str(error).lower()
    
    if "rate limit" in error_str or "429" in error_str:
        return "rate_limit"
    elif "quota" in error_str or "billing" in error_str:
        return "quota_exceeded"
    elif "authentication" in error_str or "401" in error_str:
        return "auth_error"
    elif "model" in error_str and ("not found" in error_str or "404" in error_str):
        return "model_not_found"
    elif "timeout" in error_str or "connection" in error_str:
        return "network_error"
    elif "500" in error_str or "502" in error_str or "503" in error_str:
        return "server_error"
    else:
        return "unknown_error"

def _get_fallback_for_failed_call(agent_name: str, failed_model: str, error_msg: str, error_type: str) -> Optional[Dict[str, Any]]:
    """Get fallback configuration for a failed LLM call"""
    try:
        from backend.services.llm_selector import get_fallback_config
        return get_fallback_config(agent_name, failed_model, f"{error_type}: {error_msg}")
    except ImportError:
        logger.warning("Could not import get_fallback_config, fallback disabled")
        return None