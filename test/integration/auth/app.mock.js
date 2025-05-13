'use strict';

const Fastify = require('fastify');
const fastifyCookie = require('@fastify/cookie'); 

function buildTestApp(options = {}) {
  const app = Fastify({
    logger: options.logger !== undefined ? options.logger : false
  });


  app.register(fastifyCookie, {
  secret: 'test-secret', // for signed cookies if needed
  parseOptions: {}       // optional: customize parsing behavior
});


  // JSON parser
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
    if (!body || body.length === 0) {
      done(null, {});
      return;
    } 
    try {
      const json = JSON.parse(body);
      done(null, json);
    } catch (err) {
      done(new Error('Invalid JSON'), undefined);
    }
  });

  app.setValidatorCompiler(() => () => ({ value: true }));

  app.setErrorHandler((error, request, reply) => {
    app.log.error(error);
    reply.status(500).send({
      success: false,
      message: 'Internal server error'
    });
  });

  app.register(async function(fastify) {
    fastify.post('/register', async (request, reply) => {
      try {
        const result = await fastify.authService.register(request.body);
        if (!result.success) {
          return reply.code(400).send(result);
        }
        return reply.code(201).send(result);
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ success: false, message: 'Internal server error' });
      }
    });

    fastify.post('/login', async (request, reply) => {
      try {
        const { username, password } = request.body;
        const result = await fastify.authService.login(fastify.server, username, password);
        if (!result.success) {
          return reply.code(401).send(result);
        }

        reply.setCookie('refreshToken', result.tokens.refreshToken, {
          path: '/',
          httpOnly: true
        });

        return reply.code(200).send({
          success: true,
          accessToken: result.tokens.accessToken,
          expiresIn: result.tokens.expiresIn,
          user: result.user
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ success: false, message: 'Internal server error' });
      }
    });

    fastify.post('/refresh-token', async (request, reply) => {
      try {
        const refreshToken = request.body.refreshToken ||
          (request.headers.cookie && request.headers.cookie.match(/refreshToken=([^;]+)/)?.[1]);
        
        if (!refreshToken) {
          return reply.code(400).send({ success: false, message: 'Refresh token is required' });
        }

        const result = await fastify.authService.refreshToken(fastify.server, refreshToken);
        if (!result.success) {
          return reply.code(401).send(result);
        }

        return reply.code(200).send({
          success: true,
          accessToken: result.accessToken,
          expiresIn: result.expiresIn
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ success: false, message: 'Internal server error' });
      }
    });

    fastify.post('/logout', async (request, reply) => {
      try {
        const refreshToken = request.body.refreshToken ||
          (request.headers.cookie && request.headers.cookie.match(/refreshToken=([^;]+)/)?.[1]);
        
        if (!refreshToken) {
          return reply.code(400).send({ success: false, message: 'Refresh token is required' });
        }

        const result = await fastify.authService.logout(refreshToken);
        if (!result.success) {
          return reply.code(400).send(result);
        }

        reply.clearCookie('refreshToken', { path: '/' });

        return reply.code(200).send({
          success: true,
          message: 'Logout successful'
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ success: false, message: 'Internal server error' });
      }
    });
  }, { prefix: '/api/v1/auth' });


  if (options.customVerifyToken) {
    app.decorate('verifyToken', options.customVerifyToken);
  } else {
    app.decorate('verifyToken', (req, rep, done) => {
      req.user = { id: 1 };
      done();
    });
  }

  // Mock authService
  app.decorate('authService', require('../../../src/api/v1/services/auth.service'));

  return app;
}

module.exports = buildTestApp;
