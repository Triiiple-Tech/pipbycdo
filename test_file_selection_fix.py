#!/usr/bin/env python3
"""
Test file selection functionality specifically.
Tests the fix for submitting file selections without additional text.
"""

import asyncio
import json
import aiohttp
from typing import Dict, Any

BASE_URL = "http://localhost:8000"

async def test_file_selection_fix():
    """Test that file selection works without additional text"""
    async with aiohttp.ClientSession() as session:
        
        # 1. Create a chat session
        print("🔥 Creating chat session...")
        async with session.post(f"{BASE_URL}/api/chat/sessions", 
                               json={"name": "File Selection Test"}) as resp:
            print(f"Session creation status: {resp.status}")
            if resp.status not in [200, 201]:
                print(f"❌ Failed to create session: {resp.status}")
                return False
            
            session_data = await resp.json()
            session_id = session_data["id"]
            print(f"✅ Created session: {session_id}")
        
        # 2. Send a Smartsheet URL to get file listings
        print("📊 Sending Smartsheet URL to get file listings...")
        smartsheet_url = "https://app.smartsheet.com/sheets/7RPQ2M9fwcqR4jWVhVGCMm8CGWJqj3mPVWFffmc1"
        
        async with session.post(f"{BASE_URL}/api/chat/sessions/{session_id}/messages",
                               json={"content": smartsheet_url}) as resp:
            print(f"Message sending status: {resp.status}")
            if resp.status not in [200, 201]:
                print(f"❌ Failed to send message: {resp.status}")
                return False
            
            response_data = await resp.json()
            print(f"✅ Got response with both user and agent messages")
            
            # Check if the response contains both messages
            if "user_message" not in response_data:
                print(f"❌ No user_message found in response")
                return False
                
            if "agent_response" not in response_data:
                print(f"❌ No agent_response found in response")
                return False
                
            agent_response = response_data["agent_response"]
            if not agent_response:
                print(f"❌ agent_response is null")
                return False
            
            # Check if the agent response contains file selection UI
            content = agent_response.get("content", "")
            if "📊 Smartsheet Files Retrieved" not in content and "🔗 **Smartsheet Connection Established**" not in content:
                print(f"❌ No file selection UI found in agent response")
                print(f"Agent response content: {content[:200]}...")
                return False
                
            print("✅ File selection UI detected in agent response")
        
        # 3. Test file selection WITHOUT additional text
        print("🎯 Testing file selection without additional text...")
        file_selection_data = {
            "selected_files": ["file1", "file2", "file3"],
            "action": "analyze_selected",
            "additional_text": ""  # This is the key test - empty additional text
        }
        
        async with session.post(f"{BASE_URL}/api/chat/sessions/{session_id}/file-selection",
                               json=file_selection_data) as resp:
            if resp.status != 200:
                print(f"❌ File selection failed: {resp.status}")
                response_text = await resp.text()
                print(f"Error response: {response_text}")
                return False
            
            selection_response = await resp.json()
            if not selection_response.get("success"):
                print(f"❌ File selection not successful: {selection_response}")
                return False
            
            print("✅ File selection without additional text SUCCESS!")
            
            # Check that we got both selection message and agent response
            if "selection_message" in selection_response and "agent_response" in selection_response:
                print("✅ Both selection message and agent response received")
                
                selection_msg = selection_response["selection_message"]
                agent_msg = selection_response["agent_response"]
                
                print(f"📝 Selection message: {selection_msg['content']}")
                print(f"🤖 Agent response: {agent_msg['content'][:100]}...")
                
                return True
            else:
                print(f"❌ Missing selection_message or agent_response")
                return False

        # 4. Test file selection WITH additional text
        print("🎯 Testing file selection with additional text...")
        file_selection_data_with_text = {
            "selected_files": ["file1"],
            "action": "analyze_selected",
            "additional_text": "Focus on cost estimation for electrical work"
        }
        
        async with session.post(f"{BASE_URL}/api/chat/sessions/{session_id}/file-selection",
                               json=file_selection_data_with_text) as resp:
            if resp.status != 200:
                print(f"❌ File selection with text failed: {resp.status}")
                return False
            
            selection_response = await resp.json()
            if not selection_response.get("success"):
                print(f"❌ File selection with text not successful: {selection_response}")
                return False
            
            print("✅ File selection with additional text SUCCESS!")
            return True

if __name__ == "__main__":
    result = asyncio.run(test_file_selection_fix())
    if result:
        print("\n🎉 ALL FILE SELECTION TESTS PASSED!")
        print("✅ File selection without additional text works correctly")
        print("✅ File selection with additional text works correctly")
    else:
        print("\n❌ FILE SELECTION TESTS FAILED!")
        print("❌ There are still issues with the file selection functionality")
