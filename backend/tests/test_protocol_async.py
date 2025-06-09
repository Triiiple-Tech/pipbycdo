"""
Modern Async Test Suite for PIP AI Autonomous Agentic Manager Protocol

This test suite covers:
- ManagerAgent protocol implementation
- Async intent classification and route planning  
- Agent workflow execution
- Error handling and recovery
- WebSocket integration
- Real-time UI updates

Created: 2025-01-22
Author: GitHub Copilot Workspace Agent
"""

import pytest
import asyncio
from typing import Dict, Any, List, Optional
from unittest.mock import AsyncMock, MagicMock, patch

from backend.app.schemas import AppState, EstimateItem, File, LLMConfig
from backend.agents.manager_agent import ManagerAgent, manager_agent
from backend.services.route_planner import RoutePlanner
from backend.services.intent_classifier import IntentClassifier


class TestProtocolAsyncImplementation:
    """Test suite for the Autonomous Agentic Manager Protocol with async support."""

    @pytest.fixture
    def manager(self) -> ManagerAgent:
        """Create a manager agent instance for testing."""
        return ManagerAgent()

    @pytest.fixture
    def sample_state(self) -> AppState:
        """Create a sample AppState for testing."""
        return AppState(
            query="Please estimate costs for construction project",
            content="Construction project details here",
            files=[
                File(
                    filename="test_plans.pdf",
                    type="pdf",
                    status="uploaded",
                    content="Mock PDF content with construction details"
                )
            ],
            metadata={
                "project_name": "Test Project",
                "location": "Test Location",
                "trade": "General Construction"
            },
            user_id="test_user",
            session_id="test_session"
        )

    @pytest.fixture
    def mock_llm_responses(self) -> Dict[str, str]:
        """Mock LLM responses for different types of prompts."""
        return {
            "intent": '{"intent": "cost_estimation", "confidence": 0.95, "reasoning": "User wants cost estimation"}',
            "route_plan": '{"sequence": ["file_reader", "trade_mapper", "scope", "takeoff", "estimator"], "skipped_agents": [], "reasoning": "Full pipeline for cost estimation"}',
            "default": "Mock LLM response for agent processing"
        }

    @pytest.mark.asyncio
    async def test_protocol_initialization(self, manager: ManagerAgent):
        """Test that the protocol is properly initialized."""
        assert manager.agent_name == "manager"
        assert hasattr(manager, 'available_agents')
        assert len(manager.available_agents) >= 6  # Core agents
        
        # Check that all core agents are present
        expected_agents = ["file_reader", "trade_mapper", "scope", "takeoff", "estimator", "exporter"]
        for agent_name in expected_agents:
            assert agent_name in manager.available_agents
            agent_handler, required_field = manager.available_agents[agent_name]
            assert callable(agent_handler)

    @pytest.mark.asyncio 
    async def test_universal_intake_files(self, manager: ManagerAgent, sample_state: AppState):
        """Test Phase 1: Universal Intake with files."""
        intake_result = manager._universal_intake(sample_state)
        
        assert isinstance(intake_result, dict)
        assert not intake_result.get("needs_user_selection", False)
        
        # Check that files were acknowledged
        assert len(sample_state.meeting_log) > 0
        file_logs = [log for log in sample_state.meeting_log if "file" in log.message.lower()]
        assert len(file_logs) > 0

    @pytest.mark.asyncio
    async def test_universal_intake_smartsheet(self, manager: ManagerAgent):
        """Test Phase 1: Universal Intake with Smartsheet URL."""
        state = AppState(
            query="Analyze this Smartsheet: https://app.smartsheet.com/sheets/test123",
            user_id="test_user",
            session_id="test_session"
        )
        
        intake_result = manager._universal_intake(state)
        
        assert isinstance(intake_result, dict)
        assert not intake_result.get("needs_user_selection", False)
        
        # Check that Smartsheet URL was detected
        smartsheet_logs = [log for log in state.meeting_log if "smartsheet" in log.message.lower()]
        assert len(smartsheet_logs) > 0

    @pytest.mark.asyncio
    async def test_intent_classification_mock(self, manager: ManagerAgent, sample_state: AppState, mock_llm_responses: Dict[str, str]):
        """Test intent classification with mocked LLM responses."""
        with patch('backend.services.route_planner.run_llm') as mock_llm:
            mock_llm.return_value = mock_llm_responses["intent"]
            
            route_planner = RoutePlanner()
            route_plan = route_planner.plan_route(sample_state, manager.available_agents)
            
            assert "intent" in route_plan
            assert "confidence" in route_plan
            assert route_plan["intent"] == "cost_estimation"
            assert route_plan["confidence"] == 0.95

    @pytest.mark.asyncio
    async def test_agent_readiness_checks(self, manager: ManagerAgent):
        """Test enhanced agent readiness validation."""
        # Test with required field present
        state_dict = {
            "files": [{"filename": "test.pdf", "content": "test"}],
            "processed_files_content": {"test.pdf": "processed content"},
            "trade_mapping": [{"trade": "electrical", "keywords": ["wire"]}]
        }
        
        # File reader should be ready (has files)
        assert manager._check_agent_readiness(state_dict, "files")
        
        # Trade mapper should be ready (has processed_files_content)
        assert manager._check_agent_readiness(state_dict, "processed_files_content")
        
        # Scope agent should be ready (has trade_mapping)
        assert manager._check_agent_readiness(state_dict, "trade_mapping")
        
        # Takeoff agent should NOT be ready (missing scope_items)
        assert not manager._check_agent_readiness(state_dict, "scope_items")

    @pytest.mark.asyncio
    async def test_error_handling_critical(self, manager: ManagerAgent, sample_state: AppState):
        """Test critical error handling that stops the pipeline."""
        # Simulate critical error
        sample_state.error = "API key authentication failed"
        
        route_plan = {"sequence": ["file_reader", "trade_mapper"], "skipped_agents": []}
        should_continue = manager._handle_agent_error(sample_state, "file_reader", route_plan)
        
        assert not should_continue  # Should stop on critical error
        
        # Check that error was logged
        error_logs = [log for log in sample_state.agent_trace if log.level == "error"]
        assert len(error_logs) > 0

    @pytest.mark.asyncio
    async def test_error_handling_non_critical(self, manager: ManagerAgent, sample_state: AppState):
        """Test non-critical error handling that allows continuation."""
        # Simulate non-critical error
        sample_state.error = "Minor processing warning"
        
        route_plan = {"sequence": ["file_reader", "trade_mapper", "scope"], "skipped_agents": []}
        should_continue = manager._handle_agent_error(sample_state, "file_reader", route_plan)
        
        assert should_continue  # Should continue on non-critical error

    @pytest.mark.asyncio
    async def test_agent_sequence_determination(self, manager: ManagerAgent):
        """Test agent sequence determination logic."""
        # Test with files - should run full pipeline
        state_with_files = AppState(
            files=[File(filename="test.pdf", content="test content")],
            query="Estimate this project"
        )
        
        sequence = manager._determine_agent_sequence(state_with_files)
        assert len(sequence) >= 5  # Should include main pipeline agents
        agent_names = [s[0] for s in sequence]
        assert "file_reader" in agent_names
        assert "estimator" in agent_names

    @pytest.mark.asyncio
    async def test_mock_agent_execution(self, manager: ManagerAgent, sample_state: AppState):
        """Test agent execution with mocked handlers."""
        
        def mock_file_reader(state_dict: Dict[str, Any]) -> Dict[str, Any]:
            state_dict["processed_files_content"] = {"test.pdf": "Processed content"}
            return state_dict
        
        def mock_trade_mapper(state_dict: Dict[str, Any]) -> Dict[str, Any]:
            state_dict["trade_mapping"] = [{"trade": "electrical", "csi_division": "26"}]
            return state_dict
        
        def mock_estimator(state_dict: Dict[str, Any]) -> Dict[str, Any]:
            state_dict["estimate"] = [
                EstimateItem(
                    item="Test Item",
                    qty=1.0,
                    unit="EA",
                    unit_price=100.0,
                    total=100.0
                ).model_dump()
            ]
            return state_dict
        
        # Backup original handlers
        original_handlers = {}
        for agent_name in ["file_reader", "trade_mapper", "estimator"]:
            if agent_name in manager.available_agents:
                original_handlers[agent_name] = manager.available_agents[agent_name]
        
        try:
            # Replace with mocks
            manager.available_agents["file_reader"] = (mock_file_reader, "files")
            manager.available_agents["trade_mapper"] = (mock_trade_mapper, "processed_files_content")
            manager.available_agents["estimator"] = (mock_estimator, "takeoff_data")
            
            # Mock route planner
            with patch('backend.services.route_planner.run_llm') as mock_llm:
                mock_llm.return_value = '{"sequence": ["file_reader", "trade_mapper", "estimator"], "skipped_agents": [], "intent": "cost_estimation", "confidence": 0.9}'
                
                # Execute workflow
                route_plan = {"sequence": ["file_reader", "trade_mapper", "estimator"], "skipped_agents": []}
                result_state = manager._execute_autonomous_workflow(sample_state, route_plan)
                
                # Verify execution
                assert result_state.processed_files_content is not None
                assert len(result_state.processed_files_content) > 0
                assert result_state.trade_mapping is not None
                assert len(result_state.trade_mapping) > 0
                
        finally:
            # Restore original handlers
            for agent_name, handler in original_handlers.items():
                manager.available_agents[agent_name] = handler

    @pytest.mark.asyncio
    async def test_full_protocol_mock_execution(self, manager: ManagerAgent, sample_state: AppState):
        """Test full protocol execution with comprehensive mocking."""
        
        with patch('backend.services.route_planner.run_llm') as mock_llm, \
             patch('backend.agents.manager_agent.run_llm') as mock_agent_llm:
            
            # Mock route planning response
            mock_llm.return_value = '{"sequence": ["file_reader", "estimator"], "skipped_agents": [], "intent": "cost_estimation", "confidence": 0.9, "reasoning": "Direct estimation from files"}'
            
            # Mock agent LLM responses
            mock_agent_llm.return_value = "Mock agent processing response"
            
            # Mock individual agents to avoid external dependencies
            def mock_agent_handler(state_dict: Dict[str, Any]) -> Dict[str, Any]:
                # Simulate successful processing
                if "estimate" not in state_dict:
                    state_dict["estimate"] = [
                        EstimateItem(
                            item="Mock Item",
                            qty=1.0,
                            unit="EA", 
                            unit_price=50.0,
                            total=50.0
                        ).model_dump()
                    ]
                return state_dict
            
            # Replace all agent handlers with mocks
            original_agents = manager.available_agents.copy()
            for agent_name in manager.available_agents:
                manager.available_agents[agent_name] = (mock_agent_handler, manager.available_agents[agent_name][1])
            
            try:
                # Execute full protocol
                result_state = manager.process(sample_state)
                
                # Verify protocol execution
                assert result_state is not None
                assert isinstance(result_state, AppState)
                
                # Should have logged activity
                assert len(result_state.meeting_log) > 0
                assert len(result_state.agent_trace) > 0
                
                # Should have manager activity logged
                manager_logs = [log for log in result_state.meeting_log if log.agent == "manager"]
                assert len(manager_logs) > 0
                
            finally:
                # Restore original agents
                manager.available_agents = original_agents

    @pytest.mark.asyncio
    async def test_output_management(self, manager: ManagerAgent):
        """Test autonomous output management phase."""
        state = AppState(
            estimate=[
                EstimateItem(
                    item="Test Item 1",
                    qty=1.0,
                    unit="EA",
                    unit_price=100.0,
                    total=100.0
                ),
                EstimateItem(
                    item="Test Item 2", 
                    qty=2.0,
                    unit="SF",
                    unit_price=50.0,
                    total=100.0
                )
            ],
            user_id="test_user",
            session_id="test_session"
        )
        
        result_state = manager._autonomous_output_management(state)
        
        # Should have processed the outputs
        assert result_state.status == "output_ready"
        
        # Should have logged export options
        export_logs = [log for log in result_state.meeting_log if "export" in log.message.lower()]
        assert len(export_logs) > 0

    @pytest.mark.asyncio
    async def test_websocket_broadcast_mock(self, manager: ManagerAgent, sample_state: AppState):
        """Test WebSocket broadcast functionality with mocking."""
        with patch('backend.routes.chat.broadcast_message') as mock_broadcast:
            mock_broadcast.return_value = asyncio.Future()
            mock_broadcast.return_value.set_result(None)
            
            # Test broadcast
            manager._broadcast_agent_progress(sample_state, "file_reader", "started", 1, 5)
            
            # Should not raise exception even if WebSocket fails
            assert True  # If we get here, no exception was raised

    @pytest.mark.asyncio
    async def test_legacy_handle_function(self, sample_state: AppState):
        """Test backward compatibility of legacy handle function."""
        state_dict = sample_state.model_dump()
        
        with patch('backend.services.route_planner.run_llm') as mock_llm:
            mock_llm.return_value = '{"sequence": [], "skipped_agents": [], "intent": "no_action", "confidence": 0.1}'
            
            result_dict = manager_agent.handle(state_dict)
            
            assert isinstance(result_dict, dict)
            assert "agent_trace" in result_dict
            assert "meeting_log" in result_dict
            
            # Should be able to convert back to AppState
            result_state = AppState(**result_dict)
            assert isinstance(result_state, AppState)


