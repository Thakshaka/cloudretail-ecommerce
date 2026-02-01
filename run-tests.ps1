# CloudRetail - Automated Test Script
# This script runs all test scenarios and reports results

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CloudRetail E-Commerce Platform" -ForegroundColor Cyan
Write-Host "Automated Testing Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test results
$testResults = @()

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [string]$Body = $null,
        [hashtable]$Headers = @{},
        [int]$ExpectedStatus = 200
    )
    
    Write-Host "Testing: $Name..." -NoNewline
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            ContentType = "application/json"
        }
        
        if ($Body) {
            $params.Body = $Body
        }
        
        $response = Invoke-WebRequest @params -UseBasicParsing
        
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Host " PASS" -ForegroundColor Green
            return @{
                Name = $Name
                Status = "PASS"
                Response = $response.Content
            }
        } else {
            Write-Host " FAIL (Status: $($response.StatusCode))" -ForegroundColor Red
            return @{
                Name = $Name
                Status = "FAIL"
                Error = "Unexpected status code: $($response.StatusCode)"
            }
        }
    }
    catch {
        Write-Host " FAIL" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
        return @{
            Name = $Name
            Status = "FAIL"
            Error = $_.Exception.Message
        }
    }
}

# Step 1: Check service health
Write-Host "`n[Step 1] Checking Service Health" -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Yellow

$services = @(
    @{Name="User Service"; Port=3001},
    @{Name="Product Service"; Port=3002},
    @{Name="Inventory Service"; Port=3003},
    @{Name="Order Service"; Port=3004},
    @{Name="Payment Service"; Port=3005},
    @{Name="Notification Service"; Port=3006}
)

foreach ($service in $services) {
    $result = Test-Endpoint -Name "$($service.Name) Health" -Method "GET" -Url "http://localhost:$($service.Port)/health"
    $testResults += $result
}

# Step 2: User Service Tests
Write-Host "`n[Step 2] Testing User Service" -ForegroundColor Yellow
Write-Host "==============================" -ForegroundColor Yellow

$registerBody = @{
    email = "test@cloudretail.com"
    password = "Test123!"
    firstName = "Test"
    lastName = "User"
} | ConvertTo-Json

$result = Test-Endpoint -Name "User Registration" -Method "POST" -Url "http://localhost:3001/api/v1/auth/register" -Body $registerBody -ExpectedStatus 201
$testResults += $result

if ($result.Status -eq "PASS") {
    $loginBody = @{
        email = "test@cloudretail.com"
        password = "Test123!"
    } | ConvertTo-Json
    
    $result = Test-Endpoint -Name "User Login" -Method "POST" -Url "http://localhost:3001/api/v1/auth/login" -Body $loginBody
    $testResults += $result
    
    if ($result.Status -eq "PASS") {
        $loginResponse = $result.Response | ConvertFrom-Json
        $token = $loginResponse.accessToken
        
        Write-Host "  Token obtained: $($token.Substring(0, 20))..." -ForegroundColor Gray
        
        $headers = @{
            "Authorization" = "Bearer $token"
        }
        
        $result = Test-Endpoint -Name "Get User Profile" -Method "GET" -Url "http://localhost:3001/api/v1/users/profile" -Headers $headers
        $testResults += $result
    }
}

# Step 3: Product Service Tests
Write-Host "`n[Step 3] Testing Product Service" -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Yellow

$categoryBody = @{
    name = "Electronics"
    description = "Electronic devices"
} | ConvertTo-Json

$result = Test-Endpoint -Name "Create Category" -Method "POST" -Url "http://localhost:3002/api/v1/categories" -Body $categoryBody -ExpectedStatus 201
$testResults += $result

if ($result.Status -eq "PASS") {
    $categoryResponse = $result.Response | ConvertFrom-Json
    $categoryId = $categoryResponse.category.id
    
    Write-Host "  Category ID: $categoryId" -ForegroundColor Gray
    
    $productBody = @{
        name = "Test Product"
        description = "Test Description"
        price = 99.99
        sku = "TEST-001"
        categoryId = $categoryId
    } | ConvertTo-Json
    
    $result = Test-Endpoint -Name "Create Product" -Method "POST" -Url "http://localhost:3002/api/v1/products" -Body $productBody -ExpectedStatus 201
    $testResults += $result
    
    if ($result.Status -eq "PASS") {
        $productResponse = $result.Response | ConvertFrom-Json
        $productId = $productResponse.product.id
        
        Write-Host "  Product ID: $productId" -ForegroundColor Gray
        
        # Test caching
        Write-Host "`n  Testing Cache..." -ForegroundColor Cyan
        $result1 = Test-Endpoint -Name "Get Products (1st - Cache Miss)" -Method "GET" -Url "http://localhost:3002/api/v1/products?page=1&limit=10"
        $testResults += $result1
        
        Start-Sleep -Seconds 1
        
        $result2 = Test-Endpoint -Name "Get Products (2nd - Cache Hit)" -Method "GET" -Url "http://localhost:3002/api/v1/products?page=1&limit=10"
        $testResults += $result2
    }
}

# Generate Test Report
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test Results Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$passed = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failed = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$total = $testResults.Count

Write-Host "`nTotal Tests: $total" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red
Write-Host "Success Rate: $([math]::Round(($passed/$total)*100, 2))%" -ForegroundColor $(if ($passed -eq $total) { "Green" } else { "Yellow" })

Write-Host "`nDetailed Results:" -ForegroundColor White
Write-Host "=================" -ForegroundColor White
foreach ($result in $testResults) {
    $status = if ($result.Status -eq "PASS") { "✓" } else { "✗" }
    $color = if ($result.Status -eq "PASS") { "Green" } else { "Red" }
    Write-Host "$status $($result.Name)" -ForegroundColor $color
    if ($result.Error) {
        Write-Host "  Error: $($result.Error)" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Testing Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Save results to file
$reportPath = "test-results.txt"
$testResults | ConvertTo-Json -Depth 10 | Out-File $reportPath
Write-Host "`nResults saved to: $reportPath" -ForegroundColor Gray
