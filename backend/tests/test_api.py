# pipbycdo/backend/tests/test_api.py
import pytest
import os
from typing import Dict, Any, List
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient

# Mock classes for Supabase
class MockSupabaseClient:
    def table(self, table_name: str) -> 'MockTable':
        return MockTable()

class MockTable:
    def insert(self, data: Dict[str, Any]) -> 'MockQuery':
        return MockQuery()
    def select(self, *args: str) -> 'MockQuery':
        return MockQuery()
    def update(self, data: Dict[str, Any]) -> 'MockQuery':
        return MockQuery()
    def delete(self) -> 'MockQuery':
        return MockQuery()

class MockQuery:
    def execute(self) -> 'MockResponse':
        return MockResponse()
    def eq(self, column: str, value: str) -> 'MockQuery':
        return self
    def single(self) -> 'MockQuery':
        return self

class MockResponse:
    def __init__(self) -> None:
        self.data: List[Dict[str, Any]] = [{"id": "test-123", "status": "success"}]
        self.error = None

# Create a shared mock instance
mock_supabase_client = MockSupabaseClient()

def mock_get_supabase_client() -> MockSupabaseClient:
    return mock_supabase_client

def mock_initialize_supabase_client() -> None:
    pass

# Mock Supabase before importing app to prevent initialization errors
with patch('backend.services.supabase_client.initialize_supabase_client', mock_initialize_supabase_client):
    from backend.app.main import app

client = TestClient(app)
headers = {"X-Internal-Code": "hermes"}

@patch.dict(os.environ, {
    'SUPABASE_URL': 'https://test.supabase.co',
    'SUPABASE_KEY': 'test_key'
})
@patch('backend.routes.api.get_supabase_client', mock_get_supabase_client)
@patch('backend.services.gpt_handler.run_llm')
def test_analyze_endpoint_success(mock_run_llm: Mock) -> None:
    """Test successful analyze endpoint call"""
    mock_run_llm.return_value = "Analysis complete"
    
    response = client.post(
        "/api/analyze",
        headers=headers,
        json={
            "request_id": "test-123",
            "user_id": "test-user",
            "document_name": "test.pdf",
            "document_content": "test content",
            "document_type": "PDF",
            "processing_type": "cost_estimation"
        }
    )
    
    assert response.status_code == 200

@patch.dict(os.environ, {
    'SUPABASE_URL': 'https://test.supabase.co',
    'SUPABASE_KEY': 'test_key'
})
@patch('backend.routes.api.get_supabase_client', mock_get_supabase_client)
def test_health_check() -> None:
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"

def test_bad_internal_code() -> None:
    """Test request with invalid internal code"""
    response = client.post(
        "/api/analyze",
        headers={"X-Internal-Code": "invalid"},
        json={
            "request_id": "test-123",
            "user_id": "test-user",
            "document_name": "test.pdf",
            "document_content": "test content",
            "document_type": "PDF",
            "processing_type": "cost_estimation"
        }
    )
    
    assert response.status_code == 401

def test_missing_internal_code() -> None:
    """Test request without internal code header"""
    response = client.post(
        "/api/analyze",
        json={
            "request_id": "test-123",
            "user_id": "test-user",
            "document_name": "test.pdf",
            "document_content": "test content",
            "document_type": "PDF",
            "processing_type": "cost_estimation"
        }
    )
    
    assert response.status_code == 401


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
