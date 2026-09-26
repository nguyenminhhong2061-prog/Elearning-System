export const TESTS_PATH = '/tests'
export const PLAN_PATH = '/plan'
export const VOCABULARY_PATH = '/vocabulary'

/** Periods of the activity chart, as the API names them. */
export const PERIODS = Object.freeze([
  { id: 'DAY', label: 'Ngày', range: '7 ngày qua' },
  { id: 'WEEK', label: 'Tuần', range: '12 tuần qua' },
  { id: 'MONTH', label: 'Tháng', range: '6 tháng qua' },
])

/** What the activity chart can show (D1: words, exercises, average test score; plus the design's study time). */
export const METRICS = Object.freeze([
  { id: 'wordsLearned', label: 'Từ mới', unit: 'từ' },
  { id: 'exercisesCompleted', label: 'Bài tập', unit: 'bài' },
  { id: 'averageTestScore', label: 'Điểm kiểm tra', unit: 'điểm' },
  { id: 'studyMinutes', label: 'Thời gian học', unit: 'phút' },
])

/** The four tested skills, clockwise from the top of the radar. */
export const SKILL_AXES = Object.freeze([
  { key: 'listening', label: 'Nghe' },
  { key: 'reading', label: 'Đọc' },
  { key: 'writing', label: 'Viết' },
  { key: 'speaking', label: 'Nói' },
])

export const BADGE_UNITS = Object.freeze({ STREAK_DAYS: 'ngày', WORDS_LEARNED: 'từ', PERFECT_SCORE: 'bài' })
