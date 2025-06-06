#!/bin/bash

# Ultimate PIP AI Development Environment Setup
# This script sets up the perfect environment for GitHub Copilot agents

echo "🚀 Setting up Ultimate PIP AI Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -f "pyproject.toml" ]; then
    print_error "Please run this script from the PIP AI project root directory"
    exit 1
fi

print_status "Starting environment optimization..."

# 1. Start MCP Server in background
print_status "Starting MCP Server for enhanced Copilot context..."
if [ -f ".copilot/mcp-server.js" ]; then
    cd .copilot
    npm start > ../logs/mcp-server.log 2>&1 &
    MCP_PID=$!
    echo $MCP_PID > ../logs/mcp-server.pid
    cd ..
    print_success "MCP Server started (PID: $MCP_PID)"
else
    print_warning "MCP Server not found, skipping..."
fi

# 2. Start backend services
print_status "Starting FastAPI backend..."
if [ -d "backend" ]; then
    cd backend
    if [ -f ".venv/bin/activate" ]; then
        source .venv/bin/activate
        uvicorn src.main:app --reload --host 0.0.0.0 --port 8000 > ../logs/backend.log 2>&1 &
        BACKEND_PID=$!
        echo $BACKEND_PID > ../logs/backend.pid
        cd ..
        print_success "Backend started (PID: $BACKEND_PID)"
    else
        print_warning "Backend virtual environment not found"
        cd ..
    fi
else
    print_warning "Backend directory not found"
fi

# 3. Start frontend development server
print_status "Starting React frontend..."
if [ -d "ui" ]; then
    cd ui
    if [ -f "package.json" ]; then
        npm run dev > ../logs/frontend.log 2>&1 &
        FRONTEND_PID=$!
        echo $FRONTEND_PID > ../logs/frontend.pid
        cd ..
        print_success "Frontend started (PID: $FRONTEND_PID)"
    else
        print_warning "Frontend package.json not found"
        cd ..
    fi
else
    print_warning "UI directory not found"
fi

# 4. Start GitHub issue monitoring
print_status "Starting GitHub issue monitoring..."
if [ -f "enhanced_monitor.sh" ]; then
    chmod +x enhanced_monitor.sh
    ./enhanced_monitor.sh > logs/github-monitor.log 2>&1 &
    MONITOR_PID=$!
    echo $MONITOR_PID > logs/github-monitor.pid
    print_success "GitHub monitoring started (PID: $MONITOR_PID)"
fi

# 5. Create development dashboard
print_status "Creating development dashboard..."
cat > development-dashboard.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PIP AI - Development Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'github': '#24292e',
                        'copilot': '#f78166'
                    }
                }
            }
        }
    </script>
