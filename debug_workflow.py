#!/usr/bin/env python3
"""
Debug the autonomous workflow state and trigger output management
"""

import requests
import json

BASE_URL = "http://localhost:8000"
SESSION_ID = "85a142e4-8158-415c-82cc-a414aee533a4"

def test_workflow_continuation():
    """Test different approaches to trigger output management"""
    
    test_messages = [
        "What are the analysis results?",
        "Show me the cost estimate",
        "Export options please",
        "Autonomous output management phase",
        "Present final results"
    ]
    
    for i, message in enumerate(test_messages):
        print(f"\n=== Test {i+1}: {message} ===")
        
        try:
            payload = {"content": message}
            response = requests.post(f"{BASE_URL}/api/chat/sessions/{SESSION_ID}/messages", 
                                   json=payload, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                agent_msg = data.get("agent_response", {})
                print(f"Agent: {agent_msg.get('agent_type', 'Unknown')}")
                print(f"Content (first 100 chars): {agent_msg.get('content', '')[:100]}...")
                print(f"Metadata: {json.dumps(agent_msg.get('metadata', {}), indent=2)}")
                
                # If we get a good response, stop testing
                if len(agent_msg.get('content', '')) > 50:
                    print("✅ Got detailed response!")
                    break
            else:
                print(f"❌ Failed: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error: {e}")
            
        # Don't spam the server
        import time
        time.sleep(2)

if __name__ == "__main__":
    test_workflow_continuation()
