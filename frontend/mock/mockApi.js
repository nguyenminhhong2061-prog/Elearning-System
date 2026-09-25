import { todayInVietnam } from '../src/lib/dates.js'
import { delay, HttpError, readJson, send, sendError, userIdFromToken } from './http.js'
import { gameRoutes } from './routes/games.js'
import { learningRoutes } from './routes/learning.js'
import { findList, listRoutes } from './routes/lists.js'
import { vocabularyRoutes } from './routes/vocabulary.js'
import { userState } from './store.js'

// Vite dev-server plugin used by `npm run dev:mock`: it answers the module A endpoints documented in docs/api/ with
// sample data until the backend implements them. Every other /api request (login, /users/me...) still goes to the
// real backend through the proxy. It never runs in tests or in the production build.

const LATENCY_MS = 250 // makes the loading states visible

const ROUTES = [...vocabularyRoutes, ...learningRoutes({ findList }), ...listRoutes, ...gameRoutes]

function findRoute(method, pathname) {
  for (const route of ROUTES) {
    if (route.method !== method) continue
    const match = route.pattern.exec(pathname)
    if (match) return { route, match }
  }
  return null
}

async function handle(req, res, route, match, url) {
  const userId = userIdFromToken(req.headers.authorization)
  if (!userId) return sendError(res, 401, 'Authentication required')
  await delay(LATENCY_MS)

  const today = todayInVietnam()
  try {
    const body = req.method === 'GET' || req.method === 'DELETE' ? {} : await readJson(req)
    const result = await route.handle({
      user: userState(userId, today),
      userId,
      today,
      match,
      searchParams: url.searchParams,
      body,
    })
    const status = route.status ?? (result === undefined ? 204 : 200)
    send(res, status, result)
  } catch (error) {
    if (error instanceof HttpError) return sendError(res, error.status, error.message)
    throw error
  }
}

export function mockApi() {
  return {
    name: 'linguastep-mock-api',
    apply: 'serve',
    configureServer(server) {
      server.config.logger.info('  Mock API: module A endpoints of docs/api/*.md use sample data')
      // Middlewares added here run before Vite's own, including the /api proxy.
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url, 'http://localhost')
        const found = findRoute(req.method, url.pathname)
        if (!found) return next()
        handle(req, res, found.route, found.match, url).catch(next)
      })
    },
  }
}
