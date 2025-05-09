'use strict';

const adminController = require('../../../controllers/admin.controller');

async function adminRoutes(fastify) {
  const { verifyToken } = fastify.auth;
  const { checkRole } = fastify.role;

  fastify.get('/dashboard', {
    preHandler: [verifyToken, checkRole(['admin'])]
  }, adminController.getDashboard);

  fastify.get('/reports/daily', {
    preHandler: [verifyToken, checkRole(['admin'])]
  }, adminController.getDailyReport);

  fastify.get('/reports/weekly', {
    preHandler: [verifyToken, checkRole(['admin'])]
  }, adminController.getWeeklyReport);

  fastify.get('/reports/monthly', {
    preHandler: [verifyToken, checkRole(['admin'])]
  }, adminController.getMonthlyReport);
}

module.exports = adminRoutes;
