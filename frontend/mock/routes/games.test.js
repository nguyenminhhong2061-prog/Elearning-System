import { describe, expect, it } from 'vitest'
import { scoreTimeBonus } from './games'

// The time bonus rule of docs/api/games.md.
describe('scoreTimeBonus', () => {
  it('scales the remaining seconds by the share of right answers', () => {
    expect(scoreTimeBonus(90, 17, 10, 10)).toBe(73)
    expect(scoreTimeBonus(90, 17, 5, 10)).toBe(36)
  })

  it('gives nothing for answering everything wrong, however fast', () => {
    expect(scoreTimeBonus(90, 5, 0, 10)).toBe(0)
  })

  it('gives nothing without a time limit or once the time is over', () => {
    expect(scoreTimeBonus(null, 10, 10, 10)).toBe(0)
    expect(scoreTimeBonus(60, 61, 6, 6)).toBe(0)
  })
})
