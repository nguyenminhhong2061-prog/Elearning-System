import { describe, expect, it } from 'vitest'
import {
  emptyDraft,
  formatDate,
  goalErrors,
  goalTitle,
  lastMissedWeek,
  levelPath,
  levelWarning,
  periodLine,
  planPhase,
  planWeeks,
  scoreChange,
  suggestionLink,
  targetError,
  weekErrors,
} from './plan'

describe('suggestionLink', () => {
  it('opens the exercises tab that practises the skill, and the other screens by id', () => {
    expect(suggestionLink({ type: 'PRACTICE_SKILL', skill: 'SPEAKING' })).toBe('/exercises?skill=pronunciation')
    expect(suggestionLink({ type: 'PRACTICE_SKILL', skill: 'WRITING' })).toBe('/exercises?skill=writing')
    expect(suggestionLink({ type: 'PRACTICE_SKILL', skill: 'READING' })).toBe('/exercises?skill=reading')
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

  it('names the levels of a plan, and warns about a target that is not higher (scenario 17, branch 4b)', () => {
    expect(levelPath('B1', 'B2')).toBe('B1 → B2')
    expect(levelPath('B1', 'B1')).toBe('B1 (giữ vững)')
    expect(levelPath(null, 'A2')).toBe('→ A2')
    expect(levelWarning('B2', 'B1')).toBeNull()
    expect(levelWarning('B1', 'B1')).toMatch(/giữ vững/)
    expect(levelWarning('A2', 'B1')).toBe('A2 thấp hơn trình độ hiện tại (B1). Bạn vẫn có thể tiếp tục để củng cố kiến thức nền.')
    expect(levelWarning('A2', null)).toBeNull()
  })

  it('checks the goal field by field (scenario 17, branch 4a)', () => {
    const today = '2026-10-06'
    const goal = { description: 'Đạt B2', startDate: '2026-10-12', endDate: '2027-01-03' }
    expect(goalErrors(goal, today)).toEqual({})
    expect(goalErrors({ description: ' ', startDate: '', endDate: '' }, today)).toEqual({
      description: 'Vui lòng nhập mô tả mục tiêu.',
      startDate: 'Vui lòng chọn ngày bắt đầu.',
      endDate: 'Vui lòng chọn ngày kết thúc.',
    })
    expect(goalErrors({ ...goal, startDate: '2026-10-05' }, today).startDate).toBe('Ngày bắt đầu không được trước hôm nay.')
    expect(goalErrors({ ...goal, endDate: '2026-10-12' }, today).endDate).toBe('Ngày kết thúc phải sau ngày bắt đầu.')
    expect(goalErrors({ ...goal, endDate: '2027-12-01' }, today).endDate).toBe('Kế hoạch dài tối đa 12 tháng.')
  })
})

describe('weeks', () => {
  it('runs weeks from Monday to Sunday, cut to the plan dates', () => {
    expect(planWeeks('2026-10-12', '2027-01-03')).toHaveLength(12)
    expect(planWeeks('2026-10-08', '2026-10-20')).toEqual([
      { weekNumber: 1, startDate: '2026-10-08', endDate: '2026-10-11' },
      { weekNumber: 2, startDate: '2026-10-12', endDate: '2026-10-18' },
      { weekNumber: 3, startDate: '2026-10-19', endDate: '2026-10-20' },
    ])
    expect(periodLine('2026-10-12', '2027-01-03', 12)).toBe('12/10/2026 – 03/01/2027 · 12 tuần')
  })

  it('opens empty weeks for a plan the learner writes (scenario 17, branch 5a)', () => {
    const draft = emptyDraft({ targetLevel: 'B2', startDate: '2026-10-12', endDate: '2026-10-25', description: 'Đạt B2' }, 'B1')
    expect(draft).toMatchObject({ goal: { targetLevel: 'B2', description: 'Đạt B2' }, startLevel: 'B1', summary: null, dailyMinutes: null })
    expect(draft.weeks).toEqual([
      { weekNumber: 1, startDate: '2026-10-12', endDate: '2026-10-18', description: '', targetWords: '', targetExercises: '' },
      { weekNumber: 2, startDate: '2026-10-19', endDate: '2026-10-25', description: '', targetWords: '', targetExercises: '' },
    ])
  })

  it('only takes whole numbers from 0 to the limit as targets (scenario 17, branch 8a)', () => {
    expect(targetError('40', 500)).toBeNull()
    expect(targetError(0, 50)).toBeNull()
    expect(targetError('-5', 500)).toBe('Nhập số nguyên không âm.')
    expect(targetError('4.5', 500)).toBe('Nhập số nguyên không âm.')
    expect(targetError('', 500)).toBe('Nhập số nguyên không âm.')
    expect(targetError('abc', 500)).toBe('Nhập số nguyên không âm.')
    expect(targetError('51', 50)).toBe('Tối đa 50.')
    const weeks = [
      { weekNumber: 1, targetWords: 'x', targetExercises: 3, status: 'DONE' },
      { weekNumber: 2, targetWords: '-1', targetExercises: '6' },
    ]
    expect(weekErrors(weeks, (week) => week.status !== 'DONE')).toEqual({ 2: { targetWords: 'Nhập số nguyên không âm.' } })
  })

  it('knows whether a plan has started', () => {
    const plan = { startDate: '2026-10-12', endDate: '2027-01-03' }
    expect(planPhase(plan, '2026-10-06')).toBe('NOT_STARTED')
    expect(planPhase(plan, '2026-10-12')).toBe('RUNNING')
    expect(planPhase(plan, '2027-01-04')).toBe('ENDED')
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
  it('writes scores changes and dates', () => {
    expect(scoreChange(46, 38)).toBe('Tăng 8 điểm so với lần kiểm tra trước')
    expect(scoreChange(40, 46)).toBe('Giảm 6 điểm so với lần kiểm tra trước')
    expect(scoreChange(46, null)).toBeNull()
    expect(formatDate('2026-12-12')).toBe('12/12/2026')
  })
})
