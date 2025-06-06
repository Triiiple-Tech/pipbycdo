#!/bin/bash
echo "🎯 Starting PIP AI Demo Environment..."

# Kill any existing processes
pkill -f uvicorn
pkill -f "npm run dev"
pkill -f mcp-server

# Start Backend
echo "📡 Starting Backend..."
cd /Users/thekiiid/pipbycdo/backend
nohup ./start_backend.sh > backend.log 2>&1 &
sleep 5

# Start Frontend
echo "🎨 Starting Frontend..."
cd /Users/thekiiid/pipbycdo/ui
nohup npm run dev > frontend.log 2>&1 &
sleep 3

# Test services
echo ""
echo "🧪 Testing services..."
curl -s http://localhost:8000/health && echo " ✅ Backend is healthy"
curl -s -o /dev/null -w "Frontend: %{http_code}\n" http://localhost:8080

echo ""
echo "🎉 PIP AI Demo Ready!"
echo "📱 Frontend: http://localhost:8080"
echo "🔧 Backend API: http://localhost:8000/docs"
echo ""
echo "📝 Logs:"
echo "  Backend: /Users/thekiiid/pipbycdo/backend/backend.log"
echo "  Frontend: /Users/thekiiid/pipbycdo/ui/frontend.log"
