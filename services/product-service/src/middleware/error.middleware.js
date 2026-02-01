const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Error:', { message: err.message, stack: err.stack, path: req.path });
  
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      message: 'Validation error',
      errors: err.errors.map(e => ({ field: e.path, message: e.message }))
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ message: 'Resource already exists' });
  }

  res.status(err.status || 500).json({
    message: err.message || 'Internal server error'
  });
};

module.exports = errorHandler;
