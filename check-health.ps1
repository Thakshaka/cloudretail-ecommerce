# Test all health endpoints
Write-Host "Testing CloudRetail Services Health..." -ForegroundColor Cyan
Write-Host ""

$services = @(
    @{Name="User Service"; Port=3001},
    @{Name="Product Service"; Port=3002},
    @{Name="Inventory Service"; Port=3003},
    @{Name="Order Service"; Port=3004},
    @{Name="Payment Service"; Port=3005},
    @{Name="Notification Service"; Port=3006}
)

foreach ($service in $services) {
    Write-Host "$($service.Name) (port $($service.Port)): " -NoNewline
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$($service.Port)/health" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "HEALTHY" -ForegroundColor Green
            Write-Host "  Response: $($response.Content)" -ForegroundColor Gray
        } else {
            Write-Host "UNHEALTHY (Status: $($response.StatusCode))" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "NOT RESPONDING" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
    }
    Write-Host ""
}

Write-Host "Health check complete!" -ForegroundColor Cyan
