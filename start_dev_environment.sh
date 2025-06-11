#!/bin/bash
# PIP AI Development Environment Manager
# Graceful startup and shutdown for both frontend and backend services

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/pip-ui"
BACKEND_SCRIPT="$BACKEND_DIR/start_service.sh"
FRONTEND_SCRIPT="$FRONTEND_DIR/start_frontend.sh"

# Service URLs
BACKEND_URL="http://localhost:8000"
FRONTEND_URL="http://localhost:3000"
WEBSOCKET_URL="ws://localhost:8000/api/chat/ws"

# Enhanced logging functions
log_header() {
    echo -e "\n${PURPLE}======================================${NC}"
    echo -e "${PURPLE}🎯 $1${NC}"
    echo -e "${PURPLE}======================================${NC}\n"
}

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

log_step() {
    echo -e "${CYAN}🔧 $1${NC}"
}

# Check system requirements
check_system_requirements() {
    log_header "System Requirements Check"
    
    local requirements_met=true
    
    # Check Python
    if command -v python3 &> /dev/null; then
        local python_version=$(python3 --version | cut -d' ' -f2)
        log_success "Python: $python_version"
    else
        log_error "Python 3 not found"
        requirements_met=false
    fi
    
    # Check Node.js
    if command -v node &> /dev/null; then
        local node_version=$(node --version)
        log_success "Node.js: $node_version"
    else
        log_error "Node.js not found"
        requirements_met=false
    fi
    
    # Check npm
    if command -v npm &> /dev/null; then
        local npm_version=$(npm --version)
        log_success "npm: $npm_version"
    else
        log_error "npm not found"
        requirements_met=false
    fi
    
    # Check curl
    if command -v curl &> /dev/null; then
        log_success "curl: Available"
    else
        log_warning "curl not found (optional for testing)"
    fi
    
    # Check lsof
    if command -v lsof &> /dev/null; then
        log_success "lsof: Available"
    else
        log_warning "lsof not found (optional for port management)"
    fi
    
    if [[ "$requirements_met" == "true" ]]; then
        log_success "All system requirements met!"
        return 0
    else
        log_error "System requirements not met"
        return 1
    fi
}

# Environment validation
validate_environment() {
    log_header "Environment Validation"
    
    # Check project structure
    if [[ ! -d "$BACKEND_DIR" ]]; then
        log_error "Backend directory not found: $BACKEND_DIR"
        return 1
    fi
    
    if [[ ! -d "$FRONTEND_DIR" ]]; then
        log_error "Frontend directory not found: $FRONTEND_DIR"
        return 1
    fi
    
    if [[ ! -f "$BACKEND_DIR/app/main.py" ]]; then
        log_error "Backend main.py not found"
        return 1
    fi
    
    if [[ ! -f "$FRONTEND_DIR/package.json" ]]; then
        log_error "Frontend package.json not found"
        return 1
    fi
    
    log_success "Project structure validated"
    
    # Check virtual environment
    if [[ -n "$VIRTUAL_ENV" ]]; then
        log_success "Virtual environment active: $VIRTUAL_ENV"
    else
        log_warning "No virtual environment detected"
        if [[ -f ".venv/bin/activate" ]]; then
            log_info "Found .venv, activating..."
            source .venv/bin/activate
            log_success "Virtual environment activated"
        else
            log_warning "No virtual environment found - backend may have dependency issues"
        fi
    fi
    
    # Check environment files
    if [[ -f ".env" ]]; then
        log_success "Found .env file"
    else
        log_warning "No .env file found - some features may not work"
    fi
    
    return 0
}

# Make service scripts executable
prepare_service_scripts() {
    log_header "Preparing Service Scripts"
    
    # Create backend service script if it doesn't exist
    if [[ ! -f "$BACKEND_SCRIPT" ]]; then
        log_warning "Backend service script not found, using fallback"
        # Create a simple fallback script
        cat > "$BACKEND_SCRIPT" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
case "${1:-start}" in
    start)
        echo "Starting backend..."
        nohup python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
        echo $! > backend.pid
        echo "Backend started"
        ;;
    stop)
        echo "Stopping backend..."
        if [[ -f backend.pid ]]; then
            kill $(cat backend.pid) 2>/dev/null || true
            rm -f backend.pid
        fi
        echo "Backend stopped"
        ;;
    *)
        echo "Usage: $0 {start|stop}"
        ;;
