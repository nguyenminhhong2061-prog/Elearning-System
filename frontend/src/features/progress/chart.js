import { CEFR_LEVELS } from '@/api/constants'
import { formatDate, formatDayMonth, formatWeekday } from '@/lib/dates'
import { formatCount } from '@/features/vocabulary/topicProgress'
import { PERIODS } from './constants'

const SHORT_WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const dayOfWeek = (isoDate) => new Date(`${isoDate}T00:00:00Z`).getUTCDay()
const monthOf = (isoDate) => Number(isoDate.slice(5, 7))

/**
 * Short label under a bar: "T2" for a day (its day of the month when there are more than 7 bars), "21/09" (its first
 * day) for a week, "Tháng 9" for a month.
 */
export function bucketLabel(bucket, period, count = 7) {
  if (period === 'DAY') return count > 7 ? String(Number(bucket.start.slice(8, 10))) : SHORT_WEEKDAYS[dayOfWeek(bucket.start)]
  if (period === 'WEEK') return formatDayMonth(bucket.start)
  return `Tháng ${monthOf(bucket.start)}`
}

/** Full name of a bar for screen readers: "Thứ Hai 21/09", "Tuần 21/09 – 27/09", "Tháng 9/2026". */
export function bucketName(bucket, period) {
  if (period === 'DAY') return `${formatWeekday(bucket.start)} ${formatDayMonth(bucket.start)}`
  if (period === 'WEEK') return `Tuần ${formatDayMonth(bucket.start)} – ${formatDayMonth(bucket.end)}`
  return `Tháng ${monthOf(bucket.start)}/${bucket.start.slice(0, 4)}`
}

export const rangeOf = (period) => PERIODS.find((candidate) => candidate.id === period).range

/** ISO week number (weeks from Monday; week 1 holds the year's first Thursday): "36" for 31/08/2026. */
export function isoWeek(isoDate) {
  const thursday = new Date(`${isoDate}T00:00:00Z`)
  thursday.setUTCDate(thursday.getUTCDate() + 3 - ((thursday.getUTCDay() + 6) % 7))
  return Math.floor((thursday - Date.UTC(thursday.getUTCFullYear(), 0, 1)) / 604_800_000) + 1
}

/** First cell of a row of the data table (scenario 16): "Thứ Hai 21/09", "36 (31/08–06/09)", "9/2026". */
export function rowName(bucket, period) {
  if (period === 'DAY') return bucketName(bucket, period)
  if (period === 'WEEK') return `${isoWeek(bucket.start)} (${formatDayMonth(bucket.start)}–${formatDayMonth(bucket.end)})`
  return `${monthOf(bucket.start)}/${bucket.start.slice(0, 4)}`
}

/** What the chart covers: "7 ngày qua" by default, "từ 31/08/2026 đến 06/10/2026" for a chosen range. */
export function rangeName(activity, chosen) {
  return chosen ? `từ ${formatDate(activity.from)} đến ${formatDate(activity.to)}` : rangeOf(activity.period)
}

export const MAX_BUCKETS = 31 // the API refuses a chosen range with more days, weeks or months than this
const PERIOD_UNITS = { DAY: 'ngày', WEEK: 'tuần', MONTH: 'tháng' }
const epochDay = (isoDate) => Date.parse(`${isoDate}T00:00:00Z`) / 86_400_000
const monthIndex = (isoDate) => Number(isoDate.slice(0, 4)) * 12 + monthOf(isoDate)

/** How many bars a chosen range makes (weeks run Monday to Sunday; 01/01/1970 was a Thursday). */
export function bucketCount(period, from, to) {
  if (period === 'DAY') return epochDay(to) - epochDay(from) + 1
  if (period === 'WEEK') return Math.floor((epochDay(to) + 3) / 7) - Math.floor((epochDay(from) + 3) / 7) + 1
  return monthIndex(to) - monthIndex(from) + 1
}

/** Why "Xem" cannot show a range (scenario 16, branch 5a), or null when it can. Dates are "YYYY-MM-DD". */
export function rangeError(period, from, to, today) {
  if (!from || !to) return 'Vui lòng chọn ngày bắt đầu và ngày kết thúc.'
  if (from > to) return 'Ngày bắt đầu phải trước hoặc trùng ngày kết thúc.'
  if (to > today) return 'Ngày kết thúc không được sau hôm nay.'
  if (bucketCount(period, from, to) > MAX_BUCKETS) {
    return `Khoảng thời gian quá dài: mỗi lần xem được tối đa ${MAX_BUCKETS} ${PERIOD_UNITS[period]}.`
  }
  return null
}

const daysFromTo = (from, to) => Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000) + 1

/** True when nothing at all happened in the range (a new learner, or a long break). */
export function isEmptyActivity(activity) {
  const { wordsLearned, exercisesCompleted, testsCompleted, studyMinutes } = activity.totals
  return wordsLearned + exercisesCompleted + testsCompleted + studyMinutes === 0
}

/** "7 ngày qua: 43 từ mới · 5 bài tập · 1 bài kiểm tra, trung bình 62 điểm · trung bình 22 phút học mỗi ngày". */
export function summaryLine(activity, label = rangeOf(activity.period)) {
  const { wordsLearned, exercisesCompleted, testsCompleted, studyMinutes, averageTestScore } = activity.totals
  const tests = testsCompleted > 0 ? `${testsCompleted} bài kiểm tra, trung bình ${averageTestScore} điểm` : 'chưa làm bài kiểm tra'
  const perDay = Math.round(studyMinutes / daysFromTo(activity.from, activity.to))
  const range = label.charAt(0).toLocaleUpperCase('vi') + label.slice(1)
  return `${range}: ${formatCount(wordsLearned)} từ mới · ${formatCount(exercisesCompleted)} bài tập · ${tests} · trung bình ${perDay} phút học mỗi ngày`
}

/**
 * The lesson "Học tiếp" suggests when nothing is unfinished: the first reading lesson never completed at the learner's
 * level (A1 when unknown), else the first one never completed above it. `lessons` come sorted A1 to C2 by the API.
 *
 * @param {import('@/features/exercises/types').LessonSummary[]} lessons
 * @param {string | null} currentLevel
 */
export function nextLesson(lessons, currentLevel) {
  const level = currentLevel ?? CEFR_LEVELS[0]
  const fresh = lessons.filter((lesson) => lesson.progress.attemptCount === 0 && CEFR_LEVELS.indexOf(lesson.cefrLevel) >= CEFR_LEVELS.indexOf(level))
  return fresh.find((lesson) => lesson.cefrLevel === level) ?? fresh[0] ?? null
}
