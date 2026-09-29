import { addDays, todayInVietnam } from '../../src/lib/dates.js'
import { HttpError } from '../http.js'
import { exerciseCompletionsOn } from './exercises.js'

// docs/api/progress.md (module D, D1). The backend of module D does not exist yet: the history below is made up per
// learner, and only what this mock can see happening is added live (study minutes, exercises completed today).

const PERIODS = { DAY: 7, WEEK: 12, MONTH: 6 }
const HISTORY_DAYS = 200 // enough for 6 calendar months
const STARTED_DAYS_AGO = 58 // a learner who began about two months ago

// Suggested seed of docs/api/progress.md, "Câu hỏi mở" 7.
const BADGES = [
  { id: 1, name: 'Chăm chỉ 3 ngày', description: 'Học 3 ngày liên tiếp', type: 'STREAK_DAYS', value: 3 },
  { id: 2, name: 'Chăm chỉ 7 ngày', description: 'Học 7 ngày liên tiếp', type: 'STREAK_DAYS', value: 7 },
  { id: 3, name: 'Chăm chỉ 30 ngày', description: 'Học 30 ngày liên tiếp', type: 'STREAK_DAYS', value: 30 },
  { id: 4, name: '50 từ đầu tiên', description: 'Học 50 từ vựng', type: 'WORDS_LEARNED', value: 50 },
  { id: 5, name: '200 từ đầu tiên', description: null, type: 'WORDS_LEARNED', value: 200 },
  { id: 6, name: '1000 từ', description: 'Học 1000 từ vựng', type: 'WORDS_LEARNED', value: 1000 },
  { id: 7, name: 'Điểm tuyệt đối', description: 'Đạt 100 điểm một bài kiểm tra', type: 'PERFECT_SCORE', value: 1 },
  { id: 8, name: 'Năm lần tuyệt đối', description: null, type: 'PERFECT_SCORE', value: 5 },
]

const LATEST_TEST = {
  attemptId: 42,
  testTitle: 'Kiểm tra tổng hợp tháng 9',
  skills: { listening: 56, speaking: 38, reading: 48, writing: 42 },
  previousOverallScore: 38, // the comprehensive test before: "Tăng 8 điểm" on the plan page
}

/** The latest comprehensive test's scores, for the plan mock (suggestions, goal options). */
export const latestTestScores = () => LATEST_TEST.skills

// Cut-offs proposed in docs/api/progress.md ("Gợi ý giải pháp" 2, EF SET bands).
const CEFR_BANDS = [
  [30, 'A1'],
  [40, 'A2'],
  [50, 'B1'],
  [60, 'B2'],
  [70, 'C1'],
  [100, 'C2'],
]
export const cefrOf = (score) => CEFR_BANDS.find(([max]) => score <= max)[1]

const liveMinutes = new Map() // `${userId}|${date}` -> minutes sent with POST /study-time

/** Forgets the minutes sent live (the /__mock page's reset). */
export function resetProgressData() {
  liveMinutes.clear()
}

