#!/bin/bash

# Comprehensive Frontend-Backend Integration Test Script
# Tests all major integration points and provides detailed reporting

echo "🧪 PIP AI Frontend-Backend Integration Test Suite"
echo "================================================="
date

# Test counters
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    echo -e "\n${BLUE}[TEST $TESTS_TOTAL]${NC} $test_name"
    echo "Command: $test_command"
    
    # Run the test command
    result=$(eval "$test_command" 2>&1)
    exit_code=$?
    
    # Check result
    if [ $exit_code -eq 0 ] && [[ "$result" == *"$expected_result"* ]]; then
        echo -e "${GREEN}✅ PASSED${NC} - $test_name"
        echo "Result: $result"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}❌ FAILED${NC} - $test_name"
        echo "Expected: $expected_result"
        echo "Got: $result"
        echo "Exit code: $exit_code"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Function to test API endpoint
test_api_endpoint() {
    local endpoint="$1"
    local description="$2"
    local expected_key="$3"
    
    run_test "$description" \
        "curl -s http://localhost:8000$endpoint" \
        "$expected_key"
}

# Function to test frontend service
test_frontend_service() {
    local test_name="$1"
    local url="$2"
    local expected_content="$3"
    
    run_test "$test_name" \
        "curl -s '$url' | head -c 200" \
        "$expected_content"
}

echo -e "\n${YELLOW}🔧 Testing Backend Services${NC}"
echo "================================"

# Test 1: Backend Health Check
test_api_endpoint "/health" "Backend Health Check" "\"status\":\"ok\""

# Test 2: Templates API
test_api_endpoint "/api/templates" "Templates API" "\"templates\""

# Test 3: Admin Templates API
test_api_endpoint "/api/templates?admin=true" "Admin Templates API" "\"templates\""

# Test 4: Analysis API (without files)
echo -e "\n${BLUE}[TEST $((TESTS_TOTAL + 1))]${NC} Analysis API (No Files)"
TESTS_TOTAL=$((TESTS_TOTAL + 1))

TASK_ID=$(curl -s -X POST http://localhost:8000/api/analyze \
    -H "X-Internal-Code: hermes" \
    -F "query=Integration test - no files" \
    -F "session_id=test-$(date +%s)" | jq -r '.task_id')

if [[ "$TASK_ID" =~ ^[a-f0-9-]+$ ]]; then
    echo -e "${GREEN}✅ PASSED${NC} - Analysis API (No Files)"
    echo "Task ID: $TASK_ID"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    
    # Test 5: Task Status Check
    echo -e "\n${BLUE}[TEST $((TESTS_TOTAL + 1))]${NC} Task Status API"
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    sleep 2
    
    STATUS=$(curl -s http://localhost:8000/api/tasks/$TASK_ID/status | jq -r '.status')
    if [[ "$STATUS" == "completed" || "$STATUS" == "pending" || "$STATUS" == "processing" ]]; then
        echo -e "${GREEN}✅ PASSED${NC} - Task Status API"
        echo "Status: $STATUS"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ FAILED${NC} - Task Status API"
        echo "Invalid status: $STATUS"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
else
    echo -e "${RED}❌ FAILED${NC} - Analysis API (No Files)"
    echo "Invalid task ID: $TASK_ID"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Test 6: Analysis API with File Upload
echo -e "\n${BLUE}[TEST $((TESTS_TOTAL + 1))]${NC} Analysis API (With File)"
TESTS_TOTAL=$((TESTS_TOTAL + 1))

# Create a test file
echo "Integration test document for file upload verification" > /tmp/integration_test.txt

TASK_ID_FILE=$(curl -s -X POST http://localhost:8000/api/analyze \
    -H "X-Internal-Code: hermes" \
    -F "query=Analyze uploaded integration test file" \
    -F "session_id=test-file-$(date +%s)" \
    -F "files=@/tmp/integration_test.txt" | jq -r '.task_id')

if [[ "$TASK_ID_FILE" =~ ^[a-f0-9-]+$ ]]; then
    echo -e "${GREEN}✅ PASSED${NC} - Analysis API (With File)"
    echo "Task ID: $TASK_ID_FILE"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}❌ FAILED${NC} - Analysis API (With File)"
    echo "Invalid task ID: $TASK_ID_FILE"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Clean up test file
rm -f /tmp/integration_test.txt

echo -e "\n${YELLOW}🌐 Testing Frontend Services${NC}"
echo "===================================="

# Test 7: Frontend Accessibility
test_frontend_service "Frontend Accessibility" "http://localhost:8080" "root"

# Test 8: Frontend API Configuration
test_frontend_service "Frontend API Config" "http://localhost:8080/src/services/api.ts" "localhost:8000"

echo -e "\n${YELLOW}📊 Testing Integration Features${NC}"
echo "====================================="

# Test 9: Local Storage Fallback
echo -e "\n${BLUE}[TEST $((TESTS_TOTAL + 1))]${NC} Local Storage Fallback"
TESTS_TOTAL=$((TESTS_TOTAL + 1))

