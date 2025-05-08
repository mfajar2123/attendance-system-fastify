'use strict'
const { db } = require('../db/connection')
const { attendance } = require('../models/schema/attendance')
const { users } = require('../models/schema/users')
const { eq, and, sql, between, desc, asc } = require('drizzle-orm')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const isSameOrBefore = require('dayjs/plugin/isSameOrBefore')

dayjs.extend(isSameOrBefore)
dayjs.extend(utc)
dayjs.extend(timezone)

const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  LATE: 'late',
  ABSENT: 'absent'
}

function countWorkdays(start, end) {
  let count = 0
  let current = dayjs(start)
  const last = dayjs(end)

  while (current.isSameOrBefore(last, 'day')) {
    const day = current.day() // 0: Minggu, 6: Sabtu
    if (day !== 0 && day !== 6) {
      count++
    }
    current = current.add(1, 'day')
  }

  return count
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

    const workStartTime = now.startOf('day').hour(8).minute(30)
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

  async getHistory(userId, page = 1, limit = 10) {
    const offset = (page - 1) * limit
    
    const history = await db
      .select()
      .from(attendance)
      .where(eq(attendance.userId, userId))
      .orderBy(sql`${attendance.date} DESC`)
      .limit(limit)
      .offset(offset)

    const count = await db
      .select({ count: sql`count(*)` })
      .from(attendance)
      .where(eq(attendance.userId, userId))

    const totalItems = Number(count[0].count)
    const totalPages = Math.ceil(totalItems / limit)

    return {
      attendanceData: history.map(item => ({
        date: dayjs(item.date).format('YYYY-MM-DD'),
        checkInTime: item.checkInTime ? dayjs(item.checkInTime).format('HH:mm:ss') : null,
        checkOutTime: item.checkOutTime ? dayjs(item.checkOutTime).format('HH:mm:ss') : null,
        status: item.status,
        notes: item.notes,
        workDuration: item.workDuration ? `${Math.floor(item.workDuration / 60)} jam ${item.workDuration % 60} menit` : null
      })),
      pagination: {
        page,
        limit,
        totalItems,
        totalPages
      }
    }
  }

  async generateReport(startDate, endDate, departmentName = null) {
    const startDateObj = dayjs(startDate).startOf('day').toDate()
    const endDateObj = dayjs(endDate).endOf('day').toDate()
  
    try {
      let query = sql`
  SELECT 
    a.id, 
    a.user_id AS "userId", 
    a.date, 
    a.check_in_time AS "checkInTime", 
    a.check_out_time AS "checkOutTime", 
    a.status, 
    a.work_duration AS "workDuration", 
    a.notes,
    u.department AS "departmentName", 
    u.username AS "userName"
  FROM attendance a
  LEFT JOIN users u ON a.user_id = u.id
  WHERE a.date BETWEEN ${startDateObj} AND ${endDateObj}
`
if (departmentName) {
  query = sql`${query} AND u.department = ${departmentName}`
}
query = sql`${query} ORDER BY a.date ASC`
  
      const results = await db.execute(query)
      const rows = results.rows
  
      const departmentGroups = {}
      rows.forEach(record => {
        const deptName = record.departmentName || 'Unknown Department'
  
        if (!departmentGroups[deptName]) {
          departmentGroups[deptName] = {
            departmentName: deptName,
            employees: {},
            summary: {
              present: 0,
              late: 0,
              absent: 0,
              totalWorkDuration: 0
            }
          }
        }
  
        if (!departmentGroups[deptName].employees[record.userId]) {
          departmentGroups[deptName].employees[record.userId] = {
            userId: record.userId,
            userName: record.userName || 'Unknown User',
            records: [],
            summary: {
              present: 0,
              late: 0,
              workDuration: 0
            }
          }
        }
  
        departmentGroups[deptName].employees[record.userId].records.push({
          date: dayjs(record.date).format('YYYY-MM-DD'),
          status: record.status,
          checkInTime: record.checkInTime ? dayjs(record.checkInTime).format('HH:mm:ss') : null,
          checkOutTime: record.checkOutTime ? dayjs(record.checkOutTime).format('HH:mm:ss') : null,
          workDuration: record.workDuration || 0,
          notes: record.notes
        })
  
        if (record.status === 'present') {
          departmentGroups[deptName].employees[record.userId].summary.present++
          departmentGroups[deptName].summary.present++
        } else if (record.status === 'late') {
          departmentGroups[deptName].employees[record.userId].summary.late++
          departmentGroups[deptName].summary.late++
        }
  
        if (record.workDuration) {
          departmentGroups[deptName].employees[record.userId].summary.workDuration += record.workDuration
          departmentGroups[deptName].summary.totalWorkDuration += record.workDuration
        }
      })
  
      const totalDays = dayjs(endDateObj).diff(dayjs(startDateObj), 'day') + 1
      const totalWorkdays = countWorkdays(startDateObj, endDateObj)
  
      const departmentsReport = Object.values(departmentGroups).map(dept => {
        const employeesList = Object.values(dept.employees).map(emp => {
          const avgWorkDuration = emp.records.length > 0
            ? Math.floor(emp.summary.workDuration / emp.records.length)
            : 0
  
          
          emp.summary.absent = totalWorkdays - (emp.summary.present + emp.summary.late)
          if (emp.summary.absent < 0) emp.summary.absent = 0

  
          return {
            userId: emp.userId,
            userName: emp.userName,
            present: emp.summary.present,
            late: emp.summary.late,
            absent: emp.summary.absent,
            averageWorkDuration: `${Math.floor(avgWorkDuration / 60)} jam ${avgWorkDuration % 60} menit`
          }
        })
  
        const totalEmployees = Object.keys(dept.employees).length
        const avgDeptWorkDuration = totalEmployees > 0
          ? Math.floor(dept.summary.totalWorkDuration / totalEmployees)
          : 0
  
        return {
          departmentName: dept.departmentName,
          employeeCount: totalEmployees,
          present: dept.summary.present,
          late: dept.summary.late,
          
          absent: (totalWorkdays * totalEmployees) - (dept.summary.present + dept.summary.late),

          averageWorkDuration: `${Math.floor(avgDeptWorkDuration / 60)} jam ${avgDeptWorkDuration % 60} menit`,
          employees: employeesList
        }
      })
  
      return {
        reportPeriod: {
          startDate: dayjs(startDateObj).format('YYYY-MM-DD'),
          endDate: dayjs(endDateObj).format('YYYY-MM-DD'),
          totalDays
        },
        departments: departmentsReport
      }
    } catch (error) {
      console.error('Error generating report:', error)
      throw new Error(`Failed to generate report: ${error.message}`)
    }
  }
  
  

}

module.exports = new AttendanceService()