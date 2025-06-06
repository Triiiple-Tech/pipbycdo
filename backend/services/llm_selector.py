import os
import logging
from typing import Dict, List, Optional, Tuple, Union, Any

logger = logging.getLogger(__name__)

# Strategic Agent Model Assignments - Optimized for Cost vs Capability
# Using latest OpenAI model names with component-to-model mapping
AGENT_LLM_CONFIG: Dict[str, List[Dict[str, Union[str, List[str]]]]] = {
    "manager": [
        {"model": "o4-mini", "api_key_env_vars": ["OPENAI_o4-mini_KEY", "OPENAI_4o_KEY"]}, # Manager uses o4-mini
    ],
    "estimator": [
        {"model": "o3", "api_key_env_vars": ["OPENAI_o3_KEY", "OPENAI_4o_KEY"]}, # Estimator uses o3
        {"model": "gpt-4o", "api_key_env_vars": ["OPENAI_4o_KEY"]}, # Fallback
    ],
    "file_reader": [
        {"model": "gpt-4.1", "api_key_env_vars": ["OPENAI_4.1_KEY", "OPENAI_4o_KEY"]} # File Reader uses gpt-4.1
    ],
    "trade_mapper": [
        {"model": "gpt-4.1-mini", "api_key_env_vars": ["OPENAI_4.1-mini_KEY", "OPENAI_4.1_KEY"]} # Trade Mapper uses gpt-4.1-mini
    ],
    "scope": [  # Note: using "scope" to match agent name in pipeline
        {"model": "gpt-4.1-mini", "api_key_env_vars": ["OPENAI_4.1-mini_KEY", "OPENAI_4.1_KEY"]} # Scope uses gpt-4.1-mini
    ],
    "takeoff": [  # Note: using "takeoff" to match agent name in pipeline
        {"model": "gpt-4.1-mini", "api_key_env_vars": ["OPENAI_4.1-mini_KEY", "OPENAI_4.1_KEY"]} # Takeoff uses gpt-4.1-mini
    ],
    "qa_validator": [
        {"model": "o4-mini", "api_key_env_vars": ["OPENAI_o4-mini_KEY", "OPENAI_4o_KEY"]} # QA Validator uses o4-mini
    ],
    "exporter": [
        {"model": "gpt-4o", "api_key_env_vars": ["OPENAI_4o_KEY"]} # Exporter uses GPT-4o
    ]
}

# Fallback/default configuration with multi-key support
DEFAULT_LLM_CONFIG: Dict[str, Union[str, List[str]]] = {
    "model": "o4-mini", 
    "api_key_env_vars": ["OPENAI_o4-mini_KEY", "OPENAI_4o_KEY"]
}

def select_llm(agent_name: str, state: Dict[str, Any]) -> Dict[str, Optional[str]]:
    """
    Selects an LLM configuration for a given agent with multi-key fallback support.
    
    Features:
    - Prioritizes agent-specific configuration from AGENT_LLM_CONFIG
    - Uses the first model in the list for the agent
    - Tries multiple API keys in order for redundancy
    - Falls back to DEFAULT_LLM_CONFIG if agent is not found
    - Returns the first working API key found
    
    Returns:
        dict: {"model": str, "api_key": str|None, "api_key_source": str}
    """
    agent_configs = AGENT_LLM_CONFIG.get(agent_name)
    
    selected_model_name: Optional[str] = None
    api_key_env_vars: Optional[List[str]] = None

    if agent_configs:
        # Use the first model configuration in the list
        preferred_model_config = agent_configs[0]
        model_value = preferred_model_config.get("model")
        api_key_value = preferred_model_config.get("api_key_env_vars", [])
        
        # Ensure correct types
        if isinstance(model_value, str):
            selected_model_name = model_value
        if isinstance(api_key_value, list):
            api_key_env_vars = api_key_value
        
        if not selected_model_name:
            logger.warning(f"No model name specified in preferred config for agent '{agent_name}'.")
        if not api_key_env_vars:
            logger.warning(f"No API key environment variables specified for agent '{agent_name}', model '{selected_model_name}'.")

    # Fallback logic
    if not selected_model_name or not api_key_env_vars:
        logger.info(
            f"Agent '{agent_name}' not found in AGENT_LLM_CONFIG or model/key env vars missing. "
            f"Using default LLM config: model '{DEFAULT_LLM_CONFIG['model']}'"
        )
        default_model = DEFAULT_LLM_CONFIG["model"]
        default_api_keys = DEFAULT_LLM_CONFIG["api_key_env_vars"]
        
        if isinstance(default_model, str):
            selected_model_name = default_model
        if isinstance(default_api_keys, list):
            api_key_env_vars = default_api_keys

    # Try API keys in order until we find one that works
    if api_key_env_vars and selected_model_name:
        api_key, api_key_source = _get_working_api_key(api_key_env_vars, agent_name, selected_model_name)
    else:
        api_key, api_key_source = None, None

    return {
        "model": selected_model_name, 
        "api_key": api_key,
        "api_key_source": api_key_source
    }

def _get_working_api_key(api_key_env_vars: List[str], agent_name: str, model_name: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Tries multiple API key environment variables in order and returns the first working one.
    
    Args:
        api_key_env_vars: List of environment variable names to try
        agent_name: Name of the agent (for logging)
        model_name: Name of the model (for logging)
    
    Returns:
        tuple: (api_key, source_env_var) or (None, None) if none found
    """
    for env_var in api_key_env_vars:
        api_key = os.getenv(env_var)
        if api_key and api_key.strip():
            logger.debug(f"Using API key from '{env_var}' for agent '{agent_name}', model '{model_name}'")
            return api_key.strip(), env_var
        else:
            logger.debug(f"API key '{env_var}' not available for agent '{agent_name}', model '{model_name}'")
    
    # No working API key found
    logger.error(
        f"No working API keys found for agent '{agent_name}', model '{model_name}'. "
        f"Tried: {', '.join(api_key_env_vars)}"
    )
    return None, None

def get_fallback_config(agent_name: str, failed_model: str, error_reason: str) -> Optional[Dict[str, Union[str, bool, None]]]:
    """
    Gets a fallback model configuration when the primary model fails.
    
    Args:
        agent_name: Name of the agent that failed
        failed_model: The model that failed
        error_reason: Reason for the failure
    
    Returns:
        dict: Fallback config or None if no fallback available
    """
    agent_configs = AGENT_LLM_CONFIG.get(agent_name, [])
    
    # Try the next model in the agent's list
    for i, config in enumerate(agent_configs):
        if config["model"] == failed_model and i + 1 < len(agent_configs):
            fallback_config = agent_configs[i + 1]
            fallback_model_value = fallback_config["model"]
            api_key_value = fallback_config.get("api_key_env_vars", [])
            
            # Ensure correct types
            if isinstance(fallback_model_value, str) and isinstance(api_key_value, list):
                fallback_model = fallback_model_value
                api_key_env_vars = api_key_value
                
                # Get working API key for fallback model
                api_key, api_key_source = _get_working_api_key(api_key_env_vars, agent_name, fallback_model)
                
                if api_key:
                    logger.info(
                        f"Using fallback model '{fallback_model}' for agent '{agent_name}' "
                        f"(primary '{failed_model}' failed: {error_reason})"
                    )
                    return {
                        "model": fallback_model,
                        "api_key": api_key,
                        "api_key_source": api_key_source,
                        "is_fallback": True,
                        "failed_model": failed_model,
                        "failure_reason": error_reason
                    }
    
    logger.warning(f"No fallback model available for agent '{agent_name}' after '{failed_model}' failed")
    return None
