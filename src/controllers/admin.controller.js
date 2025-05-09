'use strict';

const reportService = require('../services/report.service');

class AdminController {
  async getDashboard(request, reply) {
    try {
      const data = await reportService.getDashboardStats();
      return reply.code(200).send({ success: true, data });
    } catch (err) {
      return reply.code(500).send({ success: false, message: err.message });
    }
  }

  async getDailyReport(request, reply) {
    try {
      const report = await reportService.getLatestDaily();
      if (!report) {
        return reply.code(404).send({ success: false, message: 'No daily report found' });
      }
      return reply.code(200).send({ success: true, data: report });
    } catch (err) {
      return reply.code(500).send({ success: false, message: err.message });
    }
  }

  async getWeeklyReport(request, reply) {
    try {
      const report = await reportService.getLatestWeekly();
      if (!report) {
        return reply.code(404).send({ success: false, message: 'No weekly report found' });
      }
      return reply.code(200).send({ success: true, data: report });
    } catch (err) {
      return reply.code(500).send({ success: false, message: err.message });
    }
  }

  async getMonthlyReport(request, reply) {
    try {
      const report = await reportService.getLatestMonthly();
      if (!report) {
        return reply.code(404).send({ success: false, message: 'No monthly report found' });
      }
      return reply.code(200).send({ success: true, data: report });
    } catch (err) {
      return reply.code(500).send({ success: false, message: err.message });
    }
  }
}

module.exports = new AdminController();