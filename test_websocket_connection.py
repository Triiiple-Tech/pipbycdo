#!/usr/bin/env python3
"""
Simple WebSocket Connection Test
Tests the actual WebSocket connection to verify it's working
"""

import asyncio
import websockets
import json
import sys

async def test_websocket_connection():
    """Test WebSocket connection to the chat endpoint"""
    url = "ws://localhost:8000/api/chat/ws"
    
    try:
        print(f"🔍 Testing WebSocket connection to {url}...")
        
        async with websockets.connect(url) as websocket:
            print("✅ WebSocket connected successfully!")
            
            # Wait for initial connection message
            try:
                initial_message = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                print(f"📥 Initial message: {initial_message}")
            except asyncio.TimeoutError:
                print("⚠️ No initial message received (timeout)")
            
            # Send a ping message
            ping_message = {"type": "ping", "timestamp": "2025-06-10T22:52:00Z"}
            await websocket.send(json.dumps(ping_message))
            print("📤 Sent ping message")
            
            # Wait for response
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                print(f"📥 Response: {response}")
            except asyncio.TimeoutError:
                print("⚠️ No response received (timeout)")
            
            print("✅ WebSocket test completed successfully!")
            
    except websockets.exceptions.ConnectionClosed as e:
        print(f"❌ WebSocket connection closed: {e.code} - {e.reason}")
        return False
    except Exception as e:
        print(f"❌ WebSocket connection failed: {e}")
        return False
    
    return True

async def main():
    """Main test function"""
    print("🚀 Starting WebSocket Connection Test")
    print("=" * 50)
    
    success = await test_websocket_connection()
    
    if success:
        print("\n🎉 All tests passed!")
        sys.exit(0)
    else:
        print("\n💥 Tests failed!")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main()) 