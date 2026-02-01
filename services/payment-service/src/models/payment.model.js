const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  orderId: { type: DataTypes.UUID, allowNull: false },
  userId: { type: DataTypes.UUID, allowNull: false },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  currency: { type: DataTypes.STRING, defaultValue: 'USD' },
  status: { 
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'refunded'), 
    defaultValue: 'pending' 
  },
  stripePaymentId: { type: DataTypes.STRING, allowNull: true },
  paymentMethod: { type: DataTypes.STRING, allowNull: true },
  failureReason: { type: DataTypes.TEXT, allowNull: true }
}, { tableName: 'payments' });

module.exports = { Payment };
