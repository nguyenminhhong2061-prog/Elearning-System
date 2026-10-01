import { addDays, calendarWeeks, daysInRange } from '../../src/lib/dates.js'
import { delay, HttpError } from '../http.js'
import { isDue, userState } from '../store.js'
import { MOCK_TOPICS, MOCK_WORDS } from '../vocabularyFixtures.js'
import { cefrOf, latestTestScores, totalsBetween } from './progress.js'

// docs/api/plans.md (module D, D2; scenarios 17 and 18). The backend does not exist yet. Every learner starts with a
// made-up plan in its third week ("Giao tiếp khi đi du lịch", A2 to B1), whose weekly progress is summed from the
// same made-up history as the home page chart, so both screens agree. The AI is replaced by fixed sentences built from
// the goal.

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const THINKING_MS = 1200 // the AI writing the plan
const MAX_PLAN_DAYS = 366
const SKILL_NAMES = { listening: 'Nghe', speaking: 'Nói', reading: 'Đọc', writing: 'Viết' }
const ROADMAP = 'Ưu tiên luyện Nói và Viết, mỗi tuần một chủ đề từ vựng mới, cuối lộ trình làm lại bài kiểm tra tổng hợp.'

const plans = new Map() // userId -> stored plans, oldest first; at most one ACTIVE
let nextPlanId = 1

/** Forgets every plan (the /__mock page's reset). */
export function resetPlanData() {
  plans.clear()
}

const levelIndex = (level) => (level ? LEVELS.indexOf(level) : 0)

/** The learner's level as the mock sees it: the made-up latest comprehensive test. */
function currentLevel() {
  const scores = Object.values(latestTestScores())
  return cefrOf(Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length))
}

function weakestSkill() {
  return Object.entries(latestTestScores()).toSorted((a, b) => a[1] - b[1])[0]
}

/** Suggested minutes a day ("Gợi ý giải pháp" 1 and 2): more levels in less time needs more practice. */
function dailyMinutesFor(startLevel, targetLevel, months) {
  const jump = levelIndex(targetLevel) - levelIndex(startLevel)
  if (jump <= 0) return { min: 15, max: 20 }
  if (jump === 1) return months >= 3 ? { min: 20, max: 30 } : { min: 30, max: 45 }
  return months >= 3 * jump ? { min: 30, max: 45 } : { min: 45, max: 60 }
}

/** Mock of the rule-based weekly targets: about 1.6 words and 0.2 exercises per daily minute, less for a short week. */
function weeklyTargets({ min, max }, days) {
  const minutes = (min + max) / 2
  const share = days / 7
  return {
    targetWords: Math.round((minutes * 1.6 * share) / 5) * 5,
    targetExercises: Math.max(1, Math.round(minutes * 0.2 * share)),
  }
}

function weekDescription(weekNumber, weekCount, targetLevel, words, exercises) {
  if (weekNumber === weekCount) return 'Ôn tập tổng hợp và làm bài kiểm tra tổng hợp để đo tiến bộ'
  const topic = MOCK_TOPICS[(weekNumber - 1) % MOCK_TOPICS.length].name
  const weakest = SKILL_NAMES[weakestSkill()[0]]
  const kinds = [
    `${words} từ chủ đề ${topic}, ${exercises} bài ngữ pháp ${targetLevel}`,
    `Luyện ${weakest}: ${exercises} bài, ôn lại từ của tuần trước`,
    `${words} từ chủ đề ${topic}, luyện nghe hội thoại ngắn`,
    `Làm bài kiểm tra định kỳ, ${words} từ chủ đề ${topic}`,
  ]
  return kinds[(weekNumber - 1) % kinds.length]
}

const isDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
const monthsOf = (startDate, endDate) => Math.max(1, Math.round(daysInRange(startDate, endDate) / 30.4))

/** The weeks of a plan: Monday to Sunday, the first and last cut to its dates. */
const weeksBetween = (startDate, endDate) =>
  calendarWeeks(startDate, endDate).map(({ start, end }, index) => ({ weekNumber: index + 1, startDate: start, endDate: end }))

