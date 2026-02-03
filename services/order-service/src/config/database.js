const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'cloudretail',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  logging: (msg) => logger.debug(msg),
  dialectOptions: process.env.DB_SSL === 'true' ? {
    ssl: {
      require: true,
      rejectUnauthorized: false // Accept self-signed certificates (AWS RDS)
    }
  } : {},
  pool: {
    max: parseInt(process.env.DB_POOL_MAX, 10) || 10,
    min: parseInt(process.env.DB_POOL_MIN, 10) || 2,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true
  }
});

module.exports = { sequelize };
