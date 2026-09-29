import { CEFR_LEVELS } from '../src/api/constants.js'
import { addDays, todayInVietnam } from '../src/lib/dates.js'
import { INTERVALS } from './scheduler.js'
import { MOCK_TOPICS, MOCK_WORDS } from './vocabularyFixtures.js'

// In-memory data of the mock API, one entry per user id, lost when the dev server restarts. Each user starts with
// the progress described in vocabularyFixtures.js, and some of their learning words due today, so every screen
// (reminder, history, sessions) has something to show.

const users = new Map()

/**
 * Fixture words without the fixture's learningStatus (which only seeds the per-user state). The admin pages
 * (routes/admin.js) add, change, archive (`archivedAt`) and delete entries of this array, so learners see their edits.
 */
export const SYSTEM_WORDS = MOCK_WORDS.map(({ learningStatus: _seed, ...word }) => ({ ...word, archivedAt: null }))

function seedLearning(today) {
  const learning = new Map()
  MOCK_WORDS.forEach((word, index) => {
    if (word.learningStatus === 'NEW') return
    const mastered = word.learningStatus === 'MASTERED'
    const step = mastered ? INTERVALS.length - 1 : index % 3
    // Half of the words being learned are due (today or overdue); mastered words come back in a few weeks.
    const nextReviewAt = mastered
      ? addDays(today, 10 + (index % 18))
      : Math.floor(index / 2) % 2 === 0 // learning words sit on even indexes, so look at every other one
        ? addDays(today, -(index % 3))
        : addDays(today, 1 + (index % 6))
    const lastReviewed = addDays(nextReviewAt, -INTERVALS[step])
    learning.set(word.id, {
      status: mastered ? 'MASTERED' : 'LEARNING',
      step,
      lastReviewResult: mastered || index % 4 !== 0 ? 'REMEMBERED' : 'VAGUE',
      reviewCount: step + 1,
      nextReviewAt,
      lastReviewedAt: `${lastReviewed}T0${index % 10}:${String(index % 60).padStart(2, '0')}:00Z`,
      firstLearnedAt: `${addDays(lastReviewed, -7)}T02:00:00Z`,
    })
  })
  return learning
}

/**
 * Everything the mock knows about one user.
 * @returns {{ learning: Map<number, object>, customWords: object[], lists: object[], gameSessions: object[] }}
 */
export function userState(userId, today) {
  if (!users.has(userId)) {
    users.set(userId, { learning: seedLearning(today), customWords: [], lists: [], gameSessions: [] })
  }
  return users.get(userId)
}

/** Every user seen so far with their state (for the leaderboard). */
export function allUsers() {
  return users
}

/**
 * Words that have game questions. Like the backend's seed migration, only the words that exist at start-up get
 * them; a word the admin adds joins the games after "Đồng bộ câu hỏi" on the admin games page.
 */
export const gameBankWordIds = new Set(SYSTEM_WORDS.map((word) => word.id))

/** System words the games draw from: in the question bank and not archived. */
export function gameWords() {
  return SYSTEM_WORDS.filter((word) => !word.archivedAt && gameBankWordIds.has(word.id))
}

/** Topic rows; the admin pages add, change and delete entries. */
export const topics = MOCK_TOPICS.map((topic) => ({ ...topic }))

/** Words a user may see: the shared ones and their own (created in personal lists). Archived words are left out. */
export function visibleWords(user) {
  return [...SYSTEM_WORDS.filter((word) => !word.archivedAt), ...user.customWords]
}

/** A word by id, archived ones included (history and personal lists keep them). */
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

/**
 * Cards of a study session (docs/api/learning.md): due words first (VAGUE ones first, then the most overdue), then
 * words never studied, easiest first, unless `dueOnly`.
 */
export function sessionCards(user, pool, today, { size, dueOnly }) {
  const due = pool
    .filter((word) => isDue(user.learning.get(word.id), today))
    .sort((a, b) => {
      const stateA = user.learning.get(a.id)
      const stateB = user.learning.get(b.id)
      const vague = (stateB.lastReviewResult === 'VAGUE') - (stateA.lastReviewResult === 'VAGUE')
      return vague || stateA.nextReviewAt.localeCompare(stateB.nextReviewAt) || a.id - b.id
    })
  const fresh = dueOnly ? [] : pool.filter((word) => !user.learning.has(word.id)).sort(byLevel)
  return [...due, ...fresh].slice(0, size).map((word) => toCard(user, word))
}

