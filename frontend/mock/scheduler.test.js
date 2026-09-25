import { describe, expect, it } from 'vitest'
import { applyReview } from './scheduler'

// The table of docs/api/learning.md, checked against the mock's implementation.
const TODAY = '2026-09-25'
const at = (step, status = 'LEARNING') => ({ status, step, reviewCount: 2, firstLearnedAt: '2026-09-01T00:00:00Z' })

describe('applyReview', () => {
  it.each([
    ['a new word, forgot', undefined, 'FORGOT', 0, 'LEARNING', '2026-09-26'],
    ['a new word, vague', undefined, 'VAGUE', 0, 'LEARNING', '2026-09-26'],
    ['a new word, remembered', undefined, 'REMEMBERED', 1, 'LEARNING', '2026-09-28'],
    ['step 2, forgot', at(2), 'FORGOT', 0, 'LEARNING', '2026-09-26'],
    ['step 2, vague', at(2), 'VAGUE', 2, 'LEARNING', '2026-10-02'],
    ['step 2, remembered', at(2), 'REMEMBERED', 3, 'LEARNING', '2026-10-09'],
    ['step 3, remembered', at(3), 'REMEMBERED', 4, 'MASTERED', '2026-10-25'],
    ['mastered, remembered again', at(4, 'MASTERED'), 'REMEMBERED', 4, 'MASTERED', '2026-10-25'],
    ['mastered, vague', at(4, 'MASTERED'), 'VAGUE', 4, 'LEARNING', '2026-10-25'],
  ])('%s', (_label, previous, result, step, status, nextReviewAt) => {
    const next = applyReview(previous, result, TODAY, new Date('2026-09-25T03:00:00Z'))

    expect(next).toMatchObject({ step, status, nextReviewAt, lastReviewResult: result })
  })

  it('counts reviews and keeps the date the word was first learned', () => {
    const first = applyReview(undefined, 'VAGUE', TODAY, new Date('2026-09-25T03:00:00Z'))
    const second = applyReview(first, 'REMEMBERED', '2026-09-26', new Date('2026-09-26T03:00:00Z'))

    expect(first.reviewCount).toBe(1)
    expect(second.reviewCount).toBe(2)
    expect(second.firstLearnedAt).toBe('2026-09-25T03:00:00.000Z')
    expect(second.lastReviewedAt).toBe('2026-09-26T03:00:00.000Z')
  })
})
