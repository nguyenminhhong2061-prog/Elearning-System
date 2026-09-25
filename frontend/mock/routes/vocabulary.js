import { HttpError, paginate } from '../http.js'
import { byWord, countsFor, topics, toItem, visibleWords } from '../store.js'

// docs/api/vocabulary.md

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

function topicWithCounts(user, topic, today) {
  const words = visibleWords(user).filter((word) => word.topicId === topic.id)
  return { ...topic, ...countsFor(user, words, today) }
}

export const vocabularyRoutes = [
  {
    method: 'GET',
    pattern: /^\/api\/topics$/,
    handle: ({ user, today }) => topics.map((topic) => topicWithCounts(user, topic, today)),
  },
  {
    method: 'GET',
    pattern: /^\/api\/topics\/(\d+)$/,
    handle: ({ user, today, match }) => {
      const topic = topics.find((candidate) => candidate.id === Number(match[1]))
      if (!topic) throw new HttpError(404, 'Topic not found')
      return topicWithCounts(user, topic, today)
    },
  },
  {
    method: 'GET',
    pattern: /^\/api\/vocabulary$/,
    handle: ({ user, searchParams }) => {
      const level = searchParams.get('level')
      if (level && !CEFR_LEVELS.includes(level)) throw new HttpError(400, 'level must be one of A1..C2')
      const topicId = searchParams.get('topicId')
      const q = (searchParams.get('q') ?? '').trim().toLowerCase()

      const matching = visibleWords(user)
        .filter(
          (word) =>
            (!topicId || String(word.topicId) === topicId) &&
            (!level || word.difficultyLevel === level) &&
            (!q || word.word.toLowerCase().includes(q) || word.meaning.toLowerCase().includes(q)),
        )
        .sort(byWord)
        .map((word) => toItem(user, word))
      return paginate(matching, searchParams)
    },
  },
]
