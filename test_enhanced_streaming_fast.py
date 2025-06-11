#!/usr/bin/env python3
"""
Fast Enhanced Streaming Test
Validates core streaming features without running full LLM pipeline
"""

import asyncio
import websockets
import json
import time
from datetime import datetime
from typing import Dict, Any, List, Optional

class FastStreamingTest:
    """Fast test for enhanced streaming features without full pipeline execution"""
    
    def __init__(self):
        self.ws_url = "ws://localhost:8000/api/chat/ws"
        self.api_url = "http://localhost:8000/api"
        self.session_id: Optional[str] = None
        self.websocket: Any = None
        self.streaming_messages: List[Dict[str, Any]] = []
        
    async def run_fast_test(self):
        """Run fast streaming validation test"""
        print("🚀 Fast Enhanced Streaming Test")
        print("=" * 40)
        
        try:
            # Step 1: Quick connection test
            await self._quick_connect()
            
            # Step 2: Create session
            await self._create_session()
            
            # Step 3: Test simple message (should trigger manager)
            await self._test_simple_message()
            
            # Step 4: Monitor for 5 seconds only
            await self._quick_monitor()
            
            # Step 5: Generate summary
            await self._generate_summary()
            
        except Exception as e:
            print(f"❌ Fast test failed: {str(e)}")
        finally:
            if self.websocket:
                await self.websocket.close()
    
    async def _quick_connect(self):
        """Quick WebSocket connection test"""
        print("\n🔌 Quick WebSocket test...")
        
        self.websocket = await websockets.connect(self.ws_url)
        initial_message = await asyncio.wait_for(self.websocket.recv(), timeout=3.0)
        connection_data = json.loads(initial_message)
        
        print(f"✅ Connected: {connection_data.get('connection_id', 'unknown')[:8]}...")
    
    async def _create_session(self):
        """Create test session"""
        print("\n💬 Creating session...")
        
        import aiohttp
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.api_url}/chat/sessions", 
                                  json={"name": "Fast Test"}) as response:
                if response.status == 200:
                    try:
                        session_data = await response.json()
                        self.session_id = session_data["id"]  # type: ignore
                        print(f"✅ Session: {self.session_id[:8]}...")
                    except (KeyError, TypeError) as e:
                        raise Exception(f"Session creation failed: Invalid response - {e}")
                else:
                    raise Exception(f"Session creation failed: {response.status}")
    
    async def _test_simple_message(self):
        """Send a simple message to trigger basic streaming"""
        print("\n📝 Testing simple message...")
        
        # Send a construction request that triggers enhanced streaming but stops early
        construction_request = {
            "content": """URGENT: Quick cost estimate needed for small office renovation.
            
            PROJECT: 1,000 sq ft office renovation
            LOCATION: San Francisco, CA
            SCOPE: Electrical, plumbing, HVAC updates
            
            Need trade analysis and scope breakdown."""
        }
        
        import aiohttp
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.api_url}/chat/sessions/{self.session_id}/messages",
                                  json=construction_request) as response:
                if response.status == 200:
                    print("✅ Message sent")
                else:
                    print(f"⚠️ Message failed: {response.status}")
    
    async def _quick_monitor(self):
        """Monitor for 5 seconds instead of 30"""
        print("\n📊 Quick monitoring (5 seconds)...")
        
        message_types = {
            "manager_thinking": 0,
            "agent_substep": 0,
            "workflow_state_change": 0,
            "brain_allocation": 0,
            "user_decision_needed": 0,
            "error_recovery": 0,
            "chat_message": 0,
            "other": 0
        }
        
        end_time = time.time() + 5  # Only 5 seconds
        
        try:
            while time.time() < end_time:
                try:
                    message = await asyncio.wait_for(self.websocket.recv(), timeout=1.0)
                    message_data = json.loads(message)
                    
                    message_type = message_data.get("type", "other")
                    if message_type in message_types:
                        message_types[message_type] += 1
                    else:
                        message_types["other"] += 1
                    
                    self.streaming_messages.append(message_data)
                    
                    # Quick display
                    timestamp = datetime.now().strftime("%H:%M:%S")
                    if message_type == "manager_thinking":
                        thinking_type = message_data.get("data", {}).get("thinking_type", "unknown")
                        print(f"  🧠 [{timestamp}] Manager: {thinking_type}")
                    elif message_type == "agent_substep":
                        agent_name = message_data.get("data", {}).get("agent_name", "unknown")
                        substep = message_data.get("data", {}).get("substep", "unknown")
                        print(f"  📊 [{timestamp}] {agent_name}: {substep}")
                    elif message_type == "workflow_state_change":
                        change_type = message_data.get("data", {}).get("change_type", "unknown")
                        print(f"  🎯 [{timestamp}] Workflow: {change_type}")
                    elif message_type == "brain_allocation":
                        agent_name = message_data.get("data", {}).get("agent_name", "unknown")
                        model = message_data.get("data", {}).get("model_selected", "unknown")
                        print(f"  🤖 [{timestamp}] Brain: {agent_name} → {model}")
                        
                except asyncio.TimeoutError:
                    continue
                    
        except Exception as e:
            print(f"⚠️ Monitoring ended: {e}")
        
        # Display summary
        print(f"\n📈 Quick Summary:")
        for msg_type, count in message_types.items():
            if count > 0:
                print(f"  • {msg_type}: {count}")
    
    async def _generate_summary(self):
        """Generate quick test summary"""
        print(f"\n🏆 Fast Test Results")
        print("=" * 30)
        
        total_messages = len(self.streaming_messages)
        print(f"📊 Total messages: {total_messages}")
        
        # Check core features
        features_detected = {
            "Manager Decisions": any(m.get("type") == "manager_thinking" for m in self.streaming_messages),
            "Agent Progress": any(m.get("type") == "agent_substep" for m in self.streaming_messages),
            "Workflow Updates": any(m.get("type") == "workflow_state_change" for m in self.streaming_messages),
            "Brain Allocation": any(m.get("type") == "brain_allocation" for m in self.streaming_messages),
        }
        
        print("\n✅ Core Features:")
        working_features = 0
        for feature, detected in features_detected.items():
            status = "✅" if detected else "❌"
            print(f"  {status} {feature}")
            if detected:
                working_features += 1
        
        success_rate = (working_features / len(features_detected)) * 100
        print(f"\n🎯 Success Rate: {success_rate:.1f}% ({working_features}/{len(features_detected)})")
        
        if success_rate >= 75:
            print("🎉 Enhanced streaming is working great!")
        elif success_rate >= 50:
            print("✅ Enhanced streaming is functional!")
        else:
            print("⚠️ Enhanced streaming needs attention.")
        
        print(f"\n⚡ Test completed in ~5 seconds (vs 30+ seconds for full test)")


async def main():
    """Run the fast streaming test"""
    test = FastStreamingTest()
    await test.run_fast_test()


if __name__ == "__main__":
    print("🚀 Starting Fast Enhanced Streaming Test")
    print("This validates core streaming without full LLM pipeline execution")
    print()
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n⚠️ Test interrupted by user")
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
    
    print("\n✨ Fast test completed!") 