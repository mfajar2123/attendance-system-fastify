'use strict';
const { db } = require('../db/connection');
const { attendance } = require('../models/schema/attendance');
const { eq, and, gte, lte } = require('drizzle-orm');

class AttendanceService {
  async checkIn(userId, payload) {
    
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);
    const [existing] = await db.select().from(attendance)
      .where(and(eq(attendance.userId, userId), gte(attendance.date, todayStart), lte(attendance.date, todayEnd)))
      .limit(1);
    if (existing && existing.checkInTime) {
      return { success: false, message: 'Already checked in today' };
    }
    const record = await db.insert(attendance).values({
      userId,
      checkInTime: new Date(),
      checkInLocation: payload.location,
      checkInIp: payload.ip,
      checkInDevice: payload.device
    }).returning();
    return { success: true, data: record[0] };
  }

  async checkOut(userId, payload) {
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);
    const [existing] = await db.select().from(attendance)
      .where(and(eq(attendance.userId, userId), gte(attendance.date, todayStart), lte(attendance.date, todayEnd)))
      .limit(1);
    if (!existing || !existing.checkInTime) {
      return { success: false, message: 'Check-in required before check-out' };
    }
    if (existing.checkOutTime) {
      return { success: false, message: 'Already checked out today' };
    }
    const duration = Math.floor((Date.now() - new Date(existing.checkInTime)) / 60000);
    const [updated] = await db.update(attendance)
      .set({
        checkOutTime: new Date(),
        checkOutLocation: payload.location,
        checkOutIp: payload.ip,
        checkOutDevice: payload.device,
        workDuration: duration
      })
      .where(eq(attendance.id, existing.id))
      .returning();
    return { success: true, data: updated };
  }

  // async getToday(userId) {
  //   const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  //   const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);
  //   const [record] = await db.select().from(attendance)
  //     .where(and(eq(attendance.userId, userId), gte(attendance.date, todayStart), lte(attendance.date, todayEnd)))
  //     .limit(1);
  //   return { success: true, data: record || null };
  // }

  // async getHistory(userId, startDate, endDate) {
  //   const [records] = await db.select().from(attendance)
  //     .where(and(
  //       eq(attendance.userId, userId),
  //       gte(attendance.date, new Date(startDate)),
  //       lte(attendance.date, new Date(endDate))
  //     ));
  //   return { success: true, data: records };
  // }

  // async getReport() {
  //   // Example: aggregate by user
  //   const report = await db.select({
  //     userId: attendance.userId,
  //     totalDays: db.fn.count(attendance.id),
  //     totalWork: db.fn.sum(attendance.workDuration)
  //   })
  //   .from(attendance)
  //   .groupBy(attendance.userId);
  //   return { success: true, report };
  // }
}

module.exports = new AttendanceService();