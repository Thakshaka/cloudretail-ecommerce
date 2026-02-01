const { createClient } = require('redis');
const logger = require('../utils/logger');
const redisClient = createClient({
  socket: { host: process.env.REDIS_HOST || 'localhost', port: process.env.REDIS_PORT || 6379 }
});
redisClient.on('error', (err) => logger.error('Redis Error:', err));
module.exports = { redisClient };
