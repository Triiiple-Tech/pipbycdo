"""
Simplified async test suite for PIP AI Protocol core functionality.
Focus on testing the essential async workflows that are currently working.
"""

import pytest
from unittest.mock import patch

from backend.app.schemas import AppState, File, LLMConfig, EstimateItem
from backend.services.intent_classifier import IntentClassifier, IntentType, intent_classifier
from backend.services.route_planner import RoutePlanner


class TestAsyncIntentClassifier:
    """Test async intent classification core functionality."""
    
    def test_initialization(self):
        """Test intent classifier initialization."""
        classifier = IntentClassifier()
        assert classifier.name == "intent_classifier"
        assert hasattr(classifier, 'intent_patterns')
        assert hasattr(classifier, 'INTENT_DEFINITIONS')
    
    def test_get_agent_sequence_for_intent(self):
        """Test agent sequence retrieval for different intents."""
        classifier = IntentClassifier()
        
        # Test full estimation sequence
        sequence = classifier.get_agent_sequence_for_intent("full_estimation")
        expected = ["file_reader", "trade_mapper", "scope", "takeoff", "estimator"]
        assert sequence == expected
        
        # Test export only sequence  
        sequence = classifier.get_agent_sequence_for_intent("export_only")
        assert sequence == ["exporter"]
        
        # Test unknown intent defaults
        sequence = classifier.get_agent_sequence_for_intent("unknown_intent")
        assert "file_reader" in sequence
        assert "estimator" in sequence
    
    @pytest.mark.asyncio
    async def test_classify_intent_basic(self):
        """Test basic intent classification with simple state."""
        state = AppState(
            query="Please estimate this construction project",
            files=[File(filename="plans.pdf")]
        )
        
        with patch('backend.services.intent_classifier.run_llm') as mock_llm:
            mock_llm.return_value = "full_estimation"
            
            intent_type, metadata = await intent_classifier.classify_intent(state)
            
            assert intent_type == IntentType.FULL_ESTIMATION
            assert metadata["files_detected"] == 1
            assert metadata["confidence"] > 0.7
            assert "classified_at" in metadata
    
    @pytest.mark.asyncio  
    async def test_classify_intent_smartsheet(self):
        """Test intent classification with Smartsheet URL."""
        state = AppState(
            query="Analyze this project: https://app.smartsheet.com/sheets/abc123"
        )
        
        with patch('backend.services.intent_classifier.run_llm') as mock_llm:
            mock_llm.return_value = "smartsheet_integration"
            
            intent_type, metadata = await intent_classifier.classify_intent(state)
            
            assert intent_type == IntentType.SMARTSHEET_INTEGRATION
            assert metadata["smartsheet_url"] == "https://app.smartsheet.com/sheets/abc123"
            assert metadata["confidence"] >= 0.9


class TestAsyncRoutePlanner:
    """Test async route planning core functionality."""
    
    @pytest.mark.asyncio
    async def test_plan_route_basic(self):
        """Test basic route planning."""
        planner = RoutePlanner()
        state = AppState(
            query="Estimate this project",
            files=[File(filename="plans.pdf")]
        )
        
        # Simple available agents dict
        available_agents = {
            "file_reader": (lambda x: x, "files"),
            "trade_mapper": (lambda x: x, "processed_files_content"),
            "estimator": (lambda x: x, "takeoff_data")
        }
        
        with patch.object(intent_classifier, 'classify_intent') as mock_classify:
            mock_classify.return_value = (IntentType.FULL_ESTIMATION, {"confidence": 0.9})
            
            route_plan = await planner.plan_route(state, available_agents)
            
            assert "sequence" in route_plan
            assert isinstance(route_plan["sequence"], list)
            assert len(route_plan["sequence"]) > 0


class TestIntegratedAsyncWorkflow:
    """Integration tests for complete async workflow."""
    
    @pytest.mark.asyncio
    async def test_intent_to_route_flow(self):
        """Test complete flow from intent classification to route planning."""
        state = AppState(
            query="Generate cost estimate for this project",
            files=[File(filename="plans.pdf")]
        )
        
        # Step 1: Test intent classification
        with patch('backend.services.intent_classifier.run_llm') as mock_llm:
            mock_llm.return_value = "full_estimation"
            
            intent_type, metadata = await intent_classifier.classify_intent(state)
            assert intent_type == IntentType.FULL_ESTIMATION
        
        # Step 2: Test route planning with that intent
        planner = RoutePlanner()
        available_agents = {
            "file_reader": (lambda x: x, "files"),
            "trade_mapper": (lambda x: x, "processed_files_content"),
            "scope": (lambda x: x, "trade_mapping"),
            "estimator": (lambda x: x, "takeoff_data")
        }
        
        with patch.object(intent_classifier, 'classify_intent') as mock_classify:
            mock_classify.return_value = (intent_type, metadata)
            
            route_plan = await planner.plan_route(state, available_agents)
            
            assert "sequence" in route_plan
            assert "file_reader" in route_plan["sequence"]
            assert len(route_plan["sequence"]) >= 2
    
    @pytest.mark.asyncio
    async def test_smartsheet_workflow(self):
        """Test Smartsheet-specific workflow."""
        state = AppState(
            query="Push to Smartsheet: https://app.smartsheet.com/sheets/test123"
        )
        
        with patch('backend.services.intent_classifier.run_llm') as mock_llm:
            mock_llm.return_value = "smartsheet_integration"
            
            intent_type, metadata = await intent_classifier.classify_intent(state)
            
            assert intent_type == IntentType.SMARTSHEET_INTEGRATION
            assert metadata["smartsheet_url"] == "https://app.smartsheet.com/sheets/test123"
            
            # Verify sequence includes smartsheet agent
            sequence = intent_classifier.get_agent_sequence_for_intent("smartsheet_integration")
            assert "smartsheet" in sequence


class TestProtocolStateTracking:
    """Test protocol state management."""
    
    @pytest.mark.asyncio
    async def test_state_trace_logging(self):
        """Test that intent classification adds trace entries."""
        state = AppState(query="test query")
        
        with patch('backend.services.intent_classifier.run_llm') as mock_llm:
            mock_llm.return_value = "full_estimation"
            
            await intent_classifier.classify_intent(state)
            
            # Verify trace entry was added
            assert len(state.agent_trace) > 0
            trace_entry = state.agent_trace[-1]
            assert trace_entry.agent == "intent_classifier"
            assert "Classified intent" in trace_entry.decision
    
    def test_intent_definitions(self):
        """Test that all intent types have definitions."""
        classifier = IntentClassifier()
        
        for intent_type in IntentType:
            sequence = classifier.get_agent_sequence_for_intent(intent_type.value)
            assert isinstance(sequence, list)
            # All intents should have at least an empty list (valid for rerun_agent)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--asyncio-mode=auto"])
