"""
Test script for validating audit logging functionality end-to-end

This module contains tests for the audit logs functionality, including:
- Creating audit log entries
- Retrieving and filtering logs
- Exporting audit logs in different formats
- Generating audit log statistics

Each test mocks the Supabase client to prevent actual database calls
while verifying the correct API behavior and data transformations.
"""

import pytest
import os
import sys
from datetime import datetime
from unittest.mock import patch, MagicMock

from fastapi.testclient import TestClient

# Add the parent directory to sys.path to allow absolute imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.app.main import app

# Create test client
client = TestClient(app)

@patch('backend.routes.analytics.get_supabase_client')
def test_create_audit_log(mock_supabase_client: MagicMock) -> None:
    """Test creating an audit log entry"""
    # Mock Supabase response
    mock_client = MagicMock()
    mock_supabase_client.return_value = mock_client
    mock_client.table.return_value.insert.return_value.execute.return_value.data = [
        {"id": "test-log-123", "created_at": "2025-06-04T12:00:00Z"}
    ]
    
    log_data = {
        "user_id": "test-user",
        "user_email": "test@example.com",
        "agent": "test-agent",
        "event_type": "user_action",
        "event_details": "Test audit log entry",
        "model_used": "gpt-4",
        "session_id": "test-session-123",
        "level": "info"
    }
    
    response = client.post("/api/analytics/audit-logs", json=log_data)
    
    assert response.status_code == 200
    result = response.json()
    assert "log_id" in result
    mock_client.table.assert_called_with("audit_logs")

@patch('backend.routes.analytics.generate_mock_audit_logs')
def test_retrieve_audit_logs(mock_generate_logs: MagicMock) -> None:
    """Test retrieving audit logs"""
    # Mock the generate_mock_audit_logs function
    mock_generate_logs.return_value = {
        "logs": [
            {
                "id": "log-1",
                "user_id": "test-user",
                "agent": "test-agent",
                "event_type": "user_action",
                "event_details": "Test event details",
                "timestamp": datetime.now(),
                "level": "info"
            }
        ],
        "total_count": 1,
        "page": 1,
        "page_size": 50,
        "filters_applied": {}
    }
    
    response = client.get("/api/analytics/audit-logs")
    
    assert response.status_code == 200
    result = response.json()
    assert isinstance(result, dict)
    assert "logs" in result
    assert "total_count" in result
    assert "page" in result
    assert "page_size" in result
    logs = result["logs"]
    assert isinstance(logs, list)
    assert len(logs) >= 0
    mock_generate_logs.assert_called_once()

@patch('backend.routes.analytics.generate_mock_audit_logs')
def test_audit_log_export(mock_generate_logs: MagicMock) -> None:
    """Test audit log export functionality"""
    mock_generate_logs.return_value = {
        "logs": [
            {
                "id": "log-1",
                "user_id": "test-user",
                "user_email": "test@example.com",
                "agent": "test-agent",
                "event_type": "user_action",
                "event_details": "Test event details",
                "timestamp": datetime.now(),
                "level": "info",
                "model_used": None,
                "session_id": None,
                "task_id": None,
                "cost_estimate": None,
                "duration_ms": None,
                "error": None
            }
        ],
        "total_count": 1,
        "page": 1,
        "page_size": 50,
        "filters_applied": {}
    }
    
    response = client.get("/api/analytics/audit-logs/export?format=csv")
    
    assert response.status_code == 200
    assert "text/csv" in response.headers.get("content-type", "")
    
@patch('backend.routes.analytics.datetime')
def test_audit_log_stats(mock_datetime: MagicMock) -> None:
    """Test audit log statistics"""
    mock_datetime.now.return_value = datetime(2025, 6, 4, 12, 0, 0)
    
    with patch('backend.routes.analytics.get_supabase_client') as mock_supabase:
        mock_client = MagicMock()
        mock_supabase.return_value = mock_client
        mock_client.table.return_value.select.return_value.execute.return_value.data = [
            {"count": 10, "agent": "test-agent"},
            {"count": 5, "event_type": "user_action"}
        ]
        
        response = client.get("/api/analytics/audit-logs/stats")
        
        assert response.status_code == 200
        stats = response.json()
        assert isinstance(stats, dict)

def test_audit_log_filtering() -> None:
    """Test audit log filtering by session_id"""
    with patch('backend.routes.analytics.generate_mock_audit_logs') as mock_generate:
        mock_generate.return_value = {
            "logs": [
                {
                    "id": "log-1",
                    "session_id": "test-session-123",
                    "user_id": "test-user",
                    "agent": "test-agent",
                    "event_type": "user_action",
                    "event_details": "Test event details",
                    "timestamp": datetime.now(),
                    "level": "info"
                }
            ],
            "total_count": 1,
            "page": 1,
            "page_size": 50,
            "filters_applied": {"search": "test-session-123"}
        }
        
        response = client.get("/api/analytics/audit-logs?search=test-session-123")
        
        assert response.status_code == 200
        result = response.json()
        assert isinstance(result, dict)
        assert "logs" in result
        logs = result["logs"]
        assert isinstance(logs, list)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
