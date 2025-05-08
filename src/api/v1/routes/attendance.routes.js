'use strict'

const attendanceController = require('../../../controllers/attendance.controller')

async function attendanceRoutes(fastify) {
  const { verifyToken } = fastify.auth

  fastify.post('/check-in', {
    preHandler: [verifyToken]
  }, attendanceController.checkIn)

  fastify.post('/check-out', {
    preHandler: [verifyToken]
  }, attendanceController.checkOut)
}

module.exports = attendanceRoutes
