const logger = require('../utils/logger');

/**
 * Event Consumer for Notification Service
 * Listens to EventBridge events and triggers notifications
 * 
 * In production, this would use AWS Lambda or SQS
 * For demo, we simulate event consumption
 */

class EventConsumer {
  start() {
    logger.info('Event consumer started - listening for events');
    
    // In production, this would be:
    // 1. AWS Lambda triggered by EventBridge
    // 2. SQS queue consumer
    // 3. EventBridge rule with target
    
    // For demo purposes, we log that we're ready to consume events
    logger.info('Ready to process: order.confirmed, payment.completed, order.failed events');
  }

  async handleOrderConfirmed(event) {
    const { orderId, userId, totalAmount } = event.detail;
    
    logger.info(`Sending order confirmation email for order ${orderId}`);
    
    // Simulate email sending
    await this.sendEmail({
      to: userId,
      subject: 'Order Confirmed',
      template: 'order-confirmation',
      data: { orderId, totalAmount }
    });
    
    // Simulate SMS if enabled
    if (process.env.ENABLE_SMS_NOTIFICATIONS === 'true') {
      await this.sendSMS({
        to: userId,
        message: `Your order ${orderId} has been confirmed!`
      });
    }
  }

  async handlePaymentCompleted(event) {
    const { orderId, paymentId, amount } = event.detail;
    
    logger.info(`Sending payment confirmation for order ${orderId}`);
    
    await this.sendEmail({
      to: event.userId,
      subject: 'Payment Received',
      template: 'payment-confirmation',
      data: { orderId, paymentId, amount }
    });
  }

  async handleOrderFailed(event) {
    const { orderId, reason } = event.detail;
    
    logger.info(`Sending order failure notification for order ${orderId}`);
    
    await this.sendEmail({
      to: event.userId,
      subject: 'Order Processing Failed',
      template: 'order-failed',
      data: { orderId, reason }
    });
  }

  async sendEmail({ to, subject, template, data }) {
    // In production: AWS SES integration
    // const ses = new AWS.SES();
    // await ses.sendTemplatedEmail({ ... });
    
    logger.info(`[EMAIL] To: ${to}, Subject: ${subject}, Template: ${template}`, data);
    return { success: true, messageId: `email_${Date.now()}` };
  }

  async sendSMS({ to, message }) {
    // In production: AWS SNS integration
    // const sns = new AWS.SNS();
    // await sns.publish({ PhoneNumber: to, Message: message });
    
    logger.info(`[SMS] To: ${to}, Message: ${message}`);
    return { success: true, messageId: `sms_${Date.now()}` };
  }
}

module.exports = new EventConsumer();
