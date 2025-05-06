'use strict';

const fp = require('fastify-plugin');
const { drizzle } = require('drizzle-orm/node-postgres');
const { Pool } = require('pg');

async function dbPlugin(fastify, options) {
  // Create PostgreSQL connection pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20
  });

  // Test the connection
  try {
    const client = await pool.connect();
    client.release();
    fastify.log.info('Database connection established');
  } catch (err) {
    fastify.log.error('Error connecting to database', err);
    throw err;
  }

  // Initialize Drizzle ORM
  const db = drizzle(pool);

  // Decorate Fastify with the database client
  fastify.decorate('db', db);

  // Close pool on Fastify close hook
  fastify.addHook('onClose', async (instance) => {
    instance.log.info('Closing database connections');
    await pool.end();
  });
}

module.exports = fp(dbPlugin, {
  name: 'db-plugin',
  dependencies: []
});