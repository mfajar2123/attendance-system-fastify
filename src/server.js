'use strict';

const buildApp = require('./app');
const { testConnection } = require('./db/connection');
const dotenv = require('dotenv');
const { loggerConfig, LOG_LEVEL } = require('./utils/logger');

dotenv.config();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

const app = buildApp({ logger: loggerConfig });

async function start() {
  try {
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('Failed to connect to database. Please check your database configuration.');
      process.exit(1);
    }

    await app.listen({ port: PORT, host: HOST });
    
    if (process.env.NODE_ENV === 'development') {
      app.printRoutes();
    }
    
    if (process.env.NODE_ENV === 'development') {
      // console.log(`API documentation available at http://${HOST}:${PORT}/documentation`);
    }
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await app.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  await app.close();
  process.exit(0);
});

if (require.main === module) {
  start();
}

module.exports = { app, start };