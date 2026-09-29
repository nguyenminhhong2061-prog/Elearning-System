import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HttpError } from '../http.js'
import { goalOptionsFor, planRoutes, planScenarioEffect, resetPlanData } from './plan'

// Rules of docs/api/plans.md as the mock applies them (the backend should behave the same way).

const TODAY = '2026-09-29'

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
  it('splits the goal into 7-day weeks from today to the end date', async () => {
    const draft = await preview({ targetLevel: 'B2', months: 3, note: null })

    expect(draft).toMatchObject({ startDate: '2026-09-29', endDate: '2026-12-28', goal: { targetLevel: 'B2', months: 3, note: null } })
    expect(draft.weeks).toHaveLength(13)
    expect(draft.weeks[0]).toMatchObject({ weekNumber: 1, startDate: '2026-09-29', endDate: '2026-10-05' })
    expect(draft.weeks.at(-1).endDate).toBe('2026-12-28')
    expect(draft.weeks.at(-1).targetWords).toBeLessThan(draft.weeks[0].targetWords) // the last week is for review
  })

  it('rejects a goal outside the rules', async () => {
    await expect(preview({ targetLevel: 'D1', months: 3 })).rejects.toThrow(HttpError)
    await expect(preview({ targetLevel: 'B1', months: 13 })).rejects.toThrow(HttpError)
    await expect(preview({ targetLevel: 'B1', months: 3, note: 'x'.repeat(256) })).rejects.toThrow(HttpError)
  })
})

describe('the plan', () => {
  it('starts with a made-up plan in its third week, the finished weeks judged against their targets', () => {
    const { plan } = call('GET', '/api/study-plan')

    expect(plan).toMatchObject({ status: 'ACTIVE', currentWeek: 3, goal: { targetLevel: 'B1', months: 3 } })
    expect(plan.weeks.slice(0, 2).map((week) => week.status)).toEqual(['DONE', 'DONE'])
    expect(plan.weeks[1].achieved).toBe(plan.weeks[1].wordsDone >= plan.weeks[1].targetWords && plan.weeks[1].exercisesDone >= plan.weeks[1].targetExercises)
    expect(plan.weeks[3]).toMatchObject({ status: 'PENDING', wordsDone: 0, achieved: null })
  })

  it('saves the previewed weeks and refuses weeks that do not match the goal', async () => {
    const draft = await preview({ targetLevel: 'B2', months: 1, note: 'Thi' })
    const body = { targetLevel: 'B2', months: 1, note: 'Thi', summary: draft.summary, weeks: draft.weeks }

    expect(() => call('POST', '/api/study-plan', { body: { ...body, weeks: draft.weeks.slice(1) } })).toThrow(HttpError)
    const saved = call('POST', '/api/study-plan', { body })

    expect(saved).toMatchObject({ status: 'ACTIVE', currentWeek: 1, goal: { targetLevel: 'B2', months: 1, note: 'Thi' } })
    expect(call('GET', '/api/study-plan').plan.id).toBe(saved.id)
  })

  it('pauses and resumes, and keeps a valid reminder only', () => {
    expect(call('PATCH', '/api/study-plan', { body: { status: 'PAUSED' } }).status).toBe('PAUSED')
    expect(() => call('PATCH', '/api/study-plan', { body: { status: 'COMPLETED' } })).toThrow(HttpError)

    expect(call('PUT', '/api/study-plan/reminder', { body: { enabled: true, time: '06:30' } })).toEqual({ enabled: true, time: '06:30' })
    expect(() => call('PUT', '/api/study-plan/reminder', { body: { enabled: true, time: '06:15' } })).toThrow(HttpError)
  })
})

describe('scenarios', () => {
  it('only touch the plan endpoints', () => {
    expect(planScenarioEffect('ai-down', 'POST', '/api/study-plan/preview')).toMatchObject({ reply: { status: 503 } })
    expect(planScenarioEffect('ai-down', 'GET', '/api/study-plan')).toEqual({})
    expect(planScenarioEffect('new-learner', 'GET', '/api/study-plan')).toMatchObject({ reply: { body: { plan: null } } })
    expect(planScenarioEffect('load-error', 'GET', '/api/exercises')).toBeNull()
  })
})