</head>
<body class="bg-gray-50 min-h-screen">
    <div class="container mx-auto p-6">
        <header class="mb-8">
            <h1 class="text-4xl font-bold text-github mb-2">🚀 PIP AI Development Dashboard</h1>
            <p class="text-gray-600">Ultimate GitHub Copilot Development Environment</p>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <!-- Service Status Cards -->
            <div class="bg-white rounded-lg shadow-md p-6">
                <h3 class="text-lg font-semibold mb-4 flex items-center">
                    <span class="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                    Backend API
                </h3>
                <p class="text-gray-600 mb-2">FastAPI Server</p>
                <a href="http://localhost:8000/docs" target="_blank" 
                   class="text-blue-500 hover:underline">View API Docs</a>
            </div>

            <div class="bg-white rounded-lg shadow-md p-6">
                <h3 class="text-lg font-semibold mb-4 flex items-center">
                    <span class="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                    Frontend App
                </h3>
                <p class="text-gray-600 mb-2">React Development Server</p>
                <a href="http://localhost:5173" target="_blank" 
                   class="text-blue-500 hover:underline">Open Application</a>
            </div>

            <div class="bg-white rounded-lg shadow-md p-6">
                <h3 class="text-lg font-semibold mb-4 flex items-center">
                    <span class="w-3 h-3 bg-copilot rounded-full mr-2"></span>
                    MCP Server
                </h3>
                <p class="text-gray-600 mb-2">Enhanced Copilot Context</p>
                <span class="text-green-600 font-medium">Active</span>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <!-- GitHub Issues -->
            <div class="bg-white rounded-lg shadow-md p-6">
                <h3 class="text-lg font-semibold mb-4">📋 GitHub Issues</h3>
                <div id="github-issues" class="space-y-2">
                    <p class="text-gray-500">Loading issues...</p>
                </div>
            </div>

            <!-- Copilot Tips -->
            <div class="bg-white rounded-lg shadow-md p-6">
                <h3 class="text-lg font-semibold mb-4">💡 Copilot Tips</h3>
                <ul class="space-y-2 text-sm">
                    <li>• Use @workspace for project-wide context</li>
                    <li>• Reference .copilot-instructions.md for project patterns</li>
                    <li>• Use /agent command for agent-specific help</li>
                    <li>• File issues are automatically monitored</li>
                    <li>• MCP server provides enhanced context</li>
                </ul>
            </div>
        </div>

        <div class="bg-white rounded-lg shadow-md p-6">
            <h3 class="text-lg font-semibold mb-4">🔗 Quick Links</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <a href="https://github.com/Triiiple-Tech/pipbycdo" target="_blank" 
                   class="text-center p-3 bg-github text-white rounded hover:bg-gray-800">
                    GitHub Repo
                </a>
                <a href="http://localhost:8000/docs" target="_blank" 
                   class="text-center p-3 bg-blue-500 text-white rounded hover:bg-blue-600">
                    API Docs
                </a>
                <a href="http://localhost:5173" target="_blank" 
                   class="text-center p-3 bg-green-500 text-white rounded hover:bg-green-600">
                    Frontend
                </a>
                <a href="vscode://file/Users/thekiiid/pipbycdo" 
                   class="text-center p-3 bg-copilot text-white rounded hover:bg-orange-600">
                    VS Code
                </a>
            </div>
        </div>
    </div>

    <script>
        // Load GitHub issues
        async function loadGitHubIssues() {
            try {
                const response = await fetch('/api/github/issues');
                if (response.ok) {
                    const issues = await response.json();
                    displayIssues(issues);
                } else {
                    document.getElementById('github-issues').innerHTML = 
                        '<p class="text-red-500">Failed to load issues</p>';
                }
            } catch (error) {
                document.getElementById('github-issues').innerHTML = 
                    '<p class="text-red-500">Error loading issues</p>';
            }
        }

        function displayIssues(issues) {
            const container = document.getElementById('github-issues');
            if (issues.length === 0) {
                container.innerHTML = '<p class="text-gray-500">No open issues</p>';
                return;
            }

            container.innerHTML = issues.slice(0, 5).map(issue => `
                <div class="p-2 bg-gray-50 rounded">
                    <div class="flex items-center justify-between">
                        <span class="font-medium text-sm">#${issue.number}</span>
                        <span class="text-xs text-gray-500">${issue.assignee || 'Unassigned'}</span>
                    </div>
                    <p class="text-sm mt-1">${issue.title}</p>
                </div>
            `).join('');
        }

        // Update every 30 seconds
        setInterval(loadGitHubIssues, 30000);
        loadGitHubIssues();
    </script>
</body>
</html>
EOF

print_success "Development dashboard created"

# 6. Create logs directory if it doesn't exist
mkdir -p logs

# 7. Display summary
echo ""
echo "🎉 Ultimate PIP AI Development Environment is ready!"
echo ""
echo "Services running:"
echo "- 🔧 MCP Server: Enhanced Copilot context"
echo "- 🚀 Backend API: http://localhost:8000"
echo "- 🎨 Frontend: http://localhost:5173"
echo "- 📊 API Docs: http://localhost:8000/docs"
echo "- 📋 GitHub Monitor: Active"
echo ""
echo "Dashboard: file://$(pwd)/development-dashboard.html"
echo ""
echo "Logs directory: ./logs/"
echo "PIDs stored in: ./logs/*.pid"
echo ""
echo "To stop all services: ./stop-dev-environment.sh"
echo ""
print_success "Happy coding with GitHub Copilot! 🚀"
