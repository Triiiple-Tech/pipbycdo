#!/usr/bin/env python3
"""
Test the PIP AI system with a real Smartsheet URL
This script tests the full flow using the correct API endpoints:
1. Create a chat session
2. Send Smartsheet URL message
3. Select files for analysis
4. Verify full pipeline execution
"""

import requests
import json
import sys
import os

BASE_URL = "http://localhost:8000"

def print_status(message: str, status: str = "INFO"):
    """Print colored status messages"""
    colors = {
        "INFO": "\033[94m",  # Blue
        "SUCCESS": "\033[92m",  # Green
        "ERROR": "\033[91m",  # Red
        "WARNING": "\033[93m",  # Yellow
    }
    print(f"{colors.get(status, '')}{status}: {message}\033[0m")

def test_backend_health():
    """Test if backend is healthy"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print_status("Backend is healthy", "SUCCESS")
            return True
        else:
            print_status(f"Backend health check failed: {response.status_code}", "ERROR")
            return False
    except Exception as e:
        print_status(f"Backend connection failed: {e}", "ERROR")
        return False

def create_chat_session():
    """Create a new chat session"""
    try:
        payload = {
            "name": "Real Smartsheet Test Session"
        }
        response = requests.post(f"{BASE_URL}/api/chat/sessions", json=payload)
        
        if response.status_code == 200:
            session_data = response.json()
            session_id = session_data["id"]
            print_status(f"Created chat session: {session_id}", "SUCCESS")
            return session_id
        else:
            print_status(f"Failed to create session: {response.status_code}", "ERROR")
            print(f"Error: {response.text}")
            return None
    except Exception as e:
        print_status(f"Session creation failed: {e}", "ERROR")
        return None

def send_smartsheet_message(session_id: str, smartsheet_url: str):
    """Send a message with Smartsheet URL"""
    try:
        payload = {
            "content": f"Please analyze this Smartsheet: {smartsheet_url}"
        }
        response = requests.post(f"{BASE_URL}/api/chat/sessions/{session_id}/messages", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            print_status("Smartsheet message sent successfully", "SUCCESS")
            
            # Check for agent response
            if "agent_message" in data:
                agent_msg = data["agent_message"]
                print_status(f"Agent responded: {agent_msg.get('agent_type', 'Unknown')}", "INFO")
                print(f"Response content (first 200 chars): {agent_msg.get('content', '')[:200]}...")
                
                # Check for file listing in metadata
                metadata = agent_msg.get('metadata', {})
                if 'available_files' in metadata:
                    files = metadata['available_files']
                    print_status(f"Found {len(files)} files available", "SUCCESS")
                    for i, file in enumerate(files[:3], 1):  # Show first 3 files
                        print_status(f"  {i}. {file.get('name', 'Unknown')} ({file.get('size', 'Unknown size')})", "INFO")
                    return data, files
                else:
                    print_status("No files found in response metadata", "WARNING")
                    return data, []
            else:
                print_status("No agent response received", "WARNING")
                return data, []
                
        else:
            print_status(f"Message send failed: {response.status_code}", "ERROR")
            print(f"Error: {response.text}")
            return None, []
            
    except Exception as e:
        print_status(f"Message send failed: {e}", "ERROR")
        return None, []

def send_file_selection(session_id: str, selection_message: str):
    """Send a file selection message"""
    try:
        payload = {
            "content": selection_message
        }
        response = requests.post(f"{BASE_URL}/api/chat/sessions/{session_id}/messages", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            print_status("File selection message sent successfully", "SUCCESS")
            
            if "agent_message" in data:
                agent_msg = data["agent_message"]
                print_status(f"Agent processed selection: {agent_msg.get('agent_type', 'Unknown')}", "INFO")
                print(f"Response content (first 300 chars): {agent_msg.get('content', '')[:300]}...")
                return data
            else:
                print_status("No agent response to file selection", "WARNING")
                return data
                
        else:
            print_status(f"File selection failed: {response.status_code}", "ERROR")
            print(f"Error: {response.text}")
            return None
            
    except Exception as e:
        print_status(f"File selection failed: {e}", "ERROR")
        return None

def test_smartsheet_api():
    """Test Smartsheet API connectivity"""
    try:
        headers = {
            'Authorization': f'Bearer {os.getenv("SMARTSHEET_ACCESS_TOKEN")}',
            'Content-Type': 'application/json'
        }
        
        response = requests.get('https://api.smartsheet.com/2.0/workspaces', headers=headers)
        
        if response.status_code == 200:
            workspaces = response.json()
            print_status(f"Smartsheet API connected - found {len(workspaces.get('data', []))} workspaces", "SUCCESS")
            return True
        else:
            print_status(f"Smartsheet API failed: {response.status_code}", "ERROR")
            return False
            
    except Exception as e:
        print_status(f"Smartsheet API test failed: {e}", "ERROR")
        return False

def main():
    """Main test function"""
    print_status("Starting Real Smartsheet Integration Test", "INFO")
    print("=" * 60)
    
    # Test 1: Backend health
    if not test_backend_health():
        return
    
    print("\n" + "=" * 60)
    
    # Test 2: Smartsheet API connectivity
    if not test_smartsheet_api():
        print_status("Smartsheet API connectivity failed - check credentials", "ERROR")
        return
    
    print("\n" + "=" * 60)
    
    # Test 3: Create chat session
    session_id = create_chat_session()
    if not session_id:
        return
    
    print("\n" + "=" * 60)
    
    # Test 4: Submit Smartsheet URL
    print_status("Testing with real Smartsheet URL...", "INFO")
    smartsheet_url = "https://app.smartsheet.com/sheets/xchRwXGQ8HJ4pM3Fh73MM6X2H56Mhw64f4pGmPm1"
    
    result, files = send_smartsheet_message(session_id, smartsheet_url)
    if not result:
        print_status("Smartsheet URL test failed", "ERROR")
        return
    
    print("\n" + "=" * 60)
    
    # Test 5: File selection if files were found
    if files:
        print_status("Testing file selection...", "INFO")
        selection_result = send_file_selection(session_id, "Please analyze the first 2 files")
        if selection_result:
            print_status("File selection test completed", "SUCCESS")
        else:
            print_status("File selection test failed", "ERROR")
    else:
        print_status("No files available for selection test", "WARNING")
    
    print("\n" + "=" * 60)
    print_status("Real Smartsheet Integration Test Complete", "SUCCESS")

if __name__ == "__main__":
    main()
