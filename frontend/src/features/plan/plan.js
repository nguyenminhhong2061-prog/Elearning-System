import { CEFR_LEVELS } from '@/api/constants'
import { formatDayMonth } from '@/lib/dates'

// Pure helpers of the study plan page (D2). The contract is docs/api/plans.md.

/** Tab of the exercises page that practises each tested skill (grammar covers reading and writing). */
const EXERCISE_TAB = { LISTENING: 'listening', SPEAKING: 'pronunciation', READING: 'grammar', WRITING: 'grammar' }

/**
 * Where the "Bắt đầu" button of a suggestion leads, or null for a type this version does not know.
 * @param {import('./types').Suggestion} item
 */
export function suggestionLink(item) {
  switch (item.type) {
    case 'PRACTICE_SKILL':
      return `/exercises?skill=${EXERCISE_TAB[item.skill] ?? 'grammar'}`
    case 'LEARN_TOPIC':
      return `/vocabulary/topics/${item.topicId}`
    case 'REVIEW_WORDS':
      return '/vocabulary/review'
    case 'TAKE_TEST':
      return item.testId ? `/tests/${item.testId}` : '/tests'
    default:
      return null
  }
}

/** "Đạt B1 trong 3 tháng", or "Giữ vững C2 trong 3 tháng" when the target is the level the learner already has. */
export function goalTitle({ targetLevel, months }, currentLevel) {
  return `${targetLevel === currentLevel ? 'Giữ vững' : 'Đạt'} ${targetLevel} trong ${months} tháng`
}

export const minutesLabel = ({ min, max }) => `${min}–${max} phút/ngày`

/** Levels a goal may aim at: the current one (to keep it) and every level above; all of them when it is unknown. */
export function targetLevels(currentLevel) {
  const from = currentLevel ? CEFR_LEVELS.indexOf(currentLevel) : 0
  return CEFR_LEVELS.slice(Math.max(from, 0))
}

/** Durations a learner may choose for their own goal, in months (1 to 12, as the API accepts). */
export const MONTH_CHOICES = Object.freeze(Array.from({ length: 12 }, (_, index) => index + 1))

/**
 * The latest finished week, when its targets were missed: the D2 exception, shown as a gentle warning (no penalty).
 * @param {import('./types').StudyPlan} plan
 */
export function lastMissedWeek(plan) {
  const finished = plan.weeks.filter((week) => week.status === 'DONE')
  const last = finished.at(-1)
  return last?.achieved === false ? last : null
}

/** The week in progress, or null once the plan's end date has passed. */
export function currentWeekOf(plan) {
  return plan.weeks.find((week) => week.weekNumber === plan.currentWeek) ?? null
}

/** Share of a target reached, 0 to 1 (a target of 0 counts as reached). */
export const share = (done, target) => (target > 0 ? Math.min(1, done / target) : 1)

/** "2026-12-12" -> "12/12/2026". */
export const formatDate = (isoDate) => `${formatDayMonth(isoDate)}/${isoDate.slice(0, 4)}`

/** "13/09 – 19/09" */
export const formatRange = (start, end) => `${formatDayMonth(start)} – ${formatDayMonth(end)}`

/** Reminder times offered: every half hour from 05:00 to 23:30 (the API accepts minutes 00 and 30). */
export const REMINDER_TIMES = Object.freeze(
  Array.from({ length: 38 }, (_, index) => {
    const minutes = 5 * 60 + index * 30
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${minutes % 60 === 0 ? '00' : '30'}`
  }),
)

/** "Tăng 8 điểm so với lần kiểm tra trước", or null for a first comprehensive test. */
export function scoreChange(overallScore, previousOverallScore) {
  if (previousOverallScore === null || previousOverallScore === undefined || overallScore === null) return null
  const difference = overallScore - previousOverallScore
  if (difference === 0) return 'Bằng điểm lần kiểm tra trước'
  return `${difference > 0 ? 'Tăng' : 'Giảm'} ${Math.abs(difference)} điểm so với lần kiểm tra trước`
}
