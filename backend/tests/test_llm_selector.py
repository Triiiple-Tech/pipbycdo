import pytest
import os
from unittest.mock import patch
from backend.services.llm_selector import select_llm, AGENT_LLM_CONFIG, DEFAULT_LLM_CONFIG


class TestLLMSelectorRefactored:

    @patch.dict(os.environ, {"OPENAI_o4-mini_KEY": "o4_mini_api_key"})
    def test_select_llm_manager_agent_o4_mini(self):
        """Test LLM selection for manager agent, expecting o4-mini and the model-specific API key."""
        result = select_llm("manager", {})
        assert result["model"] == "o4-mini"
        assert result["api_key"] == "o4_mini_api_key"

    @patch.dict(os.environ, {"OPENAI_o3_KEY": "o3_api_key"})
    def test_select_llm_estimator_agent_o3_primary(self):
        """Test LLM selection for estimator agent, expecting o3 and the model-specific API key."""
        result = select_llm("estimator", {})
        assert result["model"] == "o3"
        assert result["api_key"] == "o3_api_key"

    @patch.dict(os.environ, {}, clear=True) # Simulate model-specific API key is not set
    def test_select_llm_estimator_agent_primary_key_missing(self):
        """Test estimator uses its preferred model (o3) but api_key is None if API key is missing."""
        result = select_llm("estimator", {})
        assert result["model"] == "o3" # Should still prefer o3 model
        assert result["api_key"] is None

    @patch.dict(os.environ, {"OPENAI_4.1-mini_KEY": "mini_api_key_for_default"})
    def test_select_llm_unknown_agent_uses_default_config(self):
        """Test LLM selection for an unknown agent, expecting default model and the model-specific API key."""
        result = select_llm("unknown_agent", {})
        assert result["model"] == DEFAULT_LLM_CONFIG["model"]
        assert result["api_key"] == "mini_api_key_for_default"
        assert DEFAULT_LLM_CONFIG["api_key_env_var"] == "OPENAI_4.1-mini_KEY" # Verify assumption

    @patch.dict(os.environ, clear=True) # No API keys set at all
    def test_select_llm_all_keys_missing_returns_none_for_api_key(self):
        """Test LLM selection returns None for api_key when model-specific API keys are not set."""
        # Manager
        result_manager = select_llm("manager", {})
        assert result_manager["model"] == AGENT_LLM_CONFIG["manager"][0]["model"]
        assert result_manager["api_key"] is None

        # Estimator
        result_estimator = select_llm("estimator", {})
        assert result_estimator["model"] == AGENT_LLM_CONFIG["estimator"][0]["model"]
        assert result_estimator["api_key"] is None
        
        # Unknown Agent (uses Default)
        result_unknown = select_llm("unknown_agent_no_keys", {})
        assert result_unknown["model"] == DEFAULT_LLM_CONFIG["model"]
        assert result_unknown["api_key"] is None

    def test_agent_llm_config_structure_uses_model_specific_keys(self):
        """Test that AGENT_LLM_CONFIG correctly specifies model-specific API keys for agents."""
        assert "manager" in AGENT_LLM_CONFIG
        assert isinstance(AGENT_LLM_CONFIG["manager"], list)
        assert len(AGENT_LLM_CONFIG["manager"]) > 0
        manager_config = AGENT_LLM_CONFIG["manager"][0]
        assert "model" in manager_config
        assert "api_key_env_var" in manager_config
        assert manager_config["model"] == "o4-mini"
        assert manager_config["api_key_env_var"] == "OPENAI_o4-mini_KEY"

        assert "estimator" in AGENT_LLM_CONFIG
        assert isinstance(AGENT_LLM_CONFIG["estimator"], list)
        assert len(AGENT_LLM_CONFIG["estimator"]) >= 1 # Check at least primary
        estimator_primary_config = AGENT_LLM_CONFIG["estimator"][0]
        assert estimator_primary_config["model"] == "o3"
        assert estimator_primary_config["api_key_env_var"] == "OPENAI_o3_KEY"
        
        # Check that estimator fallback configs use their respective model-specific keys
        estimator_fallback_config = AGENT_LLM_CONFIG["estimator"][1]
        assert estimator_fallback_config["model"] == "gpt-4o"
        assert estimator_fallback_config["api_key_env_var"] == "OPENAI_4o_KEY"

        # Check DEFAULT_LLM_CONFIG uses model-specific key
        assert DEFAULT_LLM_CONFIG["api_key_env_var"] == "OPENAI_4.1-mini_KEY"


    @patch.dict(os.environ, {"OPENAI_o4-mini_KEY": "o4_mini_key_for_state_test"})
    def test_select_llm_with_state_param_does_not_alter_logic(self):
        """Test that the state parameter, while accepted, doesn't change current selection logic."""
        mock_state = {"user_preference": "some_other_model"}
        result = select_llm("manager", mock_state)
        assert result["model"] == "o4-mini"
        assert result["api_key"] == "o4_mini_key_for_state_test"

    @patch.dict(os.environ, {"OPENAI_4.1-mini_KEY": "mini_key_to_rule_them_all"})
    def test_default_llm_config_usage_for_unlisted_agent(self):
        """Test that DEFAULT_LLM_CONFIG is used correctly for an agent not in AGENT_LLM_CONFIG."""
        result = select_llm("some_new_agent_not_in_config", {})
        assert result["model"] == DEFAULT_LLM_CONFIG["model"]
        assert result["api_key"] == "mini_key_to_rule_them_all"
        assert DEFAULT_LLM_CONFIG["api_key_env_var"] == "OPENAI_4.1-mini_KEY"

    # The following tests are removed as they're no longer relevant with the model-specific API key strategy.
    # Each model now has its own dedicated API key, providing better load balancing and redundancy.
    # If a model-specific API key is missing, api_key will be None for that specific model.
