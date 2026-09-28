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

/** The four tested skills, in the same order as the progress radar. */
export const SKILL_ORDER = Object.freeze(['listening', 'reading', 'writing', 'speaking'])

export const SKILL_LABELS = Object.freeze({
  listening: 'Nghe',
  reading: 'Đọc',
  writing: 'Viết',
  speaking: 'Nói',
})
