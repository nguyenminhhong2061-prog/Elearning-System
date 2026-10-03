import { describe, expect, it } from 'vitest'
import { isoWeek, parseTypedDate } from '../format'
import { validateLesson, newLesson } from '../lessons/lessonDraft'
import { editableTest, modeOf, testPayload, typeFor, validateTest } from '../tests/testDraft'
import { answerErrors, formatClockMs, move, parseClockMs, stripKeys, toDraft } from './draft'

describe('editor drafts', () => {
  it('reads and writes subtitle times as m:ss.s', () => {
    expect(formatClockMs(8500)).toBe('0:08.5')
    expect(formatClockMs(62_000)).toBe('1:02.0')
    expect(parseClockMs('0:08.5')).toBe(8500)
    expect(parseClockMs('8,5')).toBe(8500)
    expect(parseClockMs('1:02')).toBe(62_000)
    expect(parseClockMs('1:75')).toBeNull()
    expect(parseClockMs('abc')).toBeNull()
  })

  it('keys every list entry and strips the keys again before sending', () => {
    const draft = toDraft({ questions: [{ id: 5, options: [{ id: 51, text: 'a' }, { text: 'b' }] }] })
    expect(draft.questions[0].key).toBe('id-5')
    expect(draft.questions[0].options[1].key).toMatch(/^new-/)
    expect(stripKeys(draft)).toEqual({ questions: [{ id: 5, options: [{ id: 51, text: 'a' }, { text: 'b' }] }] })
  })

  it('moves entries within bounds only', () => {
    expect(move(['a', 'b', 'c'], 2, -1)).toEqual(['a', 'c', 'b'])
    expect(move(['a', 'b'], 0, -1)).toEqual(['a', 'b'])
  })

  it('asks for exactly one correct choice, or an accepted answer', () => {
    const options = [{ text: 'go', correct: false }, { text: 'goes', correct: false }]
    expect(answerErrors({ options, acceptedAnswers: [] }, 'CHOICE')).toEqual({ options: 'Chọn đúng 1 đáp án đúng.' })
    expect(answerErrors({ options: [], acceptedAnswers: [' '] }, 'TEXT')).toEqual({ acceptedAnswers: 'Nhập ít nhất 1 đáp án chấp nhận.' })
    expect(answerErrors({ options: [], acceptedAnswers: [] }, 'AI')).toEqual({})
  })

  it('does not publish a listening lesson without audio or questions', () => {
    const lesson = { ...newLesson('LISTENING'), title: 'Bài nghe', cefrLevel: 'A2', status: 'PUBLISHED', questions: [] }
    const { fields } = validateLesson(lesson)
    expect(fields.audioUrl).toBe('Bài nghe xuất bản cần file âm thanh.')
    expect(fields.items).toBe('Bài xuất bản cần ít nhất 1 câu hỏi.')
    expect(validateLesson({ ...lesson, status: 'DRAFT' }).fields).toEqual({})
  })
})

describe('test drafts', () => {
  it('derives the grading mode and the API question type', () => {
    expect(modeOf({ skill: 'SPEAKING', options: [], acceptedAnswers: [] })).toBe('AI')
    expect(modeOf({ skill: 'WRITING', options: [], acceptedAnswers: ['because'] })).toBe('TEXT')
    expect(typeFor('READING', 'CHOICE', 'READING')).toBe('READING')
    expect(typeFor('READING', 'CHOICE', 'FILL_BLANK')).toBe('MULTIPLE_CHOICE')
    expect(typeFor('WRITING', 'AI', 'FILL_BLANK')).toBe('WRITING')
    expect(typeFor('LISTENING', 'TEXT', 'LISTENING')).toBe('LISTENING')
  })

  it('checks dates and the four skills of a comprehensive test', () => {
    const base = editableTest({ id: 1, title: 'Đề', type: 'PERIODIC', startDate: '2026-10-04', endDate: '2026-10-10', status: 'DRAFT', questions: [] })
    expect(validateTest({ ...base, endText: '01/10/2026' }).fields.endDate).toBe('Ngày đóng phải sau ngày mở.')
    const comprehensive = { ...base, type: 'COMPREHENSIVE', questions: [{ key: 'a', skill: 'READING', mode: 'AI', content: 'x', points: 1, options: [], acceptedAnswers: [] }] }
    expect(validateTest(comprehensive).fields.skills).toBe('Đề tổng hợp cần đủ 4 kỹ năng: còn thiếu Nghe, Nói, Viết.')
  })

  it('sends typed dates as ISO dates', () => {
    const draft = editableTest({ id: 1, title: ' Đề ', type: 'PERIODIC', startDate: '2026-10-04', endDate: '2026-10-10', status: 'DRAFT', questions: [] })
    expect(testPayload(draft)).toMatchObject({ title: 'Đề', startDate: '2026-10-04', endDate: '2026-10-10', draft: true })
  })

  it('names weeks as ISO weeks and reads dd/mm/yyyy dates', () => {
    expect(isoWeek('2026-10-03')).toBe(40)
    expect(isoWeek('2026-10-10')).toBe(41)
    expect(parseTypedDate('4/10/2026')).toBe('2026-10-04')
    expect(parseTypedDate('31/02/2026')).toBeNull()
  })
})
