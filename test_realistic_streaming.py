#!/usr/bin/env python3
"""
Realistic Enhanced Streaming Test
Tests all enhanced streaming features with actual workflow content
"""

import asyncio
import websockets
import json
import time
import requests
from datetime import datetime
from typing import Dict, Any, List, Optional

class RealisticStreamingTest:
    """Tests enhanced streaming with realistic workflow scenarios"""
    
    def __init__(self):
        self.ws_url = "ws://localhost:8000/api/chat/ws"
        self.api_url = "http://localhost:8000/api"
        self.session_id: Optional[str] = None
        self.websocket: Any = None
        self.streaming_messages: List[Dict[str, Any]] = []
        self.feature_status = {
            "manager_thinking": 0,
            "agent_substep": 0,
            "workflow_state_change": 0,
            "brain_allocation": 0,
            "user_decision_needed": 0,
            "error_recovery": 0
        }
        
    async def run_realistic_test(self):
        """Run comprehensive realistic workflow test"""
        print("🚀 Enhanced Streaming Realistic Workflow Test")
        print("=" * 60)
        
        try:
            # 1. Connect to WebSocket
            await self._connect_websocket()
            
            # 2. Create chat session
            await self._create_chat_session()
            
            # 3. Test with complex construction request
            print("\n🏗️ Testing Complex Construction Workflow...")
            await self._test_complex_construction()
            
            # 4. Generate comprehensive report
            await self._generate_comprehensive_report()
            
        finally:
            if self.websocket:
                await self.websocket.close()
    
    async def _connect_websocket(self):
        """Connect to enhanced WebSocket"""
        print("🔌 Connecting to Enhanced WebSocket...")
        
        try:
            self.websocket = await websockets.connect(self.ws_url)
            
            # Listen for connection confirmation
            response = await asyncio.wait_for(self.websocket.recv(), timeout=10)
            data = json.loads(response)
            
            if data.get("type") == "connection_established":
                print(f"✅ WebSocket connected: {data.get('connection_id')}")
                return True
            else:
                print(f"⚠️ Unexpected connection response: {data}")
                return False
                
        except Exception as e:
            print(f"❌ WebSocket connection failed: {e}")
            return False
    
    async def _create_chat_session(self):
        """Create a new chat session"""
        print("💬 Creating chat session...")
        
        try:
            response = requests.post(f"{self.api_url}/chat/sessions")
            if response.status_code == 200:
                data = response.json()
                self.session_id = data["id"]
                print(f"✅ Chat session created: {self.session_id}")
            else:
                print(f"❌ Failed to create session: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Session creation failed: {e}")
    
    async def _test_complex_construction(self):
        """Test realistic complex construction workflow"""
        print("🏗️ Triggering complex construction analysis...")
        
        # Start monitoring in background
        monitor_task = asyncio.create_task(self._monitor_streaming(
            duration=60, 
            scenario="complex_construction"
        ))
        
        # Send realistic construction analysis request that should trigger all agents
        complex_message = {
            "content": """Please analyze this commercial office building renovation project:
            
            PROJECT DETAILS:
            - Building: 50,000 sq ft office space
            - Location: San Francisco, CA
            - Timeline: 6 months
            - Budget Range: $2-4 million
            
            SCOPE OF WORK:
            1. ELECTRICAL SYSTEMS:
               - Complete electrical panel upgrade (400A service)
               - LED lighting retrofit (500 fixtures)
               - Data/telecommunications infrastructure
               - Emergency power systems
               - Security and access control
            
            2. HVAC SYSTEMS:
               - New VAV system installation
               - Ductwork modifications throughout
               - Building automation and controls
               - Energy recovery units (2 units)
               - Zone control systems
            
            3. PLUMBING WORK:
               - Restroom renovations (8 restrooms)
               - Break room plumbing upgrades
               - Fire sprinkler system modifications
               - Water heater replacement
            
            4. GENERAL CONSTRUCTION:
               - Demolition of existing offices
               - New partition walls and doors
               - Flooring replacement (carpet and tile)
               - Ceiling tile replacement
               - Paint and finishes
            
            DELIVERABLES NEEDED:
            1. Complete material takeoffs by trade
            2. Labor hour calculations with crew sizes
            3. Equipment and tool rental costs
            4. Project timeline with critical path analysis
            5. Risk assessment and contingency planning
            6. Cost breakdown by phase and trade
            
            Please process this request through your full analysis pipeline including:
            - Trade identification and mapping
            - Detailed scope analysis
            - Quantity takeoffs and calculations  
            - Cost estimation with current market rates
            - Export options for final deliverables
            
            This is a high-priority project requiring detailed analysis.""",
            "metadata": {
                "project_type": "commercial_renovation",
                "complexity": "very_high",
                "building_size": 50000,
                "location": "san_francisco",
                "timeline_months": 6,
                "budget_range": "$2-4M",
                "trades_count": 4,
                "priority": "high",
                "requires_full_pipeline": True
            }
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/chat/sessions/{self.session_id}/messages",
                json=complex_message
            )
            
            if response.status_code == 200:
                print("✅ Complex construction workflow triggered")
                print("📊 Monitoring for agent execution, brain allocation, and user decisions...")
            else:
                print(f"❌ Failed to trigger workflow: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Workflow trigger failed: {e}")
        
        # Wait for monitoring to complete
        await monitor_task
    
    async def _monitor_streaming(self, duration: int = 60, scenario: str = "default"):
        """Monitor streaming messages for enhanced features"""
        print(f"📊 Monitoring {scenario} streaming for {duration} seconds...")
        
        scenario_messages = []
        end_time = time.time() + duration
        
        try:
            while time.time() < end_time:
                try:
                    message = await asyncio.wait_for(self.websocket.recv(), timeout=1.0)
                    data = json.loads(message)
                    
                    if data.get("type") in self.feature_status:
                        self.feature_status[data["type"]] += 1
                        scenario_messages.append(data)
                        
                        # Print real-time updates for important events
                        timestamp = datetime.now().strftime("%H:%M:%S")
                        msg_type = data.get("type", "unknown")
                        
                        if msg_type == "manager_thinking":
                            thinking_type = data.get("data", {}).get("thinking_type", "processing")
                            analysis = data.get("data", {}).get("analysis", "")[:60]
                            print(f"  🧠 [{timestamp}] Manager: {thinking_type} - {analysis}...")
                            
                        elif msg_type == "agent_substep":
                            agent = data.get("data", {}).get("agent_name", "unknown")
                            substep = data.get("data", {}).get("substep", "processing")
                            progress = data.get("data", {}).get("progress_percentage", 0)
                            print(f"  📊 [{timestamp}] {agent}: {substep} ({progress}%)")
                            
                        elif msg_type == "brain_allocation":
                            agent = data.get("data", {}).get("agent_name", "unknown")
                            model = data.get("data", {}).get("model_selected", "unknown")
                            reasoning = data.get("data", {}).get("reasoning", "")[:40]
                            print(f"  🤖 [{timestamp}] Brain: {agent} → {model} ({reasoning}...)")
                            
                        elif msg_type == "workflow_state_change":
                            change = data.get("data", {}).get("change_type", "unknown")
                            stage = data.get("data", {}).get("current_stage", "unknown")[:30]
                            completion = data.get("data", {}).get("workflow_visualization", {}).get("completion_percentage", 0)
                            print(f"  🎯 [{timestamp}] Workflow: {change} → {stage} ({completion}%)")
                            
                        elif msg_type == "user_decision_needed":
                            decision_type = data.get("data", {}).get("decision_type", "unknown")
                            prompt = data.get("data", {}).get("prompt", "")[:40]
                            print(f"  🤔 [{timestamp}] Decision: {decision_type} - {prompt}...")
                            
                        elif msg_type == "error_recovery":
                            severity = data.get("data", {}).get("severity", "unknown")
                            error = data.get("data", {}).get("error_message", "")[:40]
                            print(f"  🚨 [{timestamp}] Error: {severity} - {error}...")
                    
                    self.streaming_messages.append(data)
                    
                except asyncio.TimeoutError:
                    continue
                except Exception as e:
                    print(f"⚠️ Message processing error: {e}")
                    continue
                    
        except Exception as e:
            print(f"❌ Monitoring error: {e}")
        
        print(f"📋 {scenario.title()} completed: {len(scenario_messages)} enhanced streaming messages")
        return scenario_messages
    
    async def _generate_comprehensive_report(self):
        """Generate detailed report on enhanced streaming capabilities"""
        print("\n" + "=" * 70)
        print("📋 ENHANCED STREAMING CAPABILITIES ANALYSIS")
        print("=" * 70)
        
        total_messages = len(self.streaming_messages)
        print(f"📊 Total streaming messages received: {total_messages}")
        
        if total_messages > 0:
            # Enhanced features analysis
            print(f"\n🎯 Enhanced Features Status:")
            working_features = 0
            total_features = len(self.feature_status)
            
            for feature, count in self.feature_status.items():
                status = "✅ WORKING" if count > 0 else "❌ MISSING"
                if count > 0:
                    working_features += 1
                feature_name = feature.replace('_', ' ').title()
                print(f"  • {feature_name:.<25} {status} ({count} messages)")
            
            # Success rate calculation
            success_rate = (working_features / total_features) * 100
            print(f"\n🏆 Enhanced Streaming Success Rate: {success_rate:.1f}% ({working_features}/{total_features})")
            
            # Detailed analysis
            print(f"\n🔍 Detailed Feature Analysis:")
            
            if self.feature_status["manager_thinking"] > 0:
                print(f"  ✅ Manager Decision Broadcasting: {self.feature_status['manager_thinking']} thoughts captured")
                print(f"     Real-time manager reasoning and decision processes working")
            else:
                print(f"  ❌ Manager Decision Broadcasting: No manager thinking detected")
            
            if self.feature_status["agent_substep"] > 0:
                print(f"  ✅ Agent Progress Streaming: {self.feature_status['agent_substep']} progress updates")
                print(f"     Granular agent execution progress working")
            else:
                print(f"  ❌ Agent Progress Streaming: No agent substeps detected")
                print(f"     → FIX NEEDED: Agents not executing or substep broadcasting missing")
            
            if self.feature_status["brain_allocation"] > 0:
                print(f"  ✅ Brain Allocation Decisions: {self.feature_status['brain_allocation']} allocations")
                print(f"     LLM model selection reasoning working")
            else:
                print(f"  ❌ Brain Allocation Decisions: No brain allocations detected")
                print(f"     → FIX NEEDED: Brain allocation broadcasting not implemented")
            
            if self.feature_status["user_decision_needed"] > 0:
                print(f"  ✅ Interactive User Decisions: {self.feature_status['user_decision_needed']} prompts")
                print(f"     User interaction prompting working")
            else:
                print(f"  ❌ Interactive User Decisions: No user prompts detected")
                print(f"     → FIX NEEDED: User decision prompts not implemented")
            
            if self.feature_status["workflow_state_change"] > 0:
                print(f"  ✅ Workflow Visualization: {self.feature_status['workflow_state_change']} state changes")
                print(f"     Pipeline visualization working")
            else:
                print(f"  ❌ Workflow Visualization: No workflow changes detected")
            
            if self.feature_status["error_recovery"] > 0:
                print(f"  ✅ Error Recovery Streaming: {self.feature_status['error_recovery']} error events")
                print(f"     Error handling and recovery working")
            else:
                print(f"  ✅ Error Recovery Streaming: No errors (system stable)")
            
            # Implementation status
            print(f"\n🚀 Implementation Status:")
            if success_rate >= 80:
                print(f"  🎉 PRODUCTION READY: Enhanced streaming fully operational!")
            elif success_rate >= 60:
                print(f"  ⚠️ MOSTLY READY: Minor enhancements needed")
            elif success_rate >= 40:
                print(f"  🔧 PARTIALLY WORKING: Core features need improvement")
            else:
                print(f"  🚨 NEEDS WORK: Major implementation gaps detected")
            
            # Next steps
            print(f"\n💡 Recommended Next Steps:")
            
            if self.feature_status["agent_substep"] == 0:
                print(f"  1. Fix agent execution to trigger substep broadcasting")
                print(f"     → Agents completing too quickly without progress updates")
            
            if self.feature_status["brain_allocation"] == 0:
                print(f"  2. Implement brain allocation broadcasting")
                print(f"     → Add model selection reasoning to agent startup")
            
            if self.feature_status["user_decision_needed"] == 0:
                print(f"  3. Add interactive user decision prompts")
                print(f"     → File selection, parameter choices, confirmation prompts")
            
            print(f"\n📈 Performance Summary:")
            if self.streaming_messages:
                first_msg = self.streaming_messages[0].get("timestamp", "")
                last_msg = self.streaming_messages[-1].get("timestamp", "")
                print(f"  • First message: {first_msg}")
                print(f"  • Last message: {last_msg}")
                print(f"  • Average frequency: {total_messages/60:.1f} messages/second")
                print(f"  • Total monitoring time: 60 seconds")
        
        else:
            print("❌ No streaming messages received")
            print("   → Check WebSocket connectivity and backend functionality")
        
        print(f"\n✨ Enhanced streaming analysis complete!")


async def main():
    """Main test runner"""
    tester = RealisticStreamingTest()
    await tester.run_realistic_test()


if __name__ == "__main__":
    print("🚀 Realistic Enhanced Streaming Test")
    print("Testing all 6 enhanced streaming features with complex workflows")
    print("Make sure backend (port 8000) and frontend (port 3000) are running")
    print("")
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n⚠️ Test interrupted by user")
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc() 