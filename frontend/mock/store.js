import { CEFR_LEVELS } from '../src/api/constants.js'
import { addDays, todayInVietnam } from '../src/lib/dates.js'
import { MASTERED_FROM_DAYS } from './scheduler.js'
import { MOCK_TOPICS, MOCK_WORDS } from './vocabularyFixtures.js'

// In-memory data of the mock API, one entry per user id, lost when the dev server restarts. Each user starts with
// the progress described in vocabularyFixtures.js, and some of their learning words due today, so every screen
// (reminder, history, sessions) has something to show.

const users = new Map()

/**
 * Fixture words without the fixture's learningStatus (which only seeds the per-user state). The admin pages
 * (routes/admin.js) add, change, hide (`status: 'HIDDEN'`) and delete entries of this array, so learners see their edits.
 */
export const SYSTEM_WORDS = MOCK_WORDS.map(({ learningStatus: _seed, ...word }) => ({ ...word, status: 'VISIBLE' }))

function seedLearning(today) {
  const learning = new Map()
  MOCK_WORDS.forEach((word, index) => {
    if (word.learningStatus === 'NEW') return
    const mastered = word.learningStatus === 'MASTERED'
    // k, the interval of the last review: 1, 2 or 4 days while learning, 16 or 32 once mastered.
    const intervalDays = mastered ? MASTERED_FROM_DAYS * (1 + (index % 2)) : 2 ** (index % 3)
    // Half of the words being learned are due (today or overdue); mastered words come back in a few weeks.
    const nextReviewAt = mastered
      ? addDays(today, 10 + (index % 18))
      : Math.floor(index / 2) % 2 === 0 // learning words sit on even indexes, so look at every other one
        ? addDays(today, -(index % 3))
        : addDays(today, 1 + (index % 6))
    const lastReviewed = addDays(nextReviewAt, -intervalDays)
    learning.set(word.id, {
      status: mastered ? 'MASTERED' : 'LEARNING',
      intervalDays,
      lastReviewResult: mastered || index % 4 !== 0 ? 'REMEMBERED' : index % 8 === 0 ? 'FORGOT' : 'VAGUE',
      reviewCount: Math.log2(intervalDays) + 1,
      nextReviewAt,
      lastReviewedAt: `${lastReviewed}T0${index % 10}:${String(index % 60).padStart(2, '0')}:00Z`,
      firstLearnedAt: `${addDays(lastReviewed, -7)}T02:00:00Z`,
    })
  })
  return learning
}

/**
 * Everything the mock knows about one user. `reviews` logs every rating ({ vocabularyId, result, reviewedAt }), like
 * the backend's vocabulary_reviews table; the seeded progress has no log.
 * @returns {{ learning: Map<number, object>, reviews: object[], customWords: object[], lists: object[],
 *   gameSessions: object[] }}
 */
export function userState(userId, today) {
  if (!users.has(userId)) {
    users.set(userId, { learning: seedLearning(today), reviews: [], customWords: [], lists: [], gameSessions: [] })
  }
  return users.get(userId)
}

/** Every user seen so far with their state (for the leaderboard). */
export function allUsers() {
  return users
}

/** Topic rows; the admin pages add, change and delete entries. */
export const topics = MOCK_TOPICS.map((topic) => ({ ...topic }))

/**
 * Whether a word may still be studied. Words admins hid (scenario 21, step 8) keep their history, but sessions, reviews,
 * games, searches and personal lists leave them out.
 */
export const notHidden = (word) => word !== undefined && word.status !== 'HIDDEN'

/** Words a user may see: the shared ones and their own (created in personal lists). Hidden words are left out. */
export function visibleWords(user) {
  return [...SYSTEM_WORDS.filter(notHidden), ...user.customWords]
}

/** A word by id, hidden ones included (history and personal lists keep them). */
export function findWord(user, id) {
  return [...SYSTEM_WORDS, ...user.customWords].find((word) => word.id === id)
}

export function learningStatusOf(user, wordId) {
  return user.learning.get(wordId)?.status ?? 'NEW'
}

export const isDue = (state, today) => state !== undefined && state.nextReviewAt <= today

/** Whether the word was last reviewed today in Vietnam time (lastReviewedAt is a UTC instant). */
export const isReviewedToday = (state, today) => todayInVietnam(new Date(state.lastReviewedAt)) === today

/** VocabularyItem of the contract. */
export function toItem(user, word) {
  return { ...word, learningStatus: learningStatusOf(user, word.id) }
}

/** LearningCard of docs/api/learning.md. */
export function toCard(user, word) {
  const state = user.learning.get(word.id)
  return {
    ...toItem(user, word),
    lastReviewResult: state?.lastReviewResult ?? null,
    reviewCount: state?.reviewCount ?? 0,
    nextReviewAt: state?.nextReviewAt ?? null,
    lastReviewedAt: state?.lastReviewedAt ?? null,
  }
}

/** wordCount, learnedCount and dueCount of a set of words for one user. */
export function countsFor(user, words, today) {
  let learnedCount = 0
  let dueCount = 0
  for (const word of words) {
    const state = user.learning.get(word.id)
    if (state) learnedCount += 1
    if (isDue(state, today)) dueCount += 1
  }
  return { wordCount: words.length, learnedCount, dueCount }
}

/**
 * Order of every word list (topics, searches, personal lists, new words of a session): easiest level first, A1 to C2,
 * then alphabetically. See docs/api/vocabulary.md.
 */
export const byLevel = (a, b) =>
  CEFR_LEVELS.indexOf(a.difficultyLevel) - CEFR_LEVELS.indexOf(b.difficultyLevel) ||
  a.word.localeCompare(b.word, 'en', { sensitivity: 'base' }) ||
  a.id - b.id

/** Order of due words by their last rating (scenario 6, step 3): "Chưa nhớ", then "Nhớ mơ hồ", then "Nhớ rõ". */
const RESULT_ORDER = { FORGOT: 0, VAGUE: 1, REMEMBERED: 2 }

/**
 * Cards of a study session (docs/api/learning.md): due words first (by last rating, then the most overdue), then
 * words never studied, easiest first, unless `dueOnly`. Every card unless a `size` is given.
 */
export function sessionCards(user, pool, today, { size, dueOnly }) {
  const due = pool
    .filter((word) => isDue(user.learning.get(word.id), today))
    .sort((a, b) => {
      const stateA = user.learning.get(a.id)
      const stateB = user.learning.get(b.id)
      return (
        RESULT_ORDER[stateA.lastReviewResult] - RESULT_ORDER[stateB.lastReviewResult] ||
        stateA.nextReviewAt.localeCompare(stateB.nextReviewAt) ||
        a.id - b.id
      )
    })
  const fresh = dueOnly ? [] : pool.filter((word) => !user.learning.has(word.id)).sort(byLevel)
  const cards = [...due, ...fresh]
  return (size === undefined ? cards : cards.slice(0, size)).map((word) => toCard(user, word))
}

