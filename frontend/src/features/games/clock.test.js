import { describe, expect, it } from 'vitest'
import { formatClock } from './clock'

describe('formatClock', () => {
  it.each([
    [42, '00:42'],
    [90, '01:30'],
    [59.9, '00:59'],
    [600, '10:00'],
    [0, '00:00'],
    [-3, '00:00'],
  ])('%d s -> %s', (seconds, expected) => {
    expect(formatClock(seconds)).toBe(expected)
  })
})
