const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const { sequelize } = require('./config/database');
const { redisClient } = require('./config/redis');
const logger = require('./utils/logger');
const inventoryRoutes = require('./routes/inventory.routes');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'inventory-service' });
});

app.use('/api/v1/inventory', inventoryRoutes);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    await redisClient.connect();
    if (process.env.NODE_ENV === 'development') await sequelize.sync({ alter: true });
    app.listen(PORT, () => logger.info(`Inventory Service on port ${PORT}`));
  } catch (error) {
    logger.error('Start error:', error);
    process.exit(1);
  }
};

startServer();
