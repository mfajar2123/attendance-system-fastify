const { z } = require('zod');

const checkInSchema = {
  description: 'User check-in',
  tags: ['attendance'],
  headers: {
    type: 'object',
    properties: {
      authorization: { type: 'string' }
    },
    required: ['authorization']
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: { type: 'object' }
      }
    }
  }
};

const checkOutSchema = {
  description: 'User check-out',
  tags: ['attendance'],
  headers: checkInSchema.headers,
  response: checkInSchema.response
};

const todaySchema = {
  description: 'Get today attendance',
  tags: ['attendance'],
  headers: checkInSchema.headers,
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: { type: ['object', 'null'] }
      }
    }
  }
};

const historySchema = {
  description: 'Get attendance history',
  tags: ['attendance'],
  headers: checkInSchema.headers,
  querystring: {
    type: 'object',
    properties: {
      startDate: { type: 'string', format: 'date' },
      endDate: { type: 'string', format: 'date' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: { type: 'array', items: { type: 'object' } }
      }
    }
  }
};

const reportSchema = {
  description: 'Generate attendance report',
  tags: ['attendance'],
  headers: checkInSchema.headers,
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        report: { type: 'array', items: { type: 'object' } }
      }
    }
  }
};

module.exports = {
  checkInSchema,
  checkOutSchema,
  todaySchema,
  historySchema,
  reportSchema
};
