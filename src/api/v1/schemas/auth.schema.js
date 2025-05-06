'use strict';

const registerSchema = {
  description: 'Register a new user',
  tags: ['auth'],
  body: {
    type: 'object',
    required: ['username', 'email', 'password', 'firstName', 'lastName'],
    properties: {
      username: { type: 'string', minLength: 3, maxLength: 50 },
      email: { type: 'string', format: 'email', maxLength: 100 },
      password: { type: 'string', minLength: 8, maxLength: 100 },
      firstName: { type: 'string', maxLength: 50 },
      lastName: { type: 'string', maxLength: 50 },
      department: { type: 'string', maxLength: 50 },
      position: { type: 'string', maxLength: 50 },
      role: { type: 'string', enum: ['admin', 'manager', 'employee'] }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            username: { type: 'string' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string' },
            department: { type: 'string' },
            position: { type: 'string' }
          }
        }
      }
    },
    400: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  }
};

const loginSchema = {
  description: 'Login a user',
  tags: ['auth'],
  body: {
    type: 'object',
    required: ['username', 'password'],
    properties: {
      username: { type: 'string' },
      password: { type: 'string' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            username: { type: 'string' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string' },
            department: { type: 'string' },
            position: { type: 'string' }
          }
        },
        accessToken: { type: 'string' },
        expiresIn: { type: 'integer' }
      }
    },
    401: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  }
};

const refreshTokenSchema = {
  description: 'Refresh access token',
  tags: ['auth'],
  body: {
    type: 'object',
    properties: {
      refreshToken: { type: 'string' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        accessToken: { type: 'string' },
        expiresIn: { type: 'integer' }
      }
    },
    401: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  }
};

const logoutSchema = {
  description: 'Logout a user',
  tags: ['auth'],
  body: {
    type: 'object',
    properties: {
      refreshToken: { type: 'string' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  }
};



module.exports = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema
};