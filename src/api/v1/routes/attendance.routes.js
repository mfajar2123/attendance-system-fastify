'use strict'

const attendanceController = require('../../../controllers/attendance.controller')

async function attendanceRoutes(fastify) {
  const { verifyToken } = fastify.auth
  const { checkRole } = fastify.role

  fastify.post('/check-in', {
    preHandler: [verifyToken]
  }, attendanceController.checkIn)

  fastify.post('/check-out', {
    preHandler: [verifyToken]
  }, attendanceController.checkOut)

  fastify.get('/today', {
      preHandler: [verifyToken]
  }, attendanceController.getToday)

  fastify.get('/history', {
    preHandler: [verifyToken],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          limit: { type: 'integer', default: 10 }
        }
      }
    }
  }, attendanceController.getHistory)

   
  fastify.get('/report', {
    preHandler: [verifyToken, checkRole(['admin', 'manager'])],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' },
          departmentName: { type: 'string', nullable: true }
        },
        required: ['startDate', 'endDate']
      }
    }
  }, attendanceController.getReport)
}


  
  


module.exports = attendanceRoutes
