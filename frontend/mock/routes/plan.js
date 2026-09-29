import { addDays } from '../../src/lib/dates.js'
import { delay, HttpError } from '../http.js'
import { isDue, userState } from '../store.js'
import { MOCK_TOPICS, MOCK_WORDS } from '../vocabularyFixtures.js'
import { cefrOf, latestTestScores, totalsBetween } from './progress.js'

// docs/api/plans.md (module D, D2). The backend does not exist yet. Every learner starts with a made-up plan in its
// third week ("Đạt B1 trong 3 tháng", begun 16 days ago), whose weekly progress is summed from the same made-up history
// as the home page chart, so both screens agree. The AI is replaced by fixed sentences built from the goal.

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const THINKING_MS = 1200 // the AI writing the plan
const SEEDED_START_DAYS_AGO = 16
const SKILL_NAMES = { listening: 'Nghe', speaking: 'Nói', reading: 'Đọc', writing: 'Viết' }

const plans = new Map() // userId -> { plan: stored plan | null, reminder }
let nextPlanId = 1

/** Forgets every plan and reminder (the /__mock page's reset). */
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

/** "YYYY-MM-DD" plus a number of months, minus one day: the last day of a plan. */
function endDateOf(startDate, months) {
  const date = new Date(`${startDate}T00:00:00Z`)
  date.setUTCMonth(date.getUTCMonth() + months)
  date.setUTCDate(date.getUTCDate() - 1)
  return date.toISOString().slice(0, 10)
}

const daysBetween = (from, to) => Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000) + 1

/** Suggested minutes a day ("Gợi ý giải pháp" 1 and 2): more levels in less time needs more practice. */
function dailyMinutesFor(startLevel, targetLevel, months) {
  const jump = levelIndex(targetLevel) - levelIndex(startLevel)
  if (jump <= 0) return { min: 15, max: 20 }
  if (jump === 1) return months >= 3 ? { min: 20, max: 30 } : { min: 30, max: 45 }
  return months >= 3 * jump ? { min: 30, max: 45 } : { min: 45, max: 60 }
}

