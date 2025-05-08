'use strict'
const { db } = require('../db/connection')
const { attendance } = require('../models/schema/attendance')
const { eq, and, sql, between } = require('drizzle-orm')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)

const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  LATE: 'late',
  ABSENT: 'absent'
}

class AttendanceService {
  async checkIn(userId, location, ip, device) {
    const now = dayjs().tz('Asia/Jakarta')
    const startOfDay = now.startOf('day').toDate()
    const endOfDay = now.endOf('day').toDate()

    const [existing] = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.userId, userId),
          sql`${attendance.date} BETWEEN ${startOfDay} AND ${endOfDay}`
        )
      )

    if (existing && existing.checkInTime) {
      throw new Error('User already checked in today')
    }

    const workStartTime = now.startOf('day').hour(14).minute(30)
    let status = ATTENDANCE_STATUS.PRESENT
    let notes = 'Hadir tepat waktu'
    
    if (now.isAfter(workStartTime)) {
      status = ATTENDANCE_STATUS.LATE
      const lateByMinutes = now.diff(workStartTime, 'minute')
      notes = `Terlambat ${lateByMinutes} menit`
    }

    const [result] = await db.insert(attendance)
      .values({
        userId,
        date: now.toDate(),
        checkInTime: now.toDate(),
        checkInLocation: location,
        checkInIp: ip,
        checkInDevice: device,
        status: status,
        notes: notes,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning()

    return {
      checkInTime: now.format('YYYY-MM-DD HH:mm:ss'),
      location,
      ip,
      device,
      status,
      notes
    }
  }

  async checkOut(userId, location, ip, device) {
    const now = dayjs().tz('Asia/Jakarta')
    const startOfDay = now.startOf('day').toDate()
    const endOfDay = now.endOf('day').toDate()

    const [existing] = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.userId, userId),
          sql`${attendance.date} BETWEEN ${startOfDay} AND ${endOfDay}`
        )
      )

    if (!existing || !existing.checkInTime) {
      throw new Error('User has not checked in today')
    }

    if (existing.checkOutTime) {
      throw new Error('User already checked out today')
    }

    const checkOutTime = now
    const checkInTime = dayjs(existing.checkInTime).tz('Asia/Jakarta')

    const durationMinutes = checkOutTime.diff(checkInTime, 'minute')
    const hours = Math.floor(durationMinutes / 60)
    const minutes = durationMinutes % 60

    const [updated] = await db.update(attendance)
      .set({
        checkOutTime: checkOutTime.toDate(),
        checkOutLocation: location,
        checkOutIp: ip,
        checkOutDevice: device,
        workDuration: durationMinutes,
        updatedAt: new Date()
      })
      .where(eq(attendance.id, existing.id))
      .returning()

    return {
      checkOutTime: checkOutTime.format('YYYY-MM-DD HH:mm:ss'),
      duration: `${hours} jam ${minutes} menit`,
      location,
      ip,
      device
    }
  }

  async getToday(userId) {
    const now = dayjs().tz('Asia/Jakarta')
    const startOfDay = now.startOf('day').toDate()
    const endOfDay = now.endOf('day').toDate()

    const [todayAttendance] = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.userId, userId),
          sql`${attendance.date} BETWEEN ${startOfDay} AND ${endOfDay}`
        )
      )

    if (!todayAttendance) {
      return {
        attendanceStatus: 'Belum check-in',
        checkInTime: null,
        checkOutTime: null,
        status: null,
        notes: null
      }
    }

    return {
      attendanceStatus: todayAttendance.checkOutTime ? 'Selesai' : 'Check-in',
      status: todayAttendance.status,
      notes: todayAttendance.notes,
      times: {
        checkInTime: todayAttendance.checkInTime ? 
        dayjs(todayAttendance.checkInTime).format('YYYY-MM-DD HH:mm:ss') : null,
        checkOutTime: todayAttendance.checkOutTime ? 
        dayjs(todayAttendance.checkOutTime).format('YYYY-MM-DD HH:mm:ss') : null,
        duration: `${todayAttendance.workDuration} menit waktu kerja`
      },
      devices: {
        checkIn: todayAttendance.checkInDevice,
        checkOut: todayAttendance.checkOutDevice
      },
      location: {
        checkIn: todayAttendance.checkInLocation,
        checkOut: todayAttendance.checkOutLocation
      }
    }
  }

}

module.exports = new AttendanceService()