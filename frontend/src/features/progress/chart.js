import { CEFR_LEVELS } from '@/api/constants'
import { formatDayMonth, formatWeekday } from '@/lib/dates'
import { formatCount } from '@/features/vocabulary/topicProgress'
import { PERIODS } from './constants'

const SHORT_WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const dayOfWeek = (isoDate) => new Date(`${isoDate}T00:00:00Z`).getUTCDay()
const monthOf = (isoDate) => Number(isoDate.slice(5, 7))

/** Short label under a bar: "T2" for a day, "21/09" (its Monday) for a week, "Tháng 9" for a month. */
export function bucketLabel(bucket, period) {
  if (period === 'DAY') return SHORT_WEEKDAYS[dayOfWeek(bucket.start)]
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

const daysFromTo = (from, to) => Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000) + 1

/** True when nothing at all happened in the range (a new learner, or a long break). */
export function isEmptyActivity(activity) {
  const { wordsLearned, exercisesCompleted, testsCompleted, studyMinutes } = activity.totals
  return wordsLearned + exercisesCompleted + testsCompleted + studyMinutes === 0
}

/** "7 ngày qua: 43 từ mới · 5 bài tập · 1 bài kiểm tra, trung bình 62 điểm · trung bình 22 phút học mỗi ngày". */
export function summaryLine(activity) {
  const { wordsLearned, exercisesCompleted, testsCompleted, studyMinutes, averageTestScore } = activity.totals
  const tests = testsCompleted > 0 ? `${testsCompleted} bài kiểm tra, trung bình ${averageTestScore} điểm` : 'chưa làm bài kiểm tra'
  const perDay = Math.round(studyMinutes / daysFromTo(activity.from, activity.to))
  return `${rangeOf(activity.period)}: ${formatCount(wordsLearned)} từ mới · ${formatCount(exercisesCompleted)} bài tập · ${tests} · trung bình ${perDay} phút học mỗi ngày`
}

/**
 * The lesson "Học tiếp" suggests when nothing is unfinished: the first grammar lesson never completed at the learner's
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
