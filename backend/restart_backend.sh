#!/bin/bash
# Restart backend script - Kills any existing backend processes and starts a fresh instance

# Find any existing Python processes running the backend
echo "Checking for existing backend processes..."
BACKEND_PIDS=$(pgrep -f "uvicorn app.main:app")

# If any processes are found, terminate them
if [ -n "$BACKEND_PIDS" ]; then
    echo "Killing existing backend processes: $BACKEND_PIDS"
    kill $BACKEND_PIDS
    sleep 2
    
    # Check if processes are still running
    REMAINING_PIDS=$(pgrep -f "uvicorn app.main:app")
    if [ -n "$REMAINING_PIDS" ]; then
        echo "Force killing remaining processes: $REMAINING_PIDS"
        kill -9 $REMAINING_PIDS
        sleep 1
    fi
    
    echo "All previous backend processes terminated."
else
    echo "No existing backend processes found."
fi

# Create local storage directory if it doesn't exist
echo "Creating local storage directory..."
mkdir -p "$(dirname "$0")/local_storage"

# Start the backend
echo "Starting backend..."
cd "$(dirname "$0")"
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
