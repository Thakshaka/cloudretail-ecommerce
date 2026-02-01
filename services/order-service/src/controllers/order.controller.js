const { validationResult } = require('express-validator');
const { Order, OrderItem } = require('../models/order.model');
const orderSaga = require('../sagas/order.saga');
const logger = require('../utils/logger');

class OrderController {
  async createOrder(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { userId, items, shippingAddress } = req.body;

      // Execute Saga
      const order = await orderSaga.executeOrderSaga({ userId, items, shippingAddress });

      res.status(201).json({
        message: 'Order created successfully',
        order: await Order.findByPk(order.id, { include: [{ model: OrderItem, as: 'items' }] })
      });
    } catch (error) {
      logger.error('Create order error:', error);
      res.status(500).json({ message: error.message || 'Failed to create order' });
    }
  }

  async getOrderById(req, res) {
    try {
      const { id } = req.params;

      const order = await Order.findByPk(id, {
        include: [{ model: OrderItem, as: 'items' }]
      });

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      res.status(200).json({ order });
    } catch (error) {
      logger.error('Get order error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async getUserOrders(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const { count, rows: orders } = await Order.findAndCountAll({
        where: { userId },
        include: [{ model: OrderItem, as: 'items' }],
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
        order: [['createdAt', 'DESC']]
      });

      res.status(200).json({
        orders,
        pagination: {
          total: count,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          totalPages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      logger.error('Get user orders error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  async cancelOrder(req, res) {
    try {
      const { id } = req.params;

      const order = await Order.findByPk(id);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      if (!['pending', 'payment_processing'].includes(order.status)) {
        return res.status(400).json({ message: 'Order cannot be cancelled' });
      }

      // Trigger compensation
      await orderSaga.compensate(order, new Error('User cancelled'));

      res.status(200).json({ message: 'Order cancelled successfully' });
    } catch (error) {
      logger.error('Cancel order error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}

module.exports = new OrderController();
