import { describe, expect, it } from 'vitest'
import {
  answerPayload,
  answersFromSaved,
  describeDeadline,
  firstUnansweredIndex,
  isAnswered,
  unansweredQuestions,
} from './answers'

const choice = { id: 1, options: [{ id: 10, content: 'a' }] }
const typed = { id: 2, options: [] }
const readAloud = { id: 3, options: [], referenceText: 'Hello there.' }

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

describe('read-aloud questions', () => {
  it('count as answered only once the server has their recording', () => {
    expect(isAnswered(readAloud, undefined)).toBe(false)
    expect(isAnswered(readAloud, { text: 'Hello there.' })).toBe(false)
    expect(isAnswered(readAloud, { recorded: true })).toBe(true)
    // The other kinds are answered as before.
    expect(isAnswered(choice, { optionId: 10 })).toBe(true)
    expect(isAnswered(typed, { text: '  ' })).toBe(false)
  })

  it('are resumed as recorded, without the text that was heard', () => {
    const answers = answersFromSaved([{ questionId: 3, optionId: null, text: null, recorded: true }])

    expect(answers).toEqual({ 3: { recorded: true } })
    expect(unansweredQuestions([readAloud, typed], answers)).toEqual([typed])
    expect(firstUnansweredIndex([readAloud, typed], answers)).toBe(1)
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
