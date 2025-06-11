#!/bin/bash
# Simple Backend Service Manager
# Graceful startup and shutdown for PIP AI backend

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_HOST="0.0.0.0"
BACKEND_PORT="8000"
PID_FILE="$BACKEND_DIR/backend.pid"
LOG_FILE="$BACKEND_DIR/backend.log"
HEALTH_URL="http://localhost:$BACKEND_PORT/api/health"

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
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        log_error "Python3 not found"
        exit 1
    fi
    
    # Check if we're in backend directory
    if [[ ! -f "app/main.py" ]]; then
        log_error "Not in backend directory or app/main.py not found"
        exit 1
    fi
    
    # Check virtual environment
    if [[ -z "$VIRTUAL_ENV" ]]; then
        log_warning "No virtual environment detected"
        log_info "Attempting to activate virtual environment..."
        if [[ -f "../.venv/bin/activate" ]]; then
            source "../.venv/bin/activate"
            log_success "Virtual environment activated"
        fi
    fi
    
    # Check dependencies
    python3 -c "import fastapi, uvicorn, websockets" 2>/dev/null || {
        log_error "Missing Python dependencies. Run: pip install -r requirements.txt"
        exit 1
    }
    
    log_success "Dependencies check passed"
}

kill_existing_processes() {
    log_info "Checking for existing processes on port $BACKEND_PORT..."
    
    # Find processes using the port
    PIDS=$(lsof -ti:$BACKEND_PORT 2>/dev/null || true)
    
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

start_backend() {
    log_info "Starting FastAPI backend server..."
    
    # Change to backend directory
    cd "$BACKEND_DIR"
    
    # Kill existing processes
    kill_existing_processes
    
    # Start server in background
    nohup python3 -m uvicorn app.main:app \
        --reload \
        --host "$BACKEND_HOST" \
        --port "$BACKEND_PORT" \
        --log-level info \
        --access-log \
        > "$LOG_FILE" 2>&1 &
    
    # Store PID
    echo $! > "$PID_FILE"
    
    log_success "Backend server started with PID: $(cat $PID_FILE)"
}

wait_for_health() {
    log_info "Waiting for server to become healthy..."
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -s "$HEALTH_URL" >/dev/null 2>&1; then
            log_success "Server health check passed!"
            return 0
        fi
        
        log_info "Attempt $attempt/$max_attempts - waiting for server..."
        sleep 2
        ((attempt++))
    done
    
    log_error "Server failed to become healthy within $(($max_attempts * 2)) seconds"
    return 1
}

test_endpoints() {
    log_info "Testing API endpoints..."
    
    local endpoints=(
        "$HEALTH_URL"
        "http://localhost:$BACKEND_PORT/api/agents/status"
        "http://localhost:$BACKEND_PORT/api/chat/sessions"
    )
    
    local success_count=0
    
    for endpoint in "${endpoints[@]}"; do
        if curl -s "$endpoint" >/dev/null 2>&1; then
            log_success "✓ $endpoint"
            ((success_count++))
        else
            log_warning "✗ $endpoint"
        fi
    done
    
    log_info "API endpoints test: $success_count/${#endpoints[@]} passed"
    
    if [[ $success_count -ge 2 ]]; then
        return 0
    else
        return 1
    fi
}

test_websocket() {
    log_info "Testing WebSocket connection..."
    
    # Use our test script if available
    if [[ -f "../test_enhanced_streaming.py" ]]; then
        timeout 10 python3 ../test_enhanced_streaming.py --quick-test 2>/dev/null && {
            log_success "WebSocket test passed"
            return 0
        }
    fi
    
    # Simple WebSocket test using curl
    if command -v websocat &> /dev/null; then
        echo '{"type":"ping"}' | timeout 5 websocat "ws://localhost:$BACKEND_PORT/api/chat/ws" 2>/dev/null | grep -q "pong" && {
            log_success "WebSocket test passed"
            return 0
        }
    fi
    
    log_warning "WebSocket test skipped (no test tools available)"
    return 0
}

stop_backend() {
    log_info "Stopping backend server..."
    
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
            
            log_success "Backend server stopped"
        else
            log_info "Process not running"
        fi
        
        rm -f "$PID_FILE"
    else
        log_info "No PID file found, killing by port..."
        kill_existing_processes
    fi
}

status_backend() {
    if [[ -f "$PID_FILE" ]]; then
        local PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            log_success "Backend is running (PID: $PID)"
            
            # Test health
            if curl -s "$HEALTH_URL" >/dev/null 2>&1; then
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
    
    log_info "Backend is not running"
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
    log_info "Received interrupt signal, stopping backend..."
    stop_backend
    exit 0
}

trap cleanup SIGINT SIGTERM

# Main execution
case "${1:-start}" in
    start)
        log_info "🚀 Starting PIP AI Backend Service"
        check_dependencies
        start_backend
        
        if wait_for_health; then
            test_endpoints
            test_websocket
            log_success "🎉 Backend service is ready!"
            log_info "📊 Access the API at: http://localhost:$BACKEND_PORT"
            log_info "🔌 WebSocket endpoint: ws://localhost:$BACKEND_PORT/api/chat/ws"
            log_info "📝 Logs: tail -f $LOG_FILE"
            log_info "🛑 Stop with: $0 stop"
        else
            log_error "Backend service failed to start properly"
            stop_backend
            exit 1
        fi
        ;;
    
    stop)
        log_info "🛑 Stopping PIP AI Backend Service"
        stop_backend
        ;;
    
    restart)
        log_info "🔄 Restarting PIP AI Backend Service"
        stop_backend
        sleep 2
        $0 start
        ;;
    
    status)
        status_backend
        ;;
    
    logs)
        show_logs
        ;;
    
    test)
        log_info "🧪 Testing backend service..."
        if status_backend && test_endpoints; then
            test_websocket
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
        echo "  start   - Start the backend service"
        echo "  stop    - Stop the backend service"
        echo "  restart - Restart the backend service"
        echo "  status  - Check service status"
        echo "  logs    - Show live logs"
        echo "  test    - Run service tests"
        exit 1
        ;;
esac 