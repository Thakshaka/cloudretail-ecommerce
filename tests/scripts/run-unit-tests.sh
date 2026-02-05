#!/bin/bash

# CloudRetail - Unit Tests Runner
# Runs all unit tests for backend services

echo "========================================="
echo "CloudRetail - Running Unit Tests"
echo "========================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Track test results
FAILED=0

# Function to run tests for a service
run_service_tests() {
    SERVICE=$1
    echo ""
    echo "Testing: $SERVICE"
    echo "-----------------------------------------"
    
    cd services/$SERVICE
    
    if [ ! -f "package.json" ]; then
        echo "${RED}✗ No package.json found${NC}"
        cd ../..
        return 1
    fi
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies..."
        npm install --silent
    fi
    
    # Run tests
    npm test -- --coverage
    
    if [ $? -eq 0 ]; then
        echo "${GREEN}✓ Tests passed${NC}"
    else
        echo "${RED}✗ Tests failed${NC}"
        FAILED=1
    fi
    
    cd ../..
}

# Run tests for each service
run_service_tests "user-service"
run_service_tests "product-service"
run_service_tests "order-service"
run_service_tests "inventory-service"
run_service_tests "payment-service"
run_service_tests "notification-service"

# Frontend tests
echo ""
echo "Testing: Frontend"
echo "-----------------------------------------"
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --silent
fi

npm test -- --coverage

if [ $? -eq 0 ]; then
    echo "${GREEN}✓ Frontend tests passed${NC}"
else
    echo "${RED}✗ Frontend tests failed${NC}"
    FAILED=1
fi

cd ..

# Summary
echo ""
echo "========================================="
if [ $FAILED -eq 0 ]; then
    echo "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo "${RED}Some tests failed!${NC}"
    exit 1
fi
