#!/usr/bin/env python3
"""
🧠 Enhanced Autonomous Manager Real-Time Monitor
Shows detailed workflow steps, decision points, and agent orchestration
"""

import asyncio
import websockets
import json
import sys
import time
import requests
from datetime import datetime
from typing import Dict, Any, List, Optional

class EnhancedAutonomousMonitor:
    def __init__(self):
        self.websocket = None
        self.messages_received = 0
        self.agent_activities = []
        self.decision_points = []
        self.workflow_steps = []
        
    def print_status(self, message: str, level: str = "INFO", agent: Optional[str] = None):
        timestamp = datetime.now().strftime("%H:%M:%S")
        colors = {
            "INFO": "\033[34m",      # Blue
            "SUCCESS": "\033[32m",   # Green  
            "WARNING": "\033[33m",   # Yellow
            "ERROR": "\033[31m",     # Red
            "MANAGER": "\033[35m",   # Magenta
            "AGENT": "\033[36m",     # Cyan
            "DECISION": "\033[93m",  # Bright Yellow
            "WORKFLOW": "\033[96m"   # Bright Cyan
        }
        reset = "\033[0m"
        color = colors.get(level, "\033[0m")
        
        if agent:
            print(f"{color}[{timestamp} {level}] 🤖 {agent}: {message}{reset}")
        else:
            print(f"{color}[{timestamp} {level}] {message}{reset}")
    
    async def connect_to_websocket(self):
        """Connect to the backend WebSocket for real-time updates"""
        try:
            self.websocket = await websockets.connect("ws://localhost:8000/api/chat/ws")
            self.print_status("Connected to PIP AI Enhanced Monitor", "SUCCESS")
            return True
        except Exception as e:
            self.print_status(f"Failed to connect to WebSocket: {e}", "ERROR")
            return False
    
    async def process_message(self, message: str):
        """Process and categorize incoming WebSocket messages"""
        try:
            data = json.loads(message)
            msg_type = data.get("type", "unknown")
            
            self.print_status(f"📥 Raw Message: {msg_type}", "INFO")
            
            # Categorize and process different message types
            if msg_type == "connection_established":
                self.print_status("🔗 WebSocket connection confirmed", "SUCCESS")
                
            elif msg_type.startswith("agent_processing_"):
                await self.handle_agent_processing(data)
                
            elif msg_type == "chat_message":
                await self.handle_chat_message(data)
                
            elif msg_type == "manager_decision":
                await self.handle_manager_decision(data)
                
            elif msg_type == "workflow_step":
                await self.handle_workflow_step(data)
                
            elif msg_type == "file_selection_processed":
                await self.handle_file_selection(data)
                
            else:
                self.print_status(f"📋 Unhandled message type: {msg_type}", "INFO")
                if "data" in data:
                    self.print_status(f"   Content: {str(data['data'])[:100]}...", "INFO")
                    
        except json.JSONDecodeError:
            self.print_status(f"📋 Non-JSON message: {message[:100]}...", "INFO")
        except Exception as e:
            self.print_status(f"Error processing message: {e}", "ERROR")
    
    async def handle_agent_processing(self, data):
        """Handle agent processing updates"""
        agent_data = data.get("data", {})
        agent_name = agent_data.get("agent_name", "Unknown")
        status = agent_data.get("status", "unknown")
        step_num = agent_data.get("step_number", 0)
        total_steps = agent_data.get("total_steps", 0)
        result_summary = agent_data.get("result_summary", "")
        
        self.print_status(
            f"Step {step_num}/{total_steps} - {status.upper()}: {result_summary}", 
            "AGENT", 
            agent_name
        )
        
        self.agent_activities.append({
            "timestamp": datetime.now().isoformat(),
            "agent": agent_name,
            "status": status,
            "step": f"{step_num}/{total_steps}",
            "summary": result_summary
        })
    
    async def handle_chat_message(self, data):
        """Handle chat message updates"""
        message_data = data.get("data", {})
        role = message_data.get("role", "unknown")
        content = message_data.get("content", "")[:200]
        agent_type = message_data.get("agent_type")
        
        if role == "assistant" and agent_type:
            self.print_status(
                f"💬 Response: {content}...", 
                "AGENT", 
                agent_type.title()
            )
    
    async def handle_manager_decision(self, data):
        """Handle autonomous manager decision points"""
        decision_data = data.get("data", {})
        decision_type = decision_data.get("decision_type", "unknown")
        
        if decision_type == "situation_analysis":
            analysis = decision_data.get("analysis", "Unknown analysis")
            confidence = decision_data.get("confidence", 0)
            self.print_status(f"🔍 SITUATION: {analysis} (confidence: {confidence:.2f})", "DECISION")
            
        elif decision_type == "brain_allocation":
            agent = decision_data.get("target_agent", "unknown")
            model = decision_data.get("model_selected", "unknown")
            reasoning = decision_data.get("reasoning", "")
            self.print_status(f"🧠 BRAIN ALLOCATION: {agent} → {model}", "DECISION")
            if reasoning:
                self.print_status(f"   Reasoning: {reasoning}", "DECISION")
                
        elif decision_type == "routing_decision":
            intent = decision_data.get("intent_classified", "unknown")
            sequence = decision_data.get("agent_sequence", [])
            confidence = decision_data.get("confidence", 0)
            self.print_status(f"🎯 ROUTING: {intent} → {sequence} (confidence: {confidence:.2f})", "DECISION")
            
        elif decision_type == "workflow_assessment":
            status = decision_data.get("completion_status", "unknown")
            completed = decision_data.get("completed_agents", [])
            remaining = decision_data.get("remaining_tasks", [])
            self.print_status(f"📊 WORKFLOW: {status} | Completed: {len(completed)} | Remaining: {len(remaining)}", "DECISION")
            
        else:
            # General decision handling
            decision = decision_data.get("decision", "Unknown decision")
            message = decision_data.get("message", "")
            self.print_status(f"🎯 GENERAL: {decision}", "DECISION")
            if message:
                self.print_status(f"   Details: {message[:100]}...", "DECISION")
            
        self.decision_points.append({
            "timestamp": datetime.now().isoformat(),
            "decision_type": decision_type,
            "data": decision_data
        })
    
    async def handle_workflow_step(self, data):
        """Handle workflow progression updates"""
        workflow_data = data.get("data", {})
        step_name = workflow_data.get("step_name", "Unknown step")
        status = workflow_data.get("status", "unknown")
        details = workflow_data.get("details", "")
        
        self.print_status(
            f"📋 WORKFLOW: {step_name} - {status.upper()}", 
            "WORKFLOW"
        )
        if details:
            self.print_status(f"   Details: {details}", "WORKFLOW")
            
        self.workflow_steps.append({
            "timestamp": datetime.now().isoformat(),
            "step": step_name,
            "status": status,
            "details": details
        })
    
    async def handle_file_selection(self, data):
        """Handle file selection processing"""
        selection = data.get("selection", {})
        response = data.get("response", {})
        
        self.print_status("📁 File selection processed", "SUCCESS")
        if selection.get("content"):
            self.print_status(f"   Selection: {selection['content']}", "INFO")
    
    def trigger_test_scenario(self):
        """Trigger a test scenario to demonstrate autonomous manager capabilities"""
        test_scenarios = [
            {
                "name": "Construction Document Analysis",
                "query": "Analyze construction documents and provide cost estimates",
                "session_id": "monitor-test-construction"
            },
            {
                "name": "Smartsheet Integration Test", 
                "query": "Connect to Smartsheet and analyze project data",
                "session_id": "monitor-test-smartsheet"
            },
            {
                "name": "Multi-Agent Workflow",
                "query": "Process complex construction project with multiple trade analysis",
                "session_id": "monitor-test-workflow"
            }
        ]
        
        print("\n" + "="*70)
        self.print_status("🚀 TRIGGERING TEST SCENARIOS", "MANAGER")
        print("="*70)
        
        for i, scenario in enumerate(test_scenarios, 1):
            try:
                self.print_status(f"Scenario {i}: {scenario['name']}", "MANAGER")
                
                response = requests.post(
                    "http://localhost:8000/api/analyze",
                    headers={
                        "X-Internal-Code": "hermes",
                        "Content-Type": "application/json"
                    },
                    json={
                        "query": scenario["query"],
                        "session_id": scenario["session_id"]
                    },
                    timeout=10
                )
                
                if response.status_code == 200:
                    result = response.json()
                    task_id = result.get("task_id", "unknown")
                    self.print_status(f"✅ Triggered scenario {i} - Task ID: {task_id}", "SUCCESS")
                else:
                    self.print_status(f"❌ Failed scenario {i}: {response.status_code}", "ERROR")
                    
                time.sleep(2)  # Brief pause between scenarios
                
            except Exception as e:
                self.print_status(f"❌ Error triggering scenario {i}: {e}", "ERROR")
    
    async def monitor_autonomous_activity(self):
        """Monitor autonomous manager decisions and activities"""
        self.print_status("🧠 Enhanced Autonomous Manager Monitor Active", "MANAGER")
        self.print_status("Monitoring all workflow decisions and agent orchestration...", "INFO")
        
        try:
            async for message in self.websocket:
                self.messages_received += 1
                await self.process_message(message)
                
        except websockets.exceptions.ConnectionClosed:
            self.print_status("WebSocket connection closed", "WARNING")
        except Exception as e:
            self.print_status(f"Monitor error: {e}", "ERROR")
    
    def print_summary(self):
        """Print a summary of monitored activities"""
        print("\n" + "="*70)
        self.print_status("📊 MONITORING SESSION SUMMARY", "MANAGER")
        print("="*70)
        
        self.print_status(f"Total messages processed: {self.messages_received}", "INFO")
        self.print_status(f"Agent activities tracked: {len(self.agent_activities)}", "INFO")
        self.print_status(f"Manager decisions observed: {len(self.decision_points)}", "INFO")
        self.print_status(f"Workflow steps monitored: {len(self.workflow_steps)}", "INFO")
        
        if self.agent_activities:
            print("\n🤖 Recent Agent Activities:")
            for activity in self.agent_activities[-5:]:  # Last 5 activities
                print(f"   {activity['timestamp'][:19]} | {activity['agent']} | {activity['status']} | {activity['summary'][:60]}")
        
        if self.decision_points:
            print("\n🎯 Manager Decisions:")
            for decision in self.decision_points[-3:]:  # Last 3 decisions
                print(f"   {decision['timestamp'][:19]} | {decision['decision']} | Confidence: {decision['confidence']}")
    
    async def run_enhanced_monitor(self):
        """Main enhanced monitoring loop"""
        connected = await self.connect_to_websocket()
        if not connected:
            self.print_status("Cannot monitor without WebSocket connection", "ERROR")
            return
        
        print("\n" + "="*70)
        self.print_status("🧠 ENHANCED AUTONOMOUS MANAGER MONITOR ACTIVE", "MANAGER")
        self.print_status("Real-time workflow intelligence and decision monitoring", "INFO")
        print("="*70 + "\n")
        
        # Start monitoring in background
        monitor_task = asyncio.create_task(self.monitor_autonomous_activity())
        
        # Wait a moment for connection to stabilize
        await asyncio.sleep(2)
        
        # Trigger test scenarios to generate activity
        self.trigger_test_scenario()
        
        # Continue monitoring
        try:
            await monitor_task
        except KeyboardInterrupt:
            self.print_status("Enhanced monitor stopped by user", "WARNING")
        finally:
            if self.websocket:
                await self.websocket.close()
            self.print_summary()

async def main():
    """Main function"""
    print("🚀 Starting Enhanced Autonomous Manager Monitor")
    print("Shows real-time decisions, agent orchestration, and workflow intelligence")
    print("Press Ctrl+C to stop monitoring")
    
    monitor = EnhancedAutonomousMonitor()
    await monitor.run_enhanced_monitor()

if __name__ == "__main__":
    asyncio.run(main()) 