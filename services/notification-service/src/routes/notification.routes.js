const express = require('express');
const eventConsumer = require('../consumers/event.consumer');
const logger = require('../utils/logger');

const router = express.Router();

// Manual notification endpoint (for testing)
router.post('/send', async (req, res) => {
  try {
    const { type, to, data } = req.body;

    let result;
    switch (type) {
      case 'email':
        result = await eventConsumer.sendEmail({
          to,
          subject: data.subject,
          template: data.template,
          data: data.templateData
        });
        break;
      case 'sms':
        result = await eventConsumer.sendSMS({
          to,
          message: data.message
        });
        break;
      default:
        return res.status(400).json({ message: 'Invalid notification type' });
    }

    res.json({ message: 'Notification sent successfully', result });
  } catch (error) {
    logger.error('Send notification error:', error);
    res.status(500).json({ message: 'Failed to send notification' });
  }
});

// Webhook endpoint for EventBridge (in production)
router.post('/webhook/events', async (req, res) => {
  try {
    const event = req.body;
    
    logger.info(`Received event: ${event.DetailType}`);

    switch (event.DetailType) {
      case 'order.confirmed':
        await eventConsumer.handleOrderConfirmed(event);
        break;
      case 'payment.completed':
        await eventConsumer.handlePaymentCompleted(event);
        break;
      case 'order.failed':
        await eventConsumer.handleOrderFailed(event);
        break;
      default:
        logger.warn(`Unhandled event type: ${event.DetailType}`);
    }

    res.json({ message: 'Event processed successfully' });
  } catch (error) {
    logger.error('Process event error:', error);
    res.status(500).json({ message: 'Failed to process event' });
  }
});

module.exports = router;