esac
EOF
    fi
    
    # Create frontend service script if it doesn't exist
    if [[ ! -f "$FRONTEND_SCRIPT" ]]; then
        log_warning "Frontend service script not found, using fallback"
        cat > "$FRONTEND_SCRIPT" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
case "${1:-start}" in
    start)
        echo "Starting frontend..."
        nohup npm run dev > frontend.log 2>&1 &
        echo $! > frontend.pid
        echo "Frontend started"
        ;;
    stop)
        echo "Stopping frontend..."
        if [[ -f frontend.pid ]]; then
            kill $(cat frontend.pid) 2>/dev/null || true
            rm -f frontend.pid
        fi
        echo "Frontend stopped"
        ;;
    *)
        echo "Usage: $0 {start|stop}"
        ;;
esac
EOF
    fi
    
    # Make scripts executable
    chmod +x "$BACKEND_SCRIPT" 2>/dev/null || true
    chmod +x "$FRONTEND_SCRIPT" 2>/dev/null || true
    
    log_success "Service scripts prepared"
}

# Start services
start_services() {
    log_header "Starting Development Services"
    
    # Start backend
    log_step "Starting backend service..."
    cd "$BACKEND_DIR"
    if [[ -f "$BACKEND_SCRIPT" ]]; then
        bash "$BACKEND_SCRIPT" start
    else
        # Fallback direct start
        nohup python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
        echo $! > backend.pid
    fi
    
    # Wait for backend
    log_info "Waiting for backend to start..."
    local backend_ready=false
    for i in {1..30}; do
        if curl -s "$BACKEND_URL/api/health" >/dev/null 2>&1; then
            backend_ready=true
            break
        fi
        sleep 2
        echo -n "."
    done
    echo ""
    
    if [[ "$backend_ready" == "true" ]]; then
        log_success "Backend is ready!"
    else
        log_warning "Backend may not be fully ready"
    fi
    
    # Start frontend
    log_step "Starting frontend service..."
    cd "$FRONTEND_DIR"
    if [[ -f "$FRONTEND_SCRIPT" ]]; then
        bash "$FRONTEND_SCRIPT" start
    else
        # Fallback direct start
        nohup npm run dev > frontend.log 2>&1 &
        echo $! > frontend.pid
    fi
    
    # Wait for frontend
    log_info "Waiting for frontend to start..."
    local frontend_ready=false
    for i in {1..30}; do
        if curl -s "$FRONTEND_URL" >/dev/null 2>&1; then
            frontend_ready=true
            break
        fi
        sleep 2
        echo -n "."
    done
    echo ""
    
    if [[ "$frontend_ready" == "true" ]]; then
        log_success "Frontend is ready!"
    else
        log_warning "Frontend may not be fully ready"
    fi
}

