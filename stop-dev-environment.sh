#!/bin/bash

# Stop Ultimate PIP AI Development Environment
# Gracefully stops all services

echo "🛑 Stopping PIP AI Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Function to stop service by PID file
stop_service() {
    local service_name=$1
    local pid_file="logs/${service_name}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid"
            rm "$pid_file"
            print_success "$service_name stopped (PID: $pid)"
        else
            print_status "$service_name was not running"
            rm "$pid_file" 2>/dev/null
        fi
    else
        print_status "No PID file found for $service_name"
    fi
}

# Stop all services
print_status "Stopping development services..."

stop_service "mcp-server"
stop_service "backend"
stop_service "frontend" 
stop_service "github-monitor"

# Kill any remaining processes on development ports
print_status "Cleaning up any remaining processes..."

# Kill processes on common development ports
for port in 3000 5173 8000 8080; do
    pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        kill "$pid" 2>/dev/null
        print_success "Stopped process on port $port (PID: $pid)"
    fi
done

# Clean up any Python processes related to the project
pkill -f "uvicorn.*main:app" 2>/dev/null && print_success "Stopped uvicorn processes"
pkill -f "npm run dev" 2>/dev/null && print_success "Stopped npm dev processes"
pkill -f "mcp-server.js" 2>/dev/null && print_success "Stopped MCP server processes"

print_success "All development services stopped"
print_status "Logs preserved in ./logs/ directory"
echo ""
echo "🎯 Environment cleaned up successfully!"
echo "Run ./start-dev-environment.sh to restart"
