'use strict';

const { pgTable, serial, timestamp, json, integer, varchar } = require('drizzle-orm/pg-core');

const REPORT_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  CUSTOM: 'custom'
};

const reports = pgTable('reports', {
  id: serial('id').primaryKey(),
  type: varchar('type', { length: 20 }).notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  department: varchar('department', { length: 50 }),
  generatedBy: integer('generated_by'), 
  data: json('data').notNull(), 
  summary: json('summary').notNull(), 
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Example of what might be in the data JSON:
/*
{
  "totalEmployees": 50,
  "totalPresent": 45,
  "totalAbsent": 2,
  "totalLate": 3,
  "averageWorkDuration": 480, // in minutes
  "departmentStats": {
    "Engineering": {
      "totalEmployees": 20,
      "totalPresent": 18,
      "totalAbsent": 1,
      "totalLate": 1
    },
    "Marketing": {
      "totalEmployees": 15,
      "totalPresent": 14,
      "totalAbsent": 0,
      "totalLate": 1
    },
    // ... other departments
  },
  "attendanceDetails": [
    // Individual attendance records if needed
  ]
}
*/

module.exports = {
  reports,
  REPORT_TYPES
};