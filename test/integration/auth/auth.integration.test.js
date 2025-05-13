'use strict';

const buildTestApp = require('./app.mock');
const authService = require('../../../src/api/v1/services/auth.service');

// Mock the auth service
jest.mock('../../../src/api/v1/services/auth.service');

describe('Auth Routes Integration Tests', () => {
  let app;

  beforeEach(async () => {
    jest.clearAllMocks();
    app = buildTestApp({ logger: false });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/v1/auth/register', () => {
    test('should register a new user and return 201', async () => {
      const userData = { username: 'john', password: 'pass123', email: 'john@example.com' };
      const createdUser = { id: 1, username: 'john', email: 'john@example.com', firstName: null, lastName: null, role: 'user', department: null, position: null };
      authService.register.mockResolvedValue({ success: true, user: createdUser });

      const response = await app.inject({ method: 'POST', url: '/api/v1/auth/register', headers: { 'Content-Type': 'application/json' }, payload: JSON.stringify(userData) });

      expect(response.statusCode).toBe(201);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(authService.register).toHaveBeenCalledTimes(1);
      expect(authService.register).toHaveBeenCalledWith(userData);

      const payload = JSON.parse(response.payload);
      expect(payload).toHaveProperty('success', true);
      expect(payload).toHaveProperty('user');
      expect(payload.user).toEqual(createdUser);
    });

    test('should return 400 when username or email already exists', async () => {
      const userData = { username: 'john', password: 'pass123', email: 'john@example.com' };
      authService.register.mockResolvedValue({ success: false, message: 'Username or email already exists' });

      const response = await app.inject({ method: 'POST', url: '/api/v1/auth/register', headers: { 'Content-Type': 'application/json' }, payload: JSON.stringify(userData) });

      expect(response.statusCode).toBe(400);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(authService.register).toHaveBeenCalledTimes(1);

      const payload = JSON.parse(response.payload);
      expect(payload).toHaveProperty('success', false);
      expect(payload).toHaveProperty('message', 'Username or email already exists');
      expect(payload).not.toHaveProperty('user');
    });

    test('should handle service errors and return 500', async () => {
      authService.register.mockRejectedValue(new Error('DB failure'));

      const response = await app.inject({ method: 'POST', url: '/api/v1/auth/register', headers: { 'Content-Type': 'application/json' }, payload: JSON.stringify({}) });

      expect(response.statusCode).toBe(500);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      const payload = JSON.parse(response.payload);
      expect(payload).toHaveProperty('success', false);
      expect(payload).toHaveProperty('message', 'Internal server error');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    test('should login user and set cookie with status 200', async () => {
      const credentials = { username: 'john', password: 'pass123' };
      const serviceResult = { success: true, user: { id: 1, username: 'john', email: 'john@example.com' }, tokens: { accessToken: 'token', refreshToken: 'r-token', expiresIn: 900 } };
      authService.login.mockResolvedValue(serviceResult);

      const response = await app.inject({ method: 'POST', url: '/api/v1/auth/login', headers: { 'Content-Type': 'application/json' }, payload: JSON.stringify(credentials) });

      expect(response.statusCode).toBe(200);
      const setCookie = response.headers['set-cookie'];
        expect(Array.isArray(setCookie) ? setCookie[0] : setCookie).toMatch(/refreshToken=r-token/);

      expect(authService.login).toHaveBeenCalledTimes(1);
      expect(authService.login).toHaveBeenCalledWith(app.server, credentials.username, credentials.password);

      const payload = JSON.parse(response.payload);
      expect(payload).toHaveProperty('success', true);
      expect(payload).toHaveProperty('accessToken', serviceResult.tokens.accessToken);
    });

    test('should return 401 on invalid credentials', async () => {
      authService.login.mockResolvedValue({ success: false, message: 'Invalid credentials' });

      const response = await app.inject({ method: 'POST', url: '/api/v1/auth/login', headers: { 'Content-Type': 'application/json' }, payload: JSON.stringify({ username: 'x', password: 'y' }) });

      expect(response.statusCode).toBe(401);
      const payload = JSON.parse(response.payload);
      expect(payload).toHaveProperty('success', false);
      expect(payload).toHaveProperty('message', 'Invalid credentials');
    });

    test('should return 500 on service error', async () => {
      authService.login.mockRejectedValue(new Error('fail'));
      const response = await app.inject({ method: 'POST', url: '/api/v1/auth/login', headers: { 'Content-Type': 'application/json' }, payload: JSON.stringify({}) });

      expect(response.statusCode).toBe(500);
      const payload = JSON.parse(response.payload);
      expect(payload).toHaveProperty('success', false);
      expect(payload).toHaveProperty('message', 'Internal server error');
    });
  });

  describe('POST /api/v1/auth/refresh-token', () => {
    test('should refresh token and return new access token', async () => {
      const serviceResult = { success: true, accessToken: 'new-token', expiresIn: 900 };
      authService.refreshToken.mockResolvedValue(serviceResult);

      const response = await app.inject({ method: 'POST', url: '/api/v1/auth/refresh-token', headers: { 'Content-Type': 'application/json' }, payload: JSON.stringify({ refreshToken: 'r-token' }) });

      expect(response.statusCode).toBe(200);
      expect(authService.refreshToken).toHaveBeenCalledTimes(1);
      expect(authService.refreshToken).toHaveBeenCalledWith(app.server, 'r-token');

      const payload = JSON.parse(response.payload);
      expect(payload).toHaveProperty('success', true);
      expect(payload).toHaveProperty('accessToken', serviceResult.accessToken);
    });

    test('should return 400 when token missing', async () => {
      const response = await app.inject({ method: 'POST', url: '/api/v1/auth/refresh-token', headers: { 'Content-Type': 'application/json' }, payload: JSON.stringify({}) });

      expect(response.statusCode).toBe(400);
      const payload = JSON.parse(response.payload);
      expect(payload).toHaveProperty('success', false);
      expect(payload).toHaveProperty('message', 'Refresh token is required');
    });

    test('should return 401 when service reports failure', async () => {
      authService.refreshToken.mockResolvedValue({ success: false, message: 'Refresh token expired or revoked' });
      const response = await app.inject({ method: 'POST', url: '/api/v1/auth/refresh-token', headers: { 'Content-Type': 'application/json' }, payload: JSON.stringify({ refreshToken: 'bad' }) });

      expect(response.statusCode).toBe(401);
      const payload = JSON.parse(response.payload);
      expect(payload).toHaveProperty('success', false);
      expect(payload).toHaveProperty('message', 'Refresh token expired or revoked');
    });

    test('should return 500 on service error', async () => {
      authService.refreshToken.mockRejectedValue(new Error('fail'));
      const response = await app.inject({ method: 'POST', url: '/api/v1/auth/refresh-token', headers: { 'Content-Type': 'application/json' }, payload: JSON.stringify({ refreshToken: 'x' }) });

      expect(response.statusCode).toBe(500);
      const payload = JSON.parse(response.payload);
      expect(payload).toHaveProperty('success', false);
      expect(payload).toHaveProperty('message', 'Internal server error');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    test('should logout user and clear cookie', async () => {
      authService.logout.mockResolvedValue({ success: true, message: 'Logout successful' });

      // Set a fake JWT cookie for auth
       

      const response = await app.inject({ method: 'POST', url: '/api/v1/auth/logout', headers: { 'Content-Type': 'application/json', cookie: 'refreshToken=r-token' } });

      expect(response.statusCode).toBe(200);
      const setCookie = response.headers['set-cookie'];
        expect(Array.isArray(setCookie) ? setCookie[0] : setCookie).toMatch(/refreshToken=;/);

      const payload = JSON.parse(response.payload);
      expect(payload).toHaveProperty('success', true);
    });

    test('should return 400 when token missing', async () => {
      const response = await app.inject({ method: 'POST', url: '/api/v1/auth/logout', headers: { 'Content-Type': 'application/json' } });

      expect(response.statusCode).toBe(400);
      const payload = JSON.parse(response.payload);
      expect(payload).toHaveProperty('success', false);
      expect(payload).toHaveProperty('message', 'Refresh token is required');
    });

    test('should return 400 when service reports failure', async () => {
      authService.logout.mockResolvedValue({ success: false, message: 'Refresh token not found' });

       

      const response = await app.inject({ method: 'POST', url: '/api/v1/auth/logout', headers: { 'Content-Type': 'application/json', cookie: 'refreshToken=r-token' } });

      expect(response.statusCode).toBe(400);
      const payload = JSON.parse(response.payload);
      expect(payload).toHaveProperty('success', false);
      expect(payload).toHaveProperty('message', 'Refresh token not found');
    });

    test('should return 500 on service error', async () => {
      authService.logout.mockRejectedValue(new Error('fail'));
     
      const response = await app.inject({ method: 'POST', url: '/api/v1/auth/logout', headers: { 'Content-Type': 'application/json', cookie: 'refreshToken=r-token' } });

      expect(response.statusCode).toBe(500);
      const payload = JSON.parse(response.payload);
      expect(payload).toHaveProperty('success', false);
      expect(payload).toHaveProperty('message', 'Internal server error');
    });
  });
});
