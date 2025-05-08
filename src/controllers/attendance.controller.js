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

  async getToday(request, reply) {
    try {
      const userId = request.user.id
      const result = await attendanceService.getToday(userId)

      return reply.code(200).send({
        success: true,
        message: 'Data kehadiran hari ini berhasil diambil',
        data: result
      })
    } catch (error) {
      return reply.code(400).send({
        success: false,
        message: error.message
      })
    }
  }

  async getHistory(request, reply) {
    try {
      const userId = request.user.id
      const page = parseInt(request.query.page) || 1
      const limit = parseInt(request.query.limit) || 10

      const result = await attendanceService.getHistory(userId, page, limit)

      return reply.code(200).send({
        success: true,
        message: 'Riwayat kehadiran berhasil diambil',
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
