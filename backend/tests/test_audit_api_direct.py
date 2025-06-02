#!/usr/bin/env python
"""
Simple script to test the audit logging API endpoints directly
"""

import requests
import json
import uuid
from datetime import datetime

BASE_URL = "http://localhost:8000"  # Adjust to your backend URL

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
    print("Testing audit log creation...")
    response = requests.post(f"{BASE_URL}/analytics/audit-logs", json=log_data)
    
    # Check response
    if response.status_code == 200:
        result = response.json()
        print(f"Success: {result}")
        assert "message" in result
        assert "log_id" in result
        return session_id
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        return None

def test_retrieve_audit_logs(session_id=None):
    """Test retrieving audit logs"""
    print("\nTesting audit log retrieval...")
    params = {}
    if session_id:
        params["session_id"] = session_id
    
    response = requests.get(f"{BASE_URL}/analytics/audit-logs", params=params)
    
    if response.status_code == 200:
        result = response.json()
        print(f"Success: Retrieved {len(result['logs'])} logs")
        print(f"Total logs: {result['total_count']}")
        return True
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        return False

def test_audit_log_stats():
    """Test retrieving audit log statistics"""
    print("\nTesting audit log statistics...")
    response = requests.get(f"{BASE_URL}/analytics/audit-logs/stats")
    
    if response.status_code == 200:
        stats = response.json()
        print(f"Success: {stats['total_entries']} total entries")
        print(f"Date range: {stats['date_range']['start']} to {stats['date_range']['end']}")
        print(f"Event types: {list(stats['by_event_type'].keys())}")
        print(f"Agents: {list(stats['by_agent'].keys())}")
        return True
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        return False

def test_audit_log_export():
    """Test exporting audit logs"""
    print("\nTesting audit log export...")
    response = requests.get(f"{BASE_URL}/analytics/audit-logs/export?format=json")
    
    if response.status_code == 200:
        try:
            # For JSON format we should be able to parse it
            data = response.json()
            print(f"Success: Exported {len(data['logs'])} logs")
            return True
        except json.JSONDecodeError:
            print("Error: Failed to parse JSON response")
            return False
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        return False

def run_all_tests():
    """Run all tests in sequence"""
    print("Starting audit log API tests...")
    print("=" * 50)
    
    # Create a log and get its session ID
    session_id = test_create_audit_log()
    
    # Try to retrieve it and other logs
    test_retrieve_audit_logs(session_id)
    
    # Test statistics
    test_audit_log_stats()
    
    # Test export
    test_audit_log_export()
    
    print("=" * 50)
    print("Tests completed!")

if __name__ == "__main__":
    run_all_tests()
