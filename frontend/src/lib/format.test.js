import { describe, expect, it } from 'vitest'
import { formatCount } from './format'

describe('formatCount', () => {
  it('uses the Vietnamese thousands separator, as in the design', () => {
    expect(formatCount(1248)).toBe('1.248')
    expect(formatCount(26)).toBe('26')
  })
})
