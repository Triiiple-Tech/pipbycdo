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
            
            # 3. Test with realistic file upload scenario
            print("\n📁 Testing File Upload Workflow...")
            await self._test_file_upload_workflow()
            
            # 4. Test with Smartsheet integration
            print("\n🔗 Testing Smartsheet Integration Workflow...")
            await self._test_smartsheet_workflow()
            
            # 5. Test with complex estimation request
            print("\n🧮 Testing Complex Estimation Workflow...")
            await self._test_complex_estimation()
            
            # 6. Test error scenarios
            print("\n🚨 Testing Error Recovery Scenarios...")
            await self._test_error_scenarios()
            
            # 7. Generate comprehensive report
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
    
    async def _test_file_upload_workflow(self):
        """Test realistic file upload workflow"""
        print("📤 Simulating file upload with construction content...")
        
        # Start monitoring in background
        monitor_task = asyncio.create_task(self._monitor_streaming(
            duration=45, 
            scenario="file_upload"
        ))
        
        # Send realistic construction file analysis request
        realistic_message = {
            "content": """Please analyze my construction project files. I have uploaded 3 PDF plans:
            - Architectural Plans (25 pages)
            - Structural Drawings (15 pages) 
            - MEP Specifications (30 pages)
            
            I need a complete cost estimate including:
            - Material takeoffs
            - Labor calculations
            - Equipment costs
            - Project timeline
            
            Please process all files and provide detailed breakdown by trade.""",
            "metadata": {
                "files_uploaded": 3,
                "total_pages": 70,
                "project_type": "commercial_construction",
                "complexity": "high"
            }
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/chat/sessions/{self.session_id}/messages",
                json=realistic_message
            )
            
            if response.status_code == 200:
                print("✅ File analysis workflow triggered")
            else:
                print(f"❌ Failed to trigger workflow: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Workflow trigger failed: {e}")
        
        # Wait for monitoring to complete
        await monitor_task
    
    async def _test_smartsheet_workflow(self):
        """Test Smartsheet integration workflow"""
        print("🔗 Testing Smartsheet integration...")
        
        # Start monitoring
        monitor_task = asyncio.create_task(self._monitor_streaming(
            duration=30,
            scenario="smartsheet"
        ))
        
        # Send Smartsheet URL for processing
        smartsheet_message = {
            "content": "https://app.smartsheet.com/sheets/xchRwXGQ8HJ4pM3Fh73MM6X2H56Mhw64f4pGmPm1?view=grid",
            "metadata": {
                "integration_type": "smartsheet",
                "expected_files": "multiple",
                "processing_complexity": "medium"
            }
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/chat/sessions/{self.session_id}/messages",
                json=smartsheet_message
            )
            
            if response.status_code == 200:
                print("✅ Smartsheet workflow triggered")
            else:
                print(f"❌ Failed to trigger Smartsheet workflow: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Smartsheet workflow failed: {e}")
        
        await monitor_task
    
    async def _test_complex_estimation(self):
        """Test complex estimation with multiple parameters"""
        print("🧮 Testing complex estimation workflow...")
        
        monitor_task = asyncio.create_task(self._monitor_streaming(
            duration=35,
            scenario="complex_estimation"
        ))
        
        complex_request = {
            "content": """I need a detailed estimate for a 50,000 sq ft office building renovation including:
            
            ELECTRICAL WORK:
            - Complete electrical system upgrade
            - LED lighting throughout
            - Emergency power systems
            - Data/telecommunications infrastructure
            
            HVAC SYSTEMS:
            - New VAV system installation
            - Ductwork modifications
            - Controls and automation
            - Energy recovery units
            
            PLUMBING:
            - Restroom renovations (8 restrooms)
            - Break room plumbing
            - Fire sprinkler modifications
            
            Please provide:
            1. Material takeoffs by trade
            2. Labor hour calculations
            3. Equipment and tool costs
            4. Project timeline with critical path
            5. Risk analysis and contingencies
            
            Location: San Francisco, CA
            Timeline: 6 months
            Quality Level: High-end commercial""",
            "metadata": {
                "project_size": "large",
                "complexity": "very_high",
                "location": "san_francisco",
                "timeline_critical": True,
                "trades_involved": ["electrical", "hvac", "plumbing", "general"]
            }
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/chat/sessions/{self.session_id}/messages",
                json=complex_request
            )
            
            if response.status_code == 200:
                print("✅ Complex estimation workflow triggered")
            else:
                print(f"❌ Failed to trigger complex estimation: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Complex estimation failed: {e}")
        
        await monitor_task
    
    async def _test_error_scenarios(self):
        """Test error recovery scenarios"""
        print("🚨 Testing error recovery scenarios...")
        
        monitor_task = asyncio.create_task(self._monitor_streaming(
            duration=20,
            scenario="error_recovery"
        ))
        
        # Send a request that might trigger errors
        error_request = {
            "content": "Please analyze this corrupted file and invalid Smartsheet URL: https://invalid.smartsheet.com/broken/link",
            "metadata": {
                "test_scenario": "error_recovery",
                "expected_errors": True
            }
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/chat/sessions/{self.session_id}/messages",
                json=error_request
            )
            
            if response.status_code == 200:
                print("✅ Error scenario triggered")
            else:
                print(f"❌ Failed to trigger error scenario: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error scenario failed: {e}")
        
        await monitor_task
    
    async def _monitor_streaming(self, duration: int = 30, scenario: str = "default"):
        """Monitor streaming messages for a specific duration"""
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
                        
                        # Print real-time updates
                        timestamp = datetime.now().strftime("%H:%M:%S")
                        msg_type = data.get("type", "unknown")
                        
                        if msg_type == "manager_thinking":
                            thinking_type = data.get("data", {}).get("thinking_type", "processing")
                            analysis = data.get("data", {}).get("analysis", "")[:50]
                            print(f"  🧠 [{timestamp}] Manager: {thinking_type} - {analysis}...")
                            
                        elif msg_type == "agent_substep":
                            agent = data.get("data", {}).get("agent_name", "unknown")
                            substep = data.get("data", {}).get("substep", "processing")
                            progress = data.get("data", {}).get("progress_percentage", 0)
                            print(f"  📊 [{timestamp}] {agent}: {substep} ({progress}%)")
                            
                        elif msg_type == "brain_allocation":
                            agent = data.get("data", {}).get("agent_name", "unknown")
                            model = data.get("data", {}).get("model_selected", "unknown")
                            print(f"  🤖 [{timestamp}] Brain: {agent} → {model}")
                            
                        elif msg_type == "workflow_state_change":
                            change = data.get("data", {}).get("change_type", "unknown")
                            stage = data.get("data", {}).get("current_stage", "unknown")
                            print(f"  🎯 [{timestamp}] Workflow: {change} → {stage}")
                            
                        elif msg_type == "user_decision_needed":
                            decision_type = data.get("data", {}).get("decision_type", "unknown")
                            print(f"  🤔 [{timestamp}] Decision: {decision_type} needed")
                            
                        elif msg_type == "error_recovery":
                            severity = data.get("data", {}).get("severity", "unknown")
                            error = data.get("data", {}).get("error_message", "")[:30]
                            print(f"  🚨 [{timestamp}] Error: {severity} - {error}...")
                    
                    self.streaming_messages.append(data)
                    
                except asyncio.TimeoutError:
                    continue
                except Exception as e:
                    print(f"⚠️ Message processing error: {e}")
                    continue
                    
        except Exception as e:
            print(f"❌ Monitoring error: {e}")
        
        print(f"📋 {scenario.title()} completed: {len(scenario_messages)} streaming messages")
        return scenario_messages
    
    async def _generate_comprehensive_report(self):
        """Generate comprehensive streaming capabilities report"""
        print("\n" + "=" * 60)
        print("📋 COMPREHENSIVE ENHANCED STREAMING REPORT")
        print("=" * 60)
        
        total_messages = len(self.streaming_messages)
        print(f"📊 Total streaming messages received: {total_messages}")
        
        if total_messages > 0:
            # Feature breakdown
            print(f"\n🎯 Enhanced Features Detected:")
            working_features = 0
            total_features = len(self.feature_status)
            
            for feature, count in self.feature_status.items():
                status = "✅ Working" if count > 0 else "❌ Not detected"
                if count > 0:
                    working_features += 1
                print(f"  • {feature.replace('_', ' ').title()}: {status} ({count} messages)")
            
            # Success rate calculation
            success_rate = (working_features / total_features) * 100
            print(f"\n🏆 Overall Success Rate: {success_rate:.1f}% ({working_features}/{total_features} features working)")
            
            # Performance metrics
            if self.streaming_messages:
                first_msg = self.streaming_messages[0].get("timestamp", "")
                last_msg = self.streaming_messages[-1].get("timestamp", "")
                print(f"\n⚡ Performance Metrics:")
                print(f"  • First message: {first_msg}")
                print(f"  • Last message: {last_msg}")
                print(f"  • Message frequency: {total_messages/120:.1f} messages/second")
            
            # Feature-specific analysis
            print(f"\n🔬 Feature Analysis:")
            
            if self.feature_status["manager_thinking"] > 0:
                print(f"  ✅ Manager Decision Broadcasting: Fully operational")
            else:
                print(f"  ❌ Manager Decision Broadcasting: Not working")
            
            if self.feature_status["agent_substep"] > 0:
                print(f"  ✅ Agent Progress Streaming: Fully operational") 
            else:
                print(f"  ❌ Agent Progress Streaming: Missing - agents not executing")
            
            if self.feature_status["brain_allocation"] > 0:
                print(f"  ✅ Brain Allocation Decisions: Fully operational")
            else:
                print(f"  ❌ Brain Allocation Decisions: Missing - no model allocation detected")
            
            if self.feature_status["user_decision_needed"] > 0:
                print(f"  ✅ Interactive User Decisions: Fully operational")
            else:
                print(f"  ❌ Interactive User Decisions: Missing - no user prompts detected")
            
            if self.feature_status["workflow_state_change"] > 0:
                print(f"  ✅ Workflow Visualization: Fully operational")
            else:
                print(f"  ❌ Workflow Visualization: Not working")
            
            if self.feature_status["error_recovery"] > 0:
                print(f"  ✅ Error Recovery Streaming: Fully operational")
            else:
                print(f"  ❌ Error Recovery Streaming: Not working")
            
            # Recommendations
            print(f"\n💡 Recommendations:")
            
            if self.feature_status["agent_substep"] == 0:
                print(f"  • Fix agent execution pipeline to trigger substep broadcasting")
            
            if self.feature_status["brain_allocation"] == 0:
                print(f"  • Implement brain allocation broadcasting in agent startup")
            
            if self.feature_status["user_decision_needed"] == 0:
                print(f"  • Add user decision prompts for file selection and parameters")
            
            if success_rate >= 80:
                print(f"  🎉 System is ready for production deployment!")
            elif success_rate >= 60:
                print(f"  ⚠️ System needs minor improvements before production")
            else:
                print(f"  🔧 System needs significant enhancement before production")
        
        else:
            print("❌ No streaming messages received - check WebSocket connectivity")
        
        print("\n✨ Comprehensive enhanced streaming test completed!")


async def main():
    """Main entry point"""
    tester = RealisticStreamingTest()
    await tester.run_realistic_test()


if __name__ == "__main__":
    print("🚀 Starting Realistic Enhanced Streaming Test")
    print("Make sure both backend and frontend are running")
    print("")
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n⚠️ Test interrupted by user")
    except Exception as e:
        print(f"\n❌ Test failed: {e}") 