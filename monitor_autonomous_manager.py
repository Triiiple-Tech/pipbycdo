#!/usr/bin/env python3

"""
🔍 Real-Time Autonomous Manager Monitor
Shows exactly what the manager is thinking and doing
"""

import asyncio
import websockets
import json
import sys
from datetime import datetime

class AutonomousManagerMonitor:
    def __init__(self):
        self.websocket = None
        self.messages_received = 0
        
    def print_status(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        colors = {
            "INFO": "\033[34m",      # Blue
            "SUCCESS": "\033[32m",   # Green  
            "WARNING": "\033[33m",   # Yellow
            "ERROR": "\033[31m",     # Red
            "MANAGER": "\033[35m"    # Magenta
        }
        reset = "\033[0m"
        color = colors.get(level, "\033[0m")
        print(f"{color}[{timestamp} {level}]{reset} {message}")
    
    async def connect_to_websocket(self):
        """Connect to the backend WebSocket for real-time updates"""
        try:
            self.websocket = await websockets.connect("ws://localhost:8000/api/chat/ws")
            self.print_status("Connected to PIP AI WebSocket", "SUCCESS")
            return True
        except Exception as e:
            self.print_status(f"Failed to connect to WebSocket: {e}", "ERROR")
            return False
    
    async def monitor_manager_activity(self):
        """Monitor autonomous manager decisions and activities"""
        self.print_status("🧠 Starting Autonomous Manager Monitor...", "MANAGER")
        self.print_status("Waiting for manager activity...", "INFO")
        
        try:
            async for message in self.websocket:
                self.messages_received += 1
                await self.process_message(message)
                
        except websockets.exceptions.ConnectionClosed:
            self.print_status("WebSocket connection closed", "WARNING")
        except Exception as e:
            self.print_status(f"Monitor error: {e}", "ERROR")
    
    async def process_message(self, raw_message):
        """Process and display manager messages"""
        try:
            message = json.loads(raw_message)
            msg_type = message.get('type', 'unknown')
            data = message.get('data', {})
            
            if 'agent_processing' in msg_type:
                await self.handle_agent_message(msg_type, data)
            elif 'manager' in msg_type.lower():
                await self.handle_manager_message(msg_type, data)
            else:
                self.print_status(f"Received: {msg_type}", "INFO")
                
        except json.JSONDecodeError:
            self.print_status(f"Raw message: {raw_message[:100]}...", "INFO")
    
    async def handle_agent_message(self, msg_type, data):
        """Handle agent processing messages"""
        agent_name = data.get('agent_name', 'unknown')
        status = data.get('status', 'unknown') 
        step_num = data.get('step_number', '?')
        total_steps = data.get('total_steps', '?')
        result = data.get('result_summary', '')
        
        if 'start' in msg_type:
            self.print_status(f"🚀 {agent_name.title()}Agent starting... [{step_num}/{total_steps}]", "INFO")
        elif 'complete' in msg_type:
            self.print_status(f"✅ {agent_name.title()}Agent complete: {result} [{step_num}/{total_steps}]", "SUCCESS")
        elif 'error' in msg_type:
            self.print_status(f"❌ {agent_name.title()}Agent error: {result}", "ERROR")
    
    async def handle_manager_message(self, msg_type, data):
        """Handle autonomous manager decision messages"""
        if 'analysis' in msg_type.lower():
            situation = data.get('situation', 'Unknown situation')
            self.print_status(f"🔍 Manager Analysis: {situation}", "MANAGER")
        elif 'decision' in msg_type.lower():
            decision = data.get('decision', 'Unknown decision')
            reason = data.get('reason', '')
            self.print_status(f"🎯 Manager Decision: {decision} - {reason}", "MANAGER")
        elif 'execution' in msg_type.lower():
            action = data.get('action', 'Unknown action')
            self.print_status(f"⚡ Manager Executing: {action}", "MANAGER")
        elif 'completion' in msg_type.lower():
            status = data.get('status', 'Unknown')
            self.print_status(f"📊 Manager Assessment: {status}", "MANAGER")
    
    async def run_monitor(self):
        """Main monitoring loop"""
        connected = await self.connect_to_websocket()
        if not connected:
            self.print_status("Cannot monitor without WebSocket connection", "ERROR")
            return
        
        print("\n" + "="*70)
        self.print_status("🧠 AUTONOMOUS MANAGER MONITOR ACTIVE", "MANAGER")
        self.print_status("Watching for intelligent workflow decisions...", "INFO")
        print("="*70 + "\n")
        
        try:
            await self.monitor_manager_activity()
        except KeyboardInterrupt:
            self.print_status("Monitor stopped by user", "WARNING")
        finally:
            if self.websocket:
                await self.websocket.close()
            self.print_status(f"Monitor session complete. Processed {self.messages_received} messages.", "INFO")

async def main():
    """Start the autonomous manager monitor"""
    monitor = AutonomousManagerMonitor()
    await monitor.run_monitor()

if __name__ == "__main__":
    print("🔍 Real-Time Autonomous Manager Monitor")
    print("This shows what the manager is thinking and doing in real-time")
    print("Press Ctrl+C to stop monitoring\n")
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n�� Monitor stopped.") 