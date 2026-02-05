#!/bin/bash

# CloudRetail - Load Tests Runner using Artillery

echo "========================================="
echo "CloudRetail - Running Load Tests"
echo "========================================="

# Check if Artillery is installed
if ! command -v artillery &> /dev/null; then
    echo "Artillery not found. Installing..."
    npm install -g artillery
fi

# Ensure services are running
echo "Checking if services are running..."
docker-compose ps | grep "Up" > /dev/null

if [ $? -ne 0 ]; then
    echo "Starting services..."
    docker-compose up -d
    echo "Waiting for services to be ready..."
    sleep 10
fi

# Create reports directory
mkdir -p tests/performance/reports

# Run load tests
echo ""
echo "Running load test: Browse and Order (100 concurrent users)"
echo "-----------------------------------------"

artillery run \
    --output tests/performance/reports/load-test-$(date +%Y%m%d-%H%M%S).json \
    tests/performance/load-tests/browse-and-order.yml

# Generate HTML report
echo ""
echo "Generating HTML report..."
artillery report tests/performance/reports/load-test-*.json \
    --output tests/performance/reports/load-test-report.html

echo ""
echo "✓ Load test completed"
echo "Report: tests/performance/reports/load-test-report.html"
