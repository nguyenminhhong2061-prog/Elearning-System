import { addDays, formatDayMonth, todayInVietnam } from '@/lib/dates'
import { answerErrors, blankOption, newKey, stripKeys } from '../editor/draft'
import { isoWeek, parseTypedDate, TEST_SKILL_LABELS } from '../format'

// Test drafts of the admin editor (docs/api/admin.md, "Đề kiểm tra"). A question is graded by its choices, by its
// accepted answers, or by the AI (speaking and writing only), like TestAttemptService; `mode` records which one the
// admin picked, and the API's question type follows from the skill and that mode.

export const SKILLS = ['LISTENING', 'SPEAKING', 'READING', 'WRITING']
export const AI_SKILLS = ['SPEAKING', 'WRITING']

export function modeOf(question) {
  if (question.options.length > 0) return 'CHOICE'
  if (question.acceptedAnswers.length > 0) return 'TEXT'
  return AI_SKILLS.includes(question.skill) ? 'AI' : 'TEXT'
}

/** The API's question type for a skill and a grading mode, keeping READING/WRITING where they still fit. */
export function typeFor(skill, mode, previousType) {
  if (skill === 'LISTENING') return 'LISTENING'
  if (skill === 'SPEAKING') return 'SPEAKING'
  if (mode === 'AI') return 'WRITING'
  if (mode === 'CHOICE') return previousType === 'READING' ? 'READING' : 'MULTIPLE_CHOICE'
  return previousType === 'WRITING' ? 'WRITING' : 'FILL_BLANK'
}

// Question templates of the "+ Thêm câu hỏi" chips.
export const TEMPLATES = [
  { id: 'choice', label: 'Trắc nghiệm', skill: 'READING', mode: 'CHOICE', type: 'MULTIPLE_CHOICE' },
  { id: 'blank', label: 'Điền từ', skill: 'WRITING', mode: 'TEXT', type: 'FILL_BLANK' },
  { id: 'listening', label: 'Nghe (kèm audio)', skill: 'LISTENING', mode: 'CHOICE', type: 'LISTENING' },
  { id: 'reading', label: 'Đọc hiểu', skill: 'READING', mode: 'CHOICE', type: 'READING' },
  { id: 'speaking', label: 'Nói (AI chấm)', skill: 'SPEAKING', mode: 'AI', type: 'SPEAKING' },
  { id: 'writing', label: 'Viết (AI chấm)', skill: 'WRITING', mode: 'AI', type: 'WRITING' },
]

export function newTestQuestion(template) {
  return {
    key: newKey(),
    skill: template.skill,
    type: template.type,
    mode: template.mode,
    points: template.mode === 'AI' ? 5 : 1,
    audioUrl: '',
    content: '',
    options: template.mode === 'CHOICE' ? [blankOption(), blankOption(), blankOption(), blankOption()] : [],
    acceptedAnswers: template.mode === 'TEXT' ? [''] : [],
  }
}

/** A test from the API as editable fields (dates typed as dd/mm/yyyy, grading mode explicit). */
export function editableTest(test) {
  const typed = (date) => (date ? `${formatDayMonth(date)}/${date.slice(0, 4)}` : '')
  return {
    ...test,
    startText: typed(test.startDate),
    endText: typed(test.endDate),
    draft: test.status === 'DRAFT',
    questions: test.questions.map((question) => ({ ...question, audioUrl: question.audioUrl ?? '', mode: modeOf(question) })),
  }
}

/**
 * Next week: the week after the weekly test that has already opened most recently (the one open today, or else the
 * last one to close), with that test as `last`. Same rule as `attention.periodicTestGap` of the overview.
 */
export function nextWeek(tests, today = todayInVietnam()) {
  const opened = tests.filter((test) => test.type === 'PERIODIC' && test.status !== 'DRAFT' && test.endDate && test.startDate <= today)
  if (opened.length === 0) return null
  const last = opened.toSorted((a, b) => a.startDate.localeCompare(b.startDate)).at(-1)
  const weekStart = addDays(last.endDate, 1)
  const weekEnd = addDays(last.endDate, 7)
  return { last, weekStart, weekEnd, week: isoWeek(weekEnd) }
}

