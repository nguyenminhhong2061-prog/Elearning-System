import { describe, expect, it } from 'vitest'
import { encodeWav } from '../../src/features/exercises/pronunciation/wav.js'
import { HttpError } from '../http.js'
import { MOCK_LESSONS } from '../exerciseFixtures.js'
import { exerciseRoutes, fakeAssessment, grade, isResumable, normalizeAnswer, readWav, resetExerciseData } from './exercises'

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

describe('sample data for trying every screen', () => {
  const listLessons = (userId, skill) =>
    exerciseRoutes.find((route) => route.method === 'GET' && route.pattern.test('/api/exercises')).handle({ userId, searchParams: new URLSearchParams({ skill }) })

  it('covers every CEFR level in grammar and hides the lesson without questions', () => {
    const grammar = listLessons('u-levels', 'GRAMMAR')
    expect([...new Set(grammar.map((lesson) => lesson.cefrLevel))]).toEqual(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
    expect(grammar.some((lesson) => lesson.id === 99)).toBe(false)
  })

  it('gives each learner a seeded history, which the reset brings back', () => {
    const first = listLessons('u-history', 'GRAMMAR').find((lesson) => lesson.id === 1)
    expect(first.progress).toMatchObject({ attemptCount: 2, bestScorePercent: 80 })
    expect(listLessons('u-history', 'GRAMMAR').find((lesson) => lesson.id === 5).progress.attemptCount).toBe(0)

    resetExerciseData()
    expect(listLessons('u-history', 'GRAMMAR').find((lesson) => lesson.id === 1).progress.attemptCount).toBe(2)
  })

  it('says how many pronunciation items were practised and the latest listening result', () => {
    const pronunciation = listLessons('u-standing', 'PRONUNCIATION')
    const finished = pronunciation.find((lesson) => lesson.id === 22)
    expect(finished.progress.practicedCount).toBe(finished.itemCount)
    expect(pronunciation.find((lesson) => lesson.id === 23).progress.practicedCount).toBe(2)
    expect(finished.progress.lastResult).toBeNull()

    const listening = listLessons('u-standing', 'LISTENING')
    const done = listening.find((lesson) => lesson.id === 12)
    expect(done.progress.lastResult).toEqual({ correctCount: Math.round(0.67 * done.itemCount), questionCount: done.itemCount })
    expect(listening.find((lesson) => lesson.id === 11).progress.lastResult).toBeNull()
    expect(done.progress.practicedCount).toBeNull()
  })

  it('spreads first-try pronunciation scores over the red, orange and green bands', () => {
    const tone = Float32Array.from({ length: 8000 }, (_, index) => 0.3 * Math.sin(index / 5))
    const firstTries = MOCK_LESSONS.flatMap((lesson) => lesson.pronunciationItems).map((item) => fakeAssessment(item, 1, tone).overallScore)
    expect(firstTries.some((score) => score < 60)).toBe(true)
    expect(firstTries.some((score) => score >= 60 && score < 80)).toBe(true)
    expect(firstTries.some((score) => score >= 80)).toBe(true)
  })

  it('drops the last word of a long sentence read poorly on the first try', () => {
    const tone = Float32Array.from({ length: 8000 }, (_, index) => 0.3 * Math.sin(index / 5))
    const sentence = MOCK_LESSONS.find((lesson) => lesson.id === 25).pronunciationItems[1]
    const first = fakeAssessment(sentence, 1, tone)
    expect(first.words.at(-1)).toMatchObject({ word: 'underestimated', errorType: 'OMISSION' })
    expect(first.words.some((word) => word.errorType === 'MISPRONUNCIATION')).toBe(true)
    expect(first.tips[0]).toContain('bị bỏ sót')
    expect(fakeAssessment(sentence, 2, tone).words.some((word) => word.errorType === 'OMISSION')).toBe(false)
  })
})

describe('picking up unfinished attempts', () => {
  const route = (method, path) => exerciseRoutes.find((candidate) => candidate.method === method && candidate.pattern.test(path))
  const call = (method, path, input) => {
    const found = route(method, path)
    return { found, result: found.handle({ searchParams: new URLSearchParams(), body: {}, ...input, match: found.pattern.exec(path) }) }
  }
  const open = (userId, lessonId, restart = false) => {
    const { found, result } = call('POST', `/api/exercises/${lessonId}/attempts`, { userId, searchParams: new URLSearchParams(restart ? { restart: 'true' } : {}) })
    return { status: found.status(result), ...result }
  }
  const answer = (userId, attemptId, body) => call('POST', `/api/exercise-attempts/${attemptId}/responses`, { userId, body }).result
  const current = (userId) => call('GET', '/api/exercise-attempts/current', { userId }).result.current
  const listLessons = (userId, skill) => call('GET', '/api/exercises', { userId, searchParams: new URLSearchParams({ skill }) }).result
  const firstQuestion = (lessonId) => MOCK_LESSONS.find((lesson) => lesson.id === lessonId).questions[0]

  it('picks up the attempt with its answers until "restart" starts over', () => {
    const first = open('u-resume', 3)
    expect(first).toMatchObject({ status: 200, resumed: true })
    expect(first.responses.map((item) => item.correct)).toEqual([true, false])
    expect(first.responses[0]).not.toHaveProperty('awardedPoints')
    expect(open('u-resume', 3).attemptId).toBe(first.attemptId)

    const fresh = open('u-resume', 3, true)
    expect(fresh).toMatchObject({ status: 201, resumed: false, responses: [] })
    expect(fresh.attemptId).not.toBe(first.attemptId)
  })

  it('does not pick up an attempt with nothing done in it', () => {
    const empty = open('u-empty', 3, true)
    const reopened = open('u-empty', 3)
    expect(reopened).toMatchObject({ status: 201, resumed: false })
    expect(reopened.attemptId).not.toBe(empty.attemptId)

    const question = firstQuestion(3)
    answer('u-empty', reopened.attemptId, question.options.length ? { questionId: question.id, optionId: question.options[0].id } : { questionId: question.id, answer: 'x' })
    expect(open('u-empty', 3)).toMatchObject({ attemptId: reopened.attemptId, resumed: true })
  })

  it('never picks up a listening attempt', () => {
    const started = open('u-listen', 11)
    const question = firstQuestion(11)
    answer('u-listen', started.attemptId, { questionId: question.id, optionId: question.options[0].id })
    expect(open('u-listen', 11)).toMatchObject({ status: 201, resumed: false })
  })

  it('forgets attempts idle for more than 7 days', () => {
    expect(listLessons('u-idle', 'GRAMMAR').find((lesson) => lesson.id === 4).progress.inProgress).toBeNull()
    expect(open('u-idle', 4)).toMatchObject({ status: 201, resumed: false })

    const attempt = { status: 'IN_PROGRESS', responses: new Map([[1, {}]]), recordings: new Map(), lastActivityAt: '2026-09-20T00:00:00Z' }
    expect(isResumable(attempt, { skill: 'GRAMMAR' }, Date.parse('2026-09-27T00:00:00Z'))).toBe(true)
    expect(isResumable(attempt, { skill: 'GRAMMAR' }, Date.parse('2026-09-27T00:00:00.001Z'))).toBe(false)
  })

  it('lists what can be picked up and offers the latest one as "current"', () => {
    expect(listLessons('u-current', 'GRAMMAR').find((lesson) => lesson.id === 3).progress.inProgress).toMatchObject({ doneCount: 2 })
    expect(listLessons('u-current', 'PRONUNCIATION').find((lesson) => lesson.id === 23).progress.inProgress).toMatchObject({ doneCount: 2 })
    expect(current('u-current')).toMatchObject({ lesson: { id: 3, title: 'Thì hiện tại hoàn thành', itemCount: 6 }, doneCount: 2 })

    const attemptId = current('u-current').attemptId
    call('POST', `/api/exercise-attempts/${attemptId}/complete`, { userId: 'u-current', body: { responses: [] } })
    expect(current('u-current')).toMatchObject({ lesson: { id: 23 } })
    expect(current('u-nobody-yet')).toMatchObject({ lesson: { id: 3 } })
  })
})
