'use strict';
const attendanceController = require('../../../controllers/attendance.controller');
const {
  checkInSchema,
  checkOutSchema,
  todaySchema,
  historySchema,
  reportSchema
} = require('../schemas/attendance.schema');

async function attendanceRoutes(fastify, options) {
  const { verifyToken } = fastify.auth;
  fastify.post('/check-in', { schema: checkInSchema, preHandler: [verifyToken] }, attendanceController.checkIn.bind(attendanceController));
  fastify.post('/check-out', { schema: checkOutSchema, preHandler: [verifyToken] }, attendanceController.checkOut.bind(attendanceController));
  // fastify.get('/today', { schema: todaySchema, preHandler: [verifyToken] }, attendanceController.getToday.bind(attendanceController));
  // fastify.get('/history', { schema: historySchema, preHandler: [verifyToken] }, attendanceController.getHistory.bind(attendanceController));
  // fastify.get('/report', { schema: reportSchema, preHandler: [verifyToken] }, attendanceController.getReport.bind(attendanceController));
}

module.exports = attendanceRoutes;
