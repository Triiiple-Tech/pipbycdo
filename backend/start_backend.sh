#!/bin/bash

# Load environment variables from .env file
echo "Loading environment variables..."
cd /Users/thekiiid/pipbycdo
export $(grep -v '^#' .env | xargs)

# Ensure SUPABASE_KEY is set to service role key for backend
export SUPABASE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

# Start backend server
echo "Starting uvicorn server..."
python -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
