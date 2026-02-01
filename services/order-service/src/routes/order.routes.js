const express = require('express');
const { body } = require('express-validator');
const orderController = require('../controllers/order.controller');

const router = express.Router();

const orderValidation = [
  body('userId').isUUID().withMessage('Valid user ID is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId').isUUID().withMessage('Valid product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.price').isFloat({ min: 0 }).withMessage('Price must be positive'),
  body('shippingAddress').isObject().withMessage('Shipping address is required')
];

router.post('/', orderValidation, orderController.createOrder);
router.get('/:id', orderController.getOrderById);
router.get('/user/:userId', orderController.getUserOrders);
router.put('/:id/cancel', orderController.cancelOrder);

module.exports = router;
