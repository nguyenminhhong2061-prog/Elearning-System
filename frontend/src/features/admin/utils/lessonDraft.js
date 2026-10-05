import { answerErrors, blankOption, newKey, stripKeys } from './draft'

// Lesson drafts of the admin editor (docs/api/admin.md, "Bài tập"): an empty lesson, the checks the server makes, and
// the body sent to it. A question about a reading passage holds the passage's draft key (`passageKey`); the body turns
// it into the passage's place in the list (`passageIndex`), since a new passage has no id yet.

/** An empty question: a writing one for a writing lesson, else multiple choice. */
export function newQuestion(skill) {
  const writing = skill === 'WRITING'
  return {
    key: newKey(),
    type: writing ? 'TRANSLATION' : 'MULTIPLE_CHOICE',
    prompt: '',
    hint: '',
    explanation: '',
    points: writing ? 2 : 1,
    options: writing ? [] : [blankOption(), blankOption(), blankOption()],
    acceptedAnswers: [],
    passageKey: null,
    starter: '',
    sampleAnswers: writing ? [''] : [],
  }
}

export const newPassage = () => ({ key: newKey(), title: '', content: '' })
export const newSegment = (startMs = 0) => ({ key: newKey(), startMs, endMs: startMs + 5000, speaker: '', text: '', translation: '' })
export const newItem = () => ({ key: newKey(), text: '', ipa: '', audioUrl: '', notes: '' })

/** An empty lesson of a skill (scenario 23, step 4). */
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
    readingPassages: [],
    questions: skill === 'PRONUNCIATION' ? [] : [newQuestion(skill)],
    passage: skill === 'LISTENING' ? { audioUrl: '', audioMissing: true, durationMs: null, transcript: '', translation: '', segments: [newSegment()] } : null,
    pronunciationItems: skill === 'PRONUNCIATION' ? [newItem()] : [],
  }
}

const itemCount = (draft) => (draft.skill === 'PRONUNCIATION' ? draft.pronunciationItems.length : draft.questions.length)
const filled = (list) => list.some((text) => text.trim())

/** Problems of one question (scenario 23, step 12 and branch 8a). */
function questionErrors(question, skill) {
  const errors = {}
  if (!question.prompt.trim()) errors.prompt = skill === 'WRITING' ? 'Vui lòng nhập nội dung câu.' : 'Vui lòng nhập đề bài.'
  if (!Number.isInteger(question.points) || question.points < 1) errors.points = 'Điểm là số nguyên từ 1.'
  if (skill === 'WRITING') {
    // The AI grades a writing answer against the prompt and these samples.
    if (!filled(question.sampleAnswers)) errors.sampleAnswers = 'Câu viết cần ít nhất một câu trả lời mẫu.'
  } else {
    Object.assign(errors, answerErrors(question, question.type === 'MULTIPLE_CHOICE' ? 'CHOICE' : 'TEXT'))
  }
  return errors
}

/**
 * Everything wrong with a draft, before sending it (the server checks the same rules).
 * @returns {{ fields: Record<string, string>, passages: Record<string, Record<string, string>>, questions: Record<string, Record<string, string>>, segments: Record<string, Record<string, string>>, items: Record<string, Record<string, string>>, count: number }}
 */
export function validateLesson(draft) {
  const fields = {}
  const passages = {}
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
    fields.items = draft.skill === 'PRONUNCIATION' ? 'Bài xuất bản phải có ít nhất một câu mẫu.' : 'Bài xuất bản phải có ít nhất một câu hỏi.'
  }

  draft.readingPassages.forEach((passage) => {
    const errors = {}
    if (!passage.title.trim()) errors.title = 'Vui lòng nhập tiêu đề bài đọc.'
    if (!passage.content.trim()) errors.content = 'Vui lòng nhập nội dung bài đọc.'
    if (Object.keys(errors).length > 0) passages[passage.key] = errors
  })

  draft.questions.forEach((question) => {
    const errors = questionErrors(question, draft.skill)
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

  // Text, IPA and model audio are all required (scenario 23, branch 3c); the notes are not.
  draft.pronunciationItems.forEach((item) => {
    const errors = {}
    if (!item.text.trim()) errors.text = 'Vui lòng nhập câu mẫu.'
    if (!item.ipa.trim()) errors.ipa = 'Vui lòng nhập phiên âm IPA.'
    if (!item.audioUrl.trim()) errors.audioUrl = 'Vui lòng tải âm thanh mẫu.'
    if (Object.keys(errors).length > 0) items[item.key] = errors
  })

  const count = [fields, passages, questions, segments, items].reduce((sum, group) => sum + Object.keys(group).length, 0)
  return { fields, passages, questions, segments, items, count }
}

const orNull = (text) => (typeof text === 'string' && text.trim() ? text.trim() : null)

function questionPayload(question, skill, passageKeys) {
  const writing = skill === 'WRITING'
  const passageIndex = skill === 'READING' && question.passageKey ? passageKeys.indexOf(question.passageKey) : -1
  return {
    id: question.id,
    type: question.type,
    prompt: question.prompt.trim(),
    hint: orNull(question.hint),
    explanation: orNull(question.explanation),
    points: question.points,
    options: question.type === 'MULTIPLE_CHOICE' ? question.options.map(({ id, text, correct }) => ({ id, text: text.trim(), correct })) : [],
    acceptedAnswers: question.type === 'FILL_BLANK' ? question.acceptedAnswers.map((answer) => answer.trim()).filter(Boolean) : [],
    passageIndex: passageIndex >= 0 ? passageIndex : null,
    starter: question.type === 'REWRITE' ? orNull(question.starter) : null,
    sampleAnswers: writing ? question.sampleAnswers.map((answer) => answer.trim()).filter(Boolean) : [],
  }
}

/** The body of POST/PUT /api/admin/lessons. */
export function lessonPayload(draft) {
  const passageKeys = draft.readingPassages.map((passage) => passage.key)
  const body = {
    title: draft.title.trim(),
    description: orNull(draft.description),
    topic: orNull(draft.topic),
    skill: draft.skill,
    cefrLevel: draft.cefrLevel,
    difficulty: draft.difficulty,
    estimatedMinutes: draft.estimatedMinutes,
    status: draft.status,
    readingPassages: draft.readingPassages.map(({ id, title, content }) => ({ id, title: title.trim(), content: content.trim() })),
    questions: draft.questions.map((question) => questionPayload(question, draft.skill, passageKeys)),
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

/**
 * Lesson from the API, with empty strings instead of null so every input is controlled. A question's passage id
 * becomes the passage's draft key (toDraft keys a passage with id 71 as "id-71").
 */
export function editableLesson(lesson) {
  return {
    ...lesson,
    description: lesson.description ?? '',
    topic: lesson.topic ?? '',
    readingPassages: lesson.readingPassages ?? [],
    questions: lesson.questions.map(({ passageId, ...question }) => ({
      ...question,
      hint: question.hint ?? '',
      explanation: question.explanation ?? '',
      passageKey: passageId ? `id-${passageId}` : null,
      starter: question.starter ?? '',
      sampleAnswers: question.sampleAnswers ?? [],
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
