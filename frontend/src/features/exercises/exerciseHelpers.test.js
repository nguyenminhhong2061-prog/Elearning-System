import { describe, expect, it } from 'vitest'
import { scoreBand, skillFromParam, skillPath } from './constants'
import { activeSegmentId, formatPlayTime } from './time'

describe('skill URLs', () => {
  it('reads ?skill= and falls back to grammar', () => {
    expect(skillFromParam('listening')).toBe('LISTENING')
    expect(skillFromParam('pronunciation')).toBe('PRONUNCIATION')
    expect(skillFromParam(null)).toBe('GRAMMAR')
    expect(skillFromParam('LISTENING')).toBe('GRAMMAR')
  })

  it('keeps the bare path for the default tab', () => {
    expect(skillPath('GRAMMAR')).toBe('/exercises')
    expect(skillPath('LISTENING')).toBe('/exercises?skill=listening')
  })
})

describe('scoreBand', () => {
  it('is green from 80, orange from 60, red below', () => {
    expect([100, 80, 79, 60, 59, 0].map(scoreBand)).toEqual(['good', 'good', 'fair', 'fair', 'poor', 'poor'])
  })
})

describe('formatPlayTime', () => {
  it('shows minutes and two-digit seconds', () => {
    expect(formatPlayTime(42_900)).toBe('0:42')
    expect(formatPlayTime(110_000)).toBe('1:50')
    expect(formatPlayTime(-5)).toBe('0:00')
    expect(formatPlayTime(Number.NaN)).toBe('0:00')
  })
})

describe('activeSegmentId', () => {
  const segments = [
    { id: 1, startMs: 0, endMs: 5000 },
    { id: 2, startMs: 6000, endMs: 9000 },
  ]

  it('is the segment being heard, and nothing during a pause', () => {
    expect(activeSegmentId(segments, 0)).toBe(1)
    expect(activeSegmentId(segments, 4999)).toBe(1)
    expect(activeSegmentId(segments, 5500)).toBeNull()
    expect(activeSegmentId(segments, 6000)).toBe(2)
    expect(activeSegmentId(segments, 9000)).toBeNull()
  })
})
