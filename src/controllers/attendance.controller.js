'use strict';
const attendanceService = require('../services/attendance.service');

class AttendanceController {
  async checkIn(request, reply) {
    const userId = request.user.id;
    const payload = {
      location: request.body.location || null,
      ip: request.ip,
      device: request.headers['user-agent']
    };
    const result = await attendanceService.checkIn(userId, payload);
    const code = result.success ? 200 : 400;
    return reply.code(code).send(result);
  }

  async checkOut(request, reply) {
    const userId = request.user.id;
    const payload = {
      location: request.body.location || null,
      ip: request.ip,
      device: request.headers['user-agent']
    };
    const result = await attendanceService.checkOut(userId, payload);
    const code = result.success ? 200 : 400;
    return reply.code(code).send(result);
  }

  // async getToday(request, reply) {
  //   const userId = request.user.id;
  //   const result = await attendanceService.getToday(userId);
  //   return reply.send(result);
  // }

  // async getHistory(request, reply) {
  //   const userId = request.user.id;
  //   const { startDate, endDate } = request.query;
  //   const result = await attendanceService.getHistory(userId, startDate, endDate);
  //   return reply.send(result);
  // }

  // async getReport(request, reply) {
  //   const result = await attendanceService.getReport();
  //   return reply.send(result);
  // }
}

module.exports = new AttendanceController();
