const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');
const axios = require('axios');
const { Order, OrderItem } = require('../models/order.model');
const logger = require('../utils/logger');
const { createBreaker } = require('../utils/circuit-breaker');

// Configure EventBridge client for LocalStack
const eventBridgeConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.EVENTBRIDGE_ENDPOINT || undefined
};

// Add dummy credentials for LocalStack if endpoint is set
if (process.env.EVENTBRIDGE_ENDPOINT) {
  eventBridgeConfig.credentials = {
    accessKeyId: 'test',
    secretAccessKey: 'test'
  };
}

const eventBridgeClient = new EventBridgeClient(eventBridgeConfig);

/**
 * Saga Pattern Implementation for Order Processing
 * 
 * Steps:
 * 1. Create Order (pending)
 * 2. Reserve Inventory -> Inventory Service
 * 3. Process Payment -> Payment Service
 * 4. Confirm Order
 * 5. Send Notification -> Notification Service
 * 
 * Compensating Transactions:
 * - If payment fails: Release inventory
 * - If inventory unavailable: Cancel order
 */

class OrderSaga {
  constructor() {
    this._inventoryBreaker = null;
    this._paymentBreaker = null;
  }

  get inventoryBreaker() {
    if (!this._inventoryBreaker) {
      this._inventoryBreaker = createBreaker(this.reserveInventoryAction.bind(this), 'InventoryService');
    }
    return this._inventoryBreaker;
  }

  get paymentBreaker() {
    if (!this._paymentBreaker) {
      this._paymentBreaker = createBreaker(this.processPaymentAction.bind(this), 'PaymentService');
    }
    return this._paymentBreaker;
  }

  async executeOrderSaga(orderData) {
    const { userId, items, shippingAddress } = orderData;
    let order = null;

    try {
      // Step 1: Create Order
      order = await this.createOrder(userId, items, shippingAddress);
      logger.info(`Saga started for order ${order.id}`);

      // Step 2: Reserve Inventory
      await this.inventoryBreaker.fire(order);
      order.sagaState = 'inventory_reserved';
      await order.save();
      logger.info(`Inventory reserved for order ${order.id}`);

      // Step 3: Process Payment
      order.sagaState = 'payment_processing';
      order.status = 'payment_processing';
      await order.save();

      const paymentResult = await this.paymentBreaker.fire(order);
      order.paymentId = paymentResult.paymentId;
      order.status = 'payment_completed';
      await order.save();
      logger.info(`Payment completed for order ${order.id}`);

      // Step 4: Confirm Order
      order.status = 'confirmed';
      order.sagaState = 'completed';
      await order.save();

      // Step 5: Publish order confirmed event
      await this.publishEvent('order.confirmed', {
        orderId: order.id,
        userId: order.userId,
        totalAmount: order.totalAmount,
        items: await order.getItems()
      });

      logger.info(`Saga completed successfully for order ${order.id}`);
      return order;

    } catch (error) {
      logger.error(`Saga failed for order ${order?.id}:`, error);
      
      // Execute compensating transactions
      if (order) {
        await this.compensate(order, error);
      }
      
      throw error;
    }
  }

  async createOrder(userId, items, shippingAddress) {
    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const order = await Order.create({
      userId,
      totalAmount,
      shippingAddress,
      status: 'pending',
      sagaState: 'started'
    });

    // Create order items
    for (const item of items) {
      await OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price
      });
    }

    return order;
  }

  async reserveInventoryAction(order) {
    const items = await order.getItems();
    const inventoryServiceUrl = process.env.INVENTORY_SERVICE_URL || 'http://inventory-service:3003';
    
    for (const item of items) {
      await axios.post(`${inventoryServiceUrl}/api/v1/inventory/reserve`, {
        productId: item.productId,
        quantity: item.quantity,
        orderId: order.id
      });
    }

    // Publish event
    await this.publishEvent('inventory.reserved', {
      orderId: order.id,
      items: items.map(i => ({ productId: i.productId, quantity: i.quantity }))
    });
  }

  async processPaymentAction(order) {
    const paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3005';
    
    const response = await axios.post(`${paymentServiceUrl}/api/v1/payments/process`, {
      orderId: order.id,
      amount: order.totalAmount,
      userId: order.userId
    });

    // Publish event
    await this.publishEvent('payment.completed', {
      orderId: order.id,
      paymentId: response.data.paymentId,
      amount: order.totalAmount
    });

    return response.data;
  }

  async reserveInventory(order) {
    // This is now handled by the breaker, but we keep the method for compatibility or internal logic
    return this.inventoryBreaker.fire(order);
  }

  async processPayment(order) {
    // This is now handled by the breaker, but we keep the method for compatibility or internal logic
    return this.paymentBreaker.fire(order);
  }

  async compensate(order, error) {
    logger.info(`Starting compensation for order ${order.id}`);
    order.sagaState = 'compensating';
    await order.save();

    try {
      // Release inventory if it was reserved
      if (order.sagaState === 'inventory_reserved' || order.sagaState === 'payment_processing') {
        await this.releaseInventory(order);
      }

      // Refund payment if it was processed
      if (order.paymentId) {
        await this.refundPayment(order);
      }

      order.status = 'cancelled';
      order.sagaState = 'failed';
      await order.save();

      // Publish event
      await this.publishEvent('order.failed', {
        orderId: order.id,
        reason: error.message
      });

      logger.info(`Compensation completed for order ${order.id}`);

    } catch (compensationError) {
      logger.error(`Compensation failed for order ${order.id}:`, compensationError);
      // In production, this would trigger manual intervention
    }
  }

  async releaseInventory(order) {
    const items = await order.getItems();
    const inventoryServiceUrl = process.env.INVENTORY_SERVICE_URL || 'http://inventory-service:3003';
    
    for (const item of items) {
      try {
        await axios.post(`${inventoryServiceUrl}/api/v1/inventory/release`, {
          productId: item.productId,
          quantity: item.quantity,
          orderId: order.id
        });
      } catch (error) {
        logger.error(`Failed to release inventory for product ${item.productId}:`, error);
      }
    }

    await this.publishEvent('inventory.released', {
      orderId: order.id,
      items: items.map(i => ({ productId: i.productId, quantity: i.quantity }))
    });
  }

  async refundPayment(order) {
    const paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3005';
    
    try {
      await axios.post(`${paymentServiceUrl}/api/v1/payments/refund`, {
        paymentId: order.paymentId,
        orderId: order.id
      });

      await this.publishEvent('payment.refunded', {
        orderId: order.id,
        paymentId: order.paymentId
      });

    } catch (error) {
      logger.error(`Failed to refund payment ${order.paymentId}:`, error);
    }
  }

  async publishEvent(eventType, detail) {
    try {
      // TEMPORARILY DISABLED for testing Saga without LocalStack dependency
      /*
      const params = {
        Entries: [
          {
            Source: 'order-service',
            DetailType: eventType,
            Detail: JSON.stringify(detail),
            EventBusName: process.env.EVENTBRIDGE_BUS_NAME || 'cloudretail-event-bus'
          }
        ]
      };

      const command = new PutEventsCommand(params);
      await eventBridgeClient.send(command);
      */
      logger.info(`(Simulated) Event published: ${eventType}`, detail);
    } catch (error) {
      logger.error(`Failed to publish event ${eventType}:`, error);
    }
  }
}

module.exports = new OrderSaga();
