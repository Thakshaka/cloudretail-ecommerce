const CircuitBreaker = require('opossum');
const logger = require('./logger');

/**
 * Configure common circuit breaker options
 */
const options = {
  timeout: 5000, // If our function takes longer than 5 seconds, trigger a failure
  errorThresholdPercentage: 50, // When 50% of requests fail, open the circuit
  resetTimeout: 30000 // After 30 seconds, try again
};

/**
 * Factory function to create a circuit breaker for a service call
 * @param {Function} action - The async function to wrap
 * @param {string} serviceName - Name of the service for logging
 * @returns {CircuitBreaker}
 */
const createBreaker = (action, serviceName) => {
  const breaker = new CircuitBreaker(action, options);

  // Success event
  breaker.on('success', (result) => {
    // logger.debug(`${serviceName} call succeeded`);
  });

  // Failure event
  breaker.on('failure', (error) => {
    logger.error(`${serviceName} call failed:`, error.message);
  });

  // Circuit Open event
  breaker.on('open', () => {
    logger.warn(`CIRCUIT BREAKER: The circuit for ${serviceName} is now OPEN! Subsequent calls will fail fast.`);
  });

  // Circuit Half-Open event
  breaker.on('halfOpen', () => {
    logger.info(`CIRCUIT BREAKER: Testing ${serviceName} - The circuit is now HALF-OPEN.`);
  });

  // Circuit Closed event
  breaker.on('close', () => {
    logger.info(`CIRCUIT BREAKER: ${serviceName} is back online! The circuit is now CLOSED.`);
  });

  // Fallback
  breaker.fallback(() => {
    logger.error(`CIRCUIT BREAKER: ${serviceName} is currently unavailable (Circuit Open/Timed Out).`);
    throw new Error(`${serviceName} is currently unavailable. Please try again later.`);
  });

  return breaker;
};

module.exports = { createBreaker };
