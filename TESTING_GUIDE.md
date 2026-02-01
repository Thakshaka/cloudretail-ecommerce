# CloudRetail - Testing & Verification Guide

## 🎯 Objective

Verify that all 6 microservices are functional and can work together, especially the Saga pattern for distributed transactions.

---

## 📋 Pre-Test Checklist

### 1. Environment Setup

```bash
# Navigate to project directory
cd C:\Users\ASUS\Desktop\cloudretail-ecommerce

# Ensure .env file exists
copy .env.example .env

# Start all services
docker-compose up -d

# Wait for services to start (30 seconds)
timeout /t 30

# Check service status
docker-compose ps
```

### 2. Verify Service Health

```bash
# Test all health endpoints
curl http://localhost:3001/health  # User Service
curl http://localhost:3002/health  # Product Service
curl http://localhost:3003/health  # Inventory Service
curl http://localhost:3004/health  # Order Service
curl http://localhost:3005/health  # Payment Service
curl http://localhost:3006/health  # Notification Service
```

**Expected**: All should return `{"status":"healthy",...}`

---

## 🧪 Test Scenarios

### Test 1: User Service - Registration & Authentication

#### 1.1 Register a New User

```bash
curl -X POST http://localhost:3001/api/v1/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@cloudretail.com\",\"password\":\"Admin123!\",\"firstName\":\"Admin\",\"lastName\":\"User\"}"
```

**Expected Response**:
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid-here",
    "email": "admin@cloudretail.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "customer"
  }
}
```

✅ **Pass Criteria**: Status 201, user object returned

#### 1.2 Login

```bash
curl -X POST http://localhost:3001/api/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@cloudretail.com\",\"password\":\"Admin123!\"}"
```

**Expected Response**:
```json
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

✅ **Pass Criteria**: Status 200, tokens returned

**Save the accessToken for next tests!**

#### 1.3 Get User Profile (Protected Endpoint)

```bash
# Replace YOUR_TOKEN with the accessToken from login
curl -X GET http://localhost:3001/api/v1/users/profile ^
  -H "Authorization: Bearer YOUR_TOKEN"
```

✅ **Pass Criteria**: Status 200, user profile returned

---

### Test 2: Product Service - CRUD & Caching

#### 2.1 Create a Category

```bash
curl -X POST http://localhost:3002/api/v1/categories ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Electronics\",\"description\":\"Electronic devices and accessories\"}"
```

**Save the category ID from response!**

✅ **Pass Criteria**: Status 201, category created

#### 2.2 Create Products

```bash
# Product 1
curl -X POST http://localhost:3002/api/v1/products ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Wireless Headphones\",\"description\":\"Premium noise-cancelling headphones\",\"price\":299.99,\"sku\":\"WH-001\",\"categoryId\":\"CATEGORY_ID_HERE\"}"

# Product 2
curl -X POST http://localhost:3002/api/v1/products ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Smartphone\",\"description\":\"Latest flagship smartphone\",\"price\":899.99,\"sku\":\"SP-001\",\"categoryId\":\"CATEGORY_ID_HERE\"}"
```

**Save the product IDs!**

✅ **Pass Criteria**: Status 201, products created

#### 2.3 Test Caching

```bash
# First request (cache miss - check logs)
curl -X GET "http://localhost:3002/api/v1/products?page=1&limit=10"

# Second request (cache hit - check logs)
curl -X GET "http://localhost:3002/api/v1/products?page=1&limit=10"
```

**Check Docker logs**:
```bash
docker-compose logs product-service | findstr "Cache"
```

✅ **Pass Criteria**: 
- First request: See "Cache miss" or no cache log
- Second request: See "Cache hit" in logs
- Both return same data

---

### Test 3: Inventory Service - Stock Management

#### 3.1 Add Inventory for Products

