// Small HTTP helpers for the mock API (plain Node request/response objects, as Vite's dev server provides).

export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export function send(res, status, body) {
  res.statusCode = status
  if (body === undefined) {
    res.end()
    return
  }
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

export function sendError(res, status, message) {
  send(res, status, { timestamp: new Date().toISOString(), status, message })
}

export async function readJson(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  if (chunks.length === 0) return {}
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw new HttpError(400, 'Request body is not valid JSON')
  }
}

/** The signed-in user's id, read from the JWT the real backend issued (the mock does not check the signature). */
export function userIdFromToken(authorization) {
  const token = /^Bearer (.+)$/.exec(authorization ?? '')?.[1]
  if (!token) return null
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'))
    return payload.sub ?? null
  } catch {
    return null
  }
}

function parseCount(value, fallback) {
  if (value === null) return fallback
  if (!/^\d+$/.test(value)) throw new HttpError(400, 'page and size must be whole numbers')
  return Number(value)
}

/** PageResponse of docs/api/vocabulary.md; `page` and `size` come from the query string. */
export function paginate(items, searchParams, { defaultSize = 20, maxSize = 100 } = {}) {
  const page = parseCount(searchParams.get('page'), 0)
  const size = parseCount(searchParams.get('size'), defaultSize)
  if (size < 1 || size > maxSize) throw new HttpError(400, `size must be between 1 and ${maxSize}`)
  return {
    items: items.slice(page * size, page * size + size),
    page,
    size,
    totalItems: items.length,
    totalPages: Math.ceil(items.length / size),
  }
}

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
