@echo off
echo ========================================
echo CloudRetail E-Commerce Platform
echo Starting All Services...
echo ========================================
echo.

REM Check if Docker is running
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not installed or not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [1/5] Checking Docker Compose...
docker-compose --version
if errorlevel 1 (
    echo ERROR: Docker Compose is not available!
    pause
    exit /b 1
)

echo.
echo [2/5] Stopping any existing containers...
docker-compose down

echo.
echo [3/5] Starting all services...
docker-compose up -d

echo.
echo [4/5] Waiting for services to start (30 seconds)...
timeout /t 30 /nobreak

echo.
echo [5/5] Checking service health...
echo.

echo User Service (3001):
curl -s http://localhost:3001/health
echo.

echo Product Service (3002):
curl -s http://localhost:3002/health
echo.

echo Inventory Service (3003):
curl -s http://localhost:3003/health
echo.

echo Order Service (3004):
curl -s http://localhost:3004/health
echo.

echo Payment Service (3005):
curl -s http://localhost:3005/health
echo.

echo Notification Service (3006):
curl -s http://localhost:3006/health
echo.

echo.
echo ========================================
echo All services started!
echo ========================================
echo.
echo Next steps:
echo 1. Review TESTING_GUIDE.md for test scenarios
echo 2. Use the curl commands to test the APIs
echo 3. Check logs: docker-compose logs -f [service-name]
echo.
echo To stop all services: docker-compose down
echo.
pause
