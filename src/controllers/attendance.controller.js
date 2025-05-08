'use strict'

const attendanceService = require('../services/attendance.service')

class AttendanceController {
  async checkIn(request, reply) {
    try {
      const userId = request.user.id
      const location = request.body.location
      const device = request.headers['user-agent']
      const ip = request.ip

      const result = await attendanceService.checkIn(userId, location, ip, device)

      return reply.code(200).send({
        success: true,
        message: 'Check-in berhasil',
        data: result
      })
    } catch (error) {
      return reply.code(400).send({
        success: false,
        message: error.message
      })
    }
  }

  async checkOut(request, reply) {
    try {
      const userId = request.user.id
      const location = request.body.location
      const device = request.headers['user-agent']
      const ip = request.ip

      const result = await attendanceService.checkOut(userId, location, ip, device)

      return reply.code(200).send({
        success: true,
        message: 'Check-out berhasil',
        data: result
      })
    } catch (error) {
      return reply.code(400).send({
        success: false,
        message: error.message
      })
    }
  }
}

module.exports = new AttendanceController()
