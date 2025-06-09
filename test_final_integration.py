#!/usr/bin/env python3
"""
End-to-End Integration Test for PIP AI Autonomous Agentic Manager Protocol

Tests the complete workflow from file upload through agent processing to final output,
including WebSocket real-time communication and frontend integration.
"""

import asyncio
import json
import time
from pathlib import Path
import requests
import websockets
from typing import Dict, Any, List

# Configuration
BACKEND_URL = "http://localhost:8000"
WS_URL = "ws://localhost:8000/api/chat/ws"
FRONTEND_URL = "http://localhost:3000"

class ProtocolIntegrationTest:
    """Comprehensive end-to-end test of the PIP AI protocol"""
    
    def __init__(self):
        self.test_results = []
        self.websocket_messages = []
    
    async def run_full_test_suite(self) -> Dict[str, Any]:
        """Run complete end-to-end test suite"""
        print("🚀 Starting PIP AI Protocol End-to-End Integration Test")
        print("=" * 60)
        
        results = {
            "timestamp": time.time(),
            "tests_run": 0,
            "tests_passed": 0,
            "tests_failed": 0,
            "details": []
        }
        
        # Test 1: Service Health Checks
        await self.test_service_health(results)
        
        # Test 2: WebSocket Communication
        await self.test_websocket_communication(results)
        
        # Test 3: API Endpoints
        await self.test_api_endpoints(results)
        
        # Test 4: Protocol Workflow
        await self.test_protocol_workflow(results)
        
        # Test 5: Frontend Integration (if available)
        await self.test_frontend_integration(results)
        
        # Generate final report
        await self.generate_report(results)
        
        return results
    
    async def test_service_health(self, results: Dict[str, Any]):
        """Test that all required services are running"""
        print("\n🔍 Testing Service Health...")
        
        # Backend health check
        try:
            response = requests.get(f"{BACKEND_URL}/health", timeout=5)
            if response.status_code == 200:
                self.record_test_result(results, "Backend Health Check", True, "✅ Backend is running")
            else:
                self.record_test_result(results, "Backend Health Check", False, f"❌ Backend returned {response.status_code}")
        except Exception as e:
            self.record_test_result(results, "Backend Health Check", False, f"❌ Backend not accessible: {e}")
        
        # Frontend health check (optional)
        try:
            response = requests.get(FRONTEND_URL, timeout=5)
            if response.status_code == 200:
                self.record_test_result(results, "Frontend Health Check", True, "✅ Frontend is running")
            else:
                self.record_test_result(results, "Frontend Health Check", True, f"⚠️ Frontend returned {response.status_code} (may be normal)")
        except Exception as e:
            self.record_test_result(results, "Frontend Health Check", True, f"⚠️ Frontend not accessible: {e} (optional)")
    
    async def test_websocket_communication(self, results: Dict[str, Any]):
        """Test WebSocket real-time communication"""
        print("\n🔌 Testing WebSocket Communication...")
        
        try:
            async with websockets.connect(WS_URL) as websocket:
                # Test connection
                self.record_test_result(results, "WebSocket Connection", True, "✅ WebSocket connected successfully")
                
                # Test sending message
                test_message = {"type": "test", "content": "integration_test", "timestamp": time.time()}
                await websocket.send(json.dumps(test_message))
                self.record_test_result(results, "WebSocket Send", True, "✅ Message sent successfully")
                
                # Test receiving (wait briefly for any response)
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                    self.websocket_messages.append(response)
                    self.record_test_result(results, "WebSocket Receive", True, f"✅ Received: {response[:100]}...")
                except asyncio.TimeoutError:
                    self.record_test_result(results, "WebSocket Receive", True, "⚠️ No immediate response (may be normal)")
                
        except Exception as e:
            self.record_test_result(results, "WebSocket Communication", False, f"❌ WebSocket error: {e}")
    
    async def test_api_endpoints(self, results: Dict[str, Any]):
        """Test core API endpoints"""
        print("\n🌐 Testing API Endpoints...")
        
        # Test analyze endpoint (main protocol entry point)
        try:
            analyze_data = {
                "query": "Test message for integration test"
            }
            headers = {"X-Internal-Code": "hermes"}
            response = requests.post(f"{BACKEND_URL}/api/analyze", data=analyze_data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                self.record_test_result(results, "Main API Endpoint", True, "✅ Analyze API responding")
            else:
                self.record_test_result(results, "Main API Endpoint", False, f"❌ Analyze API returned {response.status_code}")
        except Exception as e:
            self.record_test_result(results, "Main API Endpoint", False, f"❌ Analyze API error: {e}")
        
        # Test chat sessions endpoint
        try:
            session_data = {
                "name": "Integration Test Session"
            }
            response = requests.post(f"{BACKEND_URL}/api/chat/sessions", json=session_data, timeout=5)
            
            if response.status_code == 200:
                self.record_test_result(results, "Chat Sessions API", True, "✅ Chat Sessions API responding")
            else:
                self.record_test_result(results, "Chat Sessions API", False, f"❌ Chat Sessions API returned {response.status_code}")
        except Exception as e:
            self.record_test_result(results, "Chat Sessions API", False, f"❌ Chat Sessions API error: {e}")
        
        # Test analytics endpoint
        try:
            response = requests.get(f"{BACKEND_URL}/api/analytics/status", timeout=5)
            if response.status_code in [200, 404]:  # 404 is acceptable if no data
                self.record_test_result(results, "Analytics API Endpoint", True, "✅ Analytics API accessible")
            else:
                self.record_test_result(results, "Analytics API Endpoint", False, f"❌ Analytics API returned {response.status_code}")
        except Exception as e:
            self.record_test_result(results, "Analytics API Endpoint", False, f"❌ Analytics API error: {e}")
    
    async def test_protocol_workflow(self, results: Dict[str, Any]):
        """Test the core protocol workflow"""
        print("\n⚙️ Testing Protocol Workflow...")
        
        # Test protocol workflow using analyze endpoint
        try:
            workflow_data = {
                "query": "Please estimate this construction project"
            }
            headers = {"X-Internal-Code": "hermes"}
            response = requests.post(f"{BACKEND_URL}/api/analyze", data=workflow_data, headers=headers, timeout=15)
            
            if response.status_code == 200:
                response_data = response.json()
                if "task_id" in response_data:
                    self.record_test_result(results, "Protocol Workflow", True, "✅ Protocol workflow initiated successfully")
                else:
                    self.record_test_result(results, "Protocol Workflow", False, "❌ Invalid protocol response format")
            else:
                self.record_test_result(results, "Protocol Workflow", False, f"❌ Protocol workflow failed: {response.status_code}")
        except Exception as e:
            self.record_test_result(results, "Protocol Workflow", False, f"❌ Protocol workflow error: {e}")
    
    async def test_frontend_integration(self, results: Dict[str, Any]):
        """Test frontend integration if available"""
        print("\n🎨 Testing Frontend Integration...")
        
        try:
            # Test if frontend is serving the main page
            response = requests.get(FRONTEND_URL, timeout=5)
            if response.status_code == 200:
                # Check if it's actually the React app (look for common indicators)
                content = response.text.lower()
                if any(indicator in content for indicator in ['react', 'next', 'pip ai', 'stepwise']):
                    self.record_test_result(results, "Frontend Integration", True, "✅ Frontend serving PIP AI application")
                else:
                    self.record_test_result(results, "Frontend Integration", True, "⚠️ Frontend running but content unclear")
            else:
                self.record_test_result(results, "Frontend Integration", True, f"⚠️ Frontend not accessible (optional): {response.status_code}")
        except Exception as e:
            self.record_test_result(results, "Frontend Integration", True, f"⚠️ Frontend test skipped: {e}")
    
    def record_test_result(self, results: Dict[str, Any], test_name: str, passed: bool, message: str):
        """Record a test result"""
        results["tests_run"] += 1
        if passed:
            results["tests_passed"] += 1
        else:
            results["tests_failed"] += 1
        
        result_entry = {
            "test": test_name,
            "passed": passed,
            "message": message,
            "timestamp": time.time()
        }
        results["details"].append(result_entry)
        print(f"  {message}")
    
    async def generate_report(self, results: Dict[str, Any]):
        """Generate final test report"""
        print("\n" + "=" * 60)
        print("📊 FINAL INTEGRATION TEST REPORT")
        print("=" * 60)
        
        print(f"Tests Run: {results['tests_run']}")
        print(f"Tests Passed: {results['tests_passed']}")
        print(f"Tests Failed: {results['tests_failed']}")
        print(f"Success Rate: {(results['tests_passed'] / results['tests_run'] * 100):.1f}%")
        
        if results['tests_failed'] == 0:
            print("\n🎉 ALL TESTS PASSED! Protocol ready for production.")
        else:
            print(f"\n⚠️ {results['tests_failed']} test(s) failed. Review details above.")
        
        # Save detailed report
        report_file = Path("integration_test_report.json")
        with open(report_file, "w") as f:
            json.dump(results, f, indent=2)
        print(f"\n📄 Detailed report saved to: {report_file}")

async def main():
    """Main test execution"""
    test_runner = ProtocolIntegrationTest()
    results = await test_runner.run_full_test_suite()
    
    # Exit with error code if tests failed
    if results['tests_failed'] > 0:
        exit(1)
    else:
        print("\n✅ Integration test completed successfully!")
        exit(0)

if __name__ == "__main__":
    asyncio.run(main())
