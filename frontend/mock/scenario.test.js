import { describe, expect, it } from 'vitest'
import { scenarioEffect, scenarioOf } from './scenario'

const request = (cookie) => ({ headers: cookie === undefined ? {} : { cookie } })

describe('scenarioOf', () => {
  it('reads the scenario cookie among other cookies, and falls back to normal', () => {
    expect(scenarioOf(request('theme=dark; mockScenario=ai-down; other=1'))).toBe('ai-down')
    expect(scenarioOf(request('mockScenario=slow'))).toBe('slow')
    expect(scenarioOf(request())).toBe('normal')
    expect(scenarioOf(request('mockScenario=hacked'))).toBe('normal')
  })
})

describe('scenarioEffect', () => {
  it('changes only module B and D endpoints', () => {
    expect(scenarioEffect('load-error', 'GET', '/api/topics')).toEqual({})
    expect(scenarioEffect('slow', 'GET', '/api/learning/summary')).toEqual({})
    expect(scenarioEffect('slow', 'POST', '/api/chat/sessions')).toEqual({ extraDelayMs: 2500 })
    expect(scenarioEffect('load-error', 'GET', '/api/progress/summary').reply.status).toBe(500)
    expect(scenarioEffect('load-error', 'POST', '/api/progress/study-time')).toEqual({})
  })

  it('shows the home page of someone who has learned nothing for "new-learner"', () => {
    expect(scenarioEffect('new-learner', 'GET', '/api/learning/summary').reply.body).toMatchObject({ dueToday: 0, learningCount: 0, masteredCount: 0 })
    expect(scenarioEffect('new-learner', 'GET', '/api/exercise-attempts/current').reply.body).toEqual({ current: null })
    expect(scenarioEffect('new-learner', 'GET', '/api/progress/skills').reply.body).toEqual({ latest: null })
    const week = scenarioEffect('new-learner', 'GET', '/api/progress/activity', new URLSearchParams({ period: 'WEEK' })).reply.body
    expect(week.items).toHaveLength(12)
    expect(week.totals).toEqual({ wordsLearned: 0, exercisesCompleted: 0, testsCompleted: 0, studyMinutes: 0, averageTestScore: null })
    expect(scenarioEffect('new-learner', 'GET', '/api/progress/badges').reply.body.every((badge) => badge.earnedAt === null)).toBe(true)
    expect(scenarioEffect('new-learner', 'GET', '/api/topics')).toEqual({})
  })

  it('leaves speaking and writing ungraded for "grading"', () => {
    const { latest } = scenarioEffect('grading', 'GET', '/api/progress/skills').reply.body
    expect(latest).toMatchObject({ status: 'SUBMITTED', overallScore: null, level: null, skills: { speaking: { score: null }, listening: { score: 56 } } })
  })

  it('empties the lesson lists but still opens lessons', () => {
    expect(scenarioEffect('empty', 'GET', '/api/exercises')).toEqual({ reply: { status: 200, body: [] } })
    expect(scenarioEffect('empty', 'GET', '/api/exercises/3')).toEqual({})
  })

  it('fails loading for "load-error" and saving for "save-error"', () => {
    expect(scenarioEffect('load-error', 'GET', '/api/exercises/3').reply.status).toBe(500)
    expect(scenarioEffect('load-error', 'POST', '/api/exercises/3/attempts').reply.status).toBe(500)
    expect(scenarioEffect('load-error', 'POST', '/api/exercise-attempts/5/responses')).toEqual({})
    expect(scenarioEffect('save-error', 'POST', '/api/exercise-attempts/5/responses').reply.status).toBe(500)
    expect(scenarioEffect('save-error', 'POST', '/api/exercise-attempts/5/complete').reply.status).toBe(500)
    expect(scenarioEffect('save-error', 'GET', '/api/exercises')).toEqual({})
  })

  it('makes the AI services unavailable for "ai-down"', () => {
    expect(scenarioEffect('ai-down', 'POST', '/api/exercise-attempts/5/pronunciation/801').reply.status).toBe(503)
    expect(scenarioEffect('ai-down', 'POST', '/api/chat/sessions/9/messages').reply.status).toBe(503)
    expect(scenarioEffect('ai-down', 'POST', '/api/chat/sessions')).toEqual({})
  })
})
