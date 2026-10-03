import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HttpError } from '../http.js'
import { goalOptionsFor, planRoutes, planScenarioEffect, resetPlanData } from './plan'

// Rules of docs/api/plans.md (scenarios 17 and 18) as the mock applies them (the backend should behave the same way).

const TODAY = '2026-10-06' // a Tuesday

function call(method, path, { userId = 1, body = {} } = {}) {
  const route = planRoutes.find((candidate) => candidate.method === method && candidate.pattern.test(path))
  return route.handle({ userId, body, today: TODAY, match: route.pattern.exec(path), searchParams: new URLSearchParams() })
}

async function preview(goal) {
  const outcome = call('POST', '/api/study-plan/preview', { body: goal }).then(
    (draft) => ({ draft }),
    (error) => ({ error }),
  )
  await vi.runAllTimersAsync()
  const { draft, error } = await outcome
  if (error) throw error
  return draft
}

const GOAL = { targetLevel: 'B2', startDate: '2026-10-12', endDate: '2027-01-03', description: 'Đạt B2 để phỏng vấn học bổng' }
const scheduleOf = (weeks) => weeks.map(({ weekNumber, description, targetWords, targetExercises }) => ({ weekNumber, description, targetWords, targetExercises }))
const apply = (draft, extra = {}) =>
  call('POST', '/api/study-plan', { body: { ...GOAL, summary: draft.summary, weeks: scheduleOf(draft.weeks), ...extra } })

beforeEach(() => {
  vi.useFakeTimers()
  resetPlanData()
})
afterEach(() => vi.useRealTimers())

describe('goal options', () => {
  it('suggest one level up in 3 months and two in 6, and adapt at the top of the scale', () => {
    expect(goalOptionsFor('A2').map(({ targetLevel, months }) => `${targetLevel}/${months}`)).toEqual(['B1/3', 'B2/6'])
    expect(goalOptionsFor('A2')[0]).toMatchObject({ dailyMinutes: { min: 20, max: 30 }, recommended: true })
    expect(goalOptionsFor(null)[0].targetLevel).toBe('A2')
    expect(goalOptionsFor('C1')).toEqual([expect.objectContaining({ targetLevel: 'C2', months: 6 })])
    expect(goalOptionsFor('C2')).toEqual([expect.objectContaining({ targetLevel: 'C2', months: 3 })])
  })
})

describe('preview', () => {
  it('splits the dates into Monday-to-Sunday weeks (scenario 17, step 6)', async () => {
    const draft = await preview(GOAL)

    expect(draft).toMatchObject({ startDate: '2026-10-12', endDate: '2027-01-03', goal: { targetLevel: 'B2', description: GOAL.description } })
    expect(draft.weeks).toHaveLength(12)
    expect(draft.weeks[0]).toMatchObject({ weekNumber: 1, startDate: '2026-10-12', endDate: '2026-10-18' })
    expect(draft.weeks.at(-1)).toMatchObject({ startDate: '2026-12-28', endDate: '2027-01-03' })
    expect(draft.weeks.at(-1).targetWords).toBeLessThan(draft.weeks[0].targetWords) // the last week is for review
  })

  it('cuts the first week when the plan starts mid-week', async () => {
    const draft = await preview({ ...GOAL, startDate: '2026-10-08', endDate: '2026-10-25' })
    expect(draft.weeks.map((week) => [week.startDate, week.endDate])).toEqual([
      ['2026-10-08', '2026-10-11'],
      ['2026-10-12', '2026-10-18'],
      ['2026-10-19', '2026-10-25'],
    ])
  })

  it('rejects a goal outside the rules (scenario 17, branch 4a)', async () => {
    await expect(preview({ ...GOAL, targetLevel: 'D1' })).rejects.toThrow(HttpError)
    await expect(preview({ ...GOAL, description: '  ' })).rejects.toThrow(HttpError)
    await expect(preview({ ...GOAL, startDate: '2026-10-05' })).rejects.toThrow(HttpError)
    await expect(preview({ ...GOAL, endDate: GOAL.startDate })).rejects.toThrow(HttpError)
    await expect(preview({ ...GOAL, endDate: '2027-12-31' })).rejects.toThrow(HttpError)
  })

  it('accepts a level below the current one (scenario 17, branch 4b)', async () => {
    expect((await preview({ ...GOAL, targetLevel: 'A1' })).goal.targetLevel).toBe('A1')
  })
})

