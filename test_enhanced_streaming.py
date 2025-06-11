#!/usr/bin/env python3
"""
Enhanced Real-Time Streaming Demonstration
Tests the new manager decision broadcasting, agent progress, and workflow visualization features
"""

import asyncio
import websockets
import json
import time
from datetime import datetime
from typing import Dict, Any, List, Optional

class EnhancedStreamingDemo:
    """Demonstrates the enhanced real-time streaming capabilities"""
    
    def __init__(self):
        self.ws_url = "ws://localhost:8000/api/chat/ws"
        self.api_url = "http://localhost:8000/api"
        self.session_id: Optional[str] = None
        self.websocket: Any = None  # Simplified typing for websocket
        self.streaming_messages: List[Dict[str, Any]] = []
        
    async def run_demonstration(self):
        """Run the complete enhanced streaming demonstration"""
        print("🚀 Enhanced Real-Time Streaming Demonstration")
        print("=" * 60)
        
        try:
            # Step 1: Connect and verify streaming features
            await self._connect_websocket()
            
            # Step 2: Create chat session
            await self._create_chat_session()
            
            # Step 3: Trigger enhanced workflow
            await self._trigger_enhanced_workflow()
            
            # Step 4: Monitor streaming messages
            await self._monitor_streaming_messages()
            
            # Step 5: Demonstrate interactive decisions
            await self._test_interactive_decisions()
            
            # Step 6: Generate summary report
            await self._generate_streaming_report()
            
        except Exception as e:
            print(f"❌ Demonstration failed: {str(e)}")
        finally:
            if self.websocket:
                await self.websocket.close()
    
    async def _connect_websocket(self):
        """Connect to WebSocket and verify streaming features"""
        print("\n🔌 Connecting to Enhanced WebSocket...")
        
        try:
            self.websocket = await websockets.connect(self.ws_url)
            print("✅ WebSocket connected successfully")
            
            # Wait for connection confirmation
            if self.websocket:
                initial_message = await self.websocket.recv()
                connection_data = json.loads(initial_message)
                
                print(f"📡 Connection confirmed: {connection_data.get('connection_id', 'unknown')}")
                
                # Verify streaming features are available
                streaming_features = connection_data.get('streaming_features', [])
                print(f"🎯 Available streaming features: {', '.join(streaming_features)}")
                
                if len(streaming_features) >= 6:
                    print("✅ All enhanced streaming features available!")
                else:
                    print("⚠️ Some streaming features may be missing")
                
        except Exception as e:
            print(f"❌ WebSocket connection failed: {e}")
            raise
    
    async def _create_chat_session(self):
        """Create a chat session for testing"""
        print("\n💬 Creating chat session...")
        
        import aiohttp
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.api_url}/chat/sessions", 
                                  json={"name": "Enhanced Streaming Demo"}) as response:
                if response.status == 200:
                    session_data = await response.json()
                    self.session_id = session_data["id"]
                    print(f"✅ Chat session created: {self.session_id}")
                else:
                    raise Exception(f"Failed to create session: {response.status}")
    
    async def _trigger_enhanced_workflow(self):
        """Trigger an enhanced workflow to see streaming in action"""
        print("\n🎯 Triggering enhanced workflow...")
        
        # Send a complex construction message that will trigger the full agent pipeline
        complex_construction_request = {
            "content": """URGENT: Complete analysis needed for commercial office renovation project.

PROJECT DETAILS:
Building: 50,000 sq ft office space renovation
Location: San Francisco, CA  
Timeline: 6 months
Budget Range: $2-4 million

SCOPE OF WORK:
1. ELECTRICAL SYSTEMS:
   - Complete electrical panel upgrade (400A service)
   - LED lighting retrofit (500+ fixtures)
   - Data/telecommunications infrastructure
   - Emergency power systems upgrade
   - Security and access control installation

2. HVAC SYSTEMS:
   - New VAV system installation (12 zones)
   - Rooftop unit replacements (3 units, 20-ton each)
   - Ductwork modifications throughout building
   - Building automation system integration
   - Energy recovery units installation

3. PLUMBING WORK:
   - Restroom renovations (8 restrooms)
   - Break room plumbing upgrades
   - Fire sprinkler system modifications
   - Water heater replacement (2 commercial units)

4. GENERAL CONSTRUCTION:
   - Demolition of existing offices (15,000 sq ft)
   - New partition walls and doors (100+ doors)
   - Suspended ceiling installation (40,000 sq ft)
   - Flooring replacement (carpet and tile)
   - Paint and architectural finishes

DELIVERABLES REQUIRED:
✓ Complete trade identification and mapping
✓ Detailed scope analysis by trade
✓ Material takeoffs and quantity calculations
✓ Labor hour estimates with crew composition
✓ Equipment and tool rental costs
✓ Cost estimation with current market rates
✓ Project timeline with critical path analysis
✓ Risk assessment and contingency recommendations

Please process this through your complete autonomous workflow including all agents with brain allocation decisions, progress updates, and interactive user prompts for any decisions needed.""",
            "metadata": {
                "project_type": "commercial_renovation",
                "complexity": "high", 
                "building_size": 50000,
                "location": "san_francisco",
                "timeline_months": 6,
                "budget_range": "$2-4M",
                "requires_full_analysis": True,
                "test_scenario": "enhanced_streaming_validation"
            }
        }
        
        import aiohttp
        async with aiohttp.ClientSession() as session:
            async with session.post(f"{self.api_url}/chat/sessions/{self.session_id}/messages",
                                  json=complex_construction_request) as response:
                if response.status == 200:
                    print("✅ Enhanced workflow triggered")
                else:
                    print(f"⚠️ Workflow trigger may have failed: {response.status}")
    
    async def _monitor_streaming_messages(self):
        """Monitor and categorize incoming streaming messages"""
        print("\n📊 Monitoring real-time streaming messages...")
        print("Listening for 30 seconds...")
        
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
        
        end_time = time.time() + 30  # Monitor for 30 seconds
        
        try:
            while time.time() < end_time:
                try:
                    # Wait for message with timeout
                    message = await asyncio.wait_for(self.websocket.recv(), timeout=2.0)
                    message_data = json.loads(message)
                    
                    message_type = message_data.get("type", "other")
                    if message_type in message_types:
                        message_types[message_type] += 1
                    else:
                        message_types["other"] += 1
                    
                    # Store for analysis
                    self.streaming_messages.append(message_data)
                    
                    # Real-time display of interesting messages
                    await self._display_streaming_message(message_data)
                    
                except asyncio.TimeoutError:
                    continue  # Continue monitoring
                    
        except Exception as e:
            print(f"⚠️ Monitoring interrupted: {e}")
        
        # Display summary
        print(f"\n📈 Streaming Message Summary:")
        for msg_type, count in message_types.items():
            if count > 0:
                print(f"  🔹 {msg_type}: {count} messages")
    
    async def _display_streaming_message(self, message_data: Dict[str, Any]):
        """Display interesting streaming messages in real-time"""
        message_type = message_data.get("type")
        timestamp = datetime.now().strftime("%H:%M:%S")
        
        if message_type == "manager_thinking":
            thinking_type = message_data.get("data", {}).get("thinking_type", "unknown")
            analysis = message_data.get("data", {}).get("analysis", "")
            print(f"  🧠 [{timestamp}] Manager: {thinking_type} - {analysis[:80]}...")
            
        elif message_type == "agent_substep":
            agent_name = message_data.get("data", {}).get("agent_name", "unknown")
            substep = message_data.get("data", {}).get("substep", "unknown")
            progress = message_data.get("data", {}).get("progress_percentage", 0)
            print(f"  📊 [{timestamp}] {agent_name}: {substep} ({progress}%)")
            
        elif message_type == "workflow_state_change":
            change_type = message_data.get("data", {}).get("change_type", "unknown")
            print(f"  🎯 [{timestamp}] Workflow: {change_type}")
            
        elif message_type == "brain_allocation":
            agent_name = message_data.get("data", {}).get("agent_name", "unknown")
            model = message_data.get("data", {}).get("model_selected", "unknown")
            print(f"  🤖 [{timestamp}] Brain Allocation: {agent_name} → {model}")
            
        elif message_type == "user_decision_needed":
            decision_type = message_data.get("data", {}).get("decision_type", "unknown")
            print(f"  🤔 [{timestamp}] User Decision Needed: {decision_type}")
    
    async def _test_interactive_decisions(self):
        """Test interactive decision functionality"""
        print("\n🤔 Testing interactive decision responses...")
        
        # Send a test decision response
        test_response = {
            "type": "user_decision_response",
            "session_id": self.session_id,
            "decision_id": "test_decision_123",
            "response": "proceed"
        }
        
        await self.websocket.send(json.dumps(test_response))
        print("✅ Test decision response sent")
        
        # Wait for acknowledgment
        if self.websocket:
            try:
                response = await asyncio.wait_for(self.websocket.recv(), timeout=5.0)
                response_data = json.loads(response)
                
                if response_data.get("type") == "decision_response_acknowledged":
                    print("✅ Decision response acknowledged by server")
                else:
                    print(f"📄 Received: {response_data.get('type', 'unknown')}")
                    
            except asyncio.TimeoutError:
                print("⚠️ No acknowledgment received (may be normal)")
    
    async def _generate_streaming_report(self):
        """Generate a comprehensive report of streaming capabilities"""
        print("\n📋 Enhanced Streaming Capabilities Report")
        print("=" * 50)
        
        # Analyze collected messages
        total_messages = len(self.streaming_messages)
        print(f"📊 Total streaming messages received: {total_messages}")
        
        # Message type analysis
        type_counts: Dict[str, int] = {}
        for msg in self.streaming_messages:
            msg_type: str = msg.get("type", "unknown")
            type_counts[msg_type] = type_counts.get(msg_type, 0) + 1
        
        print("\n🎯 Message Type Breakdown:")
        for msg_type, count in sorted(type_counts.items()):
            percentage = (count / total_messages * 100) if total_messages > 0 else 0
            print(f"  • {msg_type}: {count} ({percentage:.1f}%)")
        
        # Enhanced features validation
        print("\n✅ Enhanced Features Validation:")
        
        features = {
            "Manager Decision Broadcasting": "manager_thinking" in type_counts,
            "Agent Progress Streaming": "agent_substep" in type_counts,
            "Workflow Visualization": "workflow_state_change" in type_counts,
            "Brain Allocation Decisions": "brain_allocation" in type_counts,
            "Interactive User Decisions": "user_decision_needed" in type_counts,
            "Error Recovery Streaming": "error_recovery" in type_counts
        }
        
        for feature_name, is_working in features.items():
            status = "✅ Working" if is_working else "❌ Not detected"
            print(f"  • {feature_name}: {status}")
        
        # Performance metrics
        if self.streaming_messages:
            first_msg_time = self.streaming_messages[0].get("timestamp", "")
            last_msg_time = self.streaming_messages[-1].get("timestamp", "")
            print(f"\n⚡ Performance Metrics:")
            print(f"  • First message: {first_msg_time}")
            print(f"  • Last message: {last_msg_time}")
            print(f"  • Message frequency: {total_messages / 30:.1f} messages/second")
        
        # Success criteria
        success_count = sum(features.values())
        total_features = len(features)
        success_rate = (success_count / total_features * 100) if total_features > 0 else 0
        
        print(f"\n🏆 Overall Success Rate: {success_rate:.1f}% ({success_count}/{total_features} features working)")
        
        if success_rate >= 80:
            print("🎉 Enhanced streaming implementation is EXCELLENT!")
        elif success_rate >= 60:
            print("✅ Enhanced streaming implementation is GOOD!")
        elif success_rate >= 40:
            print("⚠️ Enhanced streaming implementation needs improvement.")
        else:
            print("❌ Enhanced streaming implementation requires significant work.")


async def main():
    """Run the enhanced streaming demonstration"""
    demo = EnhancedStreamingDemo()
    await demo.run_demonstration()


if __name__ == "__main__":
    print("🚀 Starting Enhanced Real-Time Streaming Demonstration")
    print("Make sure the backend is running on localhost:8000")
    print()
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n⚠️ Demonstration interrupted by user")
    except Exception as e:
        print(f"\n❌ Demonstration failed: {e}")
    
    print("\n✨ Enhanced streaming demonstration completed!") 