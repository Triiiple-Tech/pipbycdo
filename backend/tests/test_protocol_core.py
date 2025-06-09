"""
Modern test suite for PIP AI Autonomous Agentic Manager Protocol Core
Tests the async implementation with proper fixtures and patterns.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from typing import Dict, Any, List

from backend.app.schemas import AppState, LLMConfig, File
from backend.services.intent_classifier import intent_classifier, IntentType
from backend.services.route_planner import RoutePlanner
from backend.agents.manager_agent import ManagerAgent


class TestIntentClassifier:
    """Test the async intent classification system"""

    @pytest.mark.asyncio
    async def test_classify_intent_full_estimation(self):
        """Test intent classification for full estimation scenario"""
        state = AppState(
            query="Please estimate this construction project",
            files=[
                File(filename="plans.pdf", type="pdf"),
                File(filename="specs.docx", type="docx")
            ]
        )
        
        with patch('backend.services.intent_classifier.run_llm') as mock_llm:
            mock_llm.return_value = "full_estimation"
            
            intent_type, metadata = await intent_classifier.classify_intent(state)
            
            assert intent_type == IntentType.FULL_ESTIMATION
            assert metadata["files_detected"] == 2
            assert metadata["confidence"] > 0.7

    @pytest.mark.asyncio
    async def test_classify_intent_smartsheet_integration(self):
        """Test intent classification for Smartsheet integration"""
        state = AppState(
            query="Push results to https://app.smartsheet.com/sheets/abc123"
        )
        
        with patch('backend.services.intent_classifier.run_llm') as mock_llm:
            mock_llm.return_value = "smartsheet_integration"
            
            intent_type, metadata = await intent_classifier.classify_intent(state)
            
            assert intent_type == IntentType.SMARTSHEET_INTEGRATION
            assert "smartsheet.com" in metadata["smartsheet_url"]

    def test_get_agent_sequence_for_intent(self):
        """Test agent sequence generation for different intents"""
        # Test full estimation sequence
        sequence = intent_classifier.get_agent_sequence_for_intent("full_estimation")
        expected = ["file_reader", "trade_mapper", "scope", "takeoff", "estimator"]
        assert sequence == expected
        
        # Test export only sequence
        sequence = intent_classifier.get_agent_sequence_for_intent("export_only")
        assert sequence == ["exporter"]
        
        # Test unknown intent fallback
        sequence = intent_classifier.get_agent_sequence_for_intent("unknown_intent")
        assert "file_reader" in sequence

    def test_intent_patterns(self):
        """Test pattern-based intent detection"""
        assert intent_classifier.name == "intent_classifier"
        assert "full_estimation" in intent_classifier.INTENT_DEFINITIONS
        assert "export_existing" in intent_classifier.INTENT_DEFINITIONS


class TestRoutePlanner:
    """Test the async route planning system"""

    @pytest.mark.asyncio
    async def test_plan_route_basic(self):
        """Test basic route planning functionality"""
        route_planner = RoutePlanner()
        state = AppState(
            query="Estimate this project",
            files=[File(filename="plan.pdf", type="pdf")]
        )
        
        mock_available_agents = {
            "file_reader": (MagicMock(), "files"),
            "trade_mapper": (MagicMock(), "processed_files_content"),
            "estimator": (MagicMock(), "takeoff_data")
        }
        
        with patch.object(intent_classifier, 'classify_intent') as mock_classify:
            mock_classify.return_value = (IntentType.FULL_ESTIMATION, {"confidence": 0.9})
            
            route_plan = await route_planner.plan_route(state, mock_available_agents)
            
            assert isinstance(route_plan, dict)
            assert "sequence" in route_plan
            assert len(route_plan["sequence"]) > 0


class TestManagerAgent:
    """Test the core ManagerAgent workflow orchestration"""
    
    @pytest.mark.asyncio
    async def test_execute_protocol_basic(self):
        """Test basic protocol execution"""
        manager_agent = ManagerAgent()
        state = AppState(
            query="Test protocol execution",
            files=[File(filename="test.pdf", type="pdf")]
        )

        # Mock all the major methods to avoid complex dependencies
        with patch.object(manager_agent, '_universal_intake') as mock_intake, \
             patch.object(manager_agent, '_execute_autonomous_workflow') as mock_execute, \
             patch.object(manager_agent, '_autonomous_output_management') as mock_output, \
             patch('backend.agents.manager_agent.route_planner') as mock_route_planner:

            mock_intake.return_value = {"status": "success"}  # Return dict, not AppState
            # Mock the route planner to have a synchronous plan_route method
            mock_route_planner.plan_route.return_value = {"sequence": ["estimator"], "skip_decisions": {}}
            mock_execute.return_value = state
            mock_output.return_value = state

            result_state = manager_agent.process(state)
            
            assert result_state is not None
            mock_intake.assert_called_once()


class TestProtocolBasics:
    """Basic integration tests for the protocol"""

    @pytest.mark.asyncio
    async def test_intent_classification_integration(self):
        """Test intent classification with real data"""
        state = AppState(
            query="Estimate electrical work for this project",
            files=[File(filename="electrical_plans.pdf", type="pdf")]
        )
        
        with patch('backend.services.intent_classifier.run_llm') as mock_llm:
            mock_llm.return_value = "full_estimation"
            
            intent_type, metadata = await intent_classifier.classify_intent(state)
            
            assert intent_type == IntentType.FULL_ESTIMATION
            assert metadata["files_detected"] == 1

    @pytest.mark.asyncio
    async def test_error_handling(self):
        """Test error handling in classification"""
        state = AppState(query="Invalid request")

        # Mock the _classify_with_llm method to raise an exception
        with patch.object(intent_classifier, '_classify_with_llm') as mock_llm:
            mock_llm.side_effect = Exception("LLM service unavailable")

            intent_type, metadata = await intent_classifier.classify_intent(state)

            assert intent_type == IntentType.UNKNOWN
            assert "error" in metadata


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