describe('the plan', () => {
  it('starts with a made-up plan in its third week, the finished weeks judged against their targets', () => {
    const { plan } = call('GET', '/api/study-plan')

    expect(plan).toMatchObject({ status: 'ACTIVE', currentWeek: 3, goal: { targetLevel: 'B1', description: 'Giao tiếp khi đi du lịch' } })
    expect(plan.weeks.slice(0, 2).map((week) => week.status)).toEqual(['DONE', 'DONE'])
    expect(plan.weeks[1].achieved).toBe(plan.weeks[1].wordsDone >= plan.weeks[1].targetWords && plan.weeks[1].exercisesDone >= plan.weeks[1].targetExercises)
    expect(plan.weeks[3]).toMatchObject({ status: 'PENDING', wordsDone: 0, achieved: null })
  })

  it('saves the previewed weeks with the learner’s targets and pauses the plan before (scenario 17, step 8, branch 2b)', async () => {
    const before = call('GET', '/api/study-plan').plan
    const draft = await preview(GOAL)
    const weeks = draft.weeks.map((week, index) => (index < 2 ? { ...week, targetWords: 40 } : week))

    expect(() => apply(draft, { weeks: scheduleOf(weeks.slice(1)) })).toThrow(HttpError)
    expect(() => apply(draft, { weeks: scheduleOf([{ ...weeks[0], targetWords: -1 }, ...weeks.slice(1)]) })).toThrow(HttpError)
    const saved = apply(draft, { weeks: scheduleOf(weeks) })

    expect(saved).toMatchObject({ status: 'ACTIVE', currentWeek: null, startLevel: 'B1', goal: { targetLevel: 'B2' } })
    expect(saved.weeks.slice(0, 3).map((week) => week.targetWords)).toEqual([40, 40, draft.weeks[2].targetWords])
    expect(saved.weeks.every((week) => week.status === 'PENDING')).toBe(true)
    expect(call('GET', '/api/study-plan').plan.id).toBe(saved.id)

    // Ending the new plan brings back the one that was paused.
    call('PATCH', '/api/study-plan', { body: { status: 'COMPLETED' } })
    expect(call('GET', '/api/study-plan').plan).toMatchObject({ id: before.id, status: 'PAUSED' })
  })

  it('takes empty contents for a plan the learner writes (scenario 17, branch 5a)', async () => {
    const draft = await preview(GOAL)
    const weeks = draft.weeks.map((week) => ({ ...week, description: '', targetWords: 10, targetExercises: 1 }))
    expect(apply(draft, { summary: null, weeks: scheduleOf(weeks) }).weeks[0].description).toBe('')
  })

  it('changes the open weeks and the end date, and keeps the weeks already over (scenario 18)', () => {
    const plan = call('GET', '/api/study-plan').plan
    const open = plan.weeks.filter((week) => week.status !== 'DONE').slice(0, -2) // two weeks shorter
    const endDate = open.at(-1).endDate
    const changed = open.map((week) => ({ ...week, targetWords: 40 }))

    expect(() => call('PUT', '/api/study-plan/schedule', { body: { endDate, weeks: scheduleOf(changed.slice(1)) } })).toThrow(HttpError)
    expect(() => call('PUT', '/api/study-plan/schedule', { body: { endDate: '2026-10-05', weeks: [] } })).toThrow(HttpError)
    const saved = call('PUT', '/api/study-plan/schedule', { body: { endDate, weeks: scheduleOf(changed) } })

    expect(saved.endDate).toBe(endDate)
    expect(saved.weeks).toHaveLength(plan.weeks.length - 2)
    expect(saved.weeks.slice(0, 2)).toEqual(plan.weeks.slice(0, 2))
    expect(saved.weeks.slice(2).every((week) => week.targetWords === 40)).toBe(true)

    const longer = addWeek(saved)
    const extended = call('PUT', '/api/study-plan/schedule', { body: longer })
    expect(extended.weeks).toHaveLength(saved.weeks.length + 1)
    expect(extended.weeks.at(-1)).toMatchObject({ description: 'Ôn tập', targetWords: 5 })
  })

  it('pauses, resumes and ends the plan', () => {
    expect(call('PATCH', '/api/study-plan', { body: { status: 'PAUSED' } }).status).toBe('PAUSED')
    expect(call('PATCH', '/api/study-plan', { body: { status: 'ACTIVE' } }).status).toBe('ACTIVE')
    expect(() => call('PATCH', '/api/study-plan', { body: { status: 'DONE' } })).toThrow(HttpError)
    expect(call('PATCH', '/api/study-plan', { body: { status: 'COMPLETED' } }).status).toBe('COMPLETED')
    expect(call('GET', '/api/study-plan').plan).toBeNull()
    expect(() => call('PATCH', '/api/study-plan', { body: { status: 'PAUSED' } })).toThrow(HttpError)
  })
})

/** The schedule of a plan one week longer, the new week filled in. */
function addWeek(plan) {
  const last = plan.weeks.at(-1)
  const endDate = new Date(`${last.endDate}T00:00:00Z`)
  endDate.setUTCDate(endDate.getUTCDate() + 7)
  const open = plan.weeks.filter((week) => week.status !== 'DONE')
  const newWeek = { weekNumber: last.weekNumber + 1, description: 'Ôn tập', targetWords: 5, targetExercises: 1 }
  return { endDate: endDate.toISOString().slice(0, 10), weeks: [...scheduleOf(open), newWeek] }
}

describe('scenarios', () => {
  it('only touch the plan endpoints', () => {
    expect(planScenarioEffect('ai-down', 'POST', '/api/study-plan/preview')).toMatchObject({ reply: { status: 503 } })
    expect(planScenarioEffect('ai-down', 'GET', '/api/study-plan')).toEqual({})
    expect(planScenarioEffect('save-error', 'PUT', '/api/study-plan/schedule')).toMatchObject({ reply: { status: 500 } })
    expect(planScenarioEffect('new-learner', 'GET', '/api/study-plan')).toMatchObject({ reply: { body: { plan: null } } })
    expect(planScenarioEffect('load-error', 'GET', '/api/exercises')).toBeNull()
  })
})
