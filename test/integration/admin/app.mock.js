'use strict';

const Fastify = require('fastify');
const adminRoutes = require('../../../src/api/v1/routes/admin.routes');


function buildTestApp(options = {}) {
  const app = Fastify({ logger: options.logger ?? false });

  app.setValidatorCompiler(() => ({ value, error: null }));
  
  app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (req, body, done) => {
    if (!body || body.length === 0) return done(null, {});
    try { done(null, JSON.parse(body.toString())); }
    catch (err) { done(err, undefined); }
  });
  
  app.decorate('auth', {
    verifyToken: options.customVerify ?? ((req, reply, done) => {
   
      req.user = { id: 1, role: 'admin' };
      done();
    })
  });
  app.decorate('role', {
    checkRole: roles => (req, reply, done) => {
      if (!roles.includes(req.user.role)) {
        return reply.code(403).send({ success: false, message: 'Access forbidden' });
      }
      done();
    }
  });

  app.register(async fastify => {
    await adminRoutes(fastify);
  }, { prefix: '/api/v1/admin' });

  return app;
}

module.exports = buildTestApp;