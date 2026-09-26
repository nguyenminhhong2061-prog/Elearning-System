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
  it('changes only module B endpoints', () => {
    expect(scenarioEffect('load-error', 'GET', '/api/topics')).toEqual({})
    expect(scenarioEffect('slow', 'GET', '/api/learning/summary')).toEqual({})
    expect(scenarioEffect('slow', 'POST', '/api/chat/sessions')).toEqual({ extraDelayMs: 2500 })
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
