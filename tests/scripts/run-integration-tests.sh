#!/bin/bash

# CloudRetail - Integration Tests Runner

echo "========================================="
echo "CloudRetail - Running Integration Tests"
echo "========================================="

# Ensure services are running
echo "Checking if services are running..."
docker-compose ps | grep "Up" > /dev/null

if [ $? -ne 0 ]; then
    echo "Starting services..."
    docker-compose up -d
    echo "Waiting for services to be ready..."
    sleep 10
fi

# Run integration tests
echo ""
echo "Running integration tests..."
echo "-----------------------------------------"

cd tests/integration

# Install dependencies
if [ ! -d "node_modules" ]; then
    npm install
fi

# Run tests
npm test

if [ $? -eq 0 ]; then
    echo "✓ Integration tests passed"
    exit 0
else
    echo "✗ Integration tests failed"
    exit 1
fi
