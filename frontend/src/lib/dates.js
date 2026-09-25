// Review dates are calendar days in Vietnam time ("YYYY-MM-DD", the DATE column next_review_at), so "today" must be
// computed in Asia/Ho_Chi_Minh, not in the browser's time zone or UTC.

const TIME_ZONE = 'Asia/Ho_Chi_Minh'
const isoDay = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }) // en-CA formats as YYYY-MM-DD
const weekday = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', timeZone: 'UTC' })

/** Today's date in Vietnam as "YYYY-MM-DD". */
export function todayInVietnam(now = new Date()) {
  return isoDay.format(now)
}

// A "YYYY-MM-DD" string read as midnight UTC, only ever formatted in UTC so the day never shifts.
const asUtc = (isoDate) => new Date(`${isoDate}T00:00:00Z`)

export function addDays(isoDate, days) {
  const date = asUtc(isoDate)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/** "2026-09-28" -> "28/09". Built by hand: Intl's Vietnamese day/month separator differs between engines. */
export function formatDayMonth(isoDate) {
  return `${isoDate.slice(8, 10)}/${isoDate.slice(5, 7)}`
}

/** "2026-09-28" -> "Thứ Hai". */
export function formatWeekday(isoDate) {
  const name = weekday.format(asUtc(isoDate))
  return name.charAt(0).toLocaleUpperCase('vi') + name.slice(1)
}

const clockTime = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: TIME_ZONE })

/** An instant as Vietnam time: "15:05" today, "15:05, 24/09" on another day. */
export function formatMoment(isoInstant, today = todayInVietnam()) {
  const moment = new Date(isoInstant)
  const time = clockTime.format(moment)
  const day = todayInVietnam(moment)
  return day === today ? time : `${time}, ${formatDayMonth(day)}`
}

/** When a word is next reviewed, relative to today: "hôm nay", "ngày mai" or "28/09" (overdue dates count as today). */
export function describeReviewDate(isoDate, today = todayInVietnam()) {
  if (isoDate <= today) return 'hôm nay'
  if (isoDate === addDays(today, 1)) return 'ngày mai'
  return formatDayMonth(isoDate)
}
