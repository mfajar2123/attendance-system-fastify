'use strict';

const fastify = require('fastify');
const dotenv = require('dotenv');


dotenv.config();

// const jwtPlugin = require('./plugins/jwt');
// const dbPlugin = require('./plugins/db');
// const schedulerPlugin = require('./plugins/scheduler');

// const authRoutes = require('./routes/v1/auth.routes');
// const userRoutes = require('./routes/v1/user.routes');
// const attendanceRoutes = require('./routes/v1/attendance.routes');
// const dashboardRoutes = require('./routes/v1/dashboard.routes');


function buildApp(options = {}) {
  const app = fastify({
    ...options
  });
  
  app.register(require('@fastify/cors'), {
    origin: process.env.CORS_ORIGIN || true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
  });

  // Register rate limiter
  // app.register(require('@fastify/rate-limit'), {
  //   max: 100,
  //   timeWindow: '1 minute'
  // });

  // Register plugins
  // app.register(jwtPlugin);
  // app.register(dbPlugin);
  // app.register(schedulerPlugin);

  if (process.env.NODE_ENV === 'development') {
    app.register(require('@fastify/swagger'), {
      routePrefix: '/documentation',
      swagger: {
        info: {
          title: 'Presensi API',
          description: 'API documentation for Presensi attendance system',
          version: '1.0.0'
        },
        externalDocs: {
          url: 'https://swagger.io',
          description: 'Find more info here'
        },
        host: `localhost:${process.env.PORT || 3000}`,
        schemes: ['http'],
        consumes: ['application/json'],
        produces: ['application/json']
      },
      exposeRoute: true
    });
  }

  app.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  const apiPrefix = '/api/v1';

  // Register routes
  // app.register(authRoutes, { prefix: `${apiPrefix}/auth` });
  // app.register(userRoutes, { prefix: `${apiPrefix}/users` });
  // app.register(attendanceRoutes, { prefix: `${apiPrefix}/attendance` });
  // app.register(dashboardRoutes, { prefix: `${apiPrefix}/admin/dashboard` });

  // Global error handler
  app.setErrorHandler((error, request, reply) => {
    const statusCode = error.statusCode || 500;
    
    // Don't log 404 errors as they're common
    if (statusCode !== 404) {
      request.log.error(error);
    }

    // Handle validation errors
    if (error.validation) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: error.message,
        validation: error.validation
      });
    }

    // Send appropriate error response
    reply.status(statusCode).send({
      statusCode,
      error: error.name || 'Internal Server Error',
      message: statusCode === 500 && process.env.NODE_ENV === 'production' 
        ? 'An internal server error occurred'
        : error.message
    });
  });

  // Not found handler
  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: `Route ${request.method}:${request.url} not found`
    });
  });

  return app;
}

module.exports = buildApp;