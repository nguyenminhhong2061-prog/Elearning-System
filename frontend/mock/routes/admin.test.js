import { afterEach, describe, expect, it } from 'vitest'
import { HttpError } from '../http.js'
import { adminRoutes, resetAdminData } from './admin.js'

const TODAY = '2026-09-29'

function call(method, path, { body = {}, role = 'ADMIN', headers = {} } = {}) {
  const url = new URL(path, 'http://localhost')
  for (const route of adminRoutes) {
    if (route.method !== method) continue
    const match = route.pattern.exec(url.pathname)
    if (match) return route.handle({ userId: '1', role, today: TODAY, match, searchParams: url.searchParams, headers, body })
  }
  throw new Error(`no route ${method} ${path}`)
}

function statusOf(fn) {
  try {
    fn()
  } catch (error) {
    if (error instanceof HttpError) return error.status
    throw error
  }
  return 200
}

afterEach(() => resetAdminData())

describe('admin mock API', () => {
  it('only answers admins', () => {
    expect(statusOf(() => call('GET', '/api/admin/topics', { role: 'LEARNER' }))).toBe(403)
  })

  it('has the learners of scenario 24', () => {
    expect(call('GET', '/api/admin/users/summary')).toEqual({ total: 128, active: 125, locked: 3 })
    const [nam] = call('GET', '/api/admin/users?q=nam.pv').items
    expect(nam).toMatchObject({ fullName: 'Phạm Văn Nam', currentLevel: 'A2', status: 'ACTIVE' })
    expect(call('GET', `/api/admin/users/${nam.id}`).stats).toMatchObject({ wordsLearned: 12, exercisesCompleted: 1, testsSubmitted: 1 })
    expect(call('PATCH', `/api/admin/users/${nam.id}`, { body: { status: 'LOCKED' } }).status).toBe('LOCKED')
  })

  it('refuses a duplicate word, archives a used word and deletes an unused one', () => {
    const body = { topicId: 2, word: 'Passport', meaning: 'hộ chiếu', difficultyLevel: 'A2' }
    expect(statusOf(() => call('POST', '/api/vocabulary', { body }))).toBe(409)

    const visa = call('POST', '/api/vocabulary', { body: { ...body, word: 'visa', meaning: 'thị thực' } })
    expect(call('DELETE', `/api/vocabulary/${visa.id}`)).toEqual({ result: 'DELETED' })
    const passport = call('GET', '/api/admin/vocabulary?q=passport').items[0]
    expect(call('DELETE', `/api/vocabulary/${passport.id}`)).toEqual({ result: 'ARCHIVED' })
    expect(call('GET', '/api/admin/vocabulary?q=passport').totalItems).toBe(0)
  })

  it('does not delete a topic that still has words', () => {
    expect(statusOf(() => call('DELETE', '/api/topics/2'))).toBe(409)
    expect(statusOf(() => call('DELETE', '/api/topics/6'))).toBe(200)
  })

  it('reports next week as missing until a weekly test is scheduled in it', () => {
    expect(call('GET', `/api/admin/stats?from=2026-08-31&to=${TODAY}`).attention.periodicTestGap).toEqual({ weekStart: '2026-10-04', weekEnd: '2026-10-10' })
    const copy = call('POST', '/api/admin/tests/100/duplicate', { body: { title: 'Kiểm tra định kỳ — tuần 41', startDate: '2026-10-04', endDate: '2026-10-10' } })
    expect(copy.status).toBe('DRAFT')
    call('PUT', `/api/admin/tests/${copy.id}`, { body: { ...copy, draft: false } })
    expect(call('GET', `/api/admin/stats?from=2026-08-31&to=${TODAY}`).attention.periodicTestGap).toBeNull()
  })

  it('only lets the wording of a test with submissions change', () => {
    const test = call('GET', '/api/admin/tests/100')
    const reworded = { ...test, questions: test.questions.map((question, index) => (index === 0 ? { ...question, content: 'New wording ___' } : question)) }
    expect(statusOf(() => call('PUT', '/api/admin/tests/100', { body: reworded }))).toBe(200)
    const rescored = { ...test, questions: test.questions.map((question) => ({ ...question, points: 2 })) }
    expect(statusOf(() => call('PUT', '/api/admin/tests/100', { body: rescored }))).toBe(409)
  })

  it('does not publish a listening lesson without its audio file', () => {
    const lesson = call('GET', '/api/admin/lessons/11')
    expect(lesson.issues).toEqual(['MISSING_AUDIO'])
    expect(statusOf(() => call('PUT', '/api/admin/lessons/11', { body: lesson }))).toBe(400)
    expect(statusOf(() => call('PUT', '/api/admin/lessons/11', { body: { ...lesson, status: 'DRAFT' } }))).toBe(200)
  })

  it('rejects a period that starts after it ends', () => {
    expect(statusOf(() => call('GET', '/api/admin/stats?from=2026-09-20&to=2026-09-10'))).toBe(400)
  })
})
