'use strict'

const cron = require('node-cron')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const { eq, and, isNull, sql } = require('drizzle-orm')
const { db } = require('../db/connection')
const { attendance, CHECKOUT_TYPES } = require('../models/schema/attendance')

dayjs.extend(utc)
dayjs.extend(timezone)

function startCheckoutSchedulers(app) {
  app.log.info('[SCHEDULER] Initializing auto-checkout scheduler')

  // Jalankan tiap 10 detik (*/10 * * * * *)
  const job = cron.schedule('0 18 * * *', async () => {
    const now = dayjs().tz('Asia/Jakarta')
    const todayStart = now.startOf('day').toDate()
    const todayEnd   = now.endOf('day').toDate()

    app.log.info(`[CRON] Scheduler auto-checkout running at ${now.format('HH:mm:ss')} WIB`)

    try {
      // Cari record hari ini tanpa checkout time
      const records = await db
        .select()
        .from(attendance)
        .where(
          and(
            isNull(attendance.checkOutTime),
            // Gunakan BETWEEN untuk mencakup semua timestamp hari ini
            sql`${attendance.date} BETWEEN ${todayStart} AND ${todayEnd}`
          )
        )

      app.log.info(`[AUTO CHECKOUT] Ditemukan ${records.length} user yang belum check-out`)

      for (const record of records) {
        if (!record.checkInTime) continue

        const checkIn = dayjs(record.checkInTime).tz('Asia/Jakarta')
        const duration = now.diff(checkIn, 'minute')
        const checkOutDate = now.toDate()

        const dataToSet = {
          checkOutTime: checkOutDate,
          workDuration: Number(duration),
          checkOutType: String(CHECKOUT_TYPES.AUTO),
          checkOutLocation: String(CHECKOUT_TYPES.AUTO),
          checkOutIp: String(CHECKOUT_TYPES.AUTO),
          checkOutDevice: String(CHECKOUT_TYPES.AUTO),
          updatedAt: new Date()
        }

        await db.update(attendance)
          .set(dataToSet)
          .where(eq(attendance.id, record.id))

        app.log.info(`[AUTO CHECKOUT] User ID ${record.userId} auto-checkout @ ${now.format('HH:mm:ss')} WIB`)
      }
    } catch (error) {
      app.log.error(`[SCHEDULER ERROR] ${error.stack || error.message}`)
    }
  })

  app.decorate('autoCheckoutJob', job)

  app.addHook('onClose', (instance, done) => {
    if (instance.autoCheckoutJob) {
      instance.autoCheckoutJob.stop()
      instance.log.info('[SCHEDULER] Auto-checkout job dihentikan')
    }
    done()
  })

  return job
}

module.exports = { startCheckoutSchedulers }
