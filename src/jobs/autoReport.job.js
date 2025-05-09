'use strict';

const cron = require('node-cron');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const { sql } = require('drizzle-orm');
const { db } = require('../db/connection');
const { attendance } = require('../models/schema/attendance');
const { daily_report, weekly_report, monthly_report } = require('../models/schema/report');

// extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

function countWorkdays(start, end) {
    let count = 0;
    let curr = dayjs(start);
    const last = dayjs(end);
    while (curr.isSameOrBefore(last, 'day')) {
      const d = curr.day(); // 0=Sunday,6=Saturday
      if (d !== 0 && d !== 6) count++;
      curr = curr.add(1, 'day');
    }
    return count;
  }

function startReportSchedulers(app) {
  app.log.info('[SCHEDULER] Initializing report schedulers');

  // Daily report: run every midnight (00:00) */10 * * * * *, 0 0 * * *
  const dailyJob = cron.schedule('0 0 * * *', async () => {
    const yesterday = dayjs().tz('Asia/Jakarta').subtract(1, 'day');
    const start = yesterday.startOf('day').toDate();
    const end = yesterday.endOf('day').toDate();

    app.log.info(`[REPORT-DAILY] Generating daily report for ${yesterday.format('YYYY-MM-DD')}`);
    try {
      // fetch attendance records for yesterday
      const records = await db
        .select()
        .from(attendance)
        .where(sql`${attendance.date} BETWEEN ${start} AND ${end}`);

      const totalPresent = records.filter(r => r.status === 'present').length;
      const totalLate = records.filter(r => r.status === 'late').length;

      // count unique users who did not check in
      const allUsersCount = await db.select({ count: sql`count(*)` }).from(sql`users`);
      const totalAbsents = allUsersCount[0].count - records.length;

      // insert into daily_report table
      await db.insert(daily_report).values({
        
        reportDate: yesterday.format('YYYY-MM-DD'),
        totalPresent,
        totalLate,
        totalAbsent: totalAbsents
      });
      app.log.info('[REPORT-DAILY] Daily report saved');
    } catch (err) {
      app.log.error(`[REPORT-DAILY ERROR] ${err.stack || err.message}`);
    }
  });

  // Weekly report: run every Monday at 00:30, 30 0 * * 1, 
  const weeklyJob = cron.schedule('30 0 * * 1', async () => {
    const today = dayjs().tz('Asia/Jakarta');
    const weekEnd = today.subtract(1, 'day').endOf('day');
    const weekStart = weekEnd.subtract(6, 'day').startOf('day');

    app.log.info(`[REPORT-WEEKLY] Generating weekly report ${weekStart.format('YYYY-MM-DD')} to ${weekEnd.format('YYYY-MM-DD')}`);
    try {
      const records = await db
        .select()
        .from(attendance)
        .where(sql`${attendance.date} BETWEEN ${weekStart.toDate()} AND ${weekEnd.toDate()}`);

      const totalPresent = records.filter(r => r.status === 'present').length;
      const totalLate = records.filter(r => r.status === 'late').length;
      const allUsersCount = await db.select({ count: sql`count(*)` }).from(sql`users`);
      const workdaysWeek = countWorkdays(weekStart, weekEnd);
      const totalAbsents = (allUsersCount[0].count * workdaysWeek) - records.length;

      await db.insert(weekly_report).values({
        weekStart: weekStart.format('YYYY-MM-DD'),
        weekEnd: weekEnd.format('YYYY-MM-DD'),
        totalPresent,
        totalLate,
        totalAbsent: totalAbsents
      });
      app.log.info('[REPORT-WEEKLY] Weekly report saved');
    } catch (err) {
      app.log.error(`[REPORT-WEEKLY ERROR] ${err.stack || err.message}`);
    }
  });

  // Monthly report: run on 1st day of month at 01:00, 0 1 1 * *
  const monthlyJob = cron.schedule('0 1 1 * *', async () => {
    const today = dayjs().tz('Asia/Jakarta');
    const month = today.subtract(1, 'month');
    const monthStart = month.startOf('month').toDate();
    const monthEnd = month.endOf('month').toDate();
    const monthLabel = month.format('YYYY-MM');

    app.log.info(`[REPORT-MONTHLY] Generating monthly report for ${monthLabel}`);
    try {
      const records = await db
        .select()
        .from(attendance)
        .where(sql`${attendance.date} BETWEEN ${monthStart} AND ${monthEnd}`);

      const totalPresent = records.filter(r => r.status === 'present').length;
      const totalLate = records.filter(r => r.status === 'late').length;
      const allUsersCount = await db.select({ count: sql`count(*)` }).from(sql`users`);
      const workdaysMonth = countWorkdays(monthStart, monthEnd);
      const totalAbsents = (allUsersCount[0].count * workdaysMonth) - records.length;

      await db.insert(monthly_report).values({
        month: monthLabel,
        totalPresent,
        totalLate,
        totalAbsent: totalAbsents
      });
      app.log.info('[REPORT-MONTHLY] Monthly report saved');
    } catch (err) {
      app.log.error(`[REPORT-MONTHLY ERROR] ${err.stack || err.message}`);
    }
  });

  app.decorate('dailyReportJob', dailyJob);
  app.decorate('weeklyReportJob', weeklyJob);
  app.decorate('monthlyReportJob', monthlyJob);

  app.addHook('onClose', (instance, done) => {
    [dailyJob, weeklyJob, monthlyJob].forEach(job => job.stop());
    app.log.info('[SCHEDULER] All report jobs stopped');
    done();
  });

  return { dailyJob, weeklyJob, monthlyJob };
}

module.exports = { startReportSchedulers };