if [ -f "/Users/thekiiid/pipbycdo/backend/local_storage/tasks.json" ]; then
    TASK_COUNT=$(cat /Users/thekiiid/pipbycdo/backend/local_storage/tasks.json | jq '. | length')
    if [ "$TASK_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅ PASSED${NC} - Local Storage Fallback"
        echo "Local tasks stored: $TASK_COUNT"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${YELLOW}⚠️ WARNING${NC} - Local Storage Fallback"
        echo "Local storage exists but no tasks found"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
else
    echo -e "${RED}❌ FAILED${NC} - Local Storage Fallback"
    echo "Local storage file not found"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Test 10: Environment Configuration
echo -e "\n${BLUE}[TEST $((TESTS_TOTAL + 1))]${NC} Environment Configuration"
TESTS_TOTAL=$((TESTS_TOTAL + 1))

if [ -f "/Users/thekiiid/pipbycdo/.env" ] && grep -q "SUPABASE_URL" /Users/thekiiid/pipbycdo/.env; then
    echo -e "${GREEN}✅ PASSED${NC} - Environment Configuration"
    echo "Environment file exists with required variables"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}❌ FAILED${NC} - Environment Configuration"
    echo "Environment file missing or incomplete"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo -e "\n${YELLOW}🎯 Testing Complete User Workflow${NC}"
echo "====================================="

# Test 11: Complete User Workflow Simulation
echo -e "\n${BLUE}[TEST $((TESTS_TOTAL + 1))]${NC} Complete User Workflow"
TESTS_TOTAL=$((TESTS_TOTAL + 1))

# Step 1: Get templates
TEMPLATE_COUNT=$(curl -s http://localhost:8000/api/templates | jq -r '.templates | length')

# Step 2: Start analysis
WORKFLOW_TASK_ID=$(curl -s -X POST http://localhost:8000/api/analyze \
    -H "X-Internal-Code: hermes" \
    -F "query=Complete workflow test using template" \
    -F "session_id=workflow-test-$(date +%s)" | jq -r '.task_id')

# Step 3: Check completion
sleep 3
WORKFLOW_STATUS=$(curl -s http://localhost:8000/api/tasks/$WORKFLOW_TASK_ID/status | jq -r '.status')

if [ "$TEMPLATE_COUNT" -gt 0 ] && [[ "$WORKFLOW_TASK_ID" =~ ^[a-f0-9-]+$ ]] && [[ "$WORKFLOW_STATUS" == "completed" ]]; then
    echo -e "${GREEN}✅ PASSED${NC} - Complete User Workflow"
    echo "Templates: $TEMPLATE_COUNT, Task: $WORKFLOW_TASK_ID, Status: $WORKFLOW_STATUS"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}❌ FAILED${NC} - Complete User Workflow"
    echo "Templates: $TEMPLATE_COUNT, Task: $WORKFLOW_TASK_ID, Status: $WORKFLOW_STATUS"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# Generate final report
echo -e "\n${YELLOW}📋 INTEGRATION TEST SUMMARY${NC}"
echo "==============================="
echo "Tests Total: $TESTS_TOTAL"
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ALL INTEGRATION TESTS PASSED!${NC}"
    echo "✅ Frontend-Backend integration is working perfectly"
    echo "✅ Fallback mechanisms are functioning"
    echo "✅ Complete user workflow is operational"
    SUCCESS_RATE=100
else
    SUCCESS_RATE=$(( TESTS_PASSED * 100 / TESTS_TOTAL ))
    echo -e "\n${YELLOW}⚠️ INTEGRATION TEST RESULTS${NC}"
    echo "Success Rate: $SUCCESS_RATE%"
    
    if [ $SUCCESS_RATE -ge 80 ]; then
        echo -e "${YELLOW}✓ Integration is mostly working with minor issues${NC}"
    else
        echo -e "${RED}✗ Critical integration issues detected${NC}"
    fi
fi

echo -e "\n${BLUE}🔍 SYSTEM STATUS OVERVIEW${NC}"
echo "=========================="

# Check running processes
BACKEND_PROCESSES=$(ps aux | grep -E "(uvicorn|python.*main)" | grep -v grep | wc -l)
FRONTEND_PROCESSES=$(ps aux | grep -E "(vite|npm)" | grep -v grep | wc -l)

echo "Backend Processes: $BACKEND_PROCESSES"
echo "Frontend Processes: $FRONTEND_PROCESSES"

# Check ports
BACKEND_PORT=$(netstat -an 2>/dev/null | grep ":8000" | grep LISTEN | wc -l)
FRONTEND_PORT=$(netstat -an 2>/dev/null | grep ":8080" | grep LISTEN | wc -l)

echo "Backend Port 8000: $([ $BACKEND_PORT -gt 0 ] && echo "✅ Open" || echo "❌ Closed")"
echo "Frontend Port 8080: $([ $FRONTEND_PORT -gt 0 ] && echo "✅ Open" || echo "❌ Closed")"

echo -e "\n${BLUE}📝 NEXT STEPS${NC}"
echo "=============="

if [ $SUCCESS_RATE -eq 100 ]; then
    echo "🎯 Demo environment is fully operational!"
    echo "• Open http://localhost:8080 in browser"
    echo "• Test template dropdown functionality"
    echo "• Try file upload and analysis"
    echo "• Check admin panel features"
else
    echo "🔧 Consider addressing failed tests:"
    echo "• Check service logs for errors"
    echo "• Verify environment configuration"
    echo "• Restart services if needed"
fi

echo -e "\n${YELLOW}Integration test completed at $(date)${NC}"
exit $([ $SUCCESS_RATE -eq 100 ] && echo 0 || echo 1)
