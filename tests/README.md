# CloudRetail Testing Suite

Complete testing implementation for the CloudRetail e-commerce microservices platform.

## 📦 What's Included

### Unit Tests (Jest + Supertest)
- Backend service tests for all 6 microservices
- Frontend component tests (Vitest + React Testing Library)
- 70%+ code coverage target

### Integration Tests
- Complete order flow testing
- Saga pattern success and rollback scenarios
- Circuit breaker behavior validation

### API Tests (Postman)
- Collections for all 6 services
- Automated assertions and validation
- Error scenario testing

### Performance Tests (Artillery)
- Load testing: 100 concurrent users
- Stress testing: 0-500 user ramp
- Spike testing: Sudden traffic bursts
- Latency and throughput measurement

## 🚀 Quick Start

### Run All Unit Tests
```bash
./tests/scripts/run-unit-tests.sh
```

### Run Integration Tests
```bash
./tests/scripts/run-integration-tests.sh
```

### Run Load Tests
```bash
./tests/scripts/run-load-tests.sh
```

### Run API Tests (Postman)
```bash
npm install -g newman
newman run tests/api/postman/user-service.postman_collection.json
```

## 📊 Test Coverage

- **User Service:** Auth, Profile Management
- **Product Service:** CRUD, Search, Filter
- **Order Service:** Order Creation, Saga Pattern
- **Inventory Service:** Stock Reservation
- **Payment Service:** Payment Processing
- **Notification Service:** Email/SMS Sending
- **Frontend:** Auth, Cart, Checkout, Orders

## 📁 Directory Structure

```
tests/
├── unit/                    # Unit tests for services
├── integration/             # Integration tests
├── api/postman/            # Postman collections
├── performance/            # Load & stress tests
│   ├── load-tests/
│   └── stress-tests/
└── scripts/                # Test execution scripts
```

## 📖 Full Documentation

See [testing_guide.md](./testing_guide.md) for complete documentation including:
- Detailed execution instructions
- Expected results
- Troubleshooting guide
- CI/CD integration examples

## ✅ Success Criteria

- ✓ 70%+ code coverage
- ✓ All integration tests pass
- ✓ p95 latency < 500ms
- ✓ Error rate < 1%
- ✓ System handles 400+ concurrent users

---

**Ready for production testing! 🎉**
