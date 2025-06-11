#!/bin/bash
# Frontend Service Manager
# Graceful startup and shutdown for PIP AI Next.js frontend

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_HOST="localhost"
FRONTEND_PORT="3000"
PID_FILE="$FRONTEND_DIR/frontend.pid"
LOG_FILE="$FRONTEND_DIR/frontend.log"
FRONTEND_URL="http://localhost:$FRONTEND_PORT"

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_dependencies() {
    log_info "Checking dependencies..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js not found"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm not found"
        exit 1
    fi
    
    # Check if we're in frontend directory
    if [[ ! -f "package.json" ]]; then
        log_error "Not in frontend directory or package.json not found"
        exit 1
    fi
    
    # Check if node_modules exists
    if [[ ! -d "node_modules" ]]; then
        log_warning "node_modules not found, installing dependencies..."
        npm install
    fi
    
    log_success "Dependencies check passed"
}

kill_existing_processes() {
    log_info "Checking for existing processes on port $FRONTEND_PORT..."
    
    # Find processes using the port
    PIDS=$(lsof -ti:$FRONTEND_PORT 2>/dev/null || true)
    
    if [[ -n "$PIDS" ]]; then
        log_info "Found existing processes: $PIDS"
        for PID in $PIDS; do
            log_info "Killing process $PID..."
            kill -TERM $PID 2>/dev/null || true
            sleep 2
            
            # Force kill if still running
            if kill -0 $PID 2>/dev/null; then
                log_warning "Force killing process $PID..."
                kill -KILL $PID 2>/dev/null || true
            fi
        done
        log_success "Cleaned up existing processes"
    else
        log_info "No existing processes found"
    fi
    
    # Remove old PID file
    [[ -f "$PID_FILE" ]] && rm -f "$PID_FILE"
}

start_frontend() {
    log_info "Starting Next.js frontend server..."
    
    # Change to frontend directory
    cd "$FRONTEND_DIR"
    
    # Kill existing processes
    kill_existing_processes
    
    # Start server in background
    nohup npm run dev > "$LOG_FILE" 2>&1 &
    
    # Store PID
    local server_pid=$!
    echo $server_pid > "$PID_FILE"
    
    log_success "Frontend server started with PID: $server_pid"
    
    # Give the server a moment to start
    sleep 2
}

wait_for_health() {
    log_info "Waiting for frontend to become available..."
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -s "$FRONTEND_URL" >/dev/null 2>&1; then
            log_success "Frontend health check passed!"
            return 0
        fi
        
        log_info "Attempt $attempt/$max_attempts - waiting for frontend..."
        sleep 2
        ((attempt++))
    done
    
    log_error "Frontend failed to become available within $(($max_attempts * 2)) seconds"
    return 1
}

test_pages() {
    log_info "Testing frontend pages..."
    
    local pages=(
        "$FRONTEND_URL"
        "$FRONTEND_URL/api/health"
    )
    
    local success_count=0
    
    for page in "${pages[@]}"; do
        if curl -s "$page" >/dev/null 2>&1; then
            log_success "✓ $page"
            ((success_count++))
        else
            log_warning "✗ $page"
        fi
    done
    
    log_info "Frontend pages test: $success_count/${#pages[@]} passed"
    
    if [[ $success_count -ge 1 ]]; then
        return 0
    else
        return 1
    fi
}

stop_frontend() {
    log_info "Stopping frontend server..."
    
    if [[ -f "$PID_FILE" ]]; then
        local PID=$(cat "$PID_FILE")
        
        if kill -0 "$PID" 2>/dev/null; then
            log_info "Sending SIGTERM to process $PID..."
            kill -TERM "$PID"
            
            # Wait for graceful shutdown
            local count=0
            while kill -0 "$PID" 2>/dev/null && [[ $count -lt 15 ]]; do
                sleep 1
                ((count++))
            done
            
            # Force kill if still running
            if kill -0 "$PID" 2>/dev/null; then
                log_warning "Graceful shutdown timeout, force killing..."
                kill -KILL "$PID" 2>/dev/null || true
            fi
            
            log_success "Frontend server stopped"
        else
            log_info "Process not running"
        fi
        
        rm -f "$PID_FILE"
    else
        log_info "No PID file found, killing by port..."
        kill_existing_processes
    fi
}

status_frontend() {
    if [[ -f "$PID_FILE" ]]; then
        local PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            log_success "Frontend is running (PID: $PID)"
            
            # Test health
            if curl -s "$FRONTEND_URL" >/dev/null 2>&1; then
                log_success "Health check: PASSING"
            else
                log_warning "Health check: FAILING"
            fi
            
            return 0
        else
            log_warning "PID file exists but process not running"
            rm -f "$PID_FILE"
        fi
    fi
    
    log_info "Frontend is not running"
    return 1
}

show_logs() {
    if [[ -f "$LOG_FILE" ]]; then
        tail -f "$LOG_FILE"
    else
        log_error "Log file not found: $LOG_FILE"
        exit 1
    fi
}

# Signal handlers
cleanup() {
    log_info "Received interrupt signal, stopping frontend..."
    stop_frontend
    exit 0
}

trap cleanup SIGINT SIGTERM

# Main execution
case "${1:-start}" in
    start)
        log_info "🚀 Starting PIP AI Frontend Service"
        check_dependencies
        start_frontend
        
        if wait_for_health; then
            test_pages
            log_success "🎉 Frontend service is ready!"
            log_info "🌐 Access the app at: $FRONTEND_URL"
            log_info "📝 Logs: tail -f $LOG_FILE"
            log_info "🛑 Stop with: $0 stop"
        else
            log_error "Frontend service failed to start properly"
            stop_frontend
            exit 1
        fi
        ;;
    
    stop)
        log_info "🛑 Stopping PIP AI Frontend Service"
        stop_frontend
        ;;
    
    restart)
        log_info "🔄 Restarting PIP AI Frontend Service"
        stop_frontend
        sleep 2
        $0 start
        ;;
    
    status)
        status_frontend
        ;;
    
    logs)
        show_logs
        ;;
    
    test)
        log_info "🧪 Testing frontend service..."
        if status_frontend && test_pages; then
            log_success "All tests passed!"
        else
            log_error "Tests failed"
            exit 1
        fi
        ;;
    
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|test}"
        echo ""
        echo "Commands:"
        echo "  start   - Start the frontend service"
        echo "  stop    - Stop the frontend service"
        echo "  restart - Restart the frontend service"
        echo "  status  - Check service status"
        echo "  logs    - Show live logs"
        echo "  test    - Run service tests"
        exit 1
        ;;
esac 