import { MOCK_TOPICS, MOCK_WORDS } from './vocabularyFixtures.js'

// Vite dev-server plugin used by `npm run dev:mock`: it answers the read endpoints of docs/api/vocabulary.md with
// sample data until the backend implements them. Every other /api request (login, /users/me...) still goes to the
// real backend through the proxy. It never runs in tests or in the production build.

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
const LATENCY_MS = 250 // makes the loading states visible
const MAX_PAGE_SIZE = 100

const isLearned = (word) => word.learningStatus !== 'NEW'

function topicWithCounts(topic) {
  const words = MOCK_WORDS.filter((word) => word.topicId === topic.id)
  return { ...topic, wordCount: words.length, learnedCount: words.filter(isLearned).length }
}

function send(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

function error(res, status, message) {
  send(res, status, { timestamp: new Date().toISOString(), status, message })
}

function parseNonNegativeInt(value, fallback) {
  if (value === null) return fallback
  return /^\d+$/.test(value) ? Number(value) : NaN
}

function listVocabulary(res, params) {
  const page = parseNonNegativeInt(params.get('page'), 0)
  const size = parseNonNegativeInt(params.get('size'), 20)
  const level = params.get('level')
  if (Number.isNaN(page) || Number.isNaN(size) || size < 1 || size > MAX_PAGE_SIZE) {
    return error(res, 400, 'page and size must be whole numbers, size between 1 and 100')
  }
  if (level && !CEFR_LEVELS.includes(level)) return error(res, 400, 'level must be one of A1..C2')

  const topicId = params.get('topicId')
  const q = (params.get('q') ?? '').trim().toLowerCase()
  const matching = MOCK_WORDS.filter(
    (word) =>
      (!topicId || String(word.topicId) === topicId) &&
      (!level || word.difficultyLevel === level) &&
      (!q || word.word.toLowerCase().includes(q) || word.meaning.toLowerCase().includes(q)),
  ).sort((a, b) => a.word.localeCompare(b.word, 'en', { sensitivity: 'base' }) || a.id - b.id)

  send(res, 200, {
    items: matching.slice(page * size, page * size + size),
    page,
    size,
    totalItems: matching.length,
    totalPages: Math.ceil(matching.length / size),
  })
}

async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost')
  if (!(req.headers.authorization ?? '').startsWith('Bearer ')) {
    return error(res, 401, 'Authentication required')
  }
  await new Promise((resolve) => setTimeout(resolve, LATENCY_MS))

  if (url.pathname === '/api/topics') {
    return send(res, 200, MOCK_TOPICS.map(topicWithCounts))
  }
  const topicMatch = /^\/api\/topics\/(\d+)$/.exec(url.pathname)
  if (topicMatch) {
    const topic = MOCK_TOPICS.find((candidate) => candidate.id === Number(topicMatch[1]))
    return topic ? send(res, 200, topicWithCounts(topic)) : error(res, 404, 'Topic not found')
  }
  return listVocabulary(res, url.searchParams)
}

const HANDLED = /^\/api\/(topics(\/\d+)?|vocabulary)(\?|$)/

export function vocabularyMockApi() {
  return {
    name: 'linguastep-vocabulary-mock',
    apply: 'serve',
    configureServer(server) {
      server.config.logger.info('  Mock API: GET /api/topics, /api/topics/:id, /api/vocabulary use sample data')
      // Middlewares added here run before Vite's own, including the /api proxy.
      server.middlewares.use((req, res, next) => {
        if (req.method !== 'GET' || !HANDLED.test(req.url)) return next()
        handle(req, res).catch(next)
      })
    },
  }
}
