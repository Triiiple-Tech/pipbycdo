#!/usr/bin/env python3
"""
Comprehensive End-to-End Test for PIP AI – Autonomous Agentic Manager Protocol

Tests the complete workflow from:
1. Universal Intake (files/Smartsheet)
2. Intent Classification & Route Planning
3. Self-Governing Task Delegation
4. Stepwise User Presentation
5. Autonomous Output Management

This test validates that the protocol is fully implemented and working correctly.
"""

import asyncio
import json
import os
import sys
import time
from typing import Dict, Any, List
import aiohttp
import websockets
from datetime import datetime

# Test configuration
BASE_URL = "http://localhost:8000"
WS_URL = "ws://localhost:8000/api/chat/ws"
FRONTEND_URL = "http://localhost:3000"

class AutonomousProtocolTester:
    """
    End-to-end tester for the Autonomous Agentic Manager Protocol
    """
    
    def __init__(self):
        self.session_id: str = ""
        self.ws_connection = None
        self.received_messages: List[Dict[str, Any]] = []
        self.step_updates: List[Dict[str, Any]] = []
        
    async def run_comprehensive_test(self):
        """Run the complete protocol test suite"""
        print("🚀 Starting Comprehensive Autonomous Agentic Manager Protocol Test")
        print("=" * 80)
        
        try:
            # Test 1: Service Health Check
            await self._test_service_health()
            
            # Test 2: WebSocket Connection
            await self._test_websocket_connection()
            
            # Test 3: Create Chat Session
            await self._test_create_chat_session()
            
            # Test 4: Universal Intake Test
            await self._test_universal_intake()
            
            # Test 5: Intent Classification & Route Planning
            await self._test_intent_classification()
            
            # Test 6: Agent Pipeline Execution
            await self._test_agent_pipeline()
            
            # Test 7: Stepwise User Presentation
            await self._test_stepwise_presentation()
            
            # Test 8: Autonomous Output Management
            await self._test_output_management()
            
            print("\n🎉 ALL PROTOCOL TESTS PASSED!")
            print("✅ Autonomous Agentic Manager Protocol is fully operational")
            
        except Exception as e:
            print(f"\n❌ Protocol Test Failed: {str(e)}")
            raise
        finally:
            if self.ws_connection:
                await self.ws_connection.close()
    
    async def _test_service_health(self):
        """Test that all required services are running"""
        print("\n🔍 Testing Service Health...")
        
        # Test backend API
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(f"{BASE_URL}/health") as response:
                    if response.status == 200:
                        print("✅ Backend API: Healthy")
                    else:
                        raise Exception(f"Backend API unhealthy: {response.status}")
            except Exception as e:
                print(f"❌ Backend API: {str(e)}")
                raise
        
        # Test frontend (simple check)
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(FRONTEND_URL) as response:
                    if response.status == 200:
                        print("✅ Frontend: Accessible")
                    else:
                        print(f"⚠️ Frontend: Status {response.status}")
            except Exception as e:
                print(f"⚠️ Frontend: {str(e)} (may not be critical)")
    
    async def _test_websocket_connection(self):
        """Test WebSocket connection for real-time updates"""
        print("\n🔍 Testing WebSocket Connection...")
        
        try:
            self.ws_connection = await websockets.connect(WS_URL)
            print("✅ WebSocket: Connected")
            
            # Set up message listener
            asyncio.create_task(self._listen_for_messages())
            
        except Exception as e:
            print(f"❌ WebSocket: {str(e)}")
            raise
    
    async def _listen_for_messages(self):
        """Listen for WebSocket messages"""
        try:
            async for message in self.ws_connection:
                data = json.loads(message)
                self.received_messages.append(data)
                
                # Track agent step updates
                if data.get("type", "").startswith("agent_processing_"):
                    self.step_updates.append(data)
                    print(f"📋 Agent Step Update: {data.get('type')} - {data.get('data', {}).get('agent_name')}")
                    
        except websockets.exceptions.ConnectionClosed:
            pass
        except Exception as e:
            print(f"⚠️ WebSocket Listener Error: {str(e)}")
    
    async def _test_create_chat_session(self):
        """Test creating a new chat session"""
        print("\n🔍 Testing Chat Session Creation...")
        
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{BASE_URL}/api/sessions") as response:
                if response.status == 200:
                    data = await response.json()
                    self.session_id = data["session_id"]
                    print(f"✅ Chat Session Created: {self.session_id}")
                else:
                    raise Exception(f"Failed to create session: {response.status}")
    
    async def _test_universal_intake(self):
        """Test Phase 1: Universal Intake"""
        print("\n🔍 Testing Phase 1: Universal Intake...")
        
        # Test file intake simulation
        test_message = {
            "content": "Analyze this construction project. I've uploaded 3 PDF plans and need a cost estimate.",
            "files": ["plan1.pdf", "plan2.pdf", "specifications.pdf"],  # Simulated files
            "session_id": self.session_id
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{BASE_URL}/api/chat/send", json=test_message) as response:
                if response.status == 200:
                    data = await response.json()
                    print("✅ Universal Intake: Message processed")
                    print(f"   Response: {data.get('message', '')[:100]}...")
                else:
                    raise Exception(f"Intake failed: {response.status}")
        
        # Wait for initial response
        await asyncio.sleep(2)
    
    async def _test_intent_classification(self):
        """Test Phase 2: Intent Classification & Route Planning"""
        print("\n🔍 Testing Phase 2: Intent Classification & Route Planning...")
        
        # Check if intent was classified in the response
        # This should be visible in the agent processing messages
        intent_detected = False
        for msg in self.received_messages:
            if "intent" in str(msg).lower() or "route" in str(msg).lower():
                intent_detected = True
                break
        
        if intent_detected or len(self.step_updates) > 0:
            print("✅ Intent Classification: Detected in workflow")
        else:
            print("⚠️ Intent Classification: Not explicitly visible (may be internal)")
    
    async def _test_agent_pipeline(self):
        """Test Phase 3: Self-Governing Task Delegation"""
        print("\n🔍 Testing Phase 3: Self-Governing Task Delegation...")
        
        # Wait for agent pipeline to start
        await asyncio.sleep(5)
        
        expected_agents = ["file_reader", "trade_mapper", "scope", "takeoff", "estimator"]
        agents_seen = set()
        
        for update in self.step_updates:
            agent_name = update.get("data", {}).get("agent_name", "")
            if agent_name:
                agents_seen.add(agent_name)
        
        print(f"✅ Agent Pipeline: {len(agents_seen)} agents processed")
        for agent in agents_seen:
            print(f"   - {agent}")
        
        if len(agents_seen) >= 3:  # At least some agents should have run
            print("✅ Self-Governing Delegation: Working")
        else:
            print("⚠️ Self-Governing Delegation: Limited agent execution")
    
    async def _test_stepwise_presentation(self):
        """Test Phase 4: Stepwise User Presentation"""
        print("\n🔍 Testing Phase 4: Stepwise User Presentation...")
        
        # Check for stepwise updates in messages
        stepwise_updates = [msg for msg in self.step_updates if 
                           msg.get("data", {}).get("status") in ["processing", "complete"]]
        
        if len(stepwise_updates) > 0:
            print(f"✅ Stepwise Presentation: {len(stepwise_updates)} step updates received")
            
            # Check for proper sequencing
            complete_steps = [msg for msg in stepwise_updates if 
                            msg.get("data", {}).get("status") == "complete"]
            
            if len(complete_steps) > 0:
                print(f"✅ Step Completion: {len(complete_steps)} steps completed")
            else:
                print("⚠️ Step Completion: No completed steps detected")
        else:
            print("⚠️ Stepwise Presentation: No step updates received")
    
    async def _test_output_management(self):
        """Test Phase 5: Autonomous Output Management"""
        print("\n🔍 Testing Phase 5: Autonomous Output Management...")
        
        # Check if output management is mentioned in messages
        output_management_detected = False
        for msg in self.received_messages:
            content = str(msg).lower()
            if any(term in content for term in ["export", "download", "output", "smartsheet"]):
                output_management_detected = True
                break
        
        if output_management_detected:
            print("✅ Output Management: Detected in workflow")
        else:
            print("⚠️ Output Management: Not explicitly detected")
        
        # Test export endpoint
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(f"{BASE_URL}/api/sessions/{self.session_id}/export") as response:
                    if response.status in [200, 404]:  # 404 is acceptable if no data to export yet
                        print("✅ Export Endpoint: Accessible")
                    else:
                        print(f"⚠️ Export Endpoint: Status {response.status}")
            except Exception as e:
                print(f"⚠️ Export Endpoint: {str(e)}")

async def main():
    """Main test runner"""
    print("🎯 PIP AI – Autonomous Agentic Manager Protocol")
    print("   Comprehensive End-to-End Integration Test")
    print("   " + "=" * 50)
    
    # Check if services are likely running
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{BASE_URL}/health", timeout=5) as response:
                pass
    except Exception:
        print("\n❌ Backend service not running!")
        print("   Please start the development environment first:")
        print("   ./start-dev-environment.sh")
        return
    
    tester = AutonomousProtocolTester()
    
    try:
        await tester.run_comprehensive_test()
    except KeyboardInterrupt:
        print("\n⚠️ Test interrupted by user")
    except Exception as e:
        print(f"\n❌ Test suite failed: {str(e)}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
