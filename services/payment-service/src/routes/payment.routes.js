const express = require('express');
const { Payment } = require('../models/payment.model');
const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');
const logger = require('../utils/logger');

const router = express.Router();
const eventBridge = new EventBridgeClient({ region: process.env.AWS_REGION || 'us-east-1', endpoint: process.env.EVENTBRIDGE_ENDPOINT });

// Process payment (called by Order Service Saga)
router.post('/process', async (req, res) => {
  try {
    const { orderId, amount, userId } = req.body;

    // Create payment record
    const payment = await Payment.create({
      orderId,
      userId,
      amount,
      status: 'processing'
    });

    // Simulate Stripe payment processing
    // In production: const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const paymentIntent = await stripe.paymentIntents.create({ amount: amount * 100, currency: 'usd' });
    
    const simulatedSuccess = Math.random() > 0.1; // 90% success rate for demo
    
    if (simulatedSuccess) {
      payment.status = 'completed';
      payment.stripePaymentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await payment.save();

      // Publish event
      /*
      await eventBridge.send(new PutEventsCommand({
        Entries: [{
          Source: 'payment-service',
          DetailType: 'payment.completed',
          Detail: JSON.stringify({ orderId, paymentId: payment.id, amount }),
          EventBusName: process.env.EVENTBRIDGE_BUS_NAME || 'cloudretail-event-bus'
        }]
      }));
      */
      logger.info(`(Simulated) Event published: payment.completed`);

      logger.info(`Payment completed for order ${orderId}`);
      res.json({ message: 'Payment processed successfully', paymentId: payment.id, stripePaymentId: payment.stripePaymentId });
    } else {
      payment.status = 'failed';
      payment.failureReason = 'Simulated payment failure';
      await payment.save();

      logger.error(`Payment failed for order ${orderId}`);
      res.status(400).json({ message: 'Payment processing failed' });
    }
  } catch (error) {
    logger.error('Process payment error:', error);
    res.status(500).json({ message: 'Payment processing error' });
  }
});

// Refund payment (compensation in Saga)
router.post('/refund', async (req, res) => {
  try {
    const { paymentId, orderId } = req.body;

    const payment = await Payment.findByPk(paymentId);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    // Simulate Stripe refund
    // In production: await stripe.refunds.create({ payment_intent: payment.stripePaymentId });

    payment.status = 'refunded';
    await payment.save();

    /*
    await eventBridge.send(new PutEventsCommand({
      Entries: [{
        Source: 'payment-service',
        DetailType: 'payment.refunded',
        Detail: JSON.stringify({ orderId, paymentId }),
        EventBusName: process.env.EVENTBRIDGE_BUS_NAME || 'cloudretail-event-bus'
      }]
    }));
    */
    logger.info(`(Simulated) Event published: payment.refunded`);

    logger.info(`Payment refunded for order ${orderId}`);
    res.json({ message: 'Payment refunded successfully' });
  } catch (error) {
    logger.error('Refund payment error:', error);
    res.status(500).json({ message: 'Refund processing error' });
  }
});

// Get payment details
router.get('/:id', async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json({ payment });
  } catch (error) {
    logger.error('Get payment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