/** The AI's draft for a goal (POST .../preview): minutes a day, weekly targets and a short advice. */
function draftFor({ targetLevel, startDate, endDate, description, fromAttemptId }, startLevel = currentLevel()) {
  const dailyMinutes = dailyMinutesFor(startLevel, targetLevel, monthsOf(startDate, endDate))
  const dates = weeksBetween(startDate, endDate)
  const weeks = dates.map((week) => {
    const last = week.weekNumber === dates.length
    const { targetWords, targetExercises } = weeklyTargets(dailyMinutes, daysInRange(week.startDate, week.endDate))
    const words = last ? Math.round(targetWords / 2) : targetWords
    return {
      ...week,
      description: weekDescription(week.weekNumber, dates.length, targetLevel, words, targetExercises),
      targetWords: words,
      targetExercises,
    }
  })
  const [skill, score] = weakestSkill()
  const summary = [
    targetLevel === startLevel
      ? `Lộ trình ${weeks.length} tuần để giữ vững ${targetLevel}.`
      : `Lộ trình ${weeks.length} tuần từ ${startLevel ?? 'mức khởi đầu'} lên ${targetLevel}.`,
    fromAttemptId ? `Theo lộ trình đề xuất của bài kiểm tra tổng hợp: ${ROADMAP}` : null,
    `Mỗi ngày học ${dailyMinutes.min}–${dailyMinutes.max} phút: ưu tiên kỹ năng ${SKILL_NAMES[skill]} (điểm thấp nhất, ${score}/100), xen kẽ từ vựng theo chủ đề và ngữ pháp ${targetLevel}.`,
    `Vì mục tiêu của bạn là "${description}", các tuần chọn chủ đề và bài nghe gần với việc đó.`,
  ]
    .filter(Boolean)
    .join(' ')
  return { goal: { targetLevel, description }, startLevel, startDate, endDate, dailyMinutes, summary, weeks }
}

/** Monday of the week of `date`. */
function mondayOf(date) {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay() // 0 = Sunday
  return addDays(date, weekday === 0 ? -6 : 1 - weekday)
}

function plansOf(userId, today) {
  if (!plans.has(userId)) {
    // Began on the Monday two weeks ago, for about three months: this week is week 3.
    const startDate = addDays(mondayOf(today), -14)
    const endDate = addDays(startDate, 7 * 13 - 1)
    const draft = draftFor({ targetLevel: 'B1', startDate, endDate, description: 'Giao tiếp khi đi du lịch' }, 'A2')
    plans.set(userId, [{ ...draft, id: nextPlanId++, status: 'ACTIVE' }])
  }
  return plans.get(userId)
}

/** The plan the learner follows: the active one, else the latest paused one (an ended plan is not shown). */
function currentPlan(userId, today) {
  const list = plansOf(userId, today)
  return list.find((plan) => plan.status === 'ACTIVE') ?? list.findLast((plan) => plan.status === 'PAUSED') ?? null
}

/** A stored plan as GET returns it: this week's number, and each week's status and progress up to today. */
function toResponse(userId, plan, today) {
  const weeks = plan.weeks.map((week) => {
    if (week.startDate > today) return { ...week, wordsDone: 0, exercisesDone: 0, status: 'PENDING', achieved: null }
    const done = totalsBetween(userId, week.startDate, week.endDate, today)
    if (week.endDate >= today) return { ...week, ...done, status: 'IN_PROGRESS', achieved: null }
    const achieved = done.wordsDone >= week.targetWords && done.exercisesDone >= week.targetExercises
    return { ...week, ...done, status: 'DONE', achieved }
  })
  const current = weeks.find((week) => week.status === 'IN_PROGRESS')
  return { ...plan, currentWeek: current?.weekNumber ?? null, weeks }
}

/** Suggested goals for a level ("Gợi ý giải pháp" 1). */
export function goalOptionsFor(level) {
  const index = levelIndex(level)
  const option = (target, months, recommended) => ({
    targetLevel: LEVELS[target],
    months,
    dailyMinutes: dailyMinutesFor(level ?? 'A1', LEVELS[target], months),
    recommended,
  })
  if (index >= LEVELS.length - 1) return [option(index, 3, true)]
  if (index === LEVELS.length - 2) return [option(index + 1, 6, true)]
  return [option(index + 1, 3, true), option(index + 2, 6, false)]
}

