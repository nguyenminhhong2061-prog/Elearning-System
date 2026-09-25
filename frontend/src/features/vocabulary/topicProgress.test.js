import { describe, expect, it } from 'vitest'
import { describeTopicProgress, formatCount, learnedPercent, summarizeTopics } from './topicProgress'

describe('formatCount', () => {
  it('uses the Vietnamese thousands separator, as in the design', () => {
    expect(formatCount(1248)).toBe('1.248')
    expect(formatCount(26)).toBe('26')
  })
})

describe('learnedPercent', () => {
  it('rounds to a whole percentage', () => {
    expect(learnedPercent(12, 26)).toBe(46)
    expect(learnedPercent(1, 2)).toBe(50)
  })

  it('never shows 0% once something is learned, nor 100% before everything is', () => {
    expect(learnedPercent(1, 240)).toBe(1)
    expect(learnedPercent(239, 240)).toBe(99)
    expect(learnedPercent(240, 240)).toBe(100)
  })

  it('is 0 when nothing is learned or the topic is empty', () => {
    expect(learnedPercent(0, 30)).toBe(0)
    expect(learnedPercent(0, 0)).toBe(0)
  })
})

describe('describeTopicProgress', () => {
  it.each([
    [{ wordCount: 240, learnedCount: 108 }, '240 từ · 45% đã học'],
    [{ wordCount: 1248, learnedCount: 1248 }, '1.248 từ · 100% đã học'],
    [{ wordCount: 12, learnedCount: 0 }, '12 từ · Chưa học'],
    [{ wordCount: 0, learnedCount: 0 }, 'Chưa có từ'],
  ])('%o -> %s', (topic, expected) => {
    expect(describeTopicProgress(topic)).toBe(expected)
  })
})

describe('summarizeTopics', () => {
  it('adds up words and learned words over every topic', () => {
    const topics = [
      { wordCount: 26, learnedCount: 12 },
      { wordCount: 12, learnedCount: 0 },
      { wordCount: 0, learnedCount: 0 },
    ]

    expect(summarizeTopics(topics)).toEqual({ wordCount: 38, learnedCount: 12 })
    expect(summarizeTopics([])).toEqual({ wordCount: 0, learnedCount: 0 })
  })
})
