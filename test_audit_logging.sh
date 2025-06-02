#!/bin/bash
# Script to test the end-to-end audit logging functionality

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}PIP AI Audit Logging Test Script${NC}"
echo "=================================="

# Check if backend server is running
echo -e "\n${YELLOW}Checking if backend server is running...${NC}"
curl -s http://localhost:8000/docs > /dev/null
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Backend server is running!${NC}"
else
    echo -e "${RED}Backend server is not running. Please start it first.${NC}"
    echo "Run: cd /Users/thekiiid/pipbycdo/backend && python -m app.main"
    exit 1
fi

# Run the backend direct API test
echo -e "\n${YELLOW}Running backend API test...${NC}"
cd /Users/thekiiid/pipbycdo/backend
python tests/test_audit_api_direct.py

# Check if the UI dev server is running
echo -e "\n${YELLOW}Testing frontend audit logging service...${NC}"
echo "This requires manual verification in the browser console."
echo "1. Open the PIP AI application in your browser"
echo "2. Open the developer console"
echo "3. Run the following command:"
echo "   import('/src/tests/auditLoggerIntegration.js').then(m => m.testAuditLogger())"
echo "4. Check the console output for success messages"
echo "5. Open the Admin Panel and verify logs appear in the Audit Logs tab"

echo -e "\n${GREEN}Test script completed!${NC}"
