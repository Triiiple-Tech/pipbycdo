#!/bin/bash

# PIP AI Development Automation Script
# Enhanced GitHub Copilot development environment automation

set -e

# Configuration
PROJECT_NAME="PIP AI"
COPILOT_DIR=".copilot"
MCP_SERVER_PORT=3001
LOG_FILE="/tmp/pip-ai-dev-automation.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "$LOG_FILE"
}

# Print colored output
print_status() {
    local color="$1"
    local message="$2"
    echo -e "${color}${message}${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_status "$BLUE" "🔍 Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_status "$RED" "❌ Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_status "$RED" "❌ npm is not installed. Please install npm first."
        exit 1
    fi
    
    # Check git
    if ! command -v git &> /dev/null; then
        print_status "$RED" "❌ Git is not installed. Please install Git first."
        exit 1
    fi
    
    # Check VS Code (optional)
    if command -v code &> /dev/null; then
        print_status "$GREEN" "✅ VS Code detected"
    else
        print_status "$YELLOW" "⚠️  VS Code CLI not detected (optional)"
    fi
    
    print_status "$GREEN" "✅ Prerequisites check completed"
}

# Install MCP server dependencies
install_mcp_dependencies() {
    print_status "$BLUE" "📦 Installing MCP server dependencies..."
    
    cd "$COPILOT_DIR"
    
    if [ ! -f "package.json" ]; then
        print_status "$RED" "❌ package.json not found in $COPILOT_DIR"
        exit 1
    fi
    
    npm install
    print_status "$GREEN" "✅ MCP server dependencies installed"
    cd ..
}

# Start MCP server
start_mcp_server() {
    print_status "$BLUE" "🚀 Starting MCP server..."
    
    # Check if server is already running
    if lsof -i :$MCP_SERVER_PORT &> /dev/null; then
        print_status "$YELLOW" "⚠️  MCP server already running on port $MCP_SERVER_PORT"
        return 0
    fi
    
    cd "$COPILOT_DIR"
    
    # Start server in background
    nohup npm start > "/tmp/mcp-server.log" 2>&1 &
    local server_pid=$!
    
    # Save PID for later cleanup
    echo "$server_pid" > "/tmp/mcp-server.pid"
    
    # Wait a moment and check if server started
    sleep 2
    if kill -0 "$server_pid" 2>/dev/null; then
        print_status "$GREEN" "✅ MCP server started (PID: $server_pid)"
    else
        print_status "$RED" "❌ Failed to start MCP server"
        cat "/tmp/mcp-server.log"
        exit 1
    fi
    
    cd ..
}

# Stop MCP server
stop_mcp_server() {
    print_status "$BLUE" "🛑 Stopping MCP server..."
    
    if [ -f "/tmp/mcp-server.pid" ]; then
        local server_pid=$(cat "/tmp/mcp-server.pid")
        if kill -0 "$server_pid" 2>/dev/null; then
            kill "$server_pid"
            rm "/tmp/mcp-server.pid"
            print_status "$GREEN" "✅ MCP server stopped"
        else
            print_status "$YELLOW" "⚠️  MCP server not running"
        fi
    else
        print_status "$YELLOW" "⚠️  MCP server PID file not found"
    fi
}

# Test MCP server
test_mcp_server() {
    print_status "$BLUE" "🧪 Testing MCP server..."
    
    # Simple health check
    if lsof -i :$MCP_SERVER_PORT &> /dev/null; then
        print_status "$GREEN" "✅ MCP server is responsive on port $MCP_SERVER_PORT"
    else
        print_status "$RED" "❌ MCP server not responding on port $MCP_SERVER_PORT"
        return 1
    fi
}

# Validate VS Code settings
validate_vscode_settings() {
    print_status "$BLUE" "⚙️  Validating VS Code settings..."
    
    local settings_file=".vscode/settings.json"
    
    if [ ! -f "$settings_file" ]; then
        print_status "$RED" "❌ VS Code settings file not found: $settings_file"
        return 1
    fi
    
    # Check for key Copilot settings
    local required_settings=(
        "github.copilot.enable"
        "github.copilot.chat.experimental.codeGeneration.instructions"
        "editor.inlineSuggest.enabled"
    )
    
    for setting in "${required_settings[@]}"; do
        if grep -q "$setting" "$settings_file"; then
            print_status "$GREEN" "✅ Found setting: $setting"
        else
            print_status "$YELLOW" "⚠️  Missing setting: $setting"
        fi
    done
}

