const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CloudRetail Product Service API',
      version: '1.0.0',
      description: 'API for managing products and categories in the CloudRetail microservices ecosystem.',
    },
    servers: [
      {
        url: 'http://localhost:8080/api/v1/products',
        description: 'Via API Gateway',
      },
      {
        url: 'http://localhost:3002/api/v1',
        description: 'Direct Service Access',
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Path to the API docs
};

const specs = swaggerJsDoc(options);

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
};

module.exports = setupSwagger;