/** The rules of scenario 17, step 4: any CEFR level, a description, from today at the earliest, at most a year. */
function checkGoal(body, today) {
  if (!LEVELS.includes(body.targetLevel)) throw new HttpError(400, 'targetLevel must be a CEFR level')
  if (typeof body.description !== 'string' || !body.description.trim() || body.description.length > 255) {
    throw new HttpError(400, 'description must have 1 to 255 characters')
  }
  if (!isDate(body.startDate) || !isDate(body.endDate)) throw new HttpError(400, 'startDate and endDate must be dates (YYYY-MM-DD)')
  if (body.startDate < today) throw new HttpError(400, 'startDate must not be before today')
  if (body.endDate <= body.startDate) throw new HttpError(400, 'endDate must be after startDate')
  if (daysInRange(body.startDate, body.endDate) > MAX_PLAN_DAYS) throw new HttpError(400, 'a plan lasts at most a year')
  if (body.fromAttemptId != null && !Number.isInteger(body.fromAttemptId)) throw new HttpError(400, 'fromAttemptId must be an id')
}

/** Weekly targets the learner typed (scenario 17 branch 8a, scenario 18 branch 6a), in the order of `expected`. */
function checkWeeks(weeks, expected) {
  if (!Array.isArray(weeks) || weeks.length !== expected.length) throw new HttpError(400, `weeks must have ${expected.length} items`)
  weeks.forEach((week, index) => {
    const valid =
      week.weekNumber === expected[index].weekNumber &&
      Number.isInteger(week.targetWords) && week.targetWords >= 0 && week.targetWords <= 500 &&
      Number.isInteger(week.targetExercises) && week.targetExercises >= 0 && week.targetExercises <= 50 &&
      typeof week.description === 'string' && week.description.length <= 255
    if (!valid) throw new HttpError(400, `week ${expected[index].weekNumber} is not valid`)
  })
}

/** What to do next ("Gợi ý giải pháp" 3), from the made-up test and the learner's vocabulary in this mock. */
function suggestions(userId, today) {
  const user = userState(userId, today)
  const [skill, score] = weakestSkill()
  const items = [
    {
      type: 'PRACTICE_SKILL',
      title: `Tập trung luyện ${SKILL_NAMES[skill]} 15 phút/ngày`,
      reason: `Điểm yếu nhất trong 4 kỹ năng (${score}/100)`,
      skill: skill.toUpperCase(),
    },
  ]
  const left = MOCK_TOPICS.map((topic) => ({
    topic,
    count: MOCK_WORDS.filter((word) => word.topicId === topic.id && !user.learning.has(word.id)).length,
  })).toSorted((a, b) => b.count - a.count)[0]
  if (left?.count > 0) {
    items.push({ type: 'LEARN_TOPIC', title: `Ôn tập chủ đề ${left.topic.name}`, reason: `Còn ${left.count} từ chưa học`, topicId: left.topic.id })
  }
  const due = [...user.learning.values()].filter((state) => isDue(state, today)).length
  if (due > 0) items.push({ type: 'REVIEW_WORDS', title: `Ôn ${due} từ đến hạn hôm nay`, reason: 'Ôn đúng hạn giúp nhớ lâu', count: due })
  return { items }
}

