const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const logger = require('./utils/logger');
const notificationRoutes = require('./routes/notification.routes');
const eventConsumer = require('./consumers/event.consumer');

const app = express();
const PORT = process.env.PORT || 3006;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'notification-service' });
});

app.use('/api/v1/notifications', notificationRoutes);

const startServer = () => {
  app.listen(PORT, () => {
    logger.info(`Notification Service on port ${PORT}`);
    // Start consuming events
    eventConsumer.start();
  });
};

startServer();