# Check GitHub Copilot extensions
check_copilot_extensions() {
    print_status "$BLUE" "🔌 Checking GitHub Copilot extensions..."
    
    local required_extensions=(
        "github.copilot"
        "github.copilot-chat"
        "github.vscode-pull-request-github"
    )
    
    for extension in "${required_extensions[@]}"; do
        if command -v code &> /dev/null && code --list-extensions | grep -q "$extension"; then
            print_status "$GREEN" "✅ Extension installed: $extension"
        else
            print_status "$YELLOW" "⚠️  Extension not detected: $extension"
        fi
    done
}

# Generate development report
generate_report() {
    print_status "$BLUE" "📊 Generating development environment report..."
    
    local report_file="copilot-environment-report.md"
    
    cat > "$report_file" << EOF
# PIP AI GitHub Copilot Environment Report

Generated on: $(date)

## Environment Status

### Prerequisites
- Node.js: $(node --version 2>/dev/null || echo "Not installed")
- npm: $(npm --version 2>/dev/null || echo "Not installed")
- Git: $(git --version 2>/dev/null || echo "Not installed")
- VS Code: $(code --version 2>/dev/null | head -1 || echo "Not detected")

### MCP Server
- Status: $(lsof -i :$MCP_SERVER_PORT &> /dev/null && echo "Running" || echo "Stopped")
- Port: $MCP_SERVER_PORT
- Log file: /tmp/mcp-server.log

### Project Structure
\`\`\`
$(find .copilot -type f 2>/dev/null | sort || echo "Copilot directory not found")
\`\`\`

### VS Code Configuration
- Settings file: $([[ -f ".vscode/settings.json" ]] && echo "Present" || echo "Missing")
- Snippets file: $([[ -f ".vscode/snippets.code-snippets" ]] && echo "Present" || echo "Missing")

### Copilot Instructions
- Instructions file: $([[ -f ".copilot-instructions.md" ]] && echo "Present" || echo "Missing")
- File size: $([[ -f ".copilot-instructions.md" ]] && wc -l < ".copilot-instructions.md" || echo "0") lines

## Recommendations

1. **MCP Server Integration**: Ensure the MCP server is running for enhanced context
2. **Extension Check**: Verify all GitHub Copilot extensions are installed
3. **Settings Validation**: Review VS Code settings for optimal Copilot performance
4. **Regular Updates**: Keep extensions and dependencies up to date

## Next Steps

1. Run \`./development-automation.sh setup\` to complete setup
2. Test Copilot functionality with sample code generation
3. Monitor MCP server logs for any issues
4. Review and update Copilot instructions as needed

EOF

    print_status "$GREEN" "✅ Report generated: $report_file"
}

# Setup function
setup() {
    print_status "$GREEN" "🚀 Setting up PIP AI GitHub Copilot environment..."
    
    check_prerequisites
    install_mcp_dependencies
    start_mcp_server
    test_mcp_server
    validate_vscode_settings
    check_copilot_extensions
    generate_report
    
    print_status "$GREEN" "✅ Setup completed successfully!"
    print_status "$BLUE" "📖 Check copilot-environment-report.md for details"
}

# Status function
status() {
    print_status "$BLUE" "📊 Checking environment status..."
    
    test_mcp_server
    validate_vscode_settings
    check_copilot_extensions
    
    print_status "$GREEN" "✅ Status check completed"
}

# Clean function
clean() {
    print_status "$BLUE" "🧹 Cleaning up..."
    
    stop_mcp_server
    
    # Clean up log files
    [ -f "$LOG_FILE" ] && rm "$LOG_FILE"
    [ -f "/tmp/mcp-server.log" ] && rm "/tmp/mcp-server.log"
    
    print_status "$GREEN" "✅ Cleanup completed"
}

# Help function
show_help() {
    cat << EOF
PIP AI Development Automation Script

Usage: $0 <command>

Commands:
  setup     - Complete environment setup
  status    - Check current status
  start     - Start MCP server
  stop      - Stop MCP server
  test      - Test MCP server
  clean     - Clean up resources
  report    - Generate environment report
  help      - Show this help message

Examples:
  $0 setup          # Full setup
  $0 status         # Quick status check
  $0 start          # Start MCP server only
  $0 report         # Generate report only

Log file: $LOG_FILE
EOF
}

# Main execution
main() {
    case "${1:-help}" in
        setup)
            setup
            ;;
        status)
            status
            ;;
        start)
            start_mcp_server
            ;;
        stop)
            stop_mcp_server
            ;;
        test)
            test_mcp_server
            ;;
        clean)
            clean
            ;;
        report)
            generate_report
            ;;
        help|*)
            show_help
            ;;
    esac
}

# Run main function with all arguments
main "$@"
