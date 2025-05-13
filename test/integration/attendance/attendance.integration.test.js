'use strict';

const buildTestApp = require('./app.mock');
const attendanceService = require('../../../src/api/v1/services/attendance.service');

jest.mock('../../../src/api/v1/services/attendance.service');

describe('Attendance Routes Integration Tests', () => {
  let app;

  beforeEach(async () => {
    jest.clearAllMocks();
    app = buildTestApp();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  test('POST /check-in should check in successfully', async () => {
    const mockResult = { checkInTime: '2025-05-13 08:00:00', location: 'Office', ip: '127.0.0.1', device: 'agent', status: 'present', notes: 'Hadir tepat waktu' };
    attendanceService.checkIn.mockResolvedValue(mockResult);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/attendance/check-in',
      headers: { 'authorization': 'Bearer token', 'Content-Type': 'application/json' },
      payload: JSON.stringify({ location: 'Office' })
    });

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.payload);
    expect(payload.success).toBe(true);
    expect(payload.data).toEqual(mockResult);
  });

  test('POST /check-out should check out successfully', async () => {
    const mockResult = { checkOutTime: '2025-05-13 17:00:00', duration: '8 jam 0 menit', location: 'Office', ip: '127.0.0.1', device: 'agent' };
    attendanceService.checkOut.mockResolvedValue(mockResult);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/attendance/check-out',
      headers: { 'authorization': 'Bearer token', 'Content-Type': 'application/json' },
      payload: JSON.stringify({ location: 'Office' })
    });

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.payload);
    expect(payload.success).toBe(true);
    expect(payload.data).toEqual(mockResult);
  });

  test('GET /today should return today attendance', async () => {
    const mockData = { attendanceStatus: 'Selesai', status: 'present', notes: 'Hadir', times: { checkInTime: '08:00:00', checkOutTime: '17:00:00', duration: '540 menit waktu kerja' }, devices: {}, location: {} };
    attendanceService.getToday.mockResolvedValue(mockData);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/attendance/today',
      headers: { 'authorization': 'Bearer token' }
    });

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.payload);
    expect(payload.success).toBe(true);
    expect(payload.data).toEqual(mockData);
  });

  test('GET /history should return paginated history', async () => {
    const mockHistory = { attendanceData: [], pagination: { page:1, limit:10, totalItems:0, totalPages:0 } };
    attendanceService.getHistory.mockResolvedValue(mockHistory);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/attendance/history?page=1&limit=10',
      headers: { 'authorization': 'Bearer token' }
    });

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.payload);
    expect(payload.success).toBe(true);
    expect(payload.data).toEqual(mockHistory);
  });

  test('GET /report should generate report for admin', async () => {
    const mockReport = { reportPeriod: {}, departments: [] };
    attendanceService.generateReport.mockResolvedValue(mockReport);

    // override default to admin
    app = buildTestApp({ customVerify: (req, rep, done) => { req.user = { id:1, role:'admin' }; done(); } });
    await app.ready();

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/attendance/report?startDate=2025-05-01&endDate=2025-05-13',
      headers: { 'authorization': 'Bearer token' }
    });

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.payload);
    expect(payload.success).toBe(true);
    expect(payload.data).toEqual(mockReport);
  });

  test('GET /report should forbid non-admin/non-manager', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/attendance/report?startDate=2025-05-01&endDate=2025-05-13',
      headers: { 'authorization': 'Bearer token' }
    });

    expect(response.statusCode).toBe(403);
    const payload = JSON.parse(response.payload);
    expect(payload.success).toBe(false);
    expect(payload.message).toBe('Access forbidden');
  });
});
