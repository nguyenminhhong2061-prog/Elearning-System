import { CEFR_LEVELS } from '@/api/constants'
import { addDays, formatDayMonth, todayInVietnam } from '@/lib/dates'

// Number and date formats of the admin pages. Instants (ISO-8601 UTC) are shown in Vietnam time, like the rest of the
// app; plain dates ("YYYY-MM-DD") are calendar days already.

const numbers = new Intl.NumberFormat('vi-VN')
const clockTime = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Ho_Chi_Minh' })

/** 4812 -> "4.812". */
export const formatNumber = (value) => numbers.format(value)

/** "2026-09-15" or an instant -> "15/09/2026". */
export function formatFullDate(value) {
  const day = value.length === 10 ? value : todayInVietnam(new Date(value))
  return `${formatDayMonth(day)}/${day.slice(0, 4)}`
}

/** "31/08 – 29/09/2026", or "31/12/2025 – 05/01/2026" across two years. */
export function formatDateRange(from, to) {
  const start = from.slice(0, 4) === to.slice(0, 4) ? formatDayMonth(from) : formatFullDate(from)
  return `${start} – ${formatFullDate(to)}`
}

/**
 * When something happened, for tables and profile lines: "Hôm nay, 09:55", "Hôm qua, 20:15", then the date alone.
 * @param {string} instant
 * @param {{ lowercase?: boolean, today?: string }} [options] lowercase inside a sentence ("hoạt động gần nhất: hôm qua…")
 */
export function describeLastActive(instant, { lowercase = false, today = todayInVietnam() } = {}) {
  const moment = new Date(instant)
  const day = todayInVietnam(moment)
  let label = null
  if (day === today) label = 'Hôm nay'
  else if (day === addDays(today, -1)) label = 'Hôm qua'
  if (!label) return formatFullDate(day)
  const text = `${label}, ${clockTime.format(moment)}`
  return lowercase ? text.charAt(0).toLocaleLowerCase('vi') + text.slice(1) : text
}

/** Time of an entry in an activity feed: "Hôm qua, 23:40" for the last two days, "27/09, 21:10" before. */
export function describeActivityTime(instant, today = todayInVietnam()) {
  const moment = new Date(instant)
  const day = todayInVietnam(moment)
  if (day === today || day === addDays(today, -1)) return describeLastActive(instant, { today })
  return `${formatDayMonth(day)}, ${clockTime.format(moment)}`
}

/** Hour and minute in Vietnam time: "10:30". */
export const formatClock = (instant) => clockTime.format(new Date(instant))

/** Whole days from today to a later date (0 on the day itself). */
export function daysUntil(isoDate, today = todayInVietnam()) {
  return Math.round((Date.parse(`${isoDate}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000)
}

/** "dd/mm/yyyy" typed by the admin -> "YYYY-MM-DD", or null when it is not a real date. */
export function parseTypedDate(text) {
  const match = /^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/.exec(text ?? '')
  if (!match) return null
  const [, day, month, year] = match
  const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  const date = new Date(`${iso}T00:00:00Z`)
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso ? null : iso
}

/** Level names of the admin tables: null is a learner whose level has not been determined yet. */
export const levelLabel = (level) => level ?? 'Chưa xác định'

export const SKILL_LABELS = { GRAMMAR: 'Ngữ pháp', LISTENING: 'Nghe hiểu', PRONUNCIATION: 'Phát âm' }
export const TEST_SKILL_LABELS = { LISTENING: 'Nghe', SPEAKING: 'Nói', READING: 'Đọc', WRITING: 'Viết' }
export const DIFFICULTY_LABELS = { EASY: 'Dễ', MEDIUM: 'Vừa', HARD: 'Khó' }

/** Options of a level filter: every level, optionally "Chưa xác định" (value NONE) for learners. */
export function levelOptions({ withNone = false } = {}) {
  return [
    { value: '', label: 'Tất cả' },
    ...(withNone ? [{ value: 'NONE', label: 'Chưa xác định' }] : []),
    ...CEFR_LEVELS.map((level) => ({ value: level, label: level })),
  ]
}

/** ISO week number of a "YYYY-MM-DD" date: weekly tests are named after it ("tuần 41"). */
export function isoWeek(isoDate) {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7) + 3) // the Thursday of that week decides the year
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4))
  firstThursday.setUTCDate(firstThursday.getUTCDate() - ((firstThursday.getUTCDay() + 6) % 7) + 3)
  return 1 + Math.round((date - firstThursday) / (7 * 86_400_000))
}
