'use strict';

const Fastify = require('fastify');
const fastifyCookie = require('@fastify/cookie');
const userService = require('../../../src/api/v1/services/user.service');
const userRoutes = require('../../../src/api/v1/routes/user.routes');

function buildTestUserApp(options = {}) {
  const app = Fastify({ logger: false });

  app.register(fastifyCookie, {
    secret: 'test-secret',
  });

  // JSON parser
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
    try {
      done(null, body ? JSON.parse(body) : {});
    } catch (err) {
      done(new Error('Invalid JSON'));
    }
  });

  // Validator stub
  app.setValidatorCompiler(() => () => ({ value: true }));

  // Global error handler
  app.setErrorHandler((err, request, reply) => {
    app.log.error(err);
    reply.code(500).send({ success: false, message: 'Internal server error' });
  });

  // Mocked auth and role decorators
  app.decorate('auth', {
    verifyToken: options.customVerify || ((req, rep, done) => {
      req.user = { id: 1, role: 'admin' };
      done();
    }),
  });

  app.decorate('role', {
    checkRole: (roles) => (req, rep, done) => {
      if (roles.includes(req.user.role)) return done();
      return rep.code(403).send({ success: false, message: 'Access forbidden' });
    },
  });

  // Service injection
  app.decorate('userService', userService);

  // Register user routes
  app.register(userRoutes, { prefix: '/api/v1/users' });

  return app;
}

module.exports = buildTestUserApp;
