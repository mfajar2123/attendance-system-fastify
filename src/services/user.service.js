'user strict'

const { db } = require('../db/connection')
const { eq }  = require('drizzle-orm')
const { users } = require('../models/schema/users')
const { hashPassword } = require('../utils/hash')

class UserService {

    async getAllUsers() {
        try {
            return await db.select().from(users)
        } catch (error) {
            throw new Error(`Failed to get users: ${error.message}`)
        }
    }

    async getUserById(id) {
        try {
            const [p] = await db.select().from(users).where(eq(users.id, id))
            return p
        } catch (error) {
            throw new Error(`Failed to get user by id: ${error.message}`)
        }   
    }

    async getUserByEmail(email) {
        try {
            const [p] = await db.select().from(users).where(eq(users.email, email))
            return p
        } catch (error) {
            throw new Error(`Failed to get user by email: ${error.message}`)
        }
    }

    async getUserByUsername(username) {
        try {
            const [p] = await db.select().from(users).where(eq(users.username, username))
            return p
        } catch (error) {
            throw new Error(`Failed to get user by username: ${error.message}`)
        }
    }

    async createUser(userData) {
        try {
            const hashedPassword = await hashPassword(userData.password)
            const newUser = {
                ...userData,
                password: hashedPassword,
                createdAt: new Date(),
                updatedAt: new Date()
            }
            const [p] = await db.insert(users).values(newUser).returning()
            return p
            
        } catch (error) {
            throw new Error(`Failed to create user: ${error.message}`)
        }
    }

    async updateUser(id, userData) {
        try {
            if(userData.password){
                userData.password = await hashPassword(userData.password)
            }

            userData.updatedAt = new Date()

            const[p] = await db
            .update(users)
            .set(userData)
            .where(eq(users.id, id))
            .returning()

            return p
        } catch (error) {
            throw new Error(`Failed to update user: ${error.message}`)
        }
    }

    async deleteUser(id) {
        try {
            const [p] = await db.delete(users).where(eq(users.id, id)).returning()
            return p
        } catch (error) {
            throw new Error(`Failed to delete user: ${error.message}`)
        }
    }

    async updateLastLogin(id) {
        try {
            await db 
            .update(users)
            .set({ lastLogin: new Date() })
            .where(eq(users.id, id))

            return true
        } catch (error) {
            throw new Error(`Failed to update last login: ${error.message}`)
        }
    }

}

module.exports = new UserService()