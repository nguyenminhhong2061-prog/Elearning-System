import { describe, expect, it } from 'vitest'
import { encodeWav } from '../../src/features/exercises/pronunciation/wav.js'
import { HttpError } from '../http.js'
import { fakeAssessment, grade, normalizeAnswer, readWav } from './exercises'

// Grading rules of docs/api/exercises.md, as the mock applies them (the backend must behave the same way).

const choiceQuestion = {
  id: 1,
  type: 'MULTIPLE_CHOICE',
  points: 1,
  options: [
    { id: 11, text: 'lives' },
    { id: 12, text: 'has lived' },
  ],
  correctOptionId: 12,
  accepted: [],
  explanation: 'why',
}
const blankQuestion = { id: 2, type: 'FILL_BLANK', points: 2, options: [], correctOptionId: null, accepted: ["don't", 'do not'], explanation: null }

describe('normalizeAnswer', () => {
  it('trims, collapses spaces, lowercases and straightens apostrophes', () => {
    expect(normalizeAnswer('  Don’t   KNOW ')).toBe("don't know")
  })
})

describe('grade', () => {
  it('grades a choice and reveals the right option', () => {
    expect(grade(choiceQuestion, { optionId: 11 })).toMatchObject({ correct: false, correctOptionId: 12, correctAnswer: 'has lived', awardedPoints: 0 })
    expect(grade(choiceQuestion, { optionId: 12 })).toMatchObject({ correct: true, awardedPoints: 1 })
  })

  it('accepts any accepted answer of a fill-in question after normalizing', () => {
    expect(grade(blankQuestion, { answer: ' DON’T ' })).toMatchObject({ correct: true, awardedPoints: 2, correctAnswer: "don't" })
    expect(grade(blankQuestion, { answer: 'do  not' })).toMatchObject({ correct: true })
    expect(grade(blankQuestion, { answer: 'does not' })).toMatchObject({ correct: false, awardedPoints: 0 })
  })

  it('rejects both or neither answer kinds, foreign options and empty answers', () => {
    expect(() => grade(choiceQuestion, {})).toThrow(HttpError)
    expect(() => grade(choiceQuestion, { optionId: 12, answer: 'x' })).toThrow(HttpError)
    expect(() => grade(choiceQuestion, { optionId: 99 })).toThrow(HttpError)
    expect(() => grade(blankQuestion, { answer: '   ' })).toThrow(HttpError)
  })
})

describe('recordings', () => {
  const tone = Float32Array.from({ length: 8000 }, (_, index) => 0.3 * Math.sin(index / 5))
  const item = { id: 801, text: 'We need an agreement.', notes: 'Nối âm.' }

  it('reads back a WAV written by the browser encoder', () => {
    const wav = readWav(Buffer.from(encodeWav(tone, 16000)))
    expect(wav.sampleRate).toBe(16000)
    expect(wav.samples).toHaveLength(8000)
    expect(readWav(Buffer.from('not a wav file at all, just some text here....'))).toBeNull()
  })

  it('rejects silence like a speech service would', () => {
    expect(() => fakeAssessment(item, 1, new Float32Array(8000))).toThrow(expect.objectContaining({ status: 422 }))
  })

  it('scores every word of the sample and improves with each try', () => {
    const first = fakeAssessment(item, 1, tone)
    const second = fakeAssessment(item, 2, tone)
    expect(first.words.map((word) => word.word)).toEqual(['We', 'need', 'an', 'agreement'])
    expect(second.overallScore).toBeGreaterThan(first.overallScore)
    expect(first.tips[0]).toContain('"agreement"')
  })
})
