'use strict';

const { db } = require('../../../db/connection');
const { daily_report, weekly_report, monthly_report } = require('../../../models/schema/report');
const { desc } = require('drizzle-orm');

class ReportService {
  // fetch latest daily report
  async getLatestDaily() {
    const [report] = await db
      .select()
      .from(daily_report)
      .orderBy(desc(daily_report.reportDate))
      .limit(1);
    return report || null;
  }

  // fetch latest weekly report
  async getLatestWeekly() {
    const [report] = await db
      .select()
      .from(weekly_report)
      .orderBy(desc(weekly_report.weekStart))
      .limit(1);
    return report || null;
  }

  // fetch latest monthly report
  async getLatestMonthly() {
    const [report] = await db
      .select()
      .from(monthly_report)
      .orderBy(desc(monthly_report.month))
      .limit(1);
    return report || null;
  }

  // aggregate for dashboard
  async getDashboardStats() {
    const [daily, weekly, monthly] = await Promise.all([
      this.getLatestDaily(),
      this.getLatestWeekly(),
      this.getLatestMonthly(),
    ]);

    return {
      daily: daily
        ? {
            date: daily.reportDate,
            totalPresent: daily.totalPresent,
            totalLate: daily.totalLate,
            totalAbsent: daily.totalAbsent,
          }
        : null,
      weekly: weekly
        ? {
            weekStart: weekly.weekStart,
            weekEnd: weekly.weekEnd,
            totalPresent: weekly.totalPresent,
            totalLate: weekly.totalLate,
            totalAbsent: weekly.totalAbsent,
          }
        : null,
      monthly: monthly
        ? {
            month: monthly.month,
            totalPresent: monthly.totalPresent,
            totalLate: monthly.totalLate,
            totalAbsent: monthly.totalAbsent,
          }
        : null,
    };
  }
}

module.exports = new ReportService();