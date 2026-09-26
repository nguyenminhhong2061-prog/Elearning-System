/** skill values as the API returns them (docs/api/exercises.md). */
export const SKILLS = Object.freeze({
  GRAMMAR: 'GRAMMAR',
  LISTENING: 'LISTENING',
  PRONUNCIATION: 'PRONUNCIATION',
})

export const EXERCISES_PATH = '/exercises'

/**
 * How each skill appears: the ?skill= value of its tab, the tab label, the list title, what its lessons are called in
 * counts ("4 bài nghe") and what one item is called ("10 câu", "15 mục"). Tabs follow the design's order.
 */
export const SKILL_INFO = Object.freeze({
  GRAMMAR: { param: 'grammar', tab: 'Ngữ pháp', title: 'Bài tập ngữ pháp', lessons: 'bài ngữ pháp', unit: 'câu' },
  LISTENING: { param: 'listening', tab: 'Nghe hiểu', title: 'Bài tập nghe hiểu', lessons: 'bài nghe', unit: 'câu' },
  PRONUNCIATION: { param: 'pronunciation', tab: 'Phát âm', title: 'Bài tập phát âm', lessons: 'bài phát âm', unit: 'mục' },
})

export const SKILL_ORDER = [SKILLS.GRAMMAR, SKILLS.LISTENING, SKILLS.PRONUNCIATION]

/** The skill of a ?skill= value; grammar (the first tab) when it is missing or unknown. */
export function skillFromParam(param) {
  return SKILL_ORDER.find((skill) => SKILL_INFO[skill].param === param) ?? SKILLS.GRAMMAR
}

/** List page of a skill. Grammar is the default tab, so it keeps the bare /exercises. */
export function skillPath(skill) {
  return skill === SKILLS.GRAMMAR ? EXERCISES_PATH : `${EXERCISES_PATH}?skill=${SKILL_INFO[skill].param}`
}

export function lessonPath(lessonId) {
  return `${EXERCISES_PATH}/lessons/${lessonId}`
}

/** Difficulty tags with the design's colours: "Dễ" green, "Trung bình" grey, "Khó" red. */
export const DIFFICULTY = Object.freeze({
  EASY: { label: 'Dễ', variant: 'success' },
  MEDIUM: { label: 'Trung bình', variant: 'neutral' },
  HARD: { label: 'Khó', variant: 'danger' },
})

/** Vietnamese names of the CEFR levels, for the list's section headings. */
export const LEVEL_NAMES = Object.freeze({
  A1: 'Mới bắt đầu',
  A2: 'Sơ cấp',
  B1: 'Trung cấp',
  B2: 'Trung cao cấp',
  C1: 'Cao cấp',
  C2: 'Thành thạo',
})

/** Speeds offered by the listening player (the design's three buttons). */
export const PLAYBACK_RATES = Object.freeze([0.75, 1, 1.25])

/** Longest recording for one pronunciation item; the recorder stops by itself. Matches the API limit. */
export const MAX_RECORDING_MS = 10_000

/** Shorter recordings are rejected before upload (the API answers 400 below 0.3s). */
export const MIN_RECORDING_MS = 300

/**
 * Colour band of a 0-100 pronunciation score: green from 80, orange from 60, red below. Used by the score ring and
 * the word-by-word feedback.
 * @returns {'good' | 'fair' | 'poor'}
 */
export function scoreBand(score) {
  if (score >= 80) return 'good'
  if (score >= 60) return 'fair'
  return 'poor'
}
