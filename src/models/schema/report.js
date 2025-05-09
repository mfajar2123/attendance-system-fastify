'use strict';

const { pgTable, serial, timestamp, integer, varchar, date } = require('drizzle-orm/pg-core');

// Table for daily reports
const daily_report = pgTable('daily_report', {
  id: serial('id').primaryKey(),
  reportDate: date('report_date').notNull(),   // report date (start of day)
  totalPresent: integer('total_present').notNull().default(0),
  totalLate: integer('total_late').notNull().default(0),
  totalAbsent: integer('total_absent').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Table for weekly reports
const weekly_report = pgTable('weekly_report', {
  id: serial('id').primaryKey(),
  weekStart: date('week_start').notNull(),         // first day of the week (Monday)
  weekEnd: date('week_end').notNull(),             // last day of the week (Sunday)
  totalPresent: integer('total_present').notNull().default(0),
  totalLate: integer('total_late').notNull().default(0),
  totalAbsent: integer('total_absent').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Table for monthly reports
const monthly_report = pgTable('monthly_report', {
  id: serial('id').primaryKey(),
  month: varchar('month', { length: 7 }).notNull(),      // format 'YYYY-MM'
  totalPresent: integer('total_present').notNull().default(0),
  totalLate: integer('total_late').notNull().default(0),
  totalAbsent: integer('total_absent').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

module.exports = {
  daily_report,
  weekly_report,
  monthly_report,
};
