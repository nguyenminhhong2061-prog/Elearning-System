import { answerErrors, blankOption, newKey, stripKeys } from './draft'

// Lesson drafts of the admin editor (docs/api/admin.md, "Bài tập"): an empty lesson, the checks the server makes, and
// the body sent to it.

export function newQuestion(type = 'MULTIPLE_CHOICE') {
  return {
    key: newKey(),
    type,
    prompt: '',
    hint: '',
    explanation: '',
    points: 1,
    options: type === 'MULTIPLE_CHOICE' ? [blankOption(), blankOption(), blankOption()] : [],
    acceptedAnswers: type === 'FILL_BLANK' ? [''] : [],
  }
}

export const newSegment = (startMs = 0) => ({ key: newKey(), startMs, endMs: startMs + 5000, speaker: '', text: '', translation: '' })
export const newItem = () => ({ key: newKey(), text: '', ipa: '', audioUrl: '', notes: '' })

/** An empty draft lesson of a skill. */
export function newLesson(skill) {
  return {
    id: null,
    title: '',
    description: '',
    topic: '',
    skill,
    cefrLevel: '',
    difficulty: 'MEDIUM',
    estimatedMinutes: 5,
    status: 'DRAFT',
    attempts: 0,
    updatedAt: null,
    issues: [],
    questions: skill === 'PRONUNCIATION' ? [] : [newQuestion()],
    passage: skill === 'LISTENING' ? { audioUrl: '', audioMissing: true, durationMs: null, transcript: '', translation: '', segments: [newSegment()] } : null,
    pronunciationItems: skill === 'PRONUNCIATION' ? [newItem()] : [],
  }
}

const itemCount = (draft) => (draft.skill === 'PRONUNCIATION' ? draft.pronunciationItems.length : draft.questions.length)

/**
 * Everything wrong with a draft, before sending it (the server checks the same rules).
 * @returns {{ fields: Record<string, string>, questions: Record<string, Record<string, string>>, segments: Record<string, Record<string, string>>, items: Record<string, Record<string, string>>, count: number }}
 */
export function validateLesson(draft) {
  const fields = {}
  const questions = {}
  const segments = {}
  const items = {}

  if (!draft.title.trim()) fields.title = 'Vui lòng nhập tiêu đề.'
  else if (draft.title.trim().length > 150) fields.title = 'Tiêu đề tối đa 150 ký tự.'
  if (!draft.cefrLevel) fields.cefrLevel = 'Vui lòng chọn trình độ.'
  if (draft.estimatedMinutes !== null && (!Number.isInteger(draft.estimatedMinutes) || draft.estimatedMinutes < 1)) {
    fields.estimatedMinutes = 'Nhập số phút từ 1 trở lên.'
  }

  const publishing = draft.status === 'PUBLISHED'
  if (publishing && itemCount(draft) === 0) {
    fields.items = draft.skill === 'PRONUNCIATION' ? 'Bài xuất bản cần ít nhất 1 câu mẫu.' : 'Bài xuất bản cần ít nhất 1 câu hỏi.'
  }

  draft.questions.forEach((question) => {
    const errors = {}
    if (!question.prompt.trim()) errors.prompt = 'Vui lòng nhập đề bài.'
    if (!Number.isInteger(question.points) || question.points < 1) errors.points = 'Điểm là số nguyên từ 1.'
    Object.assign(errors, answerErrors(question, question.type === 'MULTIPLE_CHOICE' ? 'CHOICE' : 'TEXT'))
    if (Object.keys(errors).length > 0) questions[question.key] = errors
  })

  if (draft.skill === 'LISTENING') {
    if (publishing && !draft.passage.audioUrl) fields.audioUrl = 'Bài nghe xuất bản cần file âm thanh.'
    if (publishing && !draft.passage.transcript.trim()) fields.transcript = 'Vui lòng nhập transcript.'
    draft.passage.segments.forEach((segment) => {
      const errors = {}
      if (segment.startMs === null) errors.startMs = 'Thời điểm không hợp lệ.'
      if (segment.endMs === null) errors.endMs = 'Thời điểm không hợp lệ.'
      else if (segment.startMs !== null && segment.endMs <= segment.startMs) errors.endMs = 'Kết thúc phải sau bắt đầu.'
      if (!segment.text.trim()) errors.text = 'Vui lòng nhập câu tiếng Anh.'
      if (Object.keys(errors).length > 0) segments[segment.key] = errors
    })
  }

  draft.pronunciationItems.forEach((item) => {
    if (!item.text.trim()) items[item.key] = { text: 'Vui lòng nhập câu mẫu.' }
  })

  const count =
    Object.keys(fields).length +
    Object.keys(questions).length +
    Object.keys(segments).length +
    Object.keys(items).length
  return { fields, questions, segments, items, count }
}

const orNull = (text) => (typeof text === 'string' && text.trim() ? text.trim() : null)

/** The body of POST/PUT /api/admin/lessons. */
export function lessonPayload(draft) {
  const body = {
    title: draft.title.trim(),
    description: orNull(draft.description),
    topic: orNull(draft.topic),
    skill: draft.skill,
    cefrLevel: draft.cefrLevel,
    difficulty: draft.difficulty,
    estimatedMinutes: draft.estimatedMinutes,
    status: draft.status,
    questions: draft.questions.map((question) => ({
      id: question.id,
      type: question.type,
      prompt: question.prompt.trim(),
      hint: orNull(question.hint),
      explanation: orNull(question.explanation),
      points: question.points,
      options: question.type === 'MULTIPLE_CHOICE' ? question.options.map(({ id, text, correct }) => ({ id, text: text.trim(), correct })) : [],
      acceptedAnswers: question.type === 'FILL_BLANK' ? question.acceptedAnswers.map((answer) => answer.trim()).filter(Boolean) : [],
    })),
    passage: draft.passage && {
      audioUrl: orNull(draft.passage.audioUrl),
      durationMs: draft.passage.durationMs,
      transcript: draft.passage.transcript.trim(),
      translation: draft.passage.translation.trim(),
      segments: draft.passage.segments.map(({ id, startMs, endMs, speaker, text, translation }) => ({
        id,
        startMs,
        endMs,
        speaker: orNull(speaker),
        text: text.trim(),
        translation: orNull(translation),
      })),
    },
    pronunciationItems: draft.pronunciationItems.map(({ id, text, ipa, audioUrl, notes }) => ({
      id,
      text: text.trim(),
      ipa: orNull(ipa),
      audioUrl: orNull(audioUrl),
      notes: orNull(notes),
    })),
  }
  return stripKeys(body)
}

/** Lesson from the API, with empty strings instead of null so every input is controlled. */
export function editableLesson(lesson) {
  return {
    ...lesson,
    description: lesson.description ?? '',
    topic: lesson.topic ?? '',
    questions: lesson.questions.map((question) => ({
      ...question,
      hint: question.hint ?? '',
      explanation: question.explanation ?? '',
    })),
    passage: lesson.passage && {
      ...lesson.passage,
      audioUrl: lesson.passage.audioUrl ?? '',
      transcript: lesson.passage.transcript ?? '',
      translation: lesson.passage.translation ?? '',
      segments: lesson.passage.segments.map((segment) => ({ ...segment, speaker: segment.speaker ?? '', translation: segment.translation ?? '' })),
    },
    pronunciationItems: lesson.pronunciationItems.map((item) => ({ ...item, ipa: item.ipa ?? '', audioUrl: item.audioUrl ?? '', notes: item.notes ?? '' })),
  }
}