/** Mock of the rule-based weekly targets: about 1.6 words and 0.2 exercises per daily minute. */
function weeklyTargets({ min, max }) {
  const minutes = (min + max) / 2
  return { targetWords: Math.round((minutes * 1.6) / 5) * 5, targetExercises: Math.max(1, Math.round(minutes * 0.2)) }
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

/** The AI's draft for a goal (POST .../preview): dates, minutes, weekly targets and a short advice. */
function draftFor({ targetLevel, months, note }, today, startLevel = currentLevel()) {
  const startDate = today
  const endDate = endDateOf(startDate, months)
  const weekCount = Math.ceil(daysBetween(startDate, endDate) / 7)
  const dailyMinutes = dailyMinutesFor(startLevel, targetLevel, months)
  const { targetWords, targetExercises } = weeklyTargets(dailyMinutes)
  const weeks = Array.from({ length: weekCount }, (_, index) => {
    const weekNumber = index + 1
    const weekStart = addDays(startDate, index * 7)
    const last = weekNumber === weekCount
    const words = last ? Math.round(targetWords / 2) : targetWords
    return {
      weekNumber,
      startDate: weekStart,
      endDate: last ? endDate : addDays(weekStart, 6),
      description: weekDescription(weekNumber, weekCount, targetLevel, words, targetExercises),
      targetWords: words,
      targetExercises,
    }
  })
  const [skill, score] = weakestSkill()
  const keeping = targetLevel === startLevel
  const summary = [
    keeping
      ? `Lộ trình ${weekCount} tuần để giữ vững ${targetLevel}.`
      : `Lộ trình ${weekCount} tuần từ ${startLevel ?? 'mức khởi đầu'} lên ${targetLevel}.`,
    `Mỗi ngày học ${dailyMinutes.min}–${dailyMinutes.max} phút: ưu tiên kỹ năng ${SKILL_NAMES[skill]} (điểm thấp nhất, ${score}/100), xen kẽ từ vựng theo chủ đề và ngữ pháp ${targetLevel}.`,
    note ? `Vì mục tiêu của bạn là "${note}", các tuần chọn chủ đề và bài nghe gần với việc đó.` : null,
    'Cuối mỗi tháng làm một bài kiểm tra định kỳ để xem tiến bộ.',
  ]
    .filter(Boolean)
    .join(' ')
  return { goal: { targetLevel, months, note: note ?? null }, startLevel, startDate, endDate, dailyMinutes, summary, weeks }
}

function stateOf(userId, today) {
  if (!plans.has(userId)) {
    const startDate = addDays(today, -SEEDED_START_DAYS_AGO)
    const draft = draftFor({ targetLevel: 'B1', months: 3, note: 'Giao tiếp khi đi du lịch' }, startDate, 'A2')
    plans.set(userId, { plan: { ...draft, id: nextPlanId++, status: 'ACTIVE' }, reminder: { enabled: true, time: '20:00' } })
  }
  return plans.get(userId)
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

function checkGoal(body) {
  if (!LEVELS.includes(body.targetLevel)) throw new HttpError(400, 'targetLevel must be a CEFR level')
  if (!Number.isInteger(body.months) || body.months < 1 || body.months > 12) throw new HttpError(400, 'months must be from 1 to 12')
  if (body.note != null && (typeof body.note !== 'string' || body.note.length > 255)) throw new HttpError(400, 'note must be at most 255 characters')
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

const TIME = /^([01]\d|2[0-3]):(00|30)$/

export const planRoutes = [
  {
    method: 'GET',
    pattern: /^\/api\/study-plan$/,
    handle({ userId, today }) {
      const { plan } = stateOf(userId, today)
      return { plan: plan ? toResponse(userId, plan, today) : null, goalOptions: goalOptionsFor(currentLevel()) }
    },
  },
  {
    method: 'POST',
    pattern: /^\/api\/study-plan\/preview$/,
    async handle({ body, today }) {
      checkGoal(body)
      await delay(THINKING_MS)
      return draftFor(body, today)
    },
  },
  {
    method: 'POST',
    pattern: /^\/api\/study-plan$/,
    status: 201,
    handle({ userId, body, today }) {
      checkGoal(body)
      const expected = draftFor(body, today)
      const weeks = Array.isArray(body.weeks) ? body.weeks : []
      if (weeks.length !== expected.weeks.length) throw new HttpError(400, `weeks must have ${expected.weeks.length} items`)
      weeks.forEach((week, index) => {
        const valid =
          week.weekNumber === index + 1 &&
          Number.isInteger(week.targetWords) && week.targetWords >= 0 && week.targetWords <= 500 &&
          Number.isInteger(week.targetExercises) && week.targetExercises >= 0 && week.targetExercises <= 50 &&
          typeof week.description === 'string' && week.description.length >= 1 && week.description.length <= 255
        if (!valid) throw new HttpError(400, `week ${index + 1} is not valid`)
      })
      const plan = {
        ...expected,
        id: nextPlanId++,
        status: 'ACTIVE',
        summary: body.summary ?? null,
        weeks: expected.weeks.map((week, index) => ({ ...week, ...weeks[index] })),
      }
      stateOf(userId, today).plan = plan
      return toResponse(userId, plan, today)
    },
  },
  {
    method: 'PATCH',
    pattern: /^\/api\/study-plan$/,
    handle({ userId, body, today }) {
      const state = stateOf(userId, today)
      if (!state.plan) throw new HttpError(404, 'No study plan')
      if (body.status !== 'ACTIVE' && body.status !== 'PAUSED') throw new HttpError(400, 'status must be ACTIVE or PAUSED')
      state.plan = { ...state.plan, status: body.status }
      return toResponse(userId, state.plan, today)
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/study-plan\/suggestions$/,
    handle: ({ userId, today }) => suggestions(userId, today),
  },
  {
    method: 'GET',
    pattern: /^\/api\/study-plan\/reminder$/,
    handle: ({ userId, today }) => stateOf(userId, today).reminder,
  },
  {
    method: 'PUT',
    pattern: /^\/api\/study-plan\/reminder$/,
    handle({ userId, body, today }) {
      if (typeof body.enabled !== 'boolean') throw new HttpError(400, 'enabled must be true or false')
      if (typeof body.time !== 'string' || !TIME.test(body.time)) throw new HttpError(400, 'time must be HH:00 or HH:30')
      const state = stateOf(userId, today)
      state.reminder = { enabled: body.enabled, time: body.time }
      return state.reminder
    },
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
