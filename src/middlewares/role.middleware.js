'use strict';


function roleMiddleware(fastify) {
  return {
   
    checkRole: (allowedRoles) => {
      return async (request, reply) => {
        // User must be authenticated first
        const { role } = request.user;
        
        if (!role || !allowedRoles.includes(role)) {
          return reply.code(403).send({
            success: false,
            message: `Access forbidden: Requires ${allowedRoles.join(' or ')} role`
          });
        }
      };
    }
  };
}

module.exports = roleMiddleware;