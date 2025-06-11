#!/usr/bin/env python3
"""
Simple test to verify manager decision broadcasting
"""

import asyncio
import websockets
import json
import requests

async def test_manager_decisions():
    """Test if manager decisions are being broadcast via WebSocket"""
    print("🔍 Testing Manager Decision Broadcasting")
    print("=" * 50)
    
    try:
        # Connect to WebSocket
        print("Connecting to WebSocket...")
        async with websockets.connect("ws://localhost:8000/api/chat/ws") as websocket:
            print("✅ Connected to WebSocket")
            
            # Listen for initial connection message
            initial_msg = await websocket.recv()
            print(f"📥 Initial: {initial_msg}")
            
            # Trigger a simple request to activate the manager
            print("\n🚀 Triggering manager with simple request...")
            try:
                response = requests.post(
                    "http://localhost:8000/api/analyze",
                    headers={
                        "X-Internal-Code": "hermes",
                        "Content-Type": "application/json"
                    },
                    json={
                        "query": "test manager decisions",
                        "session_id": "decision-test"
                    },
                    timeout=30
                )
                print(f"📤 Request sent, status: {response.status_code}")
                if response.status_code == 200:
                    result = response.json()
                    print(f"📥 Response: {result}")
            except Exception as e:
                print(f"❌ Request failed: {e}")
            
            # Listen for messages for 30 seconds
            print("\n👂 Listening for manager decisions...")
            try:
                for _ in range(60):  # Listen for 60 seconds max
                    message = await asyncio.wait_for(websocket.recv(), timeout=1.0)
                    data = json.loads(message)
                    msg_type = data.get("type", "unknown")
                    
                    if msg_type == "manager_decision":
                        print(f"🎯 MANAGER DECISION DETECTED!")
                        decision_data = data.get("data", {})
                        decision_type = decision_data.get("decision_type", "unknown")
                        print(f"   Type: {decision_type}")
                        print(f"   Data: {decision_data}")
                        print("")
                    else:
                        print(f"📨 Message: {msg_type}")
                        
            except asyncio.TimeoutError:
                print("⏰ No more messages (timeout)")
                
    except Exception as e:
        print(f"❌ WebSocket error: {e}")

if __name__ == "__main__":
    asyncio.run(test_manager_decisions()) 