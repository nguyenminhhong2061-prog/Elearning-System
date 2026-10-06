import { describe, expect, it } from 'vitest'
import { HttpError } from '../http.js'
import { SYSTEM_WORDS } from '../store.js'
import { MOCK_WORDS } from '../vocabularyFixtures.js'
import { learningRoutes } from './learning.js'

// Filters of GET /api/learning/history and "today" in Vietnam time (docs/api/learning.md).

const TODAY = '2026-09-25'
const routes = learningRoutes()
const [early, lateYesterday, older] = MOCK_WORDS.slice(0, 3)

const reviewedAt = (status, lastReviewedAt) => ({
  status,
  intervalDays: 2,
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
  reviews: [],
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

describe('sessions and their summary (scenarios 5 and 6)', () => {
  const [forgotWord, vagueWord, rememberedWord, notDueWord] = MOCK_WORDS.filter((word) => word.topicId === 1)
  const due = (lastReviewResult, nextReviewAt) => ({
    status: 'LEARNING',
    intervalDays: 2,
    lastReviewResult,
    reviewCount: 1,
    nextReviewAt,
    lastReviewedAt: '2026-09-20T03:00:00Z',
    firstLearnedAt: '2026-09-20T03:00:00Z',
  })

  function learner() {
    return {
      learning: new Map([
        [rememberedWord.id, due('REMEMBERED', '2026-09-20')],
        [vagueWord.id, due('VAGUE', '2026-09-25')],
        [forgotWord.id, due('FORGOT', '2026-09-25')],
        [notDueWord.id, due('REMEMBERED', '2026-10-01')],
      ]),
      reviews: [],
      customWords: [],
      lists: [],
      gameSessions: [],
    }
  }

  function handle(learnerState, method, path, { query = {}, body } = {}) {
    const route = routes.find((candidate) => candidate.method === method && candidate.pattern.test(path))
    return route.handle({ user: learnerState, today: TODAY, searchParams: new URLSearchParams(query), body })
  }

  it('puts due words first, "Chưa nhớ" then "Nhớ mơ hồ" then "Nhớ rõ", and has no card limit', () => {
    const session = handle(learner(), 'GET', '/api/learning/session', { query: { topicId: '1' } })
    const topicWords = MOCK_WORDS.filter((word) => word.topicId === 1).length

    expect(session.cards.slice(0, 3).map((card) => card.word)).toEqual([forgotWord.word, vagueWord.word, rememberedWord.word])
    expect(session.cards).toHaveLength(topicWords - 1) // every word but the one not due yet
    expect(Date.parse(session.startedAt)).not.toBeNaN()
    expect(() => handle(learner(), 'GET', '/api/learning/session', { query: { size: '501' } })).toThrow(HttpError)
  })

  it('counts the ratings since the session started and the words due by tomorrow', () => {
    const state = learner()
    const since = new Date(Date.now() - 1000).toISOString()
    handle(state, 'POST', '/api/learning/reviews', { body: { vocabularyId: forgotWord.id, result: 'REMEMBERED' } })
    handle(state, 'POST', '/api/learning/reviews', { body: { vocabularyId: vagueWord.id, result: 'FORGOT' } })

    const summary = handle(state, 'GET', '/api/learning/session-summary', { query: { since } })

    expect(summary.reviewedCount).toBe(2)
    expect(summary.results).toEqual({ FORGOT: 1, VAGUE: 0, REMEMBERED: 1 })
    // Forgotten again: due tomorrow; the "Nhớ rõ" word was overdue and is still due.
    expect(summary.dueTomorrow).toEqual({ date: '2026-09-26', count: 2, words: [rememberedWord.word, vagueWord.word] })
    expect(() => handle(state, 'GET', '/api/learning/session-summary')).toThrow(HttpError)
  })

  it('leaves a word hidden by an admin out of sessions and reviews, but keeps its history (scenario 21, step 8)', () => {
    const hidden = SYSTEM_WORDS.find((word) => word.id === forgotWord.id)
    hidden.status = 'HIDDEN'
    try {
      const state = learner()
      expect(handle(state, 'GET', '/api/learning/session').cards.map((card) => card.word)).toEqual([vagueWord.word, rememberedWord.word])
      expect(handle(state, 'GET', '/api/learning/session', { query: { topicId: '1' } }).cards.map((card) => card.word)).not.toContain(forgotWord.word)
      expect(handle(state, 'GET', '/api/learning/summary')).toMatchObject({ dueToday: 2, learningCount: 4 })
      expect(words(handle(state, 'GET', '/api/learning/history'))).toContain(forgotWord.word)
    } finally {
      hidden.status = 'VISIBLE'
    }
  })
})
