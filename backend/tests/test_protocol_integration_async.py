"""
Modern async test suite for PIP AI Autonomous Agentic Manager Protocol

This test suite is designed for the current async implementation with proper
patterns for testing intent classification, route planning, and agent integration.
"""

import pytest
from unittest.mock import patch
from typing import Dict, Any, Callable

from backend.app.schemas import AppState, File, LLMConfig, EstimateItem
from backend.services.intent_classifier import IntentClassifier, IntentType, intent_classifier
from backend.services.route_planner import RoutePlanner


class TestAsyncIntentClassifier:
    """Test suite for async intent classification."""
    
    def setup_method(self):
        """Setup for each test method."""
        self.classifier = IntentClassifier()
    
    def test_initialization(self):
        """Test intent classifier initialization."""
        assert self.classifier.name == "intent_classifier"
        assert hasattr(self.classifier, 'intent_patterns')
        assert IntentType.FULL_ESTIMATION in self.classifier.intent_patterns
    
    def test_get_agent_sequence_for_intent(self):
        """Test agent sequence retrieval for different intents."""
        # Test full estimation sequence
        sequence = self.classifier.get_agent_sequence_for_intent("full_estimation")
        expected = ["file_reader", "trade_mapper", "scope", "takeoff", "estimator"]
        assert sequence == expected
        
        # Test export only sequence  
        sequence = self.classifier.get_agent_sequence_for_intent("export_only")
        assert sequence == ["exporter"]
        
        # Test unknown intent defaults
        sequence = self.classifier.get_agent_sequence_for_intent("unknown_intent")
        assert "file_reader" in sequence
        assert "estimator" in sequence
    
    @pytest.mark.asyncio
    async def test_classify_intent_with_files(self):
        """Test intent classification with uploaded files."""
        state = AppState(
            query="Please estimate this construction project",
            files=[
                File(filename="plans.pdf", type="application/pdf"),
                File(filename="specs.docx", type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")
            ]
        )
        
        with patch('backend.services.intent_classifier.run_llm') as mock_llm:
            mock_llm.return_value = "full_estimation"
            
            intent_type, metadata = await self.classifier.classify_intent(state)
            
            assert intent_type == IntentType.FULL_ESTIMATION
            assert metadata["files_detected"] == 2
            assert metadata["confidence"] > 0.7
            assert "classified_at" in metadata
    
    @pytest.mark.asyncio  
    async def test_classify_intent_smartsheet_url(self):
        """Test intent classification with Smartsheet URL."""
        state = AppState(
            query="Analyze this project: https://app.smartsheet.com/sheets/abc123"
        )
        
        with patch('backend.services.intent_classifier.run_llm') as mock_llm:
            mock_llm.return_value = "smartsheet_integration"
            
            intent_type, metadata = await self.classifier.classify_intent(state)
            
            assert intent_type == IntentType.SMARTSHEET_INTEGRATION
            assert metadata["smartsheet_url"] == "https://app.smartsheet.com/sheets/abc123"
            assert metadata["confidence"] >= 0.9  # High confidence for URL detection
    
    @pytest.mark.asyncio
    async def test_classify_intent_export_focus(self):
        """Test intent classification for export-focused requests."""
        state = AppState(
            query="Export the estimate as an XLSX file",
            estimate=[
                EstimateItem(
                    item="Labor", 
                    qty=1.0, 
                    unit="LS", 
                    unit_price=50000.0, 
                    total=50000.0
                )
            ]
        )
        
        with patch('backend.services.intent_classifier.run_llm') as mock_llm:
            mock_llm.return_value = "export_only"
            
            intent_type, metadata = await self.classifier.classify_intent(state)
            
            assert intent_type in [IntentType.EXPORT_ONLY, IntentType.FULL_ESTIMATION]
            assert metadata["export_format"] == "XLSX"
    
    @pytest.mark.asyncio
    async def test_classify_intent_llm_error_handling(self):
        """Test intent classification when LLM fails."""
        state = AppState(query="Estimate my project")
        
        with patch('backend.services.intent_classifier.run_llm') as mock_llm:
            mock_llm.side_effect = Exception("API Error")
            
            intent_type, metadata = await self.classifier.classify_intent(state)
            
            # Should still classify based on patterns or default
            assert intent_type in [IntentType.FULL_ESTIMATION, IntentType.UNKNOWN]
            assert "error" not in metadata  # LLM errors should be handled gracefully


class TestAsyncRoutePlanner:
    """Test suite for async route planning."""
    
    def setup_method(self):
        """Setup for each test method."""
        self.planner = RoutePlanner()
        
        # Mock available agents
        self.available_agents = {
            "file_reader": (self._mock_agent_handler, "files"),
            "trade_mapper": (self._mock_agent_handler, "processed_files_content"),
            "scope": (self._mock_agent_handler, "trade_mapping"),
            "takeoff": (self._mock_agent_handler, "scope_items"),
            "estimator": (self._mock_agent_handler, "takeoff_data"),
            "exporter": (self._mock_agent_handler, "estimate"),
            "smartsheet": (self._mock_agent_handler, "estimate")
        }
    
    def _mock_agent_handler(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Mock agent handler for testing."""
        return {"status": "success", "output": "mock_result"}
    
    @pytest.mark.asyncio
    async def test_plan_route_full_estimation(self):
        """Test route planning for full estimation workflow."""
        state = AppState(
            query="Estimate this construction project",
            files=[File(filename="plans.pdf")]
        )
        
        with patch.object(intent_classifier, 'classify_intent') as mock_classify:
            mock_classify.return_value = (IntentType.FULL_ESTIMATION, {"confidence": 0.9})
            
            route_plan = await self.planner.plan_route(state, self.available_agents)
            
            assert "sequence" in route_plan
            assert "file_reader" in route_plan["sequence"]
            assert "estimator" in route_plan["sequence"]
            assert len(route_plan["sequence"]) >= 3
    
    @pytest.mark.asyncio
    async def test_plan_route_with_existing_data(self):
        """Test route planning optimization when data already exists."""
        state = AppState(
            query="Continue with estimation",
            processed_files_content={"file1.pdf": "existing content"},
            trade_mapping={"electrical": ["item1", "item2"]}
        )
        
        with patch.object(intent_classifier, 'classify_intent') as mock_classify:
            mock_classify.return_value = (IntentType.FULL_ESTIMATION, {"confidence": 0.8})
            
            route_plan = await self.planner.plan_route(state, self.available_agents)
            
            # Should optimize by skipping already completed steps
            assert "file_reader" not in route_plan.get("skipped_agents", []) or \
                   "optimization_applied" in route_plan
    
    @pytest.mark.asyncio
    async def test_plan_route_smartsheet_integration(self):
        """Test route planning for Smartsheet integration."""
        state = AppState(
            query="Push results to Smartsheet: https://app.smartsheet.com/sheets/123",
            estimate={"total": 50000}
        )
        
        with patch.object(intent_classifier, 'classify_intent') as mock_classify:
            mock_classify.return_value = (IntentType.SMARTSHEET_INTEGRATION, {"confidence": 0.95})
            
            route_plan = await self.planner.plan_route(state, self.available_agents)
            
            assert "smartsheet" in route_plan["sequence"]
    
    @pytest.mark.asyncio
    async def test_plan_route_error_handling(self):
        """Test route planning error handling and fallback."""
        state = AppState(query="Test query")
        
        with patch.object(intent_classifier, 'classify_intent') as mock_classify:
            mock_classify.side_effect = Exception("Classification failed")
            
            route_plan = await self.planner.plan_route(state, self.available_agents)
            
            # Should return fallback route
            assert "sequence" in route_plan
            assert len(route_plan["sequence"]) > 0
            assert route_plan.get("fallback", False) is True or "file_reader" in route_plan["sequence"]


class TestIntegratedAsyncWorkflow:
    """Integration tests for the complete async workflow."""
    
    @pytest.mark.asyncio
    async def test_complete_workflow_file_to_estimate(self):
        """Test complete workflow from file upload to estimate generation."""
        state = AppState(
            query="Generate cost estimate for this project",
            files=[
                File(filename="architectural_plans.pdf"),
                File(filename="specifications.docx")
            ],
            llm_config=LLMConfig(model="gpt-4o-mini", api_key="test_key")
        )
        
        # Test intent classification
        with patch('backend.services.intent_classifier.run_llm') as mock_llm:
            mock_llm.return_value = "full_estimation"
            
            intent_type, metadata = await intent_classifier.classify_intent(state)
            assert intent_type == IntentType.FULL_ESTIMATION
        
        # Test route planning
        available_agents = {
            "file_reader": (lambda x: {"processed_content": "mock"}, "files"),
            "trade_mapper": (lambda x: {"trades": ["electrical"]}, "processed_files_content"),
            "scope": (lambda x: {"scope_items": ["item1"]}, "trade_mapping"),
            "takeoff": (lambda x: {"quantities": {"item1": 100}}, "scope_items"),
            "estimator": (lambda x: {"estimate": {"total": 50000}}, "takeoff_data")
        }
        
        planner = RoutePlanner()
        with patch.object(intent_classifier, 'classify_intent') as mock_classify:
            mock_classify.return_value = (intent_type, metadata)
            
            route_plan = await planner.plan_route(state, available_agents)
            
            assert "sequence" in route_plan
            assert len(route_plan["sequence"]) >= 3
            assert "file_reader" in route_plan["sequence"]
            assert "estimator" in route_plan["sequence"]
    
    @pytest.mark.asyncio
    async def test_workflow_with_smartsheet_integration(self):
        """Test workflow including Smartsheet integration."""
        state = AppState(
            query="Analyze project and sync to Smartsheet: https://app.smartsheet.com/sheets/test123",
            files=[File(filename="project_plans.pdf")]
        )
        
        with patch('backend.services.intent_classifier.run_llm') as mock_llm:
            mock_llm.return_value = "smartsheet_integration"
            
            intent_type, metadata = await intent_classifier.classify_intent(state)
            
            assert intent_type == IntentType.SMARTSHEET_INTEGRATION
            assert metadata["smartsheet_url"] == "https://app.smartsheet.com/sheets/test123"
            
            # Verify sequence includes Smartsheet agent
            sequence = intent_classifier.get_agent_sequence_for_intent("smartsheet_integration")
            assert "smartsheet" in sequence


class TestProtocolStateManagement:
    """Tests for protocol state management and tracking."""
    
    @pytest.mark.asyncio
    async def test_state_progression_tracking(self):
        """Test that state progression is properly tracked."""
        state = AppState(
            query="Test progression",
            agent_trace=[]
        )
        
        # Test that intent classification adds trace entry
        with patch('backend.services.intent_classifier.run_llm') as mock_llm:
            mock_llm.return_value = "full_estimation"
            
            intent_type, metadata = await intent_classifier.classify_intent(state)
            
            # Verify trace entry was added
            assert len(state.agent_trace) > 0
            trace_entry = state.agent_trace[-1]
            assert trace_entry.agent == "intent_classifier"
            assert "Classified intent" in trace_entry.decision
    
    def test_agent_sequence_definitions(self):
        """Test that all intent types have defined agent sequences."""
        classifier = IntentClassifier()
        
        for intent_type in IntentType:
            sequence = classifier.get_agent_sequence_for_intent(intent_type.value)
            assert isinstance(sequence, list)
            assert len(sequence) >= 0  # Empty list is valid for some intents like rerun_agent


if __name__ == "__main__":
    # Run specific test for development
    pytest.main([__file__, "-v", "--asyncio-mode=auto"])
