'use strict'

const userController = require('../controllers/user.controller')

const {
    createUserSchema,
    updateUserSchema,
    getUserSchema,
    getAllUsersSchema,
    deleteUserSchema
} = require('./schemas/user.schema')

async function userRoutes(fastify, options) {
    const { verifyToken } = fastify.auth
    const { checkRole } = fastify.role

    fastify.get('/', {
        schema: getAllUsersSchema,
        // preHandler: [verifyToken, checkRole(['admin', 'manager'])]
        preHandler: [verifyToken, checkRole(['admin'])]
    }, userController.getAllUsers.bind(userController))

    fastify.get('/:id', {
        schema: getUserSchema,
        preHandler: [verifyToken]
      }, async (request, reply) => {
        const userId = Number(request.params.id);
        const currentUser = request.user;
      
        if (currentUser.role === 'admin' || currentUser.role === 'manager' || currentUser.id === userId) {
          return userController.getUserById(request, reply);
        }
      
        return reply.code(403).send({ success: false, message: 'Access forbidden' });
    });

    fastify.post('/', {
        schema: createUserSchema,
        preHandler: [verifyToken, checkRole(['admin'])]
    }, userController.createUser.bind(userController))

    fastify.put('/:id', {
        schema: updateUserSchema,
        preHandler: [verifyToken]
    }, async (request, reply) => {
        const userId = Number(request.params.id)
        const currentUser = request.user

        if (currentUser.role === 'admin' || currentUser.id === userId) {
            if (request.body.role && currentUser.role !== 'admin') {
                delete request.body.role
            }

            return userController.updateUser(request, reply)
        }

        return reply.code(403).send({
            success: false,
            message: 'Access forbidden'
        })
    })    
    
    fastify.delete('/:id', {
        schema: deleteUserSchema,
        preHandler: [verifyToken, checkRole(['admin'])]
    }, userController.deleteUser.bind(userController))
    
}

module.exports = userRoutes