'use strict';

const { pgTable, serial, timestamp, json, text, integer, boolean, varchar } = require('drizzle-orm/pg-core');
const { users } = require('./users');

const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  LATE: 'late',
  ABSENT: 'absent',
  LEAVE: 'leave'
};

const CHECKOUT_TYPES = {
  MANUAL: 'manual',
  AUTO: 'auto-checkout',
  MISSING: 'missing'
};

const attendance = pgTable('attendance', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  date: timestamp('date').notNull().defaultNow(),
  checkInTime: timestamp('check_in_time'),
  checkOutTime: timestamp('check_out_time'),
  checkInLocation: json('check_in_location'), // { lat: number, lng: number }
  checkOutLocation: json('check_out_location'), // { lat: number, lng: number }
  checkInIp: varchar('check_in_ip', { length: 45 }),
  checkOutIp: varchar('check_out_ip', { length: 45 }),
  checkInDevice: json('check_in_device'), // User-agent information
  checkOutDevice: json('check_out_device'), // User-agent information
  workDuration: integer('work_duration'), // In minutes
  status: varchar('status', { length: 20 }).notNull().default(ATTENDANCE_STATUS.PRESENT),
  checkOutType: varchar('check_out_type', { length: 20 }).default(CHECKOUT_TYPES.MANUAL),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

const leaveRequests = pgTable('leave_requests', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  reason: text('reason').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, approved, rejected
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

module.exports = {
  attendance,
  leaveRequests,
  ATTENDANCE_STATUS,
  CHECKOUT_TYPES
};