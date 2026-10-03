import { addDays, formatDayMonth, todayInVietnam } from '@/lib/dates'
import { answerErrors, blankOption, newKey, stripKeys } from './draft'
import { TEST_SKILL_LABELS } from '../constants'
import { isoWeek, parseTypedDate } from './format'

// Test drafts of the admin editor (docs/api/admin.md, "Đề kiểm tra"). A question has a skill and a type, as in the
// design: multiple choice, fill-in, or graded by the AI (SPEAKING for spoken answers, ESSAY for written ones). The
// editor shows the type as a grading mode (`mode`). A question using a shared material holds the material's draft key
// (`materialKey`); the body turns it into the material's place in the list (`materialIndex`).

export const SKILLS = ['LISTENING', 'SPEAKING', 'READING', 'WRITING']

/** Grading modes each skill allows: listening and reading are never graded by the AI, speaking always is. */
export const MODES_BY_SKILL = {
  LISTENING: ['CHOICE', 'TEXT'],
  SPEAKING: ['AI'],
  READING: ['CHOICE', 'TEXT'],
  WRITING: ['CHOICE', 'TEXT', 'AI'],
}

const MODE_OF_TYPE = { MULTIPLE_CHOICE: 'CHOICE', FILL_BLANK: 'TEXT', SPEAKING: 'AI', ESSAY: 'AI' }
export const modeOf = (question) => MODE_OF_TYPE[question.type]

/** The API's question type for a skill and a grading mode. */
export function typeFor(skill, mode) {
  if (mode === 'AI') return skill === 'SPEAKING' ? 'SPEAKING' : 'ESSAY'
  return mode === 'CHOICE' ? 'MULTIPLE_CHOICE' : 'FILL_BLANK'
}

/** Skills whose questions may use a shared material of the same kind (tbl_test_material). */
export const MATERIAL_SKILLS = ['LISTENING', 'READING']

// Question templates of the "+ Thêm câu hỏi" chips.
export const TEMPLATES = [
  { id: 'choice', label: 'Trắc nghiệm', skill: 'READING', mode: 'CHOICE' },
  { id: 'blank', label: 'Điền từ', skill: 'WRITING', mode: 'TEXT' },
  { id: 'listening', label: 'Nghe', skill: 'LISTENING', mode: 'CHOICE' },
  { id: 'speaking', label: 'Nói (AI chấm)', skill: 'SPEAKING', mode: 'AI' },
  { id: 'essay', label: 'Viết tự luận (AI chấm)', skill: 'WRITING', mode: 'AI' },
]

export function newTestQuestion(template) {
  return {
    key: newKey(),
    skill: template.skill,
    type: typeFor(template.skill, template.mode),
    mode: template.mode,
    points: template.mode === 'AI' ? 5 : 1,
    audioUrl: '',
    content: '',
    options: template.mode === 'CHOICE' ? [blankOption(), blankOption(), blankOption(), blankOption()] : [],
    acceptedAnswers: template.mode === 'TEXT' ? [''] : [],
    vocabularyId: null,
    materialKey: null,
  }
}

/** A question the server made from a word (scenario 24, step 6), as a draft question. */
export function wordQuestionDraft(question) {
  return {
    ...question,
    key: newKey(),
    mode: modeOf(question),
    audioUrl: question.audioUrl ?? '',
    options: question.options.map((option) => ({ ...option, key: newKey() })),
    materialKey: null,
  }
}

export const newMaterial = (type) => ({ key: newKey(), type, title: '', audioUrl: '', text: '' })

export const MATERIAL_KINDS = { LISTENING: 'Bài nghe', READING: 'Bài đọc' }

/** "Bài nghe 1", "Bài đọc 2": a material's name when it has no title, numbered within its kind. */
export function materialName(materials, material) {
  if (material.title.trim()) return material.title.trim()
  const sameKind = materials.filter((other) => other.type === material.type)
  return `${MATERIAL_KINDS[material.type]} ${sameKind.indexOf(material) + 1}`
}

