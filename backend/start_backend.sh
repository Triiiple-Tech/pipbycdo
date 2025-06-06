#!/bin/bash

# Load environment variables
echo "Loading environment variables..."
python load_env.py

# Start backend server
echo "Starting uvicorn server..."
cd /Users/thekiiid/pipbycdo/backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
