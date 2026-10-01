import { CEFR_LEVELS } from '@/api/constants'
import { calendarWeeks, daysInRange, formatDayMonth, lastDayAfterMonths } from '@/lib/dates'

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

/** "B1 → B2", "B1 (giữ vững)", or "→ B2" when the level at the start was unknown. */
export function levelPath(startLevel, targetLevel) {
  if (!startLevel) return `→ ${targetLevel}`
  return startLevel === targetLevel ? `${targetLevel} (giữ vững)` : `${startLevel} → ${targetLevel}`
}

/**
 * Scenario 17, branch 4b: a target not above the current level is allowed (to consolidate it) but pointed out.
 * @returns {string | null}
 */
export function levelWarning(targetLevel, currentLevel) {
  if (!currentLevel) return null
  const difference = CEFR_LEVELS.indexOf(targetLevel) - CEFR_LEVELS.indexOf(currentLevel)
  if (difference > 0) return null
  if (difference === 0) return `${targetLevel} là trình độ hiện tại của bạn: kế hoạch sẽ giúp giữ vững trình độ này.`
  return `${targetLevel} thấp hơn trình độ hiện tại (${currentLevel}). Bạn vẫn có thể tiếp tục để củng cố kiến thức nền.`
}

/** The dates a suggested goal fills in: from today, for its number of months. */
export const datesForMonths = (months, today) => ({ startDate: today, endDate: lastDayAfterMonths(today, months) })

/** A plan lasts at most a year. */
export const MAX_PLAN_DAYS = 366

/**
 * The weeks of a plan: Monday to Sunday, the first and last cut to its dates, numbered from 1.
 * @returns {{ weekNumber: number, startDate: string, endDate: string }[]}
 */
export function planWeeks(startDate, endDate) {
  return calendarWeeks(startDate, endDate).map(({ start, end }, index) => ({ weekNumber: index + 1, startDate: start, endDate: end }))
}

/**
 * Scenario 17 branch 5a, "Tự lập kế hoạch": the weeks of the goal with nothing in them, for the learner to fill in.
 * @param {import('./types').GoalRequest} goal
 * @returns {import('./types').PlanDraft}
 */
export function emptyDraft(goal, startLevel) {
  return {
    goal: { targetLevel: goal.targetLevel, description: goal.description },
    startLevel,
    startDate: goal.startDate,
    endDate: goal.endDate,
    dailyMinutes: null,
    summary: null,
    weeks: planWeeks(goal.startDate, goal.endDate).map((week) => ({ ...week, description: '', targetWords: '', targetExercises: '' })),
  }
}

/** "12/10/2026 – 03/01/2027 · 12 tuần" */
export const periodLine = (startDate, endDate, weekCount) => `${formatDate(startDate)} – ${formatDate(endDate)} · ${weekCount} tuần`

/**
 * Scenario 17 step 4 and branch 4a: what is wrong with the goal, field by field ({} when it can be sent).
 * @param {{ description: string, startDate: string, endDate: string }} goal
 * @param {string} today "YYYY-MM-DD"
 */
export function goalErrors({ description, startDate, endDate }, today) {
  const errors = {}
  if (!description.trim()) errors.description = 'Vui lòng nhập mô tả mục tiêu.'
  if (!startDate) errors.startDate = 'Vui lòng chọn ngày bắt đầu.'
  else if (startDate < today) errors.startDate = 'Ngày bắt đầu không được trước hôm nay.'
  if (!endDate) errors.endDate = 'Vui lòng chọn ngày kết thúc.'
  else if (startDate && endDate <= startDate) errors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu.'
  else if (startDate && daysInRange(startDate, endDate) > MAX_PLAN_DAYS) errors.endDate = 'Kế hoạch dài tối đa 12 tháng.'
  return errors
}

/** Highest weekly targets the API accepts. */
export const TARGET_LIMITS = Object.freeze({ targetWords: 500, targetExercises: 50 })

/**
 * Scenario 17 branch 8a, scenario 18 branch 6a: a weekly target must be a whole number from 0 to its limit.
 * @param {string} value what the learner typed
 * @returns {string | null}
 */
export function targetError(value, max) {
  const text = String(value).trim()
  if (!/^\d+$/.test(text)) return 'Nhập số nguyên không âm.'
  return Number(text) > max ? `Tối đa ${max}.` : null
}

/** Errors of the editable weeks, by week number and field; empty when every target is valid. */
export function weekErrors(weeks, editable = () => true) {
  const errors = {}
  for (const week of weeks) {
    if (!editable(week)) continue
    for (const field of ['targetWords', 'targetExercises']) {
      const message = targetError(week[field], TARGET_LIMITS[field])
      if (message) errors[week.weekNumber] = { ...errors[week.weekNumber], [field]: message }
    }
  }
  return errors
}

/** The rows as the API wants them: targets as numbers (call only once `weekErrors` is empty). */
export const withNumberTargets = (weeks) =>
  weeks.map((week) => ({ ...week, targetWords: Number(week.targetWords), targetExercises: Number(week.targetExercises) }))

/** Where today falls in a plan: before its first day, during it, or after its last day. */
export function planPhase(plan, today) {
  if (today < plan.startDate) return 'NOT_STARTED'
  return today > plan.endDate ? 'ENDED' : 'RUNNING'
}

/**
 * The latest finished week, when its targets were missed: the D2 exception, shown as a gentle warning (no penalty).
 * @param {import('./types').StudyPlan} plan
 */
export function lastMissedWeek(plan) {
  const finished = plan.weeks.filter((week) => week.status === 'DONE')
  const last = finished.at(-1)
  return last?.achieved === false ? last : null
}

/** The week in progress, or null before the plan starts and once its end date has passed. */
export function currentWeekOf(plan) {
  return plan.weeks.find((week) => week.weekNumber === plan.currentWeek) ?? null
}

/** Share of a target reached, 0 to 1 (a target of 0 counts as reached). */
export const share = (done, target) => (target > 0 ? Math.min(1, done / target) : 1)

/** "2026-12-12" -> "12/12/2026". */
export const formatDate = (isoDate) => `${formatDayMonth(isoDate)}/${isoDate.slice(0, 4)}`

/** "13/09 – 19/09" */
export const formatRange = (start, end) => `${formatDayMonth(start)} – ${formatDayMonth(end)}`

/** "Tăng 8 điểm so với lần kiểm tra trước", or null for a first comprehensive test. */
export function scoreChange(overallScore, previousOverallScore) {
  if (previousOverallScore === null || previousOverallScore === undefined || overallScore === null) return null
  const difference = overallScore - previousOverallScore
  if (difference === 0) return 'Bằng điểm lần kiểm tra trước'
  return `${difference > 0 ? 'Tăng' : 'Giảm'} ${Math.abs(difference)} điểm so với lần kiểm tra trước`
}

/** Scenario 17 step 8: one reminder per week of an active plan. */
export const REMINDER_LINE = 'Nhắc nhở: 8:00 thứ Hai đầu mỗi tuần'