/** A number from 0 to 1 that only depends on the learner and the day, so every reload shows the same history. */
function noise(userId, date, salt) {
  let hash = 2166136261
  for (const char of `${userId}|${date}|${salt}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
  return (hash >>> 0) / 4294967295
}

/** The made-up day: nothing before the learner began, then most days with some study and a test every week or so. */
function seededDay(userId, date, today) {
  const daysAgo = Math.round((Date.parse(today) - Date.parse(date)) / 86_400_000)
  const blank = { wordsLearned: 0, exercisesCompleted: 0, testsCompleted: 0, studyMinutes: 0, testScores: [] }
  // Some rest days, then a short break 15 to 17 days ago: every learner is on a 14-day streak, as in the design.
  if (daysAgo > STARTED_DAYS_AGO || (daysAgo > 17 && noise(userId, date, 'rest') < 0.12)) return blank
  if (daysAgo >= 15 && daysAgo <= 17) return blank
  const minutes = daysAgo === 0 ? 0 : 8 + Math.round(noise(userId, date, 'min') * 40) // today only counts what happens live
  const hasTest = daysAgo > 0 && daysAgo % 8 === 3
  return {
    wordsLearned: daysAgo === 0 ? 0 : Math.round(noise(userId, date, 'words') * 12),
    exercisesCompleted: daysAgo === 0 ? 0 : Math.round(noise(userId, date, 'ex') * 2),
    testsCompleted: hasTest ? 1 : 0,
    studyMinutes: minutes,
    testScores: hasTest ? [45 + Math.round(noise(userId, date, 'score') * 25)] : [],
  }
}

function dayOf(userId, date, today) {
  const day = seededDay(userId, date, today)
  if (date !== today) return day
  const minutes = liveMinutes.get(`${userId}|${date}`) ?? 0
  return { ...day, studyMinutes: day.studyMinutes + minutes, exercisesCompleted: day.exercisesCompleted + exerciseCompletionsOn(userId, date) }
}

/** Words learned and exercises completed from `from` to `to`, both included, as the sum of user_progress rows. */
export function totalsBetween(userId, from, to, today) {
  let wordsDone = 0
  let exercisesDone = 0
  for (let date = from; date <= to && date <= today; date = addDays(date, 1)) {
    const day = dayOf(userId, date, today)
    wordsDone += day.wordsLearned
    exercisesDone += day.exercisesCompleted
  }
  return { wordsDone, exercisesDone }
}

const isActive = (day) => day.wordsLearned + day.exercisesCompleted + day.testsCompleted + day.studyMinutes > 0

function history(userId, today) {
  return Array.from({ length: HISTORY_DAYS }, (_, index) => addDays(today, index - HISTORY_DAYS + 1)).map((date) => ({ date, ...dayOf(userId, date, today) }))
}

/** Days in a row up to today, or up to yesterday while today has nothing yet (the streak lasts until the day ends). */
export function currentStreak(days) {
  let index = days.length - 1
  if (!isActive(days[index])) index -= 1
  let streak = 0
  while (index >= 0 && isActive(days[index])) {
    streak += 1
    index -= 1
  }
  return streak
}

const average = (scores) => (scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null)

function sumUp(days) {
  const scores = days.flatMap((day) => day.testScores)
  return {
    wordsLearned: days.reduce((sum, day) => sum + day.wordsLearned, 0),
    exercisesCompleted: days.reduce((sum, day) => sum + day.exercisesCompleted, 0),
    testsCompleted: days.reduce((sum, day) => sum + day.testsCompleted, 0),
    studyMinutes: days.reduce((sum, day) => sum + day.studyMinutes, 0),
    averageTestScore: average(scores),
  }
}

/** Monday of the week of `date` (weeks run Monday to Sunday). */
function mondayOf(date) {
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay() // 0 = Sunday
  return addDays(date, weekday === 0 ? -6 : 1 - weekday)
}

function lastDayOfMonth(firstDay) {
  const next = new Date(`${firstDay}T00:00:00Z`)
  next.setUTCMonth(next.getUTCMonth() + 1)
  return addDays(next.toISOString().slice(0, 10), -1)
}

/** The periods of docs/api/progress.md: 7 days, 12 weeks from Monday, or 6 calendar months, the last one current. */
export function periodsFor(period, today) {
  const count = PERIODS[period]
  if (period === 'DAY') return Array.from({ length: count }, (_, index) => addDays(today, index - count + 1)).map((date) => ({ start: date, end: date }))
  if (period === 'WEEK') {
    const thisMonday = mondayOf(today)
    return Array.from({ length: count }, (_, index) => {
      const start = addDays(thisMonday, (index - count + 1) * 7)
      return { start, end: addDays(start, 6) }
    })
  }
  const [year, month] = today.split('-').map(Number)
  return Array.from({ length: count }, (_, index) => {
    const first = new Date(Date.UTC(year, month - 1 + index - count + 1, 1)).toISOString().slice(0, 10)
    return { start: first, end: lastDayOfMonth(first) }
  })
}

export function activity(userId, period, today) {
  const days = history(userId, today)
  const buckets = periodsFor(period, today)
  const from = buckets[0].start
  const within = (start, end) => days.filter((day) => day.date >= start && day.date <= end && day.date <= today)
  return {
    period,
    from,
    to: today,
    items: buckets.map(({ start, end }) => ({ start, end, ...sumUp(within(start, end)) })),
    totals: sumUp(within(from, today)),
  }
}

export function summary(userId, today) {
  const days = history(userId, today)
  const { exercisesCompleted, testsCompleted, studyMinutes } = sumUp(days)
  return {
    streak: { current: currentStreak(days), activeToday: isActive(days.at(-1)) },
    totals: { exercisesCompleted, testsCompleted, studyMinutes },
  }
}

/** Walks the history to find each learner's value per condition and the day each badge was first reached. */
export function badges(userId, today) {
  const days = history(userId, today)
  const reachedOn = new Map()
  let streak = 0
  let words = 0
  let perfect = 0
  for (const day of days) {
    streak = isActive(day) ? streak + 1 : day.date === today ? streak : 0
    words += day.wordsLearned
    perfect += day.testScores.filter((score) => score === 100).length
    const values = { STREAK_DAYS: streak, WORDS_LEARNED: words, PERFECT_SCORE: perfect }
    for (const badge of BADGES) {
      if (!reachedOn.has(badge.id) && values[badge.type] >= badge.value) reachedOn.set(badge.id, `${day.date}T12:00:00Z`)
    }
  }
  const now = { STREAK_DAYS: currentStreak(days), WORDS_LEARNED: words, PERFECT_SCORE: perfect }
  const list = BADGES.map((badge) => {
    const earnedAt = reachedOn.get(badge.id) ?? null
    return {
      id: badge.id,
      name: badge.name,
      description: badge.description,
      iconUrl: null,
      condition: { type: badge.type, value: badge.value },
      progress: earnedAt ? badge.value : Math.min(badge.value, now[badge.type]),
      earnedAt,
    }
  })
  const earned = list.filter((badge) => badge.earnedAt).toSorted((a, b) => b.earnedAt.localeCompare(a.earnedAt))
  return [...earned, ...list.filter((badge) => !badge.earnedAt).toSorted(closestFirst)]
}

/** "Sắp đạt" order: the largest share done first, then the fewest steps left. */
function closestFirst(a, b) {
  const share = (badge) => badge.progress / badge.condition.value
  const left = (badge) => badge.condition.value - badge.progress
  return share(b) - share(a) || left(a) - left(b)
}

function skills(today) {
  const scores = LATEST_TEST.skills
  const overall = Math.round((scores.listening + scores.speaking + scores.reading + scores.writing) / 4)
  return {
    latest: {
      attemptId: LATEST_TEST.attemptId,
      testTitle: LATEST_TEST.testTitle,
      takenAt: `${addDays(today, -7)}T08:30:00Z`,
      status: 'GRADED',
      overallScore: overall,
      previousOverallScore: LATEST_TEST.previousOverallScore,
      level: cefrOf(overall),
      skills: Object.fromEntries(Object.entries(scores).map(([skill, score]) => [skill, { score, level: cefrOf(score) }])),
    },
  }
}

export const progressRoutes = [
  {
    method: 'GET',
    pattern: /^\/api\/progress\/summary$/,
    handle: ({ userId }) => summary(userId, todayInVietnam()),
  },
  {
    method: 'GET',
    pattern: /^\/api\/progress\/activity$/,
    handle({ userId, searchParams }) {
      const period = searchParams.get('period') ?? 'DAY'
      if (!(period in PERIODS)) throw new HttpError(400, 'period must be DAY, WEEK or MONTH')
      return activity(userId, period, todayInVietnam())
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/progress\/skills$/,
    handle: () => skills(todayInVietnam()),
  },
  {
    method: 'GET',
    pattern: /^\/api\/progress\/badges$/,
    handle: ({ userId }) => badges(userId, todayInVietnam()),
  },
  {
    method: 'POST',
    pattern: /^\/api\/progress\/study-time$/,
    handle({ userId, body }) {
      const minutes = body?.minutes
      if (!Number.isInteger(minutes) || minutes < 1 || minutes > 5) throw new HttpError(400, 'minutes must be an integer from 1 to 5')
      const key = `${userId}|${todayInVietnam()}`
      liveMinutes.set(key, Math.min(1440, (liveMinutes.get(key) ?? 0) + minutes))
      return undefined
    },
  },
]

// --- Scenarios of the /__mock page ---------------------------------------------------------------------------------

/** A learner with nothing yet, as each progress endpoint answers them ("Người mới" scenario). */
export function newLearnerReply(pathname, searchParams, today = todayInVietnam()) {
  const zero = { wordsLearned: 0, exercisesCompleted: 0, testsCompleted: 0, studyMinutes: 0, averageTestScore: null }
  if (pathname === '/api/progress/summary') return { streak: { current: 0, activeToday: false }, totals: { exercisesCompleted: 0, testsCompleted: 0, studyMinutes: 0 } }
  if (pathname === '/api/progress/activity') {
    const period = searchParams.get('period') ?? 'DAY'
    const buckets = periodsFor(period in PERIODS ? period : 'DAY', today)
    return { period, from: buckets[0].start, to: today, items: buckets.map((bucket) => ({ ...bucket, ...zero })), totals: zero }
  }
  if (pathname === '/api/progress/skills') return { latest: null }
  if (pathname === '/api/progress/badges') {
    return BADGES.map((badge) => ({
      id: badge.id,
      name: badge.name,
      description: badge.description,
      iconUrl: null,
      condition: { type: badge.type, value: badge.value },
      progress: 0,
      earnedAt: null,
    })).toSorted(closestFirst)
  }
  return undefined
}

/** The latest comprehensive test with speaking and writing still being graded by the AI ("Đang chấm" scenario). */
export function gradingSkillsReply(today = todayInVietnam()) {
  const { latest } = skills(today)
  return {
    latest: {
      ...latest,
      takenAt: `${today}T02:12:00Z`,
      status: 'SUBMITTED',
      overallScore: null,
      level: null,
      skills: { ...latest.skills, speaking: { score: null, level: null }, writing: { score: null, level: null } },
    },
  }
}
