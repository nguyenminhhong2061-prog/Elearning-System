import { describe, expect, it } from 'vitest'
import { isoWeek, parseTypedDate } from './format'
import { validateLesson, newLesson } from './lessonDraft'
import { editableTest, modeOf, newTest, nextMonth, testPayload, typeFor, validateTest } from './testDraft'
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
    expect(fields.items).toBe('Bài xuất bản phải có ít nhất một câu hỏi.')
    expect(validateLesson({ ...lesson, status: 'DRAFT' }).fields).toEqual({})
  })
})

describe('test drafts', () => {
  it('reads the grading mode from the question type, and back', () => {
    expect(modeOf({ type: 'SPEAKING' })).toBe('AI')
    expect(modeOf({ type: 'ESSAY' })).toBe('AI')
    expect(modeOf({ type: 'FILL_BLANK' })).toBe('TEXT')
    expect(typeFor('WRITING', 'AI')).toBe('ESSAY')
    expect(typeFor('SPEAKING', 'AI')).toBe('SPEAKING')
    expect(typeFor('LISTENING', 'CHOICE')).toBe('MULTIPLE_CHOICE')
  })

  it('checks the dates of every test and the four skills of a comprehensive one', () => {
    const base = editableTest({ id: 1, title: 'Đề', type: 'PERIODIC', startDate: '2026-10-04', endDate: '2026-10-10', status: 'DRAFT', questions: [] })
    expect(validateTest({ ...base, endText: '01/10/2026' }).fields.endDate).toBe('Ngày đóng phải sau ngày mở.')
    const reading = { key: 'a', skill: 'READING', mode: 'TEXT', content: 'x', points: 1, options: [], acceptedAnswers: ['y'] }
    const comprehensive = { ...base, type: 'COMPREHENSIVE', startText: '', questions: [reading] }
    expect(validateTest(comprehensive).fields).toEqual({
      startDate: 'Nhập ngày mở dạng ngày/tháng/năm.',
      skills: 'Đề tổng hợp cần đủ 4 kỹ năng: còn thiếu Nghe, Nói, Viết.',
    })
  })

  it('sends typed dates, the status and questions linked to materials by their place', () => {
    const draft = toDraft(
      editableTest({
        id: 1,
        title: ' Đề ',
        type: 'COMPREHENSIVE',
        startDate: '2026-10-01',
        endDate: '2026-10-31',
        status: 'VISIBLE',
        materials: [
          { id: 801, type: 'LISTENING', title: null, audioUrl: '/a.mp3', text: null },
          { id: 802, type: 'READING', title: 'Hanoi', audioUrl: null, text: 'Hanoi is…' },
        ],
        questions: [
          { id: 5, skill: 'READING', type: 'FILL_BLANK', points: 1, audioUrl: null, content: 'Q', options: [], acceptedAnswers: ['a'], vocabularyId: 7, materialId: 802 },
          { id: 6, skill: 'WRITING', type: 'ESSAY', points: 5, audioUrl: null, content: 'W', options: [], acceptedAnswers: [], vocabularyId: null, materialId: null },
        ],
      }),
    )
    const body = testPayload(draft)
    expect(body).toMatchObject({ title: 'Đề', startDate: '2026-10-01', endDate: '2026-10-31', status: 'VISIBLE' })
    expect(body.materials).toEqual([
      { id: 801, type: 'LISTENING', title: null, audioUrl: '/a.mp3', text: null },
      { id: 802, type: 'READING', title: 'Hanoi', audioUrl: null, text: 'Hanoi is…' },
    ])
    expect(body.questions.map((question) => [question.type, question.vocabularyId, question.materialIndex])).toEqual([
      ['FILL_BLANK', 7, 1],
      ['ESSAY', null, null],
    ])
  })

  it('proposes next month for a new comprehensive test', () => {
    expect(nextMonth('2026-09-29')).toEqual({ start: '2026-10-01', end: '2026-10-31', label: '10/2026' })
    expect(nextMonth('2026-12-15')).toEqual({ start: '2027-01-01', end: '2027-01-31', label: '1/2027' })
    expect(newTest('COMPREHENSIVE', null, '2026-09-29')).toMatchObject({ title: 'Kiểm tra tổng hợp tháng 10/2026', startText: '01/10/2026', endText: '31/10/2026' })
  })

  it('names weeks as ISO weeks and reads dd/mm/yyyy dates', () => {
    expect(isoWeek('2026-10-03')).toBe(40)
    expect(isoWeek('2026-10-10')).toBe(41)
    expect(parseTypedDate('4/10/2026')).toBe('2026-10-04')
    expect(parseTypedDate('31/02/2026')).toBeNull()
  })
})
