'use strict';

const Fastify = require('fastify');
const attendanceRoutes = require('../../../src/api/v1/routes/attendance.routes');


function buildTestApp(options = {}) {
  const app = Fastify({ logger: options.logger ?? false });

  // disable schema validation
  app.setValidatorCompiler(() => {
  return (data) => ({ value: data, error: null });
});
  // accept empty bodies
  app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (req, body, done) => {
    if (!body || body.length === 0) return done(null, {});
    try { done(null, JSON.parse(body.toString())); }
    catch (err) { done(err, undefined); }
  });

  
  app.decorate('auth', {
    verifyToken: options.customVerify ?? ((req, reply, done) => {
      
      req.user = { id: 1, role: 'employee' };
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
    await attendanceRoutes(fastify);
  }, { prefix: '/api/v1/attendance' });

  return app;
}

module.exports = buildTestApp;