const typed = (date) => (date ? `${formatDayMonth(date)}/${date.slice(0, 4)}` : '')

/**
 * A test from the API as editable fields: dates typed as dd/mm/yyyy, grading mode explicit, a question's material id
 * turned into the material's draft key (toDraft keys a material with id 801 as "id-801").
 */
export function editableTest(test) {
  return {
    ...test,
    skillText: test.skillText ?? '',
    instruction: test.instruction ?? '',
    startText: typed(test.startDate),
    endText: typed(test.endDate),
    materials: (test.materials ?? []).map((material) => ({ ...material, title: material.title ?? '', audioUrl: material.audioUrl ?? '', text: material.text ?? '' })),
    questions: test.questions.map(({ materialId, ...question }) => ({
      ...question,
      audioUrl: question.audioUrl ?? '',
      vocabularyId: question.vocabularyId ?? null,
      mode: modeOf(question),
      materialKey: materialId ? `id-${materialId}` : null,
    })),
  }
}

/** What the lists show: a shown test is "upcoming", "open" or "closed" by its dates; drafts and hidden ones say so. */
export const displayStatus = (test) => (test.status === 'VISIBLE' ? test.phase : test.status)

const shownWeekly = (tests) => tests.filter((test) => test.type === 'PERIODIC' && test.status === 'VISIBLE')

/**
 * Next week: the week after the weekly test that has already opened most recently (the one open today, or else the
 * last one to close), with that test as `last`. Same rule as `attention.periodicTestGap` of the overview.
 */
export function nextWeek(tests, today = todayInVietnam()) {
  const opened = shownWeekly(tests).filter((test) => test.startDate <= today)
  if (opened.length === 0) return null
  const last = opened.toSorted((a, b) => a.startDate.localeCompare(b.startDate)).at(-1)
  const weekStart = addDays(last.endDate, 1)
  const weekEnd = addDays(last.endDate, 7)
  return { last, weekStart, weekEnd, week: isoWeek(weekEnd) }
}

/** The first week after every scheduled weekly test: where a new weekly test goes. */
export function weekAfterLast(tests) {
  const scheduled = shownWeekly(tests)
  if (scheduled.length === 0) return null
  const lastEnd = scheduled.map((test) => test.endDate).sort().at(-1)
  return { weekStart: addDays(lastEnd, 1), weekEnd: addDays(lastEnd, 7) }
}

export const periodicTitle = (endDate) => `Kiểm tra định kỳ — tuần ${isoWeek(endDate)}`

/** Next month, the usual period of a comprehensive test ("Kiểm tra tổng hợp tháng 10/2026", 01/10 – 31/10). */
export function nextMonth(today = todayInVietnam()) {
  const [year, month] = today.split('-').map(Number)
  const first = new Date(Date.UTC(year, month, 1))
  const last = new Date(Date.UTC(year, month + 1, 0))
  const iso = (date) => date.toISOString().slice(0, 10)
  return { start: iso(first), end: iso(last), label: `${first.getUTCMonth() + 1}/${first.getUTCFullYear()}` }
}

/** An empty test: a weekly one for `week`, a comprehensive one for next month. */
export function newTest(type, week, today = todayInVietnam()) {
  const month = type === 'COMPREHENSIVE' ? nextMonth(today) : null
  const start = month?.start ?? week?.weekStart ?? null
  const end = month?.end ?? week?.weekEnd ?? null
  return {
    id: null,
    title: month ? `Kiểm tra tổng hợp tháng ${month.label}` : week ? periodicTitle(week.weekEnd) : '',
    type,
    skillText: type === 'COMPREHENSIVE' ? 'Nghe, nói, đọc, viết' : '',
    instruction: '',
    status: 'DRAFT',
    submissions: 0,
    averageScore: null,
    duplicatedFrom: null,
    startText: typed(start),
    endText: typed(end),
    materials: [],
    questions: [],
  }
}

