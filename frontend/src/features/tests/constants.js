// String values exactly as the backend serializes them in JSON (docs/api/tests.md).

export const TEST_TYPES = Object.freeze({
  PERIODIC: 'PERIODIC',
  COMPREHENSIVE: 'COMPREHENSIVE',
})

export const TEST_TYPE_LABELS = Object.freeze({
  PERIODIC: 'Kiểm tra định kỳ',
  COMPREHENSIVE: 'Kiểm tra tổng hợp',
})

export const QUESTION_TYPES = Object.freeze({
  MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
  FILL_BLANK: 'FILL_BLANK',
  LISTENING: 'LISTENING',
  SPEAKING: 'SPEAKING',
  READING: 'READING',
  WRITING: 'WRITING',
})

export const ATTEMPT_STATUS = Object.freeze({
  IN_PROGRESS: 'IN_PROGRESS',
  SUBMITTED: 'SUBMITTED',
  GRADED: 'GRADED',
})

/**
 * How long saving a recording may take. The server assesses it before answering, and the pronunciation service can
 * spend minutes loading its models the first time (the same limit as the pronunciation exercises).
 */
export const RECORDING_UPLOAD_TIMEOUT_MS = 600_000

/** How often the result of an attempt the AI is still grading is fetched again. */
export const GRADING_POLL_MS = 10_000

/** The criteria the AI rates a spoken or written answer on, in the order they are shown. */
export const AI_CRITERIA = Object.freeze([
  { key: 'task', label: 'Đáp ứng đề bài' },
  { key: 'coherence', label: 'Mạch lạc' },
  { key: 'vocabulary', label: 'Từ vựng' },
  { key: 'grammar', label: 'Ngữ pháp' },
])

/** The four tested skills, in the same order as the progress radar. */
export const SKILL_ORDER = Object.freeze(['listening', 'reading', 'writing', 'speaking'])

export const SKILL_LABELS = Object.freeze({
  listening: 'Nghe',
  reading: 'Đọc',
  writing: 'Viết',
  speaking: 'Nói',
})
