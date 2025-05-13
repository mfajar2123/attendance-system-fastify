'use strict';

const buildTestApp = require('./app.mock');
const reportService = require('../../../src/api/v1/services/report.service');

jest.mock('../../../src/api/v1/services/report.service');

describe('Admin Report Routes Integration Tests', () => {
  let app;

  beforeEach(async () => {
    jest.clearAllMocks();
    app = buildTestApp();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  test('GET /dashboard should return dashboard stats', async () => {
    const mockStats = { daily: {}, weekly: {}, monthly: {} };
    reportService.getDashboardStats.mockResolvedValue(mockStats);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/dashboard',
      headers: { authorization: 'Bearer token' }
    });

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.payload);
    expect(payload.success).toBe(true);
    expect(payload.data).toEqual(mockStats);
  });

  test('GET /reports/daily should return latest daily report', async () => {
    const mockReport = { reportDate: '2025-05-13', totalPresent: 10 };
    reportService.getLatestDaily.mockResolvedValue(mockReport);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/reports/daily',
      headers: { authorization: 'Bearer token' }
    });

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.payload);
    expect(payload.success).toBe(true);
    expect(payload.data).toEqual(mockReport);
  });

  test('GET /reports/daily should return 404 if no daily report', async () => {
    reportService.getLatestDaily.mockResolvedValue(null);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/reports/daily',
      headers: { authorization: 'Bearer token' }
    });

    expect(response.statusCode).toBe(404);
    const payload = JSON.parse(response.payload);
    expect(payload.success).toBe(false);
    expect(payload.message).toBe('No daily report found');
  });

  test('GET /reports/weekly should return latest weekly report', async () => {
    const mockReport = { weekStart: '2025-05-10', weekEnd: '2025-05-16', totalPresent: 50 };
    reportService.getLatestWeekly.mockResolvedValue(mockReport);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/reports/weekly',
      headers: { authorization: 'Bearer token' }
    });

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.payload);
    expect(payload.success).toBe(true);
    expect(payload.data).toEqual(mockReport);
  });

  test('GET /reports/weekly should return 404 if no weekly report', async () => {
    reportService.getLatestWeekly.mockResolvedValue(null);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/reports/weekly',
      headers: { authorization: 'Bearer token' }
    });

    expect(response.statusCode).toBe(404);
    const payload = JSON.parse(response.payload);
    expect(payload.success).toBe(false);
    expect(payload.message).toBe('No weekly report found');
  });

  test('GET /reports/monthly should return latest monthly report', async () => {
    const mockReport = { month: '2025-05', totalPresent: 200 };
    reportService.getLatestMonthly.mockResolvedValue(mockReport);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/reports/monthly',
      headers: { authorization: 'Bearer token' }
    });

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.payload);
    expect(payload.success).toBe(true);
    expect(payload.data).toEqual(mockReport);
  });

  test('GET /reports/monthly should return 404 if no monthly report', async () => {
    reportService.getLatestMonthly.mockResolvedValue(null);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/reports/monthly',
      headers: { authorization: 'Bearer token' }
    });

    expect(response.statusCode).toBe(404);
    const payload = JSON.parse(response.payload);
    expect(payload.success).toBe(false);
    expect(payload.message).toBe('No monthly report found');
  });

  test('should forbid non-admin from accessing routes', async () => {
    const nonAdminApp = buildTestApp({ customVerify: (req, rep, done) => { req.user = { id:1, role:'employee' }; done(); } });
    await nonAdminApp.ready();

    const res = await nonAdminApp.inject({ method: 'GET', url: '/api/v1/admin/dashboard', headers: { authorization: 'Bearer token' } });
    expect(res.statusCode).toBe(403);
    const payload = JSON.parse(res.payload);
    expect(payload.success).toBe(false);
    expect(payload.message).toBe('Access forbidden');

    await nonAdminApp.close();
  });
});
