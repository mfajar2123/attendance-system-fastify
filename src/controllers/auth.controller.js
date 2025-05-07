'use strict'

const authService = require('../services/auth.service')

class AuthController {
    async register(request, reply) {
        try {
            const result = await authService.register(request.body)

            if (!result.success) {
                return reply.code(400).send(result)
            }

            return reply.code(201).send(result)
        } catch (error) {
            request.log.error(error)
            return reply.code(500).send({
                success: false,
                message: 'Internal server error'
            })
        }
    }

    async login(request, reply) {
        try {
            const { username, password } = request.body
            const result = await authService.login(request.server, username, password)

            if (!result.success) {
                return reply.code(401).send(result)
            }

            reply.setCookie('refreshToken', result.tokens.refreshToken, {
                path: '/api/v1/auth/refresh-token',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60 // dalam detik

            })

            return reply.send({
                success: true,
                user: result.user,
                accessToken: result.tokens.accessToken,
                expiresIn: result.tokens.expiresIn
            })
        } catch (error) {
            request.log.error(error)
            return reply.code(500).send({
                success: false,
                message: 'Internal server error'
            })
        }
    }

    async refreshToken(request, reply) {
        try {
            const token = request.cookies.refreshToken || request.body.refreshToken

            if (!token) {
                return reply.code(400).send({
                    success: false,
                    message: 'Refresh token is required'
                })
            }

            const result = await authService.refreshToken(request.server, token)

            if (!result.success) {
                return reply.code(401).send(result)
            }

            return reply.send({
                success: true,
                accessToken: result.accessToken,
                expiresIn: result.expiresIn
            })
        } catch (error) {
            request.log.error(error)
            return reply.code(500).send({
                success: false,
                message: 'Internal server error'
            })
        }
    }

    // async logout(request, reply) {
    //     try {
    //         const userId = request.user.id
    //         const refreshToken = request.cookies.refreshToken || request.body.refreshToken

    //         if (refreshToken) {
    //             await authService.logout(userId, refreshToken)
    //         }

    //         reply.clearCookie('refreshToken', { path: '/api/v1/auth/refresh-token' })

    //         return reply.send({
    //             success: true,
    //             message: 'Logged out successfully'
    //         })
    //     } catch (error) {
    //         request.log.error(error)
    //         return reply.code(500).send({
    //             success: false,
    //             message: 'Internal server error'
    //         })
    //     }
    // }

}

module.exports = new AuthController()
