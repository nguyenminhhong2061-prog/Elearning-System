import { describe, expect, it } from 'vitest'
import { HttpError } from '../http.js'
import { MOCK_WORDS } from '../vocabularyFixtures.js'
import { learningRoutes } from './learning.js'

// Filters of GET /api/learning/history and "today" in Vietnam time (docs/api/learning.md).

const TODAY = '2026-09-25'
const routes = learningRoutes()
const [early, lateYesterday, older] = MOCK_WORDS.slice(0, 3)

const reviewedAt = (status, lastReviewedAt) => ({
  status,
  step: 1,
  lastReviewResult: 'REMEMBERED',
  reviewCount: 1,
  nextReviewAt: '2026-09-28',
  lastReviewedAt,
  firstLearnedAt: lastReviewedAt,
})

const user = {
  learning: new Map([
    [early.id, reviewedAt('LEARNING', '2026-09-24T23:30:00Z')], // 06:30 on the 25th in Vietnam
    [lateYesterday.id, reviewedAt('MASTERED', '2026-09-24T16:30:00Z')], // 23:30 on the 24th in Vietnam
    [older.id, reviewedAt('LEARNING', '2026-09-23T03:00:00Z')],
  ]),
  customWords: [],
  lists: [],
  gameSessions: [],
}

function call(path, query = {}) {
  const route = routes.find((candidate) => candidate.method === 'GET' && candidate.pattern.test(path))
  return route.handle({ user, today: TODAY, searchParams: new URLSearchParams(query) })
}

const words = (page) => page.items.map((item) => item.word)

describe('learning history filters', () => {
  it('keeps the words of one status', () => {
    expect(words(call('/api/learning/history', { status: 'LEARNING' }))).toEqual([early.word, older.word])
    expect(words(call('/api/learning/history', { status: 'MASTERED' }))).toEqual([lateYesterday.word])
  })

  it('counts a review as today by the Vietnamese date, like the summary', () => {
    expect(words(call('/api/learning/history', { reviewedToday: 'true' }))).toEqual([early.word])
    expect(call('/api/learning/summary').reviewedToday).toBe(1)
    expect(call('/api/learning/history', { reviewedToday: 'false' }).totalItems).toBe(3)
  })

  it('rejects an unknown filter value', () => {
    expect(() => call('/api/learning/history', { status: 'NEW' })).toThrow(HttpError)
    expect(() => call('/api/learning/history', { reviewedToday: 'yes' })).toThrow(HttpError)
  })
})
