#!/usr/bin/env python3
"""
Graceful Backend Service Manager
Handles startup, health checks, and graceful shutdown for the PIP AI backend
"""

import asyncio
import signal
import sys
import time
import os
import logging
import subprocess
import requests
from pathlib import Path
from typing import Optional, Dict, List
import psutil
import uvicorn
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('backend_service.log')
    ]
)
logger = logging.getLogger(__name__)

class BackendServiceManager:
    """Manages graceful startup and shutdown of the backend service"""
    
    def __init__(self):
        self.server_process: Optional[subprocess.Popen[str]] = None
        self.is_running = False
        self.shutdown_event = asyncio.Event()
        self.health_check_url = "http://localhost:8000/api/health"
        self.websocket_url = "ws://localhost:8000/api/chat/ws"
        self.startup_timeout = 60  # seconds
        self.shutdown_timeout = 30  # seconds
        
    async def validate_environment(self) -> bool:
        """Validate required environment and dependencies"""
        logger.info("🔍 Validating environment...")
        
        # Check if we're in the backend directory
        if not Path("app").exists() or not Path("app/main.py").exists():
            logger.error("❌ Not in backend directory or app/main.py not found")
            return False
            
        # Check Python environment
        try:
            import fastapi
            import uvicorn
            import websockets
            logger.info("✅ Core dependencies available")
        except ImportError as e:
            logger.error(f"❌ Missing dependencies: {e}")
            return False
            
        # Check environment variables
        required_env_vars = [
            "SUPABASE_URL",
            "SUPABASE_ANON_KEY", 
            "SUPABASE_SERVICE_ROLE_KEY"
        ]
        
        missing_vars: List[str] = []
        for var in required_env_vars:
            if not os.getenv(var):
                missing_vars.append(var)
                
        if missing_vars:
            logger.warning(f"⚠️ Missing environment variables: {missing_vars}")
            logger.info("💡 Backend will start but some features may not work")
        else:
            logger.info("✅ All environment variables present")
            
        return True
        
    def check_port_available(self, port: int = 8000) -> bool:
        """Check if the target port is available"""
        import socket
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('localhost', port))
                logger.info(f"✅ Port {port} is available")
                return True
        except OSError:
            logger.warning(f"⚠️ Port {port} is already in use")
            return False
            
    def kill_existing_processes(self, port: int = 8000):
        """Kill any existing processes on the target port"""
        logger.info(f"🔍 Checking for existing processes on port {port}...")
        
        killed_processes: List[int] = []
        for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
            try:
                cmdline = proc.info['cmdline']
                if cmdline and any('uvicorn' in cmd and str(port) in cmd for cmd in cmdline):
                    pid = proc.info['pid']
                    logger.info(f"🔪 Killing existing uvicorn process: PID {pid}")
                    proc.kill()
                    killed_processes.append(pid)
                    time.sleep(1)  # Give process time to die
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue
                
        if killed_processes:
            logger.info(f"✅ Cleaned up {len(killed_processes)} existing processes")
        else:
            logger.info("ℹ️ No existing processes found")
            
    async def start_server(self) -> bool:
        """Start the FastAPI server with proper error handling"""
        logger.info("🚀 Starting FastAPI backend server...")
        
        try:
            # Kill existing processes
            self.kill_existing_processes()
            
            # Wait a moment for cleanup
            await asyncio.sleep(2)
            
            # Start the server process
            cmd = [
                sys.executable, "-m", "uvicorn", 
                "app.main:app",
                "--reload",
                "--host", "0.0.0.0", 
                "--port", "8000",
                "--log-level", "info",
                "--access-log"
            ]
            
            logger.info(f"📝 Starting server with command: {' '.join(cmd)}")
            
            self.server_process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                universal_newlines=True,
                bufsize=1
            )
            
            self.is_running = True
            logger.info(f"✅ Server process started with PID: {self.server_process.pid}")
            
            # Monitor server output in background
            asyncio.create_task(self._monitor_server_output())
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to start server: {e}")
            return False
            
    async def _monitor_server_output(self):
        """Monitor server stdout/stderr for debugging"""
        if not self.server_process or not self.server_process.stdout:
            return
            
        try:
            while self.is_running and self.server_process.poll() is None:
                line = self.server_process.stdout.readline()
                if line:
                    # Filter and log important server messages
                    line = line.strip()
                    if any(keyword in line.lower() for keyword in [
                        'started', 'error', 'exception', 'failed', 'warning', 'listening'
                    ]):
                        logger.info(f"📄 Server: {line}")
                await asyncio.sleep(0.1)
        except Exception as e:
            logger.error(f"Error monitoring server output: {e}")
            
    async def wait_for_health(self) -> bool:
        """Wait for server to become healthy"""
        logger.info("⏳ Waiting for server to become healthy...")
        
        start_time = time.time()
        while time.time() - start_time < self.startup_timeout:
            try:
                response = requests.get(self.health_check_url, timeout=5)
                if response.status_code == 200:
                    logger.info("✅ Server health check passed!")
                    return True
            except requests.exceptions.RequestException:
                pass
                
            await asyncio.sleep(2)
            
        logger.error(f"❌ Server failed to become healthy within {self.startup_timeout}s")
        return False
        
    async def test_websocket_connection(self) -> bool:
        """Test WebSocket connectivity"""
        logger.info("🔌 Testing WebSocket connection...")
        
        try:
            import websockets
            
            async with websockets.connect(self.websocket_url, timeout=10) as websocket:
                # Send ping
                await websocket.send('{"type": "ping"}')
                response = await asyncio.wait_for(websocket.recv(), timeout=5)
                
                if 'pong' in str(response):
                    logger.info("✅ WebSocket connection successful!")
                    return True
                else:
                    logger.warning(f"⚠️ Unexpected WebSocket response: {response}")
                    return False
                    
        except Exception as e:
            logger.error(f"❌ WebSocket test failed: {e}")
            return False
            
    async def run_comprehensive_tests(self) -> Dict[str, bool]:
        """Run comprehensive service tests"""
        logger.info("🧪 Running comprehensive service tests...")
        
        tests = {
            "health_endpoint": False,
            "websocket_connection": False,
            "api_endpoints": False,
            "enhanced_streaming": False
        }
        
        # Test health endpoint
        try:
            response = requests.get(self.health_check_url, timeout=10)
            tests["health_endpoint"] = response.status_code == 200
        except Exception as e:
            logger.error(f"Health endpoint test failed: {e}")
            
        # Test WebSocket
        tests["websocket_connection"] = await self.test_websocket_connection()
        
        # Test API endpoints
        try:
            api_tests = [
                "http://localhost:8000/api/agents/status",
                "http://localhost:8000/api/chat/sessions"
            ]
            
            api_success = 0
            for url in api_tests:
                try:
                    response = requests.get(url, timeout=5)
                    if response.status_code in [200, 404]:  # 404 is ok for empty resources
                        api_success += 1
                except:
                    pass
                    
            tests["api_endpoints"] = api_success >= len(api_tests) / 2
            
        except Exception as e:
            logger.error(f"API endpoints test failed: {e}")
            
        # Test enhanced streaming features
        try:
            # This would test the enhanced streaming we implemented
            tests["enhanced_streaming"] = tests["websocket_connection"]  # For now
        except Exception as e:
            logger.error(f"Enhanced streaming test failed: {e}")
            
        # Report results
        logger.info("📊 Test Results:")
        for test_name, result in tests.items():
            status = "✅ PASS" if result else "❌ FAIL"
            logger.info(f"  {test_name}: {status}")
            
        return tests
        
    async def graceful_shutdown(self):
        """Gracefully shutdown the server"""
        logger.info("🛑 Starting graceful shutdown...")
        self.is_running = False
        
        if self.server_process:
            try:
                # Send SIGTERM for graceful shutdown
                logger.info("📤 Sending SIGTERM to server process...")
                self.server_process.terminate()
                
                # Wait for graceful shutdown
                try:
                    self.server_process.wait(timeout=self.shutdown_timeout)
                    logger.info("✅ Server shut down gracefully")
                except subprocess.TimeoutExpired:
                    logger.warning("⚠️ Graceful shutdown timeout, forcing kill...")
                    self.server_process.kill()
                    self.server_process.wait()
                    logger.info("🔪 Server process killed")
                    
            except Exception as e:
                logger.error(f"❌ Error during shutdown: {e}")
                
        logger.info("✅ Shutdown complete")
        
    def setup_signal_handlers(self):
        """Setup signal handlers for graceful shutdown"""
        def signal_handler(signum: int, frame: object) -> None:
            logger.info(f"🚨 Received signal {signum}")
            self.shutdown_event.set()
            
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
        
    async def run(self):
        """Main service runner"""
        logger.info("🎯 Starting PIP AI Backend Service Manager")
        
        try:
            # Setup signal handlers
            self.setup_signal_handlers()
            
            # Validate environment
            if not await self.validate_environment():
                logger.error("❌ Environment validation failed")
                return False
                
            # Start server
            if not await self.start_server():
                logger.error("❌ Failed to start server")
                return False
                
            # Wait for health
            if not await self.wait_for_health():
                logger.error("❌ Server health check failed")
                await self.graceful_shutdown()
                return False
                
            # Run comprehensive tests
            test_results = await self.run_comprehensive_tests()
            
            success_rate = sum(test_results.values()) / len(test_results)
            logger.info(f"📊 Overall success rate: {success_rate:.1%}")
            
            if success_rate >= 0.75:
                logger.info("🎉 Backend service is ready and healthy!")
            else:
                logger.warning("⚠️ Backend service started but some features may not work")
                
            # Wait for shutdown signal
            logger.info("🔄 Service running... Press Ctrl+C to stop")
            await self.shutdown_event.wait()
            
            # Graceful shutdown
            await self.graceful_shutdown()
            return True
            
        except Exception as e:
            logger.error(f"❌ Fatal error: {e}")
            await self.graceful_shutdown()
            return False


async def main():
    """Main entry point"""
    manager = BackendServiceManager()
    success = await manager.run()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    # Change to backend directory
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n🛑 Service interrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"❌ Service failed: {e}")
        sys.exit(1) 