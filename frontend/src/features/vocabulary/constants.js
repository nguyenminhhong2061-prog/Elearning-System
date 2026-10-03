// Fixed values of module A (vocabulary). Functions that compute something from them are in utils/.

/** learningStatus values as the API returns them (see docs/api/vocabulary.md). */
export const LEARNING_STATUS = Object.freeze({
  NEW: 'NEW',
  LEARNING: 'LEARNING',
  MASTERED: 'MASTERED',
})

/** How well the learner remembered a card. Exactly three levels (decided 25/09/2026; see docs/api/learning.md). */
export const REVIEW_RESULT = Object.freeze({
  FORGOT: 'FORGOT',
  VAGUE: 'VAGUE',
  REMEMBERED: 'REMEMBERED',
})

/** The rating buttons, in the order shown, with their keyboard shortcut and colours. */
export const REVIEW_OPTIONS = Object.freeze([
  { value: REVIEW_RESULT.FORGOT, label: 'Chưa nhớ', shortcut: '1', button: 'bg-review-forgot', tag: 'danger' },
  { value: REVIEW_RESULT.VAGUE, label: 'Nhớ mơ hồ', shortcut: '2', button: 'bg-review-vague', tag: 'warning' },
  { value: REVIEW_RESULT.REMEMBERED, label: 'Nhớ rõ', shortcut: '3', button: 'bg-review-remembered', tag: 'success' },
])

/** Words of a topic loaded per "Xem thêm từ". */
export const TOPIC_WORDS_PAGE_SIZE = 20
/** Reviewed words loaded per "Xem thêm" in the history tab. */
export const HISTORY_PAGE_SIZE = 20
/** Words of a personal list loaded per "Xem thêm từ". */
export const LIST_WORDS_PAGE_SIZE = 50

/** Word searches start from this many characters. */
export const WORD_SEARCH_MIN_LENGTH = 2
/** Words shown for one search. */
export const WORD_SEARCH_LIMIT = 10
/** Pause in typing before a search is sent. */
export const SEARCH_DELAY_MS = 300

/**
 * History tab: the statistics that show their words when chosen (?show= in the URL, so reloads and the back button
 * keep the choice), with the history filter each one sends (docs/api/learning.md).
 */
export const HISTORY_FILTERS = Object.freeze({
  learning: {
    label: 'Đang học',
    query: { status: LEARNING_STATUS.LEARNING },
    heading: 'Từ đang học',
    empty: 'Chưa có từ nào đang học. Hãy chọn một chủ đề ở tab “Chủ đề có sẵn” để bắt đầu học.',
  },
  mastered: {
    label: 'Đã thuộc',
    query: { status: LEARNING_STATUS.MASTERED },
    heading: 'Từ đã thuộc',
    empty: 'Chưa có từ nào đã thuộc. Một từ được tính là đã thuộc sau 4 lần bạn chọn “Nhớ rõ” (chọn “Chưa nhớ” thì tính lại từ đầu).',
  },
  today: {
    label: 'Đã ôn hôm nay',
    query: { reviewedToday: true },
    heading: 'Từ đã ôn hôm nay',
    empty: 'Hôm nay bạn chưa ôn từ nào.',
  },
})

/** History tab: the list shown when no statistic is chosen. */
export const ALL_REVIEWED = Object.freeze({
  query: {},
  heading: 'Từ đã ôn gần đây',
  empty: 'Bạn chưa ôn từ nào. Hãy chọn một chủ đề ở tab “Chủ đề có sẵn” để bắt đầu học.',
})
