import { describe, expect, it } from 'vitest'
import { answerPayload, answersFromSaved, describeDeadline, firstUnansweredIndex, unansweredQuestions } from './answers'

const choice = { id: 1, options: [{ id: 10, content: 'a' }] }
const typed = { id: 2, options: [] }

describe('answerPayload', () => {
  it('sends the picked option, or the trimmed text, and nothing for an empty answer', () => {
    expect(answerPayload(choice, { optionId: 10 })).toEqual({ optionId: 10 })
    expect(answerPayload(typed, { text: '  seen ' })).toEqual({ text: 'seen' })
    expect(answerPayload(typed, { text: '   ' })).toBeNull()
    expect(answerPayload(choice, undefined)).toBeNull()
  })
})

describe('resuming', () => {
  const answers = answersFromSaved([{ questionId: 1, optionId: 10, text: null }])

  it('opens at the first empty question, or the last one when all are answered', () => {
    expect(firstUnansweredIndex([choice, typed], answers)).toBe(1)
    expect(firstUnansweredIndex([choice], answers)).toBe(0)
    expect(unansweredQuestions([choice, typed], answers)).toEqual([typed])
  })
})

describe('describeDeadline', () => {
  const now = new Date('2026-09-29T10:00:00Z')

  it('counts whole days left, like the design', () => {
    expect(describeDeadline(null, now)).toBeNull()
    expect(describeDeadline('2026-10-03T01:00:00Z', now)).toBe('Còn 3 ngày')
    expect(describeDeadline('2026-09-29T20:00:00Z', now)).toBe('Hạn cuối hôm nay')
    expect(describeDeadline('2026-09-28T10:00:00Z', now)).toBe('Đã hết hạn')
  })
})
