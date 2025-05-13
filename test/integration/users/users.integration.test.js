'use strict';

const buildTestUserApp = require('./app.mock');
const userService = require('../../../src/api/v1/services/user.service');

jest.mock('../../../src/api/v1/services/user.service');

describe('User Routes Integration Tests', () => {
  let app;

  beforeEach(async () => {
    jest.clearAllMocks();
    app = buildTestUserApp();
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  test('GET /api/v1/users should return all users (admin only)', async () => {
    const mockUsers = [{ id: 1, username: 'john', email: 'john@example.com' }];
    userService.getAllUsers.mockResolvedValue(mockUsers);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users',
      headers: { authorization: 'Bearer token' },
    });

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.payload);
    expect(payload.success).toBe(true);
    expect(payload.data).toEqual(mockUsers);
  });

  test('GET /api/v1/users/:id should return a single user (employee, manager or admin)', async () => {
    const mockUser = { id: 1, username: 'john', email: 'john@example.com' };
    userService.getUserById.mockResolvedValue(mockUser);

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/users/1',
      headers: { authorization: 'Bearer token' },
    });

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.payload);
    expect(payload.success).toBe(true);
    expect(payload.data).toEqual(mockUser);
  });

  test('POST /api/v1/users should create new user (open)', async () => {
    const userData = { username: 'jane', email: 'jane@example.com', password: 'secret' };
    const createdUser = { ...userData, id: 2 };
    delete createdUser.password;

    userService.getUserByEmail.mockResolvedValue(null);
    userService.getUserByUsername.mockResolvedValue(null);
    userService.createUser.mockResolvedValue(createdUser);

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/users',
      headers: { 'Content-Type': 'application/json' },
      payload: JSON.stringify(userData),
    });

    expect(response.statusCode).toBe(201);
    const payload = JSON.parse(response.payload);
    expect(payload.success).toBe(true);
    expect(payload.data).toEqual(createdUser);
  });

  test('POST /api/v1/users should return 409 when email already exists', async () => {
    const userData = { username: 'newuser', email: 'duplicate@example.com', password: 'secret' };
    userService.getUserByEmail.mockResolvedValue({ id: 99 });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/users',
      headers: { 'Content-Type': 'application/json' },
      payload: JSON.stringify(userData),
    });

    expect(response.statusCode).toBe(409);
    const payload = JSON.parse(response.payload);
    expect(payload.success).toBe(false);
    expect(payload.message).toBe('Email already in use');
  });

  test('PUT /api/v1/users/:id should update user (employee or admin)', async () => {
    const id = 1;
    const originalUser = { id, username: 'john', email: 'john@example.com' };
    const updatedUser = { id, username: 'johnny', email: 'johnny@example.com' };

    userService.getUserById.mockResolvedValue(originalUser);
    userService.getUserByEmail.mockResolvedValue(null);
    userService.getUserByUsername.mockResolvedValue(null);
    userService.updateUser.mockResolvedValue(updatedUser);

    const response = await app.inject({
      method: 'PUT',
      url: `/api/v1/users/${id}`,
      headers: { 'Content-Type': 'application/json' },
      payload: JSON.stringify({ username: 'johnny', email: 'johnny@example.com' }),
    });

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.payload);
    expect(payload.success).toBe(true);
    expect(payload.data).toEqual(updatedUser);
  });

  test('PUT /api/v1/users/:id should return 403 if current user is neither the employee (owner) nor admin', async () => {
    const customApp = buildTestUserApp({
      customVerify: (req, rep, done) => {
        // role 'manager' is not allowed to update other users
        req.user = { id: 2, role: 'manager' };
        done();
      }
    });
    await customApp.ready();

    const response = await customApp.inject({
      method: 'PUT',
      url: '/api/v1/users/1',
      headers: { 'Content-Type': 'application/json' },
      payload: JSON.stringify({ username: 'xxx' }),
    });

    expect(response.statusCode).toBe(403);
    const payload = JSON.parse(response.payload);
    expect(payload.success).toBe(false);
    expect(payload.message).toBe('Access forbidden');

    await customApp.close();
  });

  test('GET /api/v1/users should return 403 for non-admin role', async () => {
    const appWithLimitedRole = buildTestUserApp({
      customVerify: (req, rep, done) => {
        req.user = { id: 2, role: 'employee' }; // not admin
        done();
      }
    });

    await appWithLimitedRole.ready();

    const response = await appWithLimitedRole.inject({
      method: 'GET',
      url: '/api/v1/users',
      headers: { authorization: 'Bearer token' }
    });

    expect(response.statusCode).toBe(403);
    const payload = JSON.parse(response.payload);
    expect(payload.success).toBe(false);
    expect(payload.message).toBe('Access forbidden');

    await appWithLimitedRole.close();
  });

  test('DELETE /api/v1/users/:id should delete user (admin only)', async () => {
    const id = 1;
    userService.getUserById.mockResolvedValue({ id });
    userService.deleteUser.mockResolvedValue({ id });

    const response = await app.inject({
      method: 'DELETE',
      url: `/api/v1/users/${id}`,
      headers: { authorization: 'Bearer token' },
    });

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.payload);
    expect(payload.success).toBe(true);
    expect(payload.message).toBe('User deleted successfully');
  });

  test('DELETE /api/v1/users/:id should return 403 for non-admin role', async () => {
    const limitedApp = buildTestUserApp({
      customVerify: (req, rep, done) => {
        req.user = { id: 2, role: 'manager' };
        done();
      }
    });
    await limitedApp.ready();

    const response = await limitedApp.inject({
      method: 'DELETE',
      url: '/api/v1/users/1',
      headers: { authorization: 'Bearer token' }
    });

    expect(response.statusCode).toBe(403);
    const payload = JSON.parse(response.payload);
    expect(payload.success).toBe(false);
    expect(payload.message).toBe('Access forbidden');

    await limitedApp.close();
  });
});
