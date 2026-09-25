import { describe, expect, it } from 'vitest'
import { addDays, describeReviewDate, formatDayMonth, formatWeekday, todayInVietnam } from './dates'

describe('todayInVietnam', () => {
  it('uses Vietnam time, not UTC: 18:30 UTC is already the next day in Hà Nội', () => {
    expect(todayInVietnam(new Date('2026-09-24T18:30:00Z'))).toBe('2026-09-25')
    expect(todayInVietnam(new Date('2026-09-24T16:30:00Z'))).toBe('2026-09-24')
  })
})

describe('addDays', () => {
  it('crosses month and year boundaries', () => {
    expect(addDays('2026-09-28', 3)).toBe('2026-10-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-10-01', -1)).toBe('2026-09-30')
  })
})

describe('formatting', () => {
  it('shows day/month and the Vietnamese weekday', () => {
    expect(formatDayMonth('2026-09-28')).toBe('28/09')
    expect(formatWeekday('2026-09-28')).toBe('Thứ Hai')
    expect(formatWeekday('2026-09-27')).toBe('Chủ Nhật')
  })

  it('describes review dates relative to today', () => {
    expect(describeReviewDate('2026-09-20', '2026-09-25')).toBe('hôm nay')
    expect(describeReviewDate('2026-09-25', '2026-09-25')).toBe('hôm nay')
    expect(describeReviewDate('2026-09-26', '2026-09-25')).toBe('ngày mai')
    expect(describeReviewDate('2026-10-09', '2026-09-25')).toBe('09/10')
  })
})