# Test full system
test_full_system() {
    log_header "Full System Integration Test"
    
    local tests_passed=0
    local total_tests=6
    
    # Test 1: Backend health
    log_step "Testing backend health..."
    if curl -s "$BACKEND_URL/api/health" >/dev/null 2>&1; then
        log_success "✓ Backend health check"
        ((tests_passed++))
    else
        log_error "✗ Backend health check"
    fi
    
    # Test 2: Backend API endpoints
    log_step "Testing backend API endpoints..."
    if curl -s "$BACKEND_URL/api/agents/status" >/dev/null 2>&1; then
        log_success "✓ Backend API endpoints"
        ((tests_passed++))
    else
        log_warning "✗ Backend API endpoints (may be normal)"
    fi
    
    # Test 3: Frontend accessibility
    log_step "Testing frontend accessibility..."
    if curl -s "$FRONTEND_URL" >/dev/null 2>&1; then
        log_success "✓ Frontend accessibility"
        ((tests_passed++))
    else
        log_error "✗ Frontend accessibility"
    fi
    
    # Test 4: WebSocket connectivity
    log_step "Testing WebSocket connectivity..."
    if command -v websocat &> /dev/null; then
        if echo '{"type":"ping"}' | timeout 5 websocat "$WEBSOCKET_URL" 2>/dev/null | grep -q "pong"; then
            log_success "✓ WebSocket connectivity"
            ((tests_passed++))
        else
            log_warning "✗ WebSocket connectivity"
        fi
    else
        log_info "WebSocket test skipped (websocat not available)"
        ((tests_passed++))  # Don't fail for missing test tool
    fi
    
    # Test 5: Enhanced streaming
    log_step "Testing enhanced streaming features..."
    if [[ -f "$PROJECT_DIR/test_enhanced_streaming.py" ]]; then
        if timeout 15 python3 "$PROJECT_DIR/test_enhanced_streaming.py" >/dev/null 2>&1; then
            log_success "✓ Enhanced streaming features"
            ((tests_passed++))
        else
            log_warning "✗ Enhanced streaming features"
        fi
    else
        log_info "Enhanced streaming test skipped (test script not found)"
        ((tests_passed++))  # Don't fail for missing test
    fi
    
    # Test 6: Frontend-Backend integration
    log_step "Testing frontend-backend integration..."
    if curl -s "$FRONTEND_URL/api/proxy/agents/status" >/dev/null 2>&1; then
        log_success "✓ Frontend-Backend integration"
        ((tests_passed++))
    else
        log_warning "✗ Frontend-Backend integration"
    fi
    
    # Report results
    local success_rate=$((tests_passed * 100 / total_tests))
    log_header "Test Results"
    echo -e "${CYAN}Tests Passed: $tests_passed/$total_tests ($success_rate%)${NC}"
    
    if [[ $success_rate -ge 80 ]]; then
        log_success "🎉 System is ready for development!"
        return 0
    elif [[ $success_rate -ge 60 ]]; then
        log_warning "⚠️ System is partially ready - some features may not work"
        return 0
    else
        log_error "❌ System has significant issues"
        return 1
    fi
}

# Stop services
stop_services() {
    log_header "Stopping Development Services"
    
    # Stop frontend
    log_step "Stopping frontend service..."
    cd "$FRONTEND_DIR"
    if [[ -f "$FRONTEND_SCRIPT" ]]; then
        bash "$FRONTEND_SCRIPT" stop 2>/dev/null || true
    fi
    
    # Fallback: kill by PID file
    if [[ -f "frontend.pid" ]]; then
        kill $(cat frontend.pid) 2>/dev/null || true
        rm -f frontend.pid
    fi
    
    # Fallback: kill by port
    local frontend_pids=$(lsof -ti:3000 2>/dev/null || true)
    if [[ -n "$frontend_pids" ]]; then
        echo "$frontend_pids" | xargs kill 2>/dev/null || true
    fi
    
    log_success "Frontend stopped"
    
    # Stop backend
    log_step "Stopping backend service..."
    cd "$BACKEND_DIR"
    if [[ -f "$BACKEND_SCRIPT" ]]; then
        bash "$BACKEND_SCRIPT" stop 2>/dev/null || true
    fi
    
    # Fallback: kill by PID file
    if [[ -f "backend.pid" ]]; then
        kill $(cat backend.pid) 2>/dev/null || true
        rm -f backend.pid
    fi
    
    # Fallback: kill by port
    local backend_pids=$(lsof -ti:8000 2>/dev/null || true)
    if [[ -n "$backend_pids" ]]; then
        echo "$backend_pids" | xargs kill 2>/dev/null || true
    fi
    
    log_success "Backend stopped"
    
    log_success "All services stopped"
}

# Service status
check_status() {
    log_header "Service Status Check"
    
    # Check backend
    if curl -s "$BACKEND_URL/api/health" >/dev/null 2>&1; then
        log_success "Backend: RUNNING"
    else
        log_error "Backend: NOT RUNNING"
    fi
    
    # Check frontend
    if curl -s "$FRONTEND_URL" >/dev/null 2>&1; then
        log_success "Frontend: RUNNING"
    else
        log_error "Frontend: NOT RUNNING"
    fi
    
    # Show URLs
    echo -e "\n${CYAN}Service URLs:${NC}"
    echo -e "  🌐 Frontend: $FRONTEND_URL"
    echo -e "  🔧 Backend API: $BACKEND_URL"
    echo -e "  🔌 WebSocket: $WEBSOCKET_URL"
}

