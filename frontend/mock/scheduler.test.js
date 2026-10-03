import { describe, expect, it } from 'vitest'
import { applyReview } from './scheduler'

// The rule of docs/api/learning.md, checked with the words and dates of scenarios 5 and 6 (as the backend's
// ReviewSchedulerTests do).
const at = (intervalDays, status = 'LEARNING') => ({
  status,
  intervalDays,
  reviewCount: 2,
  firstLearnedAt: '2026-09-01T00:00:00Z',
})

describe('applyReview', () => {
  it.each([
    ['itinerary (5)', at(4), '2026-10-06', 'VAGUE', 4, 'LEARNING', '2026-10-10'],
    ['passport (5)', at(8), '2026-10-06', 'REMEMBERED', 16, 'MASTERED', '2026-10-22'],
    ['luggage (5)', undefined, '2026-10-06', 'REMEMBERED', 2, 'LEARNING', '2026-10-08'],
    ['departure (5)', undefined, '2026-10-06', 'FORGOT', 1, 'LEARNING', '2026-10-07'],
    ['departure (6)', at(1), '2026-10-07', 'REMEMBERED', 2, 'LEARNING', '2026-10-09'],
    ['colleague (6)', at(2), '2026-10-07', 'VAGUE', 2, 'LEARNING', '2026-10-09'],
    ['deadline (6)', at(4), '2026-10-07', 'REMEMBERED', 8, 'LEARNING', '2026-10-15'],
    ['recipe (6)', at(8), '2026-10-07', 'FORGOT', 1, 'LEARNING', '2026-10-08'],
    ['ingredient (6)', at(16, 'MASTERED'), '2026-10-07', 'REMEMBERED', 32, 'MASTERED', '2026-11-08'],
    ['a new word rated vague', undefined, '2026-10-06', 'VAGUE', 1, 'LEARNING', '2026-10-07'],
  ])('%s', (_label, previous, today, result, intervalDays, status, nextReviewAt) => {
    const next = applyReview(previous, result, today, new Date(`${today}T03:00:00Z`))

    expect(next).toMatchObject({ intervalDays, status, nextReviewAt, lastReviewResult: result })
  })

  it('masters a new word after four "Nhớ rõ" in a row (2, 4, 8, then 16 days)', () => {
    let state
    const statuses = []
    for (let review = 0; review < 4; review += 1) {
      state = applyReview(state, 'REMEMBERED', '2026-10-06')
      statuses.push(state.status)
    }

    expect(state.intervalDays).toBe(16)
    expect(statuses).toEqual(['LEARNING', 'LEARNING', 'LEARNING', 'MASTERED'])
  })

  it('counts reviews and keeps the date the word was first learned', () => {
    const first = applyReview(undefined, 'VAGUE', '2026-09-25', new Date('2026-09-25T03:00:00Z'))
    const second = applyReview(first, 'REMEMBERED', '2026-09-26', new Date('2026-09-26T03:00:00Z'))

    expect(first.reviewCount).toBe(1)
    expect(second.reviewCount).toBe(2)
    expect(second.firstLearnedAt).toBe('2026-09-25T03:00:00.000Z')
    expect(second.lastReviewedAt).toBe('2026-09-26T03:00:00.000Z')
  })
})
