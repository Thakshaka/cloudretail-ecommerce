const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const { sequelize } = require('./config/database');
const logger = require('./utils/logger');
const paymentRoutes = require('./routes/payment.routes');

const app = express();
const PORT = process.env.PORT || 3005;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'payment-service' });
});

app.use('/api/v1/payments', paymentRoutes);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    if (process.env.NODE_ENV === 'development') await sequelize.sync({ alter: true });
    app.listen(PORT, () => logger.info(`Payment Service on port ${PORT}`));
  } catch (error) {
    logger.error('Start error:', error);
    process.exit(1);
  }
};

startServer();
