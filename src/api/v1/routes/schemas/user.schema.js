'use strict';
const { ROLES } = require('../../../../models/schema/users')

const userResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    message: { type: 'string' },
    data: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        username: { type: 'string' },
        email: { type: 'string' },
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        role: { type: 'string' },
        department: { type: 'string' },
        position: { type: 'string' },
        isActive: { type: 'boolean' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
        lastLogin: { type: ['string', 'null'], format: 'date-time' }
      }
    }
  }
};

const usersResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          username: { type: 'string' },
          email: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          role: { type: 'string' },
          department: { type: 'string' },
          position: { type: 'string' },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          lastLogin: { type: ['string', 'null'], format: 'date-time' }
        }
      }
    }
  }
};

const createUserSchema = {
  body: {
    type: 'object',
    required: ['username', 'email', 'password', 'role'],
    properties: {
      username: { type: 'string', minLength: 3, maxLength: 50 },
      email: { type: 'string', format: 'email', maxLength: 100 },
      password: { type: 'string', minLength: 6 },
      firstName: { type: 'string', maxLength: 50 },
      lastName: { type: 'string', maxLength: 50 },
      role: { type: 'string', enum: Object.values(ROLES) },
      department: { type: 'string', maxLength: 50 },
      position: { type: 'string', maxLength: 50 },
      isActive: { type: 'boolean' }
    }
  },
  response: {
    201: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            username: { type: 'string' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string' },
            department: { type: 'string' },
            position: { type: 'string' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  }
};

const updateUserSchema = {
  params: {
    type: 'object',
    properties: {
      id: { type: 'integer' }
    }
  },
  body: {
    type: 'object',
    properties: {
      username: { type: 'string', minLength: 3, maxLength: 50 },
      email: { type: 'string', format: 'email', maxLength: 100 },
      password: { type: 'string', minLength: 6 },
      firstName: { type: 'string', maxLength: 50 },
      lastName: { type: 'string', maxLength: 50 },
      role: { type: 'string', enum: Object.values(ROLES) },
      department: { type: 'string', maxLength: 50 },
      position: { type: 'string', maxLength: 50 },
      isActive: { type: 'boolean' }
    }
  },
  response: {
    200: userResponseSchema
  }
};

const getUserSchema = {
  params: {
    type: 'object',
    properties: {
      id: { type: 'integer' }
    }
  },
  response: {
    200: userResponseSchema
  }
};

const getAllUsersSchema = {
  response: {
    200: usersResponseSchema
  }
};

const deleteUserSchema = {
  params: {
    type: 'object',
    properties: {
      id: { type: 'integer' }
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
  createUserSchema,
  updateUserSchema,
  getUserSchema,
  getAllUsersSchema,
  deleteUserSchema
};