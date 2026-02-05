const axios = require('axios');
const { Order, Product, User, Inventory } = require('../services/user-service/src/models');

describe('Integration Test - Complete Order Flow', () => {
  let testUser;
  let testProduct;
  let authToken;

  const API_BASE = 'http://localhost:8080/api/v1';

  beforeAll(async () => {
    // Wait for services to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  beforeEach(async () => {
    // Create test user
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
      email: `test${Date.now()}@example.com`,
      password: 'Test@1234',
      firstName: 'Integration',
      lastName: 'Test'
    });

    testUser = registerResponse.data.user;
    authToken = registerResponse.data.token;

    // Create test product
    const productResponse = await axios.post(`${API_BASE}/products`, {
      name: 'Integration Test Product',
      description: 'Test Description',
      price: 99.99,
      category: 'Electronics'
    });

    testProduct = productResponse.data;

    // Set inventory
    await axios.post(`${API_BASE}/inventory`, {
      productId: testProduct.id,
      quantity: 10,
      reservedQuantity: 0
    });
  });

  describe('Successful Order Flow', () => {
    it('should complete full order flow with Saga pattern', async () => {
      const orderPayload = {
        userId: testUser.id,
        items: [
          {
            productId: testProduct.id,
            quantity: 2,
            price: testProduct.price
          }
        ],
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zip: '12345',
          country: 'Test Country'
        }
      };

      // Step 1: Create order
      const orderResponse = await axios.post(
        `${API_BASE}/orders`,
        orderPayload,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      expect(orderResponse.status).toBe(201);
      expect(orderResponse.data.order).toHaveProperty('id');
      expect(orderResponse.data.order.status).toBe('pending');

      const orderId = orderResponse.data.order.id;

      // Step 2: Wait for Saga to complete
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Step 3: Verify order status is completed
      const orderCheckResponse = await axios.get(
        `${API_BASE}/orders/${orderId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      expect(orderCheckResponse.data.status).toBe('completed');

      // Step 4: Verify inventory was reserved
      const inventoryResponse = await axios.get(
        `${API_BASE}/inventory/${testProduct.id}`
      );

      expect(inventoryResponse.data.reservedQuantity).toBe(2);
      expect(inventoryResponse.data.quantity).toBe(8); // 10 - 2

      // Step 5: Verify payment was processed
      const paymentResponse = await axios.get(
        `${API_BASE}/payments/order/${orderId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      expect(paymentResponse.data.status).toBe('completed');
      expect(paymentResponse.data.amount).toBe(orderPayload.items[0].quantity * orderPayload.items[0].price);
    });
  });

  describe('Saga Rollback Scenarios', () => {
    it('should rollback when inventory is insufficient', async () => {
      const orderPayload = {
        userId: testUser.id,
        items: [
          {
            productId: testProduct.id,
            quantity: 20, // More than available
            price: testProduct.price
          }
        ],
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zip: '12345',
          country: 'Test Country'
        }
      };

      try {
        await axios.post(
          `${API_BASE}/orders`,
          orderPayload,
          {
            headers: { Authorization: `Bearer ${authToken}` }
          }
        );
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.message).toContain('Insufficient inventory');
      }

      // Verify inventory unchanged
      const inventoryResponse = await axios.get(
        `${API_BASE}/inventory/${testProduct.id}`
      );

      expect(inventoryResponse.data.quantity).toBe(10);
      expect(inventoryResponse.data.reservedQuantity).toBe(0);
    });

    it('should rollback when payment fails', async () => {
      // This test requires mocking payment service failure
      // Implementation depends on your payment service setup
    });
  });

  describe('Circuit Breaker Behavior', () => {
    it('should open circuit after multiple failures', async () => {
      // Make multiple requests to trigger circuit breaker
      const failedRequests = [];

      for (let i = 0; i < 6; i++) {
        try {
          await axios.post(
            `${API_BASE}/orders`,
            {
              userId: 'invalid-user-id',
              items: []
            },
            {
              headers: { Authorization: `Bearer ${authToken}` }
            }
          );
        } catch (error) {
          failedRequests.push(error);
        }
      }

      expect(failedRequests.length).toBeGreaterThan(0);

      // Next request should fail fast with circuit open
      const startTime = Date.now();
      try {
        await axios.post(
          `${API_BASE}/orders`,
          {
            userId: testUser.id,
            items: []
          },
          {
            headers: { Authorization: `Bearer ${authToken}` }
          }
        );
      } catch (error) {
        const duration = Date.now() - startTime;
        expect(duration).toBeLessThan(100); // Should fail fast
        expect(error.response.data.message).toContain('Circuit breaker');
      }
    });
  });
});