```bash
# Add stock for Product 1
curl -X PUT http://localhost:3003/api/v1/inventory/PRODUCT_1_ID/adjust ^
  -H "Content-Type: application/json" ^
  -d "{\"quantity\":100,\"warehouseId\":\"00000000-0000-0000-0000-000000000001\"}"

# Add stock for Product 2
curl -X PUT http://localhost:3003/api/v1/inventory/PRODUCT_2_ID/adjust ^
  -H "Content-Type: application/json" ^
  -d "{\"quantity\":50,\"warehouseId\":\"00000000-0000-0000-0000-000000000001\"}"
```

✅ **Pass Criteria**: Status 200, inventory created/updated

#### 3.2 Check Inventory

```bash
curl -X GET http://localhost:3003/api/v1/inventory/PRODUCT_1_ID
```

**Expected**:
```json
{
  "inventory": {
    "productId": "...",
    "availableStock": 100,
    "reservedStock": 0,
    "totalStock": 100
  }
}
```

✅ **Pass Criteria**: Correct stock levels shown

---

### Test 4: Order Service - Saga Pattern (CRITICAL TEST!)

#### 4.1 Create Order (Successful Path)

```bash
curl -X POST http://localhost:3004/api/v1/orders ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"USER_ID_HERE\",\"items\":[{\"productId\":\"PRODUCT_1_ID\",\"quantity\":2,\"price\":299.99}],\"shippingAddress\":{\"street\":\"123 Main St\",\"city\":\"San Francisco\",\"state\":\"CA\",\"zip\":\"94105\",\"country\":\"USA\"}}"
```

**Watch the Saga execution in logs**:
```bash
docker-compose logs -f order-service
docker-compose logs -f inventory-service
docker-compose logs -f payment-service
```

**Expected Flow**:
1. Order created (status: pending)
2. Inventory reserved (availableStock -= 2, reservedStock += 2)
3. Payment processing
4. Payment completed (90% success rate)
5. Order confirmed (status: confirmed, sagaState: completed)

**Expected Response** (if successful):
```json
{
  "message": "Order created successfully",
  "order": {
    "id": "order-uuid",
    "status": "confirmed",
    "sagaState": "completed",
    "totalAmount": "599.98",
    "items": [...]
  }
}
```

✅ **Pass Criteria**: 
- Status 201
- Order status: "confirmed"
- Saga state: "completed"
- Inventory shows reserved stock

**Save the order ID!**

#### 4.2 Verify Inventory Reservation

```bash
curl -X GET http://localhost:3003/api/v1/inventory/PRODUCT_1_ID
```

**Expected**:
```json
{
  "inventory": {
    "availableStock": 98,  // Was 100, now 98
    "reservedStock": 2,     // Was 0, now 2
    "totalStock": 100
  }
}
```

✅ **Pass Criteria**: Stock correctly reserved

#### 4.3 Test Order Cancellation (Compensation)

```bash
curl -X PUT http://localhost:3004/api/v1/orders/ORDER_ID/cancel
```

**Watch compensation in logs**:
```bash
docker-compose logs -f order-service
```

**Expected Flow**:
1. Compensation started
2. Inventory released
3. Payment refunded (if processed)
4. Order status: cancelled
5. Saga state: failed

✅ **Pass Criteria**:
- Status 200
- Order status: "cancelled"
- Inventory released (availableStock back to 100)

#### 4.4 Verify Inventory Released

```bash
curl -X GET http://localhost:3003/api/v1/inventory/PRODUCT_1_ID
```

**Expected**:
```json
{
  "inventory": {
    "availableStock": 100,  // Back to 100
    "reservedStock": 0,     // Back to 0
    "totalStock": 100
  }
}
```

✅ **Pass Criteria**: Stock correctly released

---

### Test 5: Payment Service

#### 5.1 Get Payment Details

```bash
# Use payment ID from order creation
curl -X GET http://localhost:3005/api/v1/payments/PAYMENT_ID
```

✅ **Pass Criteria**: Payment details returned

