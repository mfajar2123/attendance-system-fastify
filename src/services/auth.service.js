'use strict'

const { db } = require('../db/connection')
const { eq, and } = require('drizzle-orm')


const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')
const { users, refreshTokens } = require('../models/schema/users')
const jwtUtils = require('../utils/jwt')
const { default: fastify } = require('fastify')

class AuthService {

    async register(userData) {
        try {
            const hashedPassword = await bcrypt.hash(userData.password, 10)

            const [newUser] = await db.insert(users).values({
                ...userData,
                password: hashedPassword
            }).returning({
                id: users.id,
                username: users.username,
                email: users.email,
                firstName: users.firstName,
                lastName: users.lastName,
                role: users.role,
                department: users.department,
                position: users.position
            })

            return { success: true, user: newUser }
        } catch (error) {
            if (error.code === '23505') {
                return { success: false, message: 'Username or email already exists' }
            }
            throw new Error(`Failed to register: ${error.message}`)
        }
    }

    async login(fastify, username, password) {
        try {
            const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1)

            if (!user) {
                return { success: false, message: 'Invalid credentials' }
            }

            if (!user.isActive) {
                return { success: false, message: 'Account is deactivated' }
            }

            const isPasswordValid = await bcrypt.compare(password, user.password)
            if (!isPasswordValid) {
                return { success: false, message: 'Invalid credentials' }
            }


            const accessToken = await jwtUtils.generateToken(fastify, {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }) 

            const refreshToken = uuidv4()
            const refreshExpiry = new Date()
            refreshExpiry.setDate(refreshExpiry.getDate() + 30)

            await db.insert(refreshTokens).values({
                userId: user.id,
                token: refreshToken,
                expiresAt: refreshExpiry
            })

            await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, user.id))

            return {
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                    department: user.department,
                    position: user.position
                },
                tokens: {
                    accessToken,
                    refreshToken,
                    expiresIn: 900
                }
            }
        } catch (error) {
            throw new Error(`Failed to login: ${error.message}`)
        }
    }

    async refreshToken(fastify, token) {
        try {
            const [storedToken] = await db.select().from(refreshTokens).where(eq(refreshTokens.token, token)).limit(1)

            if (!storedToken || storedToken.expiresAt < new Date() || storedToken.revokedAt) {
                return { success: false, message: 'Refresh token expired or revoked' }
            }

            const [user] = await db.select().from(users).where(eq(users.id, storedToken.userId)).limit(1)

            if (!user) {
                return { success: false, message: 'User not found' }
            }

            if (!user.isActive) {
                return { success: false, message: 'Account is deactivated' }
            }

            const accessToken = await jwtUtils.generateToken(fastify, {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            })

            return {
                success: true,
                accessToken,
                expiresIn:900
            }
        } catch (error) {
            throw new Error(`Failed to refresh token: ${error.message}`)
        }
    }

    async logout(userId, refreshToken) {
        try {

            // Cek apakah token valid dan belum direvoke
            const [existingToken] = await db
                .select()
                .from(refreshTokens)
                .where(and(
                    eq(refreshTokens.userId, userId),
                    eq(refreshTokens.token, refreshToken)
                ))
                .limit(1);
    
            if (!existingToken) {
                return { success: false, message: 'Refresh token not found' };
            }
    
            if (existingToken.revokedAt) {
                return { success: false, message: 'Token already revoked' };
            }
    
            // Set revokedAt untuk menandai token tidak bisa digunakan lagi
            await db.update(refreshTokens)
                .set({ revokedAt: new Date() })
                .where(and(
                    eq(refreshTokens.userId, userId),
                    eq(refreshTokens.token, refreshToken)
                ));
                console.log('Received refreshToken:', refreshToken);
                console.log('Existing token:', existingToken);

            return { success: true, message: 'Logout successful' };
        } catch (error) {
            throw new Error(`Failed to logout: ${error.message}`);
        }
    }
   
}

module.exports = new AuthService()