/** The shared material a question may use: one of the test's materials of the question's own kind. */
const usableMaterial = (draft, question) =>
  MATERIAL_SKILLS.includes(question.skill) ? draft.materials.find((material) => material.key === question.materialKey && material.type === question.skill) : undefined

/** Everything wrong with a draft (scenario 24, steps 9 and branches 9a, 9b). */
export function validateTest(draft) {
  const fields = {}
  const materials = {}
  const questions = {}
  if (!draft.title.trim()) fields.title = 'Vui lòng nhập tên đề.'
  else if (draft.title.trim().length > 200) fields.title = 'Tên đề tối đa 200 ký tự.'
  const start = parseTypedDate(draft.startText)
  const end = parseTypedDate(draft.endText)
  if (!start) fields.startDate = 'Nhập ngày mở dạng ngày/tháng/năm.'
  if (!end) fields.endDate = 'Nhập ngày đóng dạng ngày/tháng/năm.'
  else if (start && end <= start) fields.endDate = 'Ngày đóng phải sau ngày mở.'
  if (draft.questions.length === 0) fields.questions = 'Đề cần ít nhất 1 câu hỏi.'
  if (draft.type === 'COMPREHENSIVE') {
    const missing = SKILLS.filter((skill) => !draft.questions.some((question) => question.skill === skill))
    if (missing.length > 0) fields.skills = `Đề tổng hợp cần đủ 4 kỹ năng: còn thiếu ${missing.map((skill) => TEST_SKILL_LABELS[skill]).join(', ')}.`
  }
  draft.materials.forEach((material) => {
    if (material.type === 'LISTENING' && !material.audioUrl.trim()) materials[material.key] = { audioUrl: 'Bài nghe chung cần file âm thanh.' }
    if (material.type === 'READING' && !material.text.trim()) materials[material.key] = { text: 'Vui lòng nhập nội dung bài đọc.' }
  })
  draft.questions.forEach((question) => {
    const errors = {}
    if (!question.content.trim()) errors.content = 'Vui lòng nhập đề bài.'
    if (!Number.isInteger(question.points) || question.points < 1) errors.points = 'Điểm là số nguyên từ 1.'
    Object.assign(errors, answerErrors(question, question.mode))
    if (Object.keys(errors).length > 0) questions[question.key] = errors
  })
  const count = Object.keys(fields).length + Object.keys(materials).length + Object.keys(questions).length
  return { fields, materials, questions, count }
}

const orNull = (text) => (typeof text === 'string' && text.trim() ? text.trim() : null)

/** The body of POST/PUT /api/admin/tests. */
export function testPayload(draft) {
  const materialKeys = draft.materials.map((material) => material.key)
  return stripKeys({
    ...(draft.id ? {} : { type: draft.type }),
    title: draft.title.trim(),
    skillText: orNull(draft.skillText),
    instruction: orNull(draft.instruction),
    startDate: parseTypedDate(draft.startText),
    endDate: parseTypedDate(draft.endText),
    status: draft.status,
    materials: draft.materials.map(({ id, type, title, audioUrl, text }) => ({
      id,
      type,
      title: orNull(title),
      audioUrl: type === 'LISTENING' ? orNull(audioUrl) : null,
      text: type === 'READING' ? orNull(text) : null,
    })),
    questions: draft.questions.map((question) => {
      const material = usableMaterial(draft, question)
      return {
        id: question.id,
        skill: question.skill,
        type: question.type,
        points: question.points,
        audioUrl: question.skill === 'LISTENING' ? orNull(question.audioUrl) : null,
        content: question.content.trim(),
        options: question.mode === 'CHOICE' ? question.options.map(({ id, text, correct }) => ({ id, text: text.trim(), correct })) : [],
        acceptedAnswers: question.mode === 'TEXT' ? question.acceptedAnswers.map((answer) => answer.trim()).filter(Boolean) : [],
        vocabularyId: question.vocabularyId ?? null,
        materialIndex: material ? materialKeys.indexOf(material.key) : null,
      }
    }),
  })
}
