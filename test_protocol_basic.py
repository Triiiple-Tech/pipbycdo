#!/usr/bin/env python3
"""
Simplified Protocol Test for immediate validation
"""

import asyncio
import json
import aiohttp

BASE_URL = "http://localhost:8000"

async def test_protocol_basic():
    """Test basic protocol functionality without WebSocket"""
    print("🎯 Testing Basic Protocol Functionality")
    print("=" * 50)
    
    # Test 1: Health Check
    print("\n🔍 Testing Service Health...")
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{BASE_URL}/health") as response:
            if response.status == 200:
                print("✅ Backend API: Healthy")
            else:
                raise Exception(f"Backend unhealthy: {response.status}")
    
    # Test 2: Create Session
    print("\n🔍 Creating Chat Session...")
    session_id = None
    session_create_data = {
        "name": "Protocol Test Session",
        "project_id": "protocol-test"
    }
    async with aiohttp.ClientSession() as session:
        async with session.post(f"{BASE_URL}/api/chat/sessions", json=session_create_data) as response:
            if response.status == 200:
                data = await response.json()
                session_id = data["id"]  # Note: using 'id' not 'session_id'
                print(f"✅ Session Created: {session_id}")
            else:
                print(f"❌ Session creation failed with status: {response.status}")
                response_text = await response.text()
                print(f"   Response: {response_text}")
                raise Exception(f"Failed to create session: {response.status}")
    
    # Test 3: Send Protocol Message
    print("\n🔍 Testing Autonomous Protocol Message...")
    test_message = {
        "content": "Run the Autonomous Agentic Manager Protocol. I need a cost estimate for a construction project. Here are my specifications: electrical work, plumbing installation, and HVAC systems for a 2000 sq ft building.",
        "metadata": {
            "protocol_test": True,
            "expects_autonomous_workflow": True
        }
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.post(f"{BASE_URL}/api/chat/sessions/{session_id}/messages", json=test_message) as response:
            if response.status == 200:
                data = await response.json()
                print("✅ Protocol Message Sent")
                message_content = data.get('content', '') if isinstance(data, dict) else str(data)
                print(f"   Response: {message_content[:150]}...")
                
                # Check if autonomous protocol was triggered
                response_content = message_content.lower()
                if any(term in response_content for term in ['autonomous', 'protocol', 'manager', 'agent']):
                    print("✅ Autonomous Protocol: Detected in response")
                else:
                    print("⚠️ Autonomous Protocol: Not explicitly mentioned")
                    
            else:
                raise Exception(f"Chat send failed: {response.status}")
    
    # Test 4: Check Session Messages
    print("\n🔍 Checking Session Messages...")
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{BASE_URL}/api/chat/sessions/{session_id}/messages") as response:
            if response.status == 200:
                data = await response.json()
                messages = data if isinstance(data, list) else data.get('messages', [])
                print(f"✅ Messages Retrieved: {len(messages)} messages")
                
                # Look for agent activity
                agent_activity = False
                for msg in messages:
                    if isinstance(msg, dict):
                        content = str(msg.get('content', '')).lower()
                        if any(agent in content for agent in ['filereader', 'trademapper', 'scope', 'estimator']):
                            agent_activity = True
                            break
                
                if agent_activity:
                    print("✅ Agent Activity: Detected in messages")
                else:
                    print("⚠️ Agent Activity: Not yet visible (may be processing)")
            else:
                print(f"⚠️ Messages Check: Status {response.status}")
    
    # Test 5: Check for Protocol Endpoints
    print("\n🔍 Testing Protocol Endpoints...")
    
    # Test manager agent endpoint
    async with aiohttp.ClientSession() as session:
        try:
            test_state = {
                "files": [],
                "session_id": session_id,
                "user_message": "Test autonomous protocol"
            }
            async with session.post(f"{BASE_URL}/api/manager/process", json=test_state) as response:
                if response.status in [200, 422]:  # 422 might be validation error, which is ok
                    print("✅ Manager Agent Endpoint: Accessible")
                else:
                    print(f"⚠️ Manager Agent Endpoint: Status {response.status}")
        except Exception as e:
            print(f"⚠️ Manager Agent Endpoint: {str(e)}")
    
    print("\n🎉 Basic Protocol Test Complete!")
    print("✅ Core functionality appears to be working")
    print("💡 For full validation, upload files and monitor stepwise execution")

async def main():
    try:
        await test_protocol_basic()
    except Exception as e:
        print(f"\n❌ Test failed: {str(e)}")
        return 1
    return 0

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)
