'use strict'

async function generateToken(fastify, payload, options = {}) {
  const defaultOptions = {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m'
  }

  return fastify.jwt.sign(payload, { ...defaultOptions, ...options })
}

async function generateRefreshToken(fastify, payload, options = {}) {
  const defaultOptions = {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  }

  return fastify.jwt.sign(payload, { ...defaultOptions, ...options })
}

async function verifyToken(fastify, token) {
  try {
    return await fastify.jwt.verify(token)
  } catch (error) {
    throw new Error(`Invalid token: ${error.message}`)
  }
}

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken
}
