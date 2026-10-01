import { describe, expect, it } from 'vitest'
import { HttpError } from '../http.js'
import { activity, badges, cefrOf, chosenRange, currentStreak, periodsBetween, periodsFor, progressRoutes, summary } from './progress'

// Rules of docs/api/progress.md, as the mock applies them (the backend must behave the same way).

const TODAY = '2026-09-27' // a Sunday

describe('periods', () => {
  it('has 7 days, 12 weeks from Monday to Sunday, or 6 calendar months, the last one current', () => {
    const days = periodsFor('DAY', TODAY)
    expect(days).toHaveLength(7)
    expect(days[0]).toEqual({ start: '2026-09-21', end: '2026-09-21' })
    expect(days.at(-1).start).toBe(TODAY)

    const weeks = periodsFor('WEEK', TODAY)
    expect(weeks).toHaveLength(12)
    expect(weeks.at(-1)).toEqual({ start: '2026-09-21', end: '2026-09-27' })
    expect(weeks[0].start).toBe('2026-07-06')

    const months = periodsFor('MONTH', TODAY)
    expect(months.map((month) => month.start)).toEqual(['2026-04-01', '2026-05-01', '2026-06-01', '2026-07-01', '2026-08-01', '2026-09-01'])
    expect(months[1].end).toBe('2026-05-31')
  })

  it('starts the week on Monday even when today is Monday', () => {
    expect(periodsFor('WEEK', '2026-09-28').at(-1)).toEqual({ start: '2026-09-28', end: '2026-10-04' })
  })
})

describe('activity', () => {
  it('returns every period, and totals that match the periods', () => {
    const week = activity('u-activity', 'WEEK', TODAY)
    expect(week).toMatchObject({ period: 'WEEK', from: '2026-07-06', to: TODAY })
    expect(week.items).toHaveLength(12)
    const words = week.items.reduce((sum, item) => sum + item.wordsLearned, 0)
    expect(week.totals.wordsLearned).toBe(words)
  })

  it('leaves the average score empty (null, not 0) for a period without a test', () => {
    const days = activity('u-activity', 'DAY', TODAY).items
    for (const day of days) {
      if (day.testsCompleted === 0) expect(day.averageTestScore).toBeNull()
      else expect(day.averageTestScore).toBeGreaterThan(0)
    }
  })

  it('cuts a chosen range into weeks clipped to it, and counts only the days inside (scenario 16)', () => {
    expect(periodsBetween('WEEK', '2026-08-31', '2026-09-23')).toEqual([
      { start: '2026-08-31', end: '2026-09-06' },
      { start: '2026-09-07', end: '2026-09-13' },
      { start: '2026-09-14', end: '2026-09-20' },
      { start: '2026-09-21', end: '2026-09-23' },
    ])
    expect(periodsBetween('MONTH', '2026-08-15', '2026-09-10').map((month) => [month.start, month.end])).toEqual([
      ['2026-08-15', '2026-08-31'],
      ['2026-09-01', '2026-09-10'],
    ])

    const range = activity('u-activity', 'WEEK', TODAY, { from: '2026-08-31', to: '2026-09-23' })
    expect(range).toMatchObject({ from: '2026-08-31', to: '2026-09-23' })
    const byDay = activity('u-activity', 'DAY', TODAY, { from: '2026-08-31', to: '2026-09-23' })
    expect(range.totals).toEqual(byDay.totals)
  })

  it('refuses a range that is backwards, ends after today or holds too many periods', () => {
    const params = (from, to) => new URLSearchParams({ from, to })
    expect(chosenRange('DAY', new URLSearchParams(), TODAY)).toBeNull()
    expect(chosenRange('DAY', params('2026-09-01', '2026-09-27'), TODAY)).toEqual({ from: '2026-09-01', to: '2026-09-27' })
    expect(() => chosenRange('DAY', params('2026-09-10', '2026-09-01'), TODAY)).toThrow(HttpError)
    expect(() => chosenRange('DAY', params('2026-09-01', '2026-09-28'), TODAY)).toThrow(HttpError)
    expect(() => chosenRange('DAY', params('2026-08-01', '2026-09-27'), TODAY)).toThrow(HttpError)
    expect(() => chosenRange('DAY', new URLSearchParams({ from: '2026-09-01' }), TODAY)).toThrow(HttpError)
    expect(chosenRange('WEEK', params('2026-08-01', '2026-09-27'), TODAY)).not.toBeNull()
  })

  it('rejects an unknown period', () => {
    const route = progressRoutes.find((candidate) => candidate.pattern.test('/api/progress/activity'))
    expect(() => route.handle({ userId: 'u', searchParams: new URLSearchParams({ period: 'YEAR' }) })).toThrow(HttpError)
  })
})

describe('streak', () => {
  const day = (active) => ({ wordsLearned: active ? 1 : 0, exercisesCompleted: 0, testsCompleted: 0, studyMinutes: 0 })

  it('counts days in a row up to today, or up to yesterday while today has nothing yet', () => {
    expect(currentStreak([day(false), day(true), day(true), day(true)])).toBe(3)
    expect(currentStreak([day(true), day(true), day(false)])).toBe(2)
    expect(currentStreak([day(true), day(false), day(false)])).toBe(0)
  })

  it('shows in the summary whether today already counts', () => {
    const { streak } = summary('u-streak', TODAY)
    expect(streak.current).toBeGreaterThan(0)
    expect(streak.activeToday).toBe(false) // today only has what happens live
  })

  it('gives the average score of every test taken so far (scenario 16, "Bài kiểm tra đã làm")', () => {
    const { totals } = summary('u-streak', TODAY)
    expect(totals.testsCompleted).toBeGreaterThan(0)
    expect(totals.averageTestScore).toBeGreaterThan(0)
  })
})

describe('study time', () => {
  const route = progressRoutes.find((candidate) => candidate.method === 'POST')

  it('adds whole minutes to today and keeps the streak alive', () => {
    const userId = `u-time-${Date.now()}`
    route.handle({ userId, body: { minutes: 1 } })
    route.handle({ userId, body: { minutes: 2 } })
    const today = summary(userId, new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()))
    expect(today.streak.activeToday).toBe(true)
  })

  it('rejects anything but 1 to 5 whole minutes', () => {
    for (const minutes of [0, 6, 1.5, '1', undefined]) expect(() => route.handle({ userId: 'u', body: { minutes } })).toThrow(HttpError)
  })
})

describe('badges', () => {
  it('lists earned badges first, newest first, then the closest to being earned', () => {
    const list = badges('u-badges', TODAY)
    const earned = list.filter((badge) => badge.earnedAt)
    const open = list.filter((badge) => !badge.earnedAt)
    expect(list.slice(0, earned.length)).toEqual(earned)
    expect(earned.map((badge) => badge.earnedAt)).toEqual(earned.map((badge) => badge.earnedAt).toSorted().reverse())
    const shares = open.map((badge) => badge.progress / badge.condition.value)
    expect(shares).toEqual(shares.toSorted((a, b) => b - a))
    for (const badge of list) expect(badge.progress).toBeLessThanOrEqual(badge.condition.value)
  })
})

describe('CEFR bands', () => {
  it('follows the EF SET cut-offs proposed in the contract', () => {
    expect([30, 31, 40, 41, 50, 51, 60, 61, 70, 71, 100].map(cefrOf)).toEqual(['A1', 'A2', 'A2', 'B1', 'B1', 'B2', 'B2', 'C1', 'C1', 'C2', 'C2'])
  })
})
