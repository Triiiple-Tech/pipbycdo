#!/usr/bin/env python3
"""
Test the PIP AI system with a real Smartsheet URL
This script tests the full flow:
1. Submit Smartsheet URL
2. Get file listing from Smartsheet API
3. Select files for analysis
4. Download and process files
5. Get LLM-based analysis
"""

import asyncio
import requests
import json
import sys
import os
from typing import Dict, Any

# Add backend to path for testing
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

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

def test_health():
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

def test_smartsheet_url():
    """Test submitting a Smartsheet URL and getting file listing"""
    print_status("Testing Smartsheet URL submission...")
    
    # Use a test Smartsheet URL - replace with your actual URL
    test_url = "https://app.smartsheet.com/sheets/example"  # Replace with real URL
    
    payload = {
        "message": f"Please analyze this Smartsheet: {test_url}",
        "conversation_id": "test-smartsheet-real"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/chat/message", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            print_status("Smartsheet URL processed successfully", "SUCCESS")
            print(f"Response: {json.dumps(data, indent=2)}")
            
            # Check if we got file listing
            if "available_files" in data.get("metadata", {}):
                print_status(f"Found {len(data['metadata']['available_files'])} files", "SUCCESS")
                return data
            else:
                print_status("No files found in response", "WARNING")
                return data
        else:
            print_status(f"Request failed: {response.status_code}", "ERROR")
            print(f"Error: {response.text}")
            return None
            
    except Exception as e:
        print_status(f"Request failed: {e}", "ERROR")
        return None

def test_file_selection(conversation_id: str, files_data: Dict[str, Any]):
    """Test file selection functionality"""
    print_status("Testing file selection...")
    
    # Try selecting the first 2 files
    payload = {
        "message": "Please analyze files 1-2",
        "conversation_id": conversation_id
    }
    
    try:
        response = requests.post(f"{BASE_URL}/chat/message", json=payload)
        
        if response.status_code == 200:
            data = response.json()
            print_status("File selection processed successfully", "SUCCESS")
            print(f"Response: {json.dumps(data, indent=2)}")
            return data
        else:
            print_status(f"File selection failed: {response.status_code}", "ERROR")
            print(f"Error: {response.text}")
            return None
            
    except Exception as e:
        print_status(f"File selection failed: {e}", "ERROR")
        return None

def test_smartsheet_api_directly():
    """Test direct Smartsheet API access"""
    print_status("Testing direct Smartsheet API access...")
    
    try:
        # Test API connection
        headers = {
            'Authorization': f'Bearer {os.getenv("SMARTSHEET_ACCESS_TOKEN")}',
            'Content-Type': 'application/json'
        }
        
        # Try to list workspaces to test API connectivity
        response = requests.get(
            'https://api.smartsheet.com/2.0/workspaces',
            headers=headers
        )
        
        if response.status_code == 200:
            workspaces = response.json()
            print_status(f"Smartsheet API connected successfully", "SUCCESS")
            print_status(f"Found {len(workspaces.get('data', []))} workspaces", "INFO")
            return True
        else:
            print_status(f"Smartsheet API failed: {response.status_code}", "ERROR")
            print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print_status(f"Smartsheet API test failed: {e}", "ERROR")
        return False

async def main():
    """Main test function"""
    print_status("Starting Real Smartsheet Integration Test", "INFO")
    print("=" * 60)
    
    # Test 1: Backend health
    if not test_health():
        return
    
    print("\n" + "=" * 60)
    
    # Test 2: Smartsheet API connectivity
    if not test_smartsheet_api_directly():
        print_status("Smartsheet API connectivity failed - check credentials", "ERROR")
        return
    
    print("\n" + "=" * 60)
    
    # Test 3: Submit Smartsheet URL
    print_status("Please provide a real Smartsheet URL to test with:", "INFO")
    print_status("Example: https://app.smartsheet.com/sheets/your-sheet-id", "INFO")
    
    # For automated testing, use a mock URL or ask for input
    smartsheet_url = input("Enter Smartsheet URL (or press Enter for mock test): ").strip()
    
    if not smartsheet_url:
        smartsheet_url = "https://app.smartsheet.com/sheets/mock-test-sheet"
        print_status(f"Using mock URL: {smartsheet_url}", "WARNING")
    
    # Test with the provided URL
    result = test_smartsheet_url()
    if not result:
        print_status("Smartsheet URL test failed", "ERROR")
        return
    
    print("\n" + "=" * 60)
    
    # Test 4: File selection if files were found
    if result.get("metadata", {}).get("available_files"):
        test_file_selection("test-smartsheet-real", result)
    else:
        print_status("No files to select - test complete", "INFO")
    
    print("\n" + "=" * 60)
    print_status("Real Smartsheet Integration Test Complete", "SUCCESS")

if __name__ == "__main__":
    asyncio.run(main())