---

### Test 6: Notification Service

#### 6.1 Manual Notification Test

```bash
curl -X POST http://localhost:3006/api/v1/notifications/send ^
  -H "Content-Type: application/json" ^
  -d "{\"type\":\"email\",\"to\":\"test@example.com\",\"data\":{\"subject\":\"Test Email\",\"template\":\"test-template\",\"templateData\":{\"name\":\"Test User\"}}}"
```

**Check logs**:
```bash
docker-compose logs notification-service
```

✅ **Pass Criteria**: Email logged in notification service

---

## 📊 Test Results Template

### Test Summary

| Test | Service | Status | Notes |
|------|---------|--------|-------|
| 1.1 | User | ⬜ | User registration |
| 1.2 | User | ⬜ | User login |
| 1.3 | User | ⬜ | Get profile |
| 2.1 | Product | ⬜ | Create category |
| 2.2 | Product | ⬜ | Create products |
| 2.3 | Product | ⬜ | Cache hit/miss |
| 3.1 | Inventory | ⬜ | Add inventory |
| 3.2 | Inventory | ⬜ | Check inventory |
| 4.1 | Order | ⬜ | Create order (Saga) |
| 4.2 | Order | ⬜ | Verify reservation |
| 4.3 | Order | ⬜ | Cancel order (Compensation) |
| 4.4 | Order | ⬜ | Verify release |
| 5.1 | Payment | ⬜ | Get payment |
| 6.1 | Notification | ⬜ | Send notification |

**Legend**: ✅ Pass | ❌ Fail | ⬜ Not Tested

---

## 🐛 Troubleshooting

### Services Not Starting

```bash
# Check logs
docker-compose logs

# Restart specific service
docker-compose restart user-service

# Rebuild if needed
docker-compose up -d --build
```

### Database Connection Issues

```bash
# Check PostgreSQL
docker-compose logs postgres

# Restart database
docker-compose restart postgres

# Wait for database to be ready
timeout /t 10
```

### Redis Connection Issues

```bash
# Check Redis
docker-compose logs redis

# Restart Redis
docker-compose restart redis
```

### Port Already in Use

```bash
# Find process using port
netstat -ano | findstr :3001

# Kill process (use PID from above)
taskkill /PID <PID> /F
```

---

## 🎯 Success Criteria

### Minimum for Viva

✅ All services start successfully  
✅ User registration and login work  
✅ Products can be created and listed  
✅ Order creation triggers Saga successfully  
✅ Inventory is reserved during order  
✅ Payment processing works  

### Ideal for Viva

✅ All minimum criteria  
✅ Caching demonstrates hit/miss  
✅ Order cancellation triggers compensation  
✅ Inventory is released after cancellation  
✅ All services log appropriately  
✅ No errors in logs  

---

## 📝 Next Steps After Testing

Once all tests pass:

1. ✅ Document test results
2. ✅ Take screenshots of successful flows
3. ✅ Save sample requests/responses
4. ✅ Note any issues for discussion
5. ✅ Proceed to API Gateway or Swagger docs

---

## 🎬 Demo Script for Viva

**1. Show Architecture** (30 sec)
- "I built 6 microservices with Docker Compose"

**2. Demonstrate Saga Pattern** (2 min)
- Create an order
- Show logs: inventory reserved → payment processed → order confirmed
- "This demonstrates distributed transaction management"

**3. Show Compensation** (1 min)
- Cancel an order
- Show logs: inventory released → payment refunded
- "This shows automatic rollback on failure"

**4. Demonstrate Caching** (1 min)
- Query products twice
- Show cache hit in logs
- "This optimizes performance by reducing database load"

**5. Show Security** (1 min)
- Login to get JWT
- Access protected endpoint
- "Multi-layered security with JWT and RBAC"

**Total Demo Time**: ~5 minutes

---

**Ready to start testing? Let me know if you encounter any issues!**
