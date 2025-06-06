#!/usr/bin/env python
"""
Simple script to test the audit logging API endpoints directly
"""

import requests
import uuid
from typing import Dict, Any, Optional

BASE_URL = "http://localhost:8000"  # Adjust to your backend URL

def test_create_audit_log() -> Optional[str]:
    """Test creating an audit log entry"""
    session_id = f"test-session-{uuid.uuid4().hex[:8]}"
    
    # Create a test audit log entry
    log_data: Dict[str, Any] = {
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
    try:
        response = requests.post(f"{BASE_URL}/analytics/audit-logs", json=log_data)
        
        # Check response
        if response.status_code == 200:
            print(f"✅ Audit log created successfully: {response.json()}")
            return session_id
        else:
            print(f"❌ Failed to create audit log: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error creating audit log: {e}")
        return None

def test_retrieve_audit_logs(session_id: Optional[str] = None) -> None:
    """Test retrieving audit logs"""
    print("\nTesting audit log retrieval...")
    params: Dict[str, str] = {}
    if session_id:
        params["session_id"] = session_id
    
    try:
        response = requests.get(f"{BASE_URL}/analytics/audit-logs", params=params)
        
        if response.status_code == 200:
            logs = response.json()
            print(f"✅ Retrieved {len(logs)} audit logs")
            if logs:
                print(f"Sample log: {logs[0]}")
        else:
            print(f"❌ Failed to retrieve audit logs: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Error retrieving audit logs: {e}")

def test_audit_log_stats() -> None:
    """Test audit log statistics endpoint"""
    print("\nTesting audit log statistics...")
    
    try:
        response = requests.get(f"{BASE_URL}/analytics/audit-logs/stats")
        
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ Retrieved audit log stats: {stats}")
        else:
            print(f"❌ Failed to retrieve audit log stats: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Error retrieving audit log stats: {e}")

def test_audit_log_export() -> None:
    """Test audit log export endpoint"""
    print("\nTesting audit log export...")
    
    try:
        response = requests.get(f"{BASE_URL}/analytics/audit-logs/export?format=csv")
        
        if response.status_code == 200:
            print(f"✅ Audit log export successful, content length: {len(response.content)}")
        else:
            print(f"❌ Failed to export audit logs: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Error exporting audit logs: {e}")

def run_all_tests() -> None:
    """Run all audit log tests"""
    print("🚀 Starting audit log API tests...\n")
    
    # Test creating an audit log and get session ID
    session_id = test_create_audit_log()
    
    # Test retrieving logs (with and without session filter)
    test_retrieve_audit_logs()
    if session_id:
        test_retrieve_audit_logs(session_id)
    
    # Test statistics
    test_audit_log_stats()
    
    # Test export
    test_audit_log_export()
    
    print("\n✅ All audit log API tests completed!")

if __name__ == "__main__":
    run_all_tests()
