'use strict';
const authController = require('../controllers/auth.controller')
const {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
} = require('./schemas/auth.schema');

async function authRoutes(fastify, options) {
  const { verifyToken } = fastify.auth;

  // Public routes
  fastify.post('/register', {
    schema: registerSchema
  }, authController.register.bind(authController));

  fastify.post('/login', {
    schema: loginSchema
  }, authController.login.bind(authController));

  fastify.post('/refresh-token', {
    schema: refreshTokenSchema
  }, authController.refreshToken.bind(authController));

  fastify.post('/logout', {
    schema: logoutSchema,
    preHandler: [verifyToken]
  }, authController.logout.bind(authController));


}

module.exports = authRoutes;