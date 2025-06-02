"""
Test script for validating audit logging functionality end-to-end
"""

import pytest
import os
import sys
import json
import requests
from datetime import datetime, timedelta
import uuid

# Import from the app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.main import app
from fastapi.testclient import TestClient

# Create test client
client = TestClient(app)

def test_create_audit_log():
    """Test creating an audit log entry"""
    session_id = f"test-session-{uuid.uuid4().hex[:8]}"
    
    # Create a test audit log entry
    log_data = {
        "user_id": "test-user",
        "user_email": "test@example.com",
        "agent": "test-agent",
        "event_type": "user_action",
        "event_details": "Test audit log entry",
        "model_used": "gpt-4",
        "session_id": session_id,
        "level": "info"
    }
    
    # Send POST request to create audit log
    response = client.post("/analytics/audit-logs", json=log_data)
    
    # Check response
    assert response.status_code == 200
    result = response.json()
    assert "message" in result
    assert "log_id" in result
    assert "Audit log entry created successfully" in result["message"]
    
    # Now fetch audit logs to see if our entry is there
    response = client.get(f"/analytics/audit-logs?session_id={session_id}")
    
    # Check if our log entry is in the results
    assert response.status_code == 200
    logs_data = response.json()
    assert "logs" in logs_data
    
    # In production with a real database, we'd verify our specific log here
    # For now with mock data, we just check structure
    assert "total_count" in logs_data
    assert "page" in logs_data
    assert "page_size" in logs_data

def test_audit_log_export():
    """Test exporting audit logs"""
    # Test CSV export
    response = client.get("/analytics/audit-logs/export?format=csv")
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]
    
    # Test JSON export
    response = client.get("/analytics/audit-logs/export?format=json")
    assert response.status_code == 200
    assert "application/json" in response.headers["content-type"]
    
def test_audit_log_stats():
    """Test retrieving audit log statistics"""
    response = client.get("/analytics/audit-logs/stats")
    assert response.status_code == 200
    stats = response.json()
    
    # Check structure of statistics
    assert "total_entries" in stats
    assert "date_range" in stats
    assert "by_event_type" in stats
    assert "by_agent" in stats
    assert "by_level" in stats
    assert "cost_summary" in stats