/** The first week after every scheduled weekly test: where a new weekly test goes. */
export function weekAfterLast(tests) {
  const scheduled = tests.filter((test) => test.type === 'PERIODIC' && test.status !== 'DRAFT' && test.endDate)
  if (scheduled.length === 0) return null
  const lastEnd = scheduled.map((test) => test.endDate).sort().at(-1)
  return { weekStart: addDays(lastEnd, 1), weekEnd: addDays(lastEnd, 7) }
}

export const periodicTitle = (endDate) => `Kiểm tra định kỳ — tuần ${isoWeek(endDate)}`

export function newTest(type, week) {
  return {
    id: null,
    title: type === 'PERIODIC' && week ? periodicTitle(week.weekEnd) : '',
    type,
    status: 'DRAFT',
    submissions: 0,
    averageScore: null,
    duplicatedFrom: null,
    startText: week ? `${formatDayMonth(week.weekStart)}/${week.weekStart.slice(0, 4)}` : '',
    endText: week ? `${formatDayMonth(week.weekEnd)}/${week.weekEnd.slice(0, 4)}` : '',
    draft: true,
    questions: [],
  }
}

/** Everything wrong with a draft; `locked` is a test with submissions (only wording changes are checked there). */
export function validateTest(draft) {
  const fields = {}
  const questions = {}
  if (!draft.title.trim()) fields.title = 'Vui lòng nhập tên đề.'
  else if (draft.title.trim().length > 200) fields.title = 'Tên đề tối đa 200 ký tự.'
  if (draft.type === 'PERIODIC') {
    const start = parseTypedDate(draft.startText)
    const end = parseTypedDate(draft.endText)
    if (!start) fields.startDate = 'Nhập ngày mở dạng ngày/tháng/năm.'
    if (!end) fields.endDate = 'Nhập ngày đóng dạng ngày/tháng/năm.'
    else if (start && end <= start) fields.endDate = 'Ngày đóng phải sau ngày mở.'
  }
  if (draft.questions.length === 0) fields.questions = 'Đề cần ít nhất 1 câu hỏi.'
  if (draft.type === 'COMPREHENSIVE') {
    const missing = SKILLS.filter((skill) => !draft.questions.some((question) => question.skill === skill))
    if (missing.length > 0) fields.skills = `Đề tổng hợp cần đủ 4 kỹ năng: còn thiếu ${missing.map((skill) => TEST_SKILL_LABELS[skill]).join(', ')}.`
  }
  draft.questions.forEach((question) => {
    const errors = {}
    if (!question.content.trim()) errors.content = 'Vui lòng nhập đề bài.'
    if (!Number.isInteger(question.points) || question.points < 1) errors.points = 'Điểm là số nguyên từ 1.'
    Object.assign(errors, answerErrors(question, question.mode))
    if (Object.keys(errors).length > 0) questions[question.key] = errors
  })
  return { fields, questions, count: Object.keys(fields).length + Object.keys(questions).length }
}

/** The body of POST/PUT /api/admin/tests. */
export function testPayload(draft) {
  return stripKeys({
    ...(draft.id ? {} : { type: draft.type }),
    title: draft.title.trim(),
    startDate: draft.type === 'PERIODIC' ? parseTypedDate(draft.startText) : null,
    endDate: draft.type === 'PERIODIC' ? parseTypedDate(draft.endText) : null,
    draft: draft.draft,
    questions: draft.questions.map((question) => ({
      id: question.id,
      skill: question.skill,
      type: question.type,
      points: question.points,
      audioUrl: question.audioUrl?.trim() || null,
      content: question.content.trim(),
      options: question.mode === 'CHOICE' ? question.options.map(({ id, text, correct }) => ({ id, text: text.trim(), correct })) : [],
      acceptedAnswers: question.mode === 'TEXT' ? question.acceptedAnswers.map((answer) => answer.trim()).filter(Boolean) : [],
    })),
  })
}
