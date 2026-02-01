# CloudRetail E-Commerce Platform

A production-grade microservices-based e-commerce platform demonstrating advanced distributed systems patterns including Saga orchestration, circuit breakers, API Gateway, and event-driven architecture.

## 🌟 Key Features

- **6 Microservices**: User, Product, Inventory, Order, Payment, Notification
- **Saga Pattern**: Distributed transaction management with automatic compensation
- **Circuit Breaker**: Fault tolerance for downstream service failures
- **API Gateway**: Unified entry point with Nginx
- **Event-Driven**: AWS EventBridge integration (simulated with LocalStack)
- **Caching**: Redis for product service
- **Security**: JWT authentication, MFA, input validation
- **API Documentation**: Interactive Swagger UI
- **Premium Frontend**: React dashboard with real-time visualization

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 22+ (for local development)
- 8GB RAM minimum

### Start the Platform

```bash
# Start all services
docker-compose up -d

# Check service health
docker-compose ps

# View logs
docker-compose logs -f
```

### Access Points

| Service | URL | Description |
|---------|-----|-------------|
| API Gateway | http://localhost:8080 | Unified API entry point |
| Frontend Dashboard | http://localhost:5173 | React admin dashboard |
| Swagger UI | http://localhost:8080/docs/products/ | Interactive API docs |
| User Service | http://localhost:3001 | Authentication & users |
| Product Service | http://localhost:3002 | Products & categories |
| Inventory Service | http://localhost:3003 | Stock management |
| Order Service | http://localhost:3004 | Order processing |
| Payment Service | http://localhost:3005 | Payment processing |

## 📋 Testing Guide

### Test Saga Pattern (Happy Path)

```bash
# Run the automated test script
test-saga-final.bat

# Or manually test:
# 1. Check inventory
curl http://localhost:8080/api/v1/inventory/2e967147-a933-4e71-b337-2474f0c4ef35

# 2. Create order
curl -X POST http://localhost:8080/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "f25a9946-06ae-450d-95d1-0829e024810a",
    "items": [{
      "productId": "2e967147-a933-4e71-b337-2474f0c4ef35",
      "quantity": 2,
      "price": 299.99
    }],
    "shippingAddress": {
      "street": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "zip": "94105",
      "country": "USA"
    }
  }'

# 3. Verify inventory was reserved
curl http://localhost:8080/api/v1/inventory/2e967147-a933-4e71-b337-2474f0c4ef35
```

### Test Circuit Breaker (Chaos Engineering)

```bash
# 1. Stop payment service to simulate failure
docker-compose stop payment-service

# 2. Attempt order creation - circuit breaker will trip
curl -X POST http://localhost:8080/api/v1/orders \
  -H "Content-Type: application/json" \
  -d @order-payload.json

# 3. Check logs for circuit breaker messages
docker-compose logs order-service | grep "CIRCUIT BREAKER"

# 4. Restart service and observe recovery
docker-compose start payment-service
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway (Nginx)                      │
│                    http://localhost:8080                     │
└──────────────┬──────────────────────────────────────────────┘
               │
       ┌───────┴────────┬─────────────┬──────────────┐
       │                │             │              │
   ┌───▼────┐      ┌───▼────┐   ┌───▼────┐    ┌───▼────┐
   │  User  │      │Product │   │Inventory│    │ Order  │
   │Service │      │Service │   │ Service │    │Service │
   │  :3001 │      │  :3002 │   │  :3003  │    │  :3004 │
   └────────┘      └────────┘   └─────────┘    └────┬───┘
                                                     │
                                              Circuit Breakers
                                                     │
                                        ┌────────────┴────────────┐
                                        │                         │
                                   ┌────▼─────┐           ┌──────▼──────┐
                                   │ Payment  │           │  Inventory  │
                                   │ Service  │           │   Service   │
                                   │   :3005  │           │    :3003    │
                                   └──────────┘           └─────────────┘
```

## 🔧 Technology Stack

### Backend
- **Runtime**: Node.js 22
- **Framework**: Express.js
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Message Queue**: AWS EventBridge (LocalStack)
- **Circuit Breaker**: Opossum

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Custom CSS

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **API Gateway**: Nginx
- **Documentation**: Swagger/OpenAPI

## 📚 Key Patterns Demonstrated

### 1. Saga Pattern
Orchestration-based saga for order processing with automatic compensation on failure.

**Flow**: Create Order → Reserve Inventory → Process Payment → Confirm Order

**Compensation**: Release Inventory → Refund Payment → Cancel Order

### 2. Circuit Breaker
Prevents cascading failures when downstream services are unavailable.

**Configuration**:
- Timeout: 5 seconds
- Error Threshold: 50%
- Reset Timeout: 30 seconds

### 3. API Gateway
Single entry point for all microservices with routing, CORS, and health checks.

### 4. Event-Driven Architecture
Services communicate via events published to EventBridge (simulated).

## 📖 Documentation

- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)**: Comprehensive testing scenarios
- **[README.md](./README.md)**: This file
- **Swagger UI**: http://localhost:8080/docs/products/

## 🛠️ Development

### Project Structure

```
cloudretail-ecommerce/
├── api-gateway/              # Nginx API Gateway
├── frontend/                 # React dashboard
├── services/
│   ├── user-service/        # Authentication & users
│   ├── product-service/     # Products & categories
│   ├── inventory-service/   # Stock management
│   ├── order-service/       # Order processing (Saga)
│   ├── payment-service/     # Payment processing
│   └── notification-service/# Email/SMS notifications
├── docker-compose.yml       # Service orchestration
├── test-saga-final.bat     # Automated Saga test
└── README.md               # This file
```

### Environment Variables

All services use environment variables defined in `docker-compose.yml`. For local development, copy `.env.example` to `.env` in each service directory.

### Running Tests

```bash
# Health check all services
docker-compose ps

# View service logs
docker-compose logs -f [service-name]

# Run Saga test
test-saga-final.bat
```

## 🎯 Assignment Requirements Coverage

- ✅ **Microservices Architecture**: 6 independent services
- ✅ **Saga Pattern**: Order service with compensation logic
- ✅ **Event-Driven**: EventBridge integration
- ✅ **Caching**: Redis for product service
- ✅ **Security**: JWT, MFA, input validation
- ✅ **API Gateway**: Nginx reverse proxy
- ✅ **Circuit Breaker**: Fault tolerance pattern
- ✅ **Documentation**: Swagger UI + comprehensive guides
- ✅ **Frontend**: React dashboard
- ✅ **Testing**: Automated test scripts

## 🐛 Troubleshooting

### Services not starting
```bash
# Check Docker resources
docker system df

# Restart all services
docker-compose down
docker-compose up -d --build
```

### Port conflicts
```bash
# Check if ports are in use
netstat -ano | findstr "8080 3001 3002 3003 3004 3005 5173"

# Stop conflicting services or change ports in docker-compose.yml
```

### Database connection issues
```bash
# Check PostgreSQL health
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

## 📝 License

Apache License 2.0 - See [LICENSE](./LICENSE) file for details.

## 👥 Contributors

Built as part of a microservices architecture assignment demonstrating enterprise-grade distributed systems patterns.

---

**For detailed testing instructions, see [TESTING_GUIDE.md](./TESTING_GUIDE.md)**