export const planRoutes = [
  {
    method: 'GET',
    pattern: /^\/api\/study-plan$/,
    handle({ userId, today }) {
      const plan = currentPlan(userId, today)
      return { plan: plan ? toResponse(userId, plan, today) : null, goalOptions: goalOptionsFor(currentLevel()) }
    },
  },
  {
    method: 'POST',
    pattern: /^\/api\/study-plan\/preview$/,
    async handle({ body, today }) {
      checkGoal(body, today)
      await delay(THINKING_MS)
      return draftFor(body)
    },
  },
  {
    method: 'POST',
    pattern: /^\/api\/study-plan$/,
    status: 201,
    handle({ userId, body, today }) {
      checkGoal(body, today)
      const expected = draftFor(body)
      checkWeeks(body.weeks, expected.weeks)
      const list = plansOf(userId, today)
      // Scenario 17, branch 2b: only one active plan; the one before is paused, not deleted.
      for (const old of list) if (old.status === 'ACTIVE') old.status = 'PAUSED'
      const plan = {
        ...expected,
        goal: { targetLevel: body.targetLevel, description: body.description.trim() },
        id: nextPlanId++,
        status: 'ACTIVE',
        summary: body.summary ?? null,
        weeks: expected.weeks.map((week, index) => ({ ...week, ...body.weeks[index] })),
      }
      list.push(plan)
      return toResponse(userId, plan, today)
    },
  },
  {
    method: 'PUT',
    pattern: /^\/api\/study-plan\/schedule$/,
    handle({ userId, body, today }) {
      const plan = currentPlan(userId, today)
      if (!plan) throw new HttpError(404, 'No study plan')
      const { endDate } = body
      if (!isDate(endDate)) throw new HttpError(400, 'endDate must be a date (YYYY-MM-DD)')
      if (endDate < today) throw new HttpError(400, 'endDate must not be before today')
      if (endDate <= plan.startDate) throw new HttpError(400, 'endDate must be after startDate')
      if (daysInRange(plan.startDate, endDate) > MAX_PLAN_DAYS) throw new HttpError(400, 'a plan lasts at most a year')
      // Weeks already over keep their targets; every other week of the new end date comes in the body.
      const dates = weeksBetween(plan.startDate, endDate)
      const open = dates.filter((week) => week.endDate >= today)
      checkWeeks(body.weeks, open)
      const typed = new Map(body.weeks.map((week) => [week.weekNumber, week]))
      plan.endDate = endDate
      plan.weeks = dates.map((week, index) => {
        const sent = typed.get(week.weekNumber)
        return sent ? { ...week, ...sent } : { ...plan.weeks[index], ...week }
      })
      return toResponse(userId, plan, today)
    },
  },
  {
    method: 'PATCH',
    pattern: /^\/api\/study-plan$/,
    handle({ userId, body, today }) {
      const plan = currentPlan(userId, today)
      if (!plan) throw new HttpError(404, 'No study plan')
      if (!['ACTIVE', 'PAUSED', 'COMPLETED'].includes(body.status)) throw new HttpError(400, 'status must be ACTIVE, PAUSED or COMPLETED')
      plan.status = body.status
      return toResponse(userId, plan, today)
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/study-plan\/suggestions$/,
    handle: ({ userId, today }) => suggestions(userId, today),
  },
]

// --- Scenarios of the /__mock page ---------------------------------------------------------------------------------

/** A learner with nothing yet ("Người mới"): no plan, goals from A1, and only "take the test" and a first topic. */
export function newLearnerPlanReply(pathname) {
  if (pathname === '/api/study-plan') return { plan: null, goalOptions: goalOptionsFor(null) }
  if (pathname === '/api/study-plan/suggestions') {
    return {
      items: [
        { type: 'TAKE_TEST', title: 'Làm bài kiểm tra tổng hợp', reason: 'Để biết trình độ và điểm từng kỹ năng', testId: 200 },
        { type: 'LEARN_TOPIC', title: `Học chủ đề ${MOCK_TOPICS[0].name}`, reason: 'Một chủ đề để bắt đầu học từ vựng', topicId: MOCK_TOPICS[0].id },
      ],
    }
  }
  return undefined
}

/**
 * What the /__mock scenarios change on the plan endpoints ({} when nothing), or null for any other endpoint. Kept here
 * so scenario.js only needs one call.
 */
export function planScenarioEffect(scenario, method, pathname) {
  if (!/^\/api\/study-plan(\/|$)/.test(pathname)) return null
  const preview = method === 'POST' && pathname === '/api/study-plan/preview'
  switch (scenario) {
    case 'slow':
      return { extraDelayMs: 2500 }
    case 'load-error':
      return method === 'GET' ? { reply: { status: 500, message: 'Simulated server error (mock scenario "load-error")' } } : {}
    case 'save-error':
      return method !== 'GET' && !preview ? { reply: { status: 500, message: 'Simulated server error (mock scenario "save-error")' } } : {}
    case 'ai-down':
      return preview ? { reply: { status: 503, message: 'Simulated AI outage (mock scenario "ai-down")' } } : {}
    case 'new-learner': {
      const body = method === 'GET' ? newLearnerPlanReply(pathname) : undefined
      return body ? { reply: { status: 200, body } } : {}
    }
    default:
      return {}
  }
}