class TestAgentIntegration:
    """Test integration between agents and the protocol."""

    @pytest.mark.asyncio
    async def test_agent_workflow_dependencies(self):
        """Test that agent dependencies are properly defined."""
        from backend.agents.manager_agent import AGENT_PIPELINE
        
        # Verify pipeline structure
        assert len(AGENT_PIPELINE) >= 5
        
        # Check dependency chain
        agent_names = [agent[0] for agent in AGENT_PIPELINE]
        required_fields = [agent[2] for agent in AGENT_PIPELINE]
        
        # File reader should be first (depends on files)
        assert agent_names[0] == "file_reader"
        assert required_fields[0] == "files"
        
        # Trade mapper should depend on file reader output
        trade_mapper_idx = agent_names.index("trade_mapper")
        assert required_fields[trade_mapper_idx] == "processed_files_content"
        
        # Estimator should be after takeoff
        estimator_idx = agent_names.index("estimator")
        takeoff_idx = agent_names.index("takeoff")
        assert estimator_idx > takeoff_idx

    @pytest.mark.asyncio
    async def test_state_serialization(self):
        """Test that AppState can be properly serialized and deserialized."""
        original_state = AppState(
            query="Test query",
            files=[
                File(filename="test.pdf", type="pdf", content="test content")
            ],
            estimate=[
                EstimateItem(
                    item="Test Item",
                    qty=1.0,
                    unit="EA",
                    unit_price=100.0,
                    total=100.0
                )
            ],
            metadata={"project": "test"},
            user_id="test_user"
        )
        
        # Serialize to dict
        state_dict = original_state.model_dump()
        assert isinstance(state_dict, dict)
        
        # Deserialize back to AppState
        restored_state = AppState(**state_dict)
        assert isinstance(restored_state, AppState)
        
        # Verify key fields
        assert restored_state.query == original_state.query
        assert len(restored_state.files) == len(original_state.files)
        assert len(restored_state.estimate) == len(original_state.estimate)
        assert restored_state.user_id == original_state.user_id


