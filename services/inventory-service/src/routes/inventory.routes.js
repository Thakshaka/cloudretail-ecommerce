const express = require('express');
const { Inventory, Reservation } = require('../models/inventory.model');
const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');
const logger = require('../utils/logger');

const router = express.Router();

// Configure EventBridge client for LocalStack (no real AWS credentials needed)
const eventBridgeConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.EVENTBRIDGE_ENDPOINT
};

// Add dummy credentials for LocalStack if endpoint is set (local development)
if (process.env.EVENTBRIDGE_ENDPOINT) {
  eventBridgeConfig.credentials = {
    accessKeyId: 'test',
    secretAccessKey: 'test'
  };
}

const eventBridge = new EventBridgeClient(eventBridgeConfig);

// Get inventory for product
router.get('/:productId', async (req, res) => {
  try {
    const inventory = await Inventory.findOne({ where: { productId: req.params.productId } });
    if (!inventory) return res.status(404).json({ message: 'Inventory not found' });
    res.json({ inventory });
  } catch (error) {
    logger.error('Get inventory error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Reserve stock (called by Order Service Saga)
router.post('/reserve', async (req, res) => {
  try {
    const { productId, quantity, orderId } = req.body;
    
    const inventory = await Inventory.findOne({ where: { productId } });
    if (!inventory || inventory.availableStock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    // Update inventory
    inventory.availableStock -= quantity;
    inventory.reservedStock += quantity;
    await inventory.save();

    // Create reservation record
    await Reservation.create({ productId, orderId, quantity, status: 'reserved' });

    // Publish event
    // try {
    //   await eventBridge.send(new PutEventsCommand({
    //     Entries: [{
    //       Source: 'inventory-service',
    //       DetailType: 'inventory.reserved',
    //       Detail: JSON.stringify({ productId, orderId, quantity }),
    //       EventBusName: process.env.EVENTBRIDGE_BUS_NAME || 'cloudretail-event-bus'
    //     }]
    //   }));
    // } catch (e) {
    //   logger.warn('Failed to publish inventory.reserved event', e);
    // }

    logger.info(`Reserved ${quantity} units of product ${productId} for order ${orderId}`);
    res.json({ message: 'Stock reserved successfully', inventory });
  } catch (error) {
    logger.error('Reserve stock error:', error);
    res.status(500).json({ message: 'Failed to reserve stock' });
  }
});

// Release stock (compensation in Saga)
router.post('/release', async (req, res) => {
  try {
    const { productId, quantity, orderId } = req.body;
    
    const inventory = await Inventory.findOne({ where: { productId } });
    if (!inventory) return res.status(404).json({ message: 'Inventory not found' });

    inventory.availableStock += quantity;
    inventory.reservedStock -= quantity;
    await inventory.save();

    await Reservation.update({ status: 'released' }, { where: { orderId, productId } });

    logger.info(`Released ${quantity} units of product ${productId} for order ${orderId}`);
    res.json({ message: 'Stock released successfully' });
  } catch (error) {
    logger.error('Release stock error:', error);
    res.status(500).json({ message: 'Failed to release stock' });
  }
});

// Adjust stock (admin operation)
router.put('/:productId/adjust', async (req, res) => {
  try {
    const { quantity } = req.body;
    const inventory = await Inventory.findOne({ where: { productId: req.params.productId } });
    
    if (!inventory) {
      // Create new inventory record
      const newInventory = await Inventory.create({
        productId: req.params.productId,
        warehouseId: req.body.warehouseId || '00000000-0000-0000-0000-000000000001',
        availableStock: quantity,
        totalStock: quantity
      });
      return res.json({ message: 'Inventory created', inventory: newInventory });
    }

    inventory.availableStock += quantity;
    inventory.totalStock += quantity;
    await inventory.save();

    res.json({ message: 'Stock adjusted successfully', inventory });
  } catch (error) {
    logger.error('Adjust stock error:', error);
    res.status(500).json({ message: 'Failed to adjust stock' });
  }
});

module.exports = router;
