#!/bin/bash

# Load environment variables using Python's dotenv approach
echo "Loading environment variables..."
cd /Users/thekiiid/pipbycdo

# Start backend server with proper environment loading
echo "Starting uvicorn server..."
python -c "
import sys
sys.path.append('/Users/thekiiid/pipbycdo')
from backend.load_env import *
import subprocess
subprocess.run([
    'python', '-m', 'uvicorn', 
    'backend.app.main:app', 
    '--reload', 
    '--host', '0.0.0.0', 
    '--port', '8000'
])
"
