import { describe, expect, it } from 'vitest'
import { bucketCount, bucketLabel, bucketName, isEmptyActivity, isoWeek, nextLesson, rangeError, rowName, summaryLine } from './chart'

describe('bar labels', () => {
  it('names days, weeks and months briefly under the bars and fully for screen readers', () => {
    const sunday = { start: '2026-09-27', end: '2026-09-27' }
    const week = { start: '2026-09-21', end: '2026-09-27' }
    const month = { start: '2026-09-01', end: '2026-09-30' }
    expect(bucketLabel(sunday, 'DAY')).toBe('CN')
    expect(bucketLabel({ start: '2026-09-21' }, 'DAY')).toBe('T2')
    expect(bucketLabel(week, 'WEEK')).toBe('21/09')
    expect(bucketLabel(month, 'MONTH')).toBe('Tháng 9')
    expect(bucketName(sunday, 'DAY')).toBe('Chủ Nhật 27/09')
    expect(bucketName(week, 'WEEK')).toBe('Tuần 21/09 – 27/09')
    expect(bucketName(month, 'MONTH')).toBe('Tháng 9/2026')
  })
})

describe('chosen range (scenario 16)', () => {
  it('numbers weeks the ISO way and names the rows of the data table', () => {
    expect(isoWeek('2026-08-31')).toBe(36)
    expect(isoWeek('2026-10-06')).toBe(41)
    expect(isoWeek('2026-01-01')).toBe(1)
    expect(isoWeek('2025-12-29')).toBe(1)
    expect(isoWeek('2027-01-01')).toBe(53)
    expect(rowName({ start: '2026-10-05', end: '2026-10-06' }, 'WEEK')).toBe('41 (05/10–06/10)')
    expect(rowName({ start: '2026-09-01', end: '2026-09-30' }, 'MONTH')).toBe('9/2026')
    expect(rowName({ start: '2026-09-27', end: '2026-09-27' }, 'DAY')).toBe('Chủ Nhật 27/09')
    expect(bucketLabel({ start: '2026-09-07' }, 'DAY', 20)).toBe('7')
  })

  it('counts the bars a range makes, weeks from Monday', () => {
    expect(bucketCount('DAY', '2026-08-31', '2026-10-06')).toBe(37)
    expect(bucketCount('WEEK', '2026-08-31', '2026-10-06')).toBe(6)
    expect(bucketCount('WEEK', '2026-09-06', '2026-09-07')).toBe(2)
    expect(bucketCount('MONTH', '2025-12-31', '2026-01-01')).toBe(2)
  })

  it('refuses incomplete, backwards, future and too long ranges', () => {
    const today = '2026-10-06'
    expect(rangeError('WEEK', '2026-08-31', '2026-10-06', today)).toBeNull()
    expect(rangeError('WEEK', '', '2026-10-06', today)).toBe('Vui lòng chọn ngày bắt đầu và ngày kết thúc.')
    expect(rangeError('WEEK', '2026-10-06', '2026-08-31', today)).toBe('Ngày bắt đầu phải trước hoặc trùng ngày kết thúc.')
    expect(rangeError('DAY', '2026-10-06', '2026-10-06', today)).toBeNull()
    expect(rangeError('DAY', '2026-10-01', '2026-10-07', today)).toBe('Ngày kết thúc không được sau hôm nay.')
    expect(rangeError('DAY', '2026-08-31', '2026-10-06', today)).toBe('Khoảng thời gian quá dài: mỗi lần xem được tối đa 31 ngày.')
  })
})

describe('summaryLine', () => {
  const activity = (totals) => ({ period: 'DAY', from: '2026-09-21', to: '2026-09-27', items: [], totals })

  it('sums up the range, with the average study time per day', () => {
    const line = summaryLine(activity({ wordsLearned: 43, exercisesCompleted: 5, testsCompleted: 1, studyMinutes: 152, averageTestScore: 62 }))
    expect(line).toBe('7 ngày qua: 43 từ mới · 5 bài tập · 1 bài kiểm tra, trung bình 62 điểm · trung bình 22 phút học mỗi ngày')
  })

  it('starts with the chosen range when there is one', () => {
    const line = summaryLine(activity({ wordsLearned: 89, exercisesCompleted: 18, testsCompleted: 7, studyMinutes: 1005, averageTestScore: 67 }), 'từ 21/09/2026 đến 27/09/2026')
    expect(line).toMatch(/^Từ 21\/09\/2026 đến 27\/09\/2026: 89 từ mới · 18 bài tập · 7 bài kiểm tra, trung bình 67 điểm/)
  })

  it('does not invent an average score when no test was taken', () => {
    const line = summaryLine(activity({ wordsLearned: 3, exercisesCompleted: 0, testsCompleted: 0, studyMinutes: 14, averageTestScore: null }))
    expect(line).toContain('chưa làm bài kiểm tra')
    expect(line).not.toContain('null')
  })

  it('tells an empty range apart', () => {
    expect(isEmptyActivity(activity({ wordsLearned: 0, exercisesCompleted: 0, testsCompleted: 0, studyMinutes: 0, averageTestScore: null }))).toBe(true)
    expect(isEmptyActivity(activity({ wordsLearned: 0, exercisesCompleted: 0, testsCompleted: 0, studyMinutes: 1, averageTestScore: null }))).toBe(false)
  })
})

describe('nextLesson', () => {
  const lesson = (id, cefrLevel, attemptCount = 0) => ({ id, cefrLevel, progress: { attemptCount } })
  const lessons = [lesson(1, 'A1'), lesson(2, 'A2', 1), lesson(3, 'B1', 2), lesson(4, 'B1'), lesson(5, 'B2')]

  it('suggests the first lesson never done at the learner level', () => {
    expect(nextLesson(lessons, 'B1').id).toBe(4)
  })

  it('moves up a level when every lesson of the current one was done, and starts at A1 when the level is unknown', () => {
    expect(nextLesson(lessons, 'A2').id).toBe(4)
    expect(nextLesson(lessons, null).id).toBe(1)
    expect(nextLesson([lesson(9, 'C2', 3)], 'C1')).toBeNull()
  })
})
