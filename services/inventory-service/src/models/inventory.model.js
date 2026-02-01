const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Inventory = sequelize.define('Inventory', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  productId: { type: DataTypes.UUID, allowNull: false, unique: true },
  warehouseId: { type: DataTypes.UUID, allowNull: false },
  availableStock: { type: DataTypes.INTEGER, defaultValue: 0, validate: { min: 0 } },
  reservedStock: { type: DataTypes.INTEGER, defaultValue: 0, validate: { min: 0 } },
  totalStock: { type: DataTypes.INTEGER, defaultValue: 0 }
}, { tableName: 'inventory' });

const Reservation = sequelize.define('Reservation', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  productId: { type: DataTypes.UUID, allowNull: false },
  orderId: { type: DataTypes.UUID, allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.ENUM('reserved', 'released', 'confirmed'), defaultValue: 'reserved' }
}, { tableName: 'reservations' });

module.exports = { Inventory, Reservation };