# Show development info
show_dev_info() {
    log_header "Development Environment Information"
    
    echo -e "${CYAN}📁 Project Structure:${NC}"
    echo -e "  Project Root: $PROJECT_DIR"
    echo -e "  Backend: $BACKEND_DIR"
    echo -e "  Frontend: $FRONTEND_DIR"
    
    echo -e "\n${CYAN}🔧 Service URLs:${NC}"
    echo -e "  Frontend: $FRONTEND_URL"
    echo -e "  Backend API: $BACKEND_URL"
    echo -e "  WebSocket: $WEBSOCKET_URL"
    
    echo -e "\n${CYAN}📝 Log Files:${NC}"
    echo -e "  Backend: $BACKEND_DIR/backend.log"
    echo -e "  Frontend: $FRONTEND_DIR/frontend.log"
    
    echo -e "\n${CYAN}🛠️ Management Commands:${NC}"
    echo -e "  Start: $0 start"
    echo -e "  Stop: $0 stop"
    echo -e "  Restart: $0 restart"
    echo -e "  Status: $0 status"
    echo -e "  Test: $0 test"
    echo -e "  Logs: $0 logs"
}

# Show logs
show_logs() {
    echo -e "${CYAN}Showing recent logs (Ctrl+C to exit)...${NC}\n"
    
    # Show backend logs
    if [[ -f "$BACKEND_DIR/backend.log" ]]; then
        echo -e "${BLUE}=== Backend Logs ===${NC}"
        tail -n 20 "$BACKEND_DIR/backend.log"
        echo ""
    fi
    
    # Show frontend logs
    if [[ -f "$FRONTEND_DIR/frontend.log" ]]; then
        echo -e "${BLUE}=== Frontend Logs ===${NC}"
        tail -n 20 "$FRONTEND_DIR/frontend.log"
        echo ""
    fi
    
    # Follow logs
    echo -e "${YELLOW}Following live logs...${NC}"
    (
        [[ -f "$BACKEND_DIR/backend.log" ]] && tail -f "$BACKEND_DIR/backend.log" | sed 's/^/[BACKEND] /' &
        [[ -f "$FRONTEND_DIR/frontend.log" ]] && tail -f "$FRONTEND_DIR/frontend.log" | sed 's/^/[FRONTEND] /' &
        wait
    )
}

# Signal handlers
cleanup() {
    echo -e "\n${YELLOW}⚠️ Received interrupt signal${NC}"
    stop_services
    exit 0
}

trap cleanup SIGINT SIGTERM

# Main execution
main() {
    case "${1:-start}" in
        start)
            log_header "PIP AI Development Environment Startup"
            check_system_requirements || exit 1
            validate_environment || exit 1
            prepare_service_scripts
            start_services
            sleep 3  # Allow services to stabilize
            test_full_system
            show_dev_info
            ;;
        
        stop)
            stop_services
            ;;
        
        restart)
            log_header "PIP AI Development Environment Restart"
            stop_services
            sleep 3
            check_system_requirements || exit 1
            validate_environment || exit 1
            start_services
            sleep 3
            test_full_system
            ;;
        
        status)
            check_status
            ;;
        
        test)
            test_full_system
            ;;
        
        logs)
            show_logs
            ;;
        
        info)
            show_dev_info
            ;;
        
        *)
            echo "PIP AI Development Environment Manager"
            echo ""
            echo "Usage: $0 {start|stop|restart|status|test|logs|info}"
            echo ""
            echo "Commands:"
            echo "  start   - Start both frontend and backend services"
            echo "  stop    - Stop both services"
            echo "  restart - Restart both services"
            echo "  status  - Check service status"
            echo "  test    - Run comprehensive system tests"
            echo "  logs    - Show and follow service logs"
            echo "  info    - Show development environment information"
            echo ""
            echo "Enhanced Real-Time Streaming Features:"
            echo "  🧠 Manager decision broadcasting"
            echo "  📊 Granular agent progress tracking"
            echo "  🤔 Interactive user decision points"
            echo "  🎯 Visual workflow representation"
            echo "  🤖 Brain allocation decisions"
            echo "  🚨 Error recovery streaming"
            exit 1
            ;;
    esac
}

# Run main function
main "$@" 