'use strict'

const userService = require('../services/user.service')

class UserController {
    async getAllUsers(request, reply) {
        try {
            const users = await userService.getAllUsers()
            reply.code(200).send({ success: true, data: users })
        } catch (error) {
            request.log.error(error)
            reply.code(500).send({ success: false, message: 'Failed to retrieve users' })
        }
    }

    async getUserById(request, reply) {
        try {
            const id = Number(request.params.id)
            const user = await userService.getUserById(id)
            
            if (!user) {
                return reply.code(404).send({
                    success: false,
                    message: 'User not found'
                })
            }

            return reply.code(200).send({
                success: true,
                data: user
            })
        } catch (error) {
            request.log.error(error)
            reply.code(500).send({
                success: false,
                message: 'Failed to retrieve user'
            })
        }
    }

    async createUser(request, reply) {
        try {
            const userData = request.body

            const existingEmail = await userService.getUserByEmail(userData.email)
            if (existingEmail) {
                return reply.code(409).send({
                    success: false,
                    message: 'Email already in use'
                }) 
            }

            const existingUsername = await userService.getUserByUsername(userData.username)
            if (existingUsername) {
                return reply.code(409).send({
                    success: false,
                    message: 'Username already taken'
                })
            }

            const newUser = await userService.createUser(userData)
            delete newUser.password

            return reply.code(201).send({
                success: true,
                message: 'User created successfully',
                data: newUser
            })
        } catch (error) {
            request.log.error(error)
            return reply.code(500).send({
                success: false,
                message: 'Failed to create user'
            })
        }
    }

    async updateUser(request, reply) {
        try {
            const id = Number(request.params.id)
            const userData = request.body

            const existingUser = await userService.getUserById(id)
            if (!existingUser) {
                return reply.code(404).send({
                    success: false,
                    message: 'User not found'
                })            
            }

            if (userData.email && userData.email !== existingUser.email) {
                const emailExists = await userService.getUserByEmail(userData.email)
                if(emailExists) {
                    return reply.code(409).send({
                        success: false,
                        message: 'Email already in use'
                    })
                }
            }

            if (userData.username && userData.username !== existingUser.username) {
                const usernameExists = await userService.getUserByUsername(userData.username)
                if(usernameExists) {
                    return reply.code(409).send({
                        success: false,
                        message: 'Username already taken'
                    })
                }
            }

            const updatedUser = await userService.updateUser(id, userData)
            delete updatedUser.password

            return reply.code(200).send({
                success: true,
                message: 'User updated successfully',
                data: updatedUser
            })
        } catch (error) {
            request.log.error(error)
            return reply.code(500).send({
                success: false,
                message: 'Failed to update user'
            })
            
        }
    }

    async deleteUser(request, reply) {
        try {
            const id = Number(request.params.id)
            const existingUser = await userService  .getUserById(id)
            if (!existingUser) {
                return reply.code(404).send({
                    success: false,
                    message: 'User not found'
                })
            }
            
            await userService.deleteUser(id)

            return reply.code(200).send({
                success: true,
                message: 'User deleted successfully'
            })
        } catch (error) {
            request.log.error(error)
            return reply.code(500).send({
                success: false,
                message: 'Failed to delete user'
            })
        }
    }
}

module.exports = new UserController();