import { afterEach, describe, expect, it } from 'vitest'
import { HttpError } from '../http.js'
import { adminRoutes, resetAdminData } from './admin.js'

const TODAY = '2026-09-29'

function call(method, path, { body = {}, role = 'ADMIN', headers = {} } = {}) {
  const url = new URL(path, 'http://localhost')
  for (const route of adminRoutes) {
    if (route.method !== method) continue
    const match = route.pattern.exec(url.pathname)
    if (match) return route.handle({ userId: '1', role, today: TODAY, match, searchParams: url.searchParams, headers, body })
  }
  throw new Error(`no route ${method} ${path}`)
}

function statusOf(fn) {
  try {
    fn()
  } catch (error) {
    if (error instanceof HttpError) return error.status
    throw error
  }
  return 200
}

afterEach(() => resetAdminData())

describe('admin mock API', () => {
  it('only answers admins', () => {
    expect(statusOf(() => call('GET', '/api/admin/topics', { role: 'LEARNER' }))).toBe(403)
  })

  it('has the learners of scenario 24', () => {
    expect(call('GET', '/api/admin/users/summary')).toEqual({ total: 128, active: 125, locked: 3 })
    const [nam] = call('GET', '/api/admin/users?q=nam.pv').items
    expect(nam).toMatchObject({ fullName: 'Phạm Văn Nam', currentLevel: 'A2', status: 'ACTIVE' })
    expect(call('GET', `/api/admin/users/${nam.id}`).stats).toMatchObject({ wordsLearned: 12, exercisesCompleted: 1, testsSubmitted: 1, chatSessions: 37 })
    expect(call('PATCH', `/api/admin/users/${nam.id}`, { body: { status: 'LOCKED' } }).status).toBe('LOCKED')
  })

  it('refuses a duplicate word, hides a used word and deletes an unused one', () => {
    const body = { topicId: 2, word: 'Passport', meaning: 'hộ chiếu', difficultyLevel: 'A2' }
    expect(statusOf(() => call('POST', '/api/vocabulary', { body }))).toBe(409)

    const visa = call('POST', '/api/vocabulary', { body: { ...body, word: 'visa', meaning: 'thị thực' } })
    expect(call('DELETE', `/api/vocabulary/${visa.id}`)).toEqual({ result: 'DELETED' })
    const passport = call('GET', '/api/admin/vocabulary?q=passport').items[0]
    expect(call('DELETE', `/api/vocabulary/${passport.id}`)).toEqual({ result: 'HIDDEN' })
    expect(call('GET', '/api/admin/vocabulary?q=passport').totalItems).toBe(0)
  })

  it('counts the test questions made from a word and keeps a word they use (scenario 21)', () => {
    const [souvenir] = call('GET', '/api/admin/vocabulary?q=souvenir').items
    expect(souvenir).toMatchObject({ questionCount: 2, openTests: [{ id: 100, title: 'Kiểm tra định kỳ — tuần 40' }] })
    const unused = call('POST', '/api/vocabulary', { body: { topicId: 2, word: 'visa', meaning: 'thị thực', difficultyLevel: 'B1' } })
    expect(unused).toMatchObject({ learnerCount: 0, listCount: 0, questionCount: 0, openTests: [] })

    const question = { skill: 'READING', type: 'MULTIPLE_CHOICE', points: 1, content: 'You need a ___ to enter some countries.', vocabularyId: unused.id }
    const options = [{ text: 'visa', correct: true }, { text: 'souvenir', correct: false }]
    call('POST', '/api/admin/tests', { body: { type: 'PERIODIC', title: 'Nháp', startDate: '2026-10-12', endDate: '2026-10-18', questions: [{ ...question, options }] } })
    expect(call('GET', '/api/admin/vocabulary?q=visa').items[0]).toMatchObject({ questionCount: 1, openTests: [] })
    expect(call('DELETE', `/api/vocabulary/${unused.id}`)).toEqual({ result: 'HIDDEN' })
  })

  it('does not delete a topic that still has words', () => {
    expect(statusOf(() => call('DELETE', '/api/topics/2'))).toBe(409)
    expect(statusOf(() => call('DELETE', '/api/topics/6'))).toBe(200)
  })

  it('reports next week as missing until a weekly test is scheduled in it', () => {
    expect(call('GET', `/api/admin/stats?from=2026-08-31&to=${TODAY}`).attention.periodicTestGap).toEqual({ weekStart: '2026-10-04', weekEnd: '2026-10-10' })
    const copy = call('POST', '/api/admin/tests/100/duplicate', { body: { title: 'Kiểm tra định kỳ — tuần 41', startDate: '2026-10-04', endDate: '2026-10-10' } })
    expect(copy).toMatchObject({ status: 'DRAFT', phase: 'UPCOMING', skillText: 'Từ vựng và ngữ pháp' })
    call('PUT', `/api/admin/tests/${copy.id}`, { body: { ...copy, status: 'VISIBLE' } })
    expect(call('GET', `/api/admin/stats?from=2026-08-31&to=${TODAY}`).attention.periodicTestGap).toBeNull()
  })

  it('locks the content of a test with submissions, wording included (scenario 24, branch 2a)', () => {
    const test = call('GET', '/api/admin/tests/100')
    expect(statusOf(() => call('PUT', '/api/admin/tests/100', { body: { ...test, title: 'Tuần 40 (sửa tên)', endDate: '2026-10-04' } }))).toBe(200)
    const reworded = { ...test, questions: test.questions.map((question, index) => (index === 0 ? { ...question, content: 'New wording ___' } : question)) }
    expect(statusOf(() => call('PUT', '/api/admin/tests/100', { body: reworded }))).toBe(409)
    expect(statusOf(() => call('PUT', '/api/admin/tests/100', { body: { ...test, status: 'DRAFT' } }))).toBe(409)
    expect(statusOf(() => call('PUT', '/api/admin/tests/100', { body: { ...test, status: 'HIDDEN' } }))).toBe(200)
  })

  it('hides a test with submissions and deletes one without (scenario 24, branch 2b)', () => {
    expect(call('DELETE', '/api/admin/tests/100')).toEqual({ result: 'HIDDEN' })
    expect(call('GET', '/api/admin/tests/100')).toMatchObject({ status: 'HIDDEN', phase: 'OPEN' })
    const copy = call('POST', '/api/admin/tests/100/duplicate', { body: { title: 'Bản sao', startDate: '2026-10-04', endDate: '2026-10-10' } })
    expect(call('DELETE', `/api/admin/tests/${copy.id}`)).toEqual({ result: 'DELETED' })
    expect(statusOf(() => call('GET', `/api/admin/tests/${copy.id}`))).toBe(404)
  })

  it('dates the comprehensive test and links its questions to shared materials (scenario 24, branch 5a)', () => {
    const test = call('GET', '/api/admin/tests/200')
    expect(test).toMatchObject({ type: 'COMPREHENSIVE', startDate: '2026-09-01', endDate: '2026-09-30', phase: 'OPEN' })
    expect(test.materials.map((material) => material.type)).toEqual(['LISTENING', 'READING'])
    expect(test.questions.filter((question) => question.materialId === test.materials[1].id)).toHaveLength(2)
    expect([...new Set(test.questions.map((question) => question.type))].sort()).toEqual(['ESSAY', 'FILL_BLANK', 'MULTIPLE_CHOICE', 'SPEAKING'])

    const copy = call('POST', '/api/admin/tests/200/duplicate', { body: { title: 'Tổng hợp tháng 10', startDate: '2026-10-01', endDate: '2026-10-31' } })
    expect(copy.materials).toHaveLength(2)
    expect(copy.questions[0].materialId).toBe(copy.materials[0].id)
    const body = { ...copy, questions: copy.questions.map((question) => ({ ...question, materialIndex: question.skill === 'SPEAKING' ? 1 : null })) }
    expect(statusOf(() => call('PUT', `/api/admin/tests/${copy.id}`, { body }))).toBe(400)
  })

  it('makes a multiple-choice question from a word of the bank (scenario 24, step 6)', () => {
    const [passport] = call('GET', '/api/admin/vocabulary?q=passport').items
    const question = call('GET', `/api/admin/vocabulary/${passport.id}/test-question`)
    expect(question).toMatchObject({ skill: 'READING', type: 'MULTIPLE_CHOICE', vocabularyId: passport.id, content: 'Which word means “hộ chiếu”?' })
    expect(question.options).toHaveLength(4)
    expect(question.options.filter((option) => option.correct).map((option) => option.text)).toEqual(['passport'])
    const empty = call('POST', '/api/topics', { body: { name: 'Mua sắm' } })
    const lonely = call('POST', '/api/vocabulary', { body: { topicId: empty.id, word: 'receipt', meaning: 'hóa đơn', difficultyLevel: 'A2' } })
    expect(statusOf(() => call('GET', `/api/admin/vocabulary/${lonely.id}/test-question`))).toBe(422)
  })

  it('does not publish a listening lesson without its audio file', () => {
    const lesson = call('GET', '/api/admin/lessons/11')
    expect(lesson.issues).toEqual(['MISSING_AUDIO'])
    expect(statusOf(() => call('PUT', '/api/admin/lessons/11', { body: lesson }))).toBe(400)
    expect(statusOf(() => call('PUT', '/api/admin/lessons/11', { body: { ...lesson, status: 'DRAFT' } }))).toBe(200)
  })

  it('counts learners active in the period and ranks content by learners (scenario 26)', () => {
    const stats = call('GET', `/api/admin/stats?from=2026-08-31&to=${TODAY}`)
    expect(stats.activeLearners).toBeGreaterThan(0)
    expect(stats.activeLearners).toBeLessThanOrEqual(stats.learners.total)
    const week = call('GET', '/api/admin/stats?from=2026-09-23&to=2026-09-29')
    expect(week.activeLearners).toBeLessThan(stats.activeLearners)
    expect(stats.topContent).toHaveLength(5)
    expect(stats.topContent.every((row) => ['TOPIC', 'EXERCISE', 'TEST'].includes(row.type) && row.learnerCount <= stats.activeLearners)).toBe(true)
    const learners = stats.topContent.map((row) => row.learnerCount)
    expect(learners).toEqual(learners.toSorted((a, b) => b - a))
    expect(week.topContent.map((row) => row.type)).toContain('TEST')
  })

  it('saves reading passages, writing questions and complete pronunciation items (scenario 23)', () => {
    const choice = { type: 'MULTIPLE_CHOICE', prompt: 'What will Minh do?', points: 1, options: [{ text: 'Camp', correct: false }, { text: 'Watch a film', correct: true }] }
    const reading = call('POST', '/api/admin/lessons', {
      body: { title: 'Câu điều kiện loại 1', skill: 'READING', cefrLevel: 'B1', status: 'PUBLISHED', readingPassages: [{ title: 'Plans', content: 'If it rains…' }], questions: [{ ...choice, passageIndex: 0 }] },
    })
    expect(reading.status).toBe('PUBLISHED')
    expect(reading.questions[0].passageId).toBe(reading.readingPassages[0].id)
    expect(statusOf(() => call('POST', '/api/admin/lessons', { body: { title: 'X', skill: 'READING', cefrLevel: 'B1', questions: [{ ...choice, passageIndex: 1 }] } }))).toBe(400)
    expect(statusOf(() => call('POST', '/api/admin/lessons', { body: { title: 'X', skill: 'GRAMMAR', cefrLevel: 'B1' } }))).toBe(400)

    const translation = { type: 'TRANSLATION', prompt: 'Chuyến bay bị hoãn.', points: 2, options: [] }
    const writing = { title: 'Viết', skill: 'WRITING', cefrLevel: 'A2', questions: [translation] }
    expect(statusOf(() => call('POST', '/api/admin/lessons', { body: writing }))).toBe(400)
    const saved = call('POST', '/api/admin/lessons', { body: { ...writing, questions: [{ ...translation, sampleAnswers: ['The flight was delayed.'] }] } })
    expect(saved.questions[0].sampleAnswers).toEqual(['The flight was delayed.'])

    const pronunciation = call('GET', '/api/admin/lessons/22')
    expect(pronunciation.pronunciationItems.every((item) => item.ipa && item.audioUrl)).toBe(true)
    const noAudio = pronunciation.pronunciationItems.map((item, index) => (index === 0 ? { ...item, audioUrl: null } : item))
    expect(statusOf(() => call('PUT', '/api/admin/lessons/22', { body: { ...pronunciation, pronunciationItems: noAudio } }))).toBe(400)
    expect(call('GET', '/api/admin/lessons/25').issues).toEqual(['INCOMPLETE_ITEMS'])
  })

  it('rejects a period that starts after it ends', () => {
    expect(statusOf(() => call('GET', '/api/admin/stats?from=2026-09-20&to=2026-09-10'))).toBe(400)
  })
})
