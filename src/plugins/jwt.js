'use strict';

const fp = require('fastify-plugin');
const jwt = require('@fastify/jwt');

async function jwtPlugin(fastify, options) {
  fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'MySuperSecretKeyForJWTs2025!!!!?'
  });
}

module.exports = fp(jwtPlugin, {
  name: 'jwt-plugin',
  dependencies: []
});