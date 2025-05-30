"""
Test suite for enhanced routing functionality.
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from backend.services.intent_classifier import intent_classifier
from backend.services.route_planner import route_planner
from backend.app.schemas import AppState, File


def test_intent_classifier_import():
    """Test that we can import the intent classifier."""
    assert intent_classifier is not None
    assert intent_classifier.name == "intent_classifier"


def test_route_planner_import():
    """Test that we can import the route planner."""
    assert route_planner is not None
    assert route_planner.name == "route_planner"


@patch('backend.services.intent_classifier.run_llm')
def test_intent_classification_basic(mock_gpt):
    """Test basic intent classification."""
    # Mock LLM response - use the correct key names expected by the classifier
    mock_gpt.return_value = '{"primary_intent": "full_estimation", "confidence": 0.9, "reasoning": "User uploaded files and wants estimation"}'
    
    state = AppState(
        query="Please estimate this project",
        files=[File(filename="plan.pdf", type="pdf")]
    )
    
    result = intent_classifier.classify_intent(state)
    
    assert result["primary_intent"] == "full_estimation"
    assert result["confidence"] >= 0.9
    assert "reasoning" in result


@patch('backend.services.intent_classifier.run_llm')
def test_route_planning_basic(mock_gpt):
    """Test basic route planning functionality."""
    # Mock LLM response for intent classification used by route planner
    mock_gpt.return_value = '{"primary_intent": "full_estimation", "confidence": 0.9, "reasoning": "User uploaded files and wants estimation"}'
    
    state = AppState(
        query="Estimate this project",
        files=[File(filename="plan.pdf", type="pdf")]
    )
    
    # Mock some existing analysis data
    state.processed_files_content = {"plan.pdf": "Sample project data"}
    
    available_agents = {
        "file_reader": (lambda s: s, "files"),
        "trade_mapper": (lambda s: s, "processed_files_content"),
        "scope": (lambda s: s, "trade_mapping"),
        "takeoff": (lambda s: s, "scope_items"),
        "estimator": (lambda s: s, "takeoff_data"),
        "exporter": (lambda s: s, None)
    }
    
    result = route_planner.plan_route(state, available_agents)
    
    # Check for the correct keys returned by route planner
    assert "sequence" in result
    assert "optimization_applied" in result
    assert len(result["sequence"]) > 0


def test_context_gathering():
    """Test context gathering for intent classification."""
    state = AppState(
        query="Quick estimate for concrete work",
        files=[]
    )
    
    context = intent_classifier._gather_context(state)
    
    assert context["has_query"] is True
    assert context["has_files"] is False
    assert context["file_count"] == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
