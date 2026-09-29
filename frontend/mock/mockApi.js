import { todayInVietnam } from '../src/lib/dates.js'
import { delay, HttpError, readJson, readRaw, send, sendError, userIdFromToken } from './http.js'
import { serveMedia } from './media.js'
import { scenarioEffect, scenarioOf, serveControlPanel } from './scenario.js'
import { chatRoutes } from './routes/chat.js'
import { exerciseRoutes } from './routes/exercises.js'
import { gameRoutes } from './routes/games.js'
import { learningRoutes } from './routes/learning.js'
import { findList, listRoutes } from './routes/lists.js'
import { planRoutes } from './routes/plan.js'
import { progressRoutes } from './routes/progress.js'
import { vocabularyRoutes } from './routes/vocabulary.js'
import { userState } from './store.js'

// Vite dev-server plugin used by `npm run dev:mock`: it answers the endpoints documented in docs/api/ with sample data
// (modules A and B, which the backend now has too, with more sample content here and the /__mock scenarios; module D,
// the progress home page, which it does not have yet),
// and serves the generated listening audio (media.js). Every other /api request (login, /users/me...) still goes to
// the real backend through the proxy. It never runs in tests or in the production build.

const LATENCY_MS = 250 // makes the loading states visible

const ROUTES = [
  ...vocabularyRoutes,
  ...learningRoutes({ findList }),
  ...listRoutes,
  ...gameRoutes,
  ...exerciseRoutes,
  ...chatRoutes,
  ...progressRoutes,
  ...planRoutes,
]

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

  // Scenario chosen on the /__mock page (module B only): extra latency, or an error/empty reply instead.
  const effect = scenarioEffect(scenarioOf(req), req.method, url.pathname, url.searchParams)
  if (effect.extraDelayMs) await delay(effect.extraDelayMs)
  if (effect.reply) {
    if (effect.reply.message) return sendError(res, effect.reply.status, effect.reply.message)
    return send(res, effect.reply.status, effect.reply.body)
  }

  const today = todayInVietnam()
  try {
    let body = {}
    if (req.method !== 'GET' && req.method !== 'DELETE') body = route.rawBody ? await readRaw(req) : await readJson(req)
    const result = await route.handle({
      user: userState(userId, today),
      userId,
      today,
      match,
      searchParams: url.searchParams,
      body,
    })
    const status = typeof route.status === 'function' ? route.status(result) : (route.status ?? (result === undefined ? 204 : 200))
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
      server.config.logger.info('  Mock API: module A and B endpoints of docs/api/*.md use sample data')
      server.config.logger.info('  Mock control page (scenarios, test checklist): http://localhost:5173/__mock')
      // Middlewares added here run before Vite's own, including the /api proxy.
      server.middlewares.use((req, res, next) => {
        if (serveControlPanel(req, res) || serveMedia(req, res)) return
        const url = new URL(req.url, 'http://localhost')
        const found = findRoute(req.method, url.pathname)
        if (!found) return next()
        // A request the browser gave up on (a reload while it was sent) has nobody left to answer: drop it instead of
        // showing Vite's error overlay on the next page.
        handle(req, res, found.route, found.match, url).catch((error) => (req.destroyed ? undefined : next(error)))
      })
    },
  }
}
