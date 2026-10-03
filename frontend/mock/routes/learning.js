import { addDays } from '../../src/lib/dates.js'
import { HttpError, paginate } from '../http.js'
import { applyReview } from '../scheduler.js'
import { findWord, isDue, isReviewedToday, sessionCards, toCard, topics, visibleWords } from '../store.js'

// docs/api/learning.md

const RESULTS = ['FORGOT', 'VAGUE', 'REMEMBERED']
const HISTORY_STATUSES = ['LEARNING', 'MASTERED']
/** Words named in the "due tomorrow" line of the session summary; the count covers them all. */
const DUE_TOMORROW_WORDS = 20

/** Every card when no size is sent (scenarios 5 and 6 have no limit); otherwise 1 to 500 cards. */
function parseSize(searchParams) {
  const raw = searchParams.get('size')
  if (raw === null) return undefined
  const size = Number(raw)
  if (!Number.isInteger(size) || size < 1 || size > 500) throw new HttpError(400, 'size must be between 1 and 500')
  return size
}

function parseSince(searchParams) {
  const raw = searchParams.get('since')
  const since = raw === null ? Number.NaN : Date.parse(raw)
  if (Number.isNaN(since)) throw new HttpError(400, 'since must be an ISO date-time')
  return since
}

/**
 * The words a session draws from and how it describes its source. Personal lists are resolved by `findList`, which
 * the lists routes provide (see mockApi.js); until then a listId is simply unknown.
 */
function sessionSource(user, searchParams, findList) {
  const topicId = searchParams.get('topicId')
  const listId = searchParams.get('listId')
  if (topicId && listId) throw new HttpError(400, 'Send topicId or listId, not both')

  if (topicId) {
    const topic = topics.find((candidate) => String(candidate.id) === topicId)
    if (!topic) throw new HttpError(404, 'Topic not found')
    return {
      source: { type: 'TOPIC', id: topic.id, name: topic.name },
      pool: visibleWords(user).filter((word) => word.topicId === topic.id),
    }
  }
  if (listId) {
    const list = findList?.(user, Number(listId))
    if (!list) throw new HttpError(404, 'List not found')
    return {
      source: { type: 'LIST', id: list.id, name: list.name },
      pool: list.wordIds.map((id) => findWord(user, id)).filter(Boolean),
    }
  }
  return { source: { type: 'DUE', id: null, name: null }, pool: visibleWords(user), dueOnly: true }
}

export function learningRoutes({ findList } = {}) {
  return [
    {
      method: 'GET',
      pattern: /^\/api\/learning\/session$/,
      handle: ({ user, today, searchParams }) => {
        const size = parseSize(searchParams)
        const { source, pool, dueOnly = false } = sessionSource(user, searchParams, findList)
        return { source, startedAt: new Date().toISOString(), cards: sessionCards(user, pool, today, { size, dueOnly }) }
      },
    },
    {
      method: 'POST',
      pattern: /^\/api\/learning\/reviews$/,
      handle: ({ user, today, body }) => {
        if (!RESULTS.includes(body.result)) throw new HttpError(400, 'result must be FORGOT, VAGUE or REMEMBERED')
        const word = findWord(user, body.vocabularyId)
        if (!word) throw new HttpError(404, 'Vocabulary not found')

        const next = applyReview(user.learning.get(word.id), body.result, today)
        user.learning.set(word.id, next)
        user.reviews.push({ vocabularyId: word.id, result: body.result, reviewedAt: next.lastReviewedAt })
        return {
          vocabularyId: word.id,
          learningStatus: next.status,
          lastReviewResult: next.lastReviewResult,
          reviewCount: next.reviewCount,
          intervalDays: next.intervalDays,
          nextReviewAt: next.nextReviewAt,
        }
      },
    },
    {
      // Scenario 5 step 14 and scenario 6 step 5: the ratings since the session started and the words due by tomorrow.
      method: 'GET',
      pattern: /^\/api\/learning\/session-summary$/,
      handle: ({ user, today, searchParams }) => {
        const since = parseSince(searchParams)
        const results = Object.fromEntries(RESULTS.map((result) => [result, 0]))
        user.reviews
          .filter((review) => Date.parse(review.reviewedAt) >= since)
          .forEach((review) => {
            results[review.result] += 1
          })

        const tomorrow = addDays(today, 1)
        const due = [...user.learning.entries()]
          .filter(([, state]) => state.nextReviewAt <= tomorrow)
          .map(([id, state]) => ({ word: findWord(user, id)?.word, nextReviewAt: state.nextReviewAt }))
          .filter((entry) => entry.word !== undefined)
          .sort((a, b) => a.nextReviewAt.localeCompare(b.nextReviewAt) || a.word.localeCompare(b.word, 'en'))
        return {
          since: new Date(since).toISOString(),
          reviewedCount: Object.values(results).reduce((sum, count) => sum + count, 0),
          results,
          dueTomorrow: {
            date: tomorrow,
            count: due.length,
            words: due.slice(0, DUE_TOMORROW_WORDS).map((entry) => entry.word),
          },
        }
      },
    },
    {
      method: 'GET',
      pattern: /^\/api\/learning\/summary$/,
      handle: ({ user, today }) => {
        const states = [...user.learning.values()]
        return {
          dueToday: states.filter((state) => isDue(state, today)).length,
          learningCount: states.filter((state) => state.status === 'LEARNING').length,
          masteredCount: states.filter((state) => state.status === 'MASTERED').length,
          reviewedToday: states.filter((state) => isReviewedToday(state, today)).length,
          upcoming: Array.from({ length: 7 }, (_, index) => {
            const date = addDays(today, index + 1)
            return { date, count: states.filter((state) => state.nextReviewAt === date).length }
          }),
        }
      },
    },
    {
      method: 'GET',
      pattern: /^\/api\/learning\/history$/,
      handle: ({ user, today, searchParams }) => {
        const status = searchParams.get('status')
        if (status !== null && !HISTORY_STATUSES.includes(status)) {
          throw new HttpError(400, 'status must be LEARNING or MASTERED')
        }
        const reviewedToday = searchParams.get('reviewedToday')
        if (reviewedToday !== null && reviewedToday !== 'true' && reviewedToday !== 'false') {
          throw new HttpError(400, 'reviewedToday must be true or false')
        }

        const reviewed = [...user.learning.entries()]
          .filter(
            ([, state]) =>
              (status === null || state.status === status) &&
              (reviewedToday !== 'true' || isReviewedToday(state, today)),
          )
          .sort(([, a], [, b]) => b.lastReviewedAt.localeCompare(a.lastReviewedAt))
          .map(([id]) => findWord(user, id))
          .filter(Boolean)
          .map((word) => toCard(user, word))
        return paginate(reviewed, searchParams)
      },
    },
  ]
}
