import { describe, expect, it } from 'vitest'
import { REMINDER_TIMES, formatDate, goalTitle, lastMissedWeek, scoreChange, suggestionLink, targetLevels } from './plan'

describe('suggestionLink', () => {
  it('opens the exercises tab that practises the skill, and the other screens by id', () => {
    expect(suggestionLink({ type: 'PRACTICE_SKILL', skill: 'SPEAKING' })).toBe('/exercises?skill=pronunciation')
    expect(suggestionLink({ type: 'PRACTICE_SKILL', skill: 'WRITING' })).toBe('/exercises?skill=grammar')
    expect(suggestionLink({ type: 'LEARN_TOPIC', topicId: 4 })).toBe('/vocabulary/topics/4')
    expect(suggestionLink({ type: 'REVIEW_WORDS', count: 3 })).toBe('/vocabulary/review')
    expect(suggestionLink({ type: 'TAKE_TEST', testId: 200 })).toBe('/tests/200')
    expect(suggestionLink({ type: 'SOMETHING_NEW' })).toBeNull()
  })
})

describe('goals', () => {
  it('names a goal like the design, and "Giữ vững" when it keeps the current level', () => {
    expect(goalTitle({ targetLevel: 'B1', months: 3 }, 'A2')).toBe('Đạt B1 trong 3 tháng')
    expect(goalTitle({ targetLevel: 'C2', months: 3 }, 'C2')).toBe('Giữ vững C2 trong 3 tháng')
  })

  it('offers the current level and those above it, or every level when it is unknown', () => {
    expect(targetLevels('B2')).toEqual(['B2', 'C1', 'C2'])
    expect(targetLevels(null)).toHaveLength(6)
  })
})

describe('lastMissedWeek', () => {
  const week = (weekNumber, status, achieved) => ({ weekNumber, status, achieved })

  it('only warns about the latest finished week', () => {
    expect(lastMissedWeek({ weeks: [week(1, 'DONE', false), week(2, 'DONE', true), week(3, 'IN_PROGRESS', null)] })).toBeNull()
    expect(lastMissedWeek({ weeks: [week(1, 'DONE', true), week(2, 'DONE', false), week(3, 'IN_PROGRESS', null)] })).toMatchObject({ weekNumber: 2 })
    expect(lastMissedWeek({ weeks: [week(1, 'IN_PROGRESS', null)] })).toBeNull()
  })
})

describe('formatting', () => {
  it('writes scores changes, dates and reminder times', () => {
    expect(scoreChange(46, 38)).toBe('Tăng 8 điểm so với lần kiểm tra trước')
    expect(scoreChange(40, 46)).toBe('Giảm 6 điểm so với lần kiểm tra trước')
    expect(scoreChange(46, null)).toBeNull()
    expect(formatDate('2026-12-12')).toBe('12/12/2026')
    expect(REMINDER_TIMES[0]).toBe('05:00')
    expect(REMINDER_TIMES).toContain('20:00')
    expect(REMINDER_TIMES.at(-1)).toBe('23:30')
  })
})
