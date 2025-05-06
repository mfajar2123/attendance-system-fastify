'use strict';

function authMiddleware(fastify) {
  return {
    verifyToken: async (request, reply) => {
      try {
        // Use the fastify-jwt plugin to verify the token
        await request.jwtVerify();
      } catch (err) {
        reply.code(401).send({
          success: false,
          message: 'Unauthorized: Invalid or expired token'
        });
      }
    }
  };
}

module.exports = authMiddleware;