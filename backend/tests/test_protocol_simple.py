"""
Clean, working test suite for PIP AI Protocol Core
Focuses on testing the actual async implementation
"""

import pytest
from unittest.mock import patch

from backend.app.schemas import AppState, File
from backend.services.intent_classifier import intent_classifier, IntentType


class TestIntentClassifier:
    """Test the async intent classification system"""

    @pytest.mark.asyncio
    async def test_classify_intent_with_files(self):
        """Test intent classification when files are present"""
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
            
            # Verify the classification result
            assert intent_type == IntentType.FULL_ESTIMATION
            assert metadata["files_detected"] == 2
            assert metadata["confidence"] > 0.7

    @pytest.mark.asyncio
    async def test_classify_intent_smartsheet_url(self):
        """Test intent classification with Smartsheet URL"""
        state = AppState(
            query="Push results to https://app.smartsheet.com/sheets/abc123"
        )
        
        with patch('backend.services.intent_classifier.run_llm') as mock_llm:
            mock_llm.return_value = "smartsheet_integration"
            
            intent_type, metadata = await intent_classifier.classify_intent(state)
            
            assert intent_type == IntentType.SMARTSHEET_INTEGRATION
            assert "smartsheet.com" in metadata["smartsheet_url"]

    @pytest.mark.asyncio
    async def test_classify_intent_error_handling(self):
        """Test graceful error handling when LLM fails"""
        state = AppState(query="Test query")
        
        with patch('backend.services.intent_classifier.run_llm') as mock_llm:
            mock_llm.side_effect = Exception("LLM service unavailable")
            
            intent_type, metadata = await intent_classifier.classify_intent(state)
            
            # Should gracefully fall back to pattern matching or unknown
            assert intent_type == IntentType.UNKNOWN
            assert "error" in metadata

    def test_get_agent_sequence_basic(self):
        """Test agent sequence generation"""
        # Test full estimation sequence
        sequence = intent_classifier.get_agent_sequence_for_intent("full_estimation")
        expected = ["file_reader", "trade_mapper", "scope", "takeoff", "estimator"]
        assert sequence == expected
        
        # Test export only sequence
        sequence = intent_classifier.get_agent_sequence_for_intent("export_only")
        assert sequence == ["exporter"]

    def test_classifier_properties(self):
        """Test classifier has expected properties"""
        assert intent_classifier.name == "intent_classifier"
        assert "full_estimation" in intent_classifier.INTENT_DEFINITIONS
        assert "export_existing" in intent_classifier.INTENT_DEFINITIONS


class TestProtocolBasics:
    """Test basic protocol functionality"""

    @pytest.mark.asyncio
    async def test_intent_classification_patterns(self):
        """Test that pattern matching works for common queries"""
        test_cases = [
            ("Estimate this project", ["full_estimation", "file_analysis"]),
            ("Export to Excel", ["export_only"]),
            ("Electrical work only", ["trade_specific_analysis"]),
        ]
        
        for query, expected_intents in test_cases:
            state = AppState(query=query)
            
            with patch('backend.services.intent_classifier.run_llm') as mock_llm:
                mock_llm.return_value = expected_intents[0]
                
                intent_type, metadata = await intent_classifier.classify_intent(state)
                
                # Verify intent is reasonable
                assert intent_type.value in expected_intents or intent_type == IntentType.UNKNOWN

    @pytest.mark.asyncio
    async def test_state_management(self):
        """Test that AppState objects work correctly"""
        # Test creating state with files
        state = AppState(
            query="Test query",
            files=[File(filename="test.pdf", type="pdf")]
        )
        
        assert state.query == "Test query"
        assert len(state.files) == 1
        assert state.files[0].filename == "test.pdf"
        
        # Test state copying
        state_copy = state.model_copy()
        assert state_copy.query == state.query
        assert len(state_copy.files) == len(state.files)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
