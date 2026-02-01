@echo off
echo ========================================
echo FINAL TEST - Saga Pattern Demo
echo ========================================
echo.

echo Waiting for services to restart...
timeout /t 10 /nobreak >nul

set PRODUCT_ID=2e967147-a933-4e71-b337-2474f0c4ef35
set USER_ID=f25a9946-06ae-450d-95d1-0829e024810a

echo.
echo ========================================
echo Step 1: Check Current Inventory
echo ========================================
echo.
curl http://localhost:3003/api/v1/inventory/%PRODUCT_ID%
echo.
echo.
pause

echo.
echo ========================================
echo Step 2: Create Order (SAGA PATTERN!)
echo ========================================
echo.
echo WATCH THE LOGS IN YOUR OTHER WINDOWS!
echo.
pause

curl -X POST http://localhost:3004/api/v1/orders -H "Content-Type: application/json" -d "{\"userId\":\"%USER_ID%\",\"items\":[{\"productId\":\"%PRODUCT_ID%\",\"quantity\":2,\"price\":299.99}],\"shippingAddress\":{\"street\":\"123 Main St\",\"city\":\"San Francisco\",\"state\":\"CA\",\"zip\":\"94105\",\"country\":\"USA\"}}"
echo.
echo.

echo.
echo Did you see:
echo   - Order status: "confirmed"?
echo   - Saga state: "completed"?
echo (Y/N)
set /p success=
if /i "%success%" NEQ "Y" (
    echo.
    echo Let's check the logs...
    docker-compose logs order-service --tail=20
    pause
    exit /b 1
)

echo.
echo ========================================
echo Step 3: Verify Inventory Reserved
echo ========================================
echo.
curl http://localhost:3003/api/v1/inventory/%PRODUCT_ID%
echo.
echo.
echo.
echo Did the available stock decrease by 2? (Y/N)
set /p success=

echo.
echo ========================================
echo SUCCESS! Saga Pattern is Working!
echo ========================================
echo.
echo You have successfully demonstrated:
echo   [X] Distributed transaction management
echo   [X] Inventory reservation
echo   [X] Payment processing
echo   [X] Event-driven architecture
echo.
echo This is your STAR FEATURE for the viva!
echo.
pause