class TestAsyncCompatibility:
    """Test async compatibility and performance."""

    @pytest.mark.asyncio
    async def test_async_agent_calls(self):
        """Test that agent calls can be made asynchronously."""
        manager = ManagerAgent()
        
        async def async_agent_wrapper(state_dict: Dict[str, Any]) -> Dict[str, Any]:
            """Wrapper to make agent calls async."""
            return await asyncio.to_thread(manager.handle, state_dict)
        
        state_dict = AppState(query="Test async call").model_dump()
        
        with patch('backend.services.route_planner.run_llm') as mock_llm:
            mock_llm.return_value = '{"sequence": [], "skipped_agents": [], "intent": "no_action", "confidence": 0.1}'
            
            # Should complete without blocking
            result = await async_agent_wrapper(state_dict)
            assert isinstance(result, dict)

    @pytest.mark.asyncio
    async def test_concurrent_protocol_execution(self):
        """Test that multiple protocol instances can run concurrently."""
        manager = ManagerAgent()
        
        async def run_protocol(session_id: str) -> Dict[str, Any]:
            state = AppState(
                query=f"Test query for session {session_id}",
                session_id=session_id
            )
            
            with patch('backend.services.route_planner.run_llm') as mock_llm:
                mock_llm.return_value = '{"sequence": [], "skipped_agents": [], "intent": "no_action", "confidence": 0.1}'
                return await asyncio.to_thread(manager.handle, state.model_dump())
        
        # Run multiple protocols concurrently
        tasks = [run_protocol(f"session_{i}") for i in range(3)]
        results = await asyncio.gather(*tasks)
        
        assert len(results) == 3
        for result in results:
            assert isinstance(result, dict)
            assert "session_id" in result


if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v"])
