"""
Integration test for the enhanced routing system.
This test validates the complete flow from intent classification through route planning.
"""
import pytest
from unittest.mock import patch
from backend.services.intent_classifier import intent_classifier
from backend.services.route_planner import route_planner
from backend.app.schemas import AppState, File, EstimateItem


def dummy_agent(state):
    """Simple dummy agent for testing."""
    return state


class TestEnhancedRoutingIntegration:
    """Test the complete enhanced routing system integration."""

    @patch('backend.services.intent_classifier.run_llm')
    def test_full_estimation_workflow(self, mock_llm):
        """Test complete workflow for full estimation intent."""
        # Mock LLM response for intent classification
        mock_llm.return_value = '{"primary_intent": "full_estimation", "confidence": 0.95, "reasoning": "User uploaded files and explicitly requested estimation"}'
        
        # Create test state with files
        state = AppState(
            query="Please provide a detailed estimate for this construction project",
            files=[
                File(filename="blueprints.pdf", type="pdf"),
                File(filename="specs.docx", type="docx")
            ]
        )
        
        # Test intent classification
        intent_result = intent_classifier.classify_intent(state)
        assert intent_result["primary_intent"] == "full_estimation"
        assert intent_result["confidence"] >= 0.9
            
        available_agents = {
            "file_reader": (dummy_agent, "processed_files_content"),
            "trade_mapper": (dummy_agent, "trade_mapping"), 
            "scope": (dummy_agent, "scope_items"),
            "takeoff": (dummy_agent, "takeoff_data"),
            "estimator": (dummy_agent, None)
        }
        
        route_result = route_planner.plan_route(state, available_agents)
        
        assert "sequence" in route_result
        assert len(route_result["sequence"]) > 0
        # Should include key agents for full estimation with fresh files
        assert "file_reader" in route_result["sequence"]
        assert "estimator" in route_result["sequence"]

    @patch('backend.services.intent_classifier.run_llm')
    def test_export_existing_workflow(self, mock_llm):
        """Test workflow for exporting existing estimate."""
        # Mock LLM response for export intent
        mock_llm.return_value = '{"primary_intent": "export_existing", "confidence": 0.92, "reasoning": "User has existing estimate and wants export functionality"}'
        
        # Create state with existing estimate
        state = AppState(
            query="Export the current estimate to Excel",
            estimate=[
                EstimateItem(item="Labor", qty=1, unit="LS", unit_price=30000, total=30000),
                EstimateItem(item="Materials", qty=1, unit="LS", unit_price=20000, total=20000)
            ]
        )
        
        intent_result = intent_classifier.classify_intent(state)
        assert intent_result["primary_intent"] == "export_existing"
        
        # Test with minimal agents
        available_agents = {
            "exporter": (dummy_agent, None),
            "estimator": (dummy_agent, None)
        }
        
        route_result = route_planner.plan_route(state, available_agents)
        
        # Should prefer exporter for existing data
        assert "exporter" in route_result["sequence"]

    @patch('backend.services.intent_classifier.run_llm')
    def test_smart_skip_optimization(self, mock_llm):
        """Test that the system intelligently skips unnecessary agents."""
        # Mock LLM response
        mock_llm.return_value = '{"primary_intent": "quick_estimate", "confidence": 0.85, "reasoning": "User wants quick estimate with existing data"}'
        
        # Create state with some existing processed data
        state = AppState(
            query="Give me a quick estimate",
            processed_files_content={"plan.pdf": "Construction project data"},
            trade_mapping=[{"trade": "concrete", "items": ["foundation", "slab"]}],
            scope_items=[{"item": "foundation work"}, {"item": "electrical installation"}]
        )
        
        available_agents = {
            "file_reader": (dummy_agent, "processed_files_content"),
            "trade_mapper": (dummy_agent, "trade_mapping"),
            "scope": (dummy_agent, "scope_items"),
            "takeoff": (dummy_agent, "takeoff_data"),
            "estimator": (dummy_agent, None)
        }
        
        route_result = route_planner.plan_route(state, available_agents)
        
        # Should skip agents that already have fresh data
        assert "file_reader" not in route_result["sequence"]
        assert "trade_mapper" not in route_result["sequence"]
        assert "scope" not in route_result["sequence"]
        
        # Should include agents that still need to run
        assert "takeoff" in route_result["sequence"]
        assert "estimator" in route_result["sequence"]

    def test_fallback_classification_reliability(self):
        """Test that fallback classification works when LLM fails."""
        # Create state that would trigger fallback
        state = AppState(
            query="Estimate this building project",
            files=[File(filename="plans.pdf", type="pdf")]
        )
        
        # Don't mock LLM - let it fail and trigger fallback
        with patch('backend.services.intent_classifier.run_llm', side_effect=Exception("LLM unavailable")):
            result = intent_classifier.classify_intent(state)
            
            # Should fallback to rule-based classification
            assert result["primary_intent"] == "full_estimation"  # Files present
            assert result["fallback_used"] is True
            assert result["confidence"] >= 0.6  # Reasonable confidence from rules

    @patch('backend.services.intent_classifier.run_llm') 
    def test_route_optimization_applied(self, mock_llm):
        """Test that route optimization is properly applied."""
        mock_llm.return_value = '{"primary_intent": "full_estimation", "confidence": 0.9, "reasoning": "Full estimation requested"}'
        
        state = AppState(
            query="Full estimate needed",
            files=[File(filename="docs.pdf", type="pdf")]
        )
        
        available_agents = {
            "file_reader": (dummy_agent, "processed_files_content"),
            "trade_mapper": (dummy_agent, "trade_mapping"),
            "scope": (dummy_agent, "scope_items"),
            "takeoff": (dummy_agent, "takeoff_data"),
            "estimator": (dummy_agent, None),
            "qa_validator": (dummy_agent, None)  # Optional agent
        }
        
        route_result = route_planner.plan_route(state, available_agents)
        
        # Verify optimization was applied
        assert route_result["optimization_applied"] is True
        
        # Should have logical sequence
        sequence = route_result["sequence"]
        if "file_reader" in sequence and "trade_mapper" in sequence:
            assert sequence.index("file_reader") < sequence.index("trade_mapper")
        if "scope" in sequence and "takeoff" in sequence:
            assert sequence.index("scope") < sequence.index("takeoff")
        if "takeoff" in sequence and "estimator" in sequence:
            assert sequence.index("takeoff") < sequence.index("estimator")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